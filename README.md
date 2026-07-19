# Apptist — Automated Institutional Aptitude Test Platform

**Institution:** Nehru Group of Institutions (NGI)
**Type:** Full-stack web application for daily timed aptitude tests
**Stack:** Django REST Framework · React (Vite) · PostgreSQL · Upstash Redis · Whitenoise
**Deploy:** Render.com (backend) · Vercel (frontend) · Neon.tech (database) · cron-job.org (schedules)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                       STUDENT / ADMIN BROWSER                        │
│               React SPA (Vercel) → Axios → API Calls                 │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   DJANGO REST API (Render Free Tier)                  │
│         Gunicorn WSGI → DRF Views → Permissions → Serializers        │
│                                                                      │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────────────┐  │
│  │  Auth API     │  │  Exams API    │  │  Pipeline API             │  │
│  │  JWT tokens   │  │  Questions    │  │  Scores / Leaderboards    │  │
│  │  Roles:       │  │  Submit       │  │  CSV Export / Reports     │  │
│  │  student      │  │  Answer Key   │  │  Aggregation / Deletion   │  │
│  │  teacher      │  │  Review       │  │  Dashboard Stats          │  │
│  └──────────────┘  └──────┬────────┘  └────────────┬──────────────┘  │
│                           │                        │                  │
└───────────────────────────┼────────────────────────┼──────────────────┘
                            │                        │
               ┌────────────┼────────────────────────┼──────────────┐
               ▼            ▼                        ▼              ▼
  ┌────────────────┐ ┌────────────┐ ┌──────────────────┐ ┌────────────────┐
  │  Neon.tech     │ │ Upstash    │ │  Supabase        │ │  cron-job.org  │
  │  PostgreSQL    │ │ Redis      │ │  Storage         │ │  Schedulers    │
  │  (1GB free)    │ │ (serverless│ │  (1GB free)      │ │  (HTTP triggers│
  │                │ │  cache)    │ │  Question images │ │   to backend)  │
  └────────────────┘ └────────────┘ └──────────────────┘ └────────────────┘
