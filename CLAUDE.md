# CLAUDE.md — Aptitude Test Platform

> **Purpose:** This document provides Claude (or any AI assistant) with a complete understanding of the project — architecture, codebase conventions, sprint structure, development workflow, and all critical constraints. Read this file before making any changes to the codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture & Directory Structure](#3-architecture--directory-structure)
4. [Team & Ownership](#4-team--ownership)
5. [Sprint Structure & Backlogs](#5-sprint-structure--backlogs)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Exam Time Windows (Critical Business Logic)](#9-exam-time-windows-critical-business-logic)
10. [Data Pipeline & Background Jobs](#10-data-pipeline--background-jobs)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Caching Strategy (Redis)](#12-caching-strategy-redis)
13. [Testing](#13-testing)
14. [Deployment & Environment](#14-deployment--environment)
15. [Development Conventions](#15-development-conventions)
16. [Known Issues & TODOs](#16-known-issues--todos)
17. [Critical Constraints & Rules](#17-critical-constraints--rules)

---

## 1. Project Overview

**Name:** Apptist — NGI Aptitude Portal  
**Institution:** Nehru Group of Institutions  
**Type:** Full-stack web application for daily aptitude tests  

**What it does:**
- Students sign in (passwordless), take a daily timed aptitude test (20 MCQs, 60 minutes)
- Submissions are graded against an answer key
- Scores are aggregated into daily and weekly leaderboards
- Teachers/admins can download CSV reports
- Reports auto-delete after 4 hours (privacy compliance)

**User Flow:**
```
Student Login → Dashboard → Assessment Details → Exam (timed) → Submit → Processing → Success
                                                                                    ↓
                                                                              Answer Review
```

---

## 2. Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.14.4 | Runtime |
| Django | 5.0 – 5.1 | Web framework |
| Django REST Framework | ≥3.15 | API layer |
| simplejwt | ≥5.3 | JWT authentication |
| django-cors-headers | ≥4.3 | CORS handling |
| redis | ≥5.0 | Caching (Upstash Redis in prod) |
| gunicorn | ≥22.0 | WSGI server (production) |
| psycopg2-binary | ≥2.9 | PostgreSQL adapter (production) |
| dj-database-url | ≥2.1 | Database URL parsing |
| locust | ≥2.31 | Load testing |
| SQLite | built-in | Dev database |
| PostgreSQL | — | Production database |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | ^18.3.1 | UI library |
| Vite | ^5.4.0 | Build tool |
| Axios | ^1.7.0 | HTTP client |
| React Router DOM | ^6.26.0 | Installed but NOT used (custom router) |
| jwt-decode | ^4.0.0 | Installed but NOT currently used |

### Styling
- **No CSS framework** — all inline styles
- Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (labels)
- Icons: Google Material Symbols Outlined
- Mobile-first design (max-width: 480px)
- Consistent color tokens defined as `C` constants in each component

---

## 3. Architecture & Directory Structure

```
aptitude-test-platform/
├── CLAUDE.md                          ← YOU ARE HERE
├── README.md                          (has merge conflicts — do not trust)
├── docs/
│   ├── PROJECT_IMPLEMENTATION_KIT.md  (placeholder — not yet written)
│   └── aptitude_test_platform.postman_collection.json
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── Procfile                       (Heroku/Render deploy)
│   ├── db.sqlite3                     (dev database)
│   ├── venv/                          (Python 3.14.4 venv)
│   ├── core/                          ← Django project root
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py                ← Shared settings (timezone, JWT, apps)
│   │   │   ├── local.py               ← Dev settings (SQLite, 7-day tokens)
│   │   │   └── production.py          ← Prod settings (PostgreSQL, 15-min tokens)
│   │   ├── urls.py                    ← ALL route definitions live here
│   │   ├── wsgi.py
│   │   ├── asgi.py
│   │   └── permissions.py             ← Custom DRF permissions
│   │
│   ├── accounts/                      ← User model, auth endpoints
│   │   ├── models.py                  ← CustomUser (email as USERNAME_FIELD)
│   │   ├── managers.py                ← CustomUserManager
│   │   ├── views.py                   ← Login, register, student-signin, refresh
│   │   ├── serializers.py
│   │   └── tests.py                   ← Auth & security tests (~21 tests)
│   │
│   ├── exams/                         ← Questions, answer keys, submissions
│   │   ├── models.py                  ← Question, AnswerKey, StudentSubmission
│   │   ├── views.py                   ← Questions, answers, submit endpoints
│   │   ├── serializers.py
│   │   ├── cache.py                   ← Redis cache logic for questions
│   │   └── management/commands/
│   │       └── warm_question_cache.py  ← Cron-triggered cache preloader
│   │
│   ├── pipeline/                      ← Score aggregation & leaderboards
│   │   ├── models.py                  ← DailyScore, Daily/WeeklyLeaderboard, etc.
│   │   ├── views.py                   ← Report download, internal cron endpoints
│   │   ├── aggregation.py             ← Core scoring logic
│   │   ├── signals.py                 ← Stale CSV purge on new question upload
│   │   ├── tests/                     ← ~14 tests (aggregation, deletion, signals, integration)
│   │   └── management/commands/
│   │       ├── aggregate_scores.py    ← Grade submissions for a date
│   │       ├── compute_weekly_leaderboard.py
│   │       ├── flush_weekly_leaderboard.py
│   │       └── process_deletions.py   ← Auto-delete expired CSVs
│   │
│   └── tests/
│       └── locustfile.py              ← Load test (2000 concurrent users)
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    │   ├── app-logo.png
    │   └── college-logo.png
    └── src/
        ├── main.jsx                   ← Entry point
        ├── App.jsx                    ← Root component
        ├── index.css                  ← Global styles
        ├── api/
        │   └── client.js             ← Axios instance with JWT interceptors
        ├── router/
        │   ├── AppRouter.jsx          ← Custom state-based router (NOT React Router)
        │   └── ProtectedRoute.jsx     ← TODO placeholder
        ├── hooks/
        │   ├── usePersistedAnswers.js ← TODO placeholder
        │   └── useExamCountdown.js    ← TODO placeholder
        ├── components/
        │   ├── QuestionCard.jsx       ← TODO placeholder
        │   └── CountdownTimer.jsx     ← TODO placeholder
        └── pages/
            ├── Login.jsx              ← Full implementation (passwordless student sign-in)
            ├── student/
            │   ├── Register.jsx       ← Student registration with password
            │   ├── Dashboard.jsx      ← Welcome, profile, nav to exam/review
            │   ├── AssessmentDetails.jsx ← Exam instructions & consent
            │   ├── ExamPage.jsx       ← Exam UI (⚠️ TEMPORARY preview mode — see §16)
            │   ├── SubmitPage.jsx     ← Question palette + submit
            │   ├── ProcessingPage.jsx ← Animated processing screen
            │   ├── SuccessPage.jsx    ← Confirmation
            │   └── AnswerReview.jsx   ← Score breakdown & question review
            └── teacher/
                └── TeacherUpload.jsx  ← TODO placeholder
```

---

## 4. Team & Ownership

| Member | Role | Owned Areas |
|---|---|---|
| **Muhammed Fahim** | Scrum Master / Lead Data Pipeline Engineer | `pipeline/` app, aggregation logic, management commands, cron setup, scoring algorithms |
| **Shahin Shafi** | Backend / API & Security Architect | `accounts/` app, `core/` config, auth system, permissions, URL routing, Django project init |
| **Sreekuttan** | Backend / Performance & Caching Engineer | Redis caching (`exams/cache.py`), `warm_question_cache`, performance tuning, CORS config |
| **Vijay** | Frontend / UI & Router Lead | Page layouts, routing system (`AppRouter.jsx`), UI components, `TeacherUpload`, `ProtectedRoute` |
| **Vikky** | Frontend / State & Client-Cache Lead | State management, `usePersistedAnswers`, `useExamCountdown`, `CountdownTimer`, client-side caching |

---

## 5. Sprint Structure & Backlogs

### Sprint 1 — Foundation (Completed)

**Goal:** Project scaffolding, authentication, and core models.

| Task | Owner | Status | Files |
|---|---|---|---|
| Django project init (`core/`) | Shahin | ✅ Done | `core/settings/`, `core/urls.py` |
| Custom User model | Shahin | ✅ Done | `accounts/models.py`, `accounts/managers.py` |
| JWT auth setup | Shahin | ✅ Done | `base.py` (SIMPLE_JWT) |
| Auth endpoints (login, register, student-signin) | Shahin | ✅ Done | `accounts/views.py` |
| Custom permissions | Shahin | ✅ Done | `core/permissions.py` |
| Question model | Shahin | ✅ Done | `exams/models.py` |
| AnswerKey model | Fahim | ✅ Done | `exams/models.py` |
| StudentSubmission model | Fahim | ✅ Done | `exams/models.py` |
| Postman collection | Shahin | ✅ Done | `docs/aptitude_test_platform.postman_collection.json` |
| Frontend scaffolding (Vite + React) | Vijay | ✅ Done | `frontend/` |
| Login page | Vijay | ✅ Done | `pages/Login.jsx` |
| Dashboard page | Vijay | ✅ Done | `pages/student/Dashboard.jsx` |
| Exam page (temp preview) | Vikky | ✅ Done | `pages/student/ExamPage.jsx` |
| Axios client with interceptors | Vikky | ✅ Done | `api/client.js` |

### Sprint 2 — API & Integration (Completed)

**Goal:** Complete exam flow, answer key, submission, and time-gating.

| Task | Owner | Status | Files |
|---|---|---|---|
| Questions endpoint (date-filtered) | Sreekuttan | ✅ Done | `exams/views.py` |
| Redis caching for questions | Sreekuttan | ✅ Done | `exams/cache.py`, `warm_question_cache.py` |
| Answer key endpoint (time-gated) | Shahin | ✅ Done | `exams/views.py` |
| Submit answers endpoint | Shahin | ✅ Done | `exams/views.py` |
| Student registration page | Vijay | ✅ Done | `pages/student/Register.jsx` |
| Assessment details page | Vijay | ✅ Done | `pages/student/AssessmentDetails.jsx` |
| Submit page (question palette) | Vijay | ✅ Done | `pages/student/SubmitPage.jsx` |
| Processing page | Vikky | ✅ Done | `pages/student/ProcessingPage.jsx` |
| Success page | Vikky | ✅ Done | `pages/student/SuccessPage.jsx` |
| Answer review page | Vikky | ✅ Done | `pages/student/AnswerReview.jsx` |
| Answer key time-gate tests | Shahin | ✅ Done | `accounts/tests.py` |

### Sprint 3 — Pipeline & Analytics (Completed)

**Goal:** Score aggregation, leaderboards, CSV reports, data lifecycle.

| Task | Owner | Status | Files |
|---|---|---|---|
| Score aggregation logic | Fahim | ✅ Done | `pipeline/aggregation.py` |
| DailyScore model | Fahim | ✅ Done | `pipeline/models.py` |
| DailyLeaderboard model | Fahim | ✅ Done | `pipeline/models.py` |
| WeeklyLeaderboard model | Fahim | ✅ Done | `pipeline/models.py` |
| aggregate_scores command | Fahim | ✅ Done | `pipeline/management/commands/` |
| compute_weekly_leaderboard command | Fahim | ✅ Done | `pipeline/management/commands/` |
| flush_weekly_leaderboard command | Fahim | ✅ Done | `pipeline/management/commands/` |
| CSV report generation | Fahim | ✅ Done | `pipeline/aggregation.py` |
| Scheduled file deletion (4-hour TTL) | Fahim | ✅ Done | `pipeline/models.py`, `process_deletions.py` |
| Stale CSV purge signal | Fahim | ✅ Done | `pipeline/signals.py` |
| Report download endpoint | Fahim | ✅ Done | `pipeline/views.py` |
| Pipeline unit tests (14 tests) | Fahim | ✅ Done | `pipeline/tests/` |

### Sprint 4 — Quality, Security & Deployment (In Progress)

**Goal:** Testing, security audit, performance, deployment, documentation.

| Task | Owner | Status | Files |
|---|---|---|---|
| Auth & security tests (21 tests) | Shahin | ✅ Done | `accounts/tests.py` |
| Load testing with Locust (2000 users) | Sreekuttan | ✅ Done | `tests/locustfile.py` |
| Production settings | Shahin | ✅ Done | `core/settings/production.py` |
| Procfile for deployment | Shahin | ✅ Done | `backend/Procfile` |
| Environment variables setup | Shahin | ✅ Done | `.env.example` |
| ProtectedRoute component | Vijay | ⬜ TODO | `router/ProtectedRoute.jsx` |
| TeacherUpload page | Vijay | ⬜ TODO | `pages/teacher/TeacherUpload.jsx` |
| QuestionCard component | Vijay | ⬜ TODO | `components/QuestionCard.jsx` |
| CountdownTimer component | Vikky | ⬜ TODO | `components/CountdownTimer.jsx` |
| usePersistedAnswers hook | Vikky | ⬜ TODO | `hooks/usePersistedAnswers.js` |
| useExamCountdown hook | Vikky | ⬜ TODO | `hooks/useExamCountdown.js` |
| Revert ExamPage from temp to real API | Vikky | ⬜ TODO | `pages/student/ExamPage.jsx` |
| Write PROJECT_IMPLEMENTATION_KIT.md | All | ⬜ TODO | `docs/PROJECT_IMPLEMENTATION_KIT.md` |
| Fix README.md merge conflicts | All | ⬜ TODO | `README.md` |
| CI/CD pipeline | All | ⬜ Not Started | — |
| Frontend testing setup | Vijay/Vikky | ⬜ Not Started | — |

---

## 6. Database Schema

### `accounts.CustomUser`
```python
# AbstractBaseUser + PermissionsMixin
email          = EmailField(unique=True)          # Used as USERNAME_FIELD
full_name      = CharField(max_length=150)
roll_number    = CharField(max_length=20, unique=True, null=True)
is_student     = BooleanField(default=False)
is_teacher     = BooleanField(default=False)
is_active      = BooleanField(default=True)
is_staff       = BooleanField(default=False)
```

### `exams.Question`
```python
exam_date      = DateField(db_index=True)
text           = TextField
option_a       = CharField(max_length=500)
option_b       = CharField(max_length=500)
option_c       = CharField(max_length=500)
option_d       = CharField(max_length=500)
image_url      = URLField(null=True, blank=True)
created_at     = DateTimeField(auto_now_add=True)
# Ordering: exam_date, then id
```

### `exams.AnswerKey`
```python
date              = DateField(unique=True)
correct_answers   = JSONField   # e.g. {"q1": "A", "q2": "B", ...}
created_at        = DateTimeField(auto_now_add=True)
updated_at        = DateTimeField(auto_now=True)
```

### `exams.StudentSubmission`
```python
student        = ForeignKey(CustomUser)
exam_date      = DateField
answers        = JSONField   # e.g. {"q1": "B", "q2": "A", ...}
submitted_at   = DateTimeField(auto_now_add=True)
updated_at     = DateTimeField(auto_now=True)
# UniqueConstraint: (student, exam_date) — one submission per student per day
```

### `pipeline.DailyScore`
```python
student        = ForeignKey(CustomUser)
exam_date      = DateField(db_index=True)
score          = PositiveSmallIntegerField
# UniqueConstraint: (student, exam_date)
```

### `pipeline.DailyLeaderboard`
```python
student        = ForeignKey(CustomUser)
exam_date      = DateField
score          = PositiveSmallIntegerField
rank           = PositiveSmallIntegerField
# Indexed: (exam_date, rank)
```

### `pipeline.WeeklyLeaderboard`
```python
student        = ForeignKey(CustomUser)
week_start     = DateField
total_score    = PositiveIntegerField
rank           = PositiveSmallIntegerField
# Indexed: (week_start, rank)
```

### `pipeline.ScheduledFileDeletion`
```python
file_path      = CharField(max_length=500)
delete_after   = DateTimeField
deleted        = BooleanField(default=False)
# Indexed: (delete_after, deleted)
```

### `pipeline.ReportDownloadLog`
```python
file_path                = CharField(max_length=500)
downloaded_at            = DateTimeField(auto_now_add=True)
scheduled_deletion_at    = DateTimeField
```

---

## 7. API Reference

All routes are defined in `backend/core/urls.py`.

### Public Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health/` | Health check → `{"status": "ok"}` |
| POST | `/api/auth/login/` | Email/password login → JWT tokens |
| POST | `/api/auth/register/` | Student registration (with password) |
| POST | `/api/auth/student-signin/` | Passwordless sign-in (auto-creates user) |
| POST | `/api/auth/refresh/` | Refresh access token |

### Authenticated Endpoints (JWT Bearer)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tests/questions/?date=YYYY-MM-DD` | Get exam questions (Redis-cached) |
| GET | `/api/tests/answers/?date=YYYY-MM-DD` | Get answer key (2PM–7PM only) |
| POST | `/api/tests/submit/` | Submit exam answers (before 2PM only) |
| GET | `/api/admin/download-report/<exam_date>/` | Download CSV report |

### Internal Cron Endpoints (X-Cron-Secret header)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/internal/warm-cache/` | Pre-load questions into Redis |
| POST | `/api/internal/process-deletions/` | Delete overdue CSV files |
| POST | `/api/internal/flush-weekly-leaderboard/` | Clear weekly leaderboard |
| POST | `/api/internal/compute-weekly-leaderboard/` | Recompute weekly leaderboard |

### Response Formats

**Login success:**
```json
{
  "access": "...",
  "refresh": "...",
  "user": {
    "email": "...",
    "full_name": "...",
    "roll_number": "...",
    "is_student": true,
    "is_teacher": false
  }
}
```

**Questions response:**
```json
{
  "date": "2025-07-15",
  "questions": [
    {
      "id": 1,
      "text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "image_url": null
    }
  ]
}
```

**Submit response (success):**
```json
{
  "message": "Submission received",
  "student": "...",
  "exam_date": "2025-07-15",
  "answers_submitted": 20
}
```

**Submit response (late — 409):**
```json
{
  "detail": "Exam window closed. Submissions are no longer accepted after 2:00 PM IST."
}
```

---

## 8. Authentication & Authorization

### JWT Configuration
| Setting | Development | Production |
|---|---|---|
| Access token lifetime | 7 days | **15 minutes** |
| Refresh token lifetime | 7 days | 7 days |
| Rotate on refresh | Yes | Yes |
| Blacklist after rotation | Yes | Yes |
| Auth header type | `Bearer` | `Bearer` |

### JWT Payload Contains
- `email`, `is_student`, `is_teacher`, `roll_number`, `full_name`

### Custom Permissions (`core/permissions.py`)
- `IsStudentUser` — checks `request.user.is_student`
- `IsTeacherUser` — checks `request.user.is_teacher`
- `IsAnswerWindowOpen` — currently always returns `True` (time gating is in views, not permissions)

### Frontend Token Management (`api/client.js`)
- Tokens stored in `localStorage` as `access_token` and `refresh_token`
- Request interceptor: attaches `Authorization: Bearer <token>` to every request
- Response interceptor: auto-refreshes on 401, redirects to `/login` on refresh failure

### Cron Endpoint Protection
- Protected by `X-Cron-Secret` header
- Must match `CRON_SECRET_KEY` environment variable
- Never expose this key in frontend code

---

## 9. Exam Time Windows (Critical Business Logic)

All times are in **IST (Asia/Kolkata)**. This is the most important business constraint in the system.

| Time Window | Activity | Enforcement |
|---|---|---|
| **9:45 AM** | Cache warming (cron) | `warm_question_cache` command |
| **10:00 AM – 2:00 PM** | Questions available | `exams/views.py` returns questions |
| **Before 2:00 PM** | Submissions accepted | `exams/views.py` accepts POST to `/submit/` |
| **After 2:00 PM** | Submissions rejected (409) | `exams/views.py` returns 409 |
| **2:00 PM – 7:00 PM** | Answer key visible | `exams/views.py` returns answer key |
| **Outside 2–7 PM** | Answer key hidden (403) | `exams/views.py` returns 403 |
| **After CSV download** | 4-hour auto-deletion | `pipeline/` scheduled deletion |

---

## 10. Data Pipeline & Background Jobs

### Score Aggregation Flow
```
1. Student submits answers → StudentSubmission record created
2. Cron triggers: aggregate_scores --date=YYYY-MM-DD
3. aggregation.py compares submission.answers vs AnswerKey.correct_answers
4. DailyScore record created per student
5. CSV exported to media/exports/Master_Report_YYYY-MM-DD.csv
6. ScheduledFileDeletion record created (TTL = 4 hours)
```

### Management Commands
```bash
# Grade submissions for a specific date
python manage.py aggregate_scores --date=2025-07-15

# Compute weekly leaderboard from DailyScore records
python manage.py compute_weekly_leaderboard

# Clear weekly leaderboard (run before recompute)
python manage.py flush_weekly_leaderboard

# Delete overdue CSV files
python manage.py process_deletions

# Pre-warm Redis cache for questions (normally cron-triggered at 9:45 AM)
python manage.py warm_question_cache --date=2025-07-15
```

### Signals
- `post_save` on `Question`: when new questions are uploaded for a previously unseen exam date, all stale CSVs and `DailyLeaderboard` records for that date are purged.

---

## 11. Frontend Architecture

### Routing
The frontend uses a **custom state-based router** in `AppRouter.jsx`, NOT React Router's `<BrowserRouter>`. Navigation is managed via `useState`. React Router DOM is installed but unused.

### Page Components
| Page | Path | Description |
|---|---|---|
| Login | `/` | Passwordless student sign-in |
| Register | `/register` | Student registration with password |
| Dashboard | `/dashboard` | Welcome, profile, nav links |
| Assessment Details | `/assessment` | Exam instructions, consent |
| Exam | `/exam` | Question-by-question interface (⚠️ TEMP mode) |
| Submit | `/submit` | Question palette, summary, submit |
| Processing | `/processing` | Animated loading screen |
| Success | `/success` | Confirmation |
| Answer Review | `/review` | Score breakdown |

### Design System
All components use inline styles with this color palette:
```javascript
const C = {
  primary: '#1a73e8',
  primaryDark: '#1557b0',
  bg: '#f0f2f5',
  card: '#ffffff',
  text: '#1a1a2e',
  textMuted: '#6b7280',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  border: '#e5e7eb',
  inputBg: '#f8f9fa',
}
```

### API Client (`api/client.js`)
- Axios instance with `baseURL: http://127.0.0.1:8000`
- Request interceptor: attaches JWT from localStorage
- Response interceptor: auto-refresh on 401, redirect on failure

---

## 12. Caching Strategy (Redis)

- **What's cached:** Exam questions by date (`questions:{date}`)
- **Cache warming:** Cron triggers `warm_question_cache` at 9:45 AM IST (15 min before exam)
- **Cache miss during exam window (10AM–2PM):** Returns 503 Service Unavailable
- **Cache miss outside exam window:** Returns questions from database directly
- **Production:** Upstash Redis (cloud-hosted)
- **Development:** Local Redis or no caching (graceful fallback)

---

## 13. Testing

### Backend Tests (~35 tests)

**Auth & Security (`accounts/tests.py`):**
- AnswerKeyTimeGateTest (6 tests) — time-gated answer key access
- LoginEndpointTest (7 tests) — login success/failure scenarios
- SecurityAuditTest (8 tests) — unauthorized access, invalid tokens

**Pipeline (`pipeline/tests/`):**
- test_aggregation.py (5 tests) — scoring logic
- test_deletion.py (4 tests) — scheduled file deletion
- test_signals.py (4 tests) — stale CSV purge
- test_leaderboard.py (5 tests) — weekly leaderboard
- test_integration.py (1 test) — full CSV lifecycle

### Load Testing
- **Tool:** Locust (`tests/locustfile.py`)
- **Simulated load:** 2,000 concurrent users
- **Task weights:** get_questions (4), submit_answers (1), health_check (1)
- **Pass criteria:** 0% failure, p95 < 200ms, p99 < 500ms

### Running Tests
```bash
# Unit/integration tests
cd backend
python manage.py test

# Load test
cd backend
locust -f tests/locustfile.py --host=http://127.0.0.1:8000
```

### Frontend Testing
- **Not yet set up** — no Jest, Vitest, or testing library installed

---

## 14. Deployment & Environment

### Environment Variables
```bash
SECRET_KEY=change-me-to-a-random-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://user:pass@host:5432/dbname
UPSTASH_REDIS_URL=redis://localhost:6379
CRON_SECRET_KEY=change-me-cron-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Production Differences
- `DEBUG = False` (mandatory)
- PostgreSQL with SSL (via `DATABASE_URL`)
- JWT access token: **15 minutes** (not 7 days)
- SSL redirect enabled
- Secure cookies (session + CSRF)
- `SECURE_PROXY_SSL_HEADER` for reverse proxies

### Deployment
- **Procfile:** `web: gunicorn core.wsgi:application`
- **Compatible with:** Heroku, Render, Railway
- **No Docker, no CI/CD configured yet**

---

## 15. Development Conventions

### Code Style
- **No comments** in code unless absolutely necessary
- **Inline styles only** on frontend (no CSS files, no Tailwind)
- **Python:** Follow PEP 8, use type hints where practical
- **DRF serializers** for all API responses
- **Management commands** for all background tasks (not Celery)

### Git Workflow
```
main ← development ← feature/* branches
```

**Branch naming:** `feature/<name>-<area>`
- `feature/fahim-pipeline-engine`
- `feature/shahin-django-init-auth`
- `feature/sreekuttan-redis-cache`
- `feature/vijay-router-ui`
- `feature/vikky-state-engine`

### File Conventions
- Backend settings: `core/settings/{base,local,production}.py`
- All URL routes: `core/urls.py` (app-level `urls.py` files exist but are empty)
- Models: standard Django model files per app
- Tests: `tests.py` or `tests/` directory per app

---

## 16. Known Issues & TODOs

### Critical
1. **`ExamPage.jsx` is in TEMPORARY preview mode** — uses hardcoded fake questions and a 10-second timer. Instructions to revert to real API are in the file. Must be fixed before production.
2. **`README.md` has unresolved merge conflicts** — three-way conflict. Do not rely on it for documentation.
3. **`PROJECT_IMPLEMENTATION_KIT.md` is a placeholder** — says "paste full content here".

### Frontend TODOs
4. `ProtectedRoute.jsx` — route protection not implemented
5. `TeacherUpload.jsx` — no teacher functionality built yet
6. `QuestionCard.jsx` — component not built
7. `CountdownTimer.jsx` — component not built
8. `usePersistedAnswers.js` — hook not implemented
9. `useExamCountdown.js` — hook not implemented

### Backend Notes
10. `IsAnswerWindowOpen` permission always returns `True` — time gating is in view logic
11. `exams/urls.py` and `accounts/urls.py` are empty files
12. `jwt-decode` package installed but not used in frontend

### Missing Infrastructure
13. No CI/CD pipeline (GitHub Actions, etc.)
14. No Dockerfile
15. No frontend testing framework

---

## 17. Critical Constraints & Rules

1. **NEVER expose `CRON_SECRET_KEY` in frontend code** — it's only for server-to-server cron calls
2. **Time windows are IST (Asia/Kolkata)** — the `TIME_ZONE` setting is `Asia/Kolkata` and `USE_TZ = True`
3. **One submission per student per day** — enforced by `UniqueConstraint` on `StudentSubmission`
4. **CSV reports auto-delete after 4 hours** — do not assume reports persist
5. **Questions return 503 during exam window on cache miss** — this is intentional (prevents DB overload)
6. **Production JWT tokens expire in 15 minutes** — frontend must handle refresh gracefully
7. **Frontend uses custom state-based routing** — do NOT assume React Router's `<BrowserRouter>` is active
8. **All API routes are in `core/urls.py`** — app-level `urls.py` files are empty by design
9. **Database is PostgreSQL in production** — never hardcode SQLite for prod
10. **The `ExamPage.jsx` preview mode must be reverted** before any real exam is administered

---

*Last updated: July 2026*
*Maintained by: The Apptist Dev Team (Nehru Group of Institutions)*
