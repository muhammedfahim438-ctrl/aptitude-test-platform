import { useState } from 'react'

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
  outline: '#E6E9F7',
  onSurface: '#34406E',
  onSurfaceVariant: '#444651',
  error: '#E2737A',
  errorContainer: '#FCEAEC',
  onErrorContainer: '#93000a',
  background: '#faf8ff',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
)

export default function AssessmentDetails({ onNavigate }) {
  const [consented, setConsented] = useState(false)

  const params = [
    { icon: 'quiz', label: 'Total Questions', value: '20 Questions', bg: C.primaryContainer, color: C.onPrimaryContainer },
    { icon: 'schedule', label: 'Time Duration', value: '60 Minutes', bg: C.secondaryContainer, color: C.onSecondaryContainer },
    { icon: 'military_tech', label: 'Total Marks', value: '20 Marks', bg: C.tertiaryContainer, color: C.onTertiaryContainer },
    { icon: 'lock', label: 'Attempt Rule', value: 'Single Attempt Only', bg: C.errorContainer, color: C.onErrorContainer },
  ]

  const instructions = [
    { icon: 'info', text: 'Ensure your internet connection is stable before starting.' },
    { icon: 'warning', text: 'Do not refresh the page or switch browser tabs during the test.' },
    { icon: 'timer', text: 'The timer will start immediately and cannot be paused.' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.surfaceContainerLow, maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ width: '100%', position: 'sticky', top: 0, zIndex: 50, background: C.surfaceContainerLow, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: '50%' }}>
          <Icon name="arrow_back" color={C.onSurface} />
        </button>
        <p style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: C.primary }}>Apptist</p>
      </header>

      <main style={{ flex: 1, padding: '8px 16px 120px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: C.onSurface, lineHeight: 1.2 }}>Aptitude Assessment Details</h2>
          <p style={{ fontFamily: 'Inter', fontSize: 15, color: C.onSurfaceVariant }}>Nehru Group of Institutions</p>
        </div>

        {/* Parameters */}
        <div style={{ background: C.surface, borderRadius: 24, padding: 16, border: `1px solid ${C.outline}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Assessment Parameters</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {params.map(p => (
              <div key={p.label} style={{ background: p.bg, borderRadius: 16, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Icon name={p.icon} size={18} color={p.color} />
                  <span style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 600, color: p.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.label}</span>
                </div>
                <span style={{ fontFamily: 'Space Grotesk', fontSize: 17, fontWeight: 600, color: C.onSurface }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: '0.08em', textTransform: 'uppercase', paddingLeft: 4 }}>Instructions</p>
          {instructions.map(ins => (
            <div key={ins.text} style={{ background: C.surface, border: `1px solid ${C.outline}`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <Icon name={ins.icon} size={22} color={C.primary} />
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 15, color: C.onSurface, lineHeight: 1.5 }}>{ins.text}</p>
            </div>
          ))}
        </div>

        {/* Consent */}
        <div style={{ background: C.surface, border: `1px solid ${C.outline}`, borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <input
            type="checkbox"
            id="consent"
            checked={consented}
            onChange={e => setConsented(e.target.checked)}
            style={{ width: 22, height: 22, accentColor: C.primary, cursor: 'pointer' }}
          />
          <label htmlFor="consent" style={{ fontFamily: 'Space Grotesk', fontSize: 15, color: C.onSurface, cursor: 'pointer', lineHeight: 1.5 }}>
            I have read and understand the instructions.
          </label>
        </div>
      </main>

      {/* Start Button */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: `${C.surfaceContainerLow}dd`, backdropFilter: 'blur(12px)', padding: '16px 16px 28px' }}>
        <button
          disabled={!consented}
          onClick={() => onNavigate('exam')}
          style={{ width: '100%', background: '#8CA0EE', color: '#fff', border: 'none', borderRadius: 9999, padding: '16px 32px', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: consented ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', opacity: consented ? 1 : 0.5, boxShadow: consented ? '0 4px 16px rgba(70,90,163,0.25)' : 'none' }}
        >
          <span>START ASSESSMENT</span>
          <Icon name="arrow_forward" size={20} color="#fff" />
        </button>
      </div>

      <style>{`.fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>
    </div>
  )
}