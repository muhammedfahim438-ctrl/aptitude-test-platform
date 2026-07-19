"""
pipeline/tests/test_department_and_migration.py

Tests to verify the CustomUser department field exists and the
MonthlyLeaderboard model is properly configured in the schema.
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.db import connection

User = get_user_model()


class DepartmentFieldTest(TestCase):
    def test_department_field_exists_on_customuser(self):
        field = User._meta.get_field('department')
        self.assertIsNotNone(field)
        self.assertEqual(field.max_length, 150)
        self.assertTrue(field.blank)

    def test_department_defaults_to_empty_string(self):
        user = User.objects.create_user(
            email='dept@test.com', password='test1234',
            full_name='Dept Test', is_student=True,
        )
        self.assertEqual(user.department, '')

    def test_department_can_be_set(self):
        user = User.objects.create_user(
            email='dept2@test.com', password='test1234',
            full_name='Dept Two', is_student=True,
            department='B.Com Computer Applications',
        )
        self.assertEqual(user.department, 'B.Com Computer Applications')

    def test_department_persists_on_save(self):
        user = User.objects.create_user(
            email='dept3@test.com', password='test1234',
            full_name='Dept Three', is_student=True,
        )
        user.department = 'B.Sc Computer Science'
        user.save()
        user.refresh_from_db()
        self.assertEqual(user.department, 'B.Sc Computer Science')

    def test_department_in_database_column(self):
        with connection.cursor() as cursor:
            cursor.execute("PRAGMA table_info(accounts_customuser)")
            columns = [row[1] for row in cursor.fetchall()]
        self.assertIn('department', columns)


class MonthlyLeaderboardSchemaTest(TestCase):
    def test_model_has_expected_fields(self):
        from pipeline.models import MonthlyLeaderboard
        expected_fields = {'id', 'student', 'month_start', 'total_score', 'rank', 'created_at'}
        actual_fields = {f.name for f in MonthlyLeaderboard._meta.get_fields()}
        self.assertTrue(expected_fields.issubset(actual_fields), f"Missing fields: {expected_fields - actual_fields}")

    def test_month_start_index_exists(self):
        from pipeline.models import MonthlyLeaderboard
        index_names = [idx.name for idx in MonthlyLeaderboard._meta.indexes]
        self.assertTrue(len(index_names) > 0, f"Expected indexes on MonthlyLeaderboard, got: {index_names}")

    def test_related_name_on_user(self):
        from pipeline.models import MonthlyLeaderboard
        field = MonthlyLeaderboard._meta.get_field('student')
        self.assertEqual(field.remote_field.related_name, 'monthly_leaderboard_entries')

    def test_ordering(self):
        from pipeline.models import MonthlyLeaderboard
        self.assertEqual(MonthlyLeaderboard._meta.ordering, ['month_start', 'rank'])
