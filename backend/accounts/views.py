from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
import logging

logger = logging.getLogger(__name__)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh['email'] = user.email
    refresh['is_student'] = user.is_student
    refresh['is_teacher'] = user.is_teacher
    refresh['roll_number'] = user.roll_number
    refresh['full_name'] = user.full_name

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '').strip()

    if not email or not password:
        logger.warning("[LOGIN] Missing email or password in request")
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if '@' not in email:
        logger.warning(f"[LOGIN] Invalid email format: {email}")
        return Response(
            {"detail": "Enter a valid email address."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(request, username=email, password=password)

    if user is None:
        logger.warning(f"[LOGIN] Failed login attempt for email: {email}")
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        logger.warning(f"[LOGIN] Inactive user attempted login: {email}")
        return Response(
            {"detail": "Your account has been deactivated. Contact your administrator."},
            status=status.HTTP_403_FORBIDDEN
        )

    tokens = get_tokens_for_user(user)
    logger.info(f"[LOGIN] Successful login for user: {email}")

    return Response(
        {
            "access": tokens["access"],
            "refresh": tokens["refresh"],
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_student": user.is_student,
                "is_teacher": user.is_teacher,
                "roll_number": user.roll_number,
            }
        },
        status=status.HTTP_200_OK
    )