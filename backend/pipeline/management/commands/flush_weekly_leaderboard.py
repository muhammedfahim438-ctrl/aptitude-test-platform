# pipeline/management/commands/flush_weekly_leaderboard.py
"""
US-F04 - deletes all WeeklyLeaderboard rows.
Triggered via cron-job.org -> POST /api/internal/flush-weekly-leaderboard/
exactly 36 hours after Monday 00:00 (Tuesday 12:00 PM).
"""
from django.core.management.base import BaseCommand
from pipeline.models import WeeklyLeaderboard


class Command(BaseCommand):
    help = "Flush (delete) all WeeklyLeaderboard rows (US-F04)."

    def handle(self, *args, **options):
        deleted_count, _ = WeeklyLeaderboard.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(f"WeeklyLeaderboard flushed: {deleted_count} record(s) removed.")
        )
