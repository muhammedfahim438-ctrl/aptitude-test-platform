# pipeline/aggregation.py
"""
Core scoring engine (US-F01).

Compares each StudentSubmission.answers against the AnswerKey.correct_answers
for a given exam date, writes DailyScore rows, and exports a
Master_Report_<date>.csv file to MEDIA_ROOT/exports/.

Memory safety: uses .iterator(chunk_size=500) instead of .all() so that
2,000 JSON submission rows never sit fully in RAM at once.
"""
import csv
import os

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from exams.models import AnswerKey, StudentSubmission
from pipeline.models import DailyScore


def aggregate_and_export(exam_date):
    answer_key = AnswerKey.objects.get(date=exam_date)
    correct = answer_key.correct_answers

    submissions = (
        StudentSubmission.objects
        .filter(exam_date=exam_date)
        .select_related('student')
        .iterator(chunk_size=500)
    )

    score_objs = []
    student_rows = []

    for sub in submissions:
        score = sum(1 for q, ans in sub.answers.items() if correct.get(q) == ans)
        score_objs.append(
            DailyScore(student=sub.student, exam_date=exam_date, score=score)
        )
        student_rows.append(
            (sub.student.id, sub.student.full_name, score)
        )

    with transaction.atomic():
        DailyScore.objects.bulk_create(
            score_objs,
            update_conflicts=True,
            unique_fields=['student', 'exam_date'],
            update_fields=['score'],
        )

    student_rows.sort(key=lambda row: row[2], reverse=True)

    export_timestamp = timezone.now().isoformat()
    ranked_rows = []
    prev_score = None
    prev_rank = 0
    for i, (student_id, name, score) in enumerate(student_rows, start=1):
        if score != prev_score:
            prev_rank = i
            prev_score = score
        ranked_rows.append([student_id, name, score, prev_rank, export_timestamp])

    export_path = os.path.join(
        settings.MEDIA_ROOT, 'exports', f'Master_Report_{exam_date}.csv'
    )
    os.makedirs(os.path.dirname(export_path), exist_ok=True)
    with open(export_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['student_id', 'name', 'score', 'rank', 'timestamp'])
        writer.writerows(ranked_rows)

    return export_path
