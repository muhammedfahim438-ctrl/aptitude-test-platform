# pipeline/signals.py
"""
US-F03 - Intercept Save Pipeline: Stale CSV Purge on New Question Upload.

Fires exactly once per NEW exam_date (the first question committed for
that date) - not once per question row. Uploading 30 questions for the
same date triggers this exactly once, not 30 times.

Ordering guarantee: pre_save runs BEFORE the question row is written,
so the purge always completes before the new question set lands in the DB.
"""
import os
import glob
import logging

from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.conf import settings

from exams.models import Question
from .models import DailyLeaderboard

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Question)
def purge_stale_csv_on_question_upload(sender, instance, **kwargs):
    if not instance._state.adding:
        return  # only fires on new question creation, never on updates

    # Only fire once per new exam_date: if a question already exists for
    # this date, this is the 2nd+ question in the same upload batch - skip.
    already_has_questions_for_date = Question.objects.filter(
        exam_date=instance.exam_date
    ).exists()
    if already_has_questions_for_date:
        return

    export_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
    stale_files = glob.glob(os.path.join(export_dir, 'Master_Report_*.csv'))
    for f in stale_files:
        try:
            os.remove(f)
            logger.warning(f"[INTERCEPT] Stale CSV purged before new question commit: {f}")
        except FileNotFoundError:
            pass

    deleted_count, _ = DailyLeaderboard.objects.all().delete()
    logger.warning(f"[INTERCEPT] DailyLeaderboard flushed: {deleted_count} records removed.")
