# pipeline/tests/test_integration.py
"""
Full integration test - US-F01 through US-F03 chained together as one
realistic flow (Day 5 acceptance criteria: "Full integration test,
CSV lifecycle test").
"""
import os
from datetime import date, timedelta
from unittest import mock

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from exams.models import AnswerKey, Question, StudentSubmission
from pipeline.aggregation import aggregate_and_export
from pipeline.models import DailyScore, ScheduledFileDeletion, ReportDownloadLog

User = get_user_model()


class FullCsvLifecycleIntegrationTest(TestCase):
    def setUp(self):
        self.exam_date = date(2026, 6, 22)
        self.export_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        os.makedirs(self.export_dir, exist_ok=True)

        self.s1 = User.objects.create_user(
            email='int1@college.edu', password='testpass123',
            full_name='Integration One', is_student=True,
        )
        self.s2 = User.objects.create_user(
            email='int2@college.edu', password='testpass123',
            full_name='Integration Two', is_student=True,
        )

    def test_full_lifecycle_question_to_deletion(self):
        Question.objects.create(
            exam_date=self.exam_date,
            text="2 + 2 = ?",
            option_a="3", option_b="4", option_c="5", option_d="6",
        )

        AnswerKey.objects.create(
            date=self.exam_date,
            correct_answers={"q1": "B"},
        )
        StudentSubmission.objects.create(
            student=self.s1, exam_date=self.exam_date, answers={"q1": "B"}
        )
        StudentSubmission.objects.create(
            student=self.s2, exam_date=self.exam_date, answers={"q1": "A"}
        )

        export_path = aggregate_and_export(self.exam_date)
        self.assertTrue(os.path.exists(export_path))
        self.assertEqual(DailyScore.objects.filter(exam_date=self.exam_date).count(), 2)

        s1_score = DailyScore.objects.get(student=self.s1, exam_date=self.exam_date)
        self.assertEqual(s1_score.score, 1)
        s2_score = DailyScore.objects.get(student=self.s2, exam_date=self.exam_date)
        self.assertEqual(s2_score.score, 0)

        delete_at = timezone.now() + timedelta(hours=4)
        ReportDownloadLog.objects.create(
            file_path=export_path,
            downloaded_at=timezone.now(),
            scheduled_deletion_at=delete_at,
        )
        ScheduledFileDeletion.objects.create(
            file_path=export_path,
            delete_after=delete_at,
        )

        call_command('process_deletions')
        self.assertTrue(os.path.exists(export_path))
        record = ScheduledFileDeletion.objects.get(file_path=export_path)
        self.assertFalse(record.deleted)

        future_time = timezone.now() + timedelta(hours=4, minutes=1)
        with mock.patch.object(timezone, 'now', return_value=future_time):
            call_command('process_deletions')

        self.assertFalse(os.path.exists(export_path))
        record.refresh_from_db()
        self.assertTrue(record.deleted)

        next_exam_date = date(2026, 6, 23)
        Question.objects.create(
            exam_date=next_exam_date,
            text="Next day question?",
            option_a="A", option_b="B", option_c="C", option_d="D",
        )
        self.assertFalse(os.path.exists(export_path))
