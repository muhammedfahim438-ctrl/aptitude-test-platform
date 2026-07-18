```markdown
# 🏛️ APTITUDE TEST PLATFORM — PROJECT IMPLEMENTATION KIT
**Team:** 5-Member University Scrum Team | **Framework:** Agile / Scrum | **Sprint Cycle:** 5-Day Sprints
**Stack:** Django · React · PostgreSQL via PgBouncer · Upstash Redis · Supabase Storage · Render · Vercel
**Document Version:** 2.0 | **Scrum Master:** MUHAMMED FAHIM

---

# ⚡ FIRST COMMANDS FOR EVERYONE — DAY 1 TERMINAL SETUP

> **Every team member — FAHIM, SHAHIN, SREEKUTTAN, VIJAY, VIKKY — must execute these commands
> in their local terminal before writing a single line of code. No exceptions.**

## Step 1 — Clone the Repository (First Time Only)
```bash
git clone https://github.com/YOUR_ORG/aptitude-test-platform.git
cd aptitude-test-platform
```

## Step 2 — Pull the Latest `main` Branch
```bash
git checkout main
git pull origin main
```

## Step 3 — Create Your Personal Feature Branch (Trunk-Based Development)
Each member creates their own branch off `main`. Use the naming convention exactly:

**FAHIM:**
```bash
git checkout -b feature/fahim-pipeline-engine
```

**SHAHIN:**
```bash
git checkout -b feature/shahin-jwt-auth
```

**SREEKUTTAN:**
```bash
git checkout -b feature/sreekuttan-redis-cache
```

**VIJAY:**
```bash
git checkout -b feature/vijay-router-ui
```

**VIKKY:**
```bash
git checkout -b feature/vikky-state-engine
```

## Step 4 — Push Your Branch to GitHub Immediately
```bash
# Replace YOUR_BRANCH_NAME with your branch from Step 3
git push -u origin YOUR_BRANCH_NAME
```

> ⚠️ **GOLDEN RULE:** NEVER commit directly to `main` or `development`.
> Always work on your `feature/` branch and open a Pull Request when done.
> FAHIM is the sole approver for all PRs into `main`.

---
---

# 📂 SECTION 1 — PROJECT ARCHITECTURE & FILE MAP

---

## 👥 Team Roster

| # | Name | Role |
|---|------|------|
| 1 | **MUHAMMED FAHIM** | Scrum Master / Product Owner / Lead Data Pipeline Engineer |
| 2 | **SHAHIN SHAFI** | Backend Developer / API & Security Architect |
| 3 | **SREEKUTTAN** | Backend Developer / Performance & Caching Engineer |
| 4 | **VIJAY** | Frontend Developer / UI & Router Lead |
| 5 | **VIKKY** | Frontend Developer / State & Client-Cache Lead |

---

## 📁 Repository Structure

```
aptitude-test-platform/
├── backend/
│   ├── core/                        # Django project settings
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── production.py
│   │   │   └── local.py
│   │   ├── permissions.py           # Shared DRF permission classes
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── accounts/                    # CustomUser model (SHAHIN)
│   │   ├── models.py
│   │   ├── managers.py
│   │   ├── serializers.py
│   │   └── views.py
│   ├── exams/                       # Questions, Submissions, AnswerKey (SREEKUTTAN + FAHIM)
│   │   ├── models.py
│   │   ├── serializers.py
│   │   └── views.py
│   ├── pipeline/                    # Score aggregation, CSV lifecycle, leaderboard (FAHIM)
│   │   ├── models.py                # DailyScore, ScheduledFileDeletion, ReportDownloadLog
│   │   ├── aggregation.py           # Core scoring engine
│   │   ├── signals.py               # Intercept pre_save purge
│   │   ├── views.py                 # Download, flush, process-deletions endpoints
│   │   └── management/
│   │       └── commands/
│   │           ├── aggregate_scores.py
│   │           ├── flush_weekly_leaderboard.py
│   │           ├── compute_weekly_leaderboard.py
│   │           └── process_deletions.py
│   ├── tests/                       # Locust + unit tests (SREEKUTTAN)
│   │   └── locustfile.py
│   ├── requirements.txt
│   ├── Procfile                     # gunicorn core.wsgi:application
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── router/                  # AppRouter, ProtectedRoute (VIJAY)
│   │   ├── pages/
│   │   │   ├── Login.jsx            # (VIJAY)
│   │   │   ├── student/             # ExamPage, Leaderboard (VIJAY + VIKKY)
│   │   │   └── teacher/             # Upload, Reports (VIJAY)
│   │   ├── components/              # QuestionCard (VIJAY), CountdownTimer (VIKKY)
│   │   ├── hooks/                   # usePersistedAnswers, useExamCountdown (VIKKY)
│   │   └── api/                     # Axios client with JWT interceptor
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── benchmarks/                  # Locust HTML reports
│   └── PROJECT_IMPLEMENTATION_KIT.md
└── README.md
```

---

## 🔗 Infrastructure Map

| Service | Purpose | Owner |
|---------|---------|-------|
| **Render.com** | Django backend hosting (free tier, Gunicorn) | SHAHIN / SREEKUTTAN |
| **Vercel** | React frontend hosting | VIJAY |
| **Neon / Aiven** | PostgreSQL database | SHAHIN |
| **PgBouncer (Neon pooler)** | Connection pooling (port 6543, transaction mode) | SHAHIN |
| **Upstash Redis** | Question cache layer (exam window read offload) | SREEKUTTAN |
| **Supabase Storage** | Question image hosting | VIJAY |
| **cron-job.org** | Scheduled tasks: keep-alive, cache warm, leaderboard flush, deletion processing | FAHIM |

---
---

# 📜 SECTION 2 — ARCHITECTURAL_CONSTRAINTS.md

---

## 🔒 Hard Constraints — Read Before Writing Any Code

### Constraint 1 — PgBouncer Transaction Mode is Mandatory
Neon/Aiven free PostgreSQL supports ~25–50 simultaneous raw connections. Under 2,000 concurrent students, Django opens one DB connection per worker thread — exhausting the pool instantly.

**Rule:** The `DATABASE_URL` environment variable MUST point to the PgBouncer pooler URL (port `6543`, `?pgbouncer=true`), never the direct Postgres URL (port `5432`).

**Rule:** `CONN_MAX_AGE` MUST be `0`. PgBouncer Transaction Mode assigns connections only during a transaction. A persistent connection held between requests confuses PgBouncer and causes errors.

```python
# settings/production.py
DATABASES = {
    'default': dj_database_url.parse(
        os.environ['DATABASE_URL'],  # MUST be the PgBouncer pooler URL
        conn_max_age=0,              # CRITICAL — never change this to a non-zero value
    )
}
```

**PgBouncer URL format:**
```
Neon Dashboard → Your Project → Connection Details
→ Toggle "Connection Pooling": ON
→ Pooling Mode: Transaction
→ Copy connection string (contains port 6543 and "pooler" in hostname)