```

### Tech Stack

| Layer | Technology | Version | Free-Tier Constraint |
|---|---|---|---|
| Backend API | Django + DRF | 5.0–5.1 / ≥3.15 | Render Free: 512MB RAM, spins down after 15min idle |
| Frontend UI | React (Vite) | ^18.3.1 / ^5.4.0 | Vercel: 100GB bandwidth |
| Database | PostgreSQL (Neon.tech) | 14+ | 1GB storage via PgBouncer on port 6543 |
| Cache | Upstash Redis | Serverless | 10K commands/day free |
| Static Files | Whitenoise | ≥6.7 | Serves from Django process (no S3 needed) |
| JWT Auth | simplejwt | ≥5.3 | Access: 15min prod / 7 days dev; Refresh: 7 days |
| Cron | cron-job.org | Free | HTTP POST triggers to internal endpoints |

---

## Dynamic Workflow Logic

### Student Side — 5-State Dashboard

The exam window is driven by **admin question upload**, not fixed wall-clock times.
The `StudentDashboardView` backend endpoint computes the state dynamically.

| State | Trigger Condition | UI Behavior |
|---|---|---|
| `before_window` | No questions uploaded for today | "Awaiting exam deployment." Start Exam locked. |
| `in_progress` | Questions deployed; window timer active | Emerald green Start Exam card. Countdown ticking. |
| `submitted` | Student hit submit before window expired | "Exam submitted. Waiting for review window (2PM–7PM)." |
| `reviewed` | Window expired; DailyScore row exists | Score circle, per-question review, answer keys visible. |
| `missed` | Window expired; no submission found | "Absence Logged." All exam actions locked. |

**Dashboard Response Schema:**
```json
{
  "today_status": "in_progress",
  "today": { "score": 8, "total_questions": 10, "submitted_at": "..." },
  "recent_scores": [
    { "date": "2026-07-18", "score": 7, "total_questions": 10 }
  ],
  "total_exams_taken": 15,
  "average_score": 7.3
}
```

### Admin Side — Question Upload & Report Generation

1. **Upload:** Admin uploads exactly 10 questions with answer key via `POST /api/admin/upload-questions/`.
   The upload triggers a `pre_save` signal that purges stale CSVs and flushes the DailyLeaderboard.

2. **Report Generation:** After window expiration, the aggregation cron fires `aggregate_scores`.
   It generates a `Master_Report_YYYY-MM-DD.csv` with 6 columns:

| # | Column | Source |
|---|---|---|
| 1 | `Rank` | Computed on-the-fly (tied scores share rank) |
| 2 | `Register Number` | `CustomUser.roll_number` |
| 3 | `Student Name` | `CustomUser.full_name` |
| 4 | `Department` | `CustomUser.department` |
| 5 | `Score` | Matching answers / total |
| 6 | `Submission Time` | `StudentSubmission.submitted_at` |

3. **Tie-Breaking:** Same score → faster submission timestamp earns higher rank.
   Sort key: `(-score, +submitted_at)`. Tied scores get identical rank number.

4. **Auto-Deletion:** CSV gets a `ScheduledFileDeletion` record with 4-hour TTL from download time.
   Survives server restarts (DB-backed, not thread-based).

---

## Analytics & Data Retention

### The Trick: Persistent Scores Despite Daily Wipes

To stay within Neon's 1GB free tier, a **7:30 PM IST daily cron** triggers `cleanup_day` which destructively wipes:

- ALL `StudentSubmission` rows (raw JSON answer blocks)
- ALL `CustomUser` rows where `is_student=True` (auto-created accounts)
- ALL `DailyLeaderboard` rows

**BUT the `DailyScore` table is NEVER deleted.**

This lightweight table (student, exam_date, score) is the foundation for all cross-day analytics:

| Cron Job | Schedule | Input | Output | Logic |
|---|---|---|---|---|
| `compute_weekly_leaderboard` | Sunday 8PM IST | `DailyScore` (last 7 days) | `WeeklyLeaderboard` | `SUM(score)` grouped by student |
| `compute_monthly_leaderboard` | Month-end 8PM IST | `DailyScore` (last 30 days) | `MonthlyLeaderboard` | `SUM(score)` grouped by student |

### Daily Timeline

```
09:45 AM  →  POST /api/internal/warm-cache/               (Warm Redis cache)
10:00 AM  →  Exam window opens (questions served)
02:00 PM  →  Submissions rejected (409 Conflict)
02:00 PM  →  Review window opens (answer key exposed)
02:15 PM  →  POST /api/internal/aggregate-scores/         (Grade + CSV + DailyScore)
02:30 PM  →  POST /api/internal/process-deletions/        (Delete overdue CSVs, every 30min)
07:00 PM  →  Review window closes (answer key hidden)
07:30 PM  →  POST /api/internal/cleanup-day/              (Wipe submissions + students)
08:00 PM  →  POST /api/internal/compute-weekly-leaderboard/ (Sunday only)
```

---

## Complete Workspace Directory Tree

```
aptitude-test-platform/
├── CLAUDE.md                                   # AI assistant context
├── README.md                                   # This file
├── render.yaml                                 # Render.com deployment blueprint
├── .gitignore                                  # Python + Node + IDE + OS
│
├── docs/
│   └── PROJECT_STATUS.md                       # Per-member implementation tracking
│
├── backend/
│   ├── manage.py                               # Django management entry
│   ├── requirements.txt                        # Production dependencies
│   ├── requirements-dev.txt                    # Dev dependencies (locust, pytest)
│   ├── Procfile                                # gunicorn core.wsgi:application
│   ├── db.sqlite3                              # Local dev database
│   │
│   ├── core/
│   │   ├── urls.py                             # ALL URL route definitions
│   │   ├── wsgi.py                             # WSGI entry point
│   │   ├── permissions.py                      # IsStudentUser, IsTeacherUser, IsAnswerWindowOpen
│   │   └── settings/
│   │       ├── base.py                         # Shared: INSTALLED_APPS, JWT, TIME_ZONE=Asia/Kolkata
│   │       ├── local.py                        # Dev: SQLite, 7-day JWT, CORS localhost
│   │       └── production.py                   # Prod: PostgreSQL, 15min JWT, HSTS, SSL
│   │
│   ├── accounts/
│   │   ├── models.py                           # CustomUser (email as USERNAME_FIELD)
│   │   ├── managers.py                         # CustomUserManager
│   │   ├── views.py                            # login_view, register_view, student_signin_view
│   │   ├── serializers.py                      # Empty (views handle serialization inline)
│   │   └── tests.py                            # 21 tests (AnswerKeyTimeGate, Login, SecurityAudit)
│   │
│   ├── exams/
│   │   ├── models.py                           # Question, AnswerKey, StudentSubmission
│   │   ├── views.py                            # 13 exam API views
│   │   ├── serializers.py                      # QuestionSerializer, AdminQuestionSerializer
│   │   ├── cache.py                            # Redis cache get/set/warm
│   │   ├── admin.py                            # Django admin registrations
│   │   └── tests.py                            # 6 tests (StudentReviewWindowGate)
│   │
│   ├── pipeline/
│   │   ├── models.py                           # DailyScore, DailyLeaderboard, WeeklyLeaderboard,
│   │   │                                       # ScheduledFileDeletion, ReportDownloadLog
│   │   ├── views.py                            # Dashboard, Rankings, Reports, Cleanup endpoints
│   │   ├── aggregation.py                      # aggregate_and_export (CSV + DailyScore)
│   │   ├── signals.py                          # Stale CSV purge + DailyLeaderboard scoped flush
│   │   ├── admin.py                            # (empty)
│   │   ├── tests/
│   │   │   ├── test_aggregation.py             # 5 tests
│   │   │   ├── test_deletion.py                # 4 tests
│   │   │   ├── test_signals.py                 # 5 tests
│   │   │   ├── test_leaderboard.py             # 5 tests
│   │   │   └── test_integration.py             # 1 test
│   │   └── management/commands/
│   │       ├── aggregate_scores.py             # Grade submissions → DailyScore + CSV
│   │       ├── compute_weekly_leaderboard.py   # SUM(score) → WeeklyLeaderboard
│   │       ├── flush_weekly_leaderboard.py     # Delete all WeeklyLeaderboard rows
│   │       ├── process_deletions.py            # Delete overdue CSV files
│   │       └── cleanup_day.py                  # Wipe submissions + student accounts
│   │
│   └── tests/
│       └── locustfile.py                       # Load test (2000 concurrent users)
│
└── frontend/
    ├── index.html                              # Google Fonts + Material Symbols + Remix Icons
    ├── package.json                            # React 18, Vite 5, Axios, React Router 6
    ├── vite.config.js                          # Dev proxy /api → localhost:8000
    │
    └── src/
        ├── main.jsx                            # Entry: renders <AppRouter />
        ├── index.css                           # Global styles, CSS variables, fonts
        │
        ├── api/
        │   └── client.js                       # Axios instance + authAPI, examAPI, studentAPI, adminAPI
        │
        ├── router/
        │   ├── AppRouter.jsx                   # React Router v6 BrowserRouter (all routes)
        │   └── ProtectedRoute.jsx              # JWT decode + role guard
        │
        ├── hooks/
        │   ├── usePersistedAnswers.js          # Base64-encoded localStorage answer persistence
        │   └── useExamCountdown.js             # Countdown timer + auto-submit trigger
        │
        ├── components/
        │   ├── QuestionCard.jsx                # Question + image + 4 option buttons
        │   ├── CountdownTimer.jsx              # Timer display component
        │   ├── StudentBottomNav.jsx            # 3-tab nav: Home | Exam | Rank
        │   └── BottomNav.jsx                   # Admin bottom navigation
        │
        └── pages/
            ├── Login.jsx                       # Student passwordless sign-in + admin link
            ├── student/
            │   ├── Register.jsx                # Student registration with password
            │   ├── StudentDashboard.jsx        # 5-state dynamic dashboard
            │   ├── ExamPage.jsx                # Real API exam interface with countdown
            │   ├── StudentResult.jsx           # Score circle + per-question review
            │   ├── AnswerReview.jsx            # Answer review with polling
            │   └── LeaderboardPage.jsx         # Student leaderboard view
            └── admin/
                ├── AdminLogin.jsx              # Teacher/admin login
                ├── AdminDashboard.jsx          # Stats dashboard with nav tiles
                ├── AdminQuestions.jsx           # Question management (list by date)
                ├── AdminQuestionDateDetail.jsx # Questions for a specific date
                ├── TeacherUpload.jsx           # Bulk question upload form
                ├── PlatformAnalytics.jsx       # Analytics with SVG charts
                ├── RankPage.jsx                # Daily/weekly rankings
                └── TeacherReports.jsx          # Report download with date filters
