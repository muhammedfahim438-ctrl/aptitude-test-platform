# exams/models.py
from django.db import models
from django.conf import settings


class Question(models.Model):
    """
    One row per question per exam date.
    Field names match exams/cache.py warm_question_cache() exactly
    (owned by SREEKUTTAN, US-R01) so Redis cache warming and the
    pre_save purge signal (US-F03) both work against the same schema.
    """
    exam_date = models.DateField()
    text = models.TextField()
    option_a = models.CharField(max_length=500)
    option_b = models.CharField(max_length=500)
    option_c = models.CharField(max_length=500)
    option_d = models.CharField(max_length=500)
    image_url = models.URLField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['exam_date']),
        ]
        ordering = ['exam_date', 'id']

    def __str__(self):
        return f"Q{self.id} ({self.exam_date}): {self.text[:40]}"


class AnswerKey(models.Model):
    """
    One AnswerKey row per exam date. Used by:
    - pipeline/aggregation.py (US-F01) to score submissions
    - core/permissions.py IsAnswerWindowOpen (US-S04) to gate student-facing reveal
    """
    date = models.DateField(unique=True)
    correct_answers = models.JSONField()
    # e.g. {"q1": "B", "q2": "A", "q3": "C", ...}

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"AnswerKey for {self.date}"


class StudentSubmission(models.Model):
    """
    One row per student per exam date - the answers a student submitted.
    Written by exams/views.py SubmitAnswersView (US-R03) via update_or_create
    on (student, exam_date) for idempotency - re-submitting overwrites instead
    of creating a duplicate row.
    Read by pipeline/aggregation.py (US-F01) to compute scores against AnswerKey.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions',
    )
    exam_date = models.DateField()
    answers = models.JSONField()
    # e.g. {"q1": "A", "q2": "B", "q3": "C", ...}

    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'exam_date'],
                name='unique_student_exam_date_submission',
            )
        ]
        indexes = [
            models.Index(fields=['exam_date']),
        ]
        ordering = ['-exam_date']

    def __str__(self):
        return f"{self.student_id} | {self.exam_date} | submission"