postgresql://user:pass@ep-xxx-pooler.neon.tech:6543/dbname?pgbouncer=true&sslmode=require
```

---

### Constraint 2 — Redis Cache is the Sole Question Read Path During Exam Window
During 10 AM–2 PM, `GET /api/tests/questions/` MUST serve from Upstash Redis only. The cache is pre-warmed at 9:45 AM via cron. PostgreSQL must not be queried for question reads during this window.

**Cache key format:** `exam:questions:{exam_date}` — TTL: 6 hours

---

### Constraint 3 — No Raw Threading for Deferred Deletions in Production
`threading.Timer` is prohibited for the CSV deletion schedule in production. Render's free tier recycles workers every few hours. A timer spawned in a dying worker is silently killed — the CSV never gets deleted and sensitive data persists indefinitely.

**Rule:** All deferred file deletions MUST use the `ScheduledFileDeletion` database model + the `process_deletions` management command triggered via cron-job.org. This pattern survives server restarts.

---

### Constraint 4 — CorsMiddleware Must Be the First Middleware Entry
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',   # MUST BE FIRST. Moving it breaks CORS on all routes.
    'django.middleware.common.CommonMiddleware',
    # ... rest below
]
```

---

### Constraint 5 — Memory Budget on Render Free Tier (512 MB RAM)
The aggregation engine processes up to 2,000 `StudentSubmission` JSON rows. Loading them all into memory at once with `.all()` will spike RAM and may OOM-kill the Render worker.

**Rule:** All large queryset iterations MUST use `.iterator(chunk_size=500)`. This streams rows in batches from PostgreSQL rather than loading the full result set.

---

### Constraint 6 — Render 50-Second Cold Start Must Be Prevented
Render's free tier spins down after 15 minutes of inactivity. A 50-second startup during the 9:55 AM student login surge will cause mass timeouts.

**Rule:** A cron-job.org ping to `GET /api/health/` every 10 minutes (perpetual keep-alive) is mandatory. The health endpoint must be zero-auth and zero-DB.

---

### Constraint 7 — Secrets Are Never Hardcoded
All secrets (`SECRET_KEY`, `DATABASE_URL`, `CRON_SECRET_KEY`, `UPSTASH_REDIS_URL`) must be loaded from environment variables. The `.env` file is gitignored.

---

### Constraint 8 — Branch Protection Enforced on GitHub
- `main`: Requires 1 approving review from FAHIM. No direct pushes. No bypass.
- `development`: Requires 1 approving review. Team members may push feature branches.
- All PRs use **Squash and Merge** to keep history linear.

---
---

# 👥 SECTION 3 — INDIVIDUAL_SPRINT_BACKLOGS.md

---

# 🟠 MUHAMMED FAHIM — Scrum Master / Lead Data Pipeline Engineer
**Epic:** Core Automation Engine, Score Aggregation, File Lifecycle Management & Leaderboard Wipe Cron

---

## US-F01 · Core Submission Processing & Score Aggregation Engine

**As** the Lead Data Pipeline Engineer,
**I want** to build a bulk-safe, atomic score computation pipeline that aggregates 2,000 student submissions into finalized marks records,
**So that** evaluation is accurate, race-condition-free, and completes within 5 minutes of exam close.

### Acceptance Criteria
- [ ] A Django management command `python manage.py aggregate_scores --date=YYYY-MM-DD` computes all scores by comparing `StudentSubmission.answers` (JSONField) against `AnswerKey.correct_answers` (JSONField) using a vectorized comparison loop.
- [ ] The queryset MUST use `.iterator(chunk_size=500)` to stream rows in batches — never `.all()` — to stay within Render's 512MB RAM limit when processing 2,000 JSON submission rows.
- [ ] Score rows are written using `bulk_create(update_conflicts=True)` to prevent duplicate rows on re-runs.
- [ ] The aggregation must complete for 2,000 records in under 60 seconds on Render's free tier (verified via `time` command).
- [ ] A `Master_Report_DayX.csv` file (columns: `student_id`, `name`, `score`, `rank`, `timestamp`) is written to `MEDIA_ROOT/exports/` immediately after aggregation.
- [ ] Unit tests cover: empty submission set, partial submission set, all-zero scores, and perfect scores.

### Implementation

```python
# pipeline/aggregation.py
from django.db import transaction
from .models import StudentSubmission, AnswerKey, DailyScore
import csv, os
from django.conf import settings

def aggregate_and_export(exam_date):
    answer_key = AnswerKey.objects.get(date=exam_date)
    correct = answer_key.correct_answers  # dict: {"q1": "B", "q2": "A", ...}

    # .iterator(chunk_size=500) streams rows in 500-row batches from PostgreSQL.
    # This prevents loading all 2,000 JSON blobs into RAM simultaneously,
    # keeping memory usage within Render's 512MB free-tier limit.
    submissions = (
        StudentSubmission.objects
        .filter(exam_date=exam_date)
        .select_related('student')
        .iterator(chunk_size=500)   # MEMORY-SAFE: streams in 500-row batches
    )

    score_objs = []
    rows = []
    for sub in submissions:
        score = sum(1 for q, ans in sub.answers.items() if correct.get(q) == ans)
        score_objs.append(
            DailyScore(student=sub.student, exam_date=exam_date, score=score)
        )
        rows.append([sub.student.id, sub.student.get_full_name(), score, exam_date])

    with transaction.atomic():
        DailyScore.objects.bulk_create(
            score_objs,
            update_conflicts=True,
            unique_fields=['student', 'exam_date'],
            update_fields=['score']
        )

    export_path = os.path.join(
        settings.MEDIA_ROOT, 'exports', f'Master_Report_{exam_date}.csv'
    )
    os.makedirs(os.path.dirname(export_path), exist_ok=True)
    with open(export_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['student_id', 'name', 'score', 'date'])
        writer.writerows(rows)

    return export_path
```

> **Why `.iterator(chunk_size=500)`?**
> Django's default queryset evaluation loads the entire result set into a Python list in RAM before iteration begins. For 2,000 rows each containing a JSON blob (student answers), this can spike memory by 150–300 MB. `.iterator()` bypasses Django's internal cache and fetches rows directly from the DB cursor in configurable batches. `chunk_size=500` means at most 500 rows live in memory at any moment — a safe ceiling on Render's 512 MB free tier.

