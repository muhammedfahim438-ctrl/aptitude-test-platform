# exams/views.py — Question Read Endpoint (Redis cache-first)
import logging
from datetime import datetime, time

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .cache import get_questions_cached, warm_question_cache
from .models import Question

logger = logging.getLogger(__name__)


class GetExamQuestionsView(APIView):
    """
    GET /api/tests/questions/?date=YYYY-MM-DD

    During the 10 AM–2 PM exam window, this serves from Redis ONLY
    (Constraint 2 — hard rule, no exceptions). If Redis misses during
    that window, we do NOT fall back to Postgres — with 2,000 students
    hitting this endpoint simultaneously, an uncached DB fallback would
    exhaust the PgBouncer pool instantly. We return 503 instead and let
    the ops team (cron monitoring / manual warm-cache trigger) fix the
    root cause.

    Outside the exam window, a normal DB fallback + cache repopulate is
    fine since traffic is low (teacher previews, off-hours checks, etc).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        exam_date = request.query_params.get('date')
        if not exam_date:
            return Response(
                {'error': 'date query param is required (YYYY-MM-DD).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = datetime.now().time()
        is_exam_window = time(10, 0) <= now <= time(14, 0)

        # 1. Try Redis first — always.
        cached = get_questions_cached(exam_date)
        if cached is not None:
            logger.info(f"[CACHE HIT] questions for {exam_date}")
            return Response({'questions': cached, 'source': 'cache'})

        # 2. Cache miss during exam window — DO NOT touch Postgres.
        #    Fail loud and fast with 503 so the cron/alerting layer can
        #    react, rather than silently hammering the DB pool.
        if is_exam_window:
            logger.error(
                f"[CACHE MISS DURING EXAM WINDOW] date={exam_date} — "
                f"refusing DB fallback to protect PgBouncer pool. "
                f"Trigger warm_question_cache manually or check cron logs."
            )
            return Response(
                {
                    'error': 'Questions are temporarily unavailable. Please retry shortly.',
                    'retry_after_seconds': 5,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # 3. Outside exam window — safe to fall back to DB and repopulate,
        #    since traffic here is low (teacher previews, off-hours checks).
        logger.warning(f"[CACHE MISS] questions for {exam_date} — falling back to DB (off-window)")
        count = warm_question_cache(exam_date)
        if count == 0:
            return Response(
                {'error': f'No questions found for exam_date={exam_date}.'},
                status=status.HTTP_404_NOT_FOUND
            )

        questions = get_questions_cached(exam_date)
        return Response({'questions': questions, 'source': 'db_fallback'})


@csrf_exempt
def warm_cache_internal(request):
    """
    POST /api/internal/warm-cache/

    Hit by cron-job.org at 9:45 AM Mon-Fri (15 min before exam window).
    Protected by X-Cron-Secret header, same pattern as Fahim's
    process_deletions and flush_weekly_leaderboard endpoints.

    Accepts an optional 'date' in the POST body; defaults to today
    since this is meant to run unattended for "today's" exam.
    """
    if request.method != 'POST':
        return HttpResponse(status=405)

    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    exam_date = request.POST.get('date') or timezone.now().date().isoformat()

    try:
        count = warm_question_cache(exam_date)
    except Exception as e:
        logger.error(f"[WARM CACHE FAILED] date={exam_date}: {e}")
        return JsonResponse({'status': 'error', 'detail': str(e)}, status=500)

    if count == 0:
        # Sherri aanu (by design) — empty cache is set, but we flag it
        # loudly in the response so monitoring/alerting can catch it.
        # If nobody's watching cron-job.org's execution status for THIS
        # entry on exam morning, this is the one signal that something's
        # wrong before 2,000 students start hitting /api/tests/questions/.
        logger.error(
            f"[WARM CACHE] ZERO questions found for {exam_date}. "
            f"Cache set to empty list. Check if admin uploaded today's "
            f"question set!"
        )
        return JsonResponse(
            {'status': 'warning', 'questions_loaded': 0, 'date': exam_date},
            status=200
        )

    logger.info(f"[WARM CACHE] {count} questions loaded for {exam_date}")
    return JsonResponse(
        {'status': 'ok', 'questions_loaded': count, 'date': exam_date},
        status=200
    )
