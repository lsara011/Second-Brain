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

    history = payload.get("history", [])
    if not isinstance(history, list) or len(history) > 20:
        return JsonResponse({"error": "History must contain at most 20 messages."}, status=400)

    conversation_input = []
    for item in history:
        if not isinstance(item, dict):
            return JsonResponse({"error": "History contains an invalid message."}, status=400)
        role = item.get("role")
        content = item.get("content")
        if role not in {"user", "assistant"} or not isinstance(content, str):
            return JsonResponse({"error": "History contains an invalid message."}, status=400)
        content = content.strip()
        if not content or len(content) > 10000:
            return JsonResponse({"error": "A history message is invalid."}, status=400)
        conversation_input.append({"role": role, "content": content})

    conversation_input.append({
        "role": "user",
        "content": f"Course selected by the student: {course}\nStudent question: {message}",
    })

    try:
        response = OpenAI().responses.create(
            model="gpt-5.6-luna",
            reasoning={"effort": "none"},
            instructions=(
                "You are Atlas, a study companion. Help the student understand "
                "their work with concise explanations, hints, and questions. "
                "Do not complete graded assignments or exams for them. "
                "Use clear Markdown when structure helps. Put all code in fenced "
                "Markdown code blocks and include the programming language after "
                "the opening fence when it is known."
            ),
            input=conversation_input,
            max_output_tokens=500,
        )
    except OpenAIError:
        return JsonResponse(
            {"error": "The AI service is temporarily unavailable."}, status=502
        )

    return JsonResponse({"response": response.output_text})
