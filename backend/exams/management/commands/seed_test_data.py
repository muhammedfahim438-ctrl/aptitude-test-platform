# exams/management/commands/seed_test_data.py
import random
from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from exams.models import Question, AnswerKey, StudentSubmission

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds test Questions + AnswerKey + StudentSubmissions for today, so rankings/reports have real data to show.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            default=str(date.today()),
            help='Exam date to seed (YYYY-MM-DD). Defaults to today.',
        )

    def handle(self, *args, **options):
        exam_date = options['date']

        # --- 1. Create 10 questions for the date (skip if already exist) ---
        existing_count = Question.objects.filter(exam_date=exam_date).count()
        if existing_count == 0:
            options_pool = ['A', 'B', 'C', 'D']
            correct_answers = {}
            for i in range(1, 11):
                Question.objects.create(
                    exam_date=exam_date,
                    text=f"Sample Question {i}: What is {i} + {i}?",
                    option_a=str(i * 2),
                    option_b=str(i * 2 + 1),
                    option_c=str(i * 2 - 1),
                    option_d=str(i * 3),
                    retake_allowed=True,
                )
                correct_answers[f'q{i}'] = 'A'  # option_a is always correct here

            AnswerKey.objects.update_or_create(
                date=exam_date,
                defaults={'correct_answers': correct_answers},
            )
            self.stdout.write(self.style.SUCCESS(f"Created 10 questions + AnswerKey for {exam_date}"))
        else:
            self.stdout.write(f"Questions already exist for {exam_date} ({existing_count} found), skipping creation.")
            answer_key = AnswerKey.objects.filter(date=exam_date).first()
            correct_answers = answer_key.correct_answers if answer_key else {}

        # --- 2. Create submissions for all seeded students ---
        students = User.objects.filter(is_student=True, is_active=True)
        if not students.exists():
            self.stdout.write(self.style.WARNING("No students found. Run 'python manage.py seed_users' first."))
            return

        created_count = 0
        updated_count = 0
        for student in students:
            # Randomly answer each question — sometimes correct, sometimes wrong,
            # so scores vary and rankings look realistic.
            answers = {}
            for q_key in correct_answers.keys():
                if random.random() < 0.7:  # 70% chance of correct answer
                    answers[q_key] = correct_answers[q_key]
                else:
                    answers[q_key] = random.choice(['A', 'B', 'C', 'D'])

            _, created = StudentSubmission.objects.update_or_create(
                student=student,
                exam_date=exam_date,
                defaults={'answers': answers},
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Submissions: {created_count} created, {updated_count} updated for {exam_date}."
        ))