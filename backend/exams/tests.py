# exams/tests.py
"""
Tests for StudentReviewView (US-K03: Time-Locked Answer Key Display Element).
"""
from datetime import datetime
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from exams.models import AnswerKey, StudentSubmission

User = get_user_model()


class StudentReviewWindowGateTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123',
            full_name='Reviewer',
            is_student=True,
        )
        self.url = '/api/student/review/?date=2026-07-18'
        self.exam_date = '2026-07-18'
        AnswerKey.objects.create(
            date=self.exam_date,
            correct_answers={'q1': 'A', 'q2': 'B'},
        )
        StudentSubmission.objects.create(
            student=self.student,
            exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'C'},
        )
        self.token = self.client.post('/api/auth/login/', {
            'email': 'reviewer@test.com',
            'password': 'testpass123',
        }, content_type='application/json').data['access']
        self.auth = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

    def _mock_now(self, dt):
        p = patch('exams.views.timezone')
        mocked = p.start()
        mocked.now.return_value = dt
        self.addCleanup(p.stop)

    def test_review_before_window_returns_no_key(self):
        self._mock_now(datetime(2026, 7, 18, 13, 0, 0))
        response = self.client.get(self.url, **self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data['correct_answers'])
        self.assertEqual(response.data['window_status'], 'before_window')

    def test_review_during_window_returns_score(self):
        self._mock_now(datetime(2026, 7, 18, 15, 0, 0))
        response = self.client.get(self.url, **self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['window_status'], 'open')
        self.assertEqual(response.data['correct_answers'], {'q1': 'A', 'q2': 'B'})
        self.assertEqual(response.data['score'], 1)
        self.assertEqual(response.data['total_questions'], 2)

    def test_review_after_window_returns_no_score(self):
        self._mock_now(datetime(2026, 7, 18, 20, 0, 0))
        response = self.client.get(self.url, **self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['window_status'], 'after_window')
        self.assertIsNone(response.data['score'])

    def test_review_without_submission_returns_404(self):
        StudentSubmission.objects.all().delete()
        self._mock_now(datetime(2026, 7, 18, 15, 0, 0))
        response = self.client.get(self.url, **self.auth)
        self.assertEqual(response.status_code, 404)

    def test_review_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_review_requires_student_role(self):
        teacher = User.objects.create_user(
            email='teacher@test.com', password='testpass123',
            full_name='T', is_teacher=True,
        )
        token = self.client.post('/api/auth/login/', {
            'email': 'teacher@test.com', 'password': 'testpass123',
        }, content_type='application/json').data['access']
        response = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 403)
