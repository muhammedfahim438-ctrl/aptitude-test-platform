import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import StudentBottomNav from '../../components/StudentBottomNav'
import { studentAPI } from '../../api/client'

const C = {
  primary: '#465aa3', primaryLight: '#8CA0EE', bg: '#f9f9f7', card: '#ffffff',
  text: '#1a1a2e', textMuted: '#6b7280', success: '#10b981', warning: '#f59e0b',
  danger: '#ef4444', border: '#e5e7eb', surfaceContainer: '#f5f3fa',
  errorContainer: '#FCEAEC', primaryContainer: '#EAEFFD',
}

const Icon = ({ name, size = 24, color, style = {} }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
)

function formatDate(d) {
  return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try { setUser(jwtDecode(token)) } catch { setUser(null) }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function fetchDashboard() {
      setLoading(true)
      setError(null)
      try {
        const res = await studentAPI.getDashboard()
        if (!cancelled) setData(res.data)
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || 'Failed to load dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDashboard()
    return () => { cancelled = true }
  }, [])

  const examCardState = () => {
    if (!data) return null
    const s = data.today_status
    const score = data.today?.score
    const total = data.today?.total_questions || 20

    if (s === 'before_window') {
      return {
        icon: 'schedule', iconColor: C.primary, iconBg: C.primaryContainer,
        title: 'Exam starts at 10:00 AM',
        subtitle: 'Get ready! The aptitude test window opens soon.',
        btnLabel: null,
      }
    }
    if (s === 'in_progress') {
      return {
        icon: 'play_circle', iconColor: '#059669', iconBg: '#E5FAF1',
        title: 'Exam in Progress',
        subtitle: 'The exam window is open. Take the test now!',
        btnLabel: 'Start Exam', btnAction: () => navigate('/student/exam'), btnColor: '#059669',
      }
    }
    if (s === 'submitted') {
      return {
        icon: 'check_circle', iconColor: C.warning, iconBg: '#FFF8EE',
        title: 'Exam Submitted',
        subtitle: 'Awaiting results after 2:00 PM IST.',
        btnLabel: null,
      }
    }
    if (s === 'reviewed') {
      return {
        icon: 'emoji_events', iconColor: '#059669', iconBg: '#E5FAF1',
        title: `Score: ${score}/${total}`,
        subtitle: 'Your results are ready. Review your answers!',
        btnLabel: 'View Result', btnAction: () => navigate('/student/review'), btnColor: C.primary,
      }
    }
    if (s === 'missed') {
      return {
        icon: 'event_busy', iconColor: C.danger, iconBg: C.errorContainer,
        title: 'Missed Today\'s Exam',
        subtitle: 'The exam window has closed. Come back tomorrow!',
        btnLabel: null,
      }
    }
    return null
  }

  const card = examCardState()
  const name = user?.full_name || 'Student'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <header style={{ background: C.card, padding: '16px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.textMuted, marginBottom: 2 }}>Welcome back,</p>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>{name}</h1>
        <p style={{ fontFamily: 'Inter', fontSize: 12, color: C.textMuted, marginTop: 4 }}>{formatDate(new Date())}</p>
      </header>

      <main style={{ padding: '16px', paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>
            <Icon name="hourglass_top" size={32} color={C.primary} />
            <p style={{ marginTop: 8, fontSize: 14 }}>Loading dashboard...</p>
          </div>
        )}

        {error && (
          <div style={{ background: C.errorContainer, borderRadius: 12, padding: 16, color: '#93000a', fontSize: 14 }}>
            {error}
          </div>
        )}

        {!loading && card && (
          <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={card.icon} size={26} color={card.iconColor} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{card.title}</h2>
                <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.textMuted, margin: 0, marginTop: 2 }}>{card.subtitle}</p>
              </div>
            </div>
            {card.btnLabel && (
              <button
                onClick={card.btnAction}
                style={{
                  width: '100%', background: card.btnColor, color: '#fff', border: 'none',
                  borderRadius: 999, padding: '13px', fontFamily: 'Space Grotesk', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer', marginTop: 4,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                {card.btnLabel}
              </button>
            )}
          </div>
        )}

        {!loading && data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: C.card, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', margin: 0 }}>Exams Taken</p>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, color: C.primary, margin: '4px 0 0' }}>{data.total_exams_taken}</p>
            </div>
            <div style={{ background: C.card, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', margin: 0 }}>Avg Score</p>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, color: C.primary, margin: '4px 0 0' }}>
                {data.average_score !== null ? `${data.average_score}` : '--'}
              </p>
            </div>
          </div>
        )}

        {!loading && data && data.recent_scores.length > 0 && (
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10 }}>Recent Scores</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.recent_scores.map((item) => {
                const pct = Math.round((item.score / item.total_questions) * 100)
                return (
                  <div key={item.date} style={{ background: C.card, borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{dayLabel(item.date)}</p>
                      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.textMuted, margin: '2px 0 0' }}>{item.score}/{item.total_questions}</p>
                    </div>
                    <div style={{ width: 80, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? C.success : pct >= 50 ? C.warning : C.danger, borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && data && data.recent_scores.length === 0 && (
          <div style={{ background: C.card, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <Icon name="quiz" size={32} color={C.textMuted} />
            <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.textMuted, marginTop: 8 }}>No scores yet — take your first exam today!</p>
          </div>
        )}
      </main>

      <StudentBottomNav />
    </div>
  )
}
