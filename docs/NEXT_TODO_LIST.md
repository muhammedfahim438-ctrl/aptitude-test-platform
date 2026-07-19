# Next To-Do List

Prioritized roadmap for remaining infrastructure, quality, and performance gaps.

---

## Priority 1: Critical Infrastructure — Frontend Testing (0% Coverage)

The backend has **90 tests** across 10 files. The frontend has **zero**.

### 1.1 Install Testing Framework

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Update `vite.config.js`:

```js
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
})
```

Create `src/test/setup.js`:

```js
import '@testing-library/jest-dom'
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 1.2 Priority Test Files

| File | Priority | Tests | Rationale |
|---|---|---|---|
| `src/router/ProtectedRoute.jsx` | P0 | 4 | Guards all authenticated routes — if broken, entire app is exposed |
| `src/pages/Login.jsx` | P0 | 5 | Auth flow, validation modal, student-signin call |
| `src/api/client.js` | P0 | 3 | JWT interceptors, token refresh, logout redirect |
| `src/hooks/usePersistedAnswers.js` | P1 | 3 | Base64 encoding, localStorage round-trip |
| `src/hooks/useExamCountdown.js` | P1 | 3 | Timer logic, auto-submit at zero |
| `src/pages/student/ExamPage.jsx` | P1 | 4 | Question navigation, answer persistence, submission |
| `src/pages/student/LeaderboardPage.jsx` | P1 | 3 | API call, loading/error/empty states |
| `src/components/QuestionCard.jsx` | P2 | 2 | Renders all 4 options, handles selection |
| `src/components/CountdownTimer.jsx` | P2 | 2 | Displays HH:MM:SS correctly |
| `src/components/StudentBottomNav.jsx` | P2 | 2 | Active route highlighting |

### 1.3 Target: 25+ frontend tests, 35% critical path coverage

---

## Priority 2: CI/CD Pipeline — GitHub Actions

### 2.1 Recommended Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DJANGO_SETTINGS_MODULE: core.settings.production
      SECRET_KEY: test-secret-key
      DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
      CRON_SECRET_KEY: test-cron-secret
      REDIS_URL: redis://localhost:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.14'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt -r requirements-dev.txt

      - name: Run migrations
        run: cd backend && python manage.py migrate

      - name: Run tests
        run: cd backend && python manage.py test accounts exams pipeline --verbosity=2

  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Lint (if configured)
        run: cd frontend && npm run lint --if-present

      - name: Type check
        run: cd frontend && npx tsc --noEmit --if-present

      - name: Run tests
        run: cd frontend && npm test

      - name: Build
        run: cd frontend && npm run build
```

### 2.2 CI Gates

| Gate | Trigger | Blocking |
|---|---|---|
| Backend tests (90+) | Every push/PR | Yes |
| Frontend build | Every push/PR | Yes |
| Frontend tests | Every push/PR | Yes (once configured) |
| Python lint (ruff) | Every PR | Advisory initially, blocking later |

### 2.3 Future Enhancements

- Add `ruff check` for Python linting (fast, replaces flake8+isort)
- Add `npm run lint` for frontend ESLint
- Add Codecov or similar for test coverage reporting
- Cache pip/npm dependencies between runs
- Add deployment preview environments

---

## Priority 3: Analytics & Scale — Database Performance

### 3.1 Current Pain Points

The `DailyScore` table grows unbounded. Every student × exam_date = one row. At 2000 students × 100 days/year = 200K rows/year. Queries in `StudentDashboardView` and `StudentLeaderboardView` use `ORDER BY -exam_date` without covering indexes on common access patterns.

### 3.2 Recommended Optimizations

#### A. Composite Indexes

```python
# pipeline/models.py — add to DailyScore.Meta.indexes
indexes = [
    models.Index(fields=['exam_date', '-score'], name='idx_ds_date_score'),
    models.Index(fields=['student', '-exam_date'], name='idx_ds_student_date'),
]
```

```python
# pipeline/models.py — add to DailyLeaderboard.Meta.indexes
indexes = [
    models.Index(fields=['exam_date', 'rank'], name='idx_dl_date_rank'),
]
```

#### B. Select_related Optimization

The `StudentLeaderboardView` already uses `select_related('student')` — good. But `StudentDashboardView` makes separate queries for `AnswerKey` inside a loop (line 410-412 in `pipeline/views.py`):

```python
# Current: N+1 query pattern
for score in recent_ds:
    ak = AnswerKey.objects.filter(date=score.exam_date).first()

# Fix: batch load answer keys
answer_keys = {
    ak.date: ak for ak in
    AnswerKey.objects.filter(date__in=[s.exam_date for s in recent_ds])
}
```

#### C. Materialized View (PostgreSQL, production only)

For 10K+ DailyScore rows, consider a materialized view for the student dashboard summary:

```sql
CREATE MATERIALIZED VIEW student_dashboard_summary AS
SELECT
    student_id,
    COUNT(*) as total_exams,
    AVG(score) as average_score,
    MAX(exam_date) as last_exam_date
FROM pipeline_dailyscore
GROUP BY student_id;
```

Refresh on cron after aggregation.

#### D. Connection Pooling (already configured)

- Production uses PgBouncer via `conn_max_age=600`
- No change needed for current scale

### 3.3 Monitoring Queries

```sql
-- Identify slow queries (run in Django shell or pgAdmin)
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

---

## Summary: Next Sprint Backlog

| # | Task | Effort | Priority |
|---|---|---|---|
| 1 | Install Vitest + RTL | 0.5 day | P1 |
| 2 | Write ProtectedRoute + Login tests (9 tests) | 1 day | P1 |
| 3 | Write client.js + hooks tests (9 tests) | 1 day | P1 |
| 4 | Write ExamPage + Leaderboard tests (7 tests) | 1 day | P1 |
| 5 | Create `.github/workflows/ci.yml` | 0.5 day | P2 |
| 6 | Add `ruff` for Python linting | 0.5 day | P2 |
| 7 | Add composite indexes to DailyScore | 0.5 day | P3 |
| 8 | Fix N+1 in StudentDashboardView | 0.5 day | P3 |
| 9 | Add index to MonthlyLeaderboard query path | 0.25 day | P3 |
| 10 | Evaluate `pg_stat_statements` for prod | 0.25 day | P3 |

**Total estimated effort: ~5.5 days**
