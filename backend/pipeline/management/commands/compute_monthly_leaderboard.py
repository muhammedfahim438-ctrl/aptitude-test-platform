from datetime import date
from calendar import monthrange

from django.core.management.base import BaseCommand
from django.db.models import Sum
from django.utils import timezone

from pipeline.models import DailyScore, MonthlyLeaderboard


class Command(BaseCommand):
    help = "Recompute the MonthlyLeaderboard from last month's DailyScore rows."

    def add_arguments(self, parser):
        parser.add_argument(
            '--month', type=str, default=None,
            help='Month to compute (YYYY-MM). Defaults to previous month.',
        )

    def handle(self, *args, **options):
        today = timezone.localdate()

        if options['month']:
            try:
                parts = options['month'].split('-')
                year, month = int(parts[0]), int(parts[1])
                month_start = date(year, month, 1)
            except (ValueError, IndexError):
                self.stdout.write(self.style.ERROR(
                    f"Invalid month format: '{options['month']}'. Expected YYYY-MM."
                ))
                return
        else:
            first_of_this_month = today.replace(day=1)
            month_start = (first_of_this_month - __import__('datetime').timedelta(days=1)).replace(day=1)

        _, last_day = monthrange(month_start.year, month_start.month)
        month_end = date(month_start.year, month_start.month, last_day)

        self.stdout.write(f"Computing monthly leaderboard for {month_start} to {month_end}...")

        totals = (
            DailyScore.objects
            .filter(exam_date__gte=month_start, exam_date__lte=month_end)
            .values('student')
            .annotate(total_score=Sum('score'))
            .order_by('-total_score')
        )

        MonthlyLeaderboard.objects.filter(month_start=month_start).delete()

        entries = []
        prev_total = None
        prev_rank = 0
        for i, row in enumerate(totals, start=1):
            if row['total_score'] != prev_total:
                prev_rank = i
                prev_total = row['total_score']
            entries.append(MonthlyLeaderboard(
                student_id=row['student'],
                month_start=month_start,
                total_score=row['total_score'],
                rank=prev_rank,
            ))

        MonthlyLeaderboard.objects.bulk_create(entries)
        self.stdout.write(self.style.SUCCESS(
            f"MonthlyLeaderboard computed: {len(entries)} student(s) ranked for {month_start.strftime('%B %Y')}."
        ))
