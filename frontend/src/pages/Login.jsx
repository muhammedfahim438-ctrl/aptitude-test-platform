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

const InputField = ({ label, value, onChange, placeholder, type = 'text', showCheck = false, maxLength, inputMode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>
    <div style={{ background: C.surfaceContainer, borderRadius: 8, border: `1.5px solid ${C.outline}`, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter', fontSize: 15, color: C.onSurface, width: '100%' }}
      />
      {showCheck && value && <Icon name="check_circle" fill size={18} color={C.tertiary} />}
    </div>
  </div>
)

// Popup shown when required fields are missing before sign in.
const MissingFieldsModal = ({ missingLabels, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(27,27,32,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24,
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: C.surfaceContainer, borderRadius: 16, padding: 24,
        maxWidth: 380, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.errorContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="error" color={C.error} size={22} />
        </div>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.onSurface }}>
          Missing Information
        </h2>
      </div>

      <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.5 }}>
        Please fill in the following field{missingLabels.length > 1 ? 's' : ''} before signing in:
      </p>

      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {missingLabels.map(label => (
          <li key={label} style={{ fontFamily: 'Inter', fontSize: 14, color: C.onErrorContainer, fontWeight: 500 }}>
            {label}
          </li>
        ))}
      </ul>

      <button
        onClick={onClose}
        style={{
          marginTop: 8, width: '100%', background: C.primary, color: '#fff',
          border: 'none', borderRadius: 9999, padding: '12px', fontFamily: 'Space Grotesk',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Got it
      </button>
    </div>
  </div>
)

// Department options, grouped by school. Shown as <optgroup> sections in the dropdown.
const DEPARTMENT_GROUPS = [
  {
    school: 'School of Commerce',
    options: [
      'B.Com Computer Applications',
      'B.Com Professional Accounting',
      'B.Com Information Technology',
      'B.Com Banking',
      'B.Com Business Analytics',
      'B.Com Accounting & Finance',
      'M.Com Finance and Control',
    ],
  },
  {
    school: 'School of Computational Science',
    options: [
      'B.Sc Computer Science',
      'BCA',
      'B.Sc Information Technology',
      'B.Sc AI & ML',
      'B.Sc Computer Science with Data Science',
      'B.Sc Internet of Things',
      'BCA Business Analytics',
      'M.Sc Data Science',
    ],
  },
  {
    school: 'School of Life Sciences',
    options: [
      'B.Sc Biotechnology',
      'B.Sc Microbiology',
      'B.Sc Food Science and Nutrition',
      'M.Sc Biotechnology',
      'M.Sc Microbiology',
      'M.Sc Food Science and Nutrition',
    ],
  },
  {
    school: 'School of Management',
    options: [
      'BBA Computer Applications',
      'BBA International Business',
      'BBA Logistics',
      'BBA Aviation Management',
    ],
  },
  {
    school: 'School of Creative Sciences',
    options: [
      'B.Sc CS & HM',
      'B.Sc Costume Design and Fashion',
      'B.Sc Visual Communication',
    ],
  },
  {
    school: 'School of Investigative Science',
    options: [
      'B.Sc Digital and Cyber Forensic Science',
      'B.A Criminology',
      'B.Sc Forensic Science',
      'B.Sc Psychology',
      'M.A Criminology',
      'M.Sc Forensic Science',
    ],
  },
  {
    school: 'School of Liberal Arts',
    options: [
      'B.A English Literature',
      'Master of Social Work',
    ],
  },
]

const OTHERS_VALUE = '__others__'

export default function LoginPage({ onLogin, onNavigate }) {
  const [form, setForm] = useState({
    full_name: '',
    roll_number: '',
    department: '',
    custom_department: '',
    year: '',
    semester: '',
    email: '',
    mobile: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [missingLabels, setMissingLabels] = useState([]) // controls the popup

  // Sanitizers run on every keystroke so invalid characters simply never appear.
  // full_name: letters, spaces, apostrophes and hyphens only (blocks numbers/symbols).
  // mobile: digits only (blocks letters/symbols) — numeric-only as requested.
  const sanitizers = {
    full_name: v => v.replace(/[^A-Za-z\s'-]/g, ''),
    mobile: v => v.replace(/[^0-9]/g, ''),
  }

  const update = field => value => {
    const sanitized = sanitizers[field] ? sanitizers[field](value) : value
    setForm(prev => ({ ...prev, [field]: sanitized }))
  }

  // Maps each form field to the human-readable label shown in the popup.
  const requiredFields = [
    { key: 'full_name', label: 'Student Full Name' },
    { key: 'roll_number', label: 'Reg No.' },
    { key: 'department', label: 'Department' },
    { key: 'year', label: 'Year' },
    { key: 'semester', label: 'Semester' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile Number' },
  ]

  const validateForm = () => {
    const missing = requiredFields
      .filter(({ key }) => !form[key] || !String(form[key]).trim())
      .map(({ label }) => label)

    // "Others" is a placeholder value, not a real department — if it's still
    // selected without a typed-in course name, treat Department as missing.
    if (form.department === OTHERS_VALUE && !form.custom_department.trim()) {
      if (!missing.includes('Department')) missing.push('Department (please specify your course)')
    }

    // Mobile number must be exactly 10 digits (letters are already blocked while typing).
    if (form.mobile && form.mobile.length !== 10 && !missing.includes('Mobile Number')) {
      missing.push('Mobile Number (must be 10 digits)')
    }
    return missing
  }

  const handleSignIn = async () => {
    setError('')

    // Check every field is filled first. If not, show the popup and stop.
    const missing = validateForm()
    if (missing.length > 0) {
      setMissingLabels(missing)
      return
    }

    if (!form.email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const departmentToSend = form.department === OTHERS_VALUE
        ? form.custom_department.trim()
        : form.department

      const res = await axiosClient.post('/api/auth/student-signin/', {
        full_name: form.full_name,
        roll_number: form.roll_number,
        department: departmentToSend,
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
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(70,90,163,0.3)', overflow: 'hidden' }}>
            <img
              src="/app-logo.png"
              alt="Apptist logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: C.primary }}>Apptist</span>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        {/* College Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: C.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(70,90,163,0.12)', border: '4px solid #fff', overflow: 'hidden' }}>
            <img
              src="/college-logo.png"
              alt="Nehru Group of Institutions logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Department</label>
              <select
                value={form.department}
                onChange={e => update('department')(e.target.value)}
                style={{ background: C.surfaceContainer, borderRadius: 8, border: `1.5px solid ${C.outline}`, padding: '10px 12px', fontFamily: 'Inter', fontSize: 14, color: C.onSurface, outline: 'none', width: '100%' }}
              >
                <option value="">Select</option>
                {DEPARTMENT_GROUPS.map(group => (
                  <optgroup key={group.school} label={group.school}>
                    {group.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
                <option value={OTHERS_VALUE}>Others</option>
              </select>
            </div>
          </div>

          {form.department === OTHERS_VALUE && (
            <InputField
              label="Please specify your course"
              value={form.custom_department}
              onChange={update('custom_department')}
              placeholder="Type your course/department"
              showCheck
            />
          )}

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
            placeholder="9876543210"
            type="tel"
            inputMode="numeric"
            maxLength={10}
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

      {/* Popup shown when required fields are missing */}
      {missingLabels.length > 0 && (
        <MissingFieldsModal
          missingLabels={missingLabels}
          onClose={() => setMissingLabels([])}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  )
}