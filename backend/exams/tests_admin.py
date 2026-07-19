import csv
import json
import os
from datetime import date

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.conf import settings

from exams.models import AnswerKey, Question
from pipeline.aggregation import aggregate_and_export
from pipeline.models import DailyScore

User = get_user_model()


def _make_teacher(email='teacher@test.com'):
    return User.objects.create_user(
        email=email, password='testpass123',
        full_name='Test Teacher', is_teacher=True,
    )


def _auth_header(client, email='teacher@test.com', password='testpass123'):
    resp = client.post('/api/auth/login/', {
        'email': email, 'password': password,
    }, content_type='application/json')
    return {'HTTP_AUTHORIZATION': f'Bearer {resp.data["access"]}'}


def _make_question_payload(n=10, **overrides):
    rows = []
    for i in range(n):
        row = {
            'text': f'Question {i+1} text',
            'option_a': f'A{i+1}',
            'option_b': f'B{i+1}',
            'option_c': f'C{i+1}',
            'option_d': f'D{i+1}',
            'correct_answer': 'A',
        }
        row.update(overrides)
        rows.append(row)
    return rows


class UploadQuestionsTest(TestCase):
    def setUp(self):
        self.teacher = _make_teacher()
        self.auth = _auth_header(self.client)
        self.url = '/api/admin/upload-questions/'

    def _upload(self, questions, date_str='2026-07-20'):
        data = {
            'date': date_str,
            'questions': json.dumps(questions),
        }
        return self.client.post(self.url, data, **self.auth)

    def test_upload_exactly_10_succeeds(self):
        resp = self._upload(_make_question_payload(10))
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['questions_created'], 10)
        self.assertEqual(Question.objects.filter(exam_date='2026-07-20').count(), 10)
        self.assertTrue(AnswerKey.objects.filter(date='2026-07-20').exists())

    def test_upload_wrong_count_rejected(self):
        resp = self._upload(_make_question_payload(5))
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Exactly 10', resp.data['error'])

    def test_upload_11_rejected(self):
        resp = self._upload(_make_question_payload(11))
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Exactly 10', resp.data['error'])

    def test_upload_missing_date_rejected(self):
        data = {'questions': json.dumps(_make_question_payload(10))}
        resp = self.client.post(self.url, data, **self.auth)
        self.assertEqual(resp.status_code, 400)

    def test_upload_invalid_answer_rejected(self):
        questions = _make_question_payload(10, correct_answer='X')
        resp = self._upload(questions)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('invalid correct_answer', resp.data['error'])

    def test_upload_missing_text_rejected(self):
        questions = _make_question_payload(10)
        questions[0]['text'] = ''
        resp = self._upload(questions)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('missing required fields', resp.data['error'])

    def test_upload_requires_teacher_role(self):
        student = User.objects.create_user(
            email='s@t.com', password='testpass123',
            full_name='S', is_student=True,
        )
        student_auth = _auth_header(self.client, 's@t.com')
        resp = self.client.post(
            self.url,
            {'date': '2026-07-20', 'questions': json.dumps(_make_question_payload(10))},
            **student_auth,
        )
        self.assertEqual(resp.status_code, 403)


