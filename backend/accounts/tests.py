from django.test import TestCase
from django.urls import reverse
from unittest.mock import patch
from datetime import datetime, time
from django.contrib.auth import get_user_model

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
        response = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 403)

    @patch('core.permissions.datetime')
    def test_access_at_window_open_1400(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 14, 0, 0)
        token = self.get_token()
        response = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 200)

    @patch('core.permissions.datetime')
    def test_access_inside_window_1630(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 16, 30, 0)
        token = self.get_token()
        response = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 200)

    @patch('core.permissions.datetime')
    def test_access_at_window_close_1859(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 18, 59, 0)
        token = self.get_token()
        response = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 200)

    @patch('core.permissions.datetime')
    def test_access_at_window_close_1900(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 19, 0, 0)
        token = self.get_token()
        response = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 200)

    @patch('core.permissions.datetime')
    def test_access_after_window_1901(self, mock_dt):
        mock_dt.now.return_value = datetime(2026, 6, 18, 19, 1, 0)
        token = self.get_token()
        response = self.client.get(self.url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 403)