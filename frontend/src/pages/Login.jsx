import { useState } from 'react'
import axiosClient from '../api/client'

const C = {
  primary: '#465aa3',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
  primaryLight: '#8CA0EE',
  secondary: '#8a5108',
  secondaryContainer: '#FFEEDC',
  onSecondaryContainer: '#F2924B',
  tertiary: '#116b51',
  surface: '#FBFBFF',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#f5f3fa',
  outline: '#E6E9F7',
  outlineVariant: '#c5c5d2',
  onSurface: '#1b1b20',
  onSurfaceVariant: '#444651',
  error: '#E2737A',
  errorContainer: '#FCEAEC',
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

const InputField = ({ label, value, onChange, placeholder, type = 'text', showCheck = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>
    <div style={{ background: C.surfaceContainer, borderRadius: 8, border: `1.5px solid ${C.outline}`, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter', fontSize: 15, color: C.onSurface, width: '100%' }}
      />
      {showCheck && value && <Icon name="check_circle" fill size={18} color={C.tertiary} />}
    </div>
  </div>
)

export default function LoginPage({ onLogin, onNavigate }) {
  const [form, setForm] = useState({
    full_name: '',
    roll_number: '',
    department: '',
    year: '',
    semester: '',
    email: '',
    mobile: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = field => value => setForm(prev => ({ ...prev, [field]: value }))

  const handleSignIn = async () => {
    setError('')
    if (!form.full_name || !form.roll_number || !form.email) {
      setError('Full name, roll number and email are required.')
      return
    }
    if (!form.email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      const res = await axiosClient.post('/api/auth/student-signin/', {
        full_name: form.full_name,
        roll_number: form.roll_number,
        department: form.department,
        email: form.email,
        mobile: form.mobile,
        year: form.year,
        semester: form.semester,
      })
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      onLogin()
    } catch (err) {
      setError(err.response?.data?.detail || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ background: C.surface, padding: '0 16px', height: 64, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(70,90,163,0.3)' }}>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 800, color: '#fff' }}>A</span>
          </div>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: C.primary }}>Apptist</span>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        {/* College Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: C.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(70,90,163,0.12)', border: '4px solid #fff', overflow: 'hidden' }}>
            <span style={{ fontSize: 56 }}>🎓</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 700, color: C.onSurface, marginBottom: 4 }}>Welcome</h1>
            <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>Nehru Group of Institutions · Aptitude Portal</p>
          </div>
        </div>

        {/* Form Card */}
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 8px 20px rgba(70,90,163,0.08)' }}>

          <InputField
            label="Student Full Name"
            value={form.full_name}
            onChange={update('full_name')}
            placeholder="Enter your full name"
            showCheck
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <InputField
              label="Reg No."
              value={form.roll_number}
              onChange={update('roll_number')}
              placeholder="NGI2026CS045"
              showCheck
            />
            <InputField
              label="Department"
              value={form.department}
              onChange={update('department')}
              placeholder="CSE-A"
              showCheck
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Year</label>
              <select
                value={form.year}
                onChange={e => update('year')(e.target.value)}
                style={{ background: C.surfaceContainer, borderRadius: 8, border: `1.5px solid ${C.outline}`, padding: '10px 12px', fontFamily: 'Inter', fontSize: 14, color: C.onSurface, outline: 'none', width: '100%' }}
              >
                <option value="">Select</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Semester</label>
              <select
                value={form.semester}
                onChange={e => update('semester')(e.target.value)}
                style={{ background: C.surfaceContainer, borderRadius: 8, border: `1.5px solid ${C.outline}`, padding: '10px 12px', fontFamily: 'Inter', fontSize: 14, color: C.onSurface, outline: 'none', width: '100%' }}
              >
                <option value="">Select</option>
                <option value="Semester 1">Sem 1</option>
                <option value="Semester 2">Sem 2</option>
                <option value="Semester 3">Sem 3</option>
                <option value="Semester 4">Sem 4</option>
                <option value="Semester 5">Sem 5</option>
                <option value="Semester 6">Sem 6</option>
              </select>
            </div>
          </div>

          <InputField
            label="Email"
            value={form.email}
            onChange={update('email')}
            placeholder="your@ngi.edu.in"
            type="email"
            showCheck
          />

          <InputField
            label="Mobile Number"
            value={form.mobile}
            onChange={update('mobile')}
            placeholder="+91 98765 43210"
            type="tel"
            showCheck
          />

          {error && (
            <div style={{ background: C.errorContainer, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="error" size={16} color={C.error} />
              <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onErrorContainer }}>{error}</p>
            </div>
          )}
        </div>

        {/* Warning */}
        <div style={{ width: '100%', background: '#fff8ee', border: `1px solid rgba(138,81,8,0.2)`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="info" size={20} color={C.secondary} />
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.5 }}>Please verify your details before starting the assessment. Contact admin if any information is incorrect.</p>
        </div>

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{ width: '100%', background: loading ? C.primaryLight : C.primary, color: '#fff', border: 'none', borderRadius: 9999, padding: '16px', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 500, letterSpacing: '0.05em', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(70,90,163,0.25)', transition: 'all 0.2s' }}
        >
          {loading && <Icon name="sync" size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  )
}