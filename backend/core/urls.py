from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from accounts.views import login_view, register_view, student_signin_view
from rest_framework_simplejwt.views import TokenRefreshView

from pipeline.views import (
    admin_download_report,
    process_scheduled_deletions,
    flush_weekly_leaderboard_view,
    compute_weekly_leaderboard_view,
    cleanup_day_view,
    DashboardStatsView,
    AdminRankingsView,
    AdminReportsView,
    StudentLeaderboardView,
    StudentDashboardView,
)
from exams.views import (
    get_answer_key,
    GetExamQuestionsView,
    warm_cache_internal,
    SubmitAnswersView,
    UploadQuestionsView,
    AdminQuestionListView,
    AdminQuestionDetailView,
    StudentReviewView,
)


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/register/', register_view, name='register'),
    path('api/auth/student-signin/', student_signin_view, name='student-signin'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/tests/questions/', GetExamQuestionsView.as_view(), name='get-exam-questions'),
    path('api/tests/answers/', get_answer_key, name='get-answer-key'),
    path('api/tests/submit/', SubmitAnswersView.as_view(), name='submit-answers'),
    path('api/internal/warm-cache/', warm_cache_internal, name='warm-cache-internal'),
    path('api/admin/download-report/<str:exam_date>/', admin_download_report, name='download-report'),
    path('api/internal/process-deletions/', process_scheduled_deletions, name='process-deletions'),
    path('api/internal/flush-weekly-leaderboard/', flush_weekly_leaderboard_view, name='flush-leaderboard'),
    path('api/internal/compute-weekly-leaderboard/', compute_weekly_leaderboard_view, name='compute-leaderboard'),
    path('api/internal/cleanup-day/', cleanup_day_view, name='cleanup-day'),
    path('api/admin/dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/admin/upload-questions/', UploadQuestionsView.as_view(), name='upload-questions'),
    path('api/admin/questions/', AdminQuestionListView.as_view(), name='admin-question-list'),
    path('api/admin/questions/<int:question_id>/', AdminQuestionDetailView.as_view(), name='admin-question-detail'),
    path('api/admin/rankings/', AdminRankingsView.as_view(), name='admin-rankings'),
    path('api/admin/reports/', AdminReportsView.as_view(), name='admin-reports'),
    path('api/student/leaderboard/', StudentLeaderboardView.as_view(), name='student-leaderboard'),
    path('api/student/review/', StudentReviewView.as_view(), name='student-review'),
    path('api/student/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
]
