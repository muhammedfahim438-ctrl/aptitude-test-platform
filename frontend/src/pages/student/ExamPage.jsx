import { useState, useEffect } from 'react'
import axiosClient from '../../api/client'

const C = {
  primary: '#465aa3',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
  surface: '#FBFBFF',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#f5f3fa',
  surfaceContainerHigh: '#e9e7ee',
  surfaceContainerHighest: '#e3e1e8',
  outline: '#E6E9F7',
  outlineVariant: '#c5c5d2',
  onSurface: '#34406E',
  onSurfaceVariant: '#444651',
  error: '#E2737A',
  errorContainer: '#FCEAEC',
  background: '#faf8ff',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
)

export default function ExamPage({ onNavigate }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  // TEMPORARY: shortened to 10 seconds so you can see auto-submit fire quickly.
  // Change back to 60 * 60 (1 hour) when you're done previewing.
  const [timeLeft, setTimeLeft] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    // ===== TEMPORARY PREVIEW BLOCK =====
    // This replaces the real API call with hardcoded fake questions,
    // so you can see the whole exam flow without a working backend.
    // Delete this block and restore the original fetchQuestions() call
    // (see bottom of this file in comments) when you're done previewing.

    // Simple inline SVG "mirror image" style diagrams, built as data URIs
    // so no internet connection or external image host is needed for preview.
    const mirrorImageSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
        <rect width="400" height="200" fill="#f5f3fa"/>
        <text x="60" y="110" font-size="80" font-family="Arial" fill="#34406E">F</text>
        <line x1="200" y1="20" x2="200" y2="180" stroke="#465aa3" stroke-width="2" stroke-dasharray="6,4"/>
        <text x="270" y="110" font-size="80" font-family="Arial" fill="#465aa3" transform="scale(-1,1) translate(-580,0)">F</text>
        <text x="150" y="30" font-size="14" font-family="Arial" fill="#444651">Object</text>
        <text x="330" y="30" font-size="14" font-family="Arial" fill="#444651">Mirror</text>
      </svg>
    `)}`

    const rotatedShapeSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
        <rect width="400" height="200" fill="#f5f3fa"/>
        <polygon points="80,40 140,40 140,100 180,100 110,160 40,100 80,100" fill="#465aa3"/>
        <text x="200" y="105" font-size="28" font-family="Arial" fill="#34406E">rotated 90° = ?</text>
      </svg>
    `)}`

    const fakeQuestions = [
      {
        id: 1,
        text: 'Q1 (Mirror Image): Which option correctly shows the mirror image of the letter "F" placed to the left of a vertical mirror line?',
        option_a: 'Image A (flipped correctly)',
        option_b: 'Image B (upside down)',
        option_c: 'Image C (unchanged)',
        option_d: 'Image D (rotated 90°)',
        image_url: mirrorImageSvg,
      },
      {
        id: 2,
        text: 'Q2 (Figure Rotation): The shape below is rotated 90° clockwise. Which of the following matches the result?',
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        image_url: rotatedShapeSvg,
      },
      {
        id: 3,
        text: 'Q3: What is 3 + 3?',
        option_a: '5',
        option_b: '6',
        option_c: '7',
        option_d: '8',
        image_url: null,
      },
      {
        id: 4,
        text: 'Q4 (Broken image test): This question has an intentionally broken image URL to test the onError fallback.',
        option_a: 'A',
        option_b: 'B',
        option_c: 'C',
        option_d: 'D',
        image_url: 'https://example.com/this-image-does-not-exist.png',
      },
      {
        id: 5,
        text: 'Q5: What is 5 + 5?',
        option_a: '9',
        option_b: '10',
        option_c: '11',
        option_d: '12',
        image_url: null,
      },
    ]

    setQuestions(fakeQuestions)
    setLoading(false)
    // ===== END TEMPORARY PREVIEW BLOCK =====

    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const saved = localStorage.getItem(`exam_answers_${user.id}_${today}`)
    if (saved) {
      try { setAnswers(JSON.parse(atob(saved))) } catch { }
    }
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); handleAutoSubmit(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [answers])

  const saveAnswer = (questionId, answer) => {
    const updated = { ...answers, [questionId]: answer }
    setAnswers(updated)
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    localStorage.setItem(`exam_answers_${user.id}_${today}`, btoa(JSON.stringify(updated)))
  }

  const handleAutoSubmit = async () => {
    try {
      await axiosClient.post('/api/tests/submit/', { exam_date: today, answers })
      onNavigate('success')
    } catch { onNavigate('submit') }
  }

  const hh = String(Math.floor(timeLeft / 3600)).padStart(2, '0')
  const mm = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  const optLabels = ['A', 'B', 'C', 'D']
  const answered = Object.keys(answers).length
  const progress = questions.length > 0 ? ((current) / questions.length) * 100 : 0
  const q = questions[current]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.background }}>
      <div style={{ textAlign: 'center' }}>
        <Icon name="sync" size={40} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontFamily: 'Inter', fontSize: 15, color: C.onSurfaceVariant, marginTop: 12 }}>Loading questions...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error || questions.length === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.background, padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <Icon name="assignment_late" size={48} color={C.onSurfaceVariant} />
      <p style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: C.onSurface, marginTop: 16, textAlign: 'center' }}>{error || 'No questions available today'}</p>
      <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>Questions are available between 10:00 AM and 2:00 PM</p>
      <button onClick={() => onNavigate('dashboard')} style={{ marginTop: 24, padding: '12px 32px', background: C.primary, color: '#fff', border: 'none', borderRadius: 9999, fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Go Back</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.surface, boxShadow: '0 1px 8px rgba(70,90,163,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => onNavigate('assessment-details')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%', display: 'flex' }}>
            <Icon name="arrow_back" color={C.primary} size={22} />
          </button>
          <p style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600, color: C.primary, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Quantitative Aptitude</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.errorContainer, borderRadius: 9999, padding: '6px 12px', border: `1px solid ${C.error}30` }}>
            <Icon name="timer" size={18} color={C.error} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 500, color: C.error }}>{hh}:{mm}:{ss}</span>
          </div>
          <button onClick={() => onNavigate('submit')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Icon name="more_vert" color={C.onSurface} />
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: C.onSurface }}>Question {current + 1} of {questions.length}</span>
          <div style={{ height: 6, background: C.outline, borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: C.primary, borderRadius: 9999, transition: 'width 0.4s ease' }} />
          </div>
          <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onSurfaceVariant, fontWeight: 500 }}>{answered} of {questions.length} Questions Answered</p>
        </div>

        {/* Question Card */}
        <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(70,90,163,0.08)' }}>
          <p style={{ fontFamily: 'Inter', fontSize: 16, color: C.onSurface, lineHeight: 1.6, marginBottom: 20, fontWeight: 500 }}>{q?.text}</p>

          {q?.image_url && (
            <img src={q.image_url} alt="Question" style={{ width: '100%', borderRadius: 12, marginBottom: 16, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none' }} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[q?.option_a, q?.option_b, q?.option_c, q?.option_d].map((opt, i) => {
              if (!opt) return null
              const selected = answers[q.id] === optLabels[i]
              return (
                <div
                  key={i}
                  onClick={() => saveAnswer(q.id, optLabels[i])}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: `2px solid ${selected ? C.primary : C.outline}`, background: selected ? `${C.primaryContainer}50` : 'transparent', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${selected ? C.primary : C.outlineVariant}`, background: selected ? C.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {selected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <span style={{ fontFamily: 'Inter', fontSize: 15, color: selected ? C.onPrimaryContainer : C.onSurface, fontWeight: selected ? 600 : 400, flex: 1 }}>{opt}</span>
                  {selected && <Icon name="check_circle" size={20} fill color={C.primary} />}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.surfaceContainerLow, borderTop: `1px solid ${C.outline}`, padding: '12px 16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          disabled={current === 0}
          onClick={() => setCurrent(c => c - 1)}
          style={{ flex: 1, background: C.surfaceContainerHighest, color: C.primary, border: 'none', borderRadius: 9999, padding: '14px 24px', fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, cursor: current === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: current === 0 ? 0.5 : 1, transition: 'all 0.2s' }}
        >
          <Icon name="chevron_left" size={20} color={C.primary} />
          Previous
        </button>
        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            style={{ flex: 1, background: C.primary, color: '#fff', border: 'none', borderRadius: 9999, padding: '14px 24px', fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
          >
            Next
            <Icon name="chevron_right" size={20} color="#fff" />
          </button>
        ) : (
          <button
            onClick={() => onNavigate('submit')}
            style={{ flex: 1, background: C.primary, color: '#fff', border: 'none', borderRadius: 9999, padding: '14px 24px', fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            Review
            <Icon name="checklist" size={20} color="#fff" />
          </button>
        )}
      </footer>

      <style>{`.fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/* ============================================================
   HOW TO REVERT TO REAL BACKEND DATA (once you're done previewing):

   1. In the first useEffect, DELETE the "TEMPORARY PREVIEW BLOCK"
      (the fakeQuestions array + setQuestions/setLoading lines)
      and REPLACE it with this original code:

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

   2. Change:
      const [timeLeft, setTimeLeft] = useState(10)
      back to:
      const [timeLeft, setTimeLeft] = useState(60 * 60)
   ============================================================ */