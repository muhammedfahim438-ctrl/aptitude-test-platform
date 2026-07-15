import { useState } from 'react'
import axiosClient from '../../api/client'

const C = {
  primary: '#465aa3', primaryContainer: '#EAEFFD', onPrimaryContainer: '#1e347b',
  secondary: '#8a5108', secondaryContainer: '#FFEEDC', onSecondaryContainer: '#F2924B',
  tertiary: '#116b51', tertiaryContainer: '#E5FAF1', onTertiaryContainer: '#1F8A5F',
  surface: '#FBFBFF', surfaceContainer: '#FFFFFF', surfaceContainerLow: '#f5f3fa',
  surfaceContainerHigh: '#e9e7ee', outline: '#E6E9F7', outlineVariant: '#c5c5d2',
  onSurface: '#34406E', onSurfaceVariant: '#6C7596', error: '#E2737A',
  errorContainer: '#FCEAEC', onErrorContainer: '#93000a',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
)

export default function SubmitPage({ onNavigate }) {
  const total = 20
  const today = new Date().toISOString().split('T')[0]
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const saved = localStorage.getItem(`exam_answers_${user.id}_${today}`)
  const answers = saved ? JSON.parse(atob(saved)) : {}
  const answeredNums = Object.keys(answers).map(Number)
  const answered = answeredNums.length
  const unanswered = total - answered
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      onNavigate('processing')
      await axiosClient.post('/api/tests/submit/', {
        exam_date: today,
        answers,
      })
      localStorage.removeItem(`exam_answers_${user.id}_${today}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.surface, maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.surfaceContainer, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.outline}` }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.primaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="person" size={18} color={C.primary} />
        </div>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: C.primary }}>NGI Portal</span>
        <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="more_vert" color={C.onSurface} />
        </button>
      </header>

      <main style={{ flex: 1, padding: '20px 16px 120px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 600, color: C.primary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Assessment Navigation</p>

        {/* Palette */}
        <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 20, padding: 16, boxShadow: '0 4px 20px rgba(70,90,163,0.10)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.tertiary }} />
              <span style={{ fontFamily: 'Inter', fontSize: 13, color: C.onSurfaceVariant }}>Answered: {answered}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.onSecondaryContainer }} />
              <span style={{ fontFamily: 'Inter', fontSize: 13, color: C.onSurfaceVariant }}>Pending: {unanswered}</span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 600, color: C.primary }}>Total: {total}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {Array.from({ length: total }, (_, i) => {
              const num = i + 1
              const isAnswered = answeredNums.includes(num)
              return (
                <button
                  key={num}
                  onClick={() => onNavigate('exam')}
                  style={{ width: '100%', aspectRatio: '1', borderRadius: 12, background: isAnswered ? C.tertiaryContainer : C.secondaryContainer, color: isAnswered ? C.onTertiaryContainer : C.onSecondaryContainer, border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, transition: 'transform 0.15s' }}
                >
                  {num}
                </button>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>Questions Answered: <strong style={{ color: C.onSurface }}>{answered}</strong></span>
          <span style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>Unanswered: <strong style={{ color: C.error }}>{unanswered}</strong></span>
        </div>

        {/* All answered banner */}
        {unanswered === 0 && (
          <div style={{ background: C.tertiaryContainer, border: `1px solid ${C.tertiary}30`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="check_circle" fill size={22} color={C.tertiary} />
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, color: C.onTertiaryContainer }}>All questions are answered</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: C.errorContainer, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
            <Icon name="error" size={18} color={C.error} />
            <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onErrorContainer }}>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: '100%', background: C.primary, color: '#fff', border: 'none', borderRadius: 9999, padding: '16px', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Submitting...' : 'Submit Test Now'}
          </button>
          <button
            onClick={() => onNavigate('exam')}
            style={{ width: '100%', background: 'transparent', color: C.onSurface, border: `1.5px solid ${C.outlineVariant}`, borderRadius: 9999, padding: '16px', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Return to Review
          </button>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.surfaceContainer, borderTop: `1px solid ${C.outline}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 16px 16px', zIndex: 50 }}>
        {[['home', 'Home', false], ['assignment', 'Assessments', true], ['history', 'History', false], ['person', 'Profile', false]].map(([icon, label, active]) => (
          <button key={label} onClick={() => onNavigate('dashboard')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 16px', borderRadius: 9999, cursor: 'pointer', background: active ? C.primaryContainer : 'none', border: 'none', color: active ? C.onPrimaryContainer : C.onSurfaceVariant, fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500 }}>
            <Icon name={icon} size={22} fill={active} color={active ? C.onPrimaryContainer : C.onSurfaceVariant} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}