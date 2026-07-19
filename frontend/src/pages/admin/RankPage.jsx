import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/client'
import BottomNav from '../../components/BottomNav'

export default function RankPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('daily')
  const [dailyRanks, setDailyRanks] = useState([])
  const [weeklyRanks, setWeeklyRanks] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true)
      try {
        const [dailyRes, weeklyRes] = await Promise.all([
          adminAPI.getRankings('daily', 50, selectedDate),
          adminAPI.getRankings('weekly', 50),
        ])
        const dailyItems = dailyRes.data.results || dailyRes.data || []
        const weeklyItems = weeklyRes.data.results || weeklyRes.data || []
        setDailyRanks(dailyItems)
        setWeeklyRanks(weeklyItems)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchRankings()
  }, [selectedDate])

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: 'emoji_events', color: 'text-admin-primary', bg: 'bg-admin-primary-container' }
    if (rank === 2) return { icon: 'emoji_events', color: 'text-admin-on-surface-variant', bg: 'bg-admin-surface-container' }
    if (rank === 3) return { icon: 'emoji_events', color: 'text-admin-primary', bg: 'bg-admin-primary-container' }
    return { icon: null, color: '', bg: '' }
  }

  const filteredWeekly = weeklyRanks.filter(
    (r) => (r.student_name || r.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (r.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: 'daily', label: 'Daily Rankings', icon: 'calendar_today' },
    { id: 'weekly', label: 'Weekly Rankings', icon: 'date_range' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-admin-surface">

      <header className="flex justify-between items-center w-full px-5 h-16 bg-admin-surface sticky top-0 z-40 border-b border-admin-outline-variant">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-admin-surface-container transition-colors">
            <span className="material-symbols-outlined text-admin-primary">menu</span>
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

      <main className="flex-1 max-w-5xl mx-auto px-5 pt-6 pb-32 space-y-6 w-full">

        <section className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-headline-md font-headline-md text-admin-on-surface">Rankings</h2>
              <p className="text-label-md font-label-md text-admin-on-surface-variant">View student rankings by period</p>
            </div>
          </div>
        </section>

        <div className="bg-admin-surface-container-lowest rounded-xl p-1 border border-admin-outline-variant flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-label-md font-label-md transition-all ${activeTab === tab.id ? 'bg-admin-primary text-admin-on-primary shadow-sm' : 'text-admin-on-surface-variant hover:bg-admin-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'daily' ? (
          <div className="space-y-4">
            <div className="bg-admin-surface-container-lowest rounded-xl p-5 border border-admin-outline-variant shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body-lg font-headline-sm text-admin-on-surface font-bold">Daily Rankings</h3>
                  <p className="text-label-sm font-label-sm text-admin-on-surface-variant">Leaderboard for a single day</p>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-admin-surface-container-low border border-admin-outline-variant rounded-lg px-3 py-2 text-body-md text-admin-on-surface outline-none focus:border-admin-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <p className="text-body-sm text-admin-on-surface-variant font-label-md">Top scorers by rank and points</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-admin-primary text-[18px]">download</span>
                <span className="text-label-md font-label-md text-admin-primary">Export</span>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-admin-surface-container-lowest rounded-xl p-4 border border-admin-outline-variant animate-pulse flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-admin-surface-container" />
                    <div className="flex-1">
                      <div className="w-32 h-4 rounded bg-admin-surface-container mb-2" />
                      <div className="w-20 h-3 rounded bg-admin-surface-container" />
                    </div>
                  </div>
                ))
              ) : dailyRanks.length === 0 ? (
                <div className="text-center py-12 bg-admin-surface-container-lowest rounded-xl border border-admin-outline-variant">
                  <span className="material-symbols-outlined text-[48px] text-admin-outline-variant block mb-3">emoji_events</span>
                  <p className="text-body-md text-admin-on-surface-variant font-label-md">No rankings for this date</p>
                </div>
              ) : (
                dailyRanks.map((rank) => {
                  const badge = getRankBadge(rank.rank)
                  return (
                    <div key={rank.id || rank.rank} className="bg-admin-surface-container-lowest rounded-xl p-4 border border-admin-outline-variant shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-title-md font-headline-md font-bold ${badge.bg} ${badge.color}`}>
                          {badge.icon ? (
                            <span className="material-symbols-outlined">{badge.icon}</span>
                          ) : (
                            <span>{rank.rank}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-body-lg font-headline-sm text-admin-on-surface">{rank.student_name || rank.full_name || 'Unknown'}</h4>
                          <p className="text-label-sm font-label-sm text-admin-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">badge</span>
                            {rank.roll_number || 'N/A'} • {rank.score || 0} pts
                          </p>
                        </div>
                      </div>
                      {badge.icon && (
                        <span className={`material-symbols-outlined text-[28px] ${badge.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {badge.icon}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-admin-surface-container-lowest rounded-xl p-5 border border-admin-outline-variant shadow-sm">
              <h3 className="text-body-lg font-headline-sm text-admin-on-surface font-bold">Weekly Rankings</h3>
              <p className="text-label-sm font-label-sm text-admin-on-surface-variant">Cumulative weekly leaderboard</p>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-admin-on-surface-variant text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-admin-surface-container-low border border-admin-outline-variant rounded-lg focus:border-admin-primary focus:ring-0 text-body-md font-body-md text-admin-on-surface placeholder:text-admin-on-surface-variant/50 outline-none"
              />
            </div>

            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-admin-surface-container-lowest rounded-xl p-4 border border-admin-outline-variant animate-pulse flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-admin-surface-container" />
                    <div className="flex-1">
                      <div className="w-32 h-4 rounded bg-admin-surface-container mb-2" />
                      <div className="w-20 h-3 rounded bg-admin-surface-container" />
                    </div>
                  </div>
                ))
              ) : filteredWeekly.length === 0 ? (
                <div className="text-center py-12 bg-admin-surface-container-lowest rounded-xl border border-admin-outline-variant">
                  <span className="material-symbols-outlined text-[48px] text-admin-outline-variant block mb-3">emoji_events</span>
                  <p className="text-body-md text-admin-on-surface-variant font-label-md">No weekly rankings yet</p>
                </div>
              ) : (
                filteredWeekly.map((rank) => {
                  const badge = getRankBadge(rank.rank)
                  return (
                    <div key={rank.id || rank.rank} className="bg-admin-surface-container-lowest rounded-xl p-4 border border-admin-outline-variant shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-title-md font-headline-md font-bold ${badge.bg} ${badge.color}`}>
                          {badge.icon ? (
                            <span className="material-symbols-outlined">{badge.icon}</span>
                          ) : (
                            <span>{rank.rank}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-body-lg font-headline-sm text-admin-on-surface">{rank.student_name || rank.full_name || 'Unknown'}</h4>
                          <p className="text-label-sm font-label-sm text-admin-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">badge</span>
                            {rank.roll_number || 'N/A'} • {rank.total_score || 0} pts
                          </p>
                        </div>
                      </div>
                      {badge.icon && (
                        <span className={`material-symbols-outlined text-[28px] ${badge.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {badge.icon}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav active="leaderboard" />
    </div>
  )
}
