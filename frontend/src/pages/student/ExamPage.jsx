// src/pages/student/ExamPage.jsx
// Shell — Vijay owns layout + QuestionCard rendering.
// Hooks: usePersistedAnswers (VIKKY), useExamCountdown (VIKKY)
// API:   examAPI.getQuestions, examAPI.submitAnswers

import { useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import QuestionCard from '../../components/QuestionCard'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { useExamCountdown } from '../../hooks/useExamCountdown'
import { examAPI } from '../../api/axiosClient'

export default function ExamPage() {
  const token   = localStorage.getItem('access_token')
  const decoded = token ? jwtDecode(token) : {}
  const today   = new Date().toISOString().split('T')[0]

  const examEnd = new Date()
  examEnd.setHours(14, 0, 0, 0)

  const { answers, saveAnswer, clearAnswers } = usePersistedAnswers(decoded.user_id, today)

  const [questions, setQuestions]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [submitted, setSubmitted]     = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    examAPI.getQuestions(today)
      .then((res) => setQuestions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [today])

  const handleAutoSubmit = useCallback(async () => {
    let retries = 3
    while (retries > 0) {
      try {
        await examAPI.submitAnswers(today, answers)
        clearAnswers()
        setSubmitted(true)
        return
      } catch {
        retries--
        if (retries > 0) await new Promise((r) => setTimeout(r, 2000))
      }
    }
    setSubmitError('Auto-submit failed. Please contact invigilator.')
  }, [today, answers, clearAnswers])

  const countdown = useExamCountdown(examEnd.toISOString(), handleAutoSubmit)

  const handleManualSubmit = async () => {
    try {
      await examAPI.submitAnswers(today, answers)
      clearAnswers()
      setSubmitted(true)
    } catch (e) {
      setSubmitError(e.response?.data?.error || 'Submission failed. Retry.')
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f7' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: '#ff6b00' }}>task_alt</span>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1c1c1b', marginTop: 12 }}>Submitted!</h2>
          <p style={{ fontSize: 14, color: '#4e473e', marginTop: 8 }}>Your answers have been recorded.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', fontFamily: 'Geist, sans-serif' }}>

      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={logoDot} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1c1c1b' }}>Exam</span>
        </div>
        <div style={countdownChip} className="countdown-chip-mobile">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>timer</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600 }}>
            {countdown}
          </span>
        </div>
      </header>

      {/* Body */}
      <main className="exam-main-mobile" style={{ padding: '16px 20px 120px', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1c1c1b', marginBottom: 4 }}>
          Today's Aptitude Test
        </h2>
        <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#4e473e', marginBottom: 20 }}>
          {today} · {Object.keys(answers).length}/{questions.length} answered
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span className="material-symbols-outlined spin" style={{ fontSize: 32, color: '#ff6b00' }}>
              progress_activity
            </span>
          </div>
        )}

        {!loading && questions.map((q) => (
          <QuestionCard
            key={q.id}
            id={q.id}
            text={q.text}
            options={{ A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }}
            image_url={q.image_url || null}
            selected={answers[q.id] || null}
            onSelect={saveAnswer}
          />
        ))}

        {submitError && (
          <p style={{ color: '#ba1a1a', fontSize: 13, marginBottom: 12 }}>{submitError}</p>
        )}
      </main>

      {/* Fixed submit footer */}
      {!loading && (
        <div style={submitFooter}>
          <button onClick={handleManualSubmit} style={submitBtn}>
            Submit Answers
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
          </button>
        </div>
      )}
    </div>
  )
}

const headerStyle = {
  background: '#fff', borderBottom: '1px solid #d2c5b6',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 20px', height: 56,
  position: 'sticky', top: 0, zIndex: 40,
}
const logoDot = {
  width: 28, height: 28, borderRadius: 6, background: '#ff6b00',
}
const countdownChip = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: '#ffe8d6', color: '#331500',
  padding: '4px 12px', borderRadius: 999, fontSize: 13,
}
const submitFooter = {
  position: 'fixed', bottom: 0, left: 0, width: '100%',
  padding: '12px 20px 20px',
  background: '#fff', borderTop: '1px solid #d2c5b6',
}
const submitBtn = {
  width: '100%', padding: '13px 20px',
  background: '#ff6b00', color: '#fff',
  border: 'none', borderRadius: 8,
  fontSize: 14, fontWeight: 600,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  fontFamily: 'Geist, sans-serif',
}