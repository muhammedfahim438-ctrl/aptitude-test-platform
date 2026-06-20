# pipeline/management/commands/aggregate_scores.py
import time
from datetime import datetime

from django.core.management.base import BaseCommand, CommandError
from pipeline.aggregation import aggregate_and_export


class Command(BaseCommand):
    help = (
        "Aggregates StudentSubmission scores against the AnswerKey for a "
        "given exam date, writes DailyScore rows, and exports a "
        "Master_Report_<date>.csv file. "
        "Usage: python manage.py aggregate_scores --date=YYYY-MM-DD"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            required=True,
            help='Exam date in YYYY-MM-DD format',
        )

    def handle(self, *args, **options):
        date_str = options['date']

        try:
            exam_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            raise CommandError(
                f"Invalid date format: '{date_str}'. Expected YYYY-MM-DD."
            )

        self.stdout.write(f"Starting aggregation for {exam_date}...")
        start = time.time()

        try:
            export_path = aggregate_and_export(exam_date)
        except Exception as e:
            raise CommandError(f"Aggregation failed: {e}")

        elapsed = time.time() - start
        self.stdout.write(
            self.style.SUCCESS(
                f"Aggregation complete in {elapsed:.2f}s. "
                f"Report written to: {export_path}"
            )
        )

        # Acceptance criteria: must complete for 2,000 records in <60s
        if elapsed > 60:
            self.stdout.write(
                self.style.WARNING(
                    f"⚠ Aggregation took {elapsed:.2f}s — exceeds the 60s "
                    f"target for 2,000 records on Render's free tier."
                )
            )