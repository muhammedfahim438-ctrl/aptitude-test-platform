import { useState, useEffect } from 'react'
import axiosClient from '../../api/client'

const C = {
  primary: '#465aa3',
  primaryContainer: '#8ca0ee',
  onPrimaryContainer: '#1e347b',
  secondary: '#8a5108',
  secondaryContainer: '#fdb164',
  onSecondaryContainer: '#F2924B',
  tertiary: '#116b51',
  tertiaryContainer: '#E5FAF1',
  onTertiaryContainer: '#1F8A5F',
  surface: '#FBFBFF',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#f5f3fa',
  surfaceContainerHigh: '#e9e7ee',
  outline: '#E6E9F7',
  outlineVariant: '#c5c5d2',
  onSurface: '#34406E',
  onSurfaceVariant: '#6C7596',
  error: '#E2737A',
  errorContainer: '#FCEAEC',
  onErrorContainer: '#93000a',
  background: '#F4F5FA',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
)

export default function AnswerReview({ onNavigate }) {
  const [questions, setQuestions] = useState([])
  const [answerKey, setAnswerKey] = useState({})
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const saved = localStorage.getItem(`exam_answers_${user.id}_${today}`)
  const myAnswers = saved ? JSON.parse(atob(saved)) : {}

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, aRes] = await Promise.all([
          axiosClient.get(`/api/tests/questions/?date=${today}`),
          axiosClient.get(`/api/tests/answers/?date=${today}`),
        ])
        setQuestions(qRes.data.questions || [])
        setAnswerKey(aRes.data.correct_answers || {})
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Answer key is not available yet. Please check back between 2:00 PM and 7:00 PM.')
        } else {
          setError('Failed to load review data. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getOptionText = (q, label) => {
    const map = { A: q?.option_a, B: q?.option_b, C: q?.option_c, D: q?.option_d }
    return map[label] || label
  }

  const correct = questions.filter(q => {
    const qKey = `q${q.id}`
    return myAnswers[q.id] === answerKey[qKey]
  }).length

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.background }}>
      <div style={{ textAlign: 'center' }}>
        <Icon name="sync" size={40} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontFamily: 'Inter', fontSize: 15, color: C.onSurfaceVariant, marginTop: 12 }}>Loading answer review...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.background, padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ width: 80, height: 80, background: C.errorContainer, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon name="lock_clock" size={36} color={C.error} />
      </div>
      <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: C.onSurface, marginBottom: 8, textAlign: 'center' }}>Answer Key Locked</h2>
      <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
      <button onClick={() => onNavigate('dashboard')} style={{ padding: '12px 32px', background: C.primary, color: '#fff', border: 'none', borderRadius: 9999, fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        Return to Dashboard
      </button>
      <style>{`.fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>
    </div>
  )

  const q = questions[current]
  const qKey = `q${q?.id}`
  const myAnswer = myAnswers[q?.id]
  const correctAnswer = answerKey[qKey]
  const isCorrect = myAnswer === correctAnswer

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 50, background: C.surfaceContainer, borderBottom: `1px solid ${C.outline}30`, boxShadow: '0 1px 4px rgba(70,90,163,0.07)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 800, color: '#fff' }}>A</span>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>APPTIST</h1>
        </div>
      </header>

      <div style={{ height: 64 }} />

      <main style={{ flex: 1, padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

        {/* Score Summary */}
        <div style={{ width: '100%', background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 16, padding: 16, boxShadow: '0 4px 20px rgba(70,90,163,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: C.tertiary }}>{correct}</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correct</p>
            </div>
            <div style={{ width: 1, background: C.outline }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: C.error }}>{questions.length - correct}</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wrong</p>
            </div>
            <div style={{ width: 1, background: C.outline }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: C.primary }}>{questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0}%</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        {q && (
          <div style={{ width: '100%', background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(70,90,163,0.08)' }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: C.onSurface }}>Question {q.id}</h2>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, padding: '4px 12px', background: C.primaryContainer, borderRadius: 9999, color: C.onPrimaryContainer, border: `1px solid ${C.outline}`, whiteSpace: 'nowrap', marginTop: 4 }}>Quantitative Analysis</span>
              </div>
              <p style={{ fontFamily: 'Inter', fontSize: 16, color: C.onSurface, lineHeight: 1.65, marginBottom: 20 }}>{q.text}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Your Answer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: isCorrect ? C.tertiaryContainer : C.errorContainer, border: `1px solid ${isCorrect ? C.tertiary : C.error}25`, borderRadius: 14 }}>
                  <div>
                    <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, color: isCorrect ? C.onTertiaryContainer : C.onErrorContainer, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7, marginBottom: 4 }}>Your Answer</p>
                    <p style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: isCorrect ? C.onTertiaryContainer : C.onErrorContainer }}>
                      {myAnswer ? `${myAnswer} — ${getOptionText(q, myAnswer)}` : 'Not Answered'}
                    </p>
                  </div>
                  <Icon name={isCorrect ? 'check' : 'close'} size={26} fill color={isCorrect ? C.tertiary : C.error} />
                </div>

                {/* Correct Answer */}
                {!isCorrect && correctAnswer && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: C.tertiaryContainer, border: `1px solid ${C.tertiary}25`, borderRadius: 14 }}>
                    <div>
                      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, color: C.onTertiaryContainer, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7, marginBottom: 4 }}>Correct Answer</p>
                      <p style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: C.onTertiaryContainer }}>
                        {correctAnswer} — {getOptionText(q, correctAnswer)}
                      </p>
                    </div>
                    <Icon name="check" size={26} color={C.tertiary} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ width: '100%', display: 'flex', gap: 12 }}>
          <button
            disabled={current === 0}
            onClick={() => setCurrent(c => c - 1)}
            style={{ flex: 1, background: C.surfaceContainer, color: C.onSurfaceVariant, border: `1px solid ${C.outline}`, borderRadius: 9999, padding: '14px', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 500, cursor: current === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: current === 0 ? 0.5 : 1 }}
          >
            <Icon name="arrow_back" size={18} color={C.onSurfaceVariant} />
            Previous
          </button>
          <button
            disabled={current === questions.length - 1}
            onClick={() => setCurrent(c => c + 1)}
            style={{ flex: 1, background: C.primary, color: '#fff', border: 'none', borderRadius: 9999, padding: '14px', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 500, cursor: current === questions.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: current === questions.length - 1 ? 0.5 : 1 }}
          >
            Next
            <Icon name="arrow_forward" size={18} color="#fff" />
          </button>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.surfaceContainer, borderTop: `1px solid ${C.outline}30`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 16px 16px', zIndex: 50, borderRadius: '12px 12px 0 0', boxShadow: '0 -1px 4px rgba(70,90,163,0.05)' }}>
        <button onClick={() => onNavigate('dashboard')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 12px', background: 'none', border: 'none', color: C.onSurfaceVariant, fontFamily: 'JetBrains Mono', fontSize: 11, cursor: 'pointer' }}>
          <Icon name="home" size={24} color={C.onSurfaceVariant} />
          <span>Home</span>
        </button>
        <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 12px', background: 'none', border: 'none', color: C.primary, fontFamily: 'JetBrains Mono', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
          <div style={{ background: C.primaryContainer, borderRadius: 9999, padding: '4px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
            <Icon name="assignment" size={22} fill color={C.onPrimaryContainer} />
          </div>
          <span>Assessments</span>
        </button>
      </nav>

      <style>{`.fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>
    </div>
  )
}