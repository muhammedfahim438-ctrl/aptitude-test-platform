# core/settings/production.py
import os
from datetime import timedelta

import dj_database_url

# ---------------------------------------------------------------------------
# Core security
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ['SECRET_KEY']
DEBUG = False
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# ---------------------------------------------------------------------------
# Database — PgBouncer pooler (Constraint 1)
# ---------------------------------------------------------------------------
DATABASE_URL = os.environ['DATABASE_URL']
# MUST be the PgBouncer pooler URL from Neon/Aiven dashboard
# Format: postgresql://user:pass@ep-xxx-pooler.neon.tech:6543/dbname?pgbouncer=true&sslmode=require

DATABASES = {
    'default': dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=0,       # CRITICAL: Must be 0 for PgBouncer transaction mode
        ssl_require=True,
    )
}

# ---------------------------------------------------------------------------
# CORS — Constraint 4 / US-R02
# CorsMiddleware MUST be the very first entry. It needs to run before
# CommonMiddleware so the Access-Control-Allow-Origin header gets attached
# to every response, including ones that get redirected or rejected later
# in the chain. Moving this down breaks CORS for the whole API.
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
    if origin.strip()
]
# Expected env value example:
# CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:5173

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['GET', 'POST', 'OPTIONS']
CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'origin',
    'x-csrftoken',
    'x-cron-secret',   # needed for internal cron endpoints called cross-origin in testing
]

# ---------------------------------------------------------------------------
# Middleware — ORDER MATTERS. Do not reorder CorsMiddleware from position 0.
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # MUST BE FIRST
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ---------------------------------------------------------------------------
# JWT (US-S03)
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ---------------------------------------------------------------------------
# Cron / internal endpoint secret
# ---------------------------------------------------------------------------
CRON_SECRET_KEY = os.environ['CRON_SECRET_KEY']

# ---------------------------------------------------------------------------
# Redis (Upstash) — used by exams/cache.py
# ---------------------------------------------------------------------------
UPSTASH_REDIS_URL = os.environ['UPSTASH_REDIS_URL']
