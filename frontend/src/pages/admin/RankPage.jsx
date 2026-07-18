import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/client'
import BottomNav from '../../components/BottomNav'

const C = {
  primary: '#465aa3',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
  secondary: '#8a5108',
  secondaryContainer: '#FFEEDC',
  tertiary: '#116b51',
  tertiaryContainer: '#E5FAF1',
  onTertiaryContainer: '#1F8A5F',
  surface: '#FBFBFF',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#f5f3fa',
  surfaceContainerHigh: '#e9e7ee',
  outline: '#E6E9F7',
  outlineVariant: '#c5c5d2',
  onSurface: '#1b1b20',
  onSurfaceVariant: '#444651',
  background: '#f9f9f7',
  orange: '#E8621A',
  orangeContainer: '#FFF0E8',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span
    className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}
  >
    {name}
  </span>
)

const RANK_STYLES = {
  1: { bg: '#FFD700', text: '#7C6200', glow: 'rgba(255,215,0,0.3)' },
  2: { bg: '#C0C0C0', text: '#555', glow: 'rgba(192,192,192,0.3)' },
  3: { bg: '#CD7F32', text: '#5C3A1E', glow: 'rgba(205,127,50,0.3)' },
}

const PASTEL_COLORS = [
  '#EAEFFD', '#E5FAF1', '#FFEEDC', '#FCEAEC', '#F3E8FF',
  '#E0F2FE', '#FEF3C7', '#D1FAE5', '#EDE9FE', '#FEE2E2',
]

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PASTEL_COLORS[Math.abs(hash) % PASTEL_COLORS.length]
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase()
}

export default function RankPage() {
  const navigate = useNavigate()
  const [rankings, setRankings] = useState([])
  const [period, setPeriod] = useState('weekly')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [rankRes, statsRes] = await Promise.all([
          adminAPI.getRankings(20, period),
          adminAPI.getDashboardStats(),
        ])
        setRankings(rankRes.data.rankings || rankRes.data.results || rankRes.data || [])
        setStats(statsRes.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  const maxScore = Math.max(...rankings.map((r) => r.score || r.total_score || 0), 1)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.surfaceContainer, borderBottom: `1px solid ${C.outline}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(70,90,163,0.08)' }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <Icon name="arrow_back" size={22} color={C.onSurface} />
        </button>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: C.onSurface, flex: 1 }}>Rankings</h1>
      </header>

      <div style={{ height: 56 }} />

      <main style={{ flex: 1, padding: '16px 16px 110px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Period Toggle */}
        <div style={{ display: 'flex', background: C.surfaceContainerLow, borderRadius: 10, padding: 4, border: `1px solid ${C.outline}` }}>
          {['daily', 'weekly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
                fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: period === p ? C.primary : 'transparent',
                color: period === p ? '#fff' : C.onSurfaceVariant,
              }}
            >
              {p === 'daily' ? 'Daily' : 'Weekly'}
            </button>
          ))}
        </div>

        {/* Quick stats */}
        {stats && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="groups" size={20} color={C.primary} />
              <div>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: C.onSurface }}>{stats.total_students ?? 0}</p>
                <p style={{ fontFamily: 'Inter', fontSize: 10, color: C.onSurfaceVariant }}>Students</p>
              </div>
            </div>
            <div style={{ flex: 1, background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="quiz" size={20} color={C.tertiary} />
              <div>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: C.onSurface }}>{stats.tests_completed_today ?? 0}</p>
                <p style={{ fontFamily: 'Inter', fontSize: 10, color: C.onSurfaceVariant }}>Tests Today</p>
              </div>
            </div>
          </div>
        )}

        {/* Rankings */}
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, animation: 'pulse 2s ease infinite' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.surfaceContainerLow }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '50%', height: 12, borderRadius: 4, background: C.surfaceContainerLow, marginBottom: 6 }} />
                <div style={{ width: '30%', height: 8, borderRadius: 4, background: C.surfaceContainerLow }} />
              </div>
            </div>
          ))
        ) : rankings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Icon name="leaderboard" size={48} color={C.outlineVariant} style={{ display: 'block', marginBottom: 12 }} />
            <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>No rankings available yet</p>
          </div>
        ) : (
          rankings.map((entry, idx) => {
            const rank = entry.rank || idx + 1
            const score = entry.score || entry.total_score || 0
            const name = entry.student_name || entry.full_name || entry.student?.full_name || 'Unknown'
            const roll = entry.roll_number || entry.student?.roll_number || ''
            const avatarBg = getAvatarColor(name)
            const initials = getInitials(name)
            const rankStyle = RANK_STYLES[rank] || null
            const barWidth = (score / maxScore) * 100

            return (
              <div key={entry.id || idx} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: rankStyle ? `0 0 12px ${rankStyle.glow}` : 'none' }}>
                {/* Rank badge */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: rankStyle ? rankStyle.bg : C.surfaceContainerLow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700,
                    color: rankStyle ? rankStyle.text : C.onSurfaceVariant,
                  }}>#{rank}</span>
                </div>

                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700, color: C.onSurface }}>{initials}</span>
                </div>

                {/* Info + bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, color: C.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.onSurfaceVariant }}>{roll}</p>
                    </div>
                    <span style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, color: C.primary, flexShrink: 0 }}>{score}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: C.surfaceContainerLow, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barWidth}%`, borderRadius: 3, background: rankStyle ? rankStyle.bg : C.primary, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>

      <BottomNav active="rank" />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  )
}
