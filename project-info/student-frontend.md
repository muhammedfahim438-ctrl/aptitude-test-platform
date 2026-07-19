# Student Frontend Reference — Apptist Platform

> **Purpose:** Exhaustive reference for the student-facing frontend. An AI receiving only this file should be able to understand, modify, debug, and extend every student page, component, hook, and API integration.

---

## Table of Contents

1. [Tech Stack & Styling](#1-tech-stack--styling)
2. [Routing](#2-routing)
3. [API Client](#3-api-client)
4. [Hooks](#4-hooks)
5. [Components](#5-components)
6. [Pages](#6-pages)
7. [Design System](#7-design-system)
8. [Test Files](#8-test-files)

---

## 1. Tech Stack & Styling

- **React 18** with Vite 5
- **React Router DOM v6** (`BrowserRouter`)
- **Axios** for HTTP
- **Tailwind CSS** utility classes for student pages
- **Fonts:** Space Grotesk (headings), Inter (body), JetBrains Mono (labels)
- **Icons:** Google Material Symbols (`material-symbols-outlined` class)
- **Design tokens** defined in `index.css`: `--primary`, `--primary-container`, `--tertiary`, `--error`, etc.

---

## 2. Routing

All student routes are defined in `frontend/src/router/AppRouter.jsx` and wrapped with `<ProtectedRoute requiredRole="is_student">`.

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `Login` | Student passwordless sign-in (public) |
| `/register` | `Register` | Student registration with password (public) |
| `/student/dashboard` | `StudentDashboard` | 5-state exam card + stats + recent scores |
| `/student/exam` | `ExamPage` | Real API exam interface with countdown + auto-submit |
| `/student/assessment-details` | `AssessmentDetails` | Pre-exam instructions + consent checkbox |
| `/student/submission-processing` | `SubmissionProcessing` | Animated progress screen after submit |
| `/student/result` | `StudentResult` | Post-submit confirmation + score display |
| `/student/leaderboard` | `LeaderboardPage` | Leaderboard with podium |
| `/student/review` | `AnswerReview` | Question-by-question answer review |
| `/student/previous-questions` | `PreviousQuestions` | Placeholder for past questions |
| `/student` | Redirect | Redirects to `/student/dashboard` |
| `*` | Redirect | Redirects to `/login` |

**ProtectedRoute logic (`frontend/src/router/ProtectedRoute.jsx`):**
1. Check `localStorage` for `refresh_token`
2. If no refresh token → redirect to `/login`
3. If `access_token` exists and not expired → decode JWT, check `decoded[requiredRole]`
4. If expired → POST `/api/auth/refresh/` with refresh token, update `access_token`
5. If refresh fails → clear tokens, redirect to `/login`
6. Shows "Checking session..." during validation

---

## 3. API Client

All student API calls are in `frontend/src/api/client.js`.

### Auth APIs (`authAPI`)

#### `authAPI.login(email, password)`
- **Endpoint:** `POST /api/auth/login/`
- **Used in:** `Login.jsx` (admin login link only)

#### `authAPI.register(data)`
- **Endpoint:** `POST /api/auth/register/`
- **Body:** `{full_name, roll_number, department, year, semester, email, mobile, password}`
- **Used in:** `Register.jsx`

#### `authAPI.studentSignin(data)`
- **Endpoint:** `POST /api/auth/student-signin/`
- **Body:** `{full_name, roll_number, department, email, mobile, year, semester}`
- **Used in:** `Login.jsx`

#### `authAPI.refresh(refresh)`
- **Endpoint:** `POST /api/auth/refresh/`
- **Body:** `{refresh: "<refresh_token>"}`
- **Used in:** Axios response interceptor (auto-refresh on 401)

### Exam APIs (`examAPI`)

#### `examAPI.getQuestions(date)`
- **Endpoint:** `GET /api/tests/questions/?date={date}`
- **Returns:** `{date, questions: [...], source}`
- **Used in:** `ExamPage.jsx`, `StudentResult.jsx`, `AnswerReview.jsx`

#### `examAPI.submitAnswers(examDate, answers)`
- **Endpoint:** `POST /api/tests/submit/`
- **Body:** `{exam_date, answers}`
- **Returns:** `{message, student, exam_date, answers_submitted, created}`
- **Used in:** `ExamPage.jsx`

#### `examAPI.getAnswerKey(date)`
- **Endpoint:** `GET /api/tests/answers/?date={date}`
- **Returns:** `{date, correct_answers, opens_at, closes_at}`
- **Used in:** Not currently used (review endpoint is used instead)

#### `examAPI.getLeaderboard(top)`
- **Endpoint:** `GET /api/student/leaderboard/?top={top}`
- **Returns:** `{rankings: [...], total_examinees, latest_date}`
- **Used in:** `LeaderboardPage.jsx`

#### `examAPI.getReview(date)`
- **Endpoint:** `GET /api/student/review/?date={date}`
- **Returns:** `{date, submitted_at, answers, correct_answers, score, total_questions, window_status}`
- **Used in:** `StudentResult.jsx`, `AnswerReview.jsx`

### Student APIs (`studentAPI`)

#### `studentAPI.getDashboard()`
- **Endpoint:** `GET /api/student/dashboard/`
- **Returns:** `{today_status, today, recent_scores, total_exams_taken, average_score}`
- **Used in:** `StudentDashboard.jsx`, `StudentResult.jsx`

### Axios Interceptors (`client.js`)

**Request interceptor:**
- Skips auth headers for `/api/auth/login/`, `/api/auth/student-signin/`, `/api/auth/register/`, `/api/auth/refresh/`
- For all other requests: attaches `Authorization: Bearer {access_token}` from localStorage

**Response interceptor:**
- On 401 (non-auth endpoints): attempts token refresh via `authAPI.refresh()`
- If refresh succeeds: updates `access_token`, retries original request
- If refresh fails: clears all tokens, redirects to `/login`

---

## 4. Hooks

### `usePersistedAnswers(userId, examDate)` (`frontend/src/hooks/usePersistedAnswers.js`)

**Purpose:** Persists exam answers in localStorage with Base64 encoding for obfuscation.

**Storage key:** `exam_answers_{userId}_{examDate}`

**Returns:** `{answers, saveAnswer, clearAnswers}`

**Logic:**
- On mount: reads from localStorage, Base64-decodes, parses JSON. If corrupt → returns `{}`
- `saveAnswer(questionId, answer)`: updates state + writes Base64-encoded JSON to localStorage
- `clearAnswers()`: resets state to `{}` + removes localStorage entry

**Encoding:**
```js
const encode = (data) => btoa(JSON.stringify(data))
const decode = (raw) => JSON.parse(atob(raw))
```

### `useExamCountdown(examEndTime, onExpire)` (`frontend/src/hooks/useExamCountdown.js`)

**Purpose:** Countdown timer that calls `onExpire` when time runs out.

**Params:**
- `examEndTime`: Date string/object for when exam ends (e.g., `"2025-07-15T14:00:00"`)
- `onExpire`: Callback function invoked when countdown reaches 0

**Returns:** Formatted time string `"HH:MM:SS"`

**Logic:**
- Calculates `secondsLeft` = difference between `examEndTime` and `now`
- Updates every 1 second via `setInterval`
- When `secondsLeft <= 0`: calls `onExpire()` once (uses `hasExpiredRef` to prevent double-call)
- Cleans up interval on unmount

---

## 5. Components

### `QuestionCard` (`frontend/src/components/QuestionCard.jsx`)

**Props:**
```js
{
  id: Number,           // Question number (1-10)
  text: String,         // Question text
  option_a: String,     // Option A
  option_b: String,     // Option B
  option_c: String,     // Option C
  option_d: String,     // Option D
  image_url: String|null, // Optional image URL
  selected: String|null,  // Currently selected option label ("A", "B", "C", "D")
  onSelect: Function    // Callback: (questionId, optionLabel) => void
}
```

**Rendering:**
- Optional 16:9 image container (hidden when `image_url` is null)
- Question text with `Q{id}.` prefix
- 4 option cards (A-D) with click handler
- Selected option highlighted with indigo border (`#465aa3`) and light background

### `CountdownTimer` (`frontend/src/components/CountdownTimer.jsx`)

**Props:** `{examEndTime, onExpire}`

**Rendering:**
- Red/pink pill badge: `timer` icon + `HH:MM:SS` display
- Font: JetBrains Mono, 14px
- Background: `#FCEAEC`, border: `#E2737A30`

### `StudentBottomNav` (`frontend/src/components/StudentBottomNav.jsx`)

**Tabs:**
| Tab | Label | Icon | Path |
|-----|-------|------|------|
| Home | Home | `home` | `/student/dashboard` |
| Assessments | Assessments | `assignment` | `/student/exam` |

**Active state:** Filled icon + `bg-primary-container text-on-primary-container rounded-full`
**Inactive state:** Outline icon + `text-on-surface-variant`

**Visible on:** Mobile only (`md:hidden`)

---

## 6. Pages

### `Login` (`frontend/src/pages/Login.jsx`)

**Path:** `/login` (public)

**State:** `form` (full_name, roll_number, department, custom_department, year, semester, email, mobile), `loading`, `error`, `missingLabels`

**Features:**
- Passwordless student sign-in (calls `authAPI.studentSignin()`)
- Department dropdown with 7 school groups + "Others" custom option
- Form validation: all fields required, email must contain `@`, mobile must be 10 digits
- Input sanitization: name rejects numbers, mobile rejects letters
- Missing fields modal (animated popup listing missing fields)
- Stores JWT tokens in localStorage on success
- Links to admin login (`/admin/login`)

**Department groups:** School of Commerce (7 options), School of Computational Science (8), School of Life Sciences (6), School of Management (4), School of Creative Sciences (3), School of Investigative Science (6), School of Liberal Arts (2).

### `Register` (`frontend/src/pages/student/Register.jsx`)

**Path:** `/register` (public)

**State:** `form` (full_name, roll_number, department, year, semester, email, mobile, password, confirm_password), `loading`, `error`, `success`

**Features:**
- Calls `authAPI.register()` on submit
- Password validation: min 6 chars, must match confirm
- Shows success screen with animated checkmark, then redirects to dashboard after 1.5s
- Inline styles (not Tailwind) with `C` color palette object

### `StudentDashboard` (`frontend/src/pages/student/StudentDashboard.jsx`)

**Path:** `/student/dashboard` (student only)

**State:** `user` (from JWT), `data` (from API), `loading`, `error`

**API calls:** `studentAPI.getDashboard()` on mount

**5-state exam card:**
| `today_status` | Card shows | Action |
|----------------|-----------|--------|
| `before_window` | "Exam starts at 10:00 AM" | None |
| `in_progress` | "Start Exam" button | Navigate to `/student/assessment-details` |
| `submitted` | "Submitted" with checkmark | Navigate to `/student/result` |
| `reviewed` | Score display | Navigate to `/student/review` |
| `missed` | "Missed" warning | None |

**Stats row:** Total exams taken, average score
**Recent scores:** Last 7 days from `recent_scores`
**StudentBottomNav** at bottom

### `AssessmentDetails` (`frontend/src/pages/student/AssessmentDetails.jsx`)

**Path:** `/student/assessment-details` (student only)

**Features:**
- Pre-exam instruction page
- Shows assessment parameters: 10 questions, 120 minutes, 10 marks, single attempt
- Instructions: stable internet, no refresh, timer can't be paused
- Consent checkbox: "I have read and understand the instructions"
- "START ASSESSMENT" button (enabled only after consent)
- Navigates to `/student/exam` on start

### `ExamPage` (`frontend/src/pages/student/ExamPage.jsx`)

**Path:** `/student/exam` (student only)

**State:** `user`, `questions`, `loading`, `error`, `submitted`, `submitError`, `submitting`, `currentIdx`, `showPalette`

**API calls:** `examAPI.getQuestions(examDate)`, `examAPI.submitAnswers(examDate, answers)`

**Features:**
- Fetches questions for today's date
- Question navigation (current index)
- Answer persistence via `usePersistedAnswers` hook
- Countdown timer via `useExamCountdown` hook (auto-submits on expiry)
- Question palette (mobile toggle)
- Submit with retry logic (3 retries on network errors for auto-submit)
- Before exam window: shows "Exam not started yet" message
- After exam window: read-only mode
- Navigation to `/student/submission-processing` after submit

**Exam timing:**
- Start: `10:00 AM` (`{examDate}T10:00:00`)
- End: `2:00 PM` (`{examDate}T14:00:00`)
- Read-only after `2:00 PM`

### `SubmissionProcessing` (`frontend/src/pages/student/SubmissionProcessing.jsx`)

**Path:** `/student/submission-processing` (student only)

**Features:**
- Receives `answers` and `totalQuestions` via `location.state`
- Animated progress bar (30% → 60% → 85% → 95%)
- Shows unanswered question warning if applicable
- Auto-redirects to `/student/result` after 4 seconds
- Pulsing ring animation around spinner

### `StudentResult` (`frontend/src/pages/student/StudentResult.jsx`)

**Path:** `/student/result` (student only)

**Multi-state rendering:**
| State | Shows |
|-------|-------|
| `loading` | Spinner |
| `submitted` / `before_window` | "Test Submitted!" confirmation + submission overview (name, roll number, status, date, "Result available after 2:00 PM IST") |
| `missed` | "No Exam Today" error state |
| `reviewed` | Full score breakdown: score circle, correct/wrong/skipped counts, question-by-question review with user answer vs correct answer |

**API calls:** `studentAPI.getDashboard()`, `examAPI.getReview(today)`, `examAPI.getQuestions(today)`

### `LeaderboardPage` (`frontend/src/pages/student/LeaderboardPage.jsx`)

**Path:** `/student/leaderboard` (student only)

**API calls:** `examAPI.getLeaderboard(25)`

**Features:**
- Podium visualization for top 3 (gold/silver/bronze bars at heights 100/130/80px)
- Ranked list with avatar initials, name, roll number, score bar, score
- Total examinees and top ranked count
- Loading/error/empty states
- Inline styles with `C` color palette (NOT Tailwind)

**`RankBadge` component:** Rank 1-3 get colored circles (gold/silver/bronze), others get gray.

### `AnswerReview` (`frontend/src/pages/student/AnswerReview.jsx`)

**Path:** `/student/review` (student only)

**API calls:** `examAPI.getReview(today)`, `examAPI.getQuestions(today)`

**Features:**
- Question-by-question review with Previous/Next navigation
- Shows user answer vs correct answer for each question
- Color-coded: green (`tertiary`) for correct, red (`error`) for wrong, gray for skipped
- Header with Apptist branding
- StudentBottomNav at bottom

### `PreviousQuestions` (`frontend/src/pages/student/PreviousQuestions.jsx`)

**Path:** `/student/previous-questions` (student only)

**Features:**
- Empty state placeholder: "Nothing posted yet"
- Decorative background elements
- StudentBottomNav at bottom

---

## 7. Design System

### Student Color Palette

```javascript
const C = {
  primary: '#465aa3',           // Indigo
  primaryDark: '#364a8a',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
  primaryLight: '#8CA0EE',
  secondary: '#8a5108',
  secondaryContainer: '#FFEEDC',
  onSecondaryContainer: '#F2924B',
  tertiary: '#116b51',          // Green
  tertiaryContainer: '#E5FAF1',
  onTertiaryContainer: '#1F8A5F',
  surface: '#FBFBFF',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#f5f3fa',
  outline: '#E6E9F7',
  outlineVariant: '#c5c5d2',
  onSurface: '#34406E',
  onSurfaceVariant: '#6C7596',
  error: '#E2737A',
  errorContainer: '#FCEAEC',
  onErrorContainer: '#93000a',
}
```

### Tailwind Tokens (student pages)

```
bg-background, bg-surface, bg-surface-container, bg-surface-container-low
text-on-surface, text-on-surface-variant, text-primary
bg-primary, bg-primary-container, bg-tertiary-container, bg-error-container
border-outline, border-outline-variant
font-headline-lg, font-headline-md, font-body-md, font-body-sm, font-label-sm
px-margin-mobile, py-sm, py-md, gap-sm, gap-md
```

### Fonts
- **Space Grotesk:** Headlines (`font-headline-*`)
- **Inter:** Body text (`font-body-*`)
- **JetBrains Mono:** Labels (`font-label-*`)

### Icons
- Google Material Symbols only (standardized)
- Filled variant: `style={{ fontVariationSettings: "'FILL' 1" }}`
- Examples: `arrow_back`, `timer`, `sync`, `check_circle`, `error`, `quiz`, `schedule`

---

## 8. Test Files

### Frontend Tests (86 tests total across 10 files)

#### `Login.test.jsx` — 14 tests
- Renders all form fields (name, roll number, department, year, semester, email, mobile)
- Renders sign-in button and Apptist branding
- Missing fields modal on empty submit
- Email validation (`@` required)
- Mobile validation (10 digits)
- Calls `studentSignin` with correct payload
- Stores JWT in localStorage
- Displays API error on failure
- Loading spinner during submission
- Name sanitization (rejects numbers)
- Mobile sanitization (rejects letters)
- Custom department field when "Others" selected
- Link to admin login

#### `StudentDashboard.test.jsx` — 10 tests
- Loading state, student name from JWT
- Exam card for `before_window`, `in_progress`, `reviewed`, `missed` states
- Recent scores section, empty state
- Error on API failure
- Student bottom navigation

#### `ExamPage.test.jsx` — 8 tests
- Loading state, questions render after loading
- 404 and 503 messages
- Back button, exam header, all four options
- Countdown timer display

#### `LeaderboardPage.test.jsx` — 8 tests
- Loading state, podium for top 3
- Ranked list below podium, total examinees
- Error/empty states
- API call with correct params, roll numbers displayed

#### `Register.test.jsx` — 7 tests
- Form fields render, validation errors
- Register API called on valid submit
- No login API call (only register)
- Success screen, error handling, password mismatch

#### `ProtectedRoute.test.jsx` — 5 tests
- Renders children with correct role
- Redirects on no token, wrong role
- Allows access without `requiredRole`
- Refreshes expired access token

#### `client.test.js` — 17 tests
- All `authAPI` methods (login, register, studentSignin, refresh)
- All `examAPI` methods (getQuestions, submitAnswers, getAnswerKey, getLeaderboard, getReview)
- `studentAPI.getDashboard`
- All `adminAPI` methods (getDashboardStats, getRankings, getReports, downloadReport, uploadQuestions, deleteQuestion, updateQuestion)

#### `iconAudit.test.js` — 2 tests
- No `ri-*` classes in any `.jsx` source files
- No Remix CDN link in `index.html`

### Running Tests
```bash
cd frontend
npm test -- --run
```

### Test Setup
- **Framework:** Vitest + React Testing Library + jsdom
- **Config:** `frontend/vite.config.js` with test config
- **Setup file:** `frontend/src/test/setup.js` (imports `@testing-library/jest-dom`)
- **Mocking:** `vi.mock()` for React Router and API client modules
