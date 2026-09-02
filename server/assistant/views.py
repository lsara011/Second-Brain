import json

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from openai import OpenAI, OpenAIError


@csrf_exempt
@require_POST
def respond(request):
    """Local-development endpoint for the Atlas AI companion."""
    if not settings.DEBUG:
        return JsonResponse({"error": "Not found."}, status=404)

    try:
        payload = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Send a valid JSON body."}, status=400)

    message = payload.get("message", "")
    if not isinstance(message, str) or not message.strip():
        return JsonResponse({"error": "Message is required."}, status=400)

    message = message.strip()
    if len(message) > 2000:
        return JsonResponse({"error": "Message must be 2,000 characters or fewer."}, status=400)

    course = payload.get("course", "")
    if not isinstance(course, str) or not course.strip():
        return JsonResponse({"error": "Course is required."}, status=400)

    course = course.strip()
    if len(course) > 200:
        return JsonResponse({"error": "Course must be 200 characters or fewer."}, status=400)

    try:
        response = OpenAI().responses.create(
            model="gpt-5.6-luna",
            reasoning={"effort": "none"},
            instructions=(
                "You are Atlas, a study companion. Help the student understand "
                "their work with concise explanations, hints, and questions. "
                "Do not complete graded assignments or exams for them."
            ),
            input=f"Course selected by the student: {course}\nStudent question: {message}",
            max_output_tokens=500,
        )
    except OpenAIError:
        return JsonResponse(
            {"error": "The AI service is temporarily unavailable."}, status=502
        )

    return JsonResponse({"response": response.output_text})
