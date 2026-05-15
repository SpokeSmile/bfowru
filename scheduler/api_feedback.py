from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from .api_utils import parse_body
from .models import FeedbackEntry

MAX_MESSAGE_LENGTH = 2000
MAX_PAGE_URL_LENGTH = 500
MAX_USER_AGENT_LENGTH = 500
VALID_FEEDBACK_TYPES = {choice[0] for choice in FeedbackEntry.TYPE_CHOICES}


@require_POST
@login_required
def feedback_create(request):
    payload = parse_body(request)
    if payload is None:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    feedback_type = (payload.get('type') or '').strip()
    message = (payload.get('message') or '').strip()
    page_url = (payload.get('pageUrl') or '').strip()

    errors = {}
    if feedback_type not in VALID_FEEDBACK_TYPES:
        errors['type'] = ['Choose a valid feedback type.']
    if not message:
        errors['message'] = ['Message is required.']
    elif len(message) > MAX_MESSAGE_LENGTH:
        errors['message'] = [f'Message must be {MAX_MESSAGE_LENGTH} characters or fewer.']
    if len(page_url) > MAX_PAGE_URL_LENGTH:
        errors['pageUrl'] = [f'Page URL must be {MAX_PAGE_URL_LENGTH} characters or fewer.']

    if errors:
        return JsonResponse({'errors': errors}, status=400)

    feedback = FeedbackEntry.objects.create(
        user=request.user,
        type=feedback_type,
        message=message,
        page_url=page_url,
        user_agent=(request.META.get('HTTP_USER_AGENT') or '')[:MAX_USER_AGENT_LENGTH],
    )
    return JsonResponse({
        'ok': True,
        'feedback': {
            'id': feedback.id,
            'status': feedback.status,
        },
    }, status=201)
