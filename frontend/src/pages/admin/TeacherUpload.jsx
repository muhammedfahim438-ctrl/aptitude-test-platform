import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/client'

function ToggleSwitch({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={() => onChange(!checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-admin-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-secondary" />
    </label>
  )
}

const EMPTY_ROW = {
  text: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_answer: 'A', image_url: '', imageFile: null, imagePreview: null, retake: false,
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  const updateRow = (idx, field, value) => setRows((prev) => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))

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
      if (!r.text.trim()) { setError(`Question ${i + 1} text is empty.`); return }
      if (!r.option_a.trim() || !r.option_b.trim() || !r.option_c.trim() || !r.option_d.trim()) { setError(`Question ${i + 1} is missing options.`); return }
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
        if (row.imageFile) formData.append(`questions[${idx}][image]`, row.imageFile)
        if (row.image_url) formData.append(`questions[${idx}][image_url]`, row.image_url)
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
    <div className="flex flex-col min-h-screen bg-admin-surface">

      <header className="flex justify-between items-center w-full px-5 h-16 bg-admin-surface sticky top-0 z-40 border-b border-admin-outline-variant">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/questions')} className="p-2 rounded-full hover:bg-admin-surface-container transition-colors">
            <span className="material-symbols-outlined text-admin-on-surface">menu</span>
          </button>
          <h1 className="text-headline-sm font-headline-md font-bold text-admin-on-surface">Admin Command</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-admin-primary-container flex items-center justify-center text-admin-on-primary-container font-label-md">AD</div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-5 pt-4 pb-10 space-y-6 w-full">

        <div className="flex justify-between items-end px-2">
          <div>
            <h2 className="text-headline-md font-headline-md text-admin-on-surface">Question Bank Editor</h2>
            <p className="text-label-md font-label-md text-admin-on-surface-variant">Manage and refine aptitude test items</p>
          </div>
          <button onClick={addRow} className="bg-admin-secondary text-admin-on-secondary px-6 py-3 rounded-full flex items-center gap-2 font-headline-sm hover:opacity-90 transition-opacity shadow-sm">
            <span className="material-symbols-outlined">add</span>
            Add Row
          </button>
        </div>

        <div className="p-4 bg-admin-primary-container rounded-lg border border-admin-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-admin-on-primary-container/80">calendar_today</span>
            <span className="text-label-md font-label-md text-admin-on-primary-container/80">Exam Date:</span>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="text-body-lg font-bold text-admin-on-primary-container bg-transparent border-none outline-none"
            />
          </div>
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-admin-primary-container bg-admin-surface-variant flex items-center justify-center text-[10px] text-admin-on-surface font-bold">{rows.length}</div>
          </div>
        </div>

        <div className="space-y-4">
          {rows.map((row, idx) => (
            <div key={idx} className="bento-card bg-admin-surface-container-lowest border border-admin-outline-variant p-4 flex flex-col lg:flex-row gap-4 shadow-sm">
              <div className="lg:w-48 w-full h-48 rounded-xl bg-admin-surface-container-low border-2 border-dashed border-admin-outline-variant flex flex-col items-center justify-center gap-2 overflow-hidden relative group">
                {row.imagePreview ? (
                  <>
                    <img src={row.imagePreview} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => { URL.revokeObjectURL(row.imagePreview); updateRow(idx, 'imageFile', null); updateRow(idx, 'imagePreview', null) }} className="absolute top-2 right-2 bg-admin-primary text-admin-on-primary p-1.5 rounded-full shadow-lg">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-admin-outline">image</span>
                    <span className="text-label-sm font-label-sm text-admin-outline">THUMBNAIL</span>
                    <label className="absolute inset-0 bg-admin-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <span className="bg-admin-primary text-admin-on-primary p-2 rounded-full shadow-lg material-symbols-outlined">edit</span>
                      <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(idx, e.target.files?.[0])} />
                    </label>
                  </>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <label className="text-label-sm font-label-sm text-admin-primary mb-1 block font-bold">QUESTION TEXT</label>
                    <textarea
                      value={row.text}
                      onChange={(e) => updateRow(idx, 'text', e.target.value)}
                      placeholder="Enter the aptitude question here..."
                      className="w-full bg-admin-surface-container-lowest p-3 rounded-xl border border-admin-secondary/30 focus:border-admin-secondary focus:ring-1 focus:ring-admin-secondary outline-none text-admin-on-surface-variant placeholder-admin-outline/50 min-h-[80px]"
                    />
                  </div>
                  <div className="md:col-span-4 flex flex-col justify-between">
                    <div>
                      <label className="text-label-sm font-label-sm text-admin-primary mb-1 block font-bold">CORRECT ANSWER</label>
                      <div className="flex gap-1.5">
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => updateRow(idx, 'correct_answer', opt)}
                            className={`w-9 h-9 rounded-lg font-label-md text-label-md font-bold cursor-pointer flex items-center justify-center border transition-all ${row.correct_answer === opt ? 'bg-admin-primary border-admin-primary text-white' : 'bg-admin-surface-container-lowest border-admin-secondary/30 text-admin-on-surface-variant'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-admin-surface-container-low p-3 rounded-xl border border-admin-outline-variant mt-2">
                      <span className="text-label-md font-label-md text-admin-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Retake Allowed
                      </span>
                      <ToggleSwitch checked={row.retake} onChange={(v) => updateRow(idx, 'retake', v)} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => {
                    const letter = String.fromCharCode(65 + i)
                    return (
                      <div key={opt} className="space-y-1">
                        <label className="text-label-sm font-label-sm text-admin-outline px-1 font-bold">{letter}</label>
                        <input
                          type="text"
                          value={row[opt]}
                          onChange={(e) => updateRow(idx, opt, e.target.value)}
                          placeholder={`Enter option ${letter}...`}
                          className="w-full bg-admin-surface-container-lowest p-3 rounded-lg border border-admin-secondary/30 focus:border-admin-secondary outline-none text-admin-on-surface-variant"
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-label-sm font-label-sm text-admin-on-surface-variant font-bold">IMAGE URL</label>
                  <input
                    type="url"
                    value={row.image_url}
                    onChange={(e) => updateRow(idx, 'image_url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-admin-surface-container-lowest p-2 rounded-lg border border-admin-secondary/30 focus:border-admin-secondary outline-none text-admin-on-surface-variant text-sm"
                  />
                  {rows.length > 1 && (
                    <button onClick={() => removeRow(idx)} className="p-2 text-admin-error hover:bg-admin-error/10 rounded-lg transition-colors">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-admin-error/10 rounded-lg px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-admin-error">error</span>
            <p className="text-[13px] text-admin-error">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 rounded-lg px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-green-600">check_circle</span>
            <p className="text-[13px] text-green-700">{success}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3.5 rounded-lg font-headline-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all ${loading ? 'bg-admin-primary/70 cursor-not-allowed text-white' : 'bg-admin-primary text-admin-on-primary hover:opacity-90'}`}
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">upload</span>
          )}
          {loading ? 'Uploading...' : `Upload ${rows.length} Question${rows.length > 1 ? 's' : ''}`}
        </button>
      </main>
    </div>
  )
}
