# pipeline/tests/test_deletion.py
"""
Unit tests for US-F02 - DB-backed scheduled CSV deletion.
"""
import os
from datetime import timedelta

from django.conf import settings
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from pipeline.models import ScheduledFileDeletion


class ProcessDeletionsTests(TestCase):
    def setUp(self):
        self.export_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        os.makedirs(self.export_dir, exist_ok=True)

    def _make_file(self, name):
        path = os.path.join(self.export_dir, name)
        with open(path, 'w') as f:
            f.write('test')
        return path

    def test_deletes_only_overdue_records(self):
        overdue_path = self._make_file('overdue.csv')
        future_path = self._make_file('future.csv')

        ScheduledFileDeletion.objects.create(
            file_path=overdue_path,
            delete_after=timezone.now() - timedelta(minutes=5),
        )
        ScheduledFileDeletion.objects.create(
            file_path=future_path,
            delete_after=timezone.now() + timedelta(hours=4),
        )

        call_command('process_deletions')

        self.assertFalse(os.path.exists(overdue_path))
        self.assertTrue(os.path.exists(future_path))

        overdue_record = ScheduledFileDeletion.objects.get(file_path=overdue_path)
        future_record = ScheduledFileDeletion.objects.get(file_path=future_path)
        self.assertTrue(overdue_record.deleted)
        self.assertFalse(future_record.deleted)

    def test_already_deleted_records_are_skipped(self):
        path = self._make_file('already_marked.csv')
        ScheduledFileDeletion.objects.create(
            file_path=path,
            delete_after=timezone.now() - timedelta(minutes=5),
            deleted=True,
        )

        call_command('process_deletions')

        self.assertTrue(os.path.exists(path))

    def test_missing_file_does_not_crash(self):
        nonexistent_path = os.path.join(self.export_dir, 'never_existed.csv')
        ScheduledFileDeletion.objects.create(
            file_path=nonexistent_path,
            delete_after=timezone.now() - timedelta(minutes=5),
        )

        call_command('process_deletions')

        record = ScheduledFileDeletion.objects.get(file_path=nonexistent_path)
        self.assertTrue(record.deleted)

    def test_no_due_records_processes_zero(self):
        future_path = self._make_file('not_due_yet.csv')
        ScheduledFileDeletion.objects.create(
            file_path=future_path,
            delete_after=timezone.now() + timedelta(hours=1),
        )

        call_command('process_deletions')

        self.assertTrue(os.path.exists(future_path))
        record = ScheduledFileDeletion.objects.get(file_path=future_path)
        self.assertFalse(record.deleted)
