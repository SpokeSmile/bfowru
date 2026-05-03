from datetime import date, datetime, timedelta

from django.utils import timezone

from .models import RosterState

# Weekly roster helpers. Older weeks are retained as history, so advancing the
# active week must never delete ScheduleSlot rows.


def week_start_for(day=None):
    current_day = day or timezone.localdate()
    if isinstance(current_day, datetime):
        current_day = current_day.date()
    return current_day - timedelta(days=current_day.weekday())


def parse_week_start(raw_value):
    if not raw_value:
        return None
    try:
        requested_day = date.fromisoformat(str(raw_value).strip())
    except ValueError as exc:
        raise ValueError('Invalid week date.') from exc
    return week_start_for(requested_day)


def week_range_label(week_start):
    week_end = week_start + timedelta(days=6)
    return f'{week_start:%d.%m}-{week_end:%d.%m}'


def ensure_current_roster_week(today=None, force=False):
    week_start = week_start_for(today)
    state, _created = RosterState.objects.get_or_create(
        pk=1,
        defaults={'current_week_start': week_start},
    )

    if state.current_week_start is None:
        state.current_week_start = week_start
        state.save(update_fields=['current_week_start', 'updated_at'])
        return False, 0

    if not force and state.current_week_start >= week_start:
        return False, 0

    state.current_week_start = week_start
    state.save(update_fields=['current_week_start', 'updated_at'])
    return True, 0


def get_current_week_start():
    ensure_current_roster_week()
    state = RosterState.objects.filter(pk=1).first()
    return state.current_week_start if state and state.current_week_start else week_start_for()


def is_week_editable(week_start, current_week_start=None):
    current_week_start = current_week_start or get_current_week_start()
    return week_start >= current_week_start