---

## US-F02 · Database-Backed Scheduled CSV Deletion (Production-Grade)

**As** the Data Pipeline Engineer,
**I want** to schedule automatic deletion of the exported CSV file exactly 4 hours after the admin downloads it using a database-backed pattern,
**So that** sensitive score data is never left exposed on the server indefinitely, and the deletion schedule survives Render worker restarts.

### Why Not `threading.Timer`?
`threading.Timer` spawns a background thread inside a Render Gunicorn worker. Render's free tier recycles workers every few hours or on memory spikes. If a worker is killed 2 hours into a 4-hour timer, the thread dies silently — the CSV is never deleted. Sensitive student data persists indefinitely on disk.

The database-backed pattern persists the deletion schedule in PostgreSQL. Even if the worker restarts 10 times, the next cron-job.org ping will scan the table and execute all overdue deletions.

### Acceptance Criteria
- [ ] A `ScheduledFileDeletion` model records: `file_path`, `delete_after` (DateTimeField), `deleted` (BooleanField, default False).
- [ ] When admin hits `GET /api/admin/download-report/?date=YYYY-MM-DD`, the file is served and a `ScheduledFileDeletion` row is created with `delete_after = now() + 4 hours`.
- [ ] A Django management command `python manage.py process_deletions` queries all undeleted rows where `delete_after <= now()` and deletes them.
- [ ] An internal endpoint `POST /api/internal/process-deletions/` is protected by `X-Cron-Secret` header and calls the same deletion logic.
- [ ] cron-job.org hits the endpoint every 15 minutes to process overdue deletions.
- [ ] `FileNotFoundError` is handled silently (marks row as deleted without crashing).
- [ ] A `ReportDownloadLog` model separately records: `file_path`, `downloaded_at`, `scheduled_deletion_at`.

### Implementation

```python
# pipeline/models.py
from django.db import models

class ScheduledFileDeletion(models.Model):
    """
    Persists file deletion schedule in the database.
    Survives Render worker restarts — no threading required.
    """
    file_path = models.CharField(max_length=500)
    delete_after = models.DateTimeField()
    deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['delete_after', 'deleted'])]

    def __str__(self):
        return f"{self.file_path} → delete after {self.delete_after}"


class ReportDownloadLog(models.Model):
    file_path = models.CharField(max_length=500)
    downloaded_at = models.DateTimeField()
    scheduled_deletion_at = models.DateTimeField()

    def __str__(self):
        return f"Downloaded {self.file_path} at {self.downloaded_at}"
```

```python
# pipeline/views.py — Admin Download + Process Deletions Endpoints
import os
import logging
from django.http import FileResponse, HttpResponse, JsonResponse
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import ScheduledFileDeletion, ReportDownloadLog

logger = logging.getLogger(__name__)

def admin_download_report(request, exam_date):
    """
    Serves the CSV report and schedules its deletion in the database.
    No threading.Timer — deletion is handled by the cron-triggered process_deletions command.
    """
    filepath = os.path.join(
        settings.MEDIA_ROOT, 'exports', f'Master_Report_{exam_date}.csv'
    )
    if not os.path.exists(filepath):
        return HttpResponse("Report not yet generated.", status=404)

    delete_at = timezone.now() + timedelta(hours=4)

    ReportDownloadLog.objects.create(
        file_path=filepath,
        downloaded_at=timezone.now(),
        scheduled_deletion_at=delete_at,
    )

    # Schedule deletion in DB — survives worker restarts
    ScheduledFileDeletion.objects.create(
        file_path=filepath,
        delete_after=delete_at,
    )
    logger.info(f"[SCHEDULE] CSV deletion scheduled at {delete_at}: {filepath}")

    return FileResponse(
        open(filepath, 'rb'),
        as_attachment=True,
        filename=f'Master_Report_{exam_date}.csv'
    )


@csrf_exempt
def process_scheduled_deletions(request):
    """
    Internal endpoint called by cron-job.org every 15 minutes.
    Protected by X-Cron-Secret header.
    """
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)

    due_records = ScheduledFileDeletion.objects.filter(
        delete_after__lte=timezone.now(),
        deleted=False,
    )
    deleted_count = 0
    for record in due_records:
        try:
            os.remove(record.file_path)
            logger.info(f"[CRON] CSV deleted: {record.file_path}")
        except FileNotFoundError:
            logger.warning(f"[CRON] File already gone: {record.file_path}")
        record.deleted = True
        record.save(update_fields=['deleted'])
        deleted_count += 1

    return JsonResponse({'status': 'processed', 'deleted': deleted_count})
```

```python
# pipeline/management/commands/process_deletions.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from pipeline.models import ScheduledFileDeletion
import os, logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Process all overdue scheduled file deletions.'

    def handle(self, *args, **options):
        due = ScheduledFileDeletion.objects.filter(
            delete_after__lte=timezone.now(),
            deleted=False,
        )
        for record in due:
            try:
                os.remove(record.file_path)
                self.stdout.write(f"[CRON] Deleted: {record.file_path}")
            except FileNotFoundError:
                self.stdout.write(f"[CRON] Already gone: {record.file_path}")
            record.deleted = True
            record.save(update_fields=['deleted'])
```

**cron-job.org configuration:**
```
URL:      POST https://your-api.onrender.com/api/internal/process-deletions/
Schedule: */15 * * * *  (every 15 minutes)
Headers:  X-Cron-Secret: YOUR_CRON_SECRET_KEY
```

---

## US-F03 · Intercept Save Pipeline — Stale CSV Purge on New Question Upload

**As** the Scrum Master,
**I want** Django to automatically wipe the previous day's CSV the moment an admin uploads new questions,
**So that** stale sensitive data never coexists with a fresh exam cycle.

### Acceptance Criteria
- [ ] The `Question` model's `pre_save` signal detects when a new question set for a new date is committed.
- [ ] It scans `MEDIA_ROOT/exports/` for any `Master_Report_*.csv` files and deletes them immediately.
- [ ] A log entry is written: `"[INTERCEPT] Stale CSV purged before new question commit: <filename>"`.
- [ ] The new questions are saved to the DB only after the stale file deletion completes (atomic ordering guaranteed by `pre_save`).
- [ ] `DailyLeaderboard` records are deleted in the same signal.
- [ ] Test: create a stale CSV, trigger a question upload, assert the CSV no longer exists.

