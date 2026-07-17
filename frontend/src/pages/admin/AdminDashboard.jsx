// src/pages/admin/AdminDashboard.jsx
// Admin home screen. Fetches live stats from /api/admin/dashboard-stats/.
//
// Nav tiles: Library and Reports are wired to real routes.
// Stats and Rank are NOT built yet in this pass — clicking them shows a
// "coming soon" toast instead of navigating to a broken route.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api/axiosClient'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [toast, setToast]     = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    adminAPI.getDashboardStats()
      .then((res) => { if (!cancelled) setStats(res.data) })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Could not load dashboard stats.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const comingSoon = (label) => {
    setToast(`${label} — coming soon`)
    setTimeout(() => setToast(''), 2000)
  }

  const handleDownloadReport = async () => {
    const today = new Date().toISOString().slice(0, 10)
    setDownloading(true)
    try {
      const res = await adminAPI.downloadReport(today)
      // Backend returns a raw CSV blob — build a temporary object URL and
      // trigger a browser download, then clean up immediately after.
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Master_Report_${today}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      // 404 = report not generated yet for today (aggregate_scores hasn't run)
      const msg = err.response?.status === 404
        ? 'Report not generated yet for today.'
        : 'Download failed. Please try again.'
      setToast(msg)
      setTimeout(() => setToast(''), 2500)
    } finally {
      setDownloading(false)
    }
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })

  return (
    <div style={styles.page}>
      {/* TopAppBar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span className="material-symbols-outlined" style={styles.menuIcon}>menu</span>
          <span style={styles.brand}>APPTIST</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.dateText}>{todayLabel}</span>
          <span className="material-symbols-outlined" style={styles.bellIcon}>notifications</span>
        </div>
      </header>

      <main style={styles.main}>
        {/* Banner */}
        <section style={styles.banner}>
          <h2 style={styles.bannerTitle}>Good morning, Admin!</h2>
          <p style={styles.bannerSub}>Here is your platform activity for today.</p>
        </section>

        {toast && <div style={styles.toast}>{toast}</div>}

        {/* Navigation tiles */}
        <section style={styles.section}>
          <h3 style={styles.sectionLabel}>Navigation</h3>
          <div style={styles.tileGrid}>
            <button style={styles.tile} onClick={() => navigate('/admin/stats')}>
              <span className="material-symbols-outlined" style={styles.tileIcon}>analytics</span>
              <span style={styles.tileLabel}>Stats</span>
            </button>
            <button style={styles.tile} onClick={() => navigate('/admin/rank')}>
              <span className="material-symbols-outlined" style={styles.tileIcon}>leaderboard</span>
              <span style={styles.tileLabel}>Rank</span>
            </button>
            <button style={styles.tile} onClick={() => navigate('/admin/questions')}>
              <span className="material-symbols-outlined" style={styles.tileIcon}>inventory_2</span>
              <span style={styles.tileLabel}>Library</span>
            </button>
            <button style={styles.tile} onClick={() => navigate('/admin/reports')}>
              <span className="material-symbols-outlined" style={styles.tileIcon}>assessment</span>
              <span style={styles.tileLabel}>Reports</span>
            </button>
          </div>
        </section>

        {/* Quick actions */}
        <section style={styles.section}>
          <h3 style={styles.sectionLabel}>Quick Actions</h3>
          <div style={styles.actionsRow}>
            <button style={styles.actionPrimary} onClick={() => navigate('/admin/questions/upload')}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>upload</span>
              Upload Questions
            </button>
            <button style={styles.actionSecondary} onClick={() => navigate('/admin/rank')}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>emoji_events</span>
              View Scorers
            </button>
            <button style={styles.actionSecondary} onClick={() => navigate('/admin/stats')}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>bar_chart</span>
              Analytics
            </button>
            <button
              style={{ ...styles.actionSecondary, opacity: downloading ? 0.6 : 1, cursor: downloading ? 'not-allowed' : 'pointer' }}
              onClick={handleDownloadReport}
              disabled={downloading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {downloading ? 'hourglass_empty' : 'download'}
              </span>
              {downloading ? 'Downloading...' : 'Download Report'}
            </button>
          </div>
        </section>

        {/* Metrics */}
        <section style={styles.metricGrid}>
          {loading && <p style={styles.hint}>Loading stats…</p>}
          {error && <p style={styles.errorText}>{error}</p>}
          {!loading && !error && stats && (
            <>
              <MetricCard icon="group" value={stats.total_students} label="Total Students" />
              <MetricCard icon="check_circle" value={stats.tests_completed} label="Tests Completed Today" />
              <MetricCard icon="description" value={stats.questions_live} label="Questions Live Today" primary />
              <MetricCard icon="timer" value="—" label="Avg Time Taken (not tracked yet)" muted />
            </>
          )}
        </section>
      </main>

      {/* Bottom nav */}
      <nav style={styles.bottomNav}>
        <NavItem icon="dashboard" label="Home" active />
        <NavItem icon="analytics" label="Stats" onClick={() => navigate('/admin/stats')} />
        <NavItem icon="leaderboard" label="Rank" onClick={() => navigate('/admin/rank')} />
        <NavItem icon="inventory_2" label="Library" onClick={() => navigate('/admin/questions')} />
        <NavItem icon="assessment" label="Reports" onClick={() => navigate('/admin/reports')} />
      </nav>
    </div>
  )
}

