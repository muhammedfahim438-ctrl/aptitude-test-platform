from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from accounts.views import login_view
from rest_framework_simplejwt.views import TokenRefreshView
from pipeline.views import (
    admin_download_report,
    process_scheduled_deletions,
    flush_weekly_leaderboard_view,
    compute_weekly_leaderboard_view,
)
from exams.views import get_answer_key


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check),
    path('api/auth/login/', login_view),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
    path('api/admin/download-report/<str:exam_date>/', admin_download_report),
    path('api/internal/process-deletions/', process_scheduled_deletions),
    path('api/internal/flush-weekly-leaderboard/', flush_weekly_leaderboard_view),
    path('api/internal/compute-weekly-leaderboard/', compute_weekly_leaderboard_view),
    path('api/tests/answers/', get_answer_key),
]
