const C = {
  primary: '#465aa3',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
  secondary: '#8a5108',
  secondaryContainer: '#FFEEDC',
  onSecondaryContainer: '#754300',
  tertiary: '#116b51',
  tertiaryContainer: '#E5FAF1',
  onTertiaryContainer: '#1F8A5F',
  surface: '#FBFBFF',
  surfaceContainer: '#efedf4',
  outline: '#E6E9F7',
  onSurface: '#1b1b20',
  onSurfaceVariant: '#444651',
  background: '#faf8ff',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
)

export default function SuccessPage({ onNavigate }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.surface, padding: '32px 16px', maxWidth: 480, margin: '0 auto' }}>

      <main style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

        {/* Check */}
        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.4s ease-out both' }}>
          <div style={{ width: 96, height: 96, background: C.tertiaryContainer, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(17,107,81,0.15)', animation: 'checkPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
            <Icon name="check_circle" fill size={52} color={C.tertiary} />
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: C.onSurface, marginBottom: 8 }}>Test Submitted!</h1>
          <p style={{ fontFamily: 'Inter', fontSize: 15, color: C.onSurfaceVariant, maxWidth: 260, margin: '0 auto', lineHeight: 1.6 }}>Your responses have been successfully recorded.</p>
        </div>

        {/* Overview */}
        <div style={{ width: '100%', background: C.surfaceContainer, borderRadius: 16, padding: 24, animation: 'fadeInUp 0.4s ease-out 0.1s both', boxShadow: '0 1px 4px rgba(70,90,163,0.05)' }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 600, color: C.tertiary, borderBottom: `1px solid ${C.outline}`, paddingBottom: 12, marginBottom: 14 }}>Submission Overview</h2>
          {[
            ['Student Name', user?.full_name || 'Student'],
            ['Reg No', user?.roll_number || ''],
            ['Exam Date', today],
            ['Status', 'Submitted Successfully'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.outline}` }}>
              <span style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>{label}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 500, color: C.onSurface }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div style={{ width: '100%', background: C.secondaryContainer, border: `1px solid rgba(138,81,8,0.15)`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, animation: 'fadeInUp 0.4s ease-out 0.15s both' }}>
          <Icon name="info" color={C.secondary} />
          <div>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: C.onSecondaryContainer, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Scores Gated Until Deadline</p>
            <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onSecondaryContainer, lineHeight: 1.5, opacity: 0.8 }}>Your score and answer key will be unlocked only after the official exam deadline passes for all students. Kindly visit after the deadline period.</p>
          </div>
        </div>

        {/* Return Button */}
        <div style={{ width: '100%', animation: 'fadeInUp 0.4s ease-out 0.2s both' }}>
          <button
            onClick={() => onNavigate('dashboard')}
            style={{ width: '100%', background: C.primary, color: '#fff', border: 'none', borderRadius: 9999, padding: '16px 32px', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 500, letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(70,90,163,0.25)', transition: 'all 0.2s' }}
          >
            <Icon name="home" size={20} color="#fff" />
            Return to Portal
          </button>
        </div>
      </main>

      <style>{`
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes checkPop { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  )
}