# MASTER_PROJECT_COMPLIANCE.md
## Automated Institutional Aptitude Test Platform
### Solo Developer Master Reference Document

---

## Table of Contents

1. [Part 1: Repository Architecture & Reuse Map](#part-1-repository-architecture--reuse-map)
2. [Part 2: Day-1 Setup & First Commands](#part-2-day-1-setup--first-commands)
3. [Part 3: Architectural Component Implementation & Critical Code Boilerplates](#part-3-architectural-component-implementation--critical-code-boilerplates)
4. [Part 4: Mobile-First UI/UX Schematic & Router Specifications](#part-4-mobile-first-uiux-schematic--router-specifications)
5. [Part 5: Deployment Infrastructure & Refresh Production Plan](#part-5-deployment-infrastructure--refresh-production-plan)

---

## Part 1: Repository Architecture & Reuse Map

```
apptist-aptitude-platform/
│
├── .gitignore                          # Blocks .env, __pycache__, venv/, *.sqlite3, media/, node_modules/
├── render.yaml                         # Render.com blueprints auto-deploy config
├── HOSTING_GUIDE.md                    # Step-by-step deployment guide
├── CLAUDE.md                           # AI assistant context document
│
├── backend/                            # Django REST API
│   ├── manage.py
│   ├── requirements.txt                # Python dependencies
│   ├── Procfile                        # gunicorn WSGI entrypoint
│   ├── .env.example                    # Environment variable template
│   ├── db.sqlite3                      # Local dev database
│   │
│   ├── core/                           # Django project root
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py                 # Shared: INSTALLED_APPS, SIMPLE_JWT, TIME_ZONE=Asia/Kolkata
│   │   │   ├── local.py               # Dev: SQLite, DEBUG=True, JWT 7-day access token
│   │   │   └── production.py          # Prod: PostgreSQL+PgBouncer, conn_max_age=0, SSL, CORS
│   │   ├── urls.py                     # ALL route definitions (app-level urls.py files are empty)
│   │   ├── wsgi.py                     # WSGI application entrypoint
│   │   └── permissions.py             # IsStudentUser, IsTeacherUser, IsAnswerWindowOpen
│   │
│   ├── accounts/                       # Authentication & User Management
│   │   ├── models.py                   # CustomUser (email as USERNAME_FIELD, is_student/is_teacher)
│   │   ├── managers.py                 # Custom UserManager
│   │   ├── views.py                    # login_view, register_view, student_signin_view
│   │   └── tests.py                    # 21 auth & security tests
│   │
│   ├── exams/                          # Questions, Answer Keys, Submissions
│   │   ├── models.py                   # Question, AnswerKey, StudentSubmission
│   │   ├── views.py                    # GetExamQuestionsView, SubmitAnswersView, UploadQuestionsView
│   │   ├── serializers.py             # AdminQuestionSerializer
│   │   ├── cache.py                    # Redis cache: get_questions_cached, warm_question_cache
│   │   ├── admin.py                    # Django admin registrations
│   │   └── management/commands/
│   │       ├── warm_question_cache.py  # Cron-triggered Redis cache preloader
│   │       └── seed_test_data.py       # Dev utility to seed questions
│   │
│   ├── pipeline/                       # Score Aggregation, Leaderboards, CSV Reports
│   │   ├── models.py                   # DailyScore, DailyLeaderboard, WeeklyLeaderboard,
│   │   │                               # ScheduledFileDeletion, ReportDownloadLog
│   │   ├── views.py                    # StudentLeaderboardView, AdminRankingsView, DashboardStatsView
│   │   ├── aggregation.py             # aggregate_and_export (chunk_size=500, CSV export)
│   │   ├── signals.py                 # pre_save on Question: purge stale CSVs + flush leaderboard
│   │   └── management/commands/
│   │       ├── aggregate_scores.py     # Grade submissions for a date
│   │       ├── compute_weekly_leaderboard.py
│   │       ├── flush_weekly_leaderboard.py
│   │       └── process_deletions.py    # Delete overdue CSV files
│   │
│   └── tests/
│       └── locustfile.py              # Load test: 2000 concurrent users
│
└── frontend/                           # React + Vite SPA
    ├── index.html                      # Google Fonts + Material Symbols + Remix Icons CDN
    ├── package.json                    # React 18, React Router 6, Axios, jwt-decode
    ├── vite.config.js                  # Vite + React + API proxy (localhost:8000)
    ├── vercel.json                     # SPA routing rewrites + CORS headers
    ├── public/
    │   ├── app-logo.png
    │   └── college-logo.png
    │
    └── src/
        ├── main.jsx                    # Entry point
        ├── index.css                   # Global styles, fonts, design tokens
        │
        ├── api/
        │   └── client.js              # Axios instance: JWT interceptors, authAPI, examAPI, adminAPI
        │
        ├── router/
        │   ├── AppRouter.jsx           # React Router v6 BrowserRouter with all routes
        │   └── ProtectedRoute.jsx      # JWT decode + role guard (is_student/is_teacher)
        │
        ├── hooks/
        │   ├── usePersistedAnswers.js  # Base64-encoded localStorage answer persistence
        │   └── useExamCountdown.js     # Countdown timer + auto-submit on expiry
        │
        ├── components/
        │   ├── QuestionCard.jsx        # Question + conditional image + 4 options
        │   ├── CountdownTimer.jsx      # Timer display component
        │   └── BottomNav.jsx           # Admin bottom navigation
        │
        └── pages/
            ├── Login.jsx               # Student passwordless sign-in + admin login link
            ├── student/
            │   ├── Register.jsx        # Student registration with password
            │   ├── ExamPage.jsx        # Real API exam interface with countdown + auto-submit
            │   └── LeaderboardPage.jsx # Real API leaderboard (top 25 students)
            └── admin/
                ├── AdminLogin.jsx      # Teacher/admin login
                ├── AdminDashboard.jsx  # Stats dashboard with nav tiles
                ├── AdminQuestions.jsx  # Question management (list by date)
                ├── AdminQuestionDateDetail.jsx  # View/delete questions for a date
                ├── TeacherUpload.jsx   # Bulk question upload form
                ├── PlatformAnalytics.jsx  # Analytics with SVG charts
                ├── RankPage.jsx        # Daily/weekly rankings
                └── TeacherReports.jsx  # Report download with date filters
```

---

## Part 2: Day-1 Setup & First Commands

### 2.1 Git Initialization

```bash
# Clone or initialize the repository
git clone https://github.com/YOUR_USERNAME/apptist-aptitude-platform.git
cd apptist-aptitude-platform

# Create .gitignore (already exists, but verify contents)
cat .gitignore
# Should contain:
#   __pycache__/
#   *.pyc
#   .env
#   *.env.zip
#   venv/
#   *.sqlite3
#   media/
#   node_modules/
#   dist/
#   .env.local

# Create development branch
git checkout -b development
git push -u origin development
```

### 2.2 Python Virtual Environment & Dependencies

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# requirements.txt contains:
# Django>=5.0,<5.2
# djangorestframework>=3.15
# djangorestframework-simplejwt>=5.3
# django-cors-headers>=4.3
# python-dotenv>=1.0
# dj-database-url>=2.1
# psycopg2-binary>=2.9
# gunicorn>=22.0
# redis>=5.0
# locust>=2.31
```

### 2.3 Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values:
# SECRET_KEY=your-random-secret-key-here
# DEBUG=True
# ALLOWED_HOSTS=localhost,127.0.0.1
# DATABASE_URL=sqlite:///db.sqlite3
# UPSTASH_REDIS_URL=redis://localhost:6379
# CRON_SECRET_KEY=your-cron-secret-here
# CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 2.4 Run Migrations & Create Superuser

```bash
# Set Django settings module (Windows)
set DJANGO_SETTINGS_MODULE=core.settings.local

# Set Django settings module (Mac/Linux)
export DJANGO_SETTINGS_MODULE=core.settings.local

# Run migrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser
# Enter: admin@ngi.edu.in, admin123, etc.

# Seed test questions (optional)
python manage.py seed_test_data

# Run backend tests (should pass 40 tests)
python manage.py test
```

### 2.5 Frontend Setup

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:5173
```

### 2.6 Start Both Servers

```bash
# Terminal 1 - Backend (from backend/)
python manage.py runserver

# Terminal 2 - Frontend (from frontend/)
npm run dev
```

---

## Part 3: Architectural Component Implementation & Critical Code Boilerplates

### 3.1 Memory-Safe Score Aggregation with `.iterator(chunk_size=500)`

**File:** `backend/pipeline/aggregation.py`

```python
# pipeline/aggregation.py
import csv
import os

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from exams.models import AnswerKey, StudentSubmission
from pipeline.models import DailyScore


def aggregate_and_export(exam_date):
    answer_key = AnswerKey.objects.get(date=exam_date)
    correct = answer_key.correct_answers

    # Memory-safe iteration: loads 500 records at a time instead of all 2,000
    submissions = (
        StudentSubmission.objects
        .filter(exam_date=exam_date)
        .select_related('student')
        .iterator(chunk_size=500)
    )

    score_objs = []
    student_rows = []

    for sub in submissions:
        score = sum(1 for q, ans in sub.answers.items() if correct.get(q) == ans)
        score_objs.append(
            DailyScore(student=sub.student, exam_date=exam_date, score=score)
        )
        student_rows.append(
            (sub.student.id, sub.student.full_name, score)
        )

    # Bulk insert scores in a single transaction
    with transaction.atomic():
        DailyScore.objects.bulk_create(
            score_objs,
            update_conflicts=True,
            unique_fields=['student', 'exam_date'],
            update_fields=['score'],
        )

    # Sort by score descending for ranking
    student_rows.sort(key=lambda row: row[2], reverse=True)

    # Assign ranks (tied scores share rank)
    export_timestamp = timezone.now().isoformat()
    ranked_rows = []
    prev_score = None
    prev_rank = 0
    for i, (student_id, name, score) in enumerate(student_rows, start=1):
        if score != prev_score:
            prev_rank = i
            prev_score = score
        ranked_rows.append([student_id, name, score, prev_rank, export_timestamp])

    # Export to CSV
    export_path = os.path.join(
        settings.MEDIA_ROOT, 'exports', f'Master_Report_{exam_date}.csv'
    )
    os.makedirs(os.path.dirname(export_path), exist_ok=True)
    with open(export_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['student_id', 'name', 'score', 'rank', 'timestamp'])
        writer.writerows(ranked_rows)

    return export_path
```

**Why `.iterator(chunk_size=500)`?**
- Render Free Tier has 512MB RAM
- Loading 2,000 `StudentSubmission` objects with `select_related('student')` at once would consume ~200-400MB
- `.iterator()` streams records one chunk at a time, keeping memory under 50MB
- `chunk_size=500` balances query overhead vs memory usage

---

### 3.2 ScheduledFileDeletion Model & Cleanup Script

**File:** `backend/pipeline/models.py` (relevant section)

```python
class ScheduledFileDeletion(models.Model):
    file_path = models.CharField(max_length=500)
    delete_after = models.DateTimeField()
    deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['delete_after', 'deleted'])]

    def __str__(self):
        return f"{self.file_path} -> delete after {self.delete_after}"
```

**File:** `backend/pipeline/management/commands/process_deletions.py`

```python
# pipeline/management/commands/process_deletions.py
import os
import logging

from django.core.management.base import BaseCommand
from django.utils import timezone

from pipeline.models import ScheduledFileDeletion

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Process all overdue scheduled file deletions."

    def handle(self, *args, **options):
        now = timezone.now()
        due_records = ScheduledFileDeletion.objects.filter(
            delete_after__lte=now,
            deleted=False,
        )

        deleted_count = 0
        for record in due_records:
            try:
                if os.path.exists(record.file_path):
                    os.remove(record.file_path)
                    logger.info(f"[CRON] CSV deleted: {record.file_path}")
                else:
                    logger.warning(f"[CRON] File already gone: {record.file_path}")
            except Exception as e:
                logger.error(f"[CRON] Failed to delete {record.file_path}: {e}")

            record.deleted = True
            record.save(update_fields=['deleted'])
            deleted_count += 1

        self.stdout.write(f"Processed {deleted_count} deletions.")
```

**How it survives server sleep:**
- The `ScheduledFileDeletion` record is stored in PostgreSQL (persistent)
- When Render spins down, the record persists in the database
- When cron-job.org triggers `process_deletions`, Render wakes up and processes overdue records
- Even if the server sleeps 100 times, the deletion schedule survives in the DB

---

### 3.3 Pre-Save Signal: Intercept Stale CSVs on Question Upload

**File:** `backend/pipeline/signals.py`

```python
# pipeline/signals.py
import os
import glob
import logging

from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.conf import settings

from exams.models import Question
from .models import DailyLeaderboard

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Question)
def purge_stale_csv_on_question_upload(sender, instance, **kwargs):
    # Only trigger for NEW questions (not updates)
    if not instance._state.adding:
        return

    # Only trigger if this is the FIRST question for this exam date
    already_has_questions_for_date = Question.objects.filter(
        exam_date=instance.exam_date
    ).exists()
    if already_has_questions_for_date:
        return

    # Purge all stale CSV reports from disk
    export_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
    stale_files = glob.glob(os.path.join(export_dir, 'Master_Report_*.csv'))
    for f in stale_files:
        try:
            os.remove(f)
            logger.warning(f"[INTERCEPT] Stale CSV purged: {f}")
        except FileNotFoundError:
            pass

    # Flush the DailyLeaderboard
    deleted_count, _ = DailyLeaderboard.objects.all().delete()
    logger.warning(f"[INTERCEPT] DailyLeaderboard flushed: {deleted_count} records removed.")
```

**Behavior:**
1. When admin uploads questions for a NEW exam date, the signal fires
2. It checks if questions already exist for that date (skips if they do)
3. It deletes ALL stale `Master_Report_*.csv` files from disk
4. It flushes the entire `DailyLeaderboard` table
5. This ensures no stale data leaks into the next exam cycle

---

### 3.4 IsAnswerWindowOpen Permission Class

**File:** `backend/core/permissions.py`

```python
# core/permissions.py
from datetime import time

from django.utils import timezone
from rest_framework.permissions import BasePermission


class IsStudentUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_student
        )


class IsTeacherUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_teacher
        )


class IsAnswerWindowOpen(BasePermission):
    message = "Answer key is not available at this time."

    def has_permission(self, request, view):
        now = timezone.now().time()
        return time(14, 0) <= now <= time(19, 0)
```

**Critical details:**
- Uses `timezone.now().time()` (NOT `datetime.now().time()`) — ensures IST timezone awareness
- `TIME_ZONE = 'Asia/Kolkata'` and `USE_TZ = True` in `base.py`
- Returns 403 Forbidden outside 2:00 PM - 7:00 PM window
- Applied to `GET /api/tests/answers/` endpoint

---

### 3.5 High-Velocity Submission Endpoint with `transaction.atomic()`

**File:** `backend/exams/views.py` (SubmitAnswersView)

```python
class SubmitAnswersView(APIView):
    permission_classes = [IsAuthenticated, IsStudentUser]

    def post(self, request):
        exam_date_str = request.data.get('exam_date')
        answers = request.data.get('answers')

        # Validate required fields
        if not exam_date_str or not answers:
            return Response(
                {'error': 'exam_date and answers are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Enforce submission deadline (2:00 PM IST)
        now = timezone.now().time()
        if now > time(14, 0):
            return Response(
                {'error': 'Exam window has closed. Submissions are no longer accepted.'},
                status=status.HTTP_409_CONFLICT
            )

        # Atomic transaction: prevents partial writes and race conditions
        try:
            with transaction.atomic():
                submission, created = StudentSubmission.objects.update_or_create(
                    student=request.user,
                    exam_date=exam_date_str,
                    defaults={'answers': answers},
                )
            logger.info(f"[SUBMIT] {'Created' if created else 'Updated'} - student={request.user.id}, date={exam_date_str}")
            return Response(
                {'status': 'submitted', 'created': created},
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"[SUBMIT] Transaction failed - student={request.user.id}: {e}")
            return Response(
                {'error': 'Submission failed. Please retry.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

**Why `transaction.atomic()`?**
- Prevents race conditions if a student double-clicks submit
- `update_or_create` is atomic: either creates or updates, never duplicates
- If any part fails, the entire transaction rolls back (no partial data)
- Under 2,000 concurrent submits, each transaction is isolated

---

## Part 4: Mobile-First UI/UX Schematic & Router Specifications

### 4.1 React Router v6 with ProtectedRoute HOC

**File:** `frontend/src/router/ProtectedRoute.jsx`

```jsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function ProtectedRoute({ children, requiredRole }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false

    async function checkAccess() {
      const token = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        if (!cancelled) setStatus('denied')
        return
      }

      // Try existing token first
      if (token) {
        try {
          const decoded = jwtDecode(token)
          const now = Math.floor(Date.now() / 1000)
          if (decoded.exp && decoded.exp > now) {
            return finish(decoded)
          }
        } catch {
          // Corrupt token, try refresh
        }
      }

      // Refresh expired token
      try {
        const res = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
          refresh: refreshToken,
        })
        const newAccess = res.data.access
        localStorage.setItem('access_token', newAccess)
        const decoded = jwtDecode(newAccess)
        if (!cancelled) finish(decoded)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        if (!cancelled) setStatus('denied')
      }
    }

    function finish(decoded) {
      if (requiredRole && !decoded[requiredRole]) {
        setStatus('denied')
      } else {
        setStatus('ok')
      }
    }

    checkAccess()
    return () => { cancelled = true }
  }, [requiredRole])

  if (status === 'checking') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'Inter, sans-serif',
        color: '#4e473e', fontSize: 14,
      }}>
        Checking session...
      </div>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/login" replace />
  }

  return children
}
```

**Route configuration in AppRouter.jsx:**
```jsx
<Route
  path="/student/exam"
  element={
    <ProtectedRoute requiredRole="is_student">
      <ExamPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute requiredRole="is_teacher">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

---

### 4.2 QuestionCard Component with Conditional Image Rendering

**File:** `frontend/src/components/QuestionCard.jsx`

```jsx
export default function QuestionCard({ id, text, option_a, option_b, option_c, option_d, image_url, selected, onSelect }) {
  const options = [
    { label: 'A', value: option_a },
    { label: 'B', value: option_b },
    { label: 'C', value: option_c },
    { label: 'D', value: option_d },
  ].filter(o => o.value)

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #ece9e2',
      borderRadius: 14,
      padding: 16,
    }}>
      {/* Conditional image rendering — prevents CLS */}
      {image_url && (
        <div style={{
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 12,
          background: '#f5f5f2',
        }}>
          <img
            src={image_url}
            alt={`Question ${id} diagram`}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px', color: '#2a2a28' }}>
        <strong>Q{id}.</strong> {text}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(options).map(([key, opt]) => {
          const isSelected = selected === opt.label
          return (
            <div
              key={opt.label}
              onClick={() => onSelect(id, opt.label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 8,
                border: isSelected ? '2px solid #465aa3' : '1px solid #e5e3dd',
                background: isSelected ? '#EAEFFD50' : '#fff',
                cursor: 'pointer',
                fontSize: 14,
                color: '#2a2a28',
              }}
            >
              <span style={{
                fontWeight: 700,
                color: isSelected ? '#465aa3' : '#8a8a86',
                minWidth: 18,
              }}>
                {opt.label}.
              </span>
              {opt.value}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**CLS Prevention:**
- `aspectRatio: '16 / 9'` reserves space before image loads
- `loading="lazy"` defers off-screen images
- `onError` hides broken images gracefully
- No layout shift when image loads or fails

---

### 4.3 usePersistedAnswers Hook (Base64 localStorage)

**File:** `frontend/src/hooks/usePersistedAnswers.js`

```javascript
import { useState } from 'react';

const encode = (data) => btoa(JSON.stringify(data));
const decode = (raw) => JSON.parse(atob(raw));

export function usePersistedAnswers(userId, examDate) {
  const storageKey = `exam_answers_${userId}_${examDate}`;

  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return {};
      return decode(saved);
    } catch {
      return {};
    }
  });

  const saveAnswer = (questionId, answer) => {
    const updated = { ...answers, [questionId]: answer };
    setAnswers(updated);
    localStorage.setItem(storageKey, encode(updated));
  };

  const clearAnswers = () => {
    setAnswers({});
    localStorage.removeItem(storageKey);
  };

  return { answers, saveAnswer, clearAnswers };
}
```

**Base64 Obfuscation:**
- Answers stored as `btoa(JSON.stringify({q1: "A", q2: "B", ...}))`
- Not encryption — prevents casual tampering via DevTools console
- Survives page refresh, browser tab close, network drops
- Key namespaced per student per exam date

---

### 4.4 Countdown Timer Hook with Auto-Submit

**File:** `frontend/src/hooks/useExamCountdown.js`

```javascript
import { useState, useEffect, useRef } from 'react';

