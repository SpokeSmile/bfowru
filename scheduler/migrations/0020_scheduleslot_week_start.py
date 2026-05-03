from datetime import date, timedelta

from django.db import migrations, models

import scheduler.models


def fallback_week_start():
    today = date.today()
    return today - timedelta(days=today.weekday())


def populate_week_start(apps, schema_editor):
    RosterState = apps.get_model('scheduler', 'RosterState')
    ScheduleSlot = apps.get_model('scheduler', 'ScheduleSlot')

    state = RosterState.objects.filter(pk=1).first()
    week_start = state.current_week_start if state and state.current_week_start else fallback_week_start()
    ScheduleSlot.objects.filter(week_start__isnull=True).update(week_start=week_start)


class Migration(migrations.Migration):

    dependencies = [
        ('scheduler', '0019_alter_overwatchstatscache_mode'),
    ]

    operations = [
        migrations.AddField(
            model_name='scheduleslot',
            name='week_start',
            field=models.DateField(blank=True, db_index=True, null=True, verbose_name='неделя'),
        ),
        migrations.RunPython(populate_week_start, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='scheduleslot',
            name='week_start',
            field=models.DateField(default=scheduler.models.default_week_start, db_index=True, verbose_name='неделя'),
        ),
        migrations.AlterModelOptions(
            name='scheduleslot',
            options={
                'ordering': ['week_start', 'player_id', 'day_of_week', 'start_time_minutes'],
                'verbose_name': 'слот расписания',
                'verbose_name_plural': 'слоты расписания',
            },
        ),
    ]