```

---

## The Master TODO Checklist

### Phase 1 — Student Dashboard & Result Flow

- [x] `StudentDashboardView` backend endpoint (`GET /api/student/dashboard/`)
- [x] `StudentDashboard.jsx` — 5-state exam card, stats row, recent scores
- [x] `StudentResult.jsx` — submitted confirmation + score review after 2PM
- [x] `StudentBottomNav.jsx` — 3-tab nav (Home | Exam | Rank)
- [x] `studentAPI.getDashboard()` added to Axios client
- [x] `AppRouter.jsx` — added `/student/dashboard`, `/student/result`, `/student` routes
- [x] `Login.jsx` + `Register.jsx` redirect changed to `/student/dashboard`
- [x] `ExamPage.jsx` post-submit navigates to `/student/result`
- [x] Backend 503 fix: queries DB directly when Redis unavailable
- [x] Backend 400 fix: `not answers` → `answers is None` (empty dict accepted)
- [x] ExamPage auto-submit guard: skips when `questions.length === 0`

### Phase 2 — Backend Hardening

- [x] Question count validation: exactly 10 required in `UploadQuestionsView`
- [x] `DailyLeaderboard` signal flush scoped per-date (was global `.all().delete()`)
- [x] `cleanup_day` management command created
- [x] `cleanup_day_view` cron endpoint at `POST /api/internal/cleanup-day/`
- [x] `conn_max_age=0` → `conn_max_age=600` in production settings
- [x] `whitenoise` added to requirements.txt and MIDDLEWARE
- [x] `STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'`
- [x] Signal tests updated for per-date scope

