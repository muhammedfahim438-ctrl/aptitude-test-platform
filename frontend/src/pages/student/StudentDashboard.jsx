import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import StudentBottomNav from '../../components/StudentBottomNav'
import { studentAPI } from '../../api/client'

function formatDate(d) {
  return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try { setUser(jwtDecode(token)) } catch { setUser(null) }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function fetchDashboard() {
      setLoading(true)
      setError(null)
      try {
        const res = await studentAPI.getDashboard()
        if (!cancelled) setData(res.data)
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || 'Failed to load dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDashboard()
    return () => { cancelled = true }
  }, [])

  const examCardState = () => {
    if (!data) return null
    const s = data.today_status
    const score = data.today?.score
    const total = data.today?.total_questions || 20
    if (s === 'before_window') return { icon: 'schedule', title: 'Exam starts at 10:00 AM', subtitle: 'Get ready! The aptitude test window opens soon.', btnLabel: null }
    if (s === 'in_progress') return { icon: 'play_circle', title: 'Exam in Progress', subtitle: 'The exam window is open. Take the test now!', btnLabel: 'Start Exam', btnAction: () => navigate('/student/exam') }
    if (s === 'submitted') return { icon: 'check_circle', title: 'Exam Submitted', subtitle: 'Awaiting results after 2:00 PM IST.', btnLabel: null }
    if (s === 'reviewed') return { icon: 'emoji_events', title: `Score: ${score}/${total}`, subtitle: 'Your results are ready. Review your answers!', btnLabel: 'View Result', btnAction: () => navigate('/student/review') }
    if (s === 'missed') return { icon: 'event_busy', title: "Missed Today's Exam", subtitle: 'The exam window has closed. Come back tomorrow!', btnLabel: null }
    return null
  }

  const card = examCardState()
  const name = user?.full_name || 'Student'
  const rollNo = user?.roll_number || ''
  const dept = user?.department || ''
  const year = user?.year || ''
  const semester = user?.semester || ''

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background font-body-md text-on-background">
      <header className="fixed top-0 w-full bg-surface-container shadow-sm z-50 flex items-center justify-between px-4 py-3 border-b border-outline">
        <h1 className="font-headline-md text-headline-md text-primary tracking-tight">Student Dashboard</h1>
        <button className="p-2 rounded-full hover:bg-surface-variant transition-colors duration-200 text-on-surface-variant">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="pt-20 pb-24 px-4 md:px-12 max-w-[1440px] mx-auto">
        <section className="mb-6">
          <div className="bg-surface-container rounded-xl p-4 shadow-sm flex flex-col items-center gap-6 border border-outline">
            <div className="flex-1 text-center space-y-2">
              <div className="flex flex-col items-center gap-3">
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Welcome Back, {name}</h2>
                {dept && <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container font-label-lg text-label-sm rounded-full">{dept}</span>}
              </div>
              {rollNo && <p className="font-body-lg text-body-lg text-on-surface-variant">Reg No: <span className="text-on-surface font-medium">{rollNo}</span></p>}
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                {year && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>school</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{year}</span>
                  </div>
                )}
                {semester && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>event</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{semester}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: 32 }}>sync</span>
            <p className="mt-2 text-body-sm">Loading dashboard...</p>
          </div>
        )}

        {error && (
          <div className="bg-error-container rounded-xl p-4 text-on-error-container text-body-sm mb-4">{error}</div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group relative bg-surface-container rounded-xl p-4 shadow-sm border border-outline transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-start justify-between mb-2">
                <div className="p-3 bg-primary-container rounded-xl text-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>assignment</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">north_east</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{card?.title || 'Assessment'}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">{card?.subtitle || 'View and manage your current assignments.'}</p>
              {card?.btnLabel ? (
                <button onClick={card.btnAction} className="w-full py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm">
                  {card.btnLabel}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Current status</span>
                </div>
              )}
            </div>

            <div className="group relative bg-surface-container rounded-xl p-4 shadow-sm border border-outline transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer" onClick={() => navigate('/student/review')}>
              <div className="flex items-start justify-between mb-2">
                <div className="p-3 bg-secondary-container rounded-xl text-on-secondary-fixed">
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>library_books</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">north_east</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Answer Review</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">Access a detailed breakdown of your performance, including correct answers.</p>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Review your results</span>
              </div>
            </div>

            <div className="group relative bg-surface-container rounded-xl p-4 shadow-sm border border-outline border-dashed transition-all duration-300 hover:bg-error-container/10">
              <div className="flex items-start justify-between mb-2">
                <div className="p-3 bg-surface-container-low rounded-xl text-on-surface-variant group-hover:text-error transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>logout</span>
                </div>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Logout</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">Securely end your current session.</p>
              <button onClick={handleLogout} className="w-full py-2 bg-surface-container-high rounded-lg text-on-surface-variant font-label-md text-label-md group-hover:bg-error-container group-hover:text-on-error-container transition-all">
                Sign Out
              </button>
            </div>
          </div>
        )}

        {!loading && data && data.recent_scores.length > 0 && (
          <section className="mt-6">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Recent Scores</h3>
            <div className="flex flex-col gap-3">
              {data.recent_scores.map((item) => {
                const pct = Math.round((item.score / item.total_questions) * 100)
                return (
                  <div key={item.date} className="bg-surface-container rounded-xl p-4 border border-outline flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-body-md text-body-md text-on-surface font-medium m-0">{dayLabel(item.date)}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant m-0 mt-0.5">{item.score}/{item.total_questions}</p>
                    </div>
                    <div className="w-20 h-1.5 bg-outline-variant rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct >= 70 ? 'bg-tertiary' : pct >= 50 ? 'bg-secondary' : 'bg-error'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {!loading && data && data.recent_scores.length === 0 && (
          <div className="bg-surface-container rounded-xl p-8 border border-outline text-center mt-6">
            <span className="material-symbols-outlined text-on-surface-variant/40" style={{ fontSize: 40 }}>quiz</span>
            <p className="font-body-md text-body-md text-on-surface-variant mt-3">No scores yet — take your first exam today!</p>
          </div>
        )}
      </main>

      <StudentBottomNav />
    </div>
  )
}
