from datetime import date

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

from exams.models import AnswerKey, Question, StudentSubmission

User = get_user_model()


class DataIntegrityTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email='integrity@test.com', password='testpass123',
            full_name='Integrity Student', is_student=True,
        )
        self.exam_date = date(2026, 7, 18)
        self.answer_key = AnswerKey.objects.create(
            date=self.exam_date,
            correct_answers={'q1': 'A', 'q2': 'B'},
        )
        StudentSubmission.objects.create(
            student=self.student, exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'C'},
        )

    def test_duplicate_submission_raises(self):
        with self.assertRaises(IntegrityError):
            StudentSubmission.objects.create(
                student=self.student, exam_date=self.exam_date,
                answers={'q1': 'B', 'q2': 'A'},
            )

    def test_duplicate_answer_key_raises(self):
        with self.assertRaises(IntegrityError):
            AnswerKey.objects.create(
                date=self.exam_date,
                correct_answers={'q1': 'C', 'q2': 'D'},
            )

    def test_question_allows_duplicate_text(self):
        q1 = Question.objects.create(
            exam_date=date(2026, 7, 18),
            text='What is 2+2?',
            option_a='3', option_b='4', option_c='5', option_d='6',
        )
        q2 = Question.objects.create(
            exam_date=date(2026, 7, 19),
            text='What is 2+2?',
            option_a='3', option_b='4', option_c='5', option_d='6',
        )
        self.assertNotEqual(q1.id, q2.id)
        self.assertEqual(Question.objects.filter(text='What is 2+2?').count(), 2)

    def test_different_student_same_date_allowed(self):
        other_student = User.objects.create_user(
            email='other@test.com', password='testpass123',
            full_name='Other Student', is_student=True,
        )
        sub = StudentSubmission.objects.create(
            student=other_student, exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'B'},
        )
        self.assertIsNotNone(sub.id)

    def test_answer_key_json_field_accepts_dict(self):
        key = AnswerKey.objects.create(
            date=date(2026, 7, 19),
            correct_answers={'q1': 'A', 'q2': 'B', 'q3': 'C', 'q4': 'D'},
        )
        self.assertEqual(len(key.correct_answers), 4)
        self.assertEqual(key.correct_answers['q1'], 'A')
