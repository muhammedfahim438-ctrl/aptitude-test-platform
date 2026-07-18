# NGI Aptitude Portal - Setup & Run Guide

## Prerequisites

- **Python 3.10+** (tested with 3.14.4)
- **Node.js 18+** with npm
- **Redis** (optional - for question caching in production)

---

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create and activate virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Create environment file
Create a `.env` file in the `backend/` directory:
```env
SECRET_KEY=your-random-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
UPSTASH_REDIS_URL=
CRON_SECRET_KEY=dev-cron-secret-change-me
```

### 5. Run migrations
```bash
python manage.py migrate
```

### 6. Create admin/teacher account
```bash
python manage.py createsuperuser
```
Enter email, full name, and password when prompted. Then make the account a teacher:
```bash
python manage.py shell -c "
from accounts.models import CustomUser
user = CustomUser.objects.get(email='your-email@example.com')
user.is_teacher = True
user.is_staff = True
user.save()
print(f'{user.email} is now a teacher/admin')
"
```

### 7. Start the backend server
```bash
python manage.py runserver
```

Backend runs at: **http://127.0.0.1:8000**

---

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## How to Use

### Student Flow

1. Open **http://localhost:5173/login**
2. Fill in your details (name, reg number, department, year, semester, email, mobile)
3. Click **Sign In** - this auto-creates your account (passwordless)
4. You'll be taken to the **Exam page** at `/student/exam`
5. Answer questions and click **Submit Exam**
6. View your ranking at `/student/leaderboard`

### Admin/Teacher Flow

1. Open **http://localhost:5173/admin/login**
2. Enter the teacher email and password you created with `createsuperuser`
3. You'll be taken to the **Admin Dashboard** at `/admin/dashboard`

**Admin pages:**

| Page | URL | What it does |
|------|-----|-------------|
| Dashboard | `/admin/dashboard` | Overview stats (students, tests, questions) |
| Questions | `/admin/questions` | View/search/delete questions by date |
| Upload | `/admin/questions/upload` | Upload new questions with answer key |
| Analytics | `/admin/stats` | Score distribution charts |
| Rankings | `/admin/rank` | Top students (daily/weekly) |
| Reports | `/admin/reports` | Attendance & performance reports |

### Django Admin

Access the built-in Django admin at: **http://127.0.0.1:8000/admin/**

Login with the superuser credentials you created.

---

## Management Commands

```bash
# Seed test data (10 questions + submissions for all students)
python manage.py seed_test_data --date=2026-07-18

# Grade submissions and export CSV
python manage.py aggregate_scores --date=2026-07-18

# Compute weekly leaderboard
python manage.py compute_weekly_leaderboard

# Flush weekly leaderboard
python manage.py flush_weekly_leaderboard

# Delete expired CSV files
python manage.py process_deletions

# Pre-warm Redis cache for questions
python manage.py warm_question_cache --date=2026-07-18
```

---

## Load Testing

```bash
# Start Locust load test (simulates 2000 concurrent users)
locust -f tests/locustfile.py --host=http://127.0.0.1:8000

# Then open http://localhost:8089 in browser to configure and start the test
```

---

## API Endpoints Reference

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/` | Health check |
| POST | `/api/auth/login/` | Email/password login (JWT) |
| POST | `/api/auth/register/` | Student registration |
| POST | `/api/auth/student-signin/` | Passwordless student sign-in |
| POST | `/api/auth/refresh/` | Refresh access token |

### Authenticated
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tests/questions/?date=YYYY-MM-DD` | Get exam questions |
| GET | `/api/tests/answers/?date=YYYY-MM-DD` | Get answer key (2PM-7PM only) |
| POST | `/api/tests/submit/` | Submit exam answers (before 2PM) |

### Admin (Teacher only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard-stats/` | Dashboard statistics |
| POST | `/api/admin/upload-questions/` | Upload questions + answer key |
| GET | `/api/admin/questions/` | List/search questions |
| GET/DELETE | `/api/admin/questions/<id>/` | View/delete single question |
| GET | `/api/admin/rankings/` | Student rankings |
| GET | `/api/admin/reports/` | Attendance reports |
| GET | `/api/admin/download-report/<date>/` | Download CSV report |

### Internal (Cron - requires X-Cron-Secret header)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/internal/warm-cache/` | Pre-load questions into Redis |
| POST | `/api/internal/process-deletions/` | Delete expired CSVs |
| POST | `/api/internal/flush-weekly-leaderboard/` | Clear weekly leaderboard |
| POST | `/api/internal/compute-weekly-leaderboard/` | Recompute weekly leaderboard |

---

## Project Structure

```
aptitude-test-platform/
├── backend/                    # Django REST API
│   ├── core/                   # Project settings, URLs, permissions
│   ├── accounts/               # User model, authentication
│   ├── exams/                  # Questions, answer keys, submissions
│   ├── pipeline/               # Score aggregation, leaderboards, reports
│   └── tests/                  # Load testing (Locust)
│
├── frontend/                   # React + Vite
│   └── src/
│       ├── api/                # Axios client with JWT interceptors
│       ├── router/             # React Router v6 + protected routes
│       ├── hooks/              # useExamCountdown, usePersistedAnswers
│       ├── components/         # QuestionCard, CountdownTimer, BottomNav
│       └── pages/
│           ├── Login.jsx       # Student passwordless sign-in
│           ├── student/        # ExamPage, LeaderboardPage, Register
│           └── admin/          # Dashboard, Questions, Upload, Stats, Rankings, Reports
│
├── backend_temp/               # (DELETE after merge - member contributions)
└── frontend_temp/              # (DELETE after merge - member contributions)
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | Yes | - | Django secret key |
| `DEBUG` | No | `True` | Enable debug mode |
| `ALLOWED_HOSTS` | No | `localhost` | Comma-separated allowed hosts |
| `DATABASE_URL` | No (prod) | SQLite | PostgreSQL connection URL |
| `UPSTASH_REDIS_URL` | No | - | Redis URL for question caching |
| `CRON_SECRET_KEY` | No | `dev-cron-secret` | Secret for internal cron endpoints |
| `VITE_API_BASE_URL` | No | `http://localhost:8000` | Backend API URL (frontend) |

---

*Last updated: July 2026*
