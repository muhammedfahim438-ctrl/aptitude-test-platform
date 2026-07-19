from django.core.management.base import BaseCommand
from pipeline.models import MonthlyLeaderboard


class Command(BaseCommand):
    help = "Flush all MonthlyLeaderboard records (run before recomputing)."

    def handle(self, *args, **options):
        deleted, _ = MonthlyLeaderboard.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(
            f"MonthlyLeaderboard flushed: {deleted} record(s) removed."
        ))
