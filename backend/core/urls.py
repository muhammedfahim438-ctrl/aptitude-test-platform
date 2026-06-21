# core/urls.py
# Owner: shared (each member registers their own endpoints here)

from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from accounts.views import login_view
from rest_framework_simplejwt.views import TokenRefreshView
from exams.views import GetExamQuestionsView, warm_cache_internal, SubmitAnswersView

# --- FAHIM (TODO) ---
# from pipeline.views import (
#     admin_download_report,
#     process_scheduled_deletions,
#     flush_weekly_leaderboard,
# )


def health_check(request):
    """Zero-auth, zero-DB keep-alive endpoint (Constraint 6)."""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path('admin/', admin.site.urls),

    # Health check — zero auth, zero DB (Constraint 6)
    path('api/health/', health_check, name='health'),

    # Auth — Shahin's login view
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Sreekuttan's routes (US-R01, US-R03)
    path('api/tests/questions/', GetExamQuestionsView.as_view(), name='get-exam-questions'),
    path('api/internal/warm-cache/', warm_cache_internal, name='warm-cache-internal'),
    path('api/tests/submit/', SubmitAnswersView.as_view(), name='submit-answers'),

    # TODO: path('api/tests/answers/', get_answer_key),
    # TODO: path('api/admin/download-report/', admin_download_report, name='download-report'),
    # TODO: path('api/internal/process-deletions/', process_scheduled_deletions, name='process-deletions'),
    # TODO: path('api/internal/flush-weekly-leaderboard/', flush_weekly_leaderboard, name='flush-leaderboard'),
]