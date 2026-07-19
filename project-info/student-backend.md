# Student Backend Reference — Apptist Platform

> **Purpose:** Exhaustive reference for the student-facing backend. An AI receiving only this file should be able to understand, modify, debug, and extend every student-facing endpoint, model, and business logic constraint.

---

## Table of Contents

1. [Django Project Structure](#1-django-project-structure)
2. [Models](#2-models)
3. [Student API Endpoints](#3-student-api-endpoints)
4. [Auth API Endpoints](#4-auth-api-endpoints)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Time Windows (Critical Business Logic)](#6-time-windows-critical-business-logic)
7. [Redis Caching](#7-redis-caching)
8. [Settings](#8-settings)
9. [Test Files](#9-test-files)

---

## 1. Django Project Structure

```
backend/
├── core/
│   ├── settings/{base,local,production}.py
│   ├── urls.py                 ← All 28 URL routes defined here
│   ├── permissions.py          ← IsStudentUser, IsTeacherUser, IsAnswerWindowOpen
│   └── wsgi.py
├── accounts/
│   ├── models.py               ← CustomUser
│   ├── views.py                ← login_view, register_view, student_signin_view
│   └── tests.py                ← 21 tests
├── exams/
│   ├── models.py               ← Question, AnswerKey, StudentSubmission
│   ├── views.py                ← GetExamQuestionsView, SubmitAnswersView, StudentReviewView, get_answer_key
│   ├── serializers.py          ← QuestionSerializer, StudentSubmissionSerializer
│   ├── cache.py                ← Redis cache logic (get_questions_cached, warm_question_cache)
│   └── tests/                  ← 54 tests across 6 files
└── pipeline/
    ├── models.py               ← DailyScore, DailyLeaderboard
    ├── views.py                ← StudentDashboardView, StudentLeaderboardView
    └── aggregation.py          ← aggregate_and_export()
```

---

## 2. Models

### `CustomUser` (`accounts/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `email` | `EmailField` | `unique=True`, `USERNAME_FIELD` | — |
| `full_name` | `CharField(max_length=150)` | required | — |
| `roll_number` | `CharField(max_length=20)` | `unique=True, null=True, blank=True` | `None` |
| `department` | `CharField(max_length=150)` | `blank=True` | `''` |
| `is_student` | `BooleanField` | — | `False` |
| `is_teacher` | `BooleanField` | — | `False` |
| `is_active` | `BooleanField` | — | `True` |
| `is_staff` | `BooleanField` | — | `False` |

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
**NO unique constraint** — duplicates allowed by design.

### `AnswerKey` (`exams/models.py`)

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `date` | `DateField` | `unique=True` | — |
| `correct_answers` | `JSONField` | — | — |
| `created_at` | `DateTimeField(auto_now_add=True)` | — | auto |
| `updated_at` | `DateTimeField(auto_now=True)` | — | auto |

**Meta:** `ordering = ['-date']`.

Format: `{"q1": "A", "q2": "B", "q3": "C", "q4": "D", "q5": "A", "q6": "B", "q7": "C", "q8": "D", "q9": "A", "q10": "B"}`

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

Format: `{"q1": "B", "q2": "A", ...}` or `{}`

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

---

## 3. Student API Endpoints

All student endpoints require `JWT + IsStudentUser` unless noted.

### GET `/api/tests/questions/?date=YYYY-MM-DD`

**Permissions:** `IsAuthenticated` (no role check — any authenticated user can access)

**Query params:** `date` (required, `YYYY-MM-DD`)

**Flow:**
1. Try Redis cache (`exam:questions:{date}`)
2. If cache hit → return cached questions
3. If cache miss AND inside exam window (10AM-2PM) AND Redis available → return **503** (prevents DB overload)
4. If cache miss outside exam window OR Redis unavailable → query DB, warm cache, return

**Response (200):**
```json
{
  "date": "2025-07-15",
  "questions": [
    {
      "id": 1,
      "text": "What is 2+2?",
      "option_a": "3",
      "option_b": "4",
      "option_c": "5",
      "option_d": "6",
      "image_url": null
    }
  ],
  "source": "cache"
}
```

`source` is one of: `"cache"`, `"db_fallback"`.

**400:** Missing date parameter
**404:** No questions for that date
**503:** Cache miss during exam window

### POST `/api/tests/submit/`

**Permissions:** `IsAuthenticated, IsStudentUser`

**Body:**
```json
{
  "exam_date": "2025-07-15",
  "answers": {"q1": "A", "q2": "B", "q3": "C", "q4": "D", "q5": "A", "q6": "B", "q7": "C", "q8": "D", "q9": "A", "q10": "B"}
}
```

**Flow:**
1. Validate `exam_date` and `answers` present
2. Check time: if `now > 14:00` → return **409** (window closed)
3. `StudentSubmission.objects.update_or_create(student=user, exam_date=..., defaults={'answers': ...})` inside `transaction.atomic()`
4. Return 201 on create, 200 on update

**Response (201):**
```json
{
  "message": "Submission received",
  "student": "user@email.com",
  "exam_date": "2025-07-15",
  "answers_submitted": 10,
  "created": true
}
```

**400:** Missing fields
**401:** No auth
**403:** Teacher role (not student)
**409:** Exam window closed (after 2PM)

### GET `/api/tests/answers/?date=YYYY-MM-DD`

**Permissions:** `IsAuthenticated, IsAnswerWindowOpen` (2PM-7PM only)

**Query params:** `date` (optional, defaults to today)

**Response (200):**
```json
{
  "date": "2025-07-15",
  "correct_answers": {"q1": "A", "q2": "B", ...},
  "opens_at": "14:00",
  "closes_at": "19:00"
}
```

**403:** Outside 2PM-7PM window — `{"detail": "Answer key is not available at this time."}`
**404:** No answer key for that date

### GET `/api/student/dashboard/`

**Permissions:** `IsAuthenticated, IsStudentUser`

**Response (200):**
```json
{
  "today_status": "before_window|in_progress|submitted|reviewed|missed",
  "today": {
    "score": 8,
    "total_questions": 10,
    "submitted_at": "2025-07-15T11:30:00Z"
  },
  "recent_scores": [
    {"date": "2025-07-14", "score": 7, "total_questions": 10},
    {"date": "2025-07-13", "score": 9, "total_questions": 10}
  ],
  "total_exams_taken": 15,
  "average_score": 7.3
}
```

**`today_status` determination logic:**
```
if now < 10:00 AM → 'before_window'
elif now <= 2:00 PM:
  if has submission → 'submitted'
  else → 'in_progress'
else (after 2PM):
  if no submission → 'missed'
  elif has DailyScore → 'reviewed'
  else → 'submitted'
```

`total_exams_taken` = `DailyScore.objects.filter(student=user).count()`
`average_score` = `avg(DailyScore.score for all records)`

### GET `/api/student/review/?date=YYYY-MM-DD`

**Permissions:** `IsAuthenticated, IsStudentUser`

**Query params:** `date` (optional, defaults to today)

**Response (200):**
```json
{
  "date": "2025-07-15",
  "submitted_at": "2025-07-15T11:30:00Z",
  "answers": {"q1": "A", "q2": "B", ...},
  "correct_answers": {"q1": "A", "q2": "B", ...},
  "score": 8,
  "total_questions": 10,
  "window_status": "open|before_window|after_window",
  "opens_at": "14:00",
  "closes_at": "19:00"
}
```

**Window behavior:**
- Before 2PM: `correct_answers=null`, `score=null`, `window_status="before_window"`
- 2PM-7PM: `correct_answers` populated, `score` computed, `window_status="open"`
- After 7PM: `correct_answers=null`, `score=null`, `window_status="after_window"`

**404:** No submission for that date

### GET `/api/student/leaderboard/?top=25`

**Permissions:** `IsAuthenticated, IsStudentUser`

**Query params:** `top` (default: 25)

**Response (200):**
```json
{
  "rankings": [
    {
      "rank": 1,
      "name": "Student A",
      "roll_number": "NGI2026CS045",
      "score": 9
    }
  ],
  "total_examinees": 42,
  "latest_date": "2025-07-15"
}
```

Uses the latest date from `DailyScore` table. Rankings ordered by `-score`.

---

## 4. Auth API Endpoints

All auth endpoints are public (`AllowAny`).

### POST `/api/auth/login/`

**Body:**
```json
{"email": "user@test.com", "password": "testpass123"}
```

**Response (200):**
```json
{
  "access": "...",
  "refresh": "...",
  "user": {
    "id": 1,
    "email": "user@test.com",
    "full_name": "John Doe",
    "is_student": true,
    "is_teacher": false,
    "roll_number": "NGI2026CS045"
  }
}
```

**Errors:** 400 (missing fields, invalid format), 401 (wrong credentials), 403 (inactive user)

### POST `/api/auth/register/`

**Body:**
```json
{
  "email": "new@test.com",
  "password": "pass123456",
  "full_name": "New Student",
  "roll_number": "NGI2026CS001",
  "department": "Computer Science"
}
```

Creates `CustomUser` with `is_student=True`. Returns JWT tokens + user object.

**Errors:** 400 (missing fields, short password, duplicate email/roll_number)

### POST `/api/auth/student-signin/`

**Body:**
```json
{
  "full_name": "Jane Smith",
  "roll_number": "NGI-CS-2026-042",
  "email": "jane@test.com",
  "department": "Computer Science",
  "mobile": "9876543210",
  "year": "3",
  "semester": "5"
}
```

**Flow:**
1. If `roll_number` exists → update user profile, return tokens
2. If `email` exists → update user profile, return tokens
3. Else → create new user with `set_unusable_password()`, return tokens

### POST `/api/auth/refresh/`

**Body:** `{"refresh": "<refresh_token>"}`

**Response:** `{"access": "<new_access_token>"}`

Old refresh token is blacklisted after rotation.

---

## 5. Authentication & Authorization

### JWT Configuration

| Setting | Dev | Prod |
|---------|-----|------|
| Access token lifetime | 7 days | 15 minutes |
| Refresh token lifetime | 7 days | 7 days |
| `ROTATE_REFRESH_TOKENS` | True | True |
| `BLACKLIST_AFTER_ROTATION` | True | True |
| Auth header | `Bearer <token>` | `Bearer <token>` |

### JWT Payload

```json
{
  "email": "user@test.com",
  "is_student": true,
  "is_teacher": false,
  "roll_number": "NGI2026CS045",
  "full_name": "John Doe",
  "exp": 1234567890
}
```

### Permissions (`core/permissions.py`)

```python
class IsStudentUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_student
        )
```

```python
class IsAnswerWindowOpen(BasePermission):
    message = "Answer key is not available at this time."
    def has_permission(self, request, view):
        now = timezone.now().time()
        return time(14, 0) <= now <= time(19, 0)
```

---

## 6. Time Windows (Critical Business Logic)

All times are **IST (Asia/Kolkata)**. `TIME_ZONE = 'Asia/Kolkata'`, `USE_TZ = True`.

| Time | Event | Enforcement |
|------|-------|-------------|
| **9:45 AM** | Cache warming cron | `warm_question_cache` command |
| **10:00 AM** | Exam window opens | Questions returned via API |
| **10:00 AM – 2:00 PM** | Exam available | `GetExamQuestionsView` returns questions |
| **Before 2:00 PM** | Submissions accepted | `SubmitAnswersView` accepts POST |
| **After 2:00 PM** | Submissions rejected | `SubmitAnswersView` returns 409 |
| **2:00 PM – 7:00 PM** | Answer key visible | `get_answer_key` returns answers |
| **Outside 2-7 PM** | Answer key hidden | `get_answer_key` returns 403 |
| **7:30 PM** | Day cleanup cron | `cleanup_day` command |
| **After download** | 4-hour CSV TTL | `ScheduledFileDeletion` model |

### Time enforcement code locations:
- Exam questions window: `exams/views.py:GetExamQuestionsView` line 72: `is_exam_window = time(10, 0) <= now <= time(14, 0)`
- Submit deadline: `exams/views.py:SubmitAnswersView` line 136: `if now > time(14, 0)`
- Answer key gate: `core/permissions.py:IsAnswerWindowOpen` line 30: `time(14, 0) <= now <= time(19, 0)`
- Review window: `exams/views.py:StudentReviewView` line 70: `time(14, 0) <= now <= time(19, 0)`

---

## 7. Redis Caching

### Configuration
- **Connection:** `redis.from_url(os.environ.get('UPSTASH_REDIS_URL'))`
- **Graceful fallback:** If env var not set, `redis_client = None`, all cache ops are no-ops
- **Library:** `redis` Python package with `decode_responses=True`

### Cache Behavior
- **Key:** `exam:questions:{exam_date}`
- **Value:** JSON-serialized list of question dicts
- **TTL:** 21600 seconds (6 hours)
- **Warming:** `warm_question_cache(exam_date)` — loads from DB, sets in Redis
- **During exam window (10AM-2PM):** Cache miss → **503** (prevents DB overload)
- **Outside exam window:** Cache miss → DB fallback + re-warm cache

### `get_questions_cached(exam_date)`
```python
def get_questions_cached(exam_date: str):
    if not redis_client:
        return None
    cache_key = f"exam:questions:{exam_date}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    return None
```

### `warm_question_cache(exam_date)`
```python
def warm_question_cache(exam_date: str):
    if not redis_client:
        return 0
    from exams.models import Question
    questions = list(Question.objects.filter(exam_date=exam_date).values(
        'id', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'image_url'
    ))
    cache_key = f"exam:questions:{exam_date}"
    redis_client.set(cache_key, json.dumps(questions), ex=CACHE_TTL)
    return len(questions)
```

---

## 8. Settings

### Dev (`core/settings/local.py`)
- `DEBUG = True`
- SQLite database
- JWT access token: 7 days
- `CORS_ALLOWED_ORIGINS = ['http://localhost:5173']`

### Prod (`core/settings/production.py`)
- `DEBUG = False`
- PostgreSQL via `dj-database-url` (PgBouncer port 6543)
- JWT access token: 15 minutes
- HSTS headers, SSL redirect, secure cookies
- `conn_max_age = 600`
- whitenoise static file serving

### Shared (`core/settings/base.py`)
- `TIME_ZONE = 'Asia/Kolkata'`
- `USE_TZ = True`
- `AUTH_USER_MODEL = 'accounts.CustomUser'`
- `SIMPLE_JWT.ROTATE_REFRESH_TOKENS = True`
- `SIMPLE_JWT.BLACKLIST_AFTER_ROTATION = True`
- whitenoise in MIDDLEWARE
- corsheaders in MIDDLEWARE

---

## 9. Test Files

### Backend Tests (132 tests total)

#### `accounts/tests.py` — 21 tests
- **AnswerKeyTimeGateTest (6):** 403 outside 2PM-7PM, 200 at boundaries
- **LoginEndpointTest (8):** Success, wrong password/email, missing fields, inactive user
- **SecurityAuditTest (7):** Unauth → 401, payloads correct, public endpoints

#### `exams/tests.py` — 6 tests
- **StudentReviewWindowTest (6):** Review endpoint time-gating

#### `exams/tests_submit.py` — 17 tests
- **SubmitAnswersViewPayloadTest (17):** Response format matches spec exactly, 201/200, 409 after 2PM, 400 missing fields, 401 unauth, 403 teacher, dict count, DB record, one-per-day

#### `exams/tests_security_rbac.py` — 7 tests
- **StudentRBACRejectionTest (7):** Student → 403 on all admin endpoints

#### `exams/tests_data_integrity.py` — 5 tests
- **DataIntegrityTest (5):** Unique constraints enforced

#### `exams/tests_image_upload.py` — 4 tests
- **ImageUploadTest (4):** Image file persistence

#### `pipeline/tests/test_cleanup_day.py` — 9 tests
- Submissions + leaderboard deleted, DailyScore preserved

#### `pipeline/tests/test_aggregation.py` — 5 tests
- Scoring engine: empty, partial, all-zero, perfect, idempotent

#### `pipeline/tests/test_leaderboard.py` — 5 tests
- Weekly leaderboard: sum, exclusion, ties, recompute, flush

### Running Tests
```bash
cd backend
python manage.py test
```
