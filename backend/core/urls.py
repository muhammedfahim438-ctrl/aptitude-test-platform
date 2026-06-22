# core/urls.py
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
from exams.views import (
    get_answer_key,
    GetExamQuestionsView,
    warm_cache_internal,
    SubmitAnswersView,
)


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/tests/questions/', GetExamQuestionsView.as_view(), name='get-exam-questions'),
    path('api/tests/answers/', get_answer_key, name='get-answer-key'),
    path('api/tests/submit/', SubmitAnswersView.as_view(), name='submit-answers'),
    path('api/internal/warm-cache/', warm_cache_internal, name='warm-cache-internal'),
    path('api/admin/download-report/<str:exam_date>/', admin_download_report, name='download-report'),
    path('api/internal/process-deletions/', process_scheduled_deletions, name='process-deletions'),
    path('api/internal/flush-weekly-leaderboard/', flush_weekly_leaderboard_view, name='flush-leaderboard'),
    path('api/internal/compute-weekly-leaderboard/', compute_weekly_leaderboard_view, name='compute-leaderboard'),
]
