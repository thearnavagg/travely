import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from openai import OpenAI  # Make sure to import the OpenAI client
import logging

# Set up logging
logger = logging.getLogger(__name__)
client = OpenAI(api_key=settings.OPENAI_API_KEY)

@csrf_exempt 
def get_location_suggestions(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_message = data.get('message', '')

            if not user_message:
                return JsonResponse({"error": "No message provided"}, status=400)

            logger.info(f"User message: {user_message}")  # Log the user message

            # Create a chat completion request using the new client
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",  # or "gpt-4" if you have access
                messages=[
                    {"role": "system", "content": "You are a helpful travel assistant."},
                    {"role": "user", "content": f"Suggest travel locations for: {user_message}. Provide the result as a JSON object. Each day should contain a 'day' key and a 'locations' key. Each location should have 'name', 'lat', 'lng', and 'time' keys."}
                ]
            )

            # Correctly access the response content
            gpt_response = completion.choices[0].message.content  # Updated line
            suggestions = json.loads(gpt_response)  # Parse the response
            
            return JsonResponse({"text": "Here are the travel suggestions:", "suggestions": suggestions})

        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")  # Log JSON errors
            return JsonResponse({"error": "Invalid JSON format."}, status=400)
        except Exception as e:
            logger.error(f"Error occurred: {str(e)}")  # Log any other errors
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)
