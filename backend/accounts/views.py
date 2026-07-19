# accounts/views.py
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

    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        user_obj = User.objects.get(email=email)
        if not user_obj.is_active:
            logger.warning(f"[LOGIN] Inactive user attempted login: {email}")
            return Response(
                {"detail": "Your account has been deactivated. Contact your administrator."},
                status=status.HTTP_403_FORBIDDEN
            )
    except User.DoesNotExist:
        logger.warning(f"[LOGIN] Failed login attempt for email: {email}")
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    user = authenticate(request, username=email, password=password)

    if user is None:
        logger.warning(f"[LOGIN] Failed login attempt for email: {email}")
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
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


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '').strip()
    full_name = request.data.get('full_name', '').strip()
    roll_number = request.data.get('roll_number', '').strip()
    mobile = request.data.get('mobile', '').strip()
    department = request.data.get('department', '').strip()

    if not all([email, password, full_name, roll_number]):
        return Response(
            {"detail": "Email, password, full name and roll number are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if '@' not in email:
        return Response(
            {"detail": "Enter a valid email address."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 6:
        return Response(
            {"detail": "Password must be at least 6 characters."},
            status=status.HTTP_400_BAD_REQUEST
        )

    from django.contrib.auth import get_user_model
    User = get_user_model()

    if User.objects.filter(email=email).exists():
        return Response(
            {"detail": "An account with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(roll_number=roll_number).exists():
        return Response(
            {"detail": "An account with this roll number already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.create_user(
            email=email,
            password=password,
            full_name=full_name,
            roll_number=roll_number,
            department=department,
            is_student=True,
            is_active=True,
        )
        logger.info(f"[REGISTER] New student registered: {email}")

        tokens = get_tokens_for_user(user)

        return Response(
            {
                "detail": "Account created successfully.",
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "roll_number": user.roll_number,
                    "is_student": user.is_student,
                    "is_teacher": user.is_teacher,
                    "department": user.department,
                    "mobile": mobile,
                }
            },
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        logger.error(f"[REGISTER ERROR] {str(e)}")
        return Response(
            {"detail": "Registration failed. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def student_signin_view(request):
    full_name = request.data.get('full_name', '').strip()
    roll_number = request.data.get('roll_number', '').strip()
    email = request.data.get('email', '').strip()
    department = request.data.get('department', '').strip()
    mobile = request.data.get('mobile', '').strip()
    year = request.data.get('year', '').strip()
    semester = request.data.get('semester', '').strip()

    if not all([full_name, roll_number, email]):
        return Response(
            {"detail": "Full name, roll number and email are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    from django.contrib.auth import get_user_model
    from django.db import IntegrityError
    User = get_user_model()

    try:
        user = None

        if User.objects.filter(roll_number=roll_number).exists():
            user = User.objects.get(roll_number=roll_number)
            user.full_name = full_name
            user.email = email
            if department:
                user.department = department
            user.save()
            logger.info(f"[SIGNIN] Existing student signed in: {email}")

        elif User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            user.full_name = full_name
            user.roll_number = roll_number
            if department:
                user.department = department
            user.save()
            logger.info(f"[SIGNIN] Existing student signed in by email: {email}")

        else:
            user = User(
                email=email,
                full_name=full_name,
                roll_number=roll_number,
                department=department,
                is_student=True,
                is_active=True,
            )
            user.set_unusable_password()
            user.save()
            logger.info(f"[SIGNIN] New student auto-created: {email}")

    except IntegrityError as e:
        logger.error(f"[SIGNIN] IntegrityError for {email} / {roll_number}: {str(e)}")
        return Response(
            {"detail": "An account with this email or roll number already belongs to another student. Please contact admin."},
            status=status.HTTP_409_CONFLICT
        )
    except Exception as e:
        logger.error(f"[SIGNIN] Unexpected error for {email}: {str(e)}")
        return Response(
            {"detail": "Sign in failed. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    tokens = get_tokens_for_user(user)

    return Response(
        {
            "access": tokens["access"],
            "refresh": tokens["refresh"],
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "roll_number": user.roll_number,
                "is_student": user.is_student,
                "is_teacher": user.is_teacher,
                "department": department,
                "mobile": mobile,
                "year": year,
                "semester": semester,
            }
        },
        status=status.HTTP_200_OK
    )