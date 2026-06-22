# pipeline/management/commands/compute_weekly_leaderboard.py
"""
US-F04 - recomputes WeeklyLeaderboard for the current week.

Logic: sum each student's DailyScore.score across all exam_dates falling
in the current Mon-Sun week, rank by total (ties share rank), write
WeeklyLeaderboard rows. Triggered every Friday 11:59 PM via cron-job.org.

Idempotent: clears existing WeeklyLeaderboard rows for this week_start
before writing fresh ones, so re-running the command (e.g. manual re-run
after a late score correction) doesn't create duplicates.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Sum
from django.utils import timezone

from pipeline.models import DailyScore, WeeklyLeaderboard


class Command(BaseCommand):
    help = "Recompute the WeeklyLeaderboard from this week's DailyScore rows (US-F04)."

    def handle(self, *args, **options):
        today = timezone.localdate()
        week_start = today - timedelta(days=today.weekday())  # Monday
        week_end = week_start + timedelta(days=6)  # Sunday

        self.stdout.write(f"Computing weekly leaderboard for {week_start} to {week_end}...")

        totals = (
            DailyScore.objects
            .filter(exam_date__gte=week_start, exam_date__lte=week_end)
            .values('student')
            .annotate(total_score=Sum('score'))
            .order_by('-total_score')
        )

        # Clear this week's existing snapshot before writing the fresh one.
        WeeklyLeaderboard.objects.filter(week_start=week_start).delete()

        entries = []
        prev_total = None
        prev_rank = 0
        for i, row in enumerate(totals, start=1):
            if row['total_score'] != prev_total:
                prev_rank = i
                prev_total = row['total_score']
            entries.append(
                WeeklyLeaderboard(
                    student_id=row['student'],
                    week_start=week_start,
                    total_score=row['total_score'],
                    rank=prev_rank,
                )
            )

        WeeklyLeaderboard.objects.bulk_create(entries)

        self.stdout.write(
            self.style.SUCCESS(
                f"WeeklyLeaderboard computed: {len(entries)} student(s) ranked for week {week_start}."
            )
        )
