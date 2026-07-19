# pipeline/tests/test_signals.py
"""
Unit tests for US-F03 - pre_save signal purging stale CSVs and
DailyLeaderboard on new question upload.
"""
import os
from datetime import date

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase

from exams.models import Question
from pipeline.models import DailyLeaderboard

User = get_user_model()


class StaleCsvPurgeSignalTests(TestCase):
    def setUp(self):
        self.export_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        os.makedirs(self.export_dir, exist_ok=True)
        self.student = User.objects.create_user(
            email='leader@college.edu',
            password='testpass123',
            full_name='Leader Student',
            is_student=True,
        )

    def _make_csv(self, name):
        path = os.path.join(self.export_dir, name)
        with open(path, 'w') as f:
            f.write('student_id,name,score,rank,timestamp\n')
        return path

    def _make_question(self, exam_date, text="Q?"):
        return Question.objects.create(
            exam_date=exam_date,
            text=text,
            option_a="A", option_b="B", option_c="C", option_d="D",
        )

    def test_new_exam_date_purges_stale_csvs_and_scoped_leaderboard(self):
        stale_path = self._make_csv('Master_Report_2026-06-19.csv')
        DailyLeaderboard.objects.create(
            student=self.student, exam_date=date(2026, 6, 19), score=3, rank=1
        )

        self._make_question(date(2026, 6, 21))

        self.assertFalse(os.path.exists(stale_path))
        self.assertEqual(DailyLeaderboard.objects.count(), 1)

    def test_leaderboard_flushed_for_same_date(self):
        DailyLeaderboard.objects.create(
            student=self.student, exam_date=date(2026, 6, 21), score=5, rank=1
        )
        DailyLeaderboard.objects.create(
            student=self.student, exam_date=date(2026, 6, 19), score=3, rank=1
        )

        self._make_question(date(2026, 6, 21))

        self.assertEqual(DailyLeaderboard.objects.count(), 1)
        self.assertEqual(DailyLeaderboard.objects.first().exam_date, date(2026, 6, 19))

    def test_second_question_same_date_does_not_retrigger(self):
        self._make_question(date(2026, 6, 21), text="First")

        survivor_path = self._make_csv('Master_Report_2026-06-21.csv')
        DailyLeaderboard.objects.create(
            student=self.student, exam_date=date(2026, 6, 21), score=2, rank=1
        )

        self._make_question(date(2026, 6, 21), text="Second")

        self.assertTrue(os.path.exists(survivor_path))
        self.assertEqual(DailyLeaderboard.objects.count(), 1)

    def test_updating_existing_question_does_not_trigger(self):
        q = self._make_question(date(2026, 6, 21))

        survivor_path = self._make_csv('Master_Report_2026-06-21.csv')

        q.text = "Updated text"
        q.save()

        self.assertTrue(os.path.exists(survivor_path))

    def test_purges_csvs_for_all_dates_not_just_new_one(self):
        old_path_1 = self._make_csv('Master_Report_2026-06-18.csv')
        old_path_2 = self._make_csv('Master_Report_2026-06-19.csv')

        self._make_question(date(2026, 6, 22))

        self.assertFalse(os.path.exists(old_path_1))
        self.assertFalse(os.path.exists(old_path_2))