### Phase 3 — Deployment & Infrastructure

- [x] `render.yaml` Python version `3.11.8` → `3.14`
- [x] `requirements-dev.txt` created (locust, pytest, pytest-django)
- [x] HSTS headers added to production settings
- [x] `.gitignore` expanded (Python, IDE, OS, Django, React, testing)
- [ ] **FIX:** `cleanup_day` must NOT delete `DailyScore` rows (currently does)
- [ ] Add `department` field to `CustomUser` model
- [ ] Add `MonthlyLeaderboard` model + `compute_monthly_leaderboard` command
- [ ] Add `/api/internal/aggregate-scores/` HTTP endpoint (command exists, endpoint missing)

### Phase 4 — Cron-Job.org Automation Schedule

| # | Job Name | Schedule (IST) | Endpoint | Auth |
|---|---|---|---|---|
| 1 | Keep-Alive | Every 10 min | `GET /api/health/` | None |
| 2 | Cache Warming | 9:45 AM daily | `POST /api/internal/warm-cache/` | X-Cron-Secret |
| 3 | CSV Cleanup | Every 30 min | `POST /api/internal/process-deletions/` | X-Cron-Secret |
| 4 | Daily Wipe | 7:30 PM daily | `POST /api/internal/cleanup-day/` | X-Cron-Secret |
| 5 | Weekly Flush | Sunday 7:45 PM | `POST /api/internal/flush-weekly-leaderboard/` | X-Cron-Secret |
| 6 | Weekly Compute | Sunday 8:00 PM | `POST /api/internal/compute-weekly-leaderboard/` | X-Cron-Secret |
| 7 | Monthly Compute | Month-end 8:15 PM | `POST /api/internal/compute-monthly-leaderboard/` | X-Cron-Secret |

