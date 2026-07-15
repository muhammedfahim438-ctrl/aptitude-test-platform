# exams/views.py
import logging
from datetime import time

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsStudentUser, IsAnswerWindowOpen
from .cache import get_questions_cached, warm_question_cache
from .models import AnswerKey, Question, StudentSubmission

logger = logging.getLogger(__name__)


# --- Shahin (US-S04) ---

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAnswerWindowOpen])
def get_answer_key(request):
    exam_date = request.query_params.get('date', None)
    if not exam_date:
        exam_date = str(timezone.now().date())

    try:
        datetime.strptime(exam_date, '%Y-%m-%d')
    except ValueError:
        return Response(
            {"detail": "Invalid date format. Use YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        answer_key = AnswerKey.objects.get(date=exam_date)
    except AnswerKey.DoesNotExist:
        return Response(
            {"detail": f"No answer key found for date {exam_date}."},
            status=status.HTTP_404_NOT_FOUND
        )

    logger.info(f"[ANSWER KEY] Accessed by {request.user.email} for {exam_date}")
    return Response(
        {
            "date": str(answer_key.date),
            "correct_answers": answer_key.correct_answers,
            "opens_at": "14:00",
            "closes_at": "19:00",
        },
        status=status.HTTP_200_OK
    )


# --- Sreekuttan (US-R01) ---

class GetExamQuestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        exam_date = request.query_params.get('date')
        if not exam_date:
            return Response(
                {'error': 'date query param is required (YYYY-MM-DD).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now().time()
        is_exam_window = time(10, 0) <= now <= time(14, 0)

        cached = get_questions_cached(exam_date)
        if cached is not None:
            logger.info(f"[CACHE HIT] questions for {exam_date}")
            return Response({'questions': cached, 'source': 'cache'})

        if is_exam_window:
            logger.error(f"[CACHE MISS DURING EXAM WINDOW] date={exam_date}")
            return Response(
                {'error': 'Questions are temporarily unavailable. Please retry shortly.', 'retry_after_seconds': 5},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        logger.warning(f"[CACHE MISS] questions for {exam_date} - falling back to DB")
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

    logger.info(f"[WARM CACHE] {count} questions loaded for {exam_date}")
    return JsonResponse({'status': 'ok', 'questions_loaded': count, 'date': exam_date})


# --- Sreekuttan (US-R03) ---

class SubmitAnswersView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUser]

    def post(self, request):
        exam_date_str = request.data.get('exam_date')
        answers = request.data.get('answers')

        if not exam_date_str or not answers:
            return Response(
                {'error': 'exam_date and answers are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now().time()
        if now > time(14, 0):
            return Response(
                {'error': 'Exam window has closed. Submissions are no longer accepted.'},
                status=status.HTTP_409_CONFLICT
            )

        try:
            with transaction.atomic():
                submission, created = StudentSubmission.objects.update_or_create(
                    student=request.user,
                    exam_date=exam_date_str,
                    defaults={'answers': answers},
                )
            logger.info(f"[SUBMIT] {'Created' if created else 'Updated'} - student={request.user.id}, date={exam_date_str}")
            return Response(
                {'status': 'submitted', 'created': created},
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[SUBMIT] Transaction failed - student={request.user.id}: {e}")
            return Response(
                {'error': 'Submission failed. Please retry.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
