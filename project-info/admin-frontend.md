# Admin Frontend Reference — Apptist Platform

> **Purpose:** Exhaustive reference for the admin/teacher-facing frontend. An AI receiving only this file should be able to understand, modify, debug, and extend every admin page, component, and API integration.

---

## Table of Contents

1. [Tech Stack & Styling](#1-tech-stack--styling)
2. [Routing](#2-routing)
3. [API Client](#3-api-client)
4. [Components](#4-components)
5. [Pages](#5-pages)
6. [Design System](#6-design-system)
7. [Test Files](#7-test-files)

---

## 1. Tech Stack & Styling

- **React 18** with Vite 5
- **React Router DOM v6** (`BrowserRouter`)
- **Axios** for HTTP
- **Inline styles** for admin pages (NOT Tailwind utility classes)
- **Custom Tailwind tokens** for admin: `admin-primary`, `admin-on-primary`, `admin-surface`, etc. defined in `index.css` with `admin-*` prefix
- **Font:** Geist (loaded via CDN in `index.html`)
- **Icons:** Google Material Symbols (`material-symbols-outlined` class)
- **Colors:** Orange primary `#ff6b00`, Blue secondary `#2563eb`

---

## 2. Routing

All admin routes are defined in `frontend/src/router/AppRouter.jsx` and wrapped with `<ProtectedRoute requiredRole="is_teacher">`.

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/login` | `AdminLogin` | Teacher/admin login (public) |
| `/admin/dashboard` | `AdminDashboard` | Stats dashboard with nav tiles |
| `/admin/questions` | `AdminQuestions` | Question management (list by date) |
| `/admin/questions/upload` | `TeacherUpload` | Bulk question upload form |
| `/admin/questions/date/:date` | `AdminQuestionDateDetail` | View/edit/delete questions for a specific date |
| `/admin/stats` | `PlatformAnalytics` | Analytics with SVG charts |
| `/admin/rank` | `RankPage` | Daily/weekly rankings |
| `/admin/reports` | `TeacherReports` | Report download with date filters |

**ProtectedRoute logic:**
1. Check `localStorage` for `refresh_token`
2. If no refresh token → redirect to `/login`
3. If `access_token` exists and not expired → decode JWT, check `decoded[requiredRole]`
4. If expired → POST to `/api/auth/refresh/` with refresh token
5. If refresh fails → clear tokens, redirect to `/login`
6. If role mismatch → redirect to `/login`

---

## 3. API Client

All admin API calls are in `frontend/src/api/client.js` via the `adminAPI` export.

### `adminAPI.getDashboardStats()`
- **Endpoint:** `GET /api/admin/dashboard-stats/`
- **Returns:** `{ date, total_students, tests_completed, questions_live }`
- **Used in:** `AdminDashboard.jsx`

### `adminAPI.getQuestions(search, date)`
- **Endpoint:** `GET /api/admin/questions/?search={search}&date={date}`
- **Params:** `search` and `date` are optional
- **Returns:** Array of question objects
- **Used in:** `AdminQuestions.jsx`, `AdminQuestionDateDetail.jsx`

### `adminAPI.getQuestion(id)`
- **Endpoint:** `GET /api/admin/questions/{id}/`
- **Returns:** Single question object
- **Used in:** `AdminQuestionDateDetail.jsx` (edit modal)

### `adminAPI.updateQuestion(id, data)`
- **Endpoint:** `PATCH /api/admin/questions/{id}/`
- **Body:** Partial question data (`{text, option_a, ...}`)
- **Returns:** Updated question object
- **Used in:** `AdminQuestionDateDetail.jsx` (inline edit)

### `adminAPI.deleteQuestion(id)`
- **Endpoint:** `DELETE /api/admin/questions/{id}/`
- **Returns:** 204 No Content
- **Used in:** `AdminQuestionDateDetail.jsx` (delete button)

### `adminAPI.uploadQuestions(formData)`
- **Endpoint:** `POST /api/admin/upload-questions/`
- **Content-Type:** `multipart/form-data`
- **Body:** FormData with `date`, `questions` (JSON string), and optional `image_0`-`image_9` files
- **Returns:** `{ status: "uploaded", exam_date, questions_created, answer_key_updated }`
- **Used in:** `TeacherUpload.jsx`

### `adminAPI.getRankings(period, top)`
- **Endpoint:** `GET /api/admin/rankings/?period={period}&top={top}`
- **Returns:** Array of `{ rank, name, roll_number, score, exam_date }`
- **Used in:** `RankPage.jsx`

### `adminAPI.getReports(range, from, to)`
- **Endpoint:** `GET /api/admin/reports/?range={range}&from={from}&to={to}`
- **Returns:** `{ from, to, total_students, total_attended, total_absent, student_performance: [...] }`
- **Used in:** `TeacherReports.jsx`

### `adminAPI.downloadReport(date)`
- **Endpoint:** `GET /api/admin/download-report/{date}/`
- **ResponseType:** `blob`
- **Returns:** CSV file blob
- **Used in:** `TeacherReports.jsx`

### Axios Interceptors (`client.js`)
- **Request:** Attaches `Authorization: Bearer {access_token}` to every request (except auth endpoints)
- **Response:** On 401, attempts token refresh. On refresh failure, clears tokens and redirects to `/login`

---

## 4. Components

### `BottomNav` (`frontend/src/components/BottomNav.jsx`)

**Props:** `{ active }` (optional, overrides auto-detection)

**Navigation items:**
| Key | Label | Icon | Path |
|-----|-------|------|------|
| `home` | Home | `dashboard` | `/admin/dashboard` |
| `stats` | Stats | `analytics` | `/admin/stats` |
| `rank` | Rank | `leaderboard` | `/admin/rank` |
| `library` | Library | `inventory_2` | `/admin/questions` |
| `reports` | Reports | `assessment` | `/admin/reports` |

**Styling:** Tailwind classes with `admin-*` prefix. Active item has `bg-admin-primary text-admin-on-primary rounded-full`.

---

## 5. Pages

### `AdminLogin` (`frontend/src/pages/admin/AdminLogin.jsx`)

- Simple email + password login form
- Calls `authAPI.login(email, password)`
- On success: stores tokens in localStorage, checks `is_teacher` in JWT, redirects to `/admin/dashboard`
- If user is not a teacher, shows error

### `AdminDashboard` (`frontend/src/pages/admin/AdminDashboard.jsx`)

- Calls `adminAPI.getDashboardStats()` on mount
- Displays: total students, tests completed today, questions live today
- Navigation tiles linking to: Questions, Upload, Stats, Rank, Reports
- Shows today's date

### `AdminQuestions` (`frontend/src/questions/AdminQuestions.jsx`)

- Calls `adminAPI.getQuestions()` on mount
- Groups questions by exam_date
- Shows date cards with question count
- Clicking a date navigates to `/admin/questions/date/{date}`
- Search bar for filtering by question text

### `AdminQuestionDateDetail` (`frontend/src/pages/admin/AdminQuestionDateDetail.jsx`)

- Reads `:date` param from URL
- Calls `adminAPI.getQuestions(null, date)` on mount
- Displays all 10 questions for the date
- **Inline editing:** PATCH via `adminAPI.updateQuestion(id, data)`
- **Delete:** Confirmation dialog, then `adminAPI.deleteQuestion(id)`
- **Edit modal:** Shows question text + options + image
- Saves changes with PATCH (partial update)

### `TeacherUpload` (`frontend/src/pages/admin/TeacherUpload.jsx`)

**State:**
- `questions`: Array of `{text, option_a, option_b, option_c, option_d, correct_answer}` objects
- `examDate`: Date string
- `images`: Array of image files (optional per question)
- `loading`, `error`, `success`

**Features:**
- Starts with 10 empty question rows
- Add/remove rows (but must submit exactly 10)
- Image crop modal using `react-image-crop` library
- Client-side validation:
  - Rejects non-image MIME types (checks `content_type.startsWith('image/')`)
  - Rejects files > 5MB
- On submit:
  - Builds FormData: `date`, `questions` (JSON string), `image_0`-`image_N` (files)
  - Calls `adminAPI.uploadQuestions(formData)`
  - Shows success/error message

**Dependencies:** `react-image-crop` (installed as dependency)

### `PlatformAnalytics` (`frontend/src/pages/admin/PlatformAnalytics.jsx`)

- SVG-based charts (no charting library)
- Shows trends from admin stats
- Date range selector

### `RankPage` (`frontend/src/pages/admin/RankPage.jsx`)

- Calls `adminAPI.getRankings(period, top)` on mount
- Toggle between "daily" and "weekly" periods
- Shows ranked student list with name, roll number, score
- Top 3 highlighted

### `TeacherReports` (`frontend/src/pages/admin/TeacherReports.jsx`)

**Tabs:**
1. **Performance** — default tab, shows student performance data
2. **Reports** — shows downloadable CSV reports by date

- Calls `adminAPI.getReports(range)` on mount
- Date range selector (weekly, monthly, custom)
- Report cards with date and download button
- Download: calls `adminAPI.downloadReport(date)`, triggers browser blob download
- Empty state when no reports available

---

## 6. Design System

### Admin Color Palette

```css
/* index.css — admin-* Tailwind tokens */
--admin-primary: #ff6b00;
--admin-on-primary: #ffffff;
--admin-primary-container: #fff3e0;
--admin-secondary: #2563eb;
--admin-on-secondary: #ffffff;
--admin-secondary-container: #e0e7ff;
--admin-surface: #ffffff;
--admin-on-surface: #1a1a2e;
--admin-on-surface-variant: #6b7280;
--admin-outline: #e5e7eb;
--admin-outline-variant: #d1d5db;
--admin-surface-container: #f9fafb;
--admin-surface-container-high: #f3f4f6;
--admin-surface-container-lowest: #ffffff;
--admin-error: #ef4444;
--admin-error-container: #fef2f2;
--admin-success: #10b981;
--admin-success-container: #ecfdf5;
```

### Font
- **Geist** — loaded from CDN, used for all admin page text
- Labels: `font-label-sm`, `font-label-md` (JetBrains Mono in student pages, Geist in admin)

### Icons
- Google Material Symbols only (no Remix Icons)
- Usage: `<span className="material-symbols-outlined">icon_name</span>`
- Filled variant: add `style={{ fontVariationSettings: "'FILL' 1" }}`

---

## 7. Test Files

### `frontend/src/test/TeacherUpload.test.jsx` — 9 tests
- Renders upload form with initial 10 question fields
- Adds a new question row on "Add Row" click
- Removes a question row on delete click
- Validates empty question text on submit
- Validates missing options on submit
- Calls `uploadQuestions` with correct FormData on valid submit
- Shows success message after upload
- Shows error message on upload failure
- Correct answer selector updates

### `frontend/src/test/TeacherReports.test.jsx` — 6 tests
- Renders header and tabs
- Shows report cards with dates after switching to Reports tab
- Shows student counts
- Calls `downloadReport` on download click
- Shows empty state when no reports
- Shows loading skeletons during load

### `frontend/src/test/iconAudit.test.js` — 2 tests
- Static audit: no `ri-*` class references in any `.jsx` files
- Static audit: no Remix Icon CDN link in `index.html`

### Running Tests
```bash
cd frontend
npm test -- --run
```
