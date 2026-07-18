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
  onSurface: '#1b1b20',
  onSurfaceVariant: '#444651',
  error: '#E2737A',
  errorContainer: '#ffdad6',
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

const NAV_TILES = [
  { key: 'stats', label: 'Stats', icon: 'analytics', path: '/admin/stats', color: C.primary, bg: C.primaryContainer },
  { key: 'rank', label: 'Rank', icon: 'leaderboard', path: '/admin/rank', color: C.tertiary, bg: C.tertiaryContainer },
  { key: 'library', label: 'Library', icon: 'inventory_2', path: '/admin/questions', color: C.secondary, bg: C.secondaryContainer },
  { key: 'reports', label: 'Reports', icon: 'assessment', path: '/admin/reports', color: C.orange, bg: C.orangeContainer },
]

const QUICK_ACTIONS = [
  { label: 'Upload Questions', icon: 'upload_file', path: '/admin/questions/upload', color: C.primary, bg: C.primaryContainer },
  { label: 'View Scorers', icon: 'leaderboard', path: '/admin/rank', color: C.tertiary, bg: C.tertiaryContainer },
  { label: 'Analytics', icon: 'monitoring', path: '/admin/stats', color: C.orange, bg: C.orangeContainer },
  { label: 'Download Report', icon: 'download', path: '/admin/reports', color: C.secondary, bg: C.secondaryContainer },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalStudents: 0, testsCompletedToday: 0, questionsLiveToday: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getDashboardStats()
        const d = res.data
        setStats({
          totalStudents: d.total_students ?? d.totalStudents ?? 0,
          testsCompletedToday: d.tests_completed_today ?? d.testsCompletedToday ?? 0,
          questionsLiveToday: d.questions_live_today ?? d.questionsLiveToday ?? 0,
        })
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    navigate('/admin/login')
  }

  const firstName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user'))
      return u?.full_name?.split(' ')[0] || 'Teacher'
    } catch {
      return 'Teacher'
    }
  })()

  const metricCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: 'groups', color: C.primary, bg: C.primaryContainer },
    { label: 'Tests Completed Today', value: stats.testsCompletedToday, icon: 'quiz', color: C.tertiary, bg: C.tertiaryContainer },
    { label: 'Questions Live Today', value: stats.questionsLiveToday, icon: 'help_outline', color: C.orange, bg: C.orangeContainer },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.surfaceContainer, borderBottom: `1px solid ${C.outline}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(70,90,163,0.08)' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 600, color: C.onSurface }}>Admin Dashboard</h1>
          <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 }}>Welcome, {firstName}</p>
        </div>
        <button onClick={handleLogout} style={{ background: C.surfaceContainerLow, border: `1px solid ${C.outline}`, borderRadius: 10, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="logout" size={20} color={C.onSurfaceVariant} />
        </button>
      </header>

      <div style={{ height: 64 }} />

      <main style={{ flex: 1, padding: '20px 16px 110px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Nav Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {NAV_TILES.map((tile) => (
            <button
              key={tile.key}
              onClick={() => navigate(tile.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                background: tile.bg, border: 'none', borderRadius: 14, padding: '14px 4px',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Icon name={tile.icon} size={26} color={tile.color} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, color: tile.color, letterSpacing: '0.03em' }}>{tile.label}</span>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600, color: C.onSurface, marginBottom: 10 }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: C.surfaceContainer, border: `1px solid ${C.outline}`,
                  borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(70,90,163,0.06)',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={action.icon} size={20} color={action.color} />
                </div>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600, color: C.onSurface, textAlign: 'left' }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards */}
        <div>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600, color: C.onSurface, marginBottom: 10 }}>Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: C.surfaceContainerLow, animation: 'pulse 2s ease infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: '60%', height: 10, borderRadius: 4, background: C.surfaceContainerLow, marginBottom: 6, animation: 'pulse 2s ease infinite' }} />
                    <div style={{ width: '30%', height: 20, borderRadius: 4, background: C.surfaceContainerLow, animation: 'pulse 2s ease infinite' }} />
                  </div>
                </div>
              ))
            ) : (
              metricCards.map((card) => (
                <div key={card.label} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(70,90,163,0.06)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={card.icon} size={24} color={card.color} />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Inter', fontSize: 12, color: C.onSurfaceVariant }}>{card.label}</p>
                    <p style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: C.onSurface }}>{card.value}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav active="home" />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  )
}
