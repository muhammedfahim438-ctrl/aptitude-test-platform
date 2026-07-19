import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/client'
import BottomNav from '../../components/BottomNav'

export default function TeacherReports() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('performance')
  const [reports, setReports] = useState([])
  const [selectedRange, setSelectedRange] = useState('weekly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      try {
        const res = await adminAPI.getReports(selectedRange)
        const items = res.data.results || res.data || []
        setReports(items)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [selectedRange])

  const handleDownload = async (examDate) => {
    try {
      const res = await adminAPI.downloadReport(examDate)
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${examDate}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch {
      // silent
    }
  }

  const tabs = [
    { id: 'performance', label: 'Performance', icon: 'bar_chart' },
    { id: 'reports', label: 'Reports', icon: 'description' },
  ]

  const filteredReports = reports.filter((r) => {
    const date = r.exam_date || r.date
    return date
  })

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
          <div className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-headline-md font-headline-md text-admin-on-surface">Performance Reports</h2>
              <p className="text-label-md font-label-md text-admin-on-surface-variant">Track student progress and exam performance</p>
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

        {activeTab === 'performance' ? (
          <div className="space-y-6">
            <div className="bg-admin-surface-container-lowest rounded-xl p-5 border border-admin-outline-variant shadow-sm">
              <h3 className="text-body-lg font-headline-sm text-admin-on-surface font-bold mb-2">Overview</h3>
              <p className="text-label-sm font-label-sm text-admin-on-surface-variant">Key performance metrics for the selected period</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Avg Score', value: '7.2/10', icon: 'trending_up', color: 'text-admin-primary' },
                { label: 'Completion', value: '92%', icon: 'check_circle', color: 'text-admin-secondary' },
                { label: 'Participation', value: '85%', icon: 'group', color: 'text-admin-primary' },
                { label: 'Top Score', value: '10/10', icon: 'emoji_events', color: 'text-admin-secondary' },
              ].map((item) => (
                <div key={item.label} className="bento-card bg-admin-surface-container-lowest p-5 rounded-xl border border-admin-outline-variant shadow-sm">
                  <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                  <div className="text-title-lg font-headline-md text-admin-on-surface mt-2 mb-1">{item.value}</div>
                  <div className="text-label-sm font-label-md text-admin-on-surface-variant">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="bento-card bg-admin-surface-container-lowest p-6 rounded-xl border border-admin-outline-variant shadow-sm">
              <h3 className="text-title-md font-headline-md text-admin-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-admin-primary">school</span>
                Student Performance
              </h3>
              <p className="text-label-md font-label-md text-admin-on-surface-variant mb-6">Detailed breakdown by student</p>

              <div className="bg-admin-surface-container-low rounded-xl p-8 text-center border border-admin-outline-variant">
                <span className="material-symbols-outlined text-[48px] text-admin-outline-variant block mb-3">analytics</span>
                <p className="text-body-md text-admin-on-surface-variant font-label-md">Performance data will appear here once students start taking exams.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-admin-surface-container-lowest rounded-xl p-5 border border-admin-outline-variant shadow-sm">
              <div>
                <h3 className="text-body-lg font-headline-sm text-admin-on-surface font-bold">Exam Reports</h3>
                <p className="text-label-sm font-label-sm text-admin-on-surface-variant">Download detailed performance reports</p>
              </div>
              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="bg-admin-surface-container-low border border-admin-outline-variant rounded-lg px-4 py-2 text-body-md text-admin-on-surface outline-none focus:border-admin-primary font-label-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-admin-surface-container-lowest rounded-xl p-5 border border-admin-outline-variant animate-pulse flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-admin-surface-container" />
                      <div>
                        <div className="w-32 h-4 rounded bg-admin-surface-container mb-2" />
                        <div className="w-20 h-3 rounded bg-admin-surface-container" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12 bg-admin-surface-container-lowest rounded-xl border border-admin-outline-variant">
                  <span className="material-symbols-outlined text-[48px] text-admin-outline-variant block mb-3">description</span>
                  <p className="text-body-md text-admin-on-surface-variant font-label-md">No reports available for this period</p>
                </div>
              ) : (
                filteredReports.map((report) => {
                  const date = report.exam_date || report.date
                  return (
                    <div key={date} className="bg-admin-surface-container-lowest rounded-xl p-5 border border-admin-outline-variant shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-admin-primary-container rounded-xl flex items-center justify-center text-admin-primary">
                          <span className="material-symbols-outlined">description</span>
                        </div>
                        <div>
                          <h4 className="text-body-lg font-headline-sm text-admin-on-surface">{date}</h4>
                          <p className="text-label-sm font-label-sm text-admin-on-surface-variant">
                            {report.student_count || 0} students • {report.total_submissions || 0} submissions
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(date)}
                        className="flex items-center gap-2 text-admin-secondary hover:text-admin-primary transition-colors"
                      >
                        <span className="material-symbols-outlined">download</span>
                        <span className="text-label-md font-label-md hidden md:inline">Download CSV</span>
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <div className="bg-admin-surface-container-lowest rounded-xl p-6 border border-admin-outline-variant shadow-sm">
              <h3 className="text-title-md font-headline-md text-admin-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-admin-primary">history</span>
                Download History
              </h3>
              <div className="bg-admin-surface-container-low rounded-xl p-8 text-center border border-admin-outline-variant">
                <span className="material-symbols-outlined text-[48px] text-admin-outline-variant block mb-3">history</span>
                <p className="text-body-md text-admin-on-surface-variant font-label-md">No download history yet.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav active="reports" />
    </div>
  )
}
