import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/client'

const C = {
  primary: '#465aa3',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
  primaryLight: '#8CA0EE',
  surface: '#FBFBFF',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#f5f3fa',
  surfaceContainerHigh: '#e9e7ee',
  outline: '#E6E9F7',
  outlineVariant: '#c5c5d2',
  onSurface: '#1b1b20',
  onSurfaceVariant: '#444651',
  error: '#E2737A',
  errorContainer: '#FCEAEC',
  onErrorContainer: '#93000a',
  tertiary: '#116b51',
  tertiaryContainer: '#E5FAF1',
  background: '#f9f9f7',
}

const Icon = ({ name, size = 24, fill = false, color, style = {} }) => (
  <span
    className={`material-symbols-outlined${fill ? ' fill-icon' : ''}`}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}
  >
    {name}
  </span>
)

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? C.primary : C.surfaceContainerHigh,
        border: `1.5px solid ${checked ? C.primary : C.outlineVariant}`,
        cursor: 'pointer', position: 'relative', transition: 'all 0.2s', padding: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}

function NavItem({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        border: 'none', cursor: 'pointer',
        color: active ? C.primary : C.onSurfaceVariant,
        padding: active ? '4px 16px' : '6px 12px',
        borderRadius: active ? 999 : 0,
        background: active ? C.primaryContainer : 'transparent',
      }}
    >
      <Icon name={icon} size={22} color={active ? C.onPrimaryContainer : C.onSurfaceVariant} />
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500 }}>{label}</span>
    </button>
  )
}

const EMPTY_ROW = {
  text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
  image_url: '',
  imageFile: null,
  imagePreview: null,
  retake: false,
}

