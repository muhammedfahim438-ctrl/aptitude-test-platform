from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase

from exams.models import AnswerKey, Question, StudentSubmission

User = get_user_model()


class StudentRBACRejectionTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email='rbac-student@test.com', password='testpass123',
            full_name='RBAC Student', is_student=True,
        )
        self.teacher = User.objects.create_user(
            email='rbac-teacher@test.com', password='testpass123',
            full_name='RBAC Teacher', is_teacher=True,
        )
        self.exam_date = date(2026, 7, 18)
        self.question = Question.objects.create(
            exam_date=self.exam_date,
            text='Test question?',
            option_a='A', option_b='B', option_c='C', option_d='D',
        )
        self.student_token = self.client.post('/api/auth/login/', {
            'email': 'rbac-student@test.com', 'password': 'testpass123',
        }, content_type='application/json').data['access']
        self.teacher_token = self.client.post('/api/auth/login/', {
            'email': 'rbac-teacher@test.com', 'password': 'testpass123',
        }, content_type='application/json').data['access']
        self.auth_student = {'HTTP_AUTHORIZATION': f'Bearer {self.student_token}'}
        self.auth_teacher = {'HTTP_AUTHORIZATION': f'Bearer {self.teacher_token}'}

    def test_student_rejected_questions_list(self):
        response = self.client.get('/api/admin/questions/', **self.auth_student)
        self.assertEqual(response.status_code, 403)

    def test_student_rejected_question_detail(self):
        response = self.client.get(
            f'/api/admin/questions/{self.question.id}/', **self.auth_student,
        )
        self.assertEqual(response.status_code, 403)

    def test_student_rejected_question_patch(self):
        response = self.client.patch(
            f'/api/admin/questions/{self.question.id}/',
            {'text': 'Hacked question?'},
            content_type='application/json',
            **self.auth_student,
        )
        self.assertEqual(response.status_code, 403)

    def test_student_rejected_dashboard_stats(self):
        response = self.client.get('/api/admin/dashboard-stats/', **self.auth_student)
        self.assertEqual(response.status_code, 403)

    def test_student_rejected_rankings(self):
        response = self.client.get('/api/admin/rankings/', **self.auth_student)
        self.assertEqual(response.status_code, 403)

    def test_student_rejected_reports(self):
        response = self.client.get('/api/admin/reports/', **self.auth_student)
        self.assertEqual(response.status_code, 403)

    def test_teacher_accesses_question_list(self):
        response = self.client.get('/api/admin/questions/', **self.auth_teacher)
        self.assertEqual(response.status_code, 200)