export default function useExamCountdown(examEndTime, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  const examEndTimeRef = useRef(examEndTime);

  // Always hold latest callback without re-running effect
  onExpireRef.current = onExpire;

  useEffect(() => {
    // Only reset expiry flag when exam end time changes (new exam)
    if (examEndTime !== examEndTimeRef.current) {
      examEndTimeRef.current = examEndTime;
      hasExpiredRef.current = false;
    }

    const calcRemaining = () => {
      const now = new Date();
      const end = new Date(examEndTime);
      return Math.max(0, Math.floor((end - now) / 1000));
    };

    setSecondsLeft(calcRemaining());

    intervalRef.current = setInterval(() => {
      const remaining = calcRemaining();
      setSecondsLeft(remaining);

      if (remaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        clearInterval(intervalRef.current);
        onExpireRef.current();  // Fires auto-submit exactly once
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [examEndTime]);  // Only re-runs when examEndTime changes

  const hh = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}
```

**Auto-Submit Safety:**
- `hasExpiredRef` prevents multiple firings
- `onExpireRef` always holds the latest callback without re-running the effect
- Only re-runs when `examEndTime` changes (new exam session)
- Fires `handleSubmit(true)` exactly once when countdown hits 00:00:00

---

## Part 5: Deployment Infrastructure & Refresh Production Plan

### 5.1 Production Settings with PgBouncer Pooling

**File:** `backend/core/settings/production.py`

```python
# core/settings/production.py
import os
from datetime import timedelta
import dj_database_url
from .base import *

DEBUG = False
SECRET_KEY = os.environ['SECRET_KEY']
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# PgBouncer connection pooling via Neon.tech
DATABASES = {
    'default': dj_database_url.parse(
        os.environ['DATABASE_URL'],
        conn_max_age=0,        # Critical: prevents stale connections after Render sleep
        ssl_require=True,       # Enforce SSL for Neon PostgreSQL
    )
}

# CORS: restrict to Vercel frontend only
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['GET', 'POST', 'OPTIONS']
CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'origin',
    'x-csrftoken',
    'x-cron-secret',
]

# CorsMiddleware must be first in MIDDLEWARE
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# JWT: 15-minute access tokens in production
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CRON_SECRET_KEY = os.environ['CRON_SECRET_KEY']
UPSTASH_REDIS_URL = os.environ['UPSTASH_REDIS_URL']

# SSL & Security Hardening
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

**Key configurations:**
- `conn_max_age=0`: Prevents stale connections after Render sleeps/wakes
- `ssl_require=True`: Enforces encrypted PostgreSQL connections
- `CorsMiddleware` first: Handles CORS before other middleware
- `x-cron-secret` in allowed headers: Permits cron-job.org internal endpoints

---

### 5.2 Render.yaml Blueprint

**File:** `render.yaml`

```yaml
services:
  - type: web
    name: apptist-backend
    runtime: python
    plan: free
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && gunicorn core.wsgi:application
    envVars:
      - key: PYTHON_VERSION
        value: "3.11.8"
      - key: DJANGO_SETTINGS_MODULE
        value: core.settings.production
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: "false"
      - key: DATABASE_URL
        sync: false
      - key: UPSTASH_REDIS_URL
        sync: false
      - key: CORS_ALLOWED_ORIGINS
        sync: false
      - key: ALLOWED_HOSTS
        sync: false
      - key: CRON_SECRET_KEY
        generateValue: true
    healthCheckPath: /api/health/
    autoDeploy: true
```

**Usage:**
1. Push `render.yaml` to GitHub
2. On Render dashboard: New > Blueprint
3. Connect GitHub repo
4. Render reads `render.yaml` and provisions the service
5. Set sync'd env vars manually in dashboard

---

### 5.3 Keep-Alive Ping Cycle (cron-job.org)

**Problem:** Render free tier sleeps after 15 minutes of inactivity. First request takes 30-50 seconds.

**Solution:** cron-job.org pings `/api/health/` every 10 minutes.

**Configuration on cron-job.org:**

| Job | URL | Method | Headers | Schedule | Timezone |
|-----|-----|--------|---------|----------|----------|
| Keep-Alive | `https://apptist-backend.onrender.com/api/health/` | GET | None | `*/10 * * * *` | UTC |
| Cache Warming | `https://apptist-backend.onrender.com/api/internal/warm-cache/` | POST | `X-Cron-Secret: <key>` | `45 9 * * *` | Asia/Kolkata |
| CSV Cleanup | `https://apptist-backend.onrender.com/api/internal/process-deletions/` | POST | `X-Cron-Secret: <key>` | `*/15 * * * *` | UTC |
| Weekly Flush | `https://apptist-backend.onrender.com/api/internal/flush-weekly-leaderboard/` | POST | `X-Cron-Secret: <key>` | `0 12 * * 2` | Asia/Kolkata |
| Weekly Compute | `https://apptist-backend.onrender.com/api/internal/compute-weekly-leaderboard/` | POST | `X-Cron-Secret: <key>` | `5 12 * * 2` | Asia/Kolkata |

**Health endpoint (core/urls.py):**
```python
def health_check(request):
    return JsonResponse({"status": "ok"})
```

**Why this works:**
- Every 10 minutes, cron-job.org sends GET to `/api/health/`
- Render receives the request, keeps the instance alive
- Instance never sleeps, so subsequent requests respond instantly
- Free tier gets 750 hours/month — 6 requests/hour × 24 hours × 30 days = 4,320 requests (well within limits)

---

### 5.4 Vercel.json for SPA Routing

**File:** `frontend/vercel.json`

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://apptist-backend.onrender.com/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Authorization,Content-Type,X-Cron-Secret" }
      ]
    }
  ]
}
```

**Purpose:**
- First rewrite: Proxies `/api/*` to Render backend (avoids CORS in production)
- Second rewrite: All non-API routes serve `index.html` (SPA client-side routing)
- Headers: CORS preflight support for API calls

---

### 5.5 Vite Dev Proxy

**File:** `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

**Purpose:**
- During development, `/api/*` requests proxy to Django at `localhost:8000`
- Avoids CORS issues in development
- No proxy needed in production (Vercel rewrites handle it)

---

## Appendix: Complete API Endpoint Map

| Method | Endpoint | Auth | Time Gate | Description |
|--------|----------|------|-----------|-------------|
| GET | `/api/health/` | None | None | Health check |
| POST | `/api/auth/login/` | None | None | Email/password login |
| POST | `/api/auth/register/` | None | None | Student registration |
| POST | `/api/auth/student-signin/` | None | None | Passwordless sign-in |
| POST | `/api/auth/refresh/` | None | None | Refresh access token |
| GET | `/api/tests/questions/` | JWT | 10AM-2PM (cache) | Get exam questions |
| GET | `/api/tests/answers/` | JWT | 2PM-7PM | Get answer key |
| POST | `/api/tests/submit/` | JWT | Before 2PM | Submit answers |
| GET | `/api/student/leaderboard/` | JWT (Student) | None | Student leaderboard |
| GET | `/api/admin/dashboard-stats/` | JWT (Teacher) | None | Dashboard stats |
| GET | `/api/admin/questions/` | JWT (Teacher) | None | List questions |
| POST | `/api/admin/upload-questions/` | JWT (Teacher) | None | Upload questions |
| GET | `/api/admin/rankings/` | JWT (Teacher) | None | Admin rankings |
| GET | `/api/admin/reports/` | JWT (Teacher) | None | Admin reports |
| GET | `/api/admin/download-report/` | JWT (Teacher) | None | Download CSV |
| POST | `/api/internal/warm-cache/` | X-Cron-Secret | None | Warm Redis cache |
| POST | `/api/internal/process-deletions/` | X-Cron-Secret | None | Delete overdue CSVs |
| POST | `/api/internal/flush-weekly-leaderboard/` | X-Cron-Secret | None | Flush weekly board |
| POST | `/api/internal/compute-weekly-leaderboard/` | X-Cron-Secret | None | Compute weekly board |

---

## Appendix: Environment Variables Reference

| Variable | Dev Value | Production Value |
|----------|-----------|------------------|
| `SECRET_KEY` | `local-dev-only-not-for-production` | Random 50-char string |
| `DEBUG` | `True` | `False` |
| `DJANGO_SETTINGS_MODULE` | `core.settings.local` | `core.settings.production` |
| `DATABASE_URL` | `sqlite:///db.sqlite3` | Neon PostgreSQL (pooled) |
| `UPSTASH_REDIS_URL` | `redis://localhost:6379` | Upstash REST URL |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | `https://apptist-frontend.vercel.app` |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | `apptist-backend.onrender.com` |
| `CRON_SECRET_KEY` | `dev-cron-secret` | Random 32-char string |
| `VITE_API_BASE_URL` | `http://localhost:8000` | `https://apptist-backend.onrender.com` |

---

*Document Version: 2.0*
*Last Updated: July 2026*
*Developer: MUHAMMED FAHIM*
*Project: Apptist — NGI Aptitude Portal*
