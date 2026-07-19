import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../api/client'

const DEPARTMENT_GROUPS = [
  {
    school: 'School of Commerce',
    options: ['B.Com Computer Applications', 'B.Com Professional Accounting', 'B.Com Information Technology', 'B.Com Banking', 'B.Com Business Analytics', 'B.Com Accounting & Finance', 'M.Com Finance and Control'],
  },
  {
    school: 'School of Computational Science',
    options: ['B.Sc Computer Science', 'BCA', 'B.Sc Information Technology', 'B.Sc AI & ML', 'B.Sc Computer Science with Data Science', 'B.Sc Internet of Things', 'BCA Business Analytics', 'M.Sc Data Science'],
  },
  {
    school: 'School of Life Sciences',
    options: ['B.Sc Biotechnology', 'B.Sc Microbiology', 'B.Sc Food Science and Nutrition', 'M.Sc Biotechnology', 'M.Sc Microbiology', 'M.Sc Food Science and Nutrition'],
  },
  {
    school: 'School of Management',
    options: ['BBA Computer Applications', 'BBA International Business', 'BBA Logistics', 'BBA Aviation Management'],
  },
  {
    school: 'School of Creative Sciences',
    options: ['B.Sc CS & HM', 'B.Sc Costume Design and Fashion', 'B.Sc Visual Communication'],
  },
  {
    school: 'School of Investigative Science',
    options: ['B.Sc Digital and Cyber Forensic Science', 'B.A Criminology', 'B.Sc Forensic Science', 'B.Sc Psychology', 'M.A Criminology', 'M.Sc Forensic Science'],
  },
  {
    school: 'School of Liberal Arts',
    options: ['B.A English Literature', 'Master of Social Work'],
  },
]

const OTHERS_VALUE = '__others__'

