import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/client'
import BottomNav from '../../components/BottomNav'

const C = {
  primary: '#465aa3',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
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
  background: '#f9f9f7',
}

export default function AdminQuestions() {
  const navigate = useNavigate()
  const [modules, setModules] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchQuestions = useCallback(async (searchTerm) => {
    setLoading(true)
    try {
      const res = await adminAPI.getQuestions(searchTerm || undefined)
      const grouped = {}
      const items = res.data.results || res.data
      items.forEach((q) => {
        if (!grouped[q.exam_date]) grouped[q.exam_date] = []
        grouped[q.exam_date].push(q)
      })
      setModules(grouped)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search, fetchQuestions])

  const handleDeleteDate = async (date) => {
    setDeleting(date)
    try {
      const questions = modules[date] || []
      await Promise.all(questions.map((q) => adminAPI.deleteQuestion(q.id)))
      setModules((prev) => {
        const next = { ...prev }
        delete next[date]
        return next
      })
    } catch {
      // silent
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  const dates = Object.keys(modules).sort((a, b) => b.localeCompare(a))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.surfaceContainer, borderBottom: `1px solid ${C.outline}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(70,90,163,0.08)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <span className="ri ri-menu-2-line" style={{ fontSize: 22, color: C.onSurface }} />
        </button>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: C.onSurface, flex: 1 }}>Question Library</h1>
        <button onClick={() => navigate('/admin/questions/upload')} style={{ background: C.primary, border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 600 }}>
          <span className="ri ri-add-line" style={{ fontSize: 16 }} />
          Upload
        </button>
      </header>

      <div style={{ height: 56 }} />

      {/* Search */}
      <div style={{ padding: '12px 16px', position: 'sticky', top: 56, zIndex: 40, background: C.background }}>
        <div style={{ background: C.surfaceContainer, borderRadius: 10, border: `1.5px solid ${C.outline}`, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ri ri-search-line" style={{ fontSize: 18, color: C.onSurfaceVariant }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by date or question..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter', fontSize: 14, color: C.onSurface, width: '100%' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <span className="ri ri-close-circle-fill" style={{ fontSize: 18, color: C.onSurfaceVariant }} />
            </button>
          )}
        </div>
      </div>

      <main style={{ flex: 1, padding: '0 16px 110px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 16 }}>
              <div style={{ width: '40%', height: 14, borderRadius: 4, background: C.surfaceContainerLow, marginBottom: 10, animation: 'pulse 2s ease infinite' }} />
              <div style={{ width: '70%', height: 10, borderRadius: 4, background: C.surfaceContainerLow, animation: 'pulse 2s ease infinite' }} />
            </div>
          ))
        ) : dates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span className="ri ri-inbox-2-line" style={{ fontSize: 48, color: C.outlineVariant, display: 'block', marginBottom: 12 }} />
            <p style={{ fontFamily: 'Inter', fontSize: 14, color: C.onSurfaceVariant }}>No questions found</p>
          </div>
        ) : (
          dates.map((date) => {
            const questions = modules[date]
            const isConfirming = confirmDelete === date
            return (
              <div key={date} style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(70,90,163,0.06)' }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => navigate(`/admin/questions/${date}`)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0, textAlign: 'left', flex: 1 }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: C.primaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="ri ri-calendar-event-line" style={{ fontSize: 20, color: C.primary }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, color: C.onSurface }}>{date}</p>
                      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant }}>{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                    </div>
                  </button>

                  {isConfirming ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => handleDeleteDate(date)}
                        disabled={deleting === date}
                        style={{ background: C.error, border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#fff', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500 }}
                      >
                        {deleting === date ? '...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{ background: C.surfaceContainerLow, border: `1px solid ${C.outline}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(date)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}
                    >
                      <span className="ri ri-delete-bin-line" style={{ fontSize: 20, color: C.error }} />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </main>

      <BottomNav active="library" />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  )
}
