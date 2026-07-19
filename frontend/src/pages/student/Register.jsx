import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../api/client'

const C = {
  primary: '#465aa3', primaryContainer: '#EAEFFD', onPrimaryContainer: '#1e347b',
  primaryLight: '#8CA0EE', secondary: '#8a5108', secondaryContainer: '#FFEEDC',
  onSecondaryContainer: '#F2924B', tertiary: '#116b51', tertiaryContainer: '#E5FAF1',
  onTertiaryContainer: '#1F8A5F', surface: '#FBFBFF', surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#f5f3fa', outline: '#E6E9F7', outlineVariant: '#c5c5d2',
  onSurface: '#34406E', onSurfaceVariant: '#6C7596', error: '#E2737A',
  errorContainer: '#FCEAEC', onErrorContainer: '#93000a',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
)

const InputField = ({ label, value, onChange, placeholder, type = 'text', icon }) => (
  <div style={{ marginBottom: 16 }}>
    <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
    <div style={{ position: 'relative' }}>
      {icon && (
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
          <Icon name={icon} size={18} color={C.onSurfaceVariant} />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: icon ? '12px 16px 12px 42px' : '12px 16px',
          borderRadius: 12, border: `1.5px solid ${C.outline}`,
          fontFamily: 'Inter', fontSize: 15, color: C.onSurface,
          background: C.surfaceContainerLow, outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = C.primary}
        onBlur={e => e.target.style.borderColor = C.outline}
      />
    </div>
  </div>
)

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', roll_number: '', department: '', year: '', semester: '',
    email: '', mobile: '', password: '', confirm_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const update = (field) => (value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleRegister = async () => {
    setError('')
    if (!form.full_name || !form.roll_number || !form.email || !form.password || !form.department) {
      setError('All fields are required.')
      return
    }
    if (!form.email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.register({
        full_name: form.full_name,
        roll_number: form.roll_number,
        department: form.department,
        year: form.year,
        semester: form.semester,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
      })
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setSuccess(true)
      setTimeout(() => navigate('/student/dashboard', { replace: true }), 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.surfaceContainerLow }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: C.tertiaryContainer, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon name="check_circle" fill size={40} color={C.tertiary} />
        </div>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, color: C.onSurface, marginBottom: 8 }}>Registration Successful!</h2>
        <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>Redirecting to exam...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.surfaceContainerLow, maxWidth: 480, margin: '0 auto' }}>
      <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: '#fff' }}>N</span>
        </div>
        <p style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: C.primary }}>NGI Portal</p>
      </header>

      <main style={{ flex: 1, padding: '8px 16px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, color: C.onSurface, marginBottom: 6 }}>Create Account</h1>
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>Nehru Group of Institutions - Aptitude Portal</p>
        </div>

        <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: '0 4px 20px rgba(70,90,163,0.10)' }}>
          <InputField label="Student Full Name" value={form.full_name} onChange={update('full_name')} placeholder="Vignesh Subramaniam" icon="person" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Reg No." value={form.roll_number} onChange={update('roll_number')} placeholder="NGI2026CS045" />
            <InputField label="Department" value={form.department} onChange={update('department')} placeholder="CSE-A" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, textTransform: 'uppercase' }}>Year</label>
              <select value={form.year} onChange={e => update('year')(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${C.outline}`, fontFamily: 'Inter', fontSize: 14, color: C.onSurface, background: C.surfaceContainerLow, outline: 'none' }}>
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, textTransform: 'uppercase' }}>Semester</label>
              <select value={form.semester} onChange={e => update('semester')(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${C.outline}`, fontFamily: 'Inter', fontSize: 14, color: C.onSurface, background: C.surfaceContainerLow, outline: 'none' }}>
                <option value="">Select Semester</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Semester 3">Semester 3</option>
                <option value="Semester 4">Semester 4</option>
                <option value="Semester 5">Semester 5</option>
                <option value="Semester 6">Semester 6</option>
              </select>
            </div>
          </div>
          <InputField label="Email" value={form.email} onChange={update('email')} placeholder="vignesh@ngi.edu.in" type="email" icon="mail" />
          <InputField label="Mobile Number" value={form.mobile} onChange={update('mobile')} placeholder="9876543210" type="tel" icon="phone" />
          <InputField label="Password" value={form.password} onChange={update('password')} placeholder="Min 6 characters" type="password" icon="lock" />
          <InputField label="Confirm Password" value={form.confirm_password} onChange={update('confirm_password')} placeholder="Re-enter password" type="password" icon="lock" />
          {error && (
            <div style={{ background: C.errorContainer, border: `1px solid ${C.error}30`, borderRadius: 10, padding: '10px 14px', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="error" size={18} color={C.error} />
              <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onErrorContainer }}>{error}</p>
            </div>
          )}
        </div>

        <button onClick={handleRegister} disabled={loading} style={{
          width: '100%', background: loading ? C.primaryLight : C.primary, color: '#fff',
          border: 'none', borderRadius: 9999, padding: '16px', fontFamily: 'JetBrains Mono',
          fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(70,90,163,0.25)',
        }}>
          {loading && <Icon name="sync" size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />}
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontFamily: 'Inter', fontSize: 13, color: C.onSurfaceVariant }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </p>
      </main>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
