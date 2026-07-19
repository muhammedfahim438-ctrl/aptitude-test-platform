"""
exams/tests_submit.py

Dedicated test suite for SubmitAnswersView.
Asserts the API response payload exactly matches the specification:
  {message, student, exam_date, answers_submitted, created}
"""
from datetime import date, time
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from exams.models import StudentSubmission

User = get_user_model()


class SubmitAnswersViewPayloadTest(TestCase):
    def setUp(self):
        self.client_obj = APIClient()
        self.student = User.objects.create_user(
            email='submit@test.com', password='testpass123',
            full_name='Submit Student', is_student=True,
        )
        self.url = '/api/tests/submit/'
        self.exam_date = '2026-07-15'
        self.answers = {"q1": "A", "q2": "B", "q3": "C"}

    def _auth(self):
        self.client_obj.force_authenticate(user=self.student)

    @patch('exams.views.timezone')
    def test_first_submission_returns_201(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        mock_tz.now.return_value.date.return_value = date(2026, 7, 15)
        self._auth()
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.assertEqual(response.status_code, 201)

    @patch('exams.views.timezone')
    def test_payload_has_message(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'Submission received')

    @patch('exams.views.timezone')
    def test_payload_has_student_email(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.assertIn('student', response.data)
        self.assertEqual(response.data['student'], 'submit@test.com')

    @patch('exams.views.timezone')
    def test_payload_has_exam_date(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.assertIn('exam_date', response.data)
        self.assertEqual(response.data['exam_date'], self.exam_date)

    @patch('exams.views.timezone')
    def test_payload_has_answers_submitted_count(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.assertIn('answers_submitted', response.data)
        self.assertEqual(response.data['answers_submitted'], 3)

    @patch('exams.views.timezone')
    def test_payload_has_created_flag(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.assertIn('created', response.data)
        self.assertTrue(response.data['created'])

    @patch('exams.views.timezone')
    def test_payload_keys_match_spec(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        expected_keys = {'message', 'student', 'exam_date', 'answers_submitted', 'created'}
        self.assertEqual(set(response.data.keys()), expected_keys)

    @patch('exams.views.timezone')
    def test_resubmission_updates_returns_200(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')

        new_answers = {"q1": "D", "q2": "B", "q3": "C", "q4": "A"}
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': new_answers,
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['created'])
        self.assertEqual(response.data['answers_submitted'], 4)

    @patch('exams.views.timezone')
    def test_submission_after_2pm_returns_409(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(14, 1)
        self._auth()
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.assertEqual(response.status_code, 409)
        self.assertIn('detail', response.data)

    @patch('exams.views.timezone')
    def test_missing_exam_date_returns_400(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        response = self.client_obj.post(self.url, {
            'answers': self.answers,
        }, format='json')
        self.assertEqual(response.status_code, 400)

    @patch('exams.views.timezone')
    def test_missing_answers_returns_400(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_unauthenticated_returns_401(self):
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.assertEqual(response.status_code, 401)

    def test_teacher_cannot_submit(self):
        teacher = User.objects.create_user(
            email='teacher_submit@test.com', password='testpass123',
            full_name='Teacher', is_teacher=True,
        )
        self.client_obj.force_authenticate(user=teacher)
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.assertIn(response.status_code, [403, 401])

    @patch('exams.views.timezone')
    def test_dict_answers_count(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        ten_answers = {f'q{i}': 'A' for i in range(1, 11)}
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': ten_answers,
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['answers_submitted'], 10)

    @patch('exams.views.timezone')
    def test_empty_dict_answers_count(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        response = self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': {},
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['answers_submitted'], 0)

    @patch('exams.views.timezone')
    def test_submission_creates_database_record(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.assertTrue(
            StudentSubmission.objects.filter(
                student=self.student, exam_date=self.exam_date
            ).exists()
        )

    @patch('exams.views.timezone')
    def test_one_submission_per_student_per_day(self, mock_tz):
        mock_tz.now.return_value.time.return_value = time(10, 30)
        self._auth()
        self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': self.answers,
        }, format='json')
        self.client_obj.post(self.url, {
            'exam_date': self.exam_date,
            'answers': {"q1": "D"},
        }, format='json')
        self.assertEqual(
            StudentSubmission.objects.filter(
                student=self.student, exam_date=self.exam_date
            ).count(), 1
        )
