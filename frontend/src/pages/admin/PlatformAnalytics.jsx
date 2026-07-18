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
  outline: '#E6E9F7',
  outlineVariant: '#c5c5d2',
  onSurface: '#1b1b20',
  onSurfaceVariant: '#444651',
  error: '#E2737A',
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

function DonutChart({ data, size = 180 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const radius = (size - 20) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  let cumulative = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const pct = d.value / total
        const dashLength = circumference * pct
        const dashOffset = circumference * (1 - cumulative)
        cumulative += pct
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={16}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'all 0.5s ease' }}
          />
        )
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fontFamily="Space Grotesk" fontSize={26} fontWeight={700} fill={C.onSurface}>{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={11} fill={C.onSurfaceVariant}>Total</text>
    </svg>
  )
}

function HourlyChart({ data, width = 360, height = 160 }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const padding = { top: 10, right: 10, bottom: 30, left: 10 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const barW = Math.floor(chartW / data.length) - 4

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const barH = (d.value / max) * chartH
        const x = padding.left + i * (chartW / data.length) + 2
        const y = padding.top + chartH - barH
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={d.value > 0 ? C.primary : C.surfaceContainerLow}
              opacity={d.value > 0 ? 1 : 0.3}
              style={{ transition: 'all 0.4s ease' }}
            />
            <text
              x={x + barW / 2}
              y={height - 6}
              textAnchor="middle"
              fontFamily="JetBrains Mono"
              fontSize={9}
              fill={C.onSurfaceVariant}
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function PlatformAnalytics() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getDashboardStats()
        setStats(res.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const donutData = [
    { label: 'Students', value: stats?.total_students ?? 0, color: C.primary },
    { label: 'Tests Today', value: stats?.tests_completed_today ?? 0, color: C.tertiary },
    { label: 'Questions', value: stats?.questions_live_today ?? 0, color: C.orange },
  ]

  const hourlyData = (() => {
    if (stats?.hourly_distribution) {
      return Object.entries(stats.hourly_distribution).map(([hour, val]) => ({
        label: `${hour}h`,
        value: val,
      }))
    }
    return [
      { label: '9a', value: 0 }, { label: '10a', value: 12 }, { label: '11a', value: 35 },
      { label: '12p', value: 58 }, { label: '1p', value: 42 }, { label: '2p', value: 8 },
      { label: '3p', value: 3 }, { label: '4p', value: 1 },
    ]
  })()

  const metrics = [
    { label: 'Total Students', value: stats?.total_students ?? 0, icon: 'groups', color: C.primary, bg: C.primaryContainer },
    { label: 'Tests Completed', value: stats?.tests_completed_today ?? 0, icon: 'quiz', color: C.tertiary, bg: C.tertiaryContainer },
    { label: 'Active Questions', value: stats?.questions_live_today ?? 0, icon: 'help_outline', color: C.orange, bg: C.orangeContainer },
    { label: 'Avg. Score', value: stats?.avg_score ?? '--', icon: 'trending_up', color: C.secondary, bg: C.secondaryContainer },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.surfaceContainer, borderBottom: `1px solid ${C.outline}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(70,90,163,0.08)' }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <Icon name="arrow_back" size={22} color={C.onSurface} />
        </button>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: C.onSurface }}>Platform Analytics</h1>
      </header>

      <div style={{ height: 56 }} />

      <main style={{ flex: 1, padding: '20px 16px 110px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 14, animation: 'pulse 2s ease infinite' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.surfaceContainerLow }} />
              </div>
            ))
          ) : (
            metrics.map((m) => (
              <div key={m.label} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 14, boxShadow: '0 1px 4px rgba(70,90,163,0.06)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon name={m.icon} size={20} color={m.color} />
                </div>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: C.onSurface }}>{m.value}</p>
                <p style={{ fontFamily: 'Inter', fontSize: 11, color: C.onSurfaceVariant }}>{m.label}</p>
              </div>
            ))
          )}
        </div>

        {/* Donut Chart */}
        <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(70,90,163,0.06)' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, color: C.onSurface, alignSelf: 'flex-start' }}>Distribution</h3>
          {loading ? (
            <div style={{ width: 180, height: 180, borderRadius: '50%', background: C.surfaceContainerLow, animation: 'pulse 2s ease infinite' }} />
          ) : (
            <DonutChart data={donutData} />
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {donutData.map((d) => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Chart */}
        <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(70,90,163,0.06)' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, color: C.onSurface, marginBottom: 14 }}>Hourly Activity</h3>
          {loading ? (
            <div style={{ width: '100%', height: 160, borderRadius: 8, background: C.surfaceContainerLow, animation: 'pulse 2s ease infinite' }} />
          ) : (
            <HourlyChart data={hourlyData} />
          )}
        </div>
      </main>

      <BottomNav active="stats" />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  )
}
