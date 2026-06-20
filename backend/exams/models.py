# exams/models.py
from django.db import models


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