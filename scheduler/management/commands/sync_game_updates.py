from django.core.management.base import BaseCommand, CommandError

from scheduler.game_updates import GameUpdateSyncError, sync_game_updates


class Command(BaseCommand):
    help = 'Synchronize Overwatch patch notes from Blizzard.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--full-archive',
            action='store_true',
            help='Import the full live patch archive instead of only the latest months.',
        )

    def handle(self, *args, **options):
        try:
            result = sync_game_updates(full_archive=options['full_archive'])
        except GameUpdateSyncError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Sync complete. fetched={result['fetched']} created={result['created']} updated={result['updated']} total={result['total']}"
            )
        )
