"""
pipeline/tests/test_monthly_leaderboard.py

Integration tests for the compute_monthly_leaderboard and flush_monthly_leaderboard
management commands, and the MonthlyLeaderboard model aggregation logic.
"""
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from pipeline.models import DailyScore, MonthlyLeaderboard

User = get_user_model()


class MonthlyLeaderboardTests(TestCase):
    def setUp(self):
        today = timezone.localdate()
        self.month_start = today.replace(day=1)
        last_month_end = self.month_start - timedelta(days=1)
        self.prev_month_start = last_month_end.replace(day=1)

        self.s1 = User.objects.create_user(
            email='m1@college.edu', password='testpass123',
            full_name='Monthly One', is_student=True,
        )
        self.s2 = User.objects.create_user(
            email='m2@college.edu', password='testpass123',
            full_name='Monthly Two', is_student=True,
        )
        self.s3 = User.objects.create_user(
            email='m3@college.edu', password='testpass123',
            full_name='Monthly Three', is_student=True,
        )

    def test_compute_sums_within_month(self):
        mid_month = self.prev_month_start + timedelta(days=14)
        DailyScore.objects.create(student=self.s1, exam_date=self.prev_month_start, score=5)
        DailyScore.objects.create(student=self.s1, exam_date=mid_month, score=3)
        DailyScore.objects.create(student=self.s2, exam_date=self.prev_month_start, score=7)

        call_command('compute_monthly_leaderboard', month=f'{self.prev_month_start.year}-{self.prev_month_start.month:02d}')

        e1 = MonthlyLeaderboard.objects.get(student=self.s1, month_start=self.prev_month_start)
        e2 = MonthlyLeaderboard.objects.get(student=self.s2, month_start=self.prev_month_start)

        self.assertEqual(e1.total_score, 8)
        self.assertEqual(e2.total_score, 7)
        self.assertEqual(e1.rank, 1)
        self.assertEqual(e2.rank, 2)

    def test_scores_outside_month_excluded(self):
        prev_prev_month_end = self.prev_month_start - timedelta(days=1)
        outside_date = prev_prev_month_end.replace(day=1)

        DailyScore.objects.create(student=self.s1, exam_date=outside_date, score=50)
        DailyScore.objects.create(student=self.s1, exam_date=self.prev_month_start, score=3)

        call_command('compute_monthly_leaderboard', month=f'{self.prev_month_start.year}-{self.prev_month_start.month:02d}')

        entry = MonthlyLeaderboard.objects.get(student=self.s1, month_start=self.prev_month_start)
        self.assertEqual(entry.total_score, 3)

    def test_tied_scores_share_rank(self):
        DailyScore.objects.create(student=self.s1, exam_date=self.prev_month_start, score=8)
        DailyScore.objects.create(student=self.s2, exam_date=self.prev_month_start, score=8)
        DailyScore.objects.create(student=self.s3, exam_date=self.prev_month_start, score=5)

        call_command('compute_monthly_leaderboard', month=f'{self.prev_month_start.year}-{self.prev_month_start.month:02d}')

        e1 = MonthlyLeaderboard.objects.get(student=self.s1, month_start=self.prev_month_start)
        e2 = MonthlyLeaderboard.objects.get(student=self.s2, month_start=self.prev_month_start)
        e3 = MonthlyLeaderboard.objects.get(student=self.s3, month_start=self.prev_month_start)

        self.assertEqual(e1.rank, e2.rank)
        self.assertGreater(e3.rank, e1.rank)

    def test_recompute_does_not_duplicate(self):
        DailyScore.objects.create(student=self.s1, exam_date=self.prev_month_start, score=5)

        call_command('compute_monthly_leaderboard', month=f'{self.prev_month_start.year}-{self.prev_month_start.month:02d}')
        call_command('compute_monthly_leaderboard', month=f'{self.prev_month_start.year}-{self.prev_month_start.month:02d}')

        count = MonthlyLeaderboard.objects.filter(
            student=self.s1, month_start=self.prev_month_start
        ).count()
        self.assertEqual(count, 1)

    def test_flush_deletes_all_rows(self):
        DailyScore.objects.create(student=self.s1, exam_date=self.prev_month_start, score=3)
        call_command('compute_monthly_leaderboard', month=f'{self.prev_month_start.year}-{self.prev_month_start.month:02d}')
        self.assertGreater(MonthlyLeaderboard.objects.count(), 0)

        call_command('flush_monthly_leaderboard')
        self.assertEqual(MonthlyLeaderboard.objects.count(), 0)

    def test_month_with_no_scores(self):
        call_command('compute_monthly_leaderboard', month=f'{self.prev_month_start.year}-{self.prev_month_start.month:02d}')
        self.assertEqual(MonthlyLeaderboard.objects.count(), 0)

    def test_three_students_ranking_order(self):
        DailyScore.objects.create(student=self.s1, exam_date=self.prev_month_start, score=10)
        DailyScore.objects.create(student=self.s2, exam_date=self.prev_month_start, score=20)
        DailyScore.objects.create(student=self.s3, exam_date=self.prev_month_start, score=15)

        call_command('compute_monthly_leaderboard', month=f'{self.prev_month_start.year}-{self.prev_month_start.month:02d}')

        entries = MonthlyLeaderboard.objects.filter(
            month_start=self.prev_month_start
        ).order_by('rank')

        self.assertEqual(entries[0].student, self.s2)
        self.assertEqual(entries[0].total_score, 20)
        self.assertEqual(entries[1].student, self.s3)
        self.assertEqual(entries[1].total_score, 15)
        self.assertEqual(entries[2].student, self.s1)
        self.assertEqual(entries[2].total_score, 10)

    def test_invalid_month_format(self):
        from io import StringIO
        out = StringIO()
        call_command('compute_monthly_leaderboard', month='bad', stdout=out)
        output = out.getvalue()
        self.assertIn('Invalid month format', output)
