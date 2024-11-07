from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import openai
import logging
import json

# Initialize OpenAI API
openai.api_key = settings.OPENAI_API_KEY

logger = logging.getLogger(__name__)

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

        # Classify the user's query
        classification_completion = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": """You are a helpful assistant that classifies user travel queries. Classify the user's message into one of three categories:
- Modify itinerary: User wants to change an existing itinerary.
- Description: User wants general information about a location.
- Itinerary: User wants to create a new itinerary."""},
                {"role": "user", "content": f"Classify this travel query: '{user_message}'"}
            ]
        )
        
        intent = classification_completion.choices[0].message['content'].strip().lower()
        logger.info(f"User query classified as: {intent}")

        # Generate appropriate responses based on the intent
        if intent == "description":
            description_completion = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": """You are a travel assistant who provides short, punchy, and exciting descriptions of locations. Each description should be no more than 2-3 sentences, vivid, appealing, and include at least three emoji."""},
                    {"role": "user", "content": f"Please describe {user_message}"}
                ]
            )
            response_data = description_completion.choices[0].message['content']

        elif intent == "modify_itinerary":
            if not previous_itinerary:
                return JsonResponse({
                    "error": "No previous itinerary found. Please create an initial itinerary first."
                }, status=400)

            # Parse the existing itinerary to ensure it's updated with the modification request
            modify_itinerary_completion = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": """You are a helpful assistant modifying existing itineraries. Review the existing itinerary and user's modification request carefully. Make the requested changes while maintaining the same structure and format."""},
                    {"role": "user", "content": f"""Current itinerary: {json.dumps(previous_itinerary)} Modification request: {user_message}"""}
                ]
            )
            modified_itinerary = modify_itinerary_completion.choices[0].message['content']
            
            # Store the modified itinerary back to previous_itinerary
            previous_itinerary = json.loads(modified_itinerary)

            response_data = {"modified_itinerary": modified_itinerary}

        else:  # Default case: Create itinerary
            itinerary_creation_completion = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": """You are a helpful assistant creating itineraries. For each suggestion, include specific location names, accurate coordinates, and appropriate visit times."""},
                    {"role": "user", "content": f"Create a day-by-day travel itinerary for {user_message}"}
                ]
            )
            response_data = itinerary_creation_completion.choices[0].message['content']

            previous_itinerary = json.loads(response_data)

        return JsonResponse({"response": response_data})

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return JsonResponse({"error": "Invalid JSON format in request."}, status=400)
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return JsonResponse({"error": f"Invalid data format: {str(e)}"}, status=400)
    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)