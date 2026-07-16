import { useEffect, useState } from 'react'

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
  onErrorContainer: '#93000a',
  background: '#faf8ff',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span
    className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}
  >
    {name}
  </span>
)

export default function Dashboard({ onNavigate }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    onNavigate('login')
  }

  const firstName = user?.full_name?.split(' ')[0] || 'Student'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 50, background: C.surfaceContainer, borderBottom: `1px solid ${C.outline}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(70,90,163,0.08)' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 600, color: C.primary }}>Student Dashboard</h1>
      </header>

      <div style={{ height: 64 }} />

      <main style={{ flex: 1, padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profile Card */}
        <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(70,90,163,0.08)' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, color: C.onSurface }}>Welcome Back, {firstName}</h2>
            <div style={{ background: C.tertiaryContainer, color: C.onTertiaryContainer, borderRadius: 9999, padding: '4px 14px', fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 600 }}>
              {user?.department || 'CSE-A'}
            </div>
            <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>
              Reg No: <span style={{ color: C.onSurface, fontWeight: 600 }}>{user?.roll_number || 'NGI2026CS045'}</span>
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.surfaceContainerLow, border: `1px solid ${C.outline}`, borderRadius: 10, padding: '6px 12px' }}>
                <Icon name="school" size={18} color={C.primary} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: C.onSurfaceVariant }}>{user?.year || '4th Year'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.surfaceContainerLow, border: `1px solid ${C.outline}`, borderRadius: 10, padding: '6px 12px' }}>
                <Icon name="event" size={18} color={C.primary} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: C.onSurfaceVariant }}>{user?.semester || 'Semester 7'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Card */}
        <div
          onClick={() => onNavigate('assessment-details')}
          style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 16, padding: 20, cursor: 'pointer', boxShadow: '0 1px 4px rgba(70,90,163,0.08)', transition: 'all 0.2s', position: 'relative' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ padding: 12, background: C.primaryContainer, borderRadius: 14 }}>
              <Icon name="assignment" size={32} color={C.primary} />
            </div>
            <Icon name="north_east" color={C.onSurfaceVariant} />
          </div>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 600, color: C.onSurface, marginBottom: 6 }}>Assessment</h3>
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant, marginBottom: 14, lineHeight: 1.5 }}>View and manage your current assignments, internal marks, and upcoming deadlines.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.error, animation: 'pulse 2s ease infinite' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: C.error }}>3 Pending Tasks</span>
          </div>
        </div>

        {/* Answer Review Card */}
        <div
          onClick={() => onNavigate('answer-review')}
          style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 16, padding: 20, cursor: 'pointer', boxShadow: '0 1px 4px rgba(70,90,163,0.08)', transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ padding: 12, background: C.secondaryContainer, borderRadius: 14 }}>
              <Icon name="library_books" size={32} color={C.secondary} />
            </div>
            <Icon name="north_east" color={C.onSurfaceVariant} />
          </div>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 600, color: C.onSurface, marginBottom: 6 }}>Answer Review</h3>
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant, marginBottom: 14, lineHeight: 1.5 }}>Access a detailed breakdown of your performance, including correct answers and explanations.</p>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: C.onSurfaceVariant }}>Review your results</span>
        </div>

        {/* Logout Card */}
        <div style={{ background: C.surfaceContainer, border: `1.5px dashed ${C.outlineVariant}`, borderRadius: 16, padding: 20 }}>
          <div style={{ padding: 12, background: C.surfaceContainerLow, borderRadius: 14, display: 'inline-flex', marginBottom: 12 }}>
            <Icon name="logout" size={32} color={C.onSurfaceVariant} />
          </div>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 600, color: C.onSurface, marginBottom: 6 }}>Logout</h3>
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant, marginBottom: 14, lineHeight: 1.5 }}>Securely end your current session. All unsaved progress in assessments will be lost.</p>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '10px', background: C.surfaceContainerHigh, border: 'none', borderRadius: 10, fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, color: C.onSurface, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Sign Out
          </button>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.surfaceContainer, borderTop: `1px solid ${C.outline}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 16px 16px', zIndex: 50, boxShadow: '0 -4px 16px rgba(70,90,163,0.05)' }}>
        {[
          ['home', 'Home', true],
          ['assignment', 'Assessments', false],
        ].map(([icon, label, active]) => (
          <button
            key={label}
            onClick={() => active ? null : onNavigate('assessment-details')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: active ? '4px 16px' : '6px 12px', borderRadius: 9999, cursor: 'pointer', background: 'none', border: 'none', color: active ? C.onPrimaryContainer : C.onSurfaceVariant, fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500 }}
          >
            {active ? (
              <div style={{ background: C.primaryContainer, borderRadius: 9999, padding: '4px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                <Icon name={icon} size={22} fill color={C.onPrimaryContainer} />
              </div>
            ) : (
              <Icon name={icon} size={22} color={C.onSurfaceVariant} />
            )}
            <span style={{ color: active ? C.primary : C.onSurfaceVariant }}>{label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}