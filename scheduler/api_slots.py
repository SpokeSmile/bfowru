from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods, require_POST

from .api_serializers import serialize_slot
from .api_utils import form_errors_payload, parse_body
from .forms import ScheduleSlotForm
from .models import DayEventType, ScheduleSlot
from .profile_lookup import get_current_player
from .roster import get_current_week_start, is_week_editable, parse_week_start, week_range_label


def form_data_from_payload(payload):
    return {
        'slot_type': payload.get('slotType') or ScheduleSlot.AVAILABLE,
        'day_of_week': payload.get('dayOfWeek'),
        'start_time_minutes': payload.get('startTimeMinutes'),
        'end_time_minutes': payload.get('endTimeMinutes'),
        'note': payload.get('note') or '',
    }


def week_start_from_payload(payload):
    raw_week_start = payload.get('weekStart')
    if not raw_week_start:
        return get_current_week_start()
    return parse_week_start(raw_week_start)


def readonly_week_response():
    return JsonResponse({'error': 'Прошлые недели доступны только для просмотра.'}, status=403)


def required_week_start_from_payload(payload, key):
    raw_week_start = payload.get(key)
    if not raw_week_start:
        raise ValueError
    selected_week_start = parse_week_start(raw_week_start)
    if selected_week_start is None:
        raise ValueError
    return selected_week_start


def day_event_map_for_slot(slot):
    return {
        slot.day_of_week: DayEventType.objects.filter(
            week_start=slot.week_start,
            day_of_week=slot.day_of_week,
        ).first(),
    }


def validation_errors_payload(error):
    if hasattr(error, 'message_dict'):
        return {
            field: [str(message) for message in messages]
            for field, messages in error.message_dict.items()
        }
    return {'__all__': [str(message) for message in error.messages]}


def parse_day_of_week(payload):
    try:
        day_of_week = int(payload.get('dayOfWeek'))
    except (TypeError, ValueError):
        raise ValueError

    valid_days = {value for value, _label in ScheduleSlot.DAY_CHOICES}
    if day_of_week not in valid_days:
        raise ValueError
    return day_of_week


def build_day_replacement_slots(payload, current_player, selected_week_start, day_of_week):
    if payload.get('clear'):
        return []

    slot_type = payload.get('slotType') or ScheduleSlot.AVAILABLE
    note = payload.get('note') or ''

    if slot_type not in {value for value, _label in ScheduleSlot.SLOT_TYPE_CHOICES}:
        raise ValidationError({'slot_type': 'Некорректный тип записи.'})

    if slot_type in {ScheduleSlot.UNAVAILABLE, ScheduleSlot.FULL_DAY_AVAILABLE, ScheduleSlot.TENTATIVE}:
        slot = ScheduleSlot(
            player=current_player,
            week_start=selected_week_start,
            slot_type=slot_type,
            day_of_week=day_of_week,
            note=note,
        )
        slot.full_clean()
        return [slot]

    raw_time_slots = payload.get('timeSlots')
    if not isinstance(raw_time_slots, list) or not raw_time_slots:
        raise ValidationError({'time_slots': 'Добавьте хотя бы один диапазон времени.'})

    slots = []
    for index, time_slot in enumerate(raw_time_slots):
        if not isinstance(time_slot, dict):
            raise ValidationError({'time_slots': f'Некорректный диапазон времени #{index + 1}.'})
        slot = ScheduleSlot(
            player=current_player,
            week_start=selected_week_start,
            slot_type=ScheduleSlot.AVAILABLE,
            day_of_week=day_of_week,
            start_time_minutes=time_slot.get('startTimeMinutes'),
            end_time_minutes=time_slot.get('endTimeMinutes'),
            note=note,
        )
        slot.full_clean()
        slots.append(slot)
    return slots


@require_POST
@login_required
def slot_create(request):
    current_player = get_current_player(request.user)
    if current_player is None:
        return JsonResponse({'error': 'Аккаунт не привязан к игроку.'}, status=403)

    payload = parse_body(request)
    if payload is None:
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    try:
        selected_week_start = week_start_from_payload(payload)
    except ValueError:
        return JsonResponse({'error': 'Некорректная неделя.'}, status=400)

    if not is_week_editable(selected_week_start):
        return readonly_week_response()

    form = ScheduleSlotForm(form_data_from_payload(payload))
    if not form.is_valid():
        return JsonResponse({'errors': form_errors_payload(form)}, status=400)

    slot = form.save(commit=False)
    slot.player = current_player
    slot.week_start = selected_week_start
    slot.full_clean()
    slot.save()
    day_event_map = day_event_map_for_slot(slot)

    return JsonResponse({'slot': serialize_slot(slot, current_player, day_event_map)}, status=201)