const today = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function TeacherUpload() {
  const navigate = useNavigate()
  const [examDate, setExamDate] = useState(today())
  const [rows, setRows] = useState([{ ...EMPTY_ROW }])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }])
  const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx))

  const updateRow = (idx, field, value) => {
    setRows((prev) => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  const handleImageUpload = (idx, file) => {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setRows((prev) => prev.map((row, i) => i === idx ? { ...row, imageFile: file, imagePreview: preview } : row))
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (!r.text.trim()) {
        setError(`Question ${i + 1} text is empty.`)
        return
      }
      if (!r.option_a.trim() || !r.option_b.trim() || !r.option_c.trim() || !r.option_d.trim()) {
        setError(`Question ${i + 1} is missing options.`)
        return
      }
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('exam_date', examDate)
      formData.append('question_count', rows.length)

      rows.forEach((row, idx) => {
        formData.append(`questions[${idx}][text]`, row.text)
        formData.append(`questions[${idx}][option_a]`, row.option_a)
        formData.append(`questions[${idx}][option_b]`, row.option_b)
        formData.append(`questions[${idx}][option_c]`, row.option_c)
        formData.append(`questions[${idx}][option_d]`, row.option_d)
        formData.append(`questions[${idx}][correct_answer]`, row.correct_answer)
        formData.append(`questions[${idx}][retake]`, row.retake)
        if (row.imageFile) {
          formData.append(`questions[${idx}][image]`, row.imageFile)
        }
        if (row.image_url) {
          formData.append(`questions[${idx}][image_url]`, row.image_url)
        }
      })

      await adminAPI.uploadQuestions(formData)
      setSuccess(`${rows.length} question${rows.length > 1 ? 's' : ''} uploaded successfully!`)
      setRows([{ ...EMPTY_ROW }])
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.surfaceContainer, borderBottom: `1px solid ${C.outline}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(70,90,163,0.08)' }}>
        <button onClick={() => navigate('/admin/questions')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <Icon name="arrow_back" size={22} color={C.onSurface} />
        </button>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: C.onSurface, flex: 1 }}>Upload Questions</h1>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant, background: C.surfaceContainerLow, borderRadius: 999, padding: '3px 8px' }}>{rows.length} row{rows.length !== 1 ? 's' : ''}</span>
      </header>

      <div style={{ height: 56 }} />

      <main style={{ flex: 1, padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Exam Date */}
        <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 16 }}>
          <label style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Exam Date</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="calendar_today" size={20} color={C.primary} />
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600, color: C.onSurface, border: 'none', outline: 'none', background: 'transparent' }}
            />
          </div>
        </div>

        {/* Question Rows */}
        {rows.map((row, idx) => (
          <div key={idx} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Row header */}
            <div style={{ padding: '10px 16px', background: C.primaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, color: C.onPrimaryContainer }}>Question {idx + 1}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.onPrimaryContainer }}>Retake</span>
                  <ToggleSwitch checked={row.retake} onChange={(v) => updateRow(idx, 'retake', v)} />
                </div>
                {rows.length > 1 && (
                  <button onClick={() => removeRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                    <Icon name="close" size={20} color={C.error} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Image upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {row.imagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={row.imagePreview} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.outline}` }} />
                    <button
                      onClick={() => { URL.revokeObjectURL(row.imagePreview); updateRow(idx, 'imageFile', null); updateRow(idx, 'imagePreview', null) }}
                      style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: C.error, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name="close" size={14} color="#fff" />
                    </button>
                  </div>
                ) : (
                  <label style={{ width: 64, height: 64, borderRadius: 8, border: `1.5px dashed ${C.outlineVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: C.surfaceContainerLow }}>
                    <Icon name="add_a_photo" size={24} color={C.onSurfaceVariant} />
                    <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(idx, e.target.files?.[0])} />
                  </label>
                )}
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Image URL (optional)</label>
                  <input
                    type="url"
                    value={row.image_url}
                    onChange={(e) => updateRow(idx, 'image_url', e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', background: C.surfaceContainerLow, borderRadius: 6, border: `1px solid ${C.outline}`, padding: '6px 10px', fontFamily: 'Inter', fontSize: 12, color: C.onSurface, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Question text */}
              <div>
                <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Question Text</label>
                <textarea
                  value={row.text}
                  onChange={(e) => updateRow(idx, 'text', e.target.value)}
                  placeholder="Enter the question..."
                  rows={3}
                  style={{ width: '100%', background: C.surfaceContainerLow, borderRadius: 8, border: `1.5px solid ${C.outline}`, padding: '10px 12px', fontFamily: 'Inter', fontSize: 14, color: C.onSurface, outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Correct Answer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Correct Answer</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateRow(idx, 'correct_answer', opt)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: row.correct_answer === opt ? C.primary : C.surfaceContainerLow,
                        border: row.correct_answer === opt ? 'none' : `1px solid ${C.outline}`,
                        color: row.correct_answer === opt ? '#fff' : C.onSurfaceVariant,
                        fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options A-D */}
              {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => {
                const letter = String.fromCharCode(65 + i)
                return (
                  <div key={opt}>
                    <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Option {letter}</label>
                    <input
                      type="text"
                      value={row[opt]}
                      onChange={(e) => updateRow(idx, opt, e.target.value)}
                      placeholder={`Enter option ${letter}...`}
                      style={{ width: '100%', background: C.surfaceContainerLow, borderRadius: 8, border: `1.5px solid ${C.outline}`, padding: '8px 12px', fontFamily: 'Inter', fontSize: 14, color: C.onSurface, outline: 'none' }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Add Row */}
        <button
          onClick={addRow}
          style={{
            width: '100%', background: C.surfaceContainer, border: `1.5px dashed ${C.outlineVariant}`,
            borderRadius: 14, padding: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, color: C.onSurfaceVariant,
          }}
        >
          <Icon name="add_circle_outline" size={20} color={C.primary} />
          Add Question
        </button>

        {/* Feedback */}
        {error && (
          <div style={{ background: C.errorContainer, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="error" size={18} color={C.error} />
            <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onErrorContainer }}>{error}</p>
          </div>
        )}

        {success && (
          <div style={{ background: C.tertiaryContainer, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="check_circle" size={18} color={C.tertiary} />
            <p style={{ fontFamily: 'Inter', fontSize: 13, color: '#1F8A5F' }}>{success}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
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
          {loading ? <Icon name="sync" size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <Icon name="upload" size={18} color="#fff" />}
          {loading ? 'Uploading...' : `Upload ${rows.length} Question${rows.length > 1 ? 's' : ''}`}
        </button>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  )
}