### Implementation

```python
# pipeline/signals.py
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Question
import os, glob, logging
from django.conf import settings

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Question)
def purge_stale_csv_on_question_upload(sender, instance, **kwargs):
    if instance._state.adding:  # Only fires on new question creation, not updates
        export_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        stale_files = glob.glob(os.path.join(export_dir, 'Master_Report_*.csv'))
        for f in stale_files:
            try:
                os.remove(f)
                logger.warning(f"[INTERCEPT] Stale CSV purged before new question commit: {f}")
            except FileNotFoundError:
                pass

        from .models import DailyLeaderboard
        deleted_count, _ = DailyLeaderboard.objects.all().delete()
        logger.warning(f"[INTERCEPT] DailyLeaderboard flushed: {deleted_count} records removed.")
```

---

## US-F04 · Leaderboard Epoch Wipe Cron Scripts

**As** the Data Pipeline Engineer,
**I want** automated background scripts that flush the `DailyLeaderboard` on new question upload and drop the `WeeklyLeaderboard` exactly 36 hours after the new week begins,
**So that** leaderboards always reflect current competitive cycles.

### Acceptance Criteria
- [ ] A Django management command `python manage.py flush_weekly_leaderboard` deletes all `WeeklyLeaderboard` rows.
- [ ] A cron-job.org scheduled webhook hits `POST /api/internal/flush-weekly-leaderboard/` exactly 36 hours after Monday 00:00 (i.e., Tuesday 12:00 PM).
- [ ] The internal flush endpoint is protected by a `CRON_SECRET` header check.
- [ ] Weekly leaderboard is recomputed by `python manage.py compute_weekly_leaderboard` every Friday at 11:59 PM via a second cron-job.org entry.

### Implementation

```python
# pipeline/views.py (append to existing file)
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import WeeklyLeaderboard

@csrf_exempt
def flush_weekly_leaderboard(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    secret = request.headers.get('X-Cron-Secret', '')
    if secret != settings.CRON_SECRET_KEY:
        return HttpResponse(status=403)
    deleted_count, _ = WeeklyLeaderboard.objects.all().delete()
    return JsonResponse({'status': 'flushed', 'deleted': deleted_count})
```

**cron-job.org entries for leaderboard:**
```
Entry 1 — Weekly leaderboard flush:
  URL:      POST https://your-api.onrender.com/api/internal/flush-weekly-leaderboard/
  Schedule: 0 12 * * 2  (Tuesday 12:00 PM — 36 hrs after Monday midnight)
  Headers:  X-Cron-Secret: YOUR_CRON_SECRET_KEY

Entry 2 — Weekly leaderboard recompute:
  URL:      POST https://your-api.onrender.com/api/internal/compute-weekly-leaderboard/
  Schedule: 59 23 * * 5  (Friday 11:59 PM)
  Headers:  X-Cron-Secret: YOUR_CRON_SECRET_KEY
```

---
---

# 🔵 SHAHIN SHAFI — Backend Developer / API & Security Architect
**Epic:** Django Initialization, PgBouncer Integration, Role-Based Auth Schema, JWT APIs

---

## US-S01 · Django Project Initialization & PgBouncer Database Binding

**As** the API & Security Architect,
**I want** to initialize the Django project with production-grade settings and bind the PgBouncer pooling URL as the sole database connection string,
**So that** we never exhaust PostgreSQL's raw connection slots under burst traffic.

### Acceptance Criteria
- [ ] Django project created with `django-admin startproject core .` and `apps/` directory for modular apps.
- [ ] `DATABASE_URL` environment variable holds the PgBouncer Transaction Mode URL (not the direct Postgres URL).
- [ ] `dj-database-url` parses the URL and injects `CONN_MAX_AGE=0`.
- [ ] `django-environ` or `python-decouple` loads all secrets from `.env` (never hardcoded).
- [ ] A successful `python manage.py migrate` run is the acceptance gate.

### Implementation

```python
# settings/production.py
import dj_database_url
import os

DATABASE_URL = os.environ['DATABASE_URL']
# Must be the PgBouncer pooler URL from Neon/Aiven dashboard
# Format: postgresql://user:pass@ep-xxx-pooler.neon.tech:6543/dbname?pgbouncer=true&sslmode=require

DATABASES = {
    'default': dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=0,       # CRITICAL: Must be 0 for PgBouncer transaction mode
        ssl_require=True,
    )
}
```

**.env (never commit to Git):**
```
DATABASE_URL=postgresql://neondb_owner:XXXX@ep-xxx-pooler.neon.tech:6543/neondb?pgbouncer=true&sslmode=require
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=your-render-app.onrender.com
CRON_SECRET_KEY=your-cron-secret
UPSTASH_REDIS_URL=rediss://default:XXXX@your-upstash-endpoint:6379
```

---

## US-S02 · Custom User Schema with Role Boolean Guards

**As** the Security Architect,
**I want** a custom `AbstractBaseUser` model with `is_student` and `is_teacher` boolean fields,
**So that** we can gate API endpoints by role without a separate permissions table query.

### Acceptance Criteria
- [ ] `CustomUser` extends `AbstractBaseUser` and `PermissionsMixin`.
- [ ] Fields: `email` (unique, login field), `full_name`, `roll_number` (unique, nullable for teachers), `is_student`, `is_teacher`, `is_active`, `is_staff`.
- [ ] A custom manager `CustomUserManager` with `create_user()` and `create_superuser()` methods.
- [ ] `AUTH_USER_MODEL = 'accounts.CustomUser'` set before first migration.
- [ ] Reusable DRF permission classes: `IsStudentUser` and `IsTeacherUser`.

### Implementation

```python
# accounts/models.py
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    roll_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    is_student = models.BooleanField(default=False)
    is_teacher = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    objects = CustomUserManager()

    def __str__(self):
        return self.email
```

```python
# core/permissions.py
from rest_framework.permissions import BasePermission

class IsStudentUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_student)

class IsTeacherUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_teacher)
```

---

## US-S03 · Stateless JWT Authentication API

**As** the Security Architect,
**I want** to implement stateless JWT login/refresh endpoints using `djangorestframework-simplejwt`,
**So that** the API remains horizontally scalable and no server-side session state is needed.

### Acceptance Criteria
- [ ] `POST /api/auth/login/` returns `access` (15-min TTL) and `refresh` (7-day TTL) tokens.
- [ ] `POST /api/auth/refresh/` accepts a valid refresh token and returns a new access token.
- [ ] Access token payload includes: `user_id`, `email`, `is_student`, `is_teacher`, `roll_number`.
- [ ] All protected endpoints use `permission_classes = [IsAuthenticated]` + role guard.
- [ ] `POST /api/auth/login/` returns `403` if `is_active=False`.

