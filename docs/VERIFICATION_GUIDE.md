# Verification Guide

Technical reference for triggering internal cron endpoints, running management commands, and executing the backend test suite locally.

---

## 1. Aggregate Scores — `POST /api/internal/aggregate-scores/`

### What It Does
Grades all `StudentSubmission` records for a given date against the `AnswerKey`, creates `DailyScore` records, and exports a ranked CSV to `media/exports/Master_Report_YYYY-MM-DD.csv`.

### Trigger via HTTP

```bash
# Grade yesterday's submissions (default)
curl -X POST http://127.0.0.1:8000/api/internal/aggregate-scores/ \
  -H "X-Cron-Secret: $CRON_SECRET_KEY"

# Grade a specific date
curl -X POST http://127.0.0.1:8000/api/internal/aggregate-scores/ \
  -H "X-Cron-Secret: $CRON_SECRET_KEY" \
  -d "date=2025-07-15"
```

### Trigger via Management Command

```bash
cd backend
python manage.py aggregate_scores --date=2025-07-15
```

### Expected Behavior

| Scenario | Result |
|---|---|
| No submissions for date | `DailyScore` count = 0, empty CSV with headers only |
| Submissions exist, no `AnswerKey` | Raises `CommandError` (AnswerKey.DoesNotExist) |
| Submissions exist, key present | `DailyScore` records created, CSV written with ranks |
| Re-run on same date | `update_conflicts=True` — scores updated, not duplicated |

### Response (HTTP endpoint)

```json
{
  "status": "aggregated",
  "date": "2025-07-15"
}
```

---

## 2. Monthly Leaderboard — `compute_monthly_leaderboard`

### What It Does
Aggregates all `DailyScore` records for a given calendar month, ranks students by `SUM(score)` descending, and writes `MonthlyLeaderboard` rows. Tied scores share the same rank.

### Trigger via HTTP

```bash
# Compute last month (default)
curl -X POST http://127.0.0.1:8000/api/internal/compute-monthly-leaderboard/ \
  -H "X-Cron-Secret: $CRON_SECRET_KEY"
```

### Trigger via Management Command

```bash
cd backend

# Compute last month (default)
python manage.py compute_monthly_leaderboard

# Compute a specific month
python manage.py compute_monthly_leaderboard --month=2025-07
```

### Under the Hood

1. Resolves target month: defaults to previous calendar month; accepts `--month=YYYY-MM`
2. Queries `DailyScore.objects.filter(exam_date__gte=month_start, exam_date__lte=month_end)`
3. Groups by `student`, annotates with `Sum('score')`
4. Deletes existing `MonthlyLeaderboard` rows for that `month_start` (idempotent)
5. Assigns ranks: students with equal `total_score` share the same rank number
6. Bulk-creates new `MonthlyLeaderboard` rows

### Cron Schedule (recommended)

```
# Run on the 1st of each month at 06:00 IST
0 6 1 * * curl -X POST https://your-domain.com/api/internal/compute-monthly-leaderboard/ \
  -H "X-Cron-Secret: $CRON_SECRET_KEY"
```

### Flush Before Recompute (if needed)

```bash
curl -X POST http://127.0.0.1:8000/api/internal/flush-monthly-leaderboard/ \
  -H "X-Cron-Secret: $CRON_SECRET_KEY"

python manage.py flush_monthly_leaderboard
```

---

## 3. Cleanup Day — `POST /api/internal/cleanup-day/`

### What It Does
After the review window closes (7:00 PM IST), deletes `StudentSubmission` and `DailyLeaderboard` records for the target date. **Preserves `DailyScore`** records for historical analytics.

### Trigger

```bash
curl -X POST http://127.0.0.1:8000/api/internal/cleanup-day/ \
  -H "X-Cron-Secret: $CRON_SECRET_KEY" \
  -d "date=2025-07-15"

# Or via management command:
python manage.py cleanup_day --date=2025-07-15
```

---

## 4. Full Cron Schedule

| Time (IST) | Endpoint | Command |
|---|---|---|
| 09:45 | `POST /api/internal/warm-cache/` | `python manage.py warm_question_cache --date=YYYY-MM-DD` |
| 20:30 | `POST /api/internal/cleanup-day/` | `python manage.py cleanup_day` |
| 21:00 | `POST /api/internal/aggregate-scores/` | `python manage.py aggregate_scores --date=YYYY-MM-DD` |
| 21:15 | `POST /api/internal/compute-weekly-leaderboard/` | `python manage.py compute_weekly_leaderboard` |
| 21:15 | `POST /api/internal/compute-monthly-leaderboard/` | `python manage.py compute_monthly_leaderboard` (1st of month) |
| Every 30m | `POST /api/internal/process-deletions/` | `python manage.py process_deletions` |

---

## 5. Running Backend Tests Locally

```bash
cd backend

# Set Django settings module (required for PowerShell)
$env:DJANGO_SETTINGS_MODULE="core.settings.local"

# Run ALL 90 tests
python -m django test accounts exams pipeline --verbosity=2

# Run only new integration tests
python -m django test pipeline.tests.test_cleanup_day --verbosity=2
python -m django test pipeline.tests.test_monthly_leaderboard --verbosity=2
python -m django test pipeline.tests.test_department_and_migration --verbosity=2
python -m django test exams.tests_submit --verbosity=2

# Run existing tests (unchanged)
python -m django test accounts --verbosity=2
python -m django test pipeline.tests.test_aggregation --verbosity=2
python -m django test pipeline.tests.test_leaderboard --verbosity=2
```

