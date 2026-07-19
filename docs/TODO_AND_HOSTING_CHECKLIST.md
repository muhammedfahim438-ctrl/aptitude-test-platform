# TODO & Hosting Checklist — Apptist Portal

> **Generated:** July 2026 | **Purpose:** Complete list of all bugs, TODOs, hosting requirements, and API keys needed before going live.
>
> **Total findings: 53 issues** — 4 critical, 13 high, 21 medium, 15 low

---

## Table of Contents

1. [Hosting & Deployment Checklist](#hosting--deployment-checklist)
2. [API Keys & Environment Variables](#api-keys--environment-variables)
3. [Critical Bugs (must fix now)](#critical-bugs)
4. [High Priority Bugs](#high-priority-bugs)
5. [Medium Priority Issues](#medium-priority-issues)
6. [Low Priority Issues](#low-priority-issues)

---

## Hosting & Deployment Checklist

### Backend (Render)

- [ ] **Create Render account** at https://render.com
- [ ] **Connect GitHub repo** — link `aptitude-test-platform` repo
- [ ] **Create Web Service** for backend
  - Region: `Oregon` (or closest to India)
  - Runtime: `Python 3.14`
  - Build command: `pip install -r requirements.txt && python manage.py migrate`
  - Start command: `gunicorn core.wsgi:application` (from Procfile)
  - Instance type: `Free Tier (512MB)`
- [ ] **Set environment variables on Render** (see API Keys section below)
- [ ] **Verify `render.yaml`** auto-creates the service if using Blueprint
- [ ] **Disable auto-sleep** if possible (free tier sleeps after 15 min of inactivity)
- [ ] **Note the Render backend URL** (e.g., `https://apptist-backend.onrender.com`) — needed for frontend CORS

### Frontend (Vercel)

- [ ] **Create Vercel account** at https://vercel.com
- [ ] **Import GitHub repo** — link `aptitude-test-platform` repo
- [ ] **Set root directory** to `frontend/`
- [ ] **Set build command** to `npm run build`
- [ ] **Set output directory** to `dist`
- [ ] **Set environment variable** `VITE_API_BASE_URL` = your Render backend URL (e.g., `https://apptist-backend.onrender.com`)
- [ ] **Add custom domain** (optional) — e.g., `apptist.ngi.ac.in`
- [ ] **Configure rewrites** if needed for SPA routing

### Database (Neon.tech)

- [ ] **Create Neon account** at https://neon.tech
- [ ] **Create new project** — name it `apptist-prod`
- [ ] **Copy the connection string** (PgBouncer mode, port 6543):
  ```
  postgresql://neondb_owner:xxxx@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
  ```
- [ ] **Save as `DATABASE_URL`** in Render env vars
- [ ] **Run migrations** after first deploy: `python manage.py migrate`

### Cache (Upstash Redis)

- [ ] **Create Upstash account** at https://upstash.com
- [ ] **Create new Redis database** — region closest to India (e.g., `ap-south-1`)
- [ ] **Copy the Redis URL**:
  ```
  rediss://xxxxx@xxxxx.upstash.io:6379
  ```
- [ ] **Save as `UPSTASH_REDIS_URL`** in Render env vars

---

## API Keys & Environment Variables

### Backend (Render — all required)

| Variable | Where to Get | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Generate with: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` | `django-insecure-abc123...` |
| `DEBUG` | Set to `False` for production | `False` |
| `ALLOWED_HOSTS` | Your Render backend domain + comma-separated | `apptist-backend.onrender.com` |
| `DATABASE_URL` | Neon.tech connection string (see above) | `postgresql://user:pass@host:6543/db?sslmode=require` |
| `UPSTASH_REDIS_URL` | Upstash Redis dashboard | `rediss://xxxxx@xxxxx.upstash.io:6379` |
| `CRON_SECRET_KEY` | Generate a random string | `my-super-secret-cron-key-12345` |
| `CORS_ALLOWED_ORIGINS` | Your Vercel frontend domain | `https://apptist.vercel.app` |
| `DJANGO_SETTINGS_MODULE` | Always this value for production | `core.settings.production` |

### Frontend (Vercel — 1 required)

| Variable | Where to Get | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Your Render backend URL (no trailing slash) | `https://apptist-backend.onrender.com` |

### Optional / Future Services

| Service | Purpose | API Key Needed |
|---------|---------|----------------|
| Supabase Storage | Image uploads for questions | `SUPABASE_URL`, `SUPABASE_KEY` |
| SendGrid / Resend | Email notifications | `SENDGRID_API_KEY` |
| Sentry | Error tracking | `SENTRY_DSN` |
| Google Analytics | Usage analytics | `GA_TRACKING_ID` |

---

## Cron Job Setup (cron-job.org or similar)

After deployment, set up these cron jobs to hit your backend endpoints:

| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| `45 9 * * *` (9:45 AM IST daily) | `POST /api/internal/warm-cache/` | Pre-load questions into Redis before exam |
| `0 14 * * 0` (2:00 PM IST Sunday) | `POST /api/internal/process-deletions/` | Delete overdue CSV files |
| `30 19 * * *` (7:30 PM IST daily) | `POST /api/internal/cleanup-day/` | Clean up student data after review window |
| `45 19 * * 0` (7:45 PM IST Sunday) | `POST /api/internal/flush-weekly-leaderboard/` | Clear weekly leaderboard before recompute |
| `0 20 * * 0` (8:00 PM IST Sunday) | `POST /api/internal/compute-weekly-leaderboard/` | Recompute weekly leaderboard |

**All cron requests must include header:** `X-Cron-Secret: <your-CRON_SECRET_KEY>`

---

## Critical Bugs

### Bug #1: `cleanup_day` destroys historical score data
- **File:** `backend/pipeline/management/commands/cleanup_day.py:36`
- **Problem:** Deletes `DailyScore` records along with submissions and leaderboard entries. DailyScore is the source of truth for historical analytics, average scores, and student dashboard stats.
- **Fix:** Remove the `DailyScore.objects.filter(...).delete()` line. Only delete `StudentSubmission` and `DailyLeaderboard`.
- **Impact:** DATA LOSS — permanent student performance records destroyed daily

### Bug #2: Frontend uses browser-local timezone instead of IST
- **File:** `frontend/src/pages/student/ExamPage.jsx:11-16`
- **Problem:** `getExamEndTime()` creates `Date` objects from strings like `2026-07-19T14:00:00` with no timezone offset. JavaScript treats this as local browser time, not IST.
- **Fix:** Append `+05:30` to all time strings, e.g., `new Date('2026-07-19T14:00:00+05:30')`
- **Impact:** Wrong countdown, wrong window detection for users outside IST

### Bug #3: `DashboardStatsView` uses server timezone instead of IST
- **File:** `backend/pipeline/views.py:127`
- **Problem:** `date.today()` returns server system timezone date, not `Asia/Kolkata`. Should use `timezone.localdate()`.
- **Fix:** Replace `today = date.today()` with `today = timezone.localdate()`
- **Impact:** Dashboard shows wrong stats for ~5.5 hours daily (UTC vs IST gap)

### Bug #4: `wsgi.py` defaults to local settings in production
- **File:** `backend/core/wsgi.py:16`
- **Problem:** `os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.local')` means if env var is missing, production runs with SQLite and `DEBUG=True`.
- **Fix:** The `render.yaml` sets this, but document the requirement clearly. Consider changing default to `production`.
- **Impact:** Silent misconfiguration on non-Render deployments

---

## High Priority Bugs

### Bug #5: AdminDashboard stats always show 0
- **Files:** `backend/pipeline/views.py:141-146`, `frontend/src/pages/admin/AdminDashboard.jsx:66-67`
- **Problem:** Backend returns `tests_completed` and `questions_live`. Frontend reads `tests_completed_today` and `questions_live_today`. Neither matches.
- **Fix:** Either rename backend fields or add aliases. Recommend adding `tests_completed_today` and `questions_live_today` to the response.

### Bug #6: PlatformAnalytics shows mock data for hourly chart
- **Files:** `frontend/src/pages/admin/PlatformAnalytics.jsx:142-143,148-153`
- **Problem:** Reads `stats?.hourly_distribution` and `stats?.avg_score` from API. Backend doesn't return either field. Chart shows hardcoded fake data, Avg Score shows `--`.
- **Fix:** Add `hourly_distribution` and `avg_score` to `DashboardStatsView` response, or remove the fake chart.

### Bug #7: TeacherReports data model mismatch
- **Files:** `frontend/src/pages/admin/TeacherReports.jsx:95-96`, `backend/pipeline/views.py:219-282`
- **Problem:** Frontend reads `reportData?.students` and `reportData?.attendance`. Backend returns `student_performance` and `total_attended`/`total_absent`.
- **Fix:** Align field names. Also, `reportData?.exam_date` doesn't exist — backend returns `from`/`to`.

### Bug #8: TeacherUpload sends wrong field name
- **Files:** `frontend/src/pages/admin/TeacherUpload.jsx:136`, `backend/exams/views.py:177`
- **Problem:** Frontend sends `formData.append('exam_date', examDate)`. Backend reads `request.data.get('date')`. Upload always fails with "date is required".
- **Fix:** Change frontend to `formData.append('date', examDate)`.

### Bug #9: TeacherUpload sends questions as form-encoded, backend expects JSON string
- **Files:** `frontend/src/pages/admin/TeacherUpload.jsx:139-153`, `backend/exams/views.py:178,200-201`
- **Problem:** Frontend sends `questions` as multipart form fields. Backend calls `json.loads(questions_raw)` on a string.
- **Fix:** Serialize questions as `JSON.stringify(questions)` before appending to FormData.

### Bug #10: File handle leak in admin download
- **File:** `backend/pipeline/views.py:48`
- **Problem:** `open(filepath, 'rb')` is never closed. Leaks file descriptors under load.
- **Fix:** Use context manager or `FileResponse` with streaming generator.

### Bug #11: `admin_download_report` returns plain text 404, not JSON
- **File:** `backend/pipeline/views.py:33`
- **Problem:** Returns `HttpResponse("Report not yet generated.", status=404)` — inconsistent with all other JSON responses.
- **Fix:** Return `JsonResponse({'detail': 'Report not yet generated.'}, status=404)`.

### Bug #12: `StudentLeaderboardView` crashes on invalid `top` param
- **File:** `backend/pipeline/views.py:289`
- **Problem:** `int(request.query_params.get('top', 25))` has no `try/except` for `ValueError`. Passing `?top=abc` causes 500 error.
- **Fix:** Add `try/except ValueError` like `AdminRankingsView` does.

### Bug #13: RankPage shows "Unknown" for all names
- **Files:** `frontend/src/pages/admin/RankPage.jsx:75,162`, `backend/pipeline/views.py:174-176`
- **Problem:** Frontend reads `entry.student_name || entry.full_name || entry.student?.full_name`. Backend returns `name`.
- **Fix:** Add `name` to the frontend fallback chain, or rename backend field to `full_name`.

### Bug #14: `VITE_API_BASE_URL` not documented
- **File:** `frontend/src/api/client.js:3`
- **Problem:** Frontend falls back to `http://localhost:8000` if env var not set. CLAUDE.md and README don't mention it.
- **Fix:** Add to .env documentation and deployment docs.

### Bug #15: Production MIDDLEWARE missing whitenoise
- **File:** `backend/core/settings/production.py:35-44`
- **Problem:** Production MIDDLEWARE list replaces `base.py` MIDDLEWARE entirely. Does not include `whitenoise.middleware.WhiteNoiseMiddleware`. Static files won't be served.
- **Fix:** Add `'whitenoise.middleware.WhiteNoiseMiddleware'` after `SecurityMiddleware` in production MIDDLEWARE.

### Bug #16: ExamPage/StudentResult/AnswerReview use UTC date
- **Files:** `frontend/src/pages/student/ExamPage.jsx:22`, `StudentResult.jsx:72`, `AnswerReview.jsx:155`
- **Problem:** `new Date().toISOString().slice(0, 10)` returns UTC date, not IST. Between midnight IST and 5:30 AM IST, shows yesterday's date.
- **Fix:** Use IST-aware date calculation: `new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })`

### Bug #17: TeacherReports "Quick Filters" don't work
- **Files:** `frontend/src/pages/admin/TeacherReports.jsx:31-36`, `backend/pipeline/views.py:224-242`
- **Problem:** Frontend sends presets like `range=this_week` or `range=last_week`. Backend only recognizes `weekly` and `monthly`.
- **Fix:** Add `this_week` and `last_week` as aliases in the backend, or change frontend presets.

---

## Medium Priority Issues

### Issue #18: Unused `orange` variable in ExamPage
- **File:** `frontend/src/pages/student/ExamPage.jsx:9`
- **Problem:** `const orange = '#E8621A'` declared but never used.
- **Fix:** Remove the line.

### Issue #19: Register.jsx sends `department`, `year`, `semester`, `mobile` but backend ignores them
- **Files:** `frontend/src/pages/student/Register.jsx:80-87`, `backend/accounts/views.py:97-102`
- **Problem:** Frontend sends these fields but backend doesn't store them in CustomUser model.
- **Fix:** Either add fields to CustomUser model or remove from frontend.

### Issue #20: StudentSigninView reads `year` and `semester` but doesn't store them
- **File:** `backend/accounts/views.py:184-185,239-240`
- **Problem:** Fields are read and returned but never saved.
- **Fix:** Same as Issue #19.

### Issue #21: `Question.image_url` URLField vs `image` FileField confusion
- **File:** `backend/exams/models.py:13-14`
- **Problem:** Model has both `image_url` (URLField) and `image` (FileField). FileField returns relative path, not absolute URL.
- **Fix:** Standardize on one field, or ensure absolute URLs are generated.

### Issue #22: `PlatformAnalytics` hourly chart shows hardcoded mock data
- **File:** `frontend/src/pages/admin/PlatformAnalytics.jsx:148-153`
- **Problem:** Shows `{ label: '10a', value: 12 }` etc. when no API data.
- **Fix:** Either implement the API endpoint or remove the fake chart.

### Issue #23: Silent error swallowing in all admin frontend pages
- **Files:** Multiple admin pages — catch blocks are `// silent`
- **Problem:** Failed API calls leave admin with blank screen, no error message.
- **Fix:** Add error state and display error messages to users.

### Issue #24: ExamPage time windows use `>=` vs `>` inconsistently
- **File:** `backend/exams/views.py:72,136`
- **Problem:** At exactly 2:00 PM, both questions and submissions are available simultaneously.
- **Fix:** Use `< time(14, 0)` for submission cutoff, not `<=`.

### Issue #25: `StudentDashboard` and `ExamPage` use UTC date for exam date
- **Files:** `frontend/src/pages/student/ExamPage.jsx:22`, `StudentResult.jsx:72`, `AnswerReview.jsx:155`
- **Problem:** Same as Bug #16 — UTC date instead of IST.
- **Fix:** Same as Bug #16.

### Issue #26: `csrf_exempt` on all internal cron endpoints without rate limiting
- **Files:** `backend/exams/views.py:101`, `pipeline/views.py:56,82,94,106`
- **Problem:** Protected only by header comparison. Weak key = anyone can trigger data deletion.
- **Fix:** Ensure strong `CRON_SECRET_KEY`, add rate limiting if possible.

### Issue #27: `warm_cache_internal` leaks exception details
- **File:** `backend/exams/views.py:116`
- **Problem:** Returns `str(e)` which could expose DB paths or query details.
- **Fix:** Return generic error message, log the exception server-side.

### Issue #28: No rate limiting on auth endpoints
- **File:** `backend/accounts/views.py:28-91`
- **Problem:** Unlimited password attempts possible.
- **Fix:** Add `django-ratelimit` or similar, or use Render's built-in rate limiting.

### Issue #29: `Aggregate_scores` doesn't handle missing AnswerKey
- **File:** `backend/pipeline/aggregation.py:14`
- **Problem:** `AnswerKey.objects.get(date=exam_date)` throws `DoesNotExist` if no key exists.
- **Fix:** Handle explicitly with clear error message.

### Issue #30: `is_student` and `is_teacher` not mutually exclusive
- **File:** `backend/accounts/models.py:12-13`
- **Problem:** User could be both student and teacher, passing both permission checks.
- **Fix:** Add validation in `save()` or use a constraint.

### Issue #31: ExamPage window state doesn't update without re-render
- **File:** `frontend/src/pages/student/ExamPage.jsx:46-51`
- **Problem:** `isBeforeWindow`, `isAfterWindow` are computed from `new Date()` at render time. Never re-evaluate.
- **Fix:** Use `useState` + `setInterval` to update time-based state.

### Issue #32: Locustfile hardcoded password
- **File:** `backend/tests/locustfile.py:21`
- **Problem:** Uses `"password": "testpass123"`. If test data doesn't match, all 2000 users fail.
- **Fix:** Ensure `seed_test_data.py` creates users with this password, or make configurable.

### Issue #33: ExamPage `userId` fallback to 'anonymous'
- **File:** `frontend/src/pages/student/ExamPage.jsx:43`
- **Problem:** JWT payload may not include `user_id` or `sub`. Falls back to `'anonymous'` — shared across all anonymous users.
- **Fix:** Ensure `user.email` is used as fallback key.

### Issue #34: `SECRET_KEY` hardcoded in `local.py`
- **File:** `backend/core/settings/local.py:7`
- **Problem:** Ignores env var from `base.py`. Local dev can't use custom secret key.
- **Fix:** Use `os.environ.get('SECRET_KEY', 'local-dev-only')`.

### Issue #35: QuestionCard iterates array with Object.entries
- **File:** `frontend/src/components/QuestionCard.jsx:40`
- **Problem:** `Object.entries(options)` on an array returns `[index, value]` pairs.
- **Fix:** Use `.map()` directly.

---

## Low Priority Issues

### Issue #36: `accounts/serializers.py` is dead code
- **File:** `backend/accounts/serializers.py`
- **Problem:** Contains only a comment. Never imported.
- **Fix:** Delete the file.

### Issue #37: `pipeline/urls.py` is empty
- **File:** `backend/pipeline/urls.py`
- **Problem:** Completely empty. All routes in `core/urls.py`.
- **Fix:** Delete the file.

### Issue #38: `StudentSubmissionSerializer` never used
- **File:** `backend/exams/serializers.py:33-36`
- **Problem:** Defined but never imported or used.
- **Fix:** Remove the class.

### Issue #39: `QuestionSerializer` never used
- **File:** `backend/exams/serializers.py:5-8`
- **Problem:** Defined but never imported. Only `AdminQuestionSerializer` is used.
- **Fix:** Remove the class.

### Issue #40: Duplicate font loading
- **Files:** `frontend/index.html:8-12`, `frontend/src/index.css:1-2`
- **Problem:** Google Fonts loaded via `<link>` AND `@import url()`.
- **Fix:** Remove one of the duplicate loads.

### Issue #41: Remix Icons loaded for all pages but only admin uses them
- **File:** `frontend/index.html:12`
- **Problem:** Wasted download for student users.
- **Fix:** Only load on admin pages, or use dynamic import.

### Issue #42: `BottomNav` doesn't respect maxWidth on wide screens
- **File:** `frontend/src/components/BottomNav.jsx:42`
- **Problem:** Uses `width: '100%'` without `maxWidth: 480`.
- **Fix:** Add `maxWidth: 480, margin: '0 auto'` like `StudentBottomNav`.

### Issue #43: `exams/admin.py` doesn't register AnswerKey or StudentSubmission
- **File:** `backend/exams/admin.py`
- **Problem:** Only Question is registered. Harder to debug via Django admin.
- **Fix:** Add `admin.site.register(AnswerKey)` and `admin.site.register(StudentSubmission)`.

### Issue #44: `pipeline/admin.py` doesn't register pipeline models
- **File:** `backend/pipeline/admin.py`
- **Problem:** None of the pipeline models visible in Django admin.
- **Fix:** Register all pipeline models.

### Issue #45: RankPage uses `entry.rank` as React key but entries may have duplicate ranks
- **File:** `frontend/src/pages/admin/RankPage.jsx:170`
- **Problem:** Tied ranks = duplicate keys.
- **Fix:** Use `${entry.rank}-${idx}` as key.

### Issue #46: StudentResult fetches questions during exam window (503)
- **File:** `frontend/src/pages/student/StudentResult.jsx:91-93`
- **Problem:** After submission before 2PM, tries to fetch questions. Gets 503.
- **Fix:** Known limitation — already handled with `.catch()`.

### Issue #47: No StrictMode double-render protection for answer persistence
- **File:** `frontend/src/hooks/usePersistedAnswers.js`
- **Problem:** Could cause issues with `useExamCountdown` interval.
- **Fix:** Low priority — test with StrictMode.

### Issue #48: TeacherUpload doesn't validate 10-question count on frontend
- **File:** `frontend/src/pages/admin/TeacherUpload.jsx:117-131`
- **Problem:** Backend enforces 10 questions, but frontend gives no early warning.
- **Fix:** Add client-side validation for exactly 10 questions.

### Issue #49: `StudentSigninView` overwrites user data without confirmation
- **File:** `backend/accounts/views.py:198-209`
- **Problem:** If same roll_number/email exists, `full_name`, `email`, `roll_number` silently overwritten.
- **Fix:** Add confirmation or prevent overwriting existing data.

### Issue #50: Duplicate font loading (already listed as #40)
- **See Issue #40**

### Issue #51: No `StrictMode` protection (already listed as #47)
- **See Issue #47**

### Issue #52: Missing `/` root route redirect
- **File:** `frontend/src/router/AppRouter.jsx:96`
- **Problem:** No explicit `/` route. Users hitting root get redirected to `/login` via catch-all.
- **Fix:** Add `<Route path="/" element={<Navigate to="/login" replace />} />`.

### Issue #53: `corsheaders.middleware.CorsMiddleware` position
- **File:** `backend/core/settings/production.py:35-44`
- **Problem:** In local settings, CorsMiddleware is at position 3 (after SecurityMiddleware and WhiteNoiseMiddleware).
- **Fix:** Move to position 1 in base.py MIDDLEWARE.

---

## Priority Fix Order (Suggested)

### Phase 1: Hosting Setup (Day 1)
1. Create accounts on Render, Vercel, Neon.tech, Upstash
2. Set up all environment variables
3. Fix Bug #15 (production MIDDLEWARE missing whitenoise)
4. Deploy and verify basic health check

### Phase 2: Critical Data Bugs (Day 1-2)
1. Fix Bug #1 (cleanup_day destroys DailyScore)
2. Fix Bug #3 (DashboardStatsView timezone)
3. Fix Bug #5 (AdminDashboard stats mismatch)
4. Fix Bug #8 + #9 (TeacherUpload field name + format)
5. Fix Bug #7 + #17 (TeacherReports data model + presets)

### Phase 3: Frontend Bugs (Day 2-3)
1. Fix Bug #2 (ExamPage timezone)
2. Fix Bug #16 (UTC date calculation)
3. Fix Bug #13 (RankPage name mapping)
4. Fix Bug #14 (VITE_API_BASE_URL documentation)
5. Fix Issue #33 (userId fallback)

### Phase 4: Polish (Day 3-4)
1. Fix Bug #10 (file handle leak)
2. Fix Bug #11 (plain text 404)
3. Fix Bug #12 (StudentLeaderboardView crash)
4. Fix Issue #23 (silent error swallowing)
5. Fix Issue #24 (time window boundary conditions)

### Phase 5: Security Hardening (Day 4-5)
1. Fix Issue #26 (cron endpoint rate limiting)
2. Fix Issue #27 (exception detail leakage)
3. Fix Issue #28 (auth rate limiting)
4. Fix Issue #30 (student/teacher mutual exclusion)

### Phase 6: Cleanup (Day 5+)
1. Fix Issues #36-39 (dead code)
2. Fix Issues #40-41 (duplicate fonts, unnecessary icon loading)
3. Fix Issues #43-44 (admin registrations)
4. Fix Issue #48 (frontend validation)

---

*Generated by automated codebase audit | 53 findings total*
*Last updated: July 2026*
