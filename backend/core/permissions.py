from datetime import datetime, time

from django.utils import timezone
from rest_framework.permissions import BasePermission


class IsStudentUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_student
        )


class IsTeacherUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_teacher
        )


class IsAnswerWindowOpen(BasePermission):
    message = "Answer key is not available at this time."

    def has_permission(self, request, view):
        now = datetime.now().time()
        return time(14, 0) <= now <= time(19, 0)
