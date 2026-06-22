"""
pipeline/tests/test_aggregation.py

Unit tests for the aggregation engine (US-F01 acceptance criteria):
- empty submission set
- partial submission set
- all-zero scores
- perfect scores

Run with: python manage.py test pipeline
"""
from datetime import date

from django.test import TestCase
from django.contrib.auth import get_user_model

from exams.models import AnswerKey, StudentSubmission
from pipeline.models import DailyScore
from pipeline.aggregation import aggregate_and_export

User = get_user_model()


class AggregateAndExportTests(TestCase):
    def setUp(self):
        self.exam_date = date(2026, 6, 19)
        self.answer_key = AnswerKey.objects.create(
            date=self.exam_date,
            correct_answers={"q1": "A", "q2": "B", "q3": "C"},
        )

    def _make_student(self, email):
        return User.objects.create_user(
            email=email,
            password="testpass123",
            full_name="Test Student",
            is_student=True,
        )

    def test_empty_submission_set(self):
        export_path = aggregate_and_export(self.exam_date)
        self.assertEqual(DailyScore.objects.filter(exam_date=self.exam_date).count(), 0)
        self.assertTrue(export_path.endswith(f"Master_Report_{self.exam_date}.csv"))

    def test_partial_submission_set(self):
        student_a = self._make_student("a@college.edu")
        self._make_student("b@college.edu")

        StudentSubmission.objects.create(
            student=student_a,
            exam_date=self.exam_date,
            answers={"q1": "A", "q2": "X", "q3": "C"},
        )

        aggregate_and_export(self.exam_date)

        scores = DailyScore.objects.filter(exam_date=self.exam_date)
        self.assertEqual(scores.count(), 1)
        self.assertEqual(scores.get(student=student_a).score, 2)

    def test_all_zero_scores(self):
        student = self._make_student("zero@college.edu")
        StudentSubmission.objects.create(
            student=student,
            exam_date=self.exam_date,
            answers={"q1": "X", "q2": "Y", "q3": "Z"},
        )
        aggregate_and_export(self.exam_date)
        score = DailyScore.objects.get(student=student, exam_date=self.exam_date)
        self.assertEqual(score.score, 0)

    def test_perfect_scores(self):
        student = self._make_student("perfect@college.edu")
        StudentSubmission.objects.create(
            student=student,
            exam_date=self.exam_date,
            answers={"q1": "A", "q2": "B", "q3": "C"},
        )
        aggregate_and_export(self.exam_date)
        score = DailyScore.objects.get(student=student, exam_date=self.exam_date)
        self.assertEqual(score.score, 3)

    def test_rerun_does_not_duplicate(self):
        student = self._make_student("rerun@college.edu")
        StudentSubmission.objects.create(
            student=student,
            exam_date=self.exam_date,
            answers={"q1": "A", "q2": "B", "q3": "C"},
        )
        aggregate_and_export(self.exam_date)
        aggregate_and_export(self.exam_date)
        self.assertEqual(
            DailyScore.objects.filter(student=student, exam_date=self.exam_date).count(),
            1,
        )