### Test Inventory (90 tests)

| Test File | Tests | What It Covers |
|---|---|---|
| `accounts/tests.py` | 21 | Login, auth, answer key time-gate, security audit |
| `exams/tests.py` | 6 | Student review window gating |
| `exams/tests_submit.py` | 17 | `SubmitAnswersView` payload spec, edge cases, auth |
| `pipeline/tests/test_aggregation.py` | 5 | Score aggregation engine |
| `pipeline/tests/test_cleanup_day.py` | 9 | `cleanup_day` preserves DailyScore, deletes submissions |
| `pipeline/tests/test_deletion.py` | 4 | Scheduled CSV file deletion |
| `pipeline/tests/test_department_and_migration.py` | 9 | `CustomUser.department` field, `MonthlyLeaderboard` schema |
| `pipeline/tests/test_integration.py` | 1 | Full CSV lifecycle |
| `pipeline/tests/test_leaderboard.py` | 5 | Weekly leaderboard compute/flush |
| `pipeline/tests/test_monthly_leaderboard.py` | 8 | Monthly leaderboard compute/flush |
| `pipeline/tests/test_signals.py` | 5 | Stale CSV purge on question upload |

---

## 6. Frontend E2E Verification Plan

Since no Cypress/Playwright framework is installed yet, here is a **manual verification checklist** covering the critical student flows. This serves as the specification for the planned Vitest + React Testing Library setup.

### 6.1 LeaderboardPage — Live Data Verification

**Prerequisite:** At least one `DailyScore` record must exist in the database.

```
1. Start backend: cd backend && python manage.py runserver
2. Start frontend: cd frontend && npm run dev
3. Log in as a student via /login
4. Navigate to /student/leaderboard

Expected:
  - "Loading..." text appears briefly
  - After API response, the podium section renders with top 3 names
  - The list below shows all ranked students with name, roll_number, score
  - The summary bar at bottom shows "Examinees" count and "Top Ranked" count
  - No console errors (check DevTools > Console)

API Call: GET /api/student/leaderboard/?top=25
Response shape: { rankings: [{rank, name, roll_number, score}], total_examinees, latest_date }
```

### 6.2 Login Flow — No Redundant API Calls

```
1. Open /login in incognito
2. Open DevTools > Network tab
3. Fill in all fields, click "Sign In"

Expected:
  - Exactly ONE POST request to /api/auth/student-signin/
  - NO request to /api/auth/login/ (the old redundant call)
  - NO request to /api/auth/register/
  - On success: redirect to /student/dashboard
  - On error (empty fields): modal appears listing missing fields
  - No console errors
```

### 6.3 Registration Page — No Redundant API Calls

```
1. Navigate to /register
2. Open DevTools > Network tab
3. Fill in all fields, click "Create Account"

Expected:
  - Exactly ONE POST request to /api/auth/register/
  - NO request to /api/auth/login/
  - On success: redirect to /student/dashboard
  - No console errors
```

### 6.4 Icon System — No Console Errors

```
1. Navigate through all student pages:
   /login → /student/dashboard → /student/exam → /student/result
   → /student/leaderboard → /student/review
2. Check DevTools > Console on each page

Expected:
  - Zero console errors about missing icon classes
  - All material-symbols-outlined icons render correctly
  - No references to ri-* (Remix Icon) classes anywhere
```

### 6.5 Playwright Script Template (for future Vitest/Playwright setup)

```typescript
// tests/e2e/student-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Student Login Flow', () => {
  test('login sends exactly one POST to student-signin', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/')) {
        requests.push(req.url());
      }
    });

    await page.goto('/login');
    await page.fill('input[placeholder="Enter your full name"]', 'Test Student');
    await page.fill('input[placeholder="NGI2026CS045"]', 'NGI2026E2E001');
    await page.selectOption('select >> nth=0', 'B.Com Computer Applications');
    await page.selectOption('select >> nth=1', '2nd Year');
    await page.selectOption('select >> nth=2', 'Semester 3');
    await page.fill('input[placeholder="your@ngi.edu.in"]', 'e2e@test.com');
    await page.fill('input[placeholder="9876543210"]', '9876543210');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/student/dashboard');
    const authRequests = requests.filter((u) => u.includes('/api/auth/'));
    expect(authRequests).toHaveLength(1);
    expect(authRequests[0]).toContain('student-signin');
  });
});

test.describe('LeaderboardPage', () => {
  test('renders live data from API', async ({ page }) => {
    await page.goto('/student/leaderboard');
    await expect(page.locator('text=Loading...')).toBeVisible();
    await page.waitForResponse(
      (res) => res.url().includes('/api/student/leaderboard/') && res.status() === 200
    );
    const hasContent = await page.locator('text=No leaderboard data').isVisible();
    if (!hasContent) {
      await expect(page.locator('[style*="FFD700"]')).toBeVisible(); // gold podium
    }
  });
});
```
