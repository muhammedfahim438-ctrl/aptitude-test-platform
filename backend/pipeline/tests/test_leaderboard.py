# pipeline/tests/test_leaderboard.py
"""
Unit tests for US-F04 - weekly leaderboard flush/compute commands.
"""
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from pipeline.models import DailyScore, WeeklyLeaderboard

User = get_user_model()


class WeeklyLeaderboardTests(TestCase):
    def setUp(self):
        self.today = timezone.localdate()
        self.week_start = self.today - timedelta(days=self.today.weekday())

        self.s1 = User.objects.create_user(
            email='w1@college.edu', password='testpass123',
            full_name='Weekly One', is_student=True,
        )
        self.s2 = User.objects.create_user(
            email='w2@college.edu', password='testpass123',
            full_name='Weekly Two', is_student=True,
        )

    def test_compute_sums_within_week(self):
        DailyScore.objects.create(student=self.s1, exam_date=self.week_start, score=2)
        DailyScore.objects.create(
            student=self.s1, exam_date=self.week_start + timedelta(days=1), score=3
        )
        DailyScore.objects.create(student=self.s2, exam_date=self.week_start, score=4)

        call_command('compute_weekly_leaderboard')

        s1_entry = WeeklyLeaderboard.objects.get(student=self.s1, week_start=self.week_start)
        s2_entry = WeeklyLeaderboard.objects.get(student=self.s2, week_start=self.week_start)

        self.assertEqual(s1_entry.total_score, 5)
        self.assertEqual(s2_entry.total_score, 4)
        self.assertEqual(s1_entry.rank, 1)
        self.assertEqual(s2_entry.rank, 2)

    def test_scores_outside_week_excluded(self):
        last_week = self.week_start - timedelta(days=7)
        DailyScore.objects.create(student=self.s1, exam_date=last_week, score=10)
        DailyScore.objects.create(student=self.s1, exam_date=self.week_start, score=1)

        call_command('compute_weekly_leaderboard')

        entry = WeeklyLeaderboard.objects.get(student=self.s1, week_start=self.week_start)
        self.assertEqual(entry.total_score, 1)

    def test_tied_scores_share_rank(self):
        DailyScore.objects.create(student=self.s1, exam_date=self.week_start, score=5)
        DailyScore.objects.create(student=self.s2, exam_date=self.week_start, score=5)

        call_command('compute_weekly_leaderboard')

        s1_entry = WeeklyLeaderboard.objects.get(student=self.s1, week_start=self.week_start)
        s2_entry = WeeklyLeaderboard.objects.get(student=self.s2, week_start=self.week_start)

        self.assertEqual(s1_entry.rank, s2_entry.rank)

    def test_recompute_does_not_duplicate(self):
        DailyScore.objects.create(student=self.s1, exam_date=self.week_start, score=3)

        call_command('compute_weekly_leaderboard')
        call_command('compute_weekly_leaderboard')

        count = WeeklyLeaderboard.objects.filter(
            student=self.s1, week_start=self.week_start
        ).count()
        self.assertEqual(count, 1)

    def test_flush_deletes_all_rows(self):
        DailyScore.objects.create(student=self.s1, exam_date=self.week_start, score=3)
        call_command('compute_weekly_leaderboard')
        self.assertGreater(WeeklyLeaderboard.objects.count(), 0)

        call_command('flush_weekly_leaderboard')

        self.assertEqual(WeeklyLeaderboard.objects.count(), 0)
