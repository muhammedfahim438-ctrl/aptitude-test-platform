# exams/management/commands/warm_question_cache.py
import logging

from django.core.management.base import BaseCommand, CommandError

from exams.cache import warm_question_cache

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Pre-loads exam questions for a given date into Upstash Redis. "
        "Triggered by cron-job.org at 9:45 AM Mon-Fri, 15 minutes before "
        "the 10:00 AM exam window opens (Constraint 2)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            required=True,
            help='Exam date in YYYY-MM-DD format.',
        )

    def handle(self, *args, **options):
        exam_date = options['date']

        try:
            count = warm_question_cache(exam_date)
        except Exception as e:
            logger.error(f"[WARM CACHE FAILED] date={exam_date}: {e}")
            raise CommandError(f"Failed to warm cache for {exam_date}: {e}")

        if count == 0:
            self.stdout.write(
                self.style.WARNING(
                    f"[WARM CACHE] No questions found for exam_date={exam_date}. "
                    f"Cache was set with an empty list — double-check questions "
                    f"were uploaded for today before students log in."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"[WARM CACHE] Loaded {count} questions into Redis for {exam_date}."
                )
            )