function MetricCard({ icon, value, label, primary, muted }) {
  return (
    <div style={{
      ...styles.metricCard,
      opacity: muted ? 0.55 : 1,
    }}>
      <span className="material-symbols-outlined" style={{
        ...styles.metricIcon,
        background: primary ? '#ffe6d5' : '#dbeafe',
        color: primary ? '#ff6b00' : '#1e3a8a',
      }}>{icon}</span>
      <p style={styles.metricValue}>{value}</p>
      <p style={styles.metricLabel}>{label}</p>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button style={active ? styles.navItemActive : styles.navItem} onClick={onClick}>
      <span className="material-symbols-outlined">{icon}</span>
      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
    </button>
  )
}

const styles = {
  page: {
    minHeight: '100vh', background: '#fff',
    fontFamily: 'Geist, sans-serif', WebkitFontSmoothing: 'antialiased',
    display: 'flex', flexDirection: 'column', paddingBottom: 90,
  },
  header: {
    position: 'sticky', top: 0, zIndex: 50, background: '#f9f9f7',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    height: 64, padding: '0 20px', borderBottom: '1px solid #dadada',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  menuIcon: { color: '#1e3a8a', cursor: 'pointer' },
  brand: { fontSize: 20, fontWeight: 700, color: '#1c1b1f' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  dateText: { fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#49454f' },
  bellIcon: { color: '#49454f', cursor: 'pointer' },
  main: {
    flex: 1, padding: '16px 20px 0', maxWidth: 900, margin: '0 auto', width: '100%',
    display: 'flex', flexDirection: 'column', gap: 32,
  },
  banner: {
    borderRadius: 8, padding: 24, minHeight: 140,
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    background: 'linear-gradient(135deg, #ff8c33 0%, #ff6b00 100%)',
    boxShadow: '0 4px 12px rgba(255,107,0,0.2)',
  },
  bannerTitle: { fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 },
  bannerSub: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 6 },
  toast: {
    background: '#1c1b1f', color: '#fff', fontSize: 13,
    padding: '10px 16px', borderRadius: 8, textAlign: 'center',
  },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#49454f',
    letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, paddingLeft: 4,
  },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  tile: {
    background: '#dbeafe', border: '1px solid rgba(30,58,138,0.1)', borderRadius: 8,
    padding: 16, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
    textAlign: 'left', alignItems: 'flex-start',
  },
  tileIcon: {
    color: '#1e3a8a', background: 'rgba(255,255,255,0.6)',
    borderRadius: 12, padding: 6, fontSize: 22,
  },
  tileLabel: { fontSize: 18, fontWeight: 700, color: '#1e3a8a' },
  actionsRow: { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' },
  actionPrimary: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: '#ff6b00', color: '#fff', border: 'none', borderRadius: 999,
    fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', cursor: 'pointer',
    flexShrink: 0,
  },
  actionSecondary: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: '#dbeafe', color: '#1e3a8a', border: '1px solid rgba(30,58,138,0.1)',
    borderRadius: 999, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', cursor: 'pointer',
    flexShrink: 0,
  },
  metricGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  metricCard: {
    background: '#f4f4f2', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8,
    padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
  },
  metricIcon: {
    alignSelf: 'flex-start', borderRadius: 12, padding: 6, fontSize: 20,
  },
  metricValue: { fontSize: 28, fontWeight: 700, color: '#1c1b1f', margin: 0 },
  metricLabel: { fontSize: 12, color: '#49454f', margin: 0 },
  hint: { fontSize: 13, color: '#49454f', gridColumn: '1 / -1' },
  errorText: { fontSize: 13, color: '#b3261e', gridColumn: '1 / -1' },
  bottomNav: {
    position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 50,
    background: '#fff', borderTop: '1px solid #dadada',
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    padding: '10px 8px 24px', boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
  },
  navItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    background: 'none', border: 'none', color: '#49454f', opacity: 0.7, cursor: 'pointer',
  },
  navItemActive: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    background: '#dbeafe', border: 'none', color: '#1e3a8a',
    borderRadius: 999, padding: '4px 16px', cursor: 'pointer',
  },
}