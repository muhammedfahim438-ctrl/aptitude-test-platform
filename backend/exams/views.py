from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.permissions import IsAnswerWindowOpen
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAnswerWindowOpen])
def get_answer_key(request):
    """
    Returns answer key only between 14:00 and 19:00.
    Outside this window IsAnswerWindowOpen permission returns 403.
    """
    # This will be replaced when FAHIM shares his AnswerKey model
    # For now returning a placeholder response
    logger.info(f"[ANSWER KEY] Accessed by user: {request.user.email}")
    return Response(
        {
            "message": "Answer key endpoint is live.",
            "opens_at": "14:00",
            "closes_at": "19:00",
        },
        status=status.HTTP_200_OK
    )