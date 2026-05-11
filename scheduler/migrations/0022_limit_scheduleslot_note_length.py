from django.db import migrations, models


def truncate_schedule_slot_notes(apps, schema_editor):
    ScheduleSlot = apps.get_model('scheduler', 'ScheduleSlot')
    for slot in ScheduleSlot.objects.exclude(note='').only('pk', 'note').iterator():
        if len(slot.note) > 100:
            slot.note = slot.note[:100]
            slot.save(update_fields=['note'])


class Migration(migrations.Migration):

    dependencies = [
        ('scheduler', '0021_dayeventtype_week_start'),
    ]

    operations = [
        migrations.RunPython(truncate_schedule_slot_notes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='scheduleslot',
            name='note',
            field=models.CharField(blank=True, max_length=100, verbose_name='комментарий'),
        ),
    ]
