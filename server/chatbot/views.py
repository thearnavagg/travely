import json
import re
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)
client = OpenAI(api_key=settings.OPENAI_API_KEY)

previous_suggestions = {}

def extract_json(text):
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON: {str(e)}")
            return None
    return None

@csrf_exempt
def get_location_suggestions(request):
    global previous_suggestions

    if request.method == "POST":
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

            # Step 1: Ask GPT to classify the user query (description vs. travel suggestion)
            classification_prompt = (
                f"Determine if this message is asking for a description or travel suggestions: '{user_message}'. "
                "Respond with valid JSON in the following format: {'intent': 'description'} or {'intent': 'itinerary'}."
            )

            classification_response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant."
                    },
                    {
                        "role": "user",
                        "content": classification_prompt
                    }
                ]
            )

            # Extract and log classification
            classification = extract_json(classification_response.choices[0].message.content.strip())
            if not classification or 'intent' not in classification:
                logger.error("Failed to classify user intent.")
                return JsonResponse({"error": "Unable to classify user query."}, status=500)

            intent = classification['intent']
            logger.info(f"User query classified as: {intent}")

            
            if intent == "description":
                prompt_content = (
                    f"Provide a detailed description of {user_message} about it in short as JSON with this exact structure: "
                    "{'text': 'your description here'}. "
                    "No extra text."
                )
            elif intent == "itinerary":
                prompt_content = (
    f"Return travel locations for {user_message} as JSON with this exact structure: "
    "{'text':"" ,'suggestions': {'days': [{'day': number, 'locations': [{'name': string, 'lat': number, 'lng': number, 'time': string}]}]}}. "
    "No extra text."
)



            else:
                return JsonResponse({"error": "Invalid intent classified."}, status=500)

            # Step 3: Request the GPT completion based on the adjusted prompt
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful travel assistant."
                    },
                    {
                        "role": "user",
                        "content": prompt_content
                    }
                ]
            )

            # Extract and process the response
            gpt_response = completion.choices[0].message.content.strip()
            logger.info(f"GPT Full Response: {gpt_response}")

            json_data = extract_json(gpt_response)
            if not json_data:
                logger.error("No valid JSON found in GPT response.")
                return JsonResponse({"error": "No valid suggestions received from GPT."}, status=500)

            previous_suggestions = json_data

            return JsonResponse(json_data)

        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            return JsonResponse({"error": "Invalid JSON format in request."}, status=400)
        except Exception as e:
            logger.error(f"Error occurred: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)