### Known Issues

| # | Issue | Severity | Location |
|---|---|---|---|
| 1 | `cleanup_day` deletes DailyScore (should preserve) | CRITICAL | `pipeline/management/commands/cleanup_day.py` |
| 2 | No `department` field on CustomUser (not stored in DB) | HIGH | `accounts/models.py` |
| 3 | No MonthlyLeaderboard model | MEDIUM | `pipeline/models.py` |
| 4 | `LeaderboardPage.jsx` uses mock data | HIGH | `frontend/src/pages/student/LeaderboardPage.jsx` |
| 5 | Mixed icon systems (Remix vs Material Symbols) | LOW | Admin vs student pages |

---

## API Endpoint Reference

### Public

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health/` | Health check → `{"status": "ok"}` |
| POST | `/api/auth/login/` | Email/password login → JWT tokens |
| POST | `/api/auth/register/` | Student registration (with password) |
| POST | `/api/auth/student-signin/` | Passwordless sign-in (auto-creates user) |
| POST | `/api/auth/refresh/` | Refresh access token |

### Authenticated (JWT Bearer)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tests/questions/?date=YYYY-MM-DD` | Get exam questions (Redis-cached) |
| GET | `/api/tests/answers/?date=YYYY-MM-DD` | Get answer key (2PM–7PM only) |
| POST | `/api/tests/submit/` | Submit exam answers (before 2PM only) |
| GET | `/api/student/dashboard/` | Student dashboard data |
| GET | `/api/student/review/` | Review answers + score (2PM–7PM) |
| GET | `/api/student/leaderboard/` | Student leaderboard |

### Admin (Teacher Only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard-stats/` | Admin dashboard statistics |
| POST | `/api/admin/upload-questions/` | Upload 10 questions + answer key |
| GET | `/api/admin/questions/` | List/search questions |
| GET/DELETE | `/api/admin/questions/<id>/` | View/delete single question |
| GET | `/api/admin/rankings/?period=daily&top=10` | Daily/weekly rankings |
| GET | `/api/admin/reports/?range=weekly` | Attendance & performance reports |
| GET | `/api/admin/download-report/<date>/` | Download CSV report |

### Internal Cron (X-Cron-Secret Header)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/internal/warm-cache/` | Pre-load questions into Redis |
| POST | `/api/internal/process-deletions/` | Delete overdue CSV files |
| POST | `/api/internal/cleanup-day/` | Daily data wipe |
| POST | `/api/internal/flush-weekly-leaderboard/` | Flush weekly leaderboard |
| POST | `/api/internal/compute-weekly-leaderboard/` | Recompute weekly leaderboard |

---

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate          # Windows PowerShell
# source venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py test            # 47 tests pass
python manage.py runserver       # http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

### Student Flow

1. Open `http://localhost:5173`
2. Fill in details (name, roll number, department, email) → **Sign In**
3. Dashboard shows today's exam status → **Start Exam**
4. Answer 10 questions → **Submit** → redirected to result page
5. After 2PM: view score, correct answers, per-question review

### Admin Flow

1. Open `http://localhost:5173/admin/login`
2. Login with teacher credentials
3. Upload 10 questions → View stats → Download reports

---

## Environment Variables

