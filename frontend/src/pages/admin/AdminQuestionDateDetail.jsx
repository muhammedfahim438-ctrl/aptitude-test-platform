import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminAPI } from '../../api/client'

const C = {
  primary: '#465aa3',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
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
  tertiary: '#116b51',
  tertiaryContainer: '#E5FAF1',
  background: '#f9f9f7',
}

const OPTION_COLORS = {
  A: { bg: '#EAEFFD', text: '#1e347b' },
  B: { bg: '#E5FAF1', text: '#116b51' },
  C: { bg: '#FFEEDC', text: '#8a5108' },
  D: { bg: '#FCEAEC', text: '#93000a' },
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.surfaceContainer, borderBottom: `1px solid ${C.outline}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(70,90,163,0.08)' }}>
        <button onClick={() => navigate('/admin/questions')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <span className="ri ri-arrow-left-line" style={{ fontSize: 22, color: C.onSurface }} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 600, color: C.onSurface }}>{date}</h1>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant }}>{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
        </div>
      </header>

      <div style={{ height: 56 }} />

      <main style={{ flex: 1, padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 16 }}>
              <div style={{ width: '50%', height: 12, borderRadius: 4, background: C.surfaceContainerLow, marginBottom: 10, animation: 'pulse 2s ease infinite' }} />
              <div style={{ width: '90%', height: 10, borderRadius: 4, background: C.surfaceContainerLow, animation: 'pulse 2s ease infinite' }} />
            </div>
          ))
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span className="ri ri-question-line" style={{ fontSize: 48, color: C.outlineVariant, display: 'block', marginBottom: 12 }} />
            <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>No questions for this date</p>
          </div>
        ) : (
          questions.map((q, idx) => {
            const isConfirming = confirmDelete === q.id
            return (
              <div key={q.id} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(70,90,163,0.06)' }}>
                {/* Question header */}
                <div style={{ padding: '12px 16px', background: C.primaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, color: C.onPrimaryContainer }}>Q{idx + 1}</span>
                  </div>
                  {isConfirming ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleDelete(q.id)}
                        disabled={deleting === q.id}
                        style={{ background: C.error, border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#fff', fontFamily: 'JetBrains Mono', fontSize: 11 }}
                      >
                        {deleting === q.id ? '...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{ background: C.surfaceContainerLow, border: `1px solid ${C.outline}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(q.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
                    >
                      <span className="ri ri-delete-bin-line" style={{ fontSize: 18, color: C.error }} />
                    </button>
                  )}
                </div>

                {/* Question body */}
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurface, lineHeight: 1.6, marginBottom: 10 }}>{q.text}</p>

                  {q.image_url && (
                    <div style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.outline}` }}>
                      <img src={q.image_url} alt="Question" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', background: C.surfaceContainerLow }} />
                    </div>
                  )}

                  {/* Options grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => {
                      const letter = String.fromCharCode(65 + i)
                      const colors = OPTION_COLORS[letter]
                      return (
                        <div key={opt} style={{ background: colors.bg, borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: colors.text, flexShrink: 0 }}>{letter}.</span>
                          <span style={{ fontFamily: 'Inter', fontSize: 13, color: colors.text, lineHeight: 1.4 }}>{q[opt]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  )
}
