# pipeline/models.py
from django.db import models
from django.conf import settings


class DailyScore(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='daily_scores',
    )
    exam_date = models.DateField()
    score = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'exam_date'],
                name='unique_student_exam_date_score',
            )
        ]
        indexes = [models.Index(fields=['exam_date'])]
        ordering = ['-exam_date', '-score']

    def __str__(self):
        return f"{self.student_id} | {self.exam_date} | score={self.score}"


class DailyLeaderboard(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='daily_leaderboard_entries',
    )
    exam_date = models.DateField()
    score = models.PositiveSmallIntegerField()
    rank = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['exam_date', 'rank'])]
        ordering = ['exam_date', 'rank']

    def __str__(self):
        return f"{self.exam_date} | rank={self.rank} | {self.student_id}"


class WeeklyLeaderboard(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weekly_leaderboard_entries',
    )
    week_start = models.DateField()
    total_score = models.PositiveIntegerField()
    rank = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['week_start', 'rank'])]
        ordering = ['week_start', 'rank']

    def __str__(self):
        return f"Week of {self.week_start} | rank={self.rank} | {self.student_id}"


class ScheduledFileDeletion(models.Model):
    file_path = models.CharField(max_length=500)
    delete_after = models.DateTimeField()
    deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['delete_after', 'deleted'])]

    def __str__(self):
        return f"{self.file_path} -> delete after {self.delete_after}"


class ReportDownloadLog(models.Model):
    file_path = models.CharField(max_length=500)
    downloaded_at = models.DateTimeField()
    scheduled_deletion_at = models.DateTimeField()

    def __str__(self):
        return f"Downloaded {self.file_path} at {self.downloaded_at}"
