from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Inspect the real columns in exams_answerkey table."

    def handle(self, *args, **options):
        cursor = connection.cursor()
        cursor.execute("PRAGMA table_info(exams_answerkey)")
        rows = cursor.fetchall()
        for row in rows:
            self.stdout.write(str(row))