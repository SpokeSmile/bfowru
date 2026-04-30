from django.core.management.base import BaseCommand, CommandError

from scheduler.game_updates import GameUpdateSyncError, sync_game_updates


class Command(BaseCommand):
    help = 'Synchronize Overwatch patch notes from Blizzard.'

    def handle(self, *args, **options):
        try:
            result = sync_game_updates()
        except GameUpdateSyncError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Sync complete. fetched={result['fetched']} created={result['created']} updated={result['updated']} total={result['total']}"
            )
        )