class AdminQuestionEditTest(TestCase):
    def setUp(self):
        self.teacher = _make_teacher()
        self.auth = _auth_header(self.client)
        self.question = Question.objects.create(
            exam_date=date(2026, 7, 20),
            text='Original question',
            option_a='A1', option_b='B1', option_c='C1', option_d='D1',
        )

    def _url(self, qid=None):
        return f'/api/admin/questions/{qid or self.question.id}/'

    def test_patch_text_persists(self):
        resp = self.client.patch(
            self._url(),
            {'text': 'Updated question text'},
            content_type='application/json',
            **self.auth,
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['text'], 'Updated question text')
        self.question.refresh_from_db()
        self.assertEqual(self.question.text, 'Updated question text')

    def test_patch_options_persists(self):
        resp = self.client.patch(
            self._url(),
            {'option_a': 'NEW_A', 'option_d': 'NEW_D'},
            content_type='application/json',
            **self.auth,
        )
        self.assertEqual(resp.status_code, 200)
        self.question.refresh_from_db()
        self.assertEqual(self.question.option_a, 'NEW_A')
        self.assertEqual(self.question.option_d, 'NEW_D')

    def test_put_full_update_persists(self):
        payload = {
            'text': 'Full replace',
            'option_a': 'FA', 'option_b': 'FB',
            'option_c': 'FC', 'option_d': 'FD',
            'image_url': 'https://example.com/img.png',
            'retake_allowed': False,
        }
        resp = self.client.put(
            self._url(),
            payload,
            content_type='application/json',
            **self.auth,
        )
        self.assertEqual(resp.status_code, 200)
        self.question.refresh_from_db()
        self.assertEqual(self.question.text, 'Full replace')
        self.assertEqual(self.question.image_url, 'https://example.com/img.png')
        self.assertFalse(self.question.retake_allowed)

    def test_patch_nonexistent_returns_404(self):
        resp = self.client.patch(
            self._url(99999),
            {'text': 'nope'},
            content_type='application/json',
            **self.auth,
        )
        self.assertEqual(resp.status_code, 404)

    def test_put_nonexistent_returns_404(self):
        resp = self.client.put(
            self._url(99999),
            {'text': 'nope', 'option_a': 'a', 'option_b': 'b', 'option_c': 'c', 'option_d': 'd'},
            content_type='application/json',
            **self.auth,
        )
        self.assertEqual(resp.status_code, 404)


class CSVExportDepartmentTest(TestCase):
    def setUp(self):
        self.exam_date = date(2026, 7, 21)
        self.student = User.objects.create_user(
            email='s@test.com', password='testpass123',
            full_name='Dept Student', is_student=True,
            department='Computer Science',
        )
        AnswerKey.objects.create(
            date=self.exam_date,
            correct_answers={'q1': 'A', 'q2': 'B'},
        )

    @override_settings(MEDIA_ROOT=os.path.join(settings.BASE_DIR, 'test_media'))
    def test_csv_contains_department_column(self):
        from exams.models import StudentSubmission
        StudentSubmission.objects.create(
            student=self.student,
            exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'C'},
        )
        export_path = aggregate_and_export(self.exam_date)
        try:
            with open(export_path, 'r') as f:
                reader = csv.reader(f)
                header = next(reader)
                self.assertIn('department', header)
                dept_idx = header.index('department')
                first_row = next(reader)
                self.assertEqual(first_row[dept_idx], 'Computer Science')
        finally:
            os.remove(export_path)
            os.rmdir(os.path.dirname(export_path))

    @override_settings(MEDIA_ROOT=os.path.join(settings.BASE_DIR, 'test_media'))
    def test_csv_contains_score_column(self):
        from exams.models import StudentSubmission
        StudentSubmission.objects.create(
            student=self.student,
            exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'C'},
        )
        export_path = aggregate_and_export(self.exam_date)
        try:
            with open(export_path, 'r') as f:
                reader = csv.reader(f)
                header = next(reader)
                self.assertIn('score', header)
                score_idx = header.index('score')
                first_row = next(reader)
                self.assertEqual(first_row[score_idx], '1')
        finally:
            os.remove(export_path)
            os.rmdir(os.path.dirname(export_path))

    @override_settings(MEDIA_ROOT=os.path.join(settings.BASE_DIR, 'test_media'))
    def test_csv_student_name_matches_full_name(self):
        from exams.models import StudentSubmission
        StudentSubmission.objects.create(
            student=self.student,
            exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'A'},
        )
        export_path = aggregate_and_export(self.exam_date)
        try:
            with open(export_path, 'r') as f:
                reader = csv.reader(f)
                header = next(reader)
                name_idx = header.index('name')
                first_row = next(reader)
                self.assertEqual(first_row[name_idx], 'Dept Student')
        finally:
            os.remove(export_path)
            os.rmdir(os.path.dirname(export_path))
