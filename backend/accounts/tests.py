from django.test import TestCase
from unittest.mock import patch
from datetime import datetime
from django.contrib.auth import get_user_model
from exams.models import AnswerKey

User = get_user_model()


class AnswerKeyTimeGateTest(TestCase):

    def setUp(self):
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            full_name='Test Student',
            is_student=True,
        )
        self.url = '/api/tests/answers/'

        AnswerKey.objects.create(
            date='2026-06-18',
            correct_answers={"q1": "A", "q2": "B", "q3": "C"}
        )

    def get_token(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'student@test.com',
            'password': 'testpass123',
        }, content_type='application/json')
        return response.data['access']

    @patch('core.permissions.datetime')
    def test_access_before_window_1359(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 13, 59, 0)
        token = self.get_token()
        response = self.client.get(
            self.url + '?date=2026-06-18',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, 403)

    @patch('core.permissions.datetime')
    def test_access_at_window_open_1400(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 14, 0, 0)
        token = self.get_token()
        response = self.client.get(
            self.url + '?date=2026-06-18',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, 200)

    @patch('core.permissions.datetime')
    def test_access_inside_window_1630(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 16, 30, 0)
        token = self.get_token()
        response = self.client.get(
            self.url + '?date=2026-06-18',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, 200)

    @patch('core.permissions.datetime')
    def test_access_at_window_close_1859(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 18, 59, 0)
        token = self.get_token()
        response = self.client.get(
            self.url + '?date=2026-06-18',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, 200)

    @patch('core.permissions.datetime')
    def test_access_at_window_close_1900(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 19, 0, 0)
        token = self.get_token()
        response = self.client.get(
            self.url + '?date=2026-06-18',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, 200)

    @patch('core.permissions.datetime')
    def test_access_after_window_1901(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 19, 1, 0)
        token = self.get_token()
        response = self.client.get(
            self.url + '?date=2026-06-18',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, 403)


class LoginEndpointTest(TestCase):

    def setUp(self):
        self.active_student = User.objects.create_user(
            email='active@test.com',
            password='testpass123',
            full_name='Active Student',
            is_student=True,
            is_active=True,
        )
        self.inactive_student = User.objects.create_user(
            email='inactive@test.com',
            password='testpass123',
            full_name='Inactive Student',
            is_student=True,
            is_active=False,
        )
        self.url = '/api/auth/login/'

    def test_login_success(self):
        response = self.client.post(self.url, {
            'email': 'active@test.com',
            'password': 'testpass123',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password(self):
        response = self.client.post(self.url, {
            'email': 'active@test.com',
            'password': 'wrongpassword',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_login_wrong_email(self):
        response = self.client.post(self.url, {
            'email': 'wrong@test.com',
            'password': 'testpass123',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_login_missing_email(self):
        response = self.client.post(self.url, {
            'password': 'testpass123',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_login_missing_password(self):
        response = self.client.post(self.url, {
            'email': 'active@test.com',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_login_invalid_email_format(self):
        response = self.client.post(self.url, {
            'email': 'notanemail',
            'password': 'testpass123',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_login_inactive_user(self):
        response = self.client.post(self.url, {
            'email': 'inactive@test.com',
            'password': 'testpass123',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_login_token_contains_role(self):
        response = self.client.post(self.url, {
            'email': 'active@test.com',
            'password': 'testpass123',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['user']['is_student'])
        self.assertFalse(response.data['user']['is_teacher'])