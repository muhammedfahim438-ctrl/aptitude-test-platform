from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.permissions import IsAnswerWindowOpen
from .models import AnswerKey
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAnswerWindowOpen])
def get_answer_key(request):
    """
    Returns answer key only between 14:00 and 19:00.
    Outside this window IsAnswerWindowOpen permission returns 403.
    """
    exam_date = request.query_params.get('date', None)

    if not exam_date:
        exam_date = str(timezone.now().date())
        logger.info(f"[ANSWER KEY] No date provided, using today: {exam_date}")

    try:
        from datetime import datetime
        datetime.strptime(exam_date, '%Y-%m-%d')
    except ValueError:
        logger.warning(f"[ANSWER KEY] Invalid date format received: {exam_date}")
        return Response(
            {"detail": "Invalid date format. Use YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        answer_key = AnswerKey.objects.get(date=exam_date)
    except AnswerKey.DoesNotExist:
        logger.warning(f"[ANSWER KEY] No answer key found for date: {exam_date}")
        return Response(
            {"detail": f"No answer key found for date {exam_date}."},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"[ANSWER KEY] Unexpected error: {str(e)}")
        return Response(
            {"detail": "Something went wrong. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    logger.info(f"[ANSWER KEY] Accessed by user: {request.user.email} for date: {exam_date}")

    return Response(
        {
            "date": str(answer_key.date),
            "correct_answers": answer_key.correct_answers,
            "opens_at": "14:00",
            "closes_at": "19:00",
        },
        status=status.HTTP_200_OK
    )