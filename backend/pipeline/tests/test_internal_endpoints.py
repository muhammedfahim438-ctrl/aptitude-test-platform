import json
from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from exams.models import AnswerKey, StudentSubmission
from pipeline.models import DailyScore

User = get_user_model()

TEST_CRON_SECRET = 'test-cron-secret-123'


@override_settings(CRON_SECRET_KEY=TEST_CRON_SECRET)
class AggregateScoresEndpointTest(TestCase):
    def setUp(self):
        self.url = '/api/internal/aggregate-scores/'
        self.exam_date = date(2026, 7, 18)
        self.student = User.objects.create_user(
            email='agg@test.com', password='testpass123',
            full_name='Agg Student', is_student=True,
        )
        AnswerKey.objects.create(
            date=self.exam_date,
            correct_answers={'q1': 'A', 'q2': 'B', 'q3': 'C'},
        )
        StudentSubmission.objects.create(
            student=self.student, exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'B', 'q3': 'X'},
        )

    def test_aggregate_scores_success(self):
        response = self.client.post(
            self.url, {'date': str(self.exam_date)},
            HTTP_X_CRON_SECRET=TEST_CRON_SECRET,
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'aggregated')
        self.assertEqual(data['date'], str(self.exam_date))

    def test_aggregate_scores_wrong_secret(self):
        response = self.client.post(
            self.url, {'date': str(self.exam_date)},
            HTTP_X_CRON_SECRET='wrong-secret',
        )
        self.assertEqual(response.status_code, 403)

    def test_aggregate_scores_missing_secret(self):
        response = self.client.post(self.url, {'date': str(self.exam_date)})
        self.assertEqual(response.status_code, 403)

    def test_aggregate_scores_without_date_returns_error(self):
        self.client.raise_request_exception = False
        response = self.client.post(
            self.url, HTTP_X_CRON_SECRET=TEST_CRON_SECRET,
        )
        self.assertEqual(response.status_code, 500)

    def test_aggregate_scores_creates_daily_scores(self):
        self.client.post(
            self.url, {'date': str(self.exam_date)},
            HTTP_X_CRON_SECRET=TEST_CRON_SECRET,
        )
        scores = DailyScore.objects.filter(
            student=self.student, exam_date=self.exam_date,
        )
        self.assertEqual(scores.count(), 1)
        self.assertEqual(scores.first().score, 2)

    def test_aggregate_scores_get_not_allowed(self):
        response = self.client.get(
            self.url, HTTP_X_CRON_SECRET=TEST_CRON_SECRET,
        )
        self.assertEqual(response.status_code, 405)
