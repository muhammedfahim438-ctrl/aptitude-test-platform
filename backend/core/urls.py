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