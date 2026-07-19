import csv
import os
import tempfile
from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from exams.models import AnswerKey, StudentSubmission
from pipeline.aggregation import aggregate_and_export

User = get_user_model()


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class CSVExportQualityTest(TestCase):
    def setUp(self):
        self.exam_date = date(2026, 7, 18)
        self.answer_key = AnswerKey.objects.create(
            date=self.exam_date,
            correct_answers={'q1': 'A', 'q2': 'B', 'q3': 'C'},
        )

    def _create_student(self, email, full_name, department=''):
        return User.objects.create_user(
            email=email, password='testpass123',
            full_name=full_name, is_student=True,
            department=department,
        )

    def test_csv_utf8_encoding(self):
        student = self._create_student('utf8@test.com', 'UTF8 Student')
        StudentSubmission.objects.create(
            student=student, exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'B', 'q3': 'C'},
        )
        path = aggregate_and_export(self.exam_date)
        with open(path, encoding='utf-8') as f:
            content = f.read()
        self.assertIn('UTF8 Student', content)

    def test_csv_unicode_student_names(self):
        student1 = self._create_student('jose@test.com', 'José García')
        student2 = self._create_student('zhang@test.com', '张三')
        StudentSubmission.objects.create(
            student=student1, exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'B', 'q3': 'C'},
        )
        StudentSubmission.objects.create(
            student=student2, exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'B', 'q3': 'C'},
        )
        path = aggregate_and_export(self.exam_date)
        with open(path, encoding='utf-8') as f:
            content = f.read()
        self.assertIn('José García', content)
        self.assertIn('张三', content)

    def test_csv_special_chars_in_answers(self):
        student = self._create_student('special@test.com', 'Comma,Name')
        StudentSubmission.objects.create(
            student=student, exam_date=self.exam_date,
            answers={'q1': 'A,"B"', 'q2': 'C', 'q3': 'D'},
        )
        path = aggregate_and_export(self.exam_date)
        with open(path, encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        self.assertEqual(len(rows), 2)

    def test_csv_valid_structure(self):
        student = self._create_student('struct@test.com', 'Struct Student', 'CSE')
        StudentSubmission.objects.create(
            student=student, exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'B', 'q3': 'C'},
        )
        path = aggregate_and_export(self.exam_date)
        with open(path, encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        header = rows[0]
        self.assertEqual(header, ['student_id', 'name', 'score', 'rank', 'timestamp', 'department'])
        self.assertEqual(len(rows), 2)

    def test_csv_department_column_present(self):
        student = self._create_student('dept@test.com', 'Dept Student', 'BCA')
        StudentSubmission.objects.create(
            student=student, exam_date=self.exam_date,
            answers={'q1': 'A', 'q2': 'B', 'q3': 'C'},
        )
        path = aggregate_and_export(self.exam_date)
        with open(path, encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        data_row = rows[1]
        self.assertEqual(data_row[5], 'BCA')
