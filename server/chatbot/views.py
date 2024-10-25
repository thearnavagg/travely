from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from openai import OpenAI
import logging
import json

logger = logging.getLogger(__name__)
client = OpenAI(api_key=settings.OPENAI_API_KEY)

class Location(BaseModel):
    name: str
    lat: float
    lng: float
    time: str

class Day(BaseModel):
    day: int
    locations: List[Location]

class Suggestions(BaseModel):
    days: List[Day]

class ItineraryResponse(BaseModel):
    text: str
    suggestions: Suggestions

class DescriptionResponse(BaseModel):
    text: str

class IntentClassification(BaseModel):
    intent: Literal["description", "itinerary", "modify_itinerary"]

previous_itinerary = None

@csrf_exempt
def get_location_suggestions(request):
    global previous_itinerary

    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        logger.info(f"Raw request body: {request.body}")

        if not request.body:
            logger.error("Request body is empty")
            return JsonResponse({"error": "Empty request body"}, status=400)

        data = json.loads(request.body)
        user_message = data.get('message', '')
        
        if not user_message:
            return JsonResponse({"error": "No message provided"}, status=400)

        logger.info(f"User message: {user_message}")

        classification_completion = client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {
                    "role": "system",
                    "content": """You are a helpful assistant that classifies user travel queries.
                    Analyze the user's message carefully:
                    - If they are asking to change, modify, update, or revise an existing itinerary, classify as "modify_itinerary"
                    - If they are asking for general information about a place, classify as "description"
                    - If they are asking for a new travel plan or itinerary, classify as "itinerary"
                    
                    Examples of modification requests:
                    - "Change day 2 to include the museum"
                    - "Replace the park with the beach"
                    - "Can we visit the temple instead of the market?"
                    - "Update the schedule to start later"
                    """
                },
                {
                    "role": "user",
                    "content": f"Classify this travel query: '{user_message}'"
                }
            ],
            response_format=IntentClassification
        )

        parsed_response = classification_completion.choices[0].message.parsed
        intent = parsed_response.intent
        logger.info(f"User query classified as: {intent}")

        if intent == "description":
            completion = client.beta.chat.completions.parse(
                model="gpt-4o-2024-08-06",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a travel assistant who provides short, punchy, and exciting descriptions of locations. Each description should be no more than 2-3 sentences, vivid, appealing, and include atleast three emoji. Deliver the content in text format without markdown."""
                    },
                    {
                        "role": "user",
                        "content": f"Please describe {user_message}"
                    }
                ],
                response_format=DescriptionResponse
            )
            response_data = completion.choices[0].message.parsed
            
        elif intent == "modify_itinerary":
            if not previous_itinerary:
                return JsonResponse({
                    "error": "No previous itinerary found. Please create an initial itinerary first."
                }, status=400)
                
            completion = client.beta.chat.completions.parse(
                model="gpt-4o-2024-08-06",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a helpful travel assistant modifying existing itineraries.
                        Review the existing itinerary and user's modification request carefully.
                        Make the requested changes while maintaining the same structure and format.
                        Ensure all locations have proper coordinates and visit times.
                        If replacing a location, try to maintain similar timing and logical flow."""
                    },
                    {
                        "role": "user",
                        "content": f"""Current itinerary:
                        {json.dumps(previous_itinerary)}
                        
                        Modification request: {user_message}
                        
                        Please provide the modified itinerary while maintaining all required fields (name, lat, lng, time) for each location."""
                    }
                ],
                response_format=ItineraryResponse
            )
            response_data = completion.choices[0].message.parsed
            
        else:
            completion = client.beta.chat.completions.parse(
                model="gpt-4o-2024-08-06",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a helpful travel assistant creating itineraries.
                        For each suggestion:
                        - Include specific location names
                        - Provide accurate coordinates
                        - Suggest appropriate visit times
                        - Organize by days"""
                    },
                    {
                        "role": "user",
                        "content": f"Create a day-by-day travel itinerary for {user_message}"
                    }
                ],
                response_format=ItineraryResponse
            )
            response_data = completion.choices[0].message.parsed

        # Store the response if it's an itinerary
        if isinstance(response_data, ItineraryResponse):
            previous_itinerary = response_data.model_dump()
        
        return JsonResponse(response_data.model_dump())

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return JsonResponse({"error": "Invalid JSON format in request."}, status=400)
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return JsonResponse({"error": f"Invalid data format: {str(e)}"}, status=400)
    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)