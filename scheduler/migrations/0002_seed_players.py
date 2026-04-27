# Generated for initial team roster.

from django.db import migrations


def create_default_players(apps, schema_editor):
    Player = apps.get_model('scheduler', 'Player')
    for index in range(1, 6):
        Player.objects.get_or_create(name=f'Игрок {index}')


def remove_default_players(apps, schema_editor):
    Player = apps.get_model('scheduler', 'Player')
    Player.objects.filter(name__in=[f'Игрок {index}' for index in range(1, 6)]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('scheduler', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_players, remove_default_players),
    ]
