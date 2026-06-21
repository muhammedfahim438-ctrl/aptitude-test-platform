from django.db import models
from django.conf import settings


class DailyScore(models.Model):
    """
    Raw, finalized score for a single student on a single exam date.
    Written by the aggregation engine (pipeline/aggregation.py) via
    bulk_create(update_conflicts=True) - re-running aggregation for the
    same date overwrites the score instead of creating duplicate rows.

    NOTE: This model intentionally does NOT store rank. Rank is a derived/
    computed value and belongs on a separate leaderboard model so that
    DailyScore stays a clean, normalized source of truth.
    """
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
        indexes = [
            models.Index(fields=['exam_date']),
        ]
        ordering = ['-exam_date', '-score']

    def __str__(self):
        return f"{self.student_id} | {self.exam_date} | score={self.score}"


class DailyLeaderboard(models.Model):
    """
    Ranked leaderboard snapshot for a given exam date.
    Flushed (deleted) by pipeline/signals.py whenever a NEW exam date's
    first question is uploaded (US-F03), so stale rankings never persist
    into a fresh exam cycle.
    """
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
        indexes = [
            models.Index(fields=['exam_date', 'rank']),
        ]
        ordering = ['exam_date', 'rank']

    def __str__(self):
        return f"{self.exam_date} | rank={self.rank} | {self.student_id}"


class WeeklyLeaderboard(models.Model):
    """
    Ranked leaderboard aggregated across a week.
    Flushed by US-F04's flush_weekly_leaderboard command/endpoint
    (Tuesday 12 PM, 36 hrs after week start) and recomputed by
    compute_weekly_leaderboard (Friday 11:59 PM).
    """
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
        indexes = [
            models.Index(fields=['week_start', 'rank']),
        ]
        ordering = ['week_start', 'rank']

    def __str__(self):
        return f"Week of {self.week_start} | rank={self.rank} | {self.student_id}"


class ScheduledFileDeletion(models.Model):
    """
    Persists file deletion schedule in the database.
    Survives Render worker restarts - no threading.Timer required.
    Processed by the `process_deletions` management command, triggered
    every 15 minutes via cron-job.org.
    """
    file_path = models.CharField(max_length=500)
    delete_after = models.DateTimeField()
    deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['delete_after', 'deleted'])]

    def __str__(self):
        return f"{self.file_path} -> delete after {self.delete_after}"


class ReportDownloadLog(models.Model):
    """
    Audit trail: records every time an admin downloads a Master_Report CSV,
    separate from the deletion schedule itself. Useful for tracing who/when
    sensitive data was accessed even after the file is deleted.
    """
    file_path = models.CharField(max_length=500)
    downloaded_at = models.DateTimeField()
    scheduled_deletion_at = models.DateTimeField()

    def __str__(self):
        return f"Downloaded {self.file_path} at {self.downloaded_at}"
