import { useState, useEffect } from 'react'

const C = {
  primary: '#465aa3',
  primaryContainer: '#8ca0ee',
  onPrimaryContainer: '#1e347b',
  secondary: '#8a5108',
  secondaryContainer: '#fdb164',
  surface: '#FBFBFF',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#f5f3fa',
  surfaceContainerHighest: '#e3e1e8',
  outline: '#E6E9F7',
  outlineVariant: '#c5c5d2',
  onSurface: '#1b1b20',
  onSurfaceVariant: '#444651',
  background: '#f5f3fa',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
)

export default function ProcessingPage({ onNavigate }) {
  const [progress, setProgress] = useState(10)

  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(t)
          setTimeout(() => onNavigate('success'), 500)
          return 100
        }
        return p + 2
      })
    }, 60)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ background: C.surface, padding: '0 16px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${C.outlineVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.primaryContainer }}>
            <Icon name="person" size={18} color={C.onPrimaryContainer} />
          </div>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.primary }}>Apptist</span>
        </div>
      </header>

      <main style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600, color: C.primary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Submission Processing</p>

        <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden', boxShadow: '0 4px 16px rgba(70,90,163,0.10)' }}>

          {/* Background glow */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: '#dce1ff', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.5, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, position: 'relative', zIndex: 1 }}>

            {/* Spinner */}
            <div style={{ position: 'relative', width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid rgba(140,160,238,0.2)`, animation: 'pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid rgba(70,90,163,0.4)`, animation: 'pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite', animationDelay: '0.5s' }} />
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.primaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(70,90,163,0.2)' }}>
                <Icon name="sync" size={30} color={C.onPrimaryContainer} style={{ animation: 'spin 1.2s linear infinite' }} />
              </div>
            </div>

            {/* Text */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: C.onSurface, marginBottom: 6 }}>Submitting your test</h2>
              <p style={{ fontFamily: 'Inter', fontSize: 15, color: C.onSurfaceVariant, maxWidth: 260, margin: '0 auto', lineHeight: 1.5 }}>Please wait while we securely save your responses.</p>
            </div>

            {/* Warning */}
            <div style={{ width: '100%', background: 'rgba(253,177,100,0.3)', border: `1px solid rgba(138,81,8,0.2)`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Icon name="warning" color={C.secondary} style={{ marginTop: 2 }} />
              <div>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>⚠️ 6 Questions remaining unanswered</p>
                <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.5 }}>This may affect your final assessment score. Processing will continue momentarily.</p>
              </div>
            </div>

            {/* Progress */}
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600, color: C.primary }}>{Math.min(progress, 100)}% Complete</span>
              </div>
              <div style={{ height: 8, background: C.surfaceContainerHighest, borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(progress, 100)}%`, borderRadius: 9999, transition: 'width 0.2s ease', background: C.primary, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.8s infinite linear' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.surfaceContainer, borderTop: `1px solid ${C.outline}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 16px 16px', zIndex: 50, borderRadius: '12px 12px 0 0' }}>
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 16px', background: 'none', border: 'none', color: C.onSurfaceVariant, fontFamily: 'JetBrains Mono', fontSize: 11, cursor: 'pointer' }}>
          <Icon name="home" size={22} color={C.onSurfaceVariant} />
          <span>Home</span>
        </button>
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 16px', background: 'none', border: 'none', color: C.primary, fontFamily: 'JetBrains Mono', fontSize: 11, cursor: 'pointer' }}>
          <div style={{ background: '#dce1ff', borderRadius: 9999, padding: '4px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
            <Icon name="assignment" size={22} fill color={C.onPrimaryContainer} />
          </div>
          <span>Assessments</span>
        </button>
      </nav>

      <style>{`
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0% { transform: scale(0.85); opacity: 0.6; } 80%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  )
}