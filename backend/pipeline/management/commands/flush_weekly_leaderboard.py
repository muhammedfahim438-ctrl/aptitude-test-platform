# pipeline/management/commands/flush_weekly_leaderboard.py
from django.core.management.base import BaseCommand
from pipeline.models import WeeklyLeaderboard


class Command(BaseCommand):
    help = "Flush (delete) all WeeklyLeaderboard rows (US-F04)."

    def handle(self, *args, **options):
        deleted_count, _ = WeeklyLeaderboard.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(
            f"WeeklyLeaderboard flushed: {deleted_count} record(s) removed."
        ))
