import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/client'
import BottomNav from '../../components/BottomNav'

const C = {
  primary: '#465aa3',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
  primaryLight: '#8CA0EE',
  secondary: '#8a5108',
  secondaryContainer: '#FFEEDC',
  tertiary: '#116b51',
  tertiaryContainer: '#E5FAF1',
  onTertiaryContainer: '#1F8A5F',
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
  background: '#f9f9f7',
  orange: '#E8621A',
  orangeContainer: '#FFF0E8',
}

const PRESETS = [
  { label: 'This Week', range: 'this_week' },
  { label: 'Last Week', range: 'last_week' },
  { label: 'This Month', range: 'this_month' },
  { label: 'Last Month', range: 'last_month' },
]

function toDateString(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function TeacherReports() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('preset')
  const [selectedPreset, setSelectedPreset] = useState('this_week')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(null)

  const fetchReport = async () => {
    setLoading(true)
    try {
      let res
      if (mode === 'preset') {
        res = await adminAPI.getReports(undefined, undefined, selectedPreset)
      } else {
        res = await adminAPI.getReports(dateFrom || undefined, dateTo || undefined)
      }
      setReportData(res.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [mode, selectedPreset])

  const handleDownload = async (date) => {
    setDownloading(date)
    try {
      const res = await adminAPI.downloadReport(date)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `Master_Report_${date}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      // silent
    } finally {
      setDownloading(null)
    }
  }

  const students = reportData?.students || reportData?.results || []
  const attendance = reportData?.attendance || { attended: 0, absent: 0 }
  const maxScore = Math.max(...students.map((s) => s.score || 0), 1)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: C.surfaceContainer, borderBottom: `1px solid ${C.outline}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(70,90,163,0.08)' }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <span className="ri ri-arrow-left-line" style={{ fontSize: 22, color: C.onSurface }} />
        </button>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, color: C.onSurface }}>Reports</h1>
      </header>

      <div style={{ height: 56 }} />

      <main style={{ flex: 1, padding: '16px 16px 110px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: C.surfaceContainerLow, borderRadius: 10, padding: 4, border: `1px solid ${C.outline}` }}>
          {['preset', 'custom'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
                fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: mode === m ? C.primary : 'transparent',
                color: mode === m ? '#fff' : C.onSurfaceVariant,
              }}
            >
              {m === 'preset' ? 'Quick Filters' : 'Custom Range'}
            </button>
          ))}
        </div>

        {/* Preset filters */}
        {mode === 'preset' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PRESETS.map((p) => (
              <button
                key={p.range}
                onClick={() => setSelectedPreset(p.range)}
                style={{
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  border: selectedPreset === p.range ? `2px solid ${C.primary}` : `1px solid ${C.outline}`,
                  background: selectedPreset === p.range ? C.primaryContainer : C.surfaceContainer,
                  fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600,
                  color: selectedPreset === p.range ? C.onPrimaryContainer : C.onSurfaceVariant,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span className={`ri ${selectedPreset === p.range ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}`} style={{ fontSize: 16 }} />
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Custom range */}
        {mode === 'custom' && (
          <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{ width: '100%', background: C.surfaceContainerLow, borderRadius: 8, border: `1px solid ${C.outline}`, padding: '8px 10px', fontFamily: 'Inter', fontSize: 13, color: C.onSurface, outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, color: C.onSurfaceVariant, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{ width: '100%', background: C.surfaceContainerLow, borderRadius: 8, border: `1px solid ${C.outline}`, padding: '8px 10px', fontFamily: 'Inter', fontSize: 13, color: C.onSurface, outline: 'none' }}
                />
              </div>
            </div>
            <button
              onClick={fetchReport}
              disabled={loading}
              style={{
                width: '100%', padding: '10px', background: C.primary, border: 'none', borderRadius: 8,
                fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600, color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span className="ri ri-search-line" style={{ fontSize: 16 }} />
              {loading ? 'Loading...' : 'Apply Filter'}
            </button>
          </div>
        )}

        {/* Attendance Stats */}
        {reportData && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: C.tertiaryContainer, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="ri ri-user-follow-line" style={{ fontSize: 24, color: C.tertiary }} />
              <div>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: '#1F8A5F' }}>{attendance.attended}</p>
                <p style={{ fontFamily: 'Inter', fontSize: 11, color: C.onTertiaryContainer }}>Attended</p>
              </div>
            </div>
            <div style={{ flex: 1, background: C.errorContainer, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="ri ri-user-unfollow-line" style={{ fontSize: 24, color: C.error }} />
              <div>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.error }}>{attendance.absent}</p>
                <p style={{ fontFamily: 'Inter', fontSize: 11, color: C.onSurfaceVariant }}>Absent</p>
              </div>
            </div>
          </div>
        )}

        {/* Student Performance Table */}
        <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outline}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(70,90,163,0.06)' }}>
          <div style={{ padding: '12px 16px', background: C.primaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 600, color: C.onPrimaryContainer }}>Student Performance</h3>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onPrimaryContainer }}>{students.length} student{students.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: `1px solid ${C.outline}`, display: 'flex', alignItems: 'center', gap: 10, animation: 'pulse 2s ease infinite' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.surfaceContainerLow }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '60%', height: 10, borderRadius: 4, background: C.surfaceContainerLow, marginBottom: 4 }} />
                  <div style={{ width: '40%', height: 8, borderRadius: 4, background: C.surfaceContainerLow }} />
                </div>
              </div>
            ))
          ) : students.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center' }}>
              <span className="ri ri-file-list-3-line" style={{ fontSize: 36, color: C.outlineVariant, display: 'block', marginBottom: 8 }} />
              <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onSurfaceVariant }}>No data available for this period</p>
            </div>
          ) : (
            students.map((student, idx) => {
              const name = student.student_name || student.full_name || student.student?.full_name || 'Unknown'
              const score = student.score || 0
              const roll = student.roll_number || student.student?.roll_number || ''
              const barWidth = (score / maxScore) * 100
              return (
                <div key={student.id || idx} style={{ padding: '10px 16px', borderBottom: idx < students.length - 1 ? `1px solid ${C.outline}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant, width: 20, textAlign: 'center' }}>{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <p style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600, color: C.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 600, color: C.primary, flexShrink: 0 }}>{score}</span>
                    </div>
                    {roll && <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.onSurfaceVariant, marginBottom: 3 }}>{roll}</p>}
                    <div style={{ height: 5, borderRadius: 3, background: C.surfaceContainerLow, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barWidth}%`, borderRadius: 3, background: C.primary, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Download */}
        {reportData?.exam_date && (
          <button
            onClick={() => handleDownload(reportData.exam_date)}
            disabled={downloading === reportData.exam_date}
            style={{
              width: '100%', padding: '12px', background: C.surfaceContainer, border: `1.5px solid ${C.outline}`,
              borderRadius: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600, color: C.primary,
            }}
          >
            <span className="ri ri-download-2-line" style={{ fontSize: 18 }} />
            {downloading === reportData.exam_date ? 'Downloading...' : 'Download CSV Report'}
          </button>
        )}
      </main>

      <BottomNav active="reports" />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
    </div>
  )
}
