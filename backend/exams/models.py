# exams/models.py
from django.db import models
from django.conf import settings


class Question(models.Model):
    exam_date = models.DateField()
    text = models.TextField()
    option_a = models.CharField(max_length=500)
    option_b = models.CharField(max_length=500)
    option_c = models.CharField(max_length=500)
    option_d = models.CharField(max_length=500)
    image_url = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['exam_date'])]
        ordering = ['exam_date', 'id']

    def __str__(self):
        return f"Q{self.id} ({self.exam_date}): {self.text[:40]}"


class AnswerKey(models.Model):
    date = models.DateField(unique=True)
    correct_answers = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"AnswerKey for {self.date}"


class StudentSubmission(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions',
    )
    exam_date = models.DateField()
    answers = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'exam_date'],
                name='unique_student_exam_date_submission',
            )
        ]
        indexes = [models.Index(fields=['exam_date'])]
        ordering = ['-exam_date']

    def __str__(self):
        return f"{self.student_id} | {self.exam_date} | submission"
