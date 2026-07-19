import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentBottomNav from '../../components/StudentBottomNav'
import { examAPI, studentAPI } from '../../api/client'

const C = {
  primary: '#465aa3', bg: '#f9f9f7', card: '#ffffff',
  text: '#1a1a2e', textMuted: '#6b7280', success: '#10b981', warning: '#f59e0b',
  danger: '#ef4444', border: '#e5e7eb',
  successBg: '#E5FAF1', warningBg: '#FFF8EE', errorBg: '#FCEAEC',
}

const Icon = ({ name, size = 24, color, style = {} }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
)

function ReviewQuestion({ q, userAnswer, correctAnswer, index }) {
  const options = [
    { label: 'A', text: q.option_a },
    { label: 'B', text: q.option_b },
    { label: 'C', text: q.option_c },
    { label: 'D', text: q.option_d },
  ].filter(o => o.text)

  const isCorrect = userAnswer === correctAnswer
  const isSkipped = !userAnswer

  return (
    <div style={{ background: C.card, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600,
          color: isSkipped ? C.textMuted : isCorrect ? '#059669' : C.danger,
          background: isSkipped ? '#f3f4f6' : isCorrect ? C.successBg : C.errorBg,
          padding: '2px 8px', borderRadius: 6,
        }}>
          Q{index + 1} {isSkipped ? 'Skipped' : isCorrect ? 'Correct' : 'Wrong'}
        </span>
      </div>
      <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.text, margin: '0 0 10px', lineHeight: 1.5 }}>{q.text}</p>
      {q.image_url && (
        <img src={q.image_url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 10, maxHeight: 200, objectFit: 'contain' }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {options.map(opt => {
          const isUserChoice = userAnswer === opt.label
          const isCorrectOpt = opt.label === correctAnswer
          let borderColor = C.border
          let bg = 'transparent'
          if (isCorrectOpt) { borderColor = '#059669'; bg = C.successBg }
          if (isUserChoice && !isCorrect) { borderColor = C.danger; bg = C.errorBg }
          return (
            <div key={opt.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: `1.5px solid ${borderColor}`, borderRadius: 8, background: bg }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 600, color: C.text, width: 20 }}>{opt.label}</span>
              <span style={{ fontFamily: 'Inter', fontSize: 13, color: C.text, flex: 1 }}>{opt.text}</span>
              {isCorrectOpt && <Icon name="check_circle" size={16} color="#059669" />}
              {isUserChoice && !isCorrect && <Icon name="cancel" size={16} color={C.danger} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function StudentResult() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [review, setReview] = useState(null)
  const [questions, setQuestions] = useState([])

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const dashRes = await studentAPI.getDashboard()
        if (cancelled) return
        const todayStatus = dashRes.data.today_status

        if (todayStatus === 'before_window' || todayStatus === 'in_progress') {
          setStatus('before_window')
          return
        }
        if (todayStatus === 'missed') {
          setStatus('missed')
          return
        }

        const [reviewRes, questionsRes] = await Promise.all([
          examAPI.getReview(today),
          examAPI.getQuestions(today).catch(() => ({ data: { questions: [] } })),
        ])

        if (cancelled) return
        setReview(reviewRes.data)
        setQuestions(questionsRes.data.questions || [])

        if (reviewRes.data.window_status === 'open' && reviewRes.data.correct_answers) {
          setStatus('reviewed')
        } else {
          setStatus('submitted')
        }
      } catch {
        if (!cancelled) setStatus('submitted')
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', color: C.textMuted }}>
          <Icon name="hourglass_top" size={36} color={C.primary} />
          <p style={{ marginTop: 8, fontSize: 14 }}>Loading results...</p>
        </div>
      </div>
    )
  }

  if (status === 'before_window' || status === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif', maxWidth: 480, margin: '0 auto' }}>
        <header style={{ background: C.card, padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/student/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icon name="arrow_back" size={22} color={C.text} />
            </button>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Exam Result</h1>
          </div>
        </header>
        <main style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBottom: 120 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check_circle" size={40} color="#059669" />
          </div>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: C.text, textAlign: 'center', margin: 0 }}>Exam Submitted!</h2>
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.textMuted, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
            Your answers have been recorded. Results will be available after <strong>2:00 PM IST</strong>.
          </p>
          <button
            onClick={() => navigate('/student/dashboard')}
            style={{
              marginTop: 8, background: C.primary, color: '#fff', border: 'none',
              borderRadius: 999, padding: '13px 32px', fontFamily: 'Space Grotesk',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Back to Dashboard
          </button>
        </main>
        <StudentBottomNav />
      </div>
    )
  }

  if (status === 'missed') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif', maxWidth: 480, margin: '0 auto' }}>
        <header style={{ background: C.card, padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/student/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icon name="arrow_back" size={22} color={C.text} />
            </button>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Exam Result</h1>
          </div>
        </header>
        <main style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBottom: 120 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.errorBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="event_busy" size={40} color={C.danger} />
          </div>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: C.text, textAlign: 'center', margin: 0 }}>No Exam Today</h2>
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.textMuted, textAlign: 'center' }}>You didn't take today's exam.</p>
          <button onClick={() => navigate('/student/dashboard')} style={{ marginTop: 8, background: C.primary, color: '#fff', border: 'none', borderRadius: 999, padding: '13px 32px', fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </main>
        <StudentBottomNav />
      </div>
    )
  }

  if (status === 'reviewed' && review) {
    const score = review.score
    const total = review.total_questions || 20
    const correct = score
    const userAnswers = review.answers || {}
    const correctAnswers = review.correct_answers || {}
    const skipped = Object.keys(correctAnswers).length - Object.keys(userAnswers).length
    const wrong = total - correct - Math.max(skipped, 0)
    const pct = Math.round((score / total) * 100)
    const scoreColor = pct >= 70 ? '#059669' : pct >= 50 ? C.warning : C.danger

    const questionMap = {}
    questions.forEach(q => { questionMap[q.id] = q })

    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif', maxWidth: 480, margin: '0 auto' }}>
        <header style={{ background: C.card, padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/student/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icon name="arrow_back" size={22} color={C.text} />
            </button>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Your Result</h1>
          </div>
        </header>

        <main style={{ padding: '16px', paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%', border: `4px solid ${scoreColor}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: scoreColor }}>{score}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.textMuted }}>/{total}</span>
            </div>
            <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.textMuted, margin: 0 }}>Your Score</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ background: C.successBg, borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: '#059669', margin: 0 }}>{correct}</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#059669', margin: '2px 0 0', textTransform: 'uppercase' }}>Correct</p>
            </div>
            <div style={{ background: C.errorBg, borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: C.danger, margin: 0 }}>{Math.max(wrong, 0)}</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.danger, margin: '2px 0 0', textTransform: 'uppercase' }}>Wrong</p>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: C.textMuted, margin: 0 }}>{Math.max(skipped, 0)}</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textMuted, margin: '2px 0 0', textTransform: 'uppercase' }}>Skipped</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.keys(correctAnswers).map((qid, idx) => {
              const num = parseInt(qid.replace('q', ''), 10)
              const q = questionMap[num]
              if (!q) return null
              return (
                <ReviewQuestion
                  key={qid}
                  q={q}
                  userAnswer={userAnswers[qid] || null}
                  correctAnswer={correctAnswers[qid]}
                  index={idx}
                />
              )
            })}
          </div>
        </main>
        <StudentBottomNav />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <header style={{ background: C.card, padding: '16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/student/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="arrow_back" size={22} color={C.text} />
          </button>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Exam Result</h1>
        </div>
      </header>
      <main style={{ padding: 40, textAlign: 'center', paddingBottom: 120 }}>
        <Icon name="info" size={36} color={C.warning} />
        <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.textMuted, marginTop: 8 }}>Results will appear after 2:00 PM IST.</p>
        <button onClick={() => navigate('/student/dashboard')} style={{ marginTop: 16, background: C.primary, color: '#fff', border: 'none', borderRadius: 999, padding: '13px 32px', fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </main>
      <StudentBottomNav />
    </div>
  )
}
