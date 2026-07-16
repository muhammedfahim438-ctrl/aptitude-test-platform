# pipeline/management/commands/process_deletions.py
import os
import logging

from django.core.management.base import BaseCommand
from django.utils import timezone

from pipeline.models import ScheduledFileDeletion

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Process all overdue scheduled file deletions (US-F02)."

    def handle(self, *args, **options):
        due = ScheduledFileDeletion.objects.filter(
            delete_after__lte=timezone.now(),
            deleted=False,
        )
        count = 0
        for record in due:
            try:
                os.remove(record.file_path)
                self.stdout.write(self.style.SUCCESS(f"Deleted: {record.file_path}"))
            except FileNotFoundError:
                self.stdout.write(self.style.WARNING(f"Already gone: {record.file_path}"))
            record.deleted = True
            record.save(update_fields=['deleted'])
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Processed {count} deletion(s)."))
