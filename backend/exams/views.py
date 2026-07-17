# exams/views.py
import json
import logging
from datetime import datetime, time

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from core.permissions import IsStudentUser, IsAnswerWindowOpen, IsTeacherUser
from accounts.models import CustomUser
from .cache import get_questions_cached, warm_question_cache
from .models import AnswerKey, Question, StudentSubmission
from .serializers import AdminQuestionSerializer

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

        now = datetime.now().time()
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


# --- Vijay's TeacherUpload.jsx target endpoint ---

class UploadQuestionsView(APIView):
    """
    POST /api/admin/upload-questions/

    Matches TeacherUpload.jsx's actual request shape exactly:
    multipart/form-data with fields:
      - date: "YYYY-MM-DD"
      - questions: JSON-STRINGIFIED array of:
            { text, option_a, option_b, option_c, option_d,
              correct_answer, retake_allowed }
      - image_0, image_1, ...: optional image files, indexed
            by position in the questions array

    Uses MultiPartParser/FormParser (NOT the default JSONParser)
    because the frontend sends FormData, not application/json.

    Creates Question rows individually (NOT bulk_create) so that
    pipeline/signals.py's pre_save purge_stale_csv_on_question_upload
    still fires correctly for US-F03.
    """
    permission_classes = [IsAuthenticated, IsTeacherUser]
    parser_classes = [MultiPartParser, FormParser]

    VALID_ANSWERS = {'A', 'B', 'C', 'D'}
    REQUIRED_FIELDS = ('text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer')

    def post(self, request):
        exam_date_str = request.data.get('date')
        questions_raw = request.data.get('questions')

        if not exam_date_str:
            return Response(
                {'error': 'date is required (YYYY-MM-DD).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            datetime.strptime(exam_date_str, '%Y-%m-%d')
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not questions_raw:
            return Response(
                {'error': 'questions is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            questions_payload = json.loads(questions_raw)
        except (TypeError, json.JSONDecodeError):
            return Response(
                {'error': 'questions must be valid JSON.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(questions_payload, list) or len(questions_payload) == 0:
            return Response(
                {'error': 'questions must be a non-empty list.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for idx, q in enumerate(questions_payload, start=1):
            missing = [f for f in self.REQUIRED_FIELDS if not str(q.get(f, '')).strip()]
            if missing:
                return Response(
                    {'error': f'Question {idx} is missing required fields: {missing}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            correct = str(q.get('correct_answer')).strip().upper()
            if correct not in self.VALID_ANSWERS:
                return Response(
                    {'error': f'Question {idx} has invalid correct_answer "{q.get("correct_answer")}". Must be A, B, C, or D.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            with transaction.atomic():
                created_questions = []
                correct_answers = {}

                for idx, q in enumerate(questions_payload, start=1):
                    image_file = request.FILES.get(f'image_{idx - 1}')

                    question = Question(
                        exam_date=exam_date_str,
                        text=q['text'],
                        option_a=q['option_a'],
                        option_b=q['option_b'],
                        option_c=q['option_c'],
                        option_d=q['option_d'],
                        retake_allowed=bool(q.get('retake_allowed', True)),
                    )
                    if image_file:
                        question.image = image_file

                    question.save()
                    created_questions.append(question)

                    correct_answers[f'q{idx}'] = str(q['correct_answer']).strip().upper()

                answer_key, ak_created = AnswerKey.objects.update_or_create(
                    date=exam_date_str,
                    defaults={'correct_answers': correct_answers},
                )

            logger.info(
                f"[UPLOAD] {request.user.email} uploaded {len(created_questions)} "
                f"questions for {exam_date_str} "
                f"(AnswerKey {'created' if ak_created else 'updated'})"
            )

            return Response(
                {
                    'status': 'uploaded',
                    'exam_date': exam_date_str,
                    'questions_created': len(created_questions),
                    'answer_key_updated': True,
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"[UPLOAD] Failed for {request.user.email}, date={exam_date_str}: {e}")
            return Response(
                {'error': 'Question upload failed. Please retry.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# --- Admin (Task 2) ---

class AdminQuestionListView(APIView):
    """
    GET /api/admin/questions/
    Teacher/admin-only. Returns all questions, optionally filtered by
    search text or exam date.
    """
    permission_classes = [IsAuthenticated, IsTeacherUser]

    def get(self, request):
        queryset = Question.objects.all()

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(text__icontains=search)

        exam_date = request.query_params.get('date')
        if exam_date:
            queryset = queryset.filter(exam_date=exam_date)

        serializer = AdminQuestionSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# --- Admin (Task 7 + Task 8) ---

class AdminQuestionDetailView(APIView):
    """
    GET    /api/admin/questions/<int:question_id>/   — Task 8 (view single question)
    DELETE /api/admin/questions/<int:question_id>/   — Task 7 (delete single question)
    Teacher/admin-only.
    """
    permission_classes = [IsAuthenticated, IsTeacherUser]

    def get(self, request, question_id):
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminQuestionSerializer(question)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, question_id):
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
        question.delete()
        logger.info(f"[DELETE] Question {question_id} deleted by {request.user.email}")
        return Response(status=status.HTTP_204_NO_CONTENT)