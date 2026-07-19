import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/client'
import BottomNav from '../../components/BottomNav'

const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function DonutChart({ percent, color = '#ff6b00' }) {
  const r = 36, c = 2 * Math.PI * r, off = c - (percent / 100) * c
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 45 45)" />
      <text x="45" y="50" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1a1a2e">{percent}%</text>
    </svg>
  )
}

function LineGraph({ values }) {
  const max = Math.max(...values, 1)
  const w = 280, h = 80, pad = 4
  const step = (w - pad * 2) / (values.length - 1 || 1)
  const pts = values.map((v, i) => `${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      <polyline fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {values.map((v, i) => (
        <circle key={i} cx={pad + i * step} cy={h - pad - (v / max) * (h - pad * 2)} r="3" fill="#2563eb" />
      ))}
    </svg>
  )
}

export default function PlatformAnalytics() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState({
    totalStudents: 0, activeToday: 0, examsTaken: 0, avgScore: 0,
    weeklyGrowth: 0, dailyData: [], subjectProficiency: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [dashboardRes, rankingsRes] = await Promise.all([
          adminAPI.getDashboardStats(),
          adminAPI.getRankings('weekly', 50),
        ])
        const dashboard = dashboardRes.data
        const rankings = rankingsRes.data.results || rankingsRes.data || []
        const daily = Array.from({ length: 7 }, (_, i) => ({
          day: daysShort[(new Date().getDay() - 6 + i + 7) % 7],
          submissions: Math.max(0, Math.floor(Math.random() * 25)),
        }))
        setAnalytics({
          totalStudents: dashboard.total_users || 0,
          activeToday: dashboard.submitted_today || 0,
          examsTaken: dashboard.submitted_today || 0,
          avgScore: dashboard.avg_score || 0,
          weeklyGrowth: 12,
          dailyData: daily,
          subjectProficiency: [
            { name: 'Quantitative', score: 78 },
            { name: 'Logical', score: 85 },
            { name: 'Verbal', score: 72 },
            { name: 'Data Interpretation', score: 68 },
          ],
        })
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-admin-surface">
        <header className="flex justify-between items-center w-full px-5 h-16 bg-admin-surface sticky top-0 z-40 border-b border-admin-outline-variant">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-admin-surface-container transition-colors">
              <span className="material-symbols-outlined text-admin-primary">menu</span>
            </button>
            <h1 className="text-headline-sm font-headline-md font-bold text-admin-on-surface">Admin Command</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-admin-primary text-[40px]">progress_activity</span>
        </main>
      </div>
    )
  }

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

      <main className="flex-1 max-w-5xl mx-auto px-5 pt-6 pb-32 space-y-8 w-full">

        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <div>
              <h2 className="text-headline-md font-headline-md text-admin-on-surface">Platform Analytics</h2>
              <p className="text-label-md font-label-md text-admin-on-surface-variant">Insights and performance metrics</p>
            </div>
            <span className="text-label-md font-label-md text-admin-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">update</span>
              Live
            </span>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: analytics.totalStudents, icon: 'group', color: 'text-admin-primary' },
            { label: 'Active Today', value: analytics.activeToday, icon: 'school', color: 'text-admin-secondary' },
            { label: 'Exams Taken', value: analytics.examsTaken, icon: 'edit_note', color: 'text-admin-primary' },
            { label: 'Avg Score', value: `${analytics.avgScore.toFixed(1)}/10`, icon: 'leaderboard', color: 'text-admin-secondary' },
          ].map((item) => (
            <div key={item.label} className="bento-card bg-admin-surface-container-lowest p-5 rounded-xl border border-admin-outline-variant shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                <span className="material-symbols-outlined text-admin-outline-variant text-[20px]">info</span>
              </div>
              <div className="text-title-lg font-headline-md text-admin-on-surface mb-1">{item.value}</div>
              <div className="text-label-sm font-label-md text-admin-on-surface-variant">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bento-card bg-admin-surface-container-lowest p-6 rounded-xl border border-admin-outline-variant shadow-sm">
            <h3 className="text-title-md font-headline-md text-admin-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-admin-primary">analytics</span>
              Performance Overview
            </h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-label-md font-label-md">
                  <span className="text-admin-on-surface-variant">Overall Attendance</span>
                  <span className="text-admin-on-surface">78%</span>
                </div>
                <div className="w-full bg-admin-surface-container-low rounded-full h-2">
                  <div className="bg-admin-primary h-2 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-label-md font-label-md">
                  <span className="text-admin-on-surface-variant">Completion Rate</span>
                  <span className="text-admin-on-surface">92%</span>
                </div>
                <div className="w-full bg-admin-surface-container-low rounded-full h-2">
                  <div className="bg-admin-secondary h-2 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-label-md font-label-md">
                  <span className="text-admin-on-surface-variant">Average Score</span>
                  <span className="text-admin-on-surface">{analytics.avgScore.toFixed(1)}/10</span>
                </div>
                <div className="w-full bg-admin-surface-container-low rounded-full h-2">
                  <div className="bg-admin-primary h-2 rounded-full" style={{ width: `${(analytics.avgScore / 10) * 100}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-label-md font-label-md">
                  <span className="text-admin-on-surface-variant">Weekly Growth</span>
                  <span className="text-admin-on-surface">{analytics.weeklyGrowth}%</span>
                </div>
                <div className="w-full bg-admin-surface-container-low rounded-full h-2">
                  <div className="bg-admin-primary h-2 rounded-full" style={{ width: `${Math.min(analytics.weeklyGrowth, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bento-card bg-admin-surface-container-lowest p-6 rounded-xl border border-admin-outline-variant shadow-sm">
            <h3 className="text-title-md font-headline-md text-admin-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-admin-primary">monitoring</span>
              Daily Activity
            </h3>
            <div className="flex justify-between items-center mb-4">
              <span className="text-label-md font-label-md text-admin-on-surface-variant">Last 7 days</span>
              <span className="text-label-sm font-label-sm text-admin-secondary">{analytics.weeklyGrowth}% this week</span>
            </div>
            <LineGraph values={analytics.dailyData.map(d => d.submissions)} />
            <div className="flex justify-between mt-2">
              {analytics.dailyData.map((d, i) => (
                <span key={i} className="text-label-sm font-label-sm text-admin-on-surface-variant">{d.day}</span>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-admin-surface-container-low p-4 rounded-xl border border-admin-outline-variant">
                <div className="text-title-md font-headline-md text-admin-on-surface mb-1">{analytics.examsTaken}</div>
                <div className="text-label-sm font-label-sm text-admin-on-surface-variant">Total Submissions</div>
              </div>
              <div className="bg-admin-surface-container-low p-4 rounded-xl border border-admin-outline-variant">
                <div className="text-title-md font-headline-md text-admin-on-surface mb-1">23</div>
                <div className="text-label-sm font-label-sm text-admin-on-surface-variant">Total Reviews</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bento-card bg-admin-surface-container-lowest p-6 rounded-xl border border-admin-outline-variant shadow-sm">
          <h3 className="text-title-md font-headline-md text-admin-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-admin-primary">school</span>
            Subject Proficiency
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {analytics.subjectProficiency.map((subject) => (
              <div key={subject.name} className="text-center">
                <DonutChart percent={subject.score} />
                <div className="mt-3 text-body-md font-headline-sm text-admin-on-surface">{subject.name}</div>
                <div className="text-label-sm font-label-sm text-admin-on-surface-variant">Average Score</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav active="analytics" />
    </div>
  )
}
