import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { authAPI } from '../../api/client'

const C = {
  primary: '#465aa3',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
  primaryLight: '#8CA0EE',
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
  background: '#f9f9f7',
  orange: '#E8621A',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span
    className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}
  >
    {name}
  </span>
)

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.login(email, password)
      const { access, refresh, user } = res.data

      const decoded = jwtDecode(access)
      if (!decoded.is_teacher) {
        setError('This portal is for teacher/admin accounts only.')
        setLoading(false)
        return
      }

      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user || decoded))

      navigate('/admin/dashboard')
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password.')
      } else {
        setError(err.response?.data?.detail || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ background: C.surfaceContainer, padding: '0 16px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.outline}`, boxShadow: '0 1px 4px rgba(70,90,163,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(70,90,163,0.3)', overflow: 'hidden' }}>
            <img src="/app-logo.png" alt="Apptist" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: C.primary }}>Apptist</span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase', background: C.surfaceContainerLow, borderRadius: 999, padding: '4px 10px' }}>Admin</span>
      </header>

      <main style={{ flex: 1, padding: '32px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        {/* Icon */}
        <div style={{ width: 80, height: 80, borderRadius: 20, background: C.primaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="admin_panel_settings" size={40} color={C.primary} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, color: C.onSurface, marginBottom: 4 }}>Teacher Portal</h1>
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>Sign in with your teacher credentials</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ width: '100%', background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 20px rgba(70,90,163,0.08)' }}>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email</label>
            <div style={{ background: C.surfaceContainerLow, borderRadius: 8, border: `1.5px solid ${C.outline}`, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="mail" size={20} color={C.onSurfaceVariant} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@ngi.edu.in"
                style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter', fontSize: 15, color: C.onSurface, width: '100%' }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
            <div style={{ background: C.surfaceContainerLow, borderRadius: 8, border: `1.5px solid ${C.outline}`, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="lock" size={20} color={C.onSurfaceVariant} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter', fontSize: 15, color: C.onSurface, width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} color={C.onSurfaceVariant} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: C.errorContainer, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="error" size={16} color={C.error} />
              <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onErrorContainer }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? C.primaryLight : C.primary, color: '#fff',
              border: 'none', borderRadius: 9999, padding: '14px',
              fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(70,90,163,0.25)', transition: 'all 0.2s',
            }}
          >
            {loading && <Icon name="sync" size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Student link */}
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'none', border: `1.5px solid ${C.outline}`, borderRadius: 9999,
            padding: '10px 20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'Inter', fontSize: 13, color: C.onSurfaceVariant,
          }}
        >
          <Icon name="school" size={18} color={C.onSurfaceVariant} />
          Go to Student Portal
        </button>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  )
}