@require_POST
@login_required
def slot_replace_day(request):
    current_player = get_current_player(request.user)
    if current_player is None:
        return JsonResponse({'error': 'Аккаунт не привязан к игроку.'}, status=403)

    payload = parse_body(request)
    if payload is None:
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    try:
        selected_week_start = week_start_from_payload(payload)
        day_of_week = parse_day_of_week(payload)
    except ValueError:
        return JsonResponse({'error': 'Некорректная неделя или день.'}, status=400)

    if not is_week_editable(selected_week_start):
        return readonly_week_response()

    try:
        replacement_slots = build_day_replacement_slots(payload, current_player, selected_week_start, day_of_week)
    except ValidationError as error:
        return JsonResponse({'errors': validation_errors_payload(error)}, status=400)

    with transaction.atomic():
        existing_ids = list(
            ScheduleSlot.objects
            .filter(player=current_player, week_start=selected_week_start, day_of_week=day_of_week)
            .values_list('id', flat=True)
        )
        ScheduleSlot.objects.filter(id__in=existing_ids).delete()
        for slot in replacement_slots:
            slot.save()

    day_event_map = {
        day_of_week: DayEventType.objects.filter(
            week_start=selected_week_start,
            day_of_week=day_of_week,
        ).first(),
    }

    return JsonResponse({
        'slots': [serialize_slot(slot, current_player, day_event_map) for slot in replacement_slots],
        'deletedIds': existing_ids,
    })


@require_POST
@login_required
def slot_copy_week(request):
    current_player = get_current_player(request.user)
    if current_player is None:
        return JsonResponse({'error': 'Аккаунт не привязан к игроку.'}, status=403)

    payload = parse_body(request)
    if payload is None:
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    try:
        source_week_start = required_week_start_from_payload(payload, 'sourceWeekStart')
        target_week_start = required_week_start_from_payload(payload, 'targetWeekStart')
    except ValueError:
        return JsonResponse({'error': 'Некорректная неделя.'}, status=400)

    if source_week_start == target_week_start:
        return JsonResponse({'error': 'Выберите разные недели для копирования.'}, status=400)

    if not is_week_editable(target_week_start):
        return readonly_week_response()

    source_slots = list(
        ScheduleSlot.objects
        .filter(player=current_player, week_start=source_week_start)
        .order_by('day_of_week', 'start_time_minutes', 'id')
    )
    if not source_slots:
        return JsonResponse({'error': 'В выбранной неделе нет ваших записей.'}, status=400)

    copied_slots = [
        ScheduleSlot(
            player=current_player,
            week_start=target_week_start,
            slot_type=slot.slot_type,
            day_of_week=slot.day_of_week,
            start_time_minutes=slot.start_time_minutes,
            end_time_minutes=slot.end_time_minutes,
            note=slot.note,
        )
        for slot in source_slots
    ]

    with transaction.atomic():
        ScheduleSlot.objects.filter(player=current_player, week_start=target_week_start).delete()
        ScheduleSlot.objects.bulk_create(copied_slots)

    return JsonResponse({
        'ok': True,
        'copiedCount': len(copied_slots),
        'targetWeekStart': target_week_start.isoformat(),
        'targetWeekRangeLabel': week_range_label(target_week_start),
    })


@require_http_methods(['PATCH', 'POST'])
@login_required
def slot_update(request, pk):
    current_player = get_current_player(request.user)
    if current_player is None:
        return JsonResponse({'error': 'Аккаунт не привязан к игроку.'}, status=403)

    slot = get_object_or_404(ScheduleSlot, pk=pk, player=current_player)
    if not is_week_editable(slot.week_start):
        return readonly_week_response()

    payload = parse_body(request)
    if payload is None:
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    form = ScheduleSlotForm(form_data_from_payload(payload), instance=slot)
    if not form.is_valid():
        return JsonResponse({'errors': form_errors_payload(form)}, status=400)

    slot = form.save(commit=False)
    slot.player = current_player
    slot.full_clean()
    slot.save()
    day_event_map = day_event_map_for_slot(slot)

    return JsonResponse({'slot': serialize_slot(slot, current_player, day_event_map)})


@require_http_methods(['DELETE', 'POST'])
@login_required
def slot_delete(request, pk):
    current_player = get_current_player(request.user)
    if current_player is None:
        return JsonResponse({'error': 'Аккаунт не привязан к игроку.'}, status=403)

    slot = get_object_or_404(ScheduleSlot, pk=pk, player=current_player)
    if not is_week_editable(slot.week_start):
        return readonly_week_response()

    slot.delete()

    return JsonResponse({'deleted': True})