| Variable | Dev Value | Prod Value | Description |
|---|---|---|---|
| `SECRET_KEY` | `local-dev-only` | Random 50-char | Django secret key |
| `DEBUG` | `True` | `false` | Debug mode |
| `DJANGO_SETTINGS_MODULE` | `core.settings.local` | `core.settings.production` | Settings |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Your Render domain | Allowed hosts |
| `DATABASE_URL` | N/A (SQLite) | Neon PostgreSQL (pooled) | DB connection |
| `UPSTASH_REDIS_URL` | N/A (optional) | Upstash REST URL | Redis cache |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Vercel frontend URL | CORS whitelist |
| `CRON_SECRET_KEY` | `dev-cron-secret` | Random 32-char | Internal cron auth |

---

## Local WAMP / MySQL Portability

Django abstracts the database layer via `DATABASE_URL` and `dj-database-url`.
Switching from PostgreSQL to MySQL for local WAMP Server deployment requires:

### Step 1 — Install MySQL Driver

```bash
pip uninstall psycopg2-binary
pip install mysqlclient
```

### Step 2 — Update DATABASE_URL

```bash
# In your .env file:
DATABASE_URL=mysql://root:password@localhost:3306/apptist_db
```

### Step 3 — Add MySQL-Specific Settings

```python
# In settings/local.py (or a new settings/wamp.py):
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'apptist_db',
        'USER': 'root',
        'PASSWORD': 'password',
        'HOST': '127.0.0.1',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
        },
    }
}
```

### Step 4 — Run Migrations

```bash
python manage.py migrate
```

### Notes

- MySQL has no JSONField natively in older versions. Django 5.0+ supports `JSONField` on MySQL 8.0+.
- The `UniqueConstraint` on `StudentSubmission` and `DailyScore` works identically on MySQL.
- Redis caching is database-agnostic — no changes needed.
- The `pgbouncer` connection string is PostgreSQL-specific and should NOT be used with MySQL.
- For production WAMP deployment, replace `gunicorn` with Apache mod_wsgi.

---

## Testing

### Backend Tests (47 total)

```bash
cd backend
python manage.py test --verbosity 2
```

| Suite | Tests | Coverage |
|---|---|---|
| Auth & Security (`accounts/tests.py`) | 21 | AnswerKeyTimeGate (6), LoginEndpoint (7), SecurityAudit (8) |
| Exam Review (`exams/tests.py`) | 6 | StudentReviewWindowGate (6) |
| Pipeline (`pipeline/tests/`) | 19 | Aggregation (5), Deletion (4), Signals (5), Leaderboard (5), Integration (1) |

### Load Testing

```bash
cd backend
pip install -r requirements-dev.txt
locust -f tests/locustfile.py --host=http://127.0.0.1:8000
# Open http://localhost:8089 to configure 2000 concurrent users
```

### Frontend

```bash
cd frontend
npm run build    # Verify production build succeeds
```

---

## Security Constraints

1. **NEVER expose `CRON_SECRET_KEY` in frontend code** — server-to-server only
2. **Time windows are IST (Asia/Kolkata)** — `TIME_ZONE = 'Asia/Kolkata'`, `USE_TZ = True`
3. **One submission per student per day** — enforced by `UniqueConstraint`
4. **CSV reports auto-delete after 4 hours** — `ScheduledFileDeletion` TTL
5. **Questions return 503 during exam window on cache miss** — intentional DB protection
6. **Production JWT access tokens expire in 15 minutes** — frontend must handle refresh
7. **Exactly 10 questions per upload** — enforced in `UploadQuestionsView`
8. **DailyScore table is NEVER deleted** — persistent analytics foundation
9. **Student accounts wiped daily** — re-created on next sign-in
10. **All API routes in `core/urls.py`** — app-level urls.py files are empty by design

---

*Last updated: July 2026*
*Developer: Muhammed Fahim (Solo CS/Data Science student) — Nehru Group of Institutions*
