from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone


class Command(BaseCommand):
    help = "Add missing created_at/updated_at columns to exams_answerkey."

    def handle(self, *args, **options):
        cursor = connection.cursor()

        cursor.execute("PRAGMA table_info(exams_answerkey)")
        existing_columns = [row[1] for row in cursor.fetchall()]

        if 'created_at' not in existing_columns:
            cursor.execute(
                "ALTER TABLE exams_answerkey ADD COLUMN created_at datetime"
            )
            self.stdout.write(self.style.SUCCESS("Added created_at column."))
        else:
            self.stdout.write("created_at already exists.")

        if 'updated_at' not in existing_columns:
            cursor.execute(
                "ALTER TABLE exams_answerkey ADD COLUMN updated_at datetime"
            )
            self.stdout.write(self.style.SUCCESS("Added updated_at column."))
        else:
            self.stdout.write("updated_at already exists.")

        # Backfill existing rows with current timestamp.
        # Value is trusted (generated here, not user input), so it's safe
        # to embed directly and sidestep the debug-logging crash we hit
        # with parameterized execute() on this environment.
        now = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute(f"UPDATE exams_answerkey SET created_at = '{now}' WHERE created_at IS NULL")
        cursor.execute(f"UPDATE exams_answerkey SET updated_at = '{now}' WHERE updated_at IS NULL")
        self.stdout.write(self.style.SUCCESS("Backfilled existing rows."))