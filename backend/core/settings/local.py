# core/settings/local.py
# Owner: shared — local dev environment
#
# Dev settings — used when running `python manage.py runserver` locally.
# Does NOT require PgBouncer; SQLite is fine for local dev.

from .base import *
import os

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

SECRET_KEY = 'local-dev-only-not-for-production'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'OPTIONS',
]

CORS_ALLOW_HEADERS = [
    'Content-Type',
    'Authorization',
]