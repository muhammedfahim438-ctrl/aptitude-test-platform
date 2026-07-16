# pipeline/views.py
import os
import logging
from datetime import timedelta

from django.conf import settings
from django.http import FileResponse, HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import ScheduledFileDeletion, ReportDownloadLog, WeeklyLeaderboard

logger = logging.getLogger(__name__)


def admin_download_report(request, exam_date):
    filepath = os.path.join(
        settings.MEDIA_ROOT, 'exports', f'Master_Report_{exam_date}.csv'
    )
    if not os.path.exists(filepath):
        return HttpResponse("Report not yet generated.", status=404)

    delete_at = timezone.now() + timedelta(hours=4)

    ReportDownloadLog.objects.create(
        file_path=filepath,
        downloaded_at=timezone.now(),
        scheduled_deletion_at=delete_at,
    )
    ScheduledFileDeletion.objects.create(
        file_path=filepath,
        delete_after=delete_at,
    )
    logger.info(f"[SCHEDULE] CSV deletion scheduled at {delete_at}: {filepath}")

    return FileResponse(
        open(filepath, 'rb'),
        as_attachment=True,
        filename=f'Master_Report_{exam_date}.csv'
    )


@csrf_exempt
def process_scheduled_deletions(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    due_records = ScheduledFileDeletion.objects.filter(
        delete_after__lte=timezone.now(),
        deleted=False,
    )
    deleted_count = 0
    for record in due_records:
        try:
            os.remove(record.file_path)
            logger.info(f"[CRON] CSV deleted: {record.file_path}")
        except FileNotFoundError:
            logger.warning(f"[CRON] File already gone: {record.file_path}")
        record.deleted = True
        record.save(update_fields=['deleted'])
        deleted_count += 1

    return JsonResponse({'status': 'processed', 'deleted': deleted_count})


@csrf_exempt
def flush_weekly_leaderboard_view(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    deleted_count, _ = WeeklyLeaderboard.objects.all().delete()
    return JsonResponse({'status': 'flushed', 'deleted': deleted_count})


@csrf_exempt
def compute_weekly_leaderboard_view(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    from django.core.management import call_command
    call_command('compute_weekly_leaderboard')
    return JsonResponse({'status': 'computed'})
