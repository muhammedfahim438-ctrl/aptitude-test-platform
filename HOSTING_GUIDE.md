# Apptist — Hosting & Deployment Guide

> **Share this file with Claude (or any AI assistant) to get step-by-step help deploying the Aptitude Test Platform to production.**

---

## Table of Contents

1. [Project Architecture Overview](#1-project-architecture-overview)
2. [Free Tier Services Required](#2-free-tier-services-required)
3. [Step 1: Database Setup (Neon.tech)](#3-step-1-database-setup-neontech)
4. [Step 2: Redis Cache Setup (Upstash)](#4-step-2-redis-cache-setup-upstash)
5. [Step 3: Backend Deployment (Render.com)](#5-step-3-backend-deployment-rendercom)
6. [Step 4: Frontend Deployment (Vercel)](#6-step-4-frontend-deployment-vercel)
7. [Step 5: Cron Jobs (cron-job.org)](#7-step-5-cron-jobs-cron-joborg)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Post-Deployment Verification](#9-post-deployment-verification)
10. [Known Issues & Fixes](#10-known-issues--fixes)
11. [Architecture Diagram](#11-architecture-diagram)

---

## 1. Project Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT BROWSER                          │
│  React SPA (Vercel) → axios → API calls                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               DJANGO REST API (Render.com)                  │
│  gunicorn WSGI → DRF views → permissions → serializers     │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Auth API   │  │  Exams API   │  │  Pipeline API    │  │
│  │  JWT tokens  │  │ Questions    │  │  Scores/Reports  │  │
│  │  Roles:      │  │ Submit       │  │  Leaderboards    │  │
│  │  student     │  │ Answer Key   │  │  CSV Export      │  │
│  │  teacher     │  │              │  │                  │  │
│  └─────────────┘  └──────┬───────┘  └────────┬─────────┘  │
│                          │                    │             │
└──────────────────────────┼────────────────────┼─────────────┘
                           │                    │
              ┌────────────┼────────────────────┼────────────┐
              │            │                    │            │
              ▼            ▼                    ▼            ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│   Neon.tech      │ │  Upstash     │ │  Supabase        │ │
│   PostgreSQL     │ │  Redis       │ │  Storage         │ │
│   (Users, Scores │ │  (Question   │ │  (Question       │ │
│    Submissions)  │ │   Cache)     │ │   Images)        │ │
└──────────────────┘ └──────────────┘ └──────────────────┘ │
```

---

## 2. Free Tier Services Required

| Service | Provider | Free Tier | Purpose |
|---------|----------|-----------|---------|
| PostgreSQL Database | Neon.tech | 0.5 GB storage, 24/7 compute | Users, questions, scores, submissions |
| Redis Cache | Upstash | 10,000 commands/day, 256 MB | Exam question caching during bursts |
| Object Storage | Supabase | 1 GB storage, 2 GB bandwidth | Question image attachments |
| Backend Hosting | Render.com | 750 hrs/month, spins down after 15min | Django REST API |
| Frontend Hosting | Vercel | 100 GB bandwidth, unlimited | React SPA |
| Cron Jobs | cron-job.org | Unlimited | Cache warming, CSV cleanup |
| Domain (optional) | Cloudflare | Free | Custom domain + SSL |

---

## 3. Step 1: Database Setup (Neon.tech)

### 1.1 Create Neon Account & Database

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create a new project:
   - **Project name:** `apptist-db`
   - **Region:** Choose closest to your users (e.g., `us-east-1` for India)
   - **PostgreSQL version:** 16 (default)
4. After creation, go to **Connection Details**
5. Copy the **Pooled connection string** (looks like `postgresql://...@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require`)

### 1.2 Important: Use PgBouncer Pooling URL

Neon provides two connection strings:
- **Direct connection:** `postgresql://...` (for migrations only)
- **Pooled connection:** `postgresql://...?pgbouncer=true` (for runtime)

**Always use the Pooled URL in production** to prevent connection exhaustion under 2,000 concurrent users.

### 1.3 Run Migrations on Neon

After backend is deployed (Step 3), run migrations:

```bash
# On Render shell or locally with production DATABASE_URL
python manage.py migrate

# Create admin user
python manage.py shell -c "
from accounts.models import CustomUser
CustomUser.objects.create_user(
    email='admin@ngi.edu.in',
    password='admin123',
    full_name='Admin Teacher',
    is_teacher=True
)
print('Admin user created')
"

# Seed test questions
python manage.py seed_test_data
```

---

## 4. Step 2: Redis Cache Setup (Upstash)

### 4.1 Create Upstash Account

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up with GitHub
3. Click **Create Database**
   - **Name:** `apptist-cache`
   - **Region:** Choose closest (e.g., `us-east-1`)
   - **Type:** Regional (free tier)
4. After creation, go to **Connect** tab
5. Copy the **REST URL** (looks like `https://xxx.upstash.io`)

### 4.2 Important: Upstash Redis Config

The project uses `redis-py` with REST protocol. In `production.py`, the connection is:

```python
import redis
client = redis.from_url(settings.UPSTASH_REDIS_URL)
```

**No additional configuration needed** — Upstash handles connection pooling automatically.

---

## 5. Step 3: Backend Deployment (Render.com)

### 5.1 Push Code to GitHub

```bash
# From project root
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/apptist-aptitude-platform.git
git push -u origin main
```

### 5.2 Create Render Web Service

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub
3. Click **New** → **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name:** `apptist-backend`
   - **Region:** US East (or closest)
   - **Branch:** `main`
   - **Runtime:** Python
   - **Build Command:**
     ```bash
     cd backend && pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     cd backend && gunicorn core.wsgi:application
     ```
   - **Python Version:** 3.11.8 (or 3.12)

### 5.3 Set Environment Variables on Render

Go to **Environment** tab and add:

```bash
# Django Core
SECRET_KEY=<generate-a-random-50-char-string>
DEBUG=False
PYTHON_VERSION=3.11.8
DJANGO_SETTINGS_MODULE=core.settings.production

# Database (use Neon POOLED URL with ?pgbouncer=true)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require&pgbouncer=true

# Redis (use Upstash REST URL)
UPSTASH_REDIS_URL=redis://default:xxx@xxx.upstash.io

# CORS (your Vercel frontend URL)
CORS_ALLOWED_ORIGINS=https://apptist-frontend.vercel.app

# Security
ALLOWED_HOSTS=apptist-backend.onrender.com
CRON_SECRET_KEY=<generate-a-random-32-char-string>
```

### 5.4 Generate Secrets

```bash
# Generate Django SECRET_KEY
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Generate CRON_SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5.5 Deploy

1. Click **Create Web Service**
2. Wait for first deploy (5-10 minutes)
3. After deploy, go to **Shell** tab and run:

```bash
python manage.py migrate
python manage.py createsuperuser
# Enter: admin@ngi.edu.in, admin123, etc.
```

---

## 6. Step 4: Frontend Deployment (Vercel)

### 6.1 Update Frontend API Base URL

Edit `frontend/src/api/client.js`:

```javascript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
```

### 6.2 Create Vercel Project

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 6.3 Set Environment Variables on Vercel

Go to **Settings** → **Environment Variables**:

```bash
VITE_API_BASE_URL=https://apptist-backend.onrender.com
```

### 6.4 Deploy

1. Click **Deploy**
2. Wait for build (2-3 minutes)
3. After deploy, copy the Vercel URL (e.g., `https://apptist-frontend.vercel.app`)

### 6.5 Update CORS on Render

Go back to Render dashboard → **Environment** and update:

```bash
CORS_ALLOWED_ORIGINS=https://apptist-frontend.vercel.app
```

Then redeploy the backend.

---

## 7. Step 5: Cron Jobs (cron-job.org)

### 7.1 Create Account

1. Go to [https://cron-job.org](https://cron-job.org)
2. Sign up with email

### 7.2 Job 1: Cache Warming (Daily at 9:45 AM IST)

```bash
# Job Settings
Title: Apptist Cache Warming
URL: https://apptist-backend.onrender.com/api/internal/warm-cache/
Method: POST
Headers:
  X-Cron-Secret: <your-CRON_SECRET_KEY>
Body: date=<today's date>
Schedule: 45 9 * * * (Daily at 9:45 AM)
Timezone: Asia/Kolkata
```

### 7.3 Job 2: CSV Cleanup (Every 15 minutes)

```bash
# Job Settings
Title: Apptist CSV Cleanup
URL: https://apptist-backend.onrender.com/api/internal/process-deletions/
Method: POST
Headers:
  X-Cron-Secret: <your-CRON_SECRET_KEY>
Schedule: */15 * * * * (Every 15 minutes)
Timezone: UTC
```

### 7.4 Job 3: Weekly Leaderboard Flush (Tuesday 12:00 PM IST)

```bash
# Job Settings
Title: Apptist Weekly Leaderboard Flush
URL: https://apptist-backend.onrender.com/api/internal/flush-weekly-leaderboard/
Method: POST
Headers:
  X-Cron-Secret: <your-CRON_SECRET_KEY>
Schedule: 0 12 * * 2 (Every Tuesday at 12:00 PM)
Timezone: Asia/Kolkata
```

### 7.5 Job 4: Weekly Leaderboard Compute (Tuesday 12:05 PM IST)

```bash
# Job Settings
Title: Apptist Weekly Leaderboard Compute
URL: https://apptist-backend.onrender.com/api/internal/compute-weekly-leaderboard/
Method: POST
Headers:
  X-Cron-Secret: <your-CRON_SECRET_KEY>
Schedule: 5 12 * * 2 (Every Tuesday at 12:05 PM)
Timezone: Asia/Kolkata
```

### 7.6 Job 5: Render Keep-Alive (Every 10 minutes)

```bash
# Job Settings
Title: Apptist Keep-Alive
URL: https://apptist-backend.onrender.com/api/health/
Method: GET
Schedule: */10 * * * * (Every 10 minutes)
Timezone: UTC
```

---

## 8. Environment Variables Reference

### Backend (Render)

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `SECRET_KEY` | `django-insecure-abc123...` | Django secret key (50+ chars) |
| `DEBUG` | `False` | Must be False in production |
| `DJANGO_SETTINGS_MODULE` | `core.settings.production` | Settings module |
| `DATABASE_URL` | `postgresql://...?pgbouncer=true` | Neon PostgreSQL (pooled) |
| `UPSTASH_REDIS_URL` | `redis://default:xxx@xxx.upstash.io` | Upstash Redis REST URL |
| `CORS_ALLOWED_ORIGINS` | `https://apptist-frontend.vercel.app` | Vercel frontend URL |
| `ALLOWED_HOSTS` | `apptist-backend.onrender.com` | Render domain |
| `CRON_SECRET_KEY` | `random-32-char-string` | For internal cron endpoints |

### Frontend (Vercel)

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `VITE_API_BASE_URL` | `https://apptist-backend.onrender.com` | Backend API URL |

---

## 9. Post-Deployment Verification

### 9.1 Health Check

```bash
curl https://apptist-backend.onrender.com/api/health/
# Expected: {"status": "ok"}
```

### 9.2 Auth Test

```bash
# Login
curl -X POST https://apptist-backend.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ngi.edu.in", "password": "admin123"}'

# Expected: {"access": "...", "refresh": "...", "user": {...}}
```

### 9.3 Questions Test

```bash
# Get questions (use JWT token from login)
curl https://apptist-backend.onrender.com/api/tests/questions/?date=2026-07-18 \
  -H "Authorization: Bearer <access_token>"
```

### 9.4 Frontend Test

1. Open `https://apptist-frontend.vercel.app`
2. Should redirect to `/login`
3. Login with student credentials
4. Navigate to exam page

---

## 10. Known Issues & Fixes

### Issue 1: Render Free Tier Spin-Down

**Problem:** Render free tier spins down after 15 minutes of inactivity. First request takes 30-50 seconds.

**Fix:** The cron-job.org keep-alive job (Job 5) pings `/api/health/` every 10 minutes to prevent spin-down.

### Issue 2: CORS Errors

**Problem:** Frontend cannot call backend due to cross-origin restrictions.

**Fix:** Ensure `CORS_ALLOWED_ORIGINS` on Render matches your Vercel URL exactly (including `https://`).

### Issue 3: Database Connection Exhaustion

**Problem:** Under 2,000 concurrent users, PostgreSQL connection pool exhausts.

**Fix:** Use Neon's **Pooled connection URL** with `?pgbouncer=true`. The app is configured with `conn_max_age=0` to prevent stale connections.

### Issue 4: JWT Token Expiry During Long Exams

**Problem:** Students start exam at 10 AM, token expires at 10:15 AM (15-min prod lifetime).

**Fix:** The axios interceptor in `client.js` automatically refreshes expired tokens using the refresh token.

### Issue 5: Questions Not Loading (503 Error)

**Problem:** During exam window (10AM-2PM), if Redis cache is empty, returns 503.

**Fix:** Ensure cache warming cron runs at 9:45 AM IST daily. Manually trigger via:

```bash
curl -X POST https://apptist-backend.onrender.com/api/internal/warm-cache/ \
  -H "X-Cron-Secret: <your-CRON_SECRET_KEY>" \
  -d "date=2026-07-19"
```

### Issue 6: Static Files Not Collected

**Problem:** Admin panel or static assets missing.

**Fix:** Add to Render build command:

```bash
cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
```

---

## 11. Architecture Diagram

```
                    ┌─────────────────────┐
                    │   cron-job.org      │
                    │  (Keep-Alive, Cron) │
                    └──────────┬──────────┘
                               │ HTTP/POST
                               ▼
┌──────────────┐    ┌─────────────────────┐    ┌──────────────┐
│   Vercel     │───▶│   Render.com        │◀───│   GitHub     │
│   (React)    │    │   (Django REST)     │    │   (Code)     │
│              │    │                     │    │              │
│  localhost   │    │  gunicorn WSGI      │    │  git push    │
│  :5173       │    │  :8000              │    │  triggers    │
└──────────────┘    └──────────┬──────────┘    │  deploy      │
                               │               └──────────────┘
                               │ HTTPS
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   Neon.tech      │ │  Upstash     │ │  Supabase        │
│   PostgreSQL     │ │  Redis       │ │  Storage         │
│                  │ │              │ │                  │
│  Users           │ │  Questions   │ │  Images          │
│  Questions       │ │  (cached)    │ │  (files)         │
│  Submissions     │ │              │ │                  │
│  Scores          │ │              │ │                  │
│  Leaderboards    │ │              │ │                  │
└──────────────────┘ └──────────────┘ └──────────────────┘
```

---

## Quick Start Checklist

- [ ] 1. Create Neon.tech account and PostgreSQL database
- [ ] 2. Create Upstash Redis database
- [ ] 3. Push code to GitHub
- [ ] 4. Deploy backend to Render.com
- [ ] 5. Set environment variables on Render
- [ ] 6. Run migrations on Render shell
- [ ] 7. Create admin user on Render shell
- [ ] 8. Deploy frontend to Vercel
- [ ] 9. Set `VITE_API_BASE_URL` on Vercel
- [ ] 10. Update `CORS_ALLOWED_ORIGINS` on Render
- [ ] 11. Create cron jobs on cron-job.org
- [ ] 12. Test all endpoints
- [ ] 13. Seed test questions
- [ ] 14. Verify frontend → backend → database flow

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `403 Forbidden` on login | CORS misconfigured | Update `CORS_ALLOWED_ORIGINS` on Render |
| `503 Service Unavailable` | Redis cache empty during exam | Run cache warming cron or manual trigger |
| `401 Unauthorized` | JWT expired | Frontend interceptor should auto-refresh |
| `502 Bad Gateway` | Render spinning up | Wait 30 seconds, then retry |
| `Database connection refused` | Wrong DATABASE_URL | Use Neon pooled URL with `?pgbouncer=true` |
| `Redis connection refused` | Wrong UPSTASH_REDIS_URL | Use Upstash REST URL from dashboard |

---

*Generated: July 2026*
*Project: Apptist — NGI Aptitude Portal*
