import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from exams.models import StudentSubmission
from pipeline.models import DailyScore, DailyLeaderboard

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Clean up student data for a given date after the review window closes."

    def add_arguments(self, parser):
        parser.add_argument(
            '--date', type=str, default=None,
            help='Date to clean up (YYYY-MM-DD). Defaults to yesterday.',
        )

    def handle(self, *args, **options):
        if options['date']:
            from datetime import datetime
            try:
                target_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
            except ValueError:
                self.stdout.write(self.style.ERROR(f"Invalid date format: '{options['date']}'. Expected YYYY-MM-DD."))
                return
        else:
            target_date = (timezone.now().date() - timedelta(days=1))

        self.stdout.write(f"Cleaning up data for {target_date}...")

        sub_deleted, _ = StudentSubmission.objects.filter(exam_date=target_date).delete()
        score_deleted, _ = DailyScore.objects.filter(exam_date=target_date).delete()
        lb_deleted, _ = DailyLeaderboard.objects.filter(exam_date=target_date).delete()

        self.stdout.write(self.style.SUCCESS(
            f"Cleanup complete for {target_date}: "
            f"{sub_deleted} submissions, {score_deleted} scores, {lb_deleted} leaderboard entries deleted."
        ))