const MissingFieldsModal = ({ missingLabels, onClose }) => (
  <div onClick={onClose} className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1000] p-6">
    <div onClick={e => e.stopPropagation()} className="bg-surface-container rounded-2xl p-6 max-w-sm w-full shadow-xl flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-error" style={{ fontSize: 22 }}>error</span>
        </div>
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Missing Information</h2>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
        Please fill in the following field{missingLabels.length > 1 ? 's' : ''} before signing in:
      </p>
      <ul className="m-0 pl-5 flex flex-col gap-1">
        {missingLabels.map(label => (
          <li key={label} className="font-body-sm text-body-sm text-on-error-container font-medium">{label}</li>
        ))}
      </ul>
      <button onClick={onClose} className="mt-2 w-full bg-primary text-on-primary border-none rounded-full py-3 font-headline-md text-body-sm font-semibold cursor-pointer">
        Got it
      </button>
    </div>
  </div>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', roll_number: '', department: '', custom_department: '',
    year: '', semester: '', email: '', mobile: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [missingLabels, setMissingLabels] = useState([])

  const sanitizers = {
    full_name: v => v.replace(/[^A-Za-z\s'-]/g, ''),
    mobile: v => v.replace(/[^0-9]/g, ''),
  }

  const update = field => value => {
    const sanitized = sanitizers[field] ? sanitizers[field](value) : value
    setForm(prev => ({ ...prev, [field]: sanitized }))
  }

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
    if (form.department === OTHERS_VALUE && !form.custom_department.trim()) {
      if (!missing.includes('Department')) missing.push('Department (please specify your course)')
    }
    if (form.mobile && form.mobile.length !== 10 && !missing.includes('Mobile Number')) {
      missing.push('Mobile Number (must be 10 digits)')
    }
    return missing
  }

  const handleSignIn = async () => {
    setError('')
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
        ? form.custom_department.trim() : form.department

      const res = await authAPI.studentSignin({
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
      navigate('/student/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, value, onChange, placeholder, type = 'text', showCheck, maxLength, inputMode }) => (
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</label>
      <div className="bg-tertiary-fixed px-3 py-2 rounded-lg border border-tertiary/20 text-on-surface font-body-md flex items-center gap-2">
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength} inputMode={inputMode}
          className="bg-transparent border-none outline-none font-body-md text-body-md text-on-surface w-full placeholder:text-on-surface-variant/50"
        />
        {showCheck && value && <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col font-body-md bg-background text-on-background">
      <header className="bg-surface top-0 z-40 sticky">
        <div className="flex justify-between items-center w-full px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg shadow-sm overflow-hidden">
              <img src="/app-logo.png" alt="Apptist" className="w-full h-full object-cover" />
            </div>
            <span className="font-headline-md text-headline-md font-bold text-primary">Apptist</span>
          </div>
          <Link to="/admin/login" className="p-2 rounded-full hover:bg-primary-fixed transition-colors duration-200 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>admin_panel_settings</span>
          </Link>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary-container to-transparent -z-10 opacity-50" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-fixed rounded-full blur-3xl opacity-30 -z-10" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-secondary-container rounded-full blur-3xl opacity-20 -z-10" />

        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex flex-col items-center text-center space-y-2 mb-4">
            <div className="w-32 h-32 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center overflow-hidden border-4 border-white">
              <img src="/college-logo.png" alt="NGI" className="w-full h-full object-cover object-center" />
            </div>
            <div className="space-y-1">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">Welcome</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant opacity-70">Nehru Group of Institutions · Aptitude Portal</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg shadow-md p-4 space-y-3 border-outline-variant border">
            <Field label="Student Full Name" value={form.full_name} onChange={update('full_name')} placeholder="Enter your full name" showCheck />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Reg No." value={form.roll_number} onChange={update('roll_number')} placeholder="NGI2026CS045" showCheck />
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Department</label>
                <select value={form.department} onChange={e => update('department')(e.target.value)}
                  className="bg-tertiary-fixed px-3 py-2 rounded-lg border border-tertiary/20 text-on-surface font-body-md text-sm truncate outline-none">
                  <option value="">Select</option>
                  {DEPARTMENT_GROUPS.map(group => (
                    <optgroup key={group.school} label={group.school}>
                      {group.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </optgroup>
                  ))}
                  <option value={OTHERS_VALUE}>Others</option>
                </select>
              </div>
            </div>
            {form.department === OTHERS_VALUE && (
              <Field label="Please specify your course" value={form.custom_department} onChange={update('custom_department')} placeholder="Type your course/department" showCheck />
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Year</label>
                <select value={form.year} onChange={e => update('year')(e.target.value)}
                  className="bg-tertiary-fixed px-3 py-2 rounded-lg border border-tertiary/20 text-on-surface font-body-md text-sm truncate outline-none">
                  <option value="">Select</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Semester</label>
                <select value={form.semester} onChange={e => update('semester')(e.target.value)}
                  className="bg-tertiary-fixed px-3 py-2 rounded-lg border border-tertiary/20 text-on-surface font-body-md text-sm truncate outline-none">
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
            <Field label="Email" value={form.email} onChange={update('email')} placeholder="your@ngi.edu.in" type="email" showCheck />
            <Field label="Mobile Number" value={form.mobile} onChange={update('mobile')} placeholder="9876543210" type="tel" inputMode="numeric" maxLength={10} showCheck />
            {error && (
              <div className="bg-error-container rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-error" style={{ fontSize: 16 }}>error</span>
                <p className="font-body-sm text-body-sm text-on-error-container">{error}</p>
              </div>
            )}
          </div>

          <div className="bg-secondary-fixed border border-secondary/20 rounded-lg p-3 flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary mt-0.5">info</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Please verify your details before starting the assessment. Contact admin if any information is incorrect.</p>
          </div>

          <button onClick={handleSignIn} disabled={loading}
            className={`w-full bg-primary text-on-primary font-label-md text-label-md py-4 px-6 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform transition-all active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}>
            {loading && <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>sync</span>}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </main>

      {missingLabels.length > 0 && (
        <MissingFieldsModal missingLabels={missingLabels} onClose={() => setMissingLabels([])} />
      )}
    </div>
  )
}
