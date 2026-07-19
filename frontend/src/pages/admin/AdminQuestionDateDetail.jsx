import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminAPI } from '../../api/client'

const OPTION_COLORS = {
  A: { label: 'text-admin-secondary', bg: 'bg-admin-secondary-container', border: 'border-admin-secondary/30' },
  B: { label: 'text-admin-secondary', bg: 'bg-admin-secondary-container', border: 'border-admin-secondary/30' },
  C: { label: 'text-admin-secondary', bg: 'bg-admin-secondary-container', border: 'border-admin-secondary/30' },
  D: { label: 'text-admin-secondary', bg: 'bg-admin-secondary-container', border: 'border-admin-secondary/30' },
}

export default function AdminQuestionDateDetail() {
  const navigate = useNavigate()
  const { date } = useParams()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await adminAPI.getQuestions(undefined, date)
        const items = res.data.results || res.data
        setQuestions(items.filter((q) => q.exam_date === date))
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [date])

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await adminAPI.deleteQuestion(id)
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    } catch {
      // silent
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-admin-surface">

      <header className="flex justify-between items-center w-full px-5 h-16 bg-admin-surface sticky top-0 z-40 border-b border-admin-outline-variant">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/questions')} className="p-2 rounded-full hover:bg-admin-surface-container transition-colors">
            <span className="material-symbols-outlined text-admin-on-surface">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-headline-sm font-headline-md font-bold text-admin-on-surface">{date}</h1>
            <p className="text-label-sm font-label-sm text-admin-on-surface-variant">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-5 pt-6 pb-10 space-y-4 w-full">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-admin-surface-container-lowest rounded-lg p-4 border border-admin-outline-variant shadow-sm animate-pulse">
              <div className="w-24 h-4 rounded bg-admin-surface-container-low mb-3" />
              <div className="w-full h-3 rounded bg-admin-surface-container-low" />
            </div>
          ))
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[48px] text-admin-outline-variant block mb-3">help_outline</span>
            <p className="text-body-md text-admin-on-surface-variant">No questions for this date</p>
          </div>
        ) : (
          questions.map((q, idx) => {
            const isConfirming = confirmDelete === q.id
            return (
              <div key={q.id} className="bento-card bg-admin-surface-container-lowest border border-admin-outline-variant p-4 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-admin-primary-container rounded-xl flex items-center justify-center text-admin-primary font-headline-md font-bold">Q{idx + 1}</span>
                    <span className="text-body-lg font-headline-sm text-admin-on-surface">Question {idx + 1}</span>
                  </div>
                  {isConfirming ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(q.id)} disabled={deleting === q.id} className="px-3 py-1.5 bg-admin-error text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity">
                        {deleting === q.id ? '...' : 'Delete'}
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 bg-admin-surface-container-low border border-admin-outline-variant rounded-lg font-label-md text-admin-on-surface-variant">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(q.id)} className="p-2 flex items-center gap-1 text-admin-error hover:bg-admin-error/10 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>

                <p className="text-body-md text-admin-on-surface leading-relaxed">{q.text}</p>

                {q.image_url && (
                  <div className="rounded-xl overflow-hidden border border-admin-outline-variant">
                    <img src={q.image_url} alt="Question" className="w-full max-h-[200px] object-contain bg-admin-surface-container-low" />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => {
                    const letter = String.fromCharCode(65 + i)
                    return (
                      <div key={opt} className="space-y-1">
                        <label className="text-label-sm font-label-sm text-admin-outline px-1 font-bold">{letter}</label>
                        <input
                          type="text"
                          readOnly
                          value={q[opt]}
                          className="w-full bg-admin-surface-container-lowest p-3 rounded-lg border border-admin-secondary/30 text-admin-on-surface-variant focus:border-admin-secondary outline-none"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}