### Implementation

```python
# settings/base.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

---

## US-S04 · Time-Locked Answer Key Gate (403 Outside 2 PM–7 PM)

**As** the Security Architect,
**I want** the `GET /api/tests/answers/` endpoint to automatically return 403 outside the 2:00 PM–7:00 PM window,
**So that** students cannot access answers during or before the exam.

### Acceptance Criteria
- [ ] A DRF permission class `IsAnswerWindowOpen` checks `datetime.now().time()` against `time(14, 0)` and `time(19, 0)`.
- [ ] Outside the window: `{"detail": "Answer key is not available at this time.", "opens_at": "14:00", "closes_at": "19:00"}` with HTTP 403.
- [ ] Unit test: mock `datetime.now()` to test boundary conditions (13:59, 14:00, 18:59, 19:00, 19:01).

### Implementation

```python
# core/permissions.py (append)
from datetime import datetime, time

class IsAnswerWindowOpen(BasePermission):
    message = "Answer key is not available at this time."

    def has_permission(self, request, view):
        now = datetime.now().time()
        return time(14, 0) <= now <= time(19, 0)
```

---
---

# 🟢 SREEKUTTAN — Backend Developer / Performance & Caching Engineer
**Epic:** Upstash Redis Caching Layer, CORS Security Headers, Submission Endpoint, API Stress Benchmarking

---

## US-R01 · Upstash Redis Question Cache Interceptor

**As** the Performance & Caching Engineer,
**I want** all exam question reads during the 10 AM–2 PM live exam window to be served directly from Upstash Redis RAM,
**So that** PostgreSQL is never hit for question reads under the 2,000-user burst.

### Acceptance Criteria
- [ ] `GET /api/tests/questions/?date=YYYY-MM-DD` checks Redis for key `exam:questions:{date}` before querying PostgreSQL.
- [ ] Cache hit → return JSON from Redis. Cache miss → query DB, populate Redis, return response.
- [ ] Cache TTL is 6 hours (`ex=21600`).
- [ ] A management command `python manage.py warm_question_cache --date=YYYY-MM-DD` pre-populates Redis at 9:45 AM.
- [ ] A cron-job.org entry fires the warm endpoint at 9:45 AM Mon–Fri.

### Implementation

```python
# exams/cache.py
import json, os, redis

redis_client = redis.from_url(os.environ['UPSTASH_REDIS_URL'], decode_responses=True)
CACHE_TTL = 21600  # 6 hours

def get_questions_cached(exam_date: str):
    cache_key = f"exam:questions:{exam_date}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    return None

def warm_question_cache(exam_date: str):
    """Pre-load questions into Redis at 9:45 AM before exam starts."""
    from exams.models import Question
    questions = list(Question.objects.filter(exam_date=exam_date).values(
        'id', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'image_url'
    ))
    cache_key = f"exam:questions:{exam_date}"
    redis_client.set(cache_key, json.dumps(questions), ex=CACHE_TTL)
    return len(questions)
```

---

## US-R02 · CORS Security Header Whitelisting

**As** the Performance & Caching Engineer,
**I want** to configure `django-cors-headers` to whitelist only the Vercel frontend origin,
**So that** no unauthorized browser origin can make API calls to our Render backend.

### Acceptance Criteria
- [ ] `CorsMiddleware` is the **first** entry in `MIDDLEWARE` (above `CommonMiddleware`).
- [ ] `CORS_ALLOWED_ORIGINS` contains only the production Vercel URL and `localhost:5173`.
- [ ] `CORS_ALLOW_CREDENTIALS = True`.
- [ ] `CORS_ALLOW_METHODS` restricted to `['GET', 'POST', 'OPTIONS']`.
- [ ] Postman test confirms unlisted origins receive no `Access-Control-Allow-Origin` header.

### Implementation

```python
# settings/production.py
CORS_ALLOWED_ORIGINS = [
    "https://your-app.vercel.app",
    "http://localhost:5173",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['GET', 'POST', 'OPTIONS']
CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # MUST be first
    'django.middleware.common.CommonMiddleware',
    # ... rest of middleware
]
```

---

## US-R03 · High-Velocity Submission Endpoint — `POST /api/tests/submit/`

**As** the Performance & Caching Engineer,
**I want** a robust, atomic submission handler that cleanly processes up to 2,000 near-simultaneous incoming student answer payloads,
**So that** no submission is silently lost or duplicated under burst traffic at exam close.

### Acceptance Criteria
- [ ] `POST /api/tests/submit/` accepts `{ "exam_date": "YYYY-MM-DD", "answers": { "q1": "A", ... } }`.
- [ ] Requires `IsAuthenticated` + `IsStudentUser` permission.
- [ ] Each submission is wrapped in `transaction.atomic()` — all-or-nothing integrity guaranteed.
- [ ] Uses `update_or_create` on `(student, exam_date)` for idempotency — re-submitting does not create duplicate rows.
- [ ] Returns `409` if the exam window has already closed (checked against server time).
- [ ] Returns `201` on new submission, `200` on update.
- [ ] Under no circumstance should a partial write be left in the database.

### Implementation

```python
# exams/views.py
import logging
from datetime import datetime, time
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsStudentUser
from .models import StudentSubmission

logger = logging.getLogger(__name__)

class SubmitAnswersView(APIView):
    """
    High-velocity submission endpoint.
    Handles up to 2,000 near-simultaneous POSTs at exam close.
    Atomic transaction guarantees no partial writes under DB errors.
    update_or_create guarantees idempotency — safe to retry on network failure.
    """
    permission_classes = [IsAuthenticated, IsStudentUser]

    def post(self, request):
        exam_date_str = request.data.get('exam_date')
        answers = request.data.get('answers')

        if not exam_date_str or not answers:
            return Response(
                {'error': 'exam_date and answers are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Server-side time gate — exam window is 10:00 AM to 2:00 PM
        now = datetime.now().time()
        if now > time(14, 0):
            return Response(
                {'error': 'Exam window has closed. Submissions are no longer accepted.'},
                status=status.HTTP_409_CONFLICT
            )

        try:
            with transaction.atomic():
                # update_or_create = idempotent: safe to retry on client network errors.
                # If a student submits twice (auto-submit + manual submit), the second
                # call simply overwrites answers instead of creating a duplicate row.
                submission, created = StudentSubmission.objects.update_or_create(
                    student=request.user,
                    exam_date=exam_date_str,
                    defaults={'answers': answers},
                )

            logger.info(
                f"[SUBMIT] {'Created' if created else 'Updated'} submission: "
                f"student={request.user.id}, date={exam_date_str}"
            )
            return Response(
                {'status': 'submitted', 'created': created},
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"[SUBMIT] Transaction failed for student={request.user.id}: {e}")
            return Response(
                {'error': 'Submission failed. Please retry.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

```python
# core/urls.py — Register endpoint
from exams.views import SubmitAnswersView

urlpatterns = [
    path('api/tests/submit/', SubmitAnswersView.as_view(), name='submit-answers'),
    # ... other routes
]
```

---

## US-R04 · Postman & Locust API Stress Benchmarking Suite

**As** the Performance & Caching Engineer,
**I want** a documented Postman collection and a Locust load test script that simulates 2,000 concurrent users hitting the question endpoint,
**So that** we have empirical proof the system holds under exam-day burst traffic.

### Acceptance Criteria
- [ ] A Postman collection covers all routes: login, get questions, submit answers, get leaderboard, get answer key (inside/outside window).
- [ ] `locustfile.py` simulates 2,000 users spawned at 100 users/second.
- [ ] Pass criteria: 0% failure rate, p95 < 200ms (Redis-served), p99 < 500ms.
- [ ] Results exported as HTML report and committed to `docs/benchmarks/`.

### Implementation

```python
# tests/locustfile.py
from locust import HttpUser, task, between
from datetime import date

class ExamStudent(HttpUser):
    wait_time = between(0.5, 2)
    token = None

    def on_start(self):
        resp = self.client.post(
            "/api/auth/login/",
            json={"email": "testuser@college.edu", "password": "testpass123"}
        )
        self.token = resp.json().get("access")

    @task(3)
    def get_questions(self):
        self.client.get(
            f"/api/tests/questions/?date={date.today().isoformat()}",
            headers={"Authorization": f"Bearer {self.token}"}
        )

    @task(1)
    def submit_answers(self):
        self.client.post(
            "/api/tests/submit/",
            json={
                "exam_date": date.today().isoformat(),
                "answers": {"q1": "A", "q2": "B", "q3": "C"}
            },
            headers={"Authorization": f"Bearer {self.token}"}
        )
```

**Run command:**
```bash
locust -f tests/locustfile.py --host=https://your-api.onrender.com \
  --users=2000 --spawn-rate=100 --run-time=5m --html=docs/benchmarks/locust_report.html
```

---
---

# 🟡 VIJAY — Frontend Developer / UI & Router Lead
**Epic:** React Router Architecture, Login UI, Conditional Question Layout Rendering

---

## US-V01 · React Client Router Architecture with Protected Routes

**As** the UI & Router Lead,
**I want** to set up React Router v6 with role-based route protection,
**So that** students and teachers are redirected to their respective dashboards and cannot access each other's routes.

### Acceptance Criteria
- [ ] `react-router-dom` v6 installed; all routes defined in `src/router/AppRouter.jsx`.
- [ ] A `<ProtectedRoute>` HOC reads JWT from `localStorage`, decodes the payload (using `jwt-decode`), and checks `is_student` / `is_teacher`.
- [ ] Unauthenticated users hitting any protected route are redirected to `/login`.
- [ ] Route map: `/login` (public), `/student/exam`, `/student/leaderboard`, `/teacher/upload`, `/teacher/reports`.
- [ ] A `<Navigate>` fallback catches all unmatched routes.

### Implementation

```jsx
// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Login';
import ExamPage from '../pages/student/ExamPage';
import TeacherUpload from '../pages/teacher/TeacherUpload';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/student/exam" element={
          <ProtectedRoute requiredRole="is_student"><ExamPage /></ProtectedRoute>
        } />
        <Route path="/teacher/upload" element={
          <ProtectedRoute requiredRole="is_teacher"><TeacherUpload /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## US-V02 · Secure Unified Login UI

**As** the UI & Router Lead,
**I want** a single login page that authenticates both students and teachers and routes them to the correct dashboard based on their JWT role payload.

### Acceptance Criteria
- [ ] Login form has: `Email`, `Password` fields, and a `Login` button.
- [ ] On success: JWT tokens saved to `localStorage`; user redirected based on `is_student`/`is_teacher` from decoded payload.
- [ ] On failure: inline error message displayed without page reload.
- [ ] Submit button disables and shows a spinner during the API call to prevent double-submission.
- [ ] Keyboard accessible: `Enter` key submits; focus management on error.

---

## US-V03 · Conditional Question Layout Renderer (Text-Only vs. Image Questions)

**As** the UI & Router Lead,
**I want** the exam question component to render cleanly for both text-only questions and questions with image attachments.

### Acceptance Criteria
- [ ] `<QuestionCard>` receives `{ id, text, options, image_url }` props.
- [ ] If `image_url` is `null`, no image container is rendered.
- [ ] If `image_url` is valid, image renders in a fixed-aspect `16:9` container.
- [ ] Images lazy-load (`loading="lazy"`) and have descriptive `alt` text.
- [ ] On image load error (`onError`), the image silently hides itself.
- [ ] Options A–D render as clickable radio-style cards, highlighting the selected option.

### Implementation

```jsx
// src/components/QuestionCard.jsx
export default function QuestionCard({ id, text, options, image_url, selected, onSelect }) {
  return (
    <div className="question-card">
      {image_url && (
        <div className="question-image-wrapper">
          <img
            src={image_url}
            alt={`Question ${id} diagram`}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
            className="question-image"
          />
        </div>
      )}
      <p className="question-text"><strong>Q{id}.</strong> {text}</p>
      <div className="options-grid">
        {Object.entries(options).map(([key, val]) => (
          <div
            key={key}
            className={`option-card ${selected === key ? 'selected' : ''}`}
            onClick={() => onSelect(id, key)}
          >
            <span className="option-label">{key.toUpperCase()}.</span> {val}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---
---

# 🔴 VIKKY — Frontend Developer / State & Client-Cache Lead
**Epic:** LocalStorage Answer Resiliency, Countdown Auto-Submit, Time-Locked Answer Key Display

---

## US-K01 · LocalStorage Browser Resiliency State Engine (with Obfuscation)

**As** the State & Client-Cache Lead,
**I want** every answer selection to be saved to `localStorage` in real time with light obfuscation,
**So that** if the student's browser crashes or network drops during the exam, their progress is fully restored on page reload — and basic tampering via browser DevTools is deterred.

### Acceptance Criteria
- [ ] On every `onSelect(questionId, answer)` event, the answer is immediately written to `localStorage` under key `exam_answers_{userId}_{examDate}`.
- [ ] On `ExamPage` mount, the component reads `localStorage` first and pre-populates the `answers` state.
- [ ] On successful final submission, the `localStorage` key is deleted to prevent stale data.
- [ ] If the exam window has passed (checked against server time), the restored state is shown as read-only.
- [ ] **[Security]** Answers stored in `localStorage` MUST be Base64-encoded before writing and decoded on read. This deters casual tampering via browser DevTools — raw answer strings (e.g., `"q1":"A"`) must not be directly visible or editable in plain text in the Application → Storage panel. Note: Base64 is obfuscation, not encryption. It prevents opportunistic tampering; a determined adversary could still decode it.
- [ ] If the stored value cannot be decoded (corrupted or manually tampered), the state silently resets to empty — this is safe behavior for the exam.
- [ ] Unit test: simulate 10 answer selections, reload, assert all 10 are correctly restored.

### Implementation

```jsx
// src/hooks/usePersistedAnswers.js
import { useState } from 'react';

// --- Obfuscation helpers ---
// Base64-encodes the answers JSON before writing to localStorage.
// Prevents plain-text answer strings from being visible/editable
// in browser DevTools → Application → Local Storage panel.
// This is deterrence against opportunistic tampering, not cryptographic security.

const encode = (data) => btoa(JSON.stringify(data));
const decode = (raw) => JSON.parse(atob(raw));

export function usePersistedAnswers(userId, examDate) {
  const storageKey = `exam_answers_${userId}_${examDate}`;

  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return {};
      return decode(saved);  // Base64 decode on read
    } catch {
      // If decoding fails (corrupted or tampered data), start fresh.
      // This is intentionally safe — a student who manually edits their
      // localStorage loses their saved progress, not gains an advantage.
      return {};
    }
  });

  const saveAnswer = (questionId, answer) => {
    const updated = { ...answers, [questionId]: answer };
    setAnswers(updated);
    localStorage.setItem(storageKey, encode(updated));  // Base64 encode on write
  };

  const clearAnswers = () => {
    setAnswers({});
    localStorage.removeItem(storageKey);
  };

  return { answers, saveAnswer, clearAnswers };
}
```

---

## US-K02 · Countdown Timer with Expiry Auto-Submit

**As** the State & Client-Cache Lead,
**I want** a visible countdown timer that automatically submits the student's current answers when the exam window closes at 2:00 PM sharp,
**So that** no student can gain extra time due to not clicking submit.

### Acceptance Criteria
- [ ] Timer calculates remaining seconds from `now` to `14:00:00` on exam date using server time (not client clock).
- [ ] Timer displays `HH:MM:SS` and updates every second via `setInterval`.
- [ ] When timer reaches `0`, `handleAutoSubmit()` fires `POST /api/tests/submit/` with current `answers` from `localStorage`.
- [ ] If auto-submit succeeds, student sees a "Time's up! Your answers have been submitted." modal.
- [ ] If auto-submit fails (network error), it retries up to 3 times with 2-second delays before showing an error modal.
- [ ] `clearInterval` is called in the `useEffect` cleanup to prevent memory leaks.

### Implementation

```jsx
// src/hooks/useExamCountdown.js
import { useState, useEffect, useRef } from 'react';

export function useExamCountdown(examEndTime, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const calcRemaining = () => {
      const now = new Date();
      const end = new Date(examEndTime);
      return Math.max(0, Math.floor((end - now) / 1000));
    };

    setSecondsLeft(calcRemaining());
    intervalRef.current = setInterval(() => {
      const remaining = calcRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [examEndTime, onExpire]);

  const hh = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}
```

---

## US-K03 · Time-Locked Answer Key Display Element

**As** the State & Client-Cache Lead,
**I want** the Answer Key page to show a countdown to 2:00 PM if the student visits before the window opens, and gracefully toggle to show the actual answer key once the time-gate API returns 200.

### Acceptance Criteria
- [ ] `GET /api/tests/answers/` is polled every 60 seconds after 1:50 PM.
- [ ] If the API returns 403, a countdown banner shows: `"Answer key unlocks at 2:00 PM — 00:MM:SS remaining."`
- [ ] When the API returns 200, the answer key renders immediately without a page reload.
- [ ] After 7:00 PM, the component shows: `"Answer key review period has ended."` and stops polling.
- [ ] The answer key display shows each question number, the correct answer, and highlights if the student's saved answer matched.

---
---

# 🚀 SECTION 4 — GITHUB_TRUNK_BASED_MANUAL.md

---

## 📖 Core Concept Glossary (Student Metaphors)

| Git Concept | Real-World Student Metaphor |
|-------------|----------------------------|
| **Repository (Repo)** | Your college project's shared Google Drive folder — one central place where all team files live. |
| **Commit** | Like saving a version of your assignment: *"Added introduction paragraph – v3"*. You can always go back. |
| **Branch** | A photocopy of the project folder where you experiment freely. If it fails, `main` is untouched. |
| **Pull Request (PR)** | Submitting your edited photocopy to the team leader for review before it's merged into the original. |
| **Merge** | The team leader approves your PR and staples your pages into the original folder. Photocopy recycled. |
| **Merge Conflict** | Two teammates edited the same paragraph simultaneously. Git can't decide — FAHIM must choose manually. |
| **`git pull`** | Downloading the latest changes from the shared Google Drive to your laptop before starting work. |
| **`git push`** | Uploading your saved commits from your laptop back up to the shared Google Drive. |
| **`origin`** | The nickname for your remote GitHub repository URL. |
| **`main` branch** | The live, always-deployable branch. Direct pushes are blocked. Only FAHIM can merge PRs here. |

---

## 🚀 Day 0 — FAHIM Initializes the Repository (One-Time Setup)

### Step 1: Create the GitHub Repository
```
On GitHub.com:
1. Click "New Repository"
2. Name: aptitude-test-platform
3. Visibility: Private
4. Initialize with README: YES
5. Click "Create Repository"
```

### Step 2: Clone and Bootstrap
```bash
git clone https://github.com/YOUR_USERNAME/aptitude-test-platform.git
cd aptitude-test-platform

mkdir backend frontend docs
touch backend/.gitkeep frontend/.gitkeep

cat > .gitignore << 'EOF'
__pycache__/
*.pyc
.env
venv/
*.sqlite3
media/
node_modules/
dist/
.env.local
EOF

git add .
git commit -m "chore: initialize project structure and gitignore"
git push origin main
```

### Step 3: Lock Branch Protections on GitHub
```
Settings → Branches → Add Branch Protection Rule:

For branch: main
  ✅ Require a pull request before merging
  ✅ Require at least 1 approving review (reviewer: FAHIM)
  ✅ Require status checks to pass before merging
  ✅ Do not allow bypassing the above settings
  ✅ Restrict who can push → FAHIM only
```

---

## 📅 5-Day Sprint Workflow

### 🌅 Every Morning (9:00 AM) — ALL TEAM MEMBERS
```bash
git checkout main
git pull origin main
git checkout -b feature/YOUR-NAME-todays-feature
git push -u origin feature/YOUR-NAME-todays-feature
```

### 🌙 Every Night (9:00 PM) — ALL TEAM MEMBERS
```bash
git add .
git commit -m "feat(scope): short description"
git push origin feature/YOUR-NAME-todays-feature
# Then open PR on GitHub: Base=main ← Compare=your-branch
# Assign reviewer: FAHIM
```

---

## 🔍 FAHIM's PR Review Protocol

```
1. GitHub → Pull Requests → Click the PR
2. "Files changed" tab → review every line diff
3. "+" icon on any line → inline comment
4. Changes needed → "Request Changes" with specific feedback
5. Approved → "Approve" → "Squash and Merge"
6. Delete the feature branch after merge
```

### Resolving a Merge Conflict
```bash
git checkout main
git pull origin main
git checkout feature/conflicting-branch
git merge main
# Fix conflict markers (<<<, ===, >>>), keep correct code
git add conflicted-file.py
git commit -m "fix: resolve merge conflict"
git push origin feature/conflicting-branch
```

---

## 🚀 Render.com Auto-Deploy
```
Render Dashboard → New Web Service → Connect GitHub Repo
→ Branch: main
→ Build Command: pip install -r requirements.txt
→ Start Command: gunicorn core.wsgi:application
✅ Auto-Deploy: Enabled
Every merge to main triggers automatic deploy (~2–3 minutes).
```

---

## ⚠️ Sprint Risk Register

| # | Risk | Severity | Owner | Prevention |
|---|------|----------|-------|------------|
| R1 | CORS blocks on Vercel→Render | 🔴 Critical | SREEKUTTAN | `django-cors-headers` as first middleware |
| R2 | Render 50-sec cold start | 🔴 Critical | SREEKUTTAN | cron-job.org keep-alive every 10 min |
| R3 | DB connection exhaustion | 🔴 Critical | SHAHIN | PgBouncer Transaction Mode + `CONN_MAX_AGE=0` |
| R4 | Background thread killed | 🟠 High | FAHIM | DB-backed `ScheduledFileDeletion` + cron |
| R5 | Redis cache miss on exam start | 🟠 High | SREEKUTTAN | 9:45 AM pre-warm via cron |
| R6 | OOM crash on 2,000-row aggregation | 🟠 High | FAHIM | `.iterator(chunk_size=500)` on all large querysets |
| R7 | Duplicate submissions at auto-submit | 🟠 High | SREEKUTTAN | `update_or_create` idempotency in submit endpoint |
| R8 | JWT stored in localStorage XSS | 🟡 Medium | SHAHIN | HttpOnly cookie alternative; CSP headers |
| R9 | LocalStorage cleared mid-exam | 🟡 Medium | VIKKY | Periodic background API sync every 5 min |
| R10 | Answer tampering via DevTools | 🟡 Medium | VIKKY | Base64 obfuscation; decode failure resets to empty |
| R11 | Merge conflict on Day 1 | 🟡 Medium | FAHIM | Branch protection + mandatory morning `git pull` |
| R12 | Supabase image URLs broken | 🟡 Medium | VIJAY | `onError` image hide in QuestionCard |
| R13 | CSV not deleted after 4 hrs | 🟡 Medium | FAHIM | DB-backed cron deletion (threading.Timer removed) |

---

## 🗓️ Sprint Delivery Calendar

| Day | FAHIM | SHAHIN | SREEKUTTAN | VIJAY | VIKKY |
|-----|-------|--------|------------|-------|-------|
| **Day 1** | Repo init, DB models (`DailyScore`, `ScheduledFileDeletion`) | Django init, PgBouncer bind, `CustomUser` model | CORS config, Redis client setup | Router scaffold, Login UI shell | LocalStorage hook (with Base64 encoding) |
| **Day 2** | Aggregation engine with `.iterator(chunk_size=500)`, CSV export | JWT auth endpoints, role guards | Redis cache warm + `get_questions` view | Protected routes, Exam page layout | Countdown timer hook with server-time sync |
| **Day 3** | DB-backed deletion scheduler, intercept signal | Answer key gate (403 time-lock) | `POST /api/tests/submit/` atomic endpoint + Locust suite | QuestionCard conditional renderer | Auto-submit on timer expiry with retry logic |
| **Day 4** | Leaderboard cron scripts, flush endpoints | API endpoint hardening + error handling | Postman collection, CORS verification | Leaderboard UI, Teacher upload UI | Answer key display + polling |
| **Day 5** | Full integration test, CSV lifecycle test | Security audit, JWT expiry edge cases | Load test run → HTML report in `docs/benchmarks/` | UI polish, mobile responsiveness | End-to-end submission flow test |

---

## 🔑 cron-job.org Master Schedule

| Schedule | URL | Method | Secret Header | Owner | Purpose |
|----------|-----|--------|---------------|-------|---------|
| `*/10 * * * *` | `/api/health/` | GET | None | SREEKUTTAN | Keep Render worker warm |
| `45 9 * * 1-5` | `/api/internal/warm-cache/` | POST | `X-Cron-Secret` | SREEKUTTAN | Pre-warm Redis at 9:45 AM |
| `*/15 * * * *` | `/api/internal/process-deletions/` | POST | `X-Cron-Secret` | FAHIM | Process overdue CSV deletions |
| `0 12 * * 2` | `/api/internal/flush-weekly-leaderboard/` | POST | `X-Cron-Secret` | FAHIM | Flush weekly leaderboard (Tue 12 PM) |
| `59 23 * * 5` | `/api/internal/compute-weekly-leaderboard/` | POST | `X-Cron-Secret` | FAHIM | Recompute weekly leaderboard (Fri 11:59 PM) |

---

*Document Version: 2.0 | Generated for Sprint Planning | Team: Aptitude Test Platform Scrum Team*
*Scrum Master: MUHAMMED FAHIM | Review Cycle: End of each 5-Day Sprint*
```