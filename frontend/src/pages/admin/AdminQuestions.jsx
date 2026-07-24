import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/client'
import BottomNav from '../../components/BottomNav'

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
    const timer = setTimeout(() => fetchQuestions(search), 500)
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
    <div className="flex flex-col min-h-screen bg-background">

      <header className="flex justify-between items-center w-full px-5 h-16 bg-admin-surface sticky top-0 z-40 border-b border-admin-outline-variant">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-full hover:bg-admin-surface-container transition-colors">
            <span className="material-symbols-outlined text-admin-primary">arrow_back</span>
          </button>
          <h1 className="text-headline-sm font-headline-md font-bold text-admin-on-surface">Admin Command</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-admin-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-admin-on-surface-variant">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-admin-primary-container flex items-center justify-center text-admin-on-primary-container font-label-md">AD</div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-5 pt-6 pb-32 space-y-8 w-full">

        <section className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-headline-md font-headline-md text-admin-on-surface">Question Bank Editor</h2>
              <p className="text-label-md font-label-md text-admin-on-surface-variant">Manage and refine aptitude test items</p>
            </div>
            <button onClick={() => navigate('/admin/questions/upload')} className="bg-admin-secondary text-admin-on-secondary px-6 py-3 rounded-full flex items-center gap-2 font-headline-sm hover:opacity-90 transition-opacity shadow-sm">
              <span className="material-symbols-outlined">add</span>
              Add Row
            </button>
          </div>
        </section>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-admin-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules..."
            className="w-full pl-10 pr-4 py-2.5 bg-admin-surface-container-low border border-admin-outline-variant rounded-lg focus:border-admin-primary focus:ring-0 text-body-md font-body-md text-admin-on-surface placeholder:text-admin-on-surface-variant/50 outline-none"
          />
        </div>

        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-admin-surface-container-lowest rounded-lg p-4 flex items-center justify-between shadow-sm border border-admin-outline-variant animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-admin-surface-container" />
                  <div>
                    <div className="w-32 h-4 rounded bg-admin-surface-container mb-2" />
                    <div className="w-20 h-3 rounded bg-admin-surface-container" />
                  </div>
                </div>
              </div>
            ))
          ) : dates.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[48px] text-admin-outline-variant block mb-3">inbox</span>
              <p className="text-body-md text-admin-on-surface-variant">No questions found</p>
            </div>
          ) : (
            dates.map((date) => {
              const questions = modules[date]
              const isConfirming = confirmDelete === date
              return (
                <div key={date} className="group bg-admin-surface-container-lowest rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all border border-admin-outline-variant hover:border-admin-secondary/30">
                  <button
                    onClick={() => navigate(`/admin/questions/${date}`)}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <div className="w-12 h-12 bg-admin-primary-container rounded-xl flex items-center justify-center text-admin-primary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    </div>
                    <div>
                      <h3 className="text-body-lg font-headline-sm text-admin-on-surface">{date}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-label-sm font-label-sm text-admin-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">group</span>
                          {questions.length} question{questions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    {isConfirming ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteDate(date)}
                          disabled={deleting === date}
                          className="px-3 py-1.5 bg-admin-error text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity"
                        >
                          {deleting === date ? '...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 bg-admin-surface-container-low border border-admin-outline-variant rounded-lg font-label-md text-admin-on-surface-variant hover:bg-admin-surface-container transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(date)}
                        className="p-2 flex items-center gap-1 text-admin-error hover:bg-admin-error/10 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined">delete</span>
                        <span className="hidden md:inline font-label-md text-label-md">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      <BottomNav active="library" />
    </div>
  )
}