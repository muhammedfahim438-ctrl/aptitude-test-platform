# core/urls.py
# TODO: Owner = shared (each member registers their own endpoints here)
#
# This file MUST be assembled from everyone's views as they're built.
# Below are the routes already known from the implementation kit —
# uncomment/import as the corresponding views.py files are completed.

from django.contrib import admin
from django.urls import path

# --- SREEKUTTAN (done) ---
from exams.views import GetExamQuestionsView, warm_cache_internal

# --- SREEKUTTAN (US-R03, TODO: add SubmitAnswersView to exams/views.py) ---
# from exams.views import SubmitAnswersView

# --- SHAHIN (TODO) ---
# from accounts.views import LoginView, RefreshView

# --- FAHIM (TODO) ---
# from pipeline.views import (
#     admin_download_report,
#     process_scheduled_deletions,
#     flush_weekly_leaderboard,
# )

urlpatterns = [
    path('admin/', admin.site.urls),

    # Sreekuttan's routes (done)
    path('api/tests/questions/', GetExamQuestionsView.as_view(), name='get-exam-questions'),
    path('api/internal/warm-cache/', warm_cache_internal, name='warm-cache-internal'),

    # TODO: path('api/tests/submit/', SubmitAnswersView.as_view(), name='submit-answers'),
    # TODO: path('api/auth/login/', LoginView.as_view(), name='login'),
    # TODO: path('api/auth/refresh/', RefreshView.as_view(), name='token-refresh'),
    # TODO: path('api/admin/download-report/', admin_download_report, name='download-report'),
    # TODO: path('api/internal/process-deletions/', process_scheduled_deletions, name='process-deletions'),
    # TODO: path('api/internal/flush-weekly-leaderboard/', flush_weekly_leaderboard, name='flush-leaderboard'),
    # TODO: path('api/health/', health_check, name='health'),  # zero-auth, zero-DB per Constraint 6
]
from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from accounts.views import login_view
from rest_framework_simplejwt.views import TokenRefreshView

def health_check(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check),
    path('api/auth/login/', login_view),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
]
