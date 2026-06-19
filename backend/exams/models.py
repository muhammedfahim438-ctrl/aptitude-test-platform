from django.db import models


class AnswerKey(models.Model):
    date            = models.DateField(unique=True)
    correct_answers = models.JSONField()
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"AnswerKey for {self.date}"