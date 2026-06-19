# core/permissions.py
# TODO: Owner = SHAHIN (US-S02, US-S04)
#
# Shared DRF permission classes used across apps.
# Expected contents per the implementation kit:
#   - IsStudentUser
#   - IsTeacherUser
#   - IsAnswerWindowOpen (403 outside 2 PM - 7 PM)

from rest_framework.permissions import BasePermission


class IsStudentUser(BasePermission):
    """TODO (SHAHIN): implement per US-S02 acceptance criteria."""
    def has_permission(self, request, view):
        raise NotImplementedError("Shahin needs to implement IsStudentUser (US-S02)")


class IsTeacherUser(BasePermission):
    """TODO (SHAHIN): implement per US-S02 acceptance criteria."""
    def has_permission(self, request, view):
        raise NotImplementedError("Shahin needs to implement IsTeacherUser (US-S02)")


class IsAnswerWindowOpen(BasePermission):
    """TODO (SHAHIN): implement per US-S04 acceptance criteria (2PM-7PM gate)."""
    def has_permission(self, request, view):
        raise NotImplementedError("Shahin needs to implement IsAnswerWindowOpen (US-S04)")
from rest_framework.permissions import BasePermission
from datetime import datetime, time


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
