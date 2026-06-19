# exams/models.py
# TODO: Owner = SREEKUTTAN + FAHIM (shared, per repo file map)
#
# Required models per the implementation kit:
#   - Question        (text, option_a-d, image_url, exam_date)
#   - AnswerKey        (date, correct_answers JSONField)
#   - StudentSubmission (student FK, exam_date, answers JSONField)
#
# cache.py and views.py in this app already reference Question and
# StudentSubmission — those imports will fail until this file is filled in.

from django.db import models
from django.conf import settings


class Question(models.Model):
    """TODO: confirm exact fields against US-F03 signal + US-R01 cache.py usage."""
    exam_date = models.DateField()
    text = models.TextField()
    option_a = models.CharField(max_length=500)
    option_b = models.CharField(max_length=500)
    option_c = models.CharField(max_length=500)
    option_d = models.CharField(max_length=500)
    image_url = models.URLField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=['exam_date'])]


class AnswerKey(models.Model):
    """TODO: confirm field types — aggregation.py expects correct_answers as dict."""
    date = models.DateField(unique=True)
    correct_answers = models.JSONField()  # e.g. {"q1": "B", "q2": "A", ...}


class StudentSubmission(models.Model):
    """TODO: confirm unique_together / constraints needed for update_or_create idempotency (US-R03)."""
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    exam_date = models.DateField()
    answers = models.JSONField()
    submitted_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'exam_date')
