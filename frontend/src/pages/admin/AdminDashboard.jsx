import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/client'
import BottomNav from '../../components/BottomNav'

const NAV_TILES = [
  { key: 'stats', label: 'Stats', icon: 'analytics', path: '/admin/stats' },
  { key: 'rank', label: 'Rank', icon: 'leaderboard', path: '/admin/rank' },
  { key: 'library', label: 'Library', icon: 'inventory_2', path: '/admin/questions' },
  { key: 'reports', label: 'Reports', icon: 'assessment', path: '/admin/reports' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalStudents: 0, testsCompletedToday: 0, questionsLiveToday: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getDashboardStats()
        const d = res.data
        setStats({
          totalStudents: d.total_students ?? d.totalStudents ?? 0,
          testsCompletedToday: d.tests_completed_today ?? d.testsCompletedToday ?? 0,
          questionsLiveToday: d.questions_live_today ?? d.questionsLiveToday ?? 0,
        })
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const firstName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user'))
      return u?.full_name?.split(' ')[0] || 'Teacher'
    } catch {
      return 'Teacher'
    }
  })()

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div className="bg-admin-surface-container-lowest text-admin-on-surface flex flex-col min-h-screen">

      <header className="sticky top-0 z-50 bg-admin-surface flex justify-between items-center w-full px-5 h-16 transition-colors duration-200 ease-in-out border-b border-admin-outline-variant">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-admin-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-admin-secondary">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-admin-primary-container flex items-center justify-center overflow-hidden">
              <img src="/app-logo.png" alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-headline-sm font-headline-md font-bold text-admin-on-surface">APPTIST</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-label-md font-label-md text-admin-on-surface-variant">{today}</span>
          </div>
          <button className="relative p-2 rounded-full hover:bg-admin-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-admin-on-surface-variant">notifications</span>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-admin-primary rounded-full border-2 border-admin-surface" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 space-y-8 max-w-5xl mx-auto w-full">

        <section className="relative overflow-hidden rounded-lg p-6 flex flex-col justify-center min-h-[160px] shadow-md border border-admin-outline-variant/30" style={{ background: 'linear-gradient(135deg, #ff8c33 0%, #ff6b00 100%)' }}>
          <div className="relative z-10">
            <h2 className="text-display-lg font-display-lg text-white mb-2">Good morning, {firstName}!</h2>
            <p className="text-body-lg font-body-lg text-white/90">Here is your platform activity for today.</p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl" />
        </section>

        <section className="space-y-3">
          <h3 className="text-label-md font-label-md text-admin-on-surface-variant tracking-widest uppercase px-1">Navigation</h3>
          <div className="grid grid-cols-2 gap-4 md:gap-6 py-2">
            {NAV_TILES.map((tile) => (
              <div
                key={tile.key}
                onClick={() => navigate(tile.path)}
                className="bg-admin-secondary-container p-4 rounded-lg flex flex-col gap-2 shadow-sm border border-admin-secondary/10 hover:scale-95 transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-admin-secondary p-2 bg-white/50 rounded-xl">{tile.icon}</span>
                </div>
                <div>
                  <p className="text-headline-sm font-bold text-admin-secondary">{tile.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-label-md font-label-md text-admin-on-surface-variant tracking-widest uppercase px-1">Quick Actions</h3>
          <div className="flex overflow-x-auto gap-4 py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            <button onClick={() => navigate('/admin/questions/upload')} className="flex items-center gap-2 px-6 py-3 bg-admin-primary text-white font-headline-sm whitespace-nowrap rounded-full shadow-sm hover:scale-95 transition-transform shrink-0">
              <span className="material-symbols-outlined text-[20px]">upload</span>
              <span className="text-body-md font-bold">Upload Questions</span>
            </button>
            <button onClick={() => navigate('/admin/rank')} className="flex items-center gap-2 px-6 py-3 bg-admin-secondary-container text-admin-secondary font-headline-sm whitespace-nowrap rounded-full shadow-sm hover:scale-95 transition-transform shrink-0 border border-admin-secondary/10">
              <span className="material-symbols-outlined text-[20px]">emoji_events</span>
              <span className="text-body-md font-bold">View Scorers</span>
            </button>
            <button onClick={() => navigate('/admin/stats')} className="flex items-center gap-2 px-6 py-3 bg-admin-secondary-container text-admin-secondary font-headline-sm whitespace-nowrap rounded-full shadow-sm hover:scale-95 transition-transform shrink-0 border border-admin-secondary/10">
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
              <span className="text-body-md font-bold">Analytics</span>
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 md:gap-6">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-admin-surface-container-low p-4 rounded-lg shadow-sm border border-admin-outline-variant/50 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-admin-surface-container mb-3" />
                <div className="w-16 h-7 rounded bg-admin-surface-container mb-1" />
                <div className="w-24 h-3 rounded bg-admin-surface-container" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-admin-surface-container-low p-4 rounded-lg flex flex-col gap-2 shadow-sm border border-admin-outline-variant/50 hover:border-admin-secondary/30 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-admin-secondary p-2 bg-admin-secondary-container rounded-xl">group</span>
                </div>
                <div>
                  <p className="text-display-lg font-display-lg text-admin-on-surface">{stats.totalStudents.toLocaleString()}</p>
                  <p className="text-label-md font-label-md text-admin-on-surface-variant">Total Students</p>
                </div>
              </div>
              <div className="bg-admin-surface-container-low p-4 rounded-lg flex flex-col gap-2 shadow-sm border border-admin-outline-variant/50 hover:border-admin-secondary/30 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-admin-secondary p-2 bg-admin-secondary-container rounded-xl">check_circle</span>
                </div>
                <div>
                  <p className="text-display-lg font-display-lg text-admin-on-surface">{stats.testsCompletedToday}</p>
                  <p className="text-label-md font-label-md text-admin-on-surface-variant">Tests Completed</p>
                </div>
              </div>
              <div className="bg-admin-surface-container-low p-4 rounded-lg flex flex-col gap-2 shadow-sm border border-admin-outline-variant/50 hover:border-admin-secondary/30 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-admin-primary p-2 bg-orange-100 rounded-xl">description</span>
                  <span className="text-label-sm font-label-sm text-admin-primary font-bold">Live</span>
                </div>
                <div>
                  <p className="text-display-lg font-display-lg text-admin-on-surface">{stats.questionsLiveToday}</p>
                  <p className="text-label-md font-label-md text-admin-on-surface-variant">Questions Live</p>
                </div>
              </div>
              <div className="bg-admin-surface-container-low p-4 rounded-lg flex flex-col gap-2 shadow-sm border border-admin-outline-variant/50 hover:border-admin-primary/30 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-admin-primary p-2 bg-admin-primary-container rounded-xl">school</span>
                </div>
                <div>
                  <p className="text-display-lg font-display-lg text-admin-on-surface">{firstName}</p>
                  <p className="text-label-md font-label-md text-admin-on-surface-variant">Logged In</p>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <BottomNav active="home" />
    </div>
  )
}
