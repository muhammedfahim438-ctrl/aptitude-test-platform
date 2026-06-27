// src/pages/Login.jsx  ── US-V02
// Unified login for students and teachers.
// On success: decodes JWT, routes to /student/exam or /teacher/upload.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { authAPI } from '../api/axiosClient'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await authAPI.login(email, password)
      const { access, refresh } = res.data

      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)

      const decoded = jwtDecode(access)

      // Route by role
      if (decoded.is_student) navigate('/student/exam', { replace: true })
      else if (decoded.is_teacher) navigate('/teacher/upload', { replace: true })
      else setError('Account has no valid role assigned. Contact admin.')
    } catch (err) {
      const msg = err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Invalid credentials. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleLogin() }

  return (
    <div style={styles.page}>
      {/* Orange top stripe */}
      <div style={styles.topStripe} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoBox}>
          <span style={styles.logoLetter}>A</span>
        </div>
        <h1 style={styles.appName}>APPTIST</h1>
        <p style={styles.appSub}>Student Portal</p>
      </header>

      {/* Card */}
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={styles.cardTitle}>Welcome Back</h2>
            <p style={styles.cardSub}>Access your exam dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBanner}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ba1a1a' }}>error</span>
              <span style={{ fontSize: 13, color: '#ba1a1a' }}>{error}</span>
            </div>
          )}

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>EMAIL</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={styles.fieldIcon}>person</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="student@college.edu"
                autoComplete="email"
                style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = '#ff6b00')}
                onBlur={(e)  => (e.target.style.borderColor = '#d2c5b6')}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ ...styles.fieldGroup, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={styles.label}>PASSWORD</label>
              <a href="#" style={styles.forgotLink}>Forgot password?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={styles.fieldIcon}>lock</span>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...styles.input, paddingRight: 44 }}
                onFocus={(e) => (e.target.style.borderColor = '#ff6b00')}
                onBlur={(e)  => (e.target.style.borderColor = '#d2c5b6')}
              />
              <button
                onClick={() => setShowPass((v) => !v)}
                style={styles.eyeBtn}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {showPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined spin" style={{ fontSize: 16 }}>
                  progress_activity
                </span>
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Shield watermark */}
      <div style={styles.watermark}>
        <span className="material-symbols-outlined" style={{ fontSize: 200 }}>shield</span>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#dae1e3',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Geist, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    position: 'relative',
  },
  topStripe: {
    position: 'fixed', top: 0, left: 0, width: '100%',
    height: 3, background: '#ff6b00', zIndex: 50,
  },
  header: {
    paddingTop: 52, paddingBottom: 24,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    background: '#ff6b00',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0 4px 16px rgba(255,107,0,0.30)',
  },
  logoLetter: { color: '#fff', fontSize: 28, fontWeight: 800 },
  appName:    { fontSize: 24, fontWeight: 600, color: '#1a1c1b', letterSpacing: '-0.01em' },
  appSub:     {
    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
    color: '#41484a', letterSpacing: '0.1em',
    textTransform: 'uppercase', marginTop: 4,
  },
  main: {
    flex: 1, display: 'flex', alignItems: 'flex-start',
    justifyContent: 'center', padding: '0 20px',
  },
  card: {
    width: '100%', maxWidth: 380,
    background: '#fff',
    borderRadius: 14, padding: 28,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #f0f0ee',
  },
  cardTitle: { fontSize: 20, fontWeight: 600, color: '#1a1c1b' },
  cardSub:   { fontSize: 14, color: '#41484a', opacity: 0.85, marginTop: 4 },
  errorBanner: {
    background: '#ffdad6', border: '1px solid #ba1a1a',
    borderRadius: 8, padding: '10px 14px', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
    color: '#41484a', letterSpacing: '0.05em',
    textTransform: 'uppercase', display: 'block', marginBottom: 6,
  },
  fieldIcon: {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 18, color: '#80776b', pointerEvents: 'none',
  },
  input: {
    width: '100%', padding: '12px 14px 12px 42px',
    border: '1.5px solid #d2c5b6', borderRadius: 8,
    fontSize: 14, color: '#1c1c1b',
    background: '#f4f4f2', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
    fontFamily: 'Geist, sans-serif',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#80776b', display: 'flex', alignItems: 'center',
  },
  forgotLink: {
    fontSize: 11, color: '#ff6b00',
    textDecoration: 'none', fontWeight: 600,
  },
  submitBtn: {
    width: '100%', padding: '13px 20px',
    background: '#1a1c1b', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    transition: 'opacity 0.15s',
    fontFamily: 'Geist, sans-serif',
  },
  watermark: {
    position: 'fixed', bottom: 0, right: 0,
    padding: 20, opacity: 0.03, pointerEvents: 'none',
  },
}
