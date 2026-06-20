# pipeline/aggregation.py
from django.db import transaction
from .models import DailyScore
from exams.models import AnswerKey, StudentSubmission
import csv, os
from django.conf import settings


def aggregate_and_export(exam_date):
    """
    Computes scores for all StudentSubmissions on exam_date by comparing
    against the AnswerKey, writes DailyScore rows, and exports a CSV report.

    MEMORY-SAFE: uses .iterator(chunk_size=500) to stream rows in 500-row
    batches from PostgreSQL rather than loading the full result set into
    RAM — required to stay within Render's 512MB free-tier limit when
    processing up to 2,000 JSON submission rows.
    """
    answer_key = AnswerKey.objects.get(date=exam_date)
    correct = answer_key.correct_answers  # dict: {"q1": "B", "q2": "A", ...}

    submissions = (
        StudentSubmission.objects
        .filter(exam_date=exam_date)
        .select_related('student')
        .iterator(chunk_size=500)
    )

    score_objs = []
    rows = []
    for sub in submissions:
        score = sum(1 for q, ans in sub.answers.items() if correct.get(q) == ans)
        score_objs.append(
            DailyScore(student=sub.student, exam_date=exam_date, score=score)
        )
        rows.append([sub.student.id, sub.student.get_full_name(), score, exam_date])

    with transaction.atomic():
        DailyScore.objects.bulk_create(
            score_objs,
            update_conflicts=True,
            unique_fields=['student', 'exam_date'],
            update_fields=['score']
        )

    export_path = os.path.join(
        settings.MEDIA_ROOT, 'exports', f'Master_Report_{exam_date}.csv'
    )
    os.makedirs(os.path.dirname(export_path), exist_ok=True)
    with open(export_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['student_id', 'name', 'score', 'date'])
        writer.writerows(rows)

    return export_path