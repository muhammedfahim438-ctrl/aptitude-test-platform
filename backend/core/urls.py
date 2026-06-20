# core/urls.py
# Owner = shared (each member registers their own endpoints here)

from django.contrib import admin
from django.urls import path

# --- SREEKUTTAN (done) ---
from exams.views import GetExamQuestionsView, warm_cache_internal, SubmitAnswersView

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
    path('api/tests/submit/', SubmitAnswersView.as_view(), name='submit-answers'),

    # TODO: path('api/auth/login/', LoginView.as_view(), name='login'),
    # TODO: path('api/auth/refresh/', RefreshView.as_view(), name='token-refresh'),
    # TODO: path('api/admin/download-report/', admin_download_report, name='download-report'),
    # TODO: path('api/internal/process-deletions/', process_scheduled_deletions, name='process-deletions'),
    # TODO: path('api/internal/flush-weekly-leaderboard/', flush_weekly_leaderboard, name='flush-leaderboard'),
    # TODO: path('api/health/', health_check, name='health'),
]