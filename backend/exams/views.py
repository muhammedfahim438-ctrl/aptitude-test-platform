# exams/views.py
# Owner: SREEKUTTAN
# US-R01 · GetExamQuestionsView  — Redis cache-first question read
# US-R01 · warm_cache_internal   — cron-triggered cache warm endpoint
# US-R03 · SubmitAnswersView     — atomic, idempotent submission endpoint

import logging
from datetime import datetime, time

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsStudentUser
from .cache import get_questions_cached, warm_question_cache
from .models import Question, StudentSubmission

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# US-R01 · GetExamQuestionsView
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# US-R01 · warm_cache_internal
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# US-R03 · SubmitAnswersView
# ──────────────────────────────────────────────

class SubmitAnswersView(APIView):
    """
    POST /api/tests/submit/

    Atomic, idempotent submission endpoint.
    - transaction.atomic()  → no partial writes on DB error
    - update_or_create      → safe to retry; no duplicate rows
    - Server-side time gate → 409 if exam window closed
    """
    permission_classes = [IsAuthenticated, IsStudentUser]

    def post(self, request):
        exam_date_str = request.data.get('exam_date')
        answers = request.data.get('answers')

        if not exam_date_str or not answers:
            return Response(
                {'error': 'exam_date and answers are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Server-side time gate — exam window is 10:00 AM to 2:00 PM IST
        now = datetime.now().time()
        if now > time(14, 0):
            return Response(
                {'error': 'Exam window has closed. Submissions are no longer accepted.'},
                status=status.HTTP_409_CONFLICT
            )

        try:
            with transaction.atomic():
                # update_or_create = idempotent: safe to retry on network errors.
                # If a student submits twice (auto-submit + manual submit), the
                # second call overwrites answers — no duplicate rows created.
                submission, created = StudentSubmission.objects.update_or_create(
                    student=request.user,
                    exam_date=exam_date_str,
                    defaults={'answers': answers},
                )

            logger.info(
                f"[SUBMIT] {'Created' if created else 'Updated'} — "
                f"student={request.user.id}, date={exam_date_str}"
            )
            return Response(
                {'status': 'submitted', 'created': created},
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"[SUBMIT] Transaction failed — student={request.user.id}: {e}")
            return Response(
                {'error': 'Submission failed. Please retry.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )