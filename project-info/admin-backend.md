# Admin Backend Reference — Apptist Platform

> **Purpose:** Exhaustive reference for the admin/teacher-facing backend. An AI receiving only this file should be able to understand, modify, debug, and extend every admin and cron-related backend component.

---

## Table of Contents

1. [Django Project Structure](#1-django-project-structure)
2. [Models](#2-models)
3. [Admin API Endpoints](#3-admin-api-endpoints)
4. [Internal Cron Endpoints](#4-internal-cron-endpoints)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Signals](#6-signals)
7. [Aggregation Engine](#7-aggregation-engine)
8. [Management Commands](#8-management-commands)
9. [CSV Export Lifecycle](#9-csv-export-lifecycle)
10. [Caching (Redis)](#10-caching-redis)
11. [Settings](#11-settings)
12. [Test Files](#12-test-files)

---

## 1. Django Project Structure

```
backend/
├── core/
│   ├── settings/{base,local,production}.py
│   ├── urls.py                 ← All 28 URL routes defined here
│   ├── permissions.py          ← IsTeacherUser, IsStudentUser, IsAnswerWindowOpen
│   └── wsgi.py
├── accounts/
│   ├── models.py               ← CustomUser (email, full_name, roll_number, department, is_student, is_teacher)
│   ├── managers.py             ← Empty stub (logic in models.py)
│   ├── views.py                ← login_view, register_view, student_signin_view
│   └── tests.py                ← 21 tests
├── exams/
│   ├── models.py               ← Question, AnswerKey, StudentSubmission
│   ├── views.py                ← 13 views including UploadQuestionsView, AdminQuestionListView, AdminQuestionDetailView
│   ├── serializers.py          ← AdminQuestionSerializer, AdminQuestionUpdateSerializer
│   ├── cache.py                ← Redis cache logic
│   ├── admin.py
│   └── tests/
│       ├── tests.py            ← 6 tests
│       ├── tests_admin.py      ← 15 tests (admin CRUD)
│       ├── tests_submit.py     ← 17 tests
│       ├── tests_security_rbac.py ← 7 tests
│       ├── tests_data_integrity.py ← 5 tests
│       └── tests_image_upload.py ← 4 tests
├── pipeline/
│   ├── models.py               ← DailyScore, Daily/Weekly/MonthlyLeaderboard, ScheduledFileDeletion, ReportDownloadLog
│   ├── views.py                ← 10 views: admin dashboard, rankings, reports, download, cron endpoints
│   ├── aggregation.py          ← Core scoring + CSV export engine
│   ├── signals.py              ← pre_save on Question (stale CSV purge)
│   ├── apps.py                 ← Connects signals
│   └── tests/                  ← 57 tests total
│       ├── test_aggregation.py      (5)
│       ├── test_deletion.py         (4)
│       ├── test_signals.py          (5)
│       ├── test_leaderboard.py      (5)
│       ├── test_integration.py      (1)
│       ├── test_internal_endpoints.py (6)
│       ├── test_csv_export_quality.py (5)
│       ├── test_monthly_leaderboard.py (8)
│       ├── test_department_and_migration.py (9)
│       └── test_cleanup_day.py      (9)
└── tests/
    └── locustfile.py           ← Load test (2000 concurrent users)
```

---

## 2. Models

### `CustomUser` (`accounts/models.py`)

Extends `AbstractBaseUser` + `PermissionsMixin`. Uses `CustomUserManager`.

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `email` | `EmailField` | `unique=True`, used as `USERNAME_FIELD` | — |
| `full_name` | `CharField(max_length=150)` | required | — |
| `roll_number` | `CharField(max_length=20)` | `unique=True, null=True, blank=True` | `None` |
| `department` | `CharField(max_length=150)` | `blank=True` | `''` |
| `is_student` | `BooleanField` | — | `False` |
| `is_teacher` | `BooleanField` | — | `False` |
| `is_active` | `BooleanField` | — | `True` |
| `is_staff` | `BooleanField` | — | `False` |

Manager methods:
- `create_user(email, password, **extra)` — normalizes email, sets password
- `create_superuser(email, password, **extra)` — sets `is_staff=True`, `is_superuser=True`

### `Question` (`exams/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `exam_date` | `DateField` | `db_index=True` | — |
| `text` | `TextField` | — | — |
| `option_a` | `CharField(max_length=500)` | — | — |
| `option_b` | `CharField(max_length=500)` | — | — |
| `option_c` | `CharField(max_length=500)` | — | — |
| `option_d` | `CharField(max_length=500)` | — | — |
| `image_url` | `URLField` | `null=True, blank=True` | `None` |
| `image` | `FileField(upload_to='questions/images/')` | `null=True, blank=True` | `None` |
| `retake_allowed` | `BooleanField` | — | `True` |
| `created_at` | `DateTimeField(auto_now_add=True)` | — | auto |

**Meta:** `ordering = ['exam_date', 'id']`, index on `exam_date`.

**NO unique constraint** — duplicates are allowed by design.

### `AnswerKey` (`exams/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `date` | `DateField` | `unique=True` | — |
| `correct_answers` | `JSONField` | — | — |
| `created_at` | `DateTimeField(auto_now_add=True)` | — | auto |
| `updated_at` | `DateTimeField(auto_now=True)` | — | auto |

**Meta:** `ordering = ['-date']`.

`correct_answers` format: `{"q1": "A", "q2": "B", "q3": "C", ...}` (keys are `q1`-`q10`).

### `StudentSubmission` (`exams/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `student` | `ForeignKey(CustomUser, on_delete=CASCADE)` | `related_name='submissions'` | — |
| `exam_date` | `DateField` | — | — |
| `answers` | `JSONField` | — | — |
| `submitted_at` | `DateTimeField(auto_now_add=True)` | — | auto |
| `updated_at` | `DateTimeField(auto_now=True)` | — | auto |

**Constraints:** `UniqueConstraint(['student', 'exam_date'])` — one submission per student per day.

**Meta:** index on `exam_date`, `ordering = ['-exam_date']`.

`answers` format: `{"q1": "B", "q2": "A", ...}` or `{}`.

### `DailyScore` (`pipeline/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `student` | `ForeignKey(CustomUser, on_delete=CASCADE)` | `related_name='daily_scores'` | — |
| `exam_date` | `DateField` | `db_index=True` | — |
| `score` | `PositiveSmallIntegerField` | — | — |
| `created_at` | `DateTimeField(auto_now_add=True)` | — | auto |
| `updated_at` | `DateTimeField(auto_now=True)` | — | auto |

**Constraints:** `UniqueConstraint(['student', 'exam_date'])`.
**Meta:** `ordering = ['-exam_date', '-score']`.

### `DailyLeaderboard` (`pipeline/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `student` | `ForeignKey(CustomUser, on_delete=CASCADE)` | `related_name='daily_leaderboard_entries'` | — |
| `exam_date` | `DateField` | — | — |
| `score` | `PositiveSmallIntegerField` | — | — |
| `rank` | `PositiveIntegerField` | — | — |
| `created_at` | `DateTimeField(auto_now_add=True)` | — | auto |

**Meta:** index on `['exam_date', 'rank']`, `ordering = ['exam_date', 'rank']`.

### `WeeklyLeaderboard` (`pipeline/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `student` | `ForeignKey(CustomUser, on_delete=CASCADE)` | `related_name='weekly_leaderboard_entries'` | — |
| `week_start` | `DateField` | — | — |
| `total_score` | `PositiveIntegerField` | — | — |
| `rank` | `PositiveIntegerField` | — | — |
| `created_at` | `DateTimeField(auto_now_add=True)` | — | auto |

**Meta:** index on `['week_start', 'rank']`, `ordering = ['week_start', 'rank']`.

### `MonthlyLeaderboard` (`pipeline/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `student` | `ForeignKey(CustomUser, on_delete=CASCADE)` | `related_name='monthly_leaderboard_entries'` | — |
| `month_start` | `DateField` | — | — |
| `total_score` | `PositiveIntegerField` | — | — |
| `rank` | `PositiveIntegerField` | — | — |
| `created_at` | `DateTimeField(auto_now_add=True)` | — | auto |

**Meta:** index on `['month_start', 'rank']`, `ordering = ['month_start', 'rank']`.

### `ScheduledFileDeletion` (`pipeline/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `file_path` | `CharField(max_length=500)` | — | — |
| `delete_after` | `DateTimeField` | — | — |
| `deleted` | `BooleanField` | — | `False` |
| `created_at` | `DateTimeField(auto_now_add=True)` | — | auto |

**Meta:** index on `['delete_after', 'deleted']`.

### `ReportDownloadLog` (`pipeline/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `file_path` | `CharField(max_length=500)` | — | — |
| `downloaded_at` | `DateTimeField` | — | — |
| `scheduled_deletion_at` | `DateTimeField` | — | — |

---

## 3. Admin API Endpoints

All admin endpoints require `JWT + IsTeacherUser` unless noted.

### POST `/api/admin/upload-questions/`

**Parser:** `MultiPartParser, FormParser` (multipart/form-data)

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | yes | Exam date in `YYYY-MM-DD` format |
| `questions` | JSON string | yes | JSON array of exactly 10 question objects |
| `image_0` through `image_9` | file | no | Optional image files for each question |

**Each question object:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | yes | Question text |
| `option_a` | string | yes | Option A |
| `option_b` | string | yes | Option B |
| `option_c` | string | yes | Option C |
| `option_d` | string | yes | Option D |
| `correct_answer` | string | yes | One of `A`, `B`, `C`, `D` |
| `retake_allowed` | boolean | no | Default `true` |

**Image validation:**
- `content_type` must start with `image/`
- `size` must be ≤ 5MB (5 * 1024 * 1024 bytes)

**Success response (201):**
```json
{
  "status": "uploaded",
  "exam_date": "2025-07-15",
  "questions_created": 10,
  "answer_key_updated": true
}
```

**Errors:**
- 400: Missing date, invalid date format, questions not JSON, not exactly 10, missing fields, invalid correct_answer, non-image file, file > 5MB
- 403: Not teacher
- 401: No auth
- 500: Server error

**Side effects:** Creates 10 `Question` records + 1 `AnswerKey` record (via `update_or_create`). Triggers `pre_save` signal on Question.

### GET `/api/admin/questions/`

**Query params:** `?date=YYYY-MM-DD` (optional), `?search=keyword` (optional)

**Response (200):** Array of question objects serialized by `AdminQuestionSerializer`:
```json
[
  {
    "id": 1,
    "exam_date": "2025-07-15",
    "text": "What is 2+2?",
    "option_a": "3",
    "option_b": "4",
    "option_c": "5",
    "option_d": "6",
    "image_url": null,
    "retake_allowed": true,
    "created_at": "2025-07-15T09:30:00Z"
  }
]
```

`AdminQuestionSerializer.get_image_url()` logic: returns `image_url` if set, else `image.url` if uploaded file exists, else `null`.

### GET `/api/admin/questions/<id>/`

**Response (200):** Single question object (same format as above).

**404:** `{"error": "Question not found."}`

### PATCH `/api/admin/questions/<id>/`

**Partial update.** Body can contain any subset of: `text`, `option_a`, `option_b`, `option_c`, `option_d`, `image_url`, `retake_allowed`.

Uses `AdminQuestionUpdateSerializer` (same fields as `AdminQuestionSerializer` minus read-only).

**Response (200):** Updated question serialized by `AdminQuestionSerializer`.

**404:** `{"error": "Question not found."}`

### PUT `/api/admin/questions/<id>/`

**Full update.** All fields required.

Same response format as PATCH.

### DELETE `/api/admin/questions/<id>/`

**Response (204):** Empty body.

**404:** `{"error": "Question not found."}`

### GET `/api/admin/dashboard-stats/`

**Response (200):**
```json
{
  "date": "2025-07-15",
  "total_students": 150,
  "tests_completed": 42,
  "questions_live": 10
}
```

`total_students` = `User.objects.filter(is_student=True, is_active=True).count()`
`tests_completed` = `StudentSubmission.objects.filter(exam_date=today).count()`
`questions_live` = `Question.objects.filter(exam_date=today).count()`

### GET `/api/admin/rankings/?period=weekly&top=10`

**Query params:**
- `period`: `"daily"` or `"weekly"` (default: `"weekly"`)
- `top`: integer (default: 10)

**Daily response:** Latest date from `DailyScore`, ordered by `-score`.
**Weekly response:** Latest `week_start` from `WeeklyLeaderboard`, ordered by `rank`.

**Response (200):**
```json
[
  {
    "rank": 1,
    "name": "Student A",
    "roll_number": "NGI2026CS045",
    "score": 9,
    "exam_date": "2025-07-14"
  }
]
```

### GET `/api/admin/reports/?range=weekly`

**Query params:**
- `range`: `"weekly"` (last 7 days), `"monthly"` (last 30 days), or omit for today
- `from`, `to`: custom date range in `YYYY-MM-DD` format

**Response (200):**
```json
{
  "from": "2025-07-08",
  "to": "2025-07-15",
  "total_students": 150,
  "total_attended": 42,
  "total_absent": 108,
  "student_performance": [
    {
      "student_id": 1,
      "name": "Student A",
      "roll_number": "NGI2026CS045",
      "score": 9,
      "exam_date": "2025-07-15"
    }
  ]
}
```

### GET `/api/admin/download-report/<exam_date>/`

**Response:** CSV file download (`FileResponse`).

**Side effects:**
- Creates `ReportDownloadLog` record
- Creates `ScheduledFileDeletion` record with `delete_after = now + 4 hours`

**404:** `"Report not yet generated."`

---

## 4. Internal Cron Endpoints

All cron endpoints use `POST` method and require `X-Cron-Secret` header matching `settings.CRON_SECRET_KEY`.

### POST `/api/internal/warm-cache/`

**Body:** `date` (optional, defaults to today in `YYYY-MM-DD`)

**Response (200):** `{"status": "ok", "questions_loaded": 10, "date": "2025-07-15"}`

### POST `/api/internal/aggregate-scores/`

**Body:** `date` (optional, defaults to yesterday)

**Response (200):** `{"status": "aggregated", "date": "2025-07-15"}`

### POST `/api/internal/cleanup-day/`

**Body:** `date` (optional, defaults to yesterday)

**Response (200):** `{"status": "cleaned", "date": "2025-07-15"}`

**Behavior:** Deletes `StudentSubmission` and `DailyLeaderboard` entries for the date. **Preserves `DailyScore` records** for historical analytics.

### POST `/api/internal/process-deletions/`

**Response (200):** `{"status": "processed", "deleted": 3}`

### POST `/api/internal/flush-weekly-leaderboard/`

**Response (200):** `{"status": "flushed", "deleted": 50}`

### POST `/api/internal/compute-weekly-leaderboard/`

**Response (200):** `{"status": "computed"}`

### POST `/api/internal/flush-monthly-leaderboard/`

**Response (200):** `{"status": "flushed", "deleted": 50}`

### POST `/api/internal/compute-monthly-leaderboard/`

**Body:** `month` (optional, `YYYY-MM` format, defaults to previous month)

**Response (200):** `{"status": "computed"}`

### Common error responses for all cron endpoints:
- **403:** Wrong or missing `X-Cron-Secret` header
- **405:** Non-POST method

---

## 5. Authentication & Authorization

### JWT Configuration

| Setting | Dev (`local.py`) | Prod (`production.py`) |
|---------|------------------|----------------------|
| Access token lifetime | 7 days | 15 minutes |
| Refresh token lifetime | 7 days | 7 days |
| `ROTATE_REFRESH_TOKENS` | True | True |
| `BLACKLIST_AFTER_ROTATION` | True | True |
| Auth header | `Bearer <token>` | `Bearer <token>` |

JWT payload contains: `email`, `is_student`, `is_teacher`, `roll_number`, `full_name`.

### Custom Permissions (`core/permissions.py`)

```python
class IsTeacherUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_teacher)
```

```python
class IsAnswerWindowOpen(BasePermission):
    message = "Answer key is not available at this time."
    def has_permission(self, request, view):
        now = timezone.now().time()
        return time(14, 0) <= now <= time(19, 0)
```

### Cron Endpoint Protection

All cron endpoints use:
```python
secret = request.headers.get('X-Cron-Secret', '')
if secret != settings.CRON_SECRET_KEY:
    return HttpResponse(status=403)
```

`CRON_SECRET_KEY` defaults to `'dev-cron-secret-change-me'` in development.

---

## 6. Signals

### `pre_save` on `Question` (`pipeline/signals.py`)

**Trigger:** When a new `Question` is saved (`instance._state.adding == True`).

**Condition:** Only fires if no questions exist yet for `instance.exam_date` (i.e., first question upload for that date).

**Actions:**
1. Deletes ALL `Master_Report_*.csv` files from `MEDIA_ROOT/exports/`
2. Deletes `DailyLeaderboard` entries for the new exam date

```python
@receiver(pre_save, sender=Question)
def purge_stale_csv_on_question_upload(sender, instance, **kwargs):
    if not instance._state.adding:
        return
    already_has_questions_for_date = Question.objects.filter(
        exam_date=instance.exam_date
    ).exists()
    if already_has_questions_for_date:
        return
    # ... purge CSVs and DailyLeaderboard
```

Connected in `pipeline/apps.py` `ready()` method.

---

## 7. Aggregation Engine

### `aggregate_and_export(exam_date)` (`pipeline/aggregation.py`)

**Algorithm:**

1. Fetch `AnswerKey` for `exam_date`
2. Iterate all `StudentSubmission` records for `exam_date` using `.iterator(chunk_size=500)`
3. For each submission, compute score: `sum(1 for q, ans in sub.answers.items() if correct.get(q) == ans)`
4. Build `DailyScore` objects and `student_rows` tuples
5. `DailyScore.objects.bulk_create(score_objs, update_conflicts=True, unique_fields=['student', 'exam_date'], update_fields=['score'])`
6. Sort `student_rows` by score descending
7. Assign ranks (tied scores share same rank)
8. Export to `MEDIA_ROOT/exports/Master_Report_{exam_date}.csv` with columns: `student_id, name, score, rank, timestamp, department`
9. CSV encoding: `utf-8`

**Idempotency:** Safe to run multiple times — `bulk_create(update_conflicts=True)` updates existing records.

**CSV columns:**
```
student_id, name, score, rank, timestamp, department
```

### `aggregate_scores_view(request)` (`pipeline/views.py`)

HTTP wrapper for `aggregate_scores` management command. Accepts optional `date` POST parameter.

---

## 8. Management Commands

### `aggregate_scores --date=YYYY-MM-DD`

```bash
python manage.py aggregate_scores --date=2025-07-15
```

Calls `aggregate_and_export(exam_date)`. Warns if elapsed time > 60 seconds.

### `compute_weekly_leaderboard`

```bash
python manage.py compute_weekly_leaderboard
```

- Calculates `week_start` = Monday of current week
- Sums `DailyScore` for the week, groups by student
- Deletes existing entries for `week_start`, then bulk creates new ranked entries
- Tied scores share same rank

### `flush_weekly_leaderboard`

```bash
python manage.py flush_weekly_leaderboard
```

Deletes ALL `WeeklyLeaderboard` rows.

### `compute_monthly_leaderboard --month=YYYY-MM`

```bash
python manage.py compute_monthly_leaderboard              # defaults to previous month
python manage.py compute_monthly_leaderboard --month=2025-06
```

Same logic as weekly but for calendar month.

### `flush_monthly_leaderboard`

```bash
python manage.py flush_monthly_leaderboard
```

Deletes ALL `MonthlyLeaderboard` rows.

### `process_deletions`

```bash
python manage.py process_deletions
```

Finds `ScheduledFileDeletion` records where `delete_after <= now` and `deleted=False`. Removes file from disk, marks `deleted=True`. Handles `FileNotFoundError` gracefully.

### `cleanup_day --date=YYYY-MM-DD`

```bash
python manage.py cleanup_day --date=2025-07-14
```

- Deletes `StudentSubmission` for the date
- Deletes `DailyLeaderboard` entries for the date
- **Preserves** `DailyScore` records for historical analytics
- Default date: yesterday
- Idempotent (safe to run multiple times)

### `warm_question_cache --date=YYYY-MM-DD`

```bash
python manage.py warm_question_cache --date=2025-07-15
```

Loads questions from DB into Redis cache. TTL = 6 hours (21600 seconds). Cache key: `exam:questions:{date}`.

### `seed_test_data` (dev utility)

```bash
python manage.py seed_test_data
```

Creates test data for development.

---

## 9. CSV Export Lifecycle

### Flow:
```
1. aggregate_scores --date=X → creates Master_Report_X.csv
2. Teacher downloads via GET /api/admin/download-report/X/
3. Download creates ReportDownloadLog + ScheduledFileDeletion (TTL=4hr)
4. process_deletions cron runs → deletes overdue CSVs from disk
```

### Stale CSV Purge (Signal):
```
1. New questions uploaded for previously unseen exam date
2. pre_save signal fires → deletes ALL Master_Report_*.csv files
3. Also flushes DailyLeaderboard for that date
```

### File path: `MEDIA_ROOT/exports/Master_Report_{exam_date}.csv`

### Encoding: `utf-8` (fixed from Windows cp1252 default)

---

## 10. Caching (Redis)

- **Library:** `redis` Python package
- **Connection:** `redis.from_url(os.environ.get('UPSTASH_REDIS_URL'))`
- **Graceful fallback:** If `UPSTASH_REDIS_URL` not set, `redis_client = None` and all cache operations are no-ops
- **Cache key:** `exam:questions:{exam_date}`
- **TTL:** 21600 seconds (6 hours)
- **During exam window (10AM-2PM):** Cache miss → 503 Service Unavailable
- **Outside exam window:** Cache miss → DB fallback + re-warm cache
- **Cache warming:** Cron triggers at 9:45 AM IST (15 min before exam)

---

## 11. Settings

### `core/settings/base.py`
- `TIME_ZONE = 'Asia/Kolkata'`
- `USE_TZ = True`
- `AUTH_USER_MODEL = 'accounts.CustomUser'`
- `SIMPLE_JWT.ACCESS_TOKEN_LIFETIME` (overridden per env)
- `SIMPLE_JWT.ROTATE_REFRESH_TOKENS = True`
- `SIMPLE_JWT.BLACKLIST_AFTER_ROTATION = True`
- `whitenoise` in `MIDDLEWARE`
- `corsheaders` in `MIDDLEWARE`

### `core/settings/local.py`
- `DEBUG = True`
- SQLite database
- JWT access token: 7 days
- `CORS_ALLOWED_ORIGINS = ['http://localhost:5173']`

### `core/settings/production.py`
- `DEBUG = False`
- PostgreSQL via `dj-database-url` (PgBouncer port 6543)
- JWT access token: 15 minutes
- HSTS headers (1 year, includeSubDomains, preload)
- `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')`
- `conn_max_age = 600`
- whitenoise with `STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'`

---

## 12. Test Files

### Backend Tests (132 tests total)

#### `accounts/tests.py` — 21 tests
- **AnswerKeyTimeGateTest (6):** Tests 403 outside 2PM-7PM window, 200 inside window at boundary times (1:59, 2:00, 4:30, 6:59, 7:00, 7:01)
- **LoginEndpointTest (8):** Login success, wrong password, wrong email, missing fields, invalid format, inactive user (403), token payload
- **SecurityAuditTest (7):** Unauth/invalid token → 401, student/teacher payloads, health check public

#### `exams/tests.py` — 6 tests
- **StudentReviewWindowTest (6):** Review endpoint time-gating across 2PM-7PM window

#### `exams/tests_admin.py` — 15 tests
- **UploadQuestionsTest (7):** Exactly 10 succeed, wrong count rejected, missing date, invalid answer, missing text, student → 403
- **AdminQuestionEditTest (5):** PATCH text persists, PATCH options persists, full PUT persists, 404 on nonexistent
- **CSVExportDepartmentTest (3):** CSV contains department column, score column, student name

#### `exams/tests_submit.py` — 17 tests
- **SubmitAnswersViewPayloadTest (17):** 201 first submit, payload keys match spec exactly (`{message, student, exam_date, answers_submitted, created}`), resubmit → 200, after 2PM → 409, missing fields → 400, unauth → 401, teacher → 403, dict count, DB record, one-per-day

#### `exams/tests_security_rbac.py` — 7 tests
- **StudentRBACRejectionTest (7):** Student gets 403 on question list, detail, PATCH, dashboard stats, rankings, reports; teacher gets 200 on list

#### `exams/tests_data_integrity.py` — 5 tests
- **DataIntegrityTest (5):** Duplicate submission → IntegrityError, duplicate AnswerKey date → IntegrityError, same text different dates allowed, different student same date allowed, AnswerKey JSON dict

#### `exams/tests_image_upload.py` — 4 tests
- **ImageUploadTest (4):** Valid image saves, file exists on disk, no-image saves, image_url and image independent

#### `pipeline/tests/test_aggregation.py` — 5 tests
- Empty submissions → no scores, partial scored correctly, all-wrong → 0, all-correct → max, re-run idempotent

#### `pipeline/tests/test_deletion.py` — 4 tests
- Only overdue deleted, already-deleted skipped, missing file handled, no due records → 0 deletions

#### `pipeline/tests/test_signals.py` — 5 tests
- New date purges CSVs + DailyLeaderboard, same date no retrigger, updating existing no trigger, all old dates purged

#### `pipeline/tests/test_leaderboard.py` — 5 tests
- Weekly sum correct, outside-week excluded, tied ranks, recompute no duplicate, flush deletes all

#### `pipeline/tests/test_integration.py` — 1 test
- Full lifecycle: questions → answer key → submissions → aggregation → scores → deletion schedule → file survives before TTL → deleted after TTL → new date purge

#### `pipeline/tests/test_internal_endpoints.py` — 6 tests
- Correct secret → success, wrong/missing → 403, no date → 500, DailyScore created, GET → 405

#### `pipeline/tests/test_csv_export_quality.py` — 5 tests
- UTF-8 encoding, Unicode names (accented + CJK), special chars in answers (commas/quotes), valid CSV structure with header, department column present

#### `pipeline/tests/test_monthly_leaderboard.py` — 8 tests
- Sums within month, outside-month excluded, tied ranks, recompute no duplicate, flush deletes all, no scores → 0 entries, ranking order correct, invalid format handled

#### `pipeline/tests/test_department_and_migration.py` — 9 tests
- Department field exists (max_length=150, blank), defaults to empty, can be set, persists, exists as DB column; MonthlyLeaderboard has expected fields, indexes, related_name, ordering

#### `pipeline/tests/test_cleanup_day.py` — 9 tests
- Submissions deleted, leaderboard entries deleted, DailyScore preserved, score values intact, other dates unaffected, default date = yesterday, noop when no data, invalid format handled, idempotent rerun

### Running Tests
```bash
cd backend
python manage.py test              # runs all 132 tests
python manage.py test accounts     # auth tests
python manage.py test exams        # exam tests
python manage.py test pipeline     # pipeline tests
```
