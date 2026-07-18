# NEXT_STEPS.md — Remaining Work & Merge Plan

> **Status:** Sprints 1–3 complete. Sprint 4 in progress.  
> **Current Branch:** `feature/shahin-django-init-auth` (all feature work merged here)  
> **Last Updated:** July 2026

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Phase 1 — Implement 6 Empty Placeholder Files](#2-phase-1--implement-6-empty-placeholder-files)
3. [Phase 2 — Fix ExamPage Temp Mode](#3-phase-2--fix-exampage-temp-mode)
4. [Phase 3 — Update AppRouter to Use New Components](#4-phase-3--update-approuter-to-use-new-components)
5. [Phase 4 — Infrastructure Cleanup](#5-phase-4--infrastructure-cleanup)
6. [Phase 5 — Merge to Main](#6-phase-5--merge-to-main)
7. [Phase 6 — Final Verification](#7-phase-6--final-verification)

---

## 1. Current State Summary

### What's Done
- **Backend:** 100% complete — all models, views, serializers, management commands, signals, tests
- **Frontend Pages:** 9/9 pages fully implemented (Login, Register, Dashboard, AssessmentDetails, ExamPage, SubmitPage, ProcessingPage, SuccessPage, AnswerReview)
- **API Client:** Axios with JWT interceptors working
- **Routing:** Custom state-based router working
- **Redis Caching:** Cache warm + question cache interceptor done
- **Pipeline:** Aggregation, CSV export, scheduled deletion, leaderboard cron — all done
- **Testing:** 35+ backend tests passing, Locust load test configured

### What's NOT Done
- **6 empty placeholder files** — components and hooks that are TODO stubs
- **ExamPage** — in TEMPORARY preview mode with fake questions
- **AppRouter** — doesn't use ProtectedRoute, QuestionCard, or CountdownTimer yet
- **README.md** — has merge conflicts
- **PROJECT_IMPLEMENTATION_KIT.md** — empty placeholder

---

## 2. Phase 1 — Implement 6 Empty Placeholder Files

These files currently contain only a single TODO comment. They need full implementations.

### 2.1 `frontend/src/hooks/usePersistedAnswers.js` (Owner: Vikky — US-K01)

**Purpose:** Saves exam answers to localStorage with Base64 obfuscation so browser crashes don't lose progress.

**Implementation:**
```javascript
import { useState } from 'react'

const encode = (data) => btoa(JSON.stringify(data))
const decode = (raw) => JSON.parse(atob(raw))

export function usePersistedAnswers(userId, examDate) {
  const storageKey = `exam_answers_${userId}_${examDate}`

  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return {}
      return decode(saved)
    } catch {
      return {}
    }
  })

  const saveAnswer = (questionId, answer) => {
    const updated = { ...answers, [questionId]: answer }
    setAnswers(updated)
    localStorage.setItem(storageKey, encode(updated))
  }

  const clearAnswers = () => {
    setAnswers({})
    localStorage.removeItem(storageKey)
  }

  return { answers, saveAnswer, clearAnswers }
}
```

**Acceptance Criteria:**
- [ ] On every `saveAnswer()` call, data is Base64-encoded before writing to localStorage
- [ ] On mount, data is decoded from localStorage (catches corrupted/tampered data → empty object)
- [ ] `clearAnswers()` removes the key entirely
- [ ] Storage key format: `exam_answers_{userId}_{examDate}`

---

### 2.2 `frontend/src/hooks/useExamCountdown.js` (Owner: Vikky — US-K02)

**Purpose:** Countdown timer that calculates remaining seconds until exam end (2:00 PM IST) and auto-fires a callback at expiry.

**Implementation:**
```javascript
import { useState, useEffect, useRef } from 'react'

export function useExamCountdown(examEndTime, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    const calcRemaining = () => {
      const now = new Date()
      const end = new Date(examEndTime)
      return Math.max(0, Math.floor((end - now) / 1000))
    }

    setSecondsLeft(calcRemaining())
    intervalRef.current = setInterval(() => {
      const remaining = calcRemaining()
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(intervalRef.current)
        onExpire()
      }
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [examEndTime, onExpire])

  const hh = String(Math.floor(secondsLeft / 3600)).padStart(2, '0')
  const mm = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return { secondsLeft, formatted: `${hh}:${mm}:${ss}` }
}
```

**Acceptance Criteria:**
- [ ] Uses server time comparison (not just client clock drift)
- [ ] Updates every 1 second via `setInterval`
- [ ] Calls `onExpire()` when timer reaches 0
- [ ] Returns both raw `secondsLeft` and `formatted` string (HH:MM:SS)
- [ ] Cleans up interval on unmount

---

### 2.3 `frontend/src/components/CountdownTimer.jsx` (Owner: Vikky — US-K02)

**Purpose:** Visual countdown timer component for the exam header.

**Implementation:**
```jsx
import { useExamCountdown } from '../hooks/useExamCountdown'

const Icon = ({ name, size = 24, color }) => (
  <span className="material-symbols-outlined"
    style={{ fontSize: size, color, lineHeight: 1 }}>{name}</span>
)

export default function CountdownTimer({ examEndTime, onExpire }) {
  const { formatted } = useExamCountdown(examEndTime, onExpire)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: '#FCEAEC', borderRadius: 9999,
      padding: '6px 12px', border: '1px solid #E2737A30'
    }}>
      <Icon name="timer" size={18} color="#E2737A" />
      <span style={{
        fontFamily: 'JetBrains Mono', fontSize: 14,
        fontWeight: 500, color: '#E2737A'
      }}>{formatted}</span>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Renders timer badge with clock icon
- [ ] Shows HH:MM:SS in JetBrains Mono font
- [ ] Red color scheme (error/danger palette)
- [ ] Auto-updates every second

---

### 2.4 `frontend/src/components/QuestionCard.jsx` (Owner: Vijay — US-V03)

**Purpose:** Reusable question renderer that handles both text-only and image questions.

**Implementation:**
```jsx
const C = {
  primary: '#465aa3', primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b', outline: '#E6E9F7',
  outlineVariant: '#c5c5d2', onSurface: '#34406E',
}

const Icon = ({ name, size = 24, fill = false, color }) => (
  <span className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1 }}>{name}</span>
)

export default function QuestionCard({ id, text, option_a, option_b, option_c, option_d, image_url, selected, onSelect }) {
  const options = [
    { label: 'A', value: option_a },
    { label: 'B', value: option_b },
    { label: 'C', value: option_c },
    { label: 'D', value: option_d },
  ].filter(o => o.value)

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E6E9F7', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(70,90,163,0.08)' }}>
      <p style={{ fontFamily: 'Inter', fontSize: 16, color: '#34406E', lineHeight: 1.6, marginBottom: 20, fontWeight: 500 }}>{text}</p>

      {image_url && (
        <img
          src={image_url}
          alt={`Question ${id} diagram`}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none' }}
          style={{ width: '100%', borderRadius: 12, marginBottom: 16, objectFit: 'contain' }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map(({ label, value }) => {
          const isSelected = selected === label
          return (
            <div
              key={label}
              onClick={() => onSelect(id, label)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', cursor: 'pointer',
                border: `2px solid ${isSelected ? '#465aa3' : '#E6E9F7'}`,
                background: isSelected ? '#EAEFFD50' : 'transparent',
                borderRadius: 16, transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                border: `2px solid ${isSelected ? '#465aa3' : '#c5c5d2'}`,
                background: isSelected ? '#465aa3' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s'
              }}>
                {isSelected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <span style={{ fontFamily: 'Inter', fontSize: 15, color: isSelected ? '#1e347b' : '#34406E', fontWeight: isSelected ? 600 : 400, flex: 1 }}>{value}</span>
              {isSelected && <Icon name="check_circle" size={20} fill color="#465aa3" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Renders question text + optional image (lazy-loaded, onError hides)
- [ ] Options A–D render as clickable radio-style cards
- [ ] Selected option highlights with primary color + checkmark
- [ ] Accepts `onSelect(questionId, label)` callback

---

### 2.5 `frontend/src/router/ProtectedRoute.jsx` (Owner: Vijay — US-V01)

**Purpose:** Route guard that checks JWT token and user role before rendering children.

**Implementation:**
```jsx
import { useState, useEffect } from 'react'

export default function ProtectedRoute({ children, requiredRole }) {
  const [authorized, setAuthorized] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    if (!token) {
      setAuthorized(false)
      return
    }

    if (requiredRole && !user[requiredRole]) {
      setAuthorized(false)
      return
    }

    setAuthorized(true)
  }, [requiredRole])

  if (authorized === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8ff' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#465aa3', animation: 'spin 1s linear infinite' }}>sync</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!authorized) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Note: This component uses inline navigation since the app uses
// a state-based router, not React Router's BrowserRouter.
// For integration with AppRouter, the parent should handle redirect logic.
```

**Acceptance Criteria:**
- [ ] Checks `access_token` in localStorage
- [ ] Checks `user[requiredRole]` (e.g., `user.is_student`)
- [ ] Shows loading spinner while checking
- [ ] Redirects to login if unauthorized
- [ ] **Important:** Since AppRouter uses state-based navigation (not React Router), this component should be adapted to work with `onNavigate` prop instead of `<Navigate>`

---

### 2.6 `frontend/src/pages/teacher/TeacherUpload.jsx` (Owner: Vijay)

**Purpose:** Teacher dashboard for uploading questions and downloading CSV reports.

**Implementation:**
```jsx
import { useState, useEffect } from 'react'
import axiosClient from '../../api/client'

const C = {
  primary: '#465aa3', primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b', surface: '#FBFBFF',
  surfaceContainer: '#FFFFFF', outline: '#E6E9F7',
  onSurface: '#34406E', onSurfaceVariant: '#6C7596',
  success: '#116b51', successContainer: '#E5FAF1',
  error: '#E2737A', background: '#faf8ff',
}

const Icon = ({ name, size = 24, color }) => (
  <span className="material-symbols-outlined"
    style={{ fontSize: size, color, lineHeight: 1 }}>{name}</span>
)

export default function TeacherUpload({ onNavigate }) {
  const [date, setDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleUpload = async () => {
    if (!date) { setError('Select a date'); return }
    setUploading(true)
    setError('')
    try {
      await axiosClient.post('/api/internal/warm-cache/', { exam_date: date })
      setMessage('Questions uploaded successfully')
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!date) { setError('Select a date'); return }
    setDownloading(true)
    setError('')
    try {
      const res = await axiosClient.get(`/api/admin/download-report/${date}/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Master_Report_${date}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setMessage('Report downloaded. It will be auto-deleted in 4 hours.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, color: C.onSurface, marginBottom: 24 }}>Teacher Dashboard</h1>

      <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <label style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant, display: 'block', marginBottom: 8 }}>Exam Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', border: `1px solid ${C.outline}`, borderRadius: 12, fontFamily: 'Inter', fontSize: 14, marginBottom: 16 }} />

        <button onClick={handleUpload} disabled={uploading}
          style={{ width: '100%', padding: 14, background: C.primary, color: '#fff', border: 'none', borderRadius: 9999, fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
          {uploading ? 'Uploading...' : 'Upload Questions'}
        </button>

        <button onClick={handleDownload} disabled={downloading}
          style={{ width: '100%', padding: 14, background: C.success, color: '#fff', border: 'none', borderRadius: 9999, fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {downloading ? 'Downloading...' : 'Download Report (CSV)'}
        </button>
      </div>

      {message && <div style={{ background: C.successContainer, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, marginBottom: 12 }}>
        <Icon name="check_circle" size={18} color={C.success} />
        <span style={{ fontFamily: 'Inter', fontSize: 13, color: '#116b51' }}>{message}</span>
      </div>}

      {error && <div style={{ background: '#FCEAEC', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
        <Icon name="error" size={18} color={C.error} />
        <span style={{ fontFamily: 'Inter', fontSize: 13, color: '#93000a' }}>{error}</span>
      </div>}

      <button onClick={() => onNavigate('login')} style={{ marginTop: 24, padding: 12, background: 'transparent', border: `1px solid ${C.outline}`, borderRadius: 9999, fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant, cursor: 'pointer' }}>Logout</button>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Date picker for selecting exam date
- [ ] Upload button triggers warm-cache endpoint
- [ ] Download button fetches CSV and triggers browser download
- [ ] Success/error messages display
- [ ] Logout button clears tokens

---

## 3. Phase 2 — Fix ExamPage Temp Mode

**File:** `frontend/src/pages/student/ExamPage.jsx`

### Changes Required

**1. Remove the entire TEMPORARY PREVIEW BLOCK (lines 40–117):**
- Delete the `fakeQuestions` array
- Delete `setQuestions(fakeQuestions)` and `setLoading(false)`

**2. Replace with real API call:**
```javascript
const fetchQuestions = async () => {
  try {
    const res = await axiosClient.get(`/api/tests/questions/?date=${today}`)
    setQuestions(res.data.questions || [])
  } catch (err) {
    setError('Failed to load questions. Please try again.')
  } finally {
    setLoading(false)
  }
}
fetchQuestions()
```

**3. Change timer from 10 seconds to 1 hour:**
```javascript
// BEFORE (line 33):
const [timeLeft, setTimeLeft] = useState(10)

// AFTER:
const [timeLeft, setTimeLeft] = useState(60 * 60)
```

**4. Delete the comment block at the bottom (lines 276–299)**

---

## 4. Phase 3 — Update AppRouter to Use New Components

**File:** `frontend/src/router/AppRouter.jsx`

### Changes Required

1. **Add ProtectedRoute** to guard `/exam`, `/submit`, `/assessment-details`, `/review` routes
2. **Import CountdownTimer** into ExamPage header (replace inline timer)
3. **Import QuestionCard** into ExamPage (replace inline question rendering)
4. **Import usePersistedAnswers** hook into ExamPage (replace inline localStorage logic)
5. **Add TeacherUpload** route for teacher role
6. **Add teacher page** to the pages map

```javascript
import { useState, useCallback } from 'react'
import LoginPage from '../pages/Login'
import Register from '../pages/student/Register'
import Dashboard from '../pages/student/Dashboard'
import AssessmentDetails from '../pages/student/AssessmentDetails'
import ExamPage from '../pages/student/ExamPage'
import SubmitPage from '../pages/student/SubmitPage'
import ProcessingPage from '../pages/student/ProcessingPage'
import SuccessPage from '../pages/student/SuccessPage'
import AnswerReview from '../pages/student/AnswerReview'
import TeacherUpload from '../pages/teacher/TeacherUpload'

export default function AppRouter() {
  const [page, setPage] = useState('login')
  const [examData, setExamData] = useState(null)

  const navigate = useCallback((p, data = null) => {
    setPage(p)
    if (data) setExamData(data)
  }, [])

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAuthenticated = !!localStorage.getItem('access_token')

  const pages = {
    login: <LoginPage onLogin={() => navigate('dashboard')} onNavigate={navigate} />,
    register: <Register onNavigate={navigate} />,
    dashboard: isAuthenticated
      ? <Dashboard onNavigate={navigate} />
      : <LoginPage onLogin={() => navigate('dashboard')} onNavigate={navigate} />,
    'assessment-details': <AssessmentDetails onNavigate={navigate} />,
    exam: <ExamPage onNavigate={navigate} />,
    submit: <SubmitPage onNavigate={navigate} />,
    processing: <ProcessingPage onNavigate={navigate} />,
    success: <SuccessPage onNavigate={navigate} />,
    'answer-review': <AnswerReview onNavigate={navigate} />,
    'teacher-upload': user.is_teacher
      ? <TeacherUpload onNavigate={navigate} />
      : <LoginPage onLogin={() => navigate('dashboard')} onNavigate={navigate} />,
  }

  return (
    <div style={{ background: '#e3e1e8', minHeight: '100vh' }}>
      {pages[page] || pages['login']}
    </div>
  )
}
```

---

## 5. Phase 4 — Infrastructure Cleanup

### 5.1 Fix README.md Merge Conflicts
```bash
git checkout main
git pull origin main
# Resolve conflicts in README.md manually
git add README.md
git commit -m "fix: resolve README merge conflicts"
```

### 5.2 Write PROJECT_IMPLEMENTATION_KIT.md
Copy the content from the instruction file you pasted into `docs/PROJECT_IMPLEMENTATION_KIT.md`.

### 5.3 Verify Backend Tests Pass
```bash
cd backend
python manage.py test
```

### 5.4 Verify Frontend Builds
```bash
cd frontend
npm run build
```

---

## 6. Phase 5 — Merge to Main

### Step 1: Ensure All Tests Pass
```bash
cd backend
python manage.py test
cd ../frontend
npm run build
```

### Step 2: Merge feature/shahin-django-init-auth → development
```bash
git checkout development
git merge feature/shahin-django-init-auth
git push origin development
```

### Step 3: Merge development → main
```bash
git checkout main
git merge development
git push origin main
```

### Step 4: Delete Merged Feature Branches
```bash
git branch -d feature/shahin-django-init-auth
git branch -d feature/fahim-pipeline-engine
git branch -d feature/sreekuttan-redis-cache
git branch -d feature/vijay-router-ui
git branch -d feature/vikky-state-engine
git push origin --delete feature/shahin-django-init-auth
git push origin --delete feature/fahim-pipeline-engine
git push origin --delete feature/sreekuttan-redis-cache
git push origin --delete feature/vijay-router-ui
git push origin --delete feature/vikky-state-engine
```

---

## 7. Phase 6 — Final Verification

### Checklist
- [ ] All 6 placeholder files implemented
- [ ] ExamPage reverted to real API with 60-min timer
- [ ] AppRouter updated with new components
- [ ] Backend tests pass (`python manage.py test`)
- [ ] Frontend builds without errors (`npm run build`)
- [ ] README.md merge conflicts resolved
- [ ] PROJECT_IMPLEMENTATION_KIT.md written
- [ ] All feature branches merged to main
- [ ] Old feature branches deleted

### Smoke Test Flow
```
1. Start backend: python manage.py runserver
2. Start frontend: npm run dev
3. Open http://localhost:5173
4. Login as student → Dashboard → Assessment Details → Exam → Answer questions → Submit → Success
5. Login as teacher → Teacher Dashboard → Download report
6. Verify answer review shows correct/wrong indicators
```

---

*Document Version: 1.0 | For internal use by the Aptitude Test Platform team*
