"""
pipeline/tests/test_cleanup_day.py

Integration tests for the cleanup_day management command (US-F03).
Verifies that submissions and leaderboard entries are deleted,
while DailyScore records are preserved for historical analytics.
"""
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from exams.models import StudentSubmission
from pipeline.models import DailyLeaderboard, DailyScore

User = get_user_model()


class CleanupDayPreservesDailyScoreTest(TestCase):
    def setUp(self):
        self.today = timezone.localdate()
        self.target_date = self.today - timedelta(days=1)

        self.student_a = User.objects.create_user(
            email='clean_a@college.edu', password='testpass123',
            full_name='Student A', is_student=True,
        )
        self.student_b = User.objects.create_user(
            email='clean_b@college.edu', password='testpass123',
            full_name='Student B', is_student=True,
        )

        self.sub_a = StudentSubmission.objects.create(
            student=self.student_a, exam_date=self.target_date,
            answers={"q1": "A", "q2": "B"},
        )
        self.sub_b = StudentSubmission.objects.create(
            student=self.student_b, exam_date=self.target_date,
            answers={"q1": "C", "q2": "D"},
        )

        self.lb_a = DailyLeaderboard.objects.create(
            student=self.student_a, exam_date=self.target_date,
            score=1, rank=1,
        )
        self.lb_b = DailyLeaderboard.objects.create(
            student=self.student_b, exam_date=self.target_date,
            score=0, rank=2,
        )

        self.ds_a = DailyScore.objects.create(
            student=self.student_a, exam_date=self.target_date, score=1,
        )
        self.ds_b = DailyScore.objects.create(
            student=self.student_b, exam_date=self.target_date, score=0,
        )

    def test_submissions_deleted(self):
        call_command('cleanup_day', date=str(self.target_date))
        self.assertEqual(
            StudentSubmission.objects.filter(exam_date=self.target_date).count(), 0
        )

    def test_leaderboard_entries_deleted(self):
        call_command('cleanup_day', date=str(self.target_date))
        self.assertEqual(
            DailyLeaderboard.objects.filter(exam_date=self.target_date).count(), 0
        )

    def test_daily_scores_preserved(self):
        call_command('cleanup_day', date=str(self.target_date))
        self.assertEqual(
            DailyScore.objects.filter(exam_date=self.target_date).count(), 2
        )
        self.assertTrue(DailyScore.objects.filter(student=self.student_a, exam_date=self.target_date, score=1).exists())
        self.assertTrue(DailyScore.objects.filter(student=self.student_b, exam_date=self.target_date, score=0).exists())

    def test_daily_score_values_intact(self):
        call_command('cleanup_day', date=str(self.target_date))
        ds_a = DailyScore.objects.get(student=self.student_a, exam_date=self.target_date)
        ds_b = DailyScore.objects.get(student=self.student_b, exam_date=self.target_date)
        self.assertEqual(ds_a.score, 1)
        self.assertEqual(ds_b.score, 0)

    def test_other_dates_unaffected(self):
        other_date = self.target_date - timedelta(days=5)
        StudentSubmission.objects.create(
            student=self.student_a, exam_date=other_date,
            answers={"q1": "A"},
        )
        DailyScore.objects.create(
            student=self.student_a, exam_date=other_date, score=1,
        )

        call_command('cleanup_day', date=str(self.target_date))

        self.assertEqual(
            StudentSubmission.objects.filter(exam_date=other_date).count(), 1
        )
        self.assertEqual(
            DailyScore.objects.filter(exam_date=other_date).count(), 1
        )

    def test_default_date_is_yesterday(self):
        call_command('cleanup_day')
        self.assertEqual(
            StudentSubmission.objects.filter(exam_date=self.target_date).count(), 0
        )

    def test_noop_when_no_data(self):
        fresh_date = self.today - timedelta(days=999)
        call_command('cleanup_day', date=str(fresh_date))

    def test_invalid_date_format(self):
        from io import StringIO
        out = StringIO()
        call_command('cleanup_day', date='not-a-date', stdout=out)
        output = out.getvalue()
        self.assertIn('Invalid date format', output)

    def test_idempotent_rerun(self):
        call_command('cleanup_day', date=str(self.target_date))
        call_command('cleanup_day', date=str(self.target_date))
        self.assertEqual(
            DailyScore.objects.filter(exam_date=self.target_date).count(), 2
        )
