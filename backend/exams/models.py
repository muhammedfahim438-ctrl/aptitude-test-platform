from django.db import models
from django.conf import settings


class AnswerKey(models.Model):
    date            = models.DateField(unique=True)
    correct_answers = models.JSONField()
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"AnswerKey for {self.date}"


class StudentSubmission(models.Model):
    student      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    exam_date    = models.DateField()
    answers      = models.JSONField()
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'exam_date')
        indexes = [models.Index(fields=['exam_date'])]

    def __str__(self):
        return f"{self.student.email} — {self.exam_date}"