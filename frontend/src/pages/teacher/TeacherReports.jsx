// src/pages/teacher/TeacherReports.jsx
// Connects to FAHIM's GET /api/admin/download-report/?date=YYYY-MM-DD endpoint.
// Teacher selects a date and downloads the CSV report.

import { useState } from 'react'
import axiosClient from '../../api/axiosClient'

export default function TeacherReports() {
  const [date, setDate]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const handleDownload = async () => {
    if (!date) {
      setError('Please select a date.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await axiosClient.get(`/api/admin/download-report/?date=${date}`, {
        responseType: 'blob',
      })

      // Trigger browser download
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Master_Report_${date}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setSuccess(`Report for ${date} downloaded successfully.`)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No report found for this date. Run score aggregation first.')
      } else {
        setError(
          err.response?.data?.detail ||
          'Download failed. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoDot} />
        <span style={styles.headerTitle}>Performance Reports</span>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Download Score Report</h2>
          <p style={styles.cardSub}>
            Download the CSV report for any exam date. The report includes student ID, name, score, rank, and timestamp.
          </p>

          {/* Success */}
          {success && (
            <div style={styles.successBanner}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#1a6b3a' }}>check_circle</span>
              <span style={{ fontSize: 13, color: '#1a6b3a' }}>{success}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={styles.errorBanner}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ba1a1a' }}>error</span>
              <span style={{ fontSize: 13, color: '#ba1a1a' }}>{error}</span>
            </div>
          )}

          {/* Date picker */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>EXAM DATE</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={styles.fieldIcon}>calendar_today</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = '#ff6b00')}
                onBlur={(e)  => (e.target.style.borderColor = '#d2c5b6')}
              />
            </div>
          </div>

          {/* Info box */}
          <div style={styles.infoBox}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ff6b00', flexShrink: 0 }}>info</span>
            <p style={styles.infoText}>
              The CSV file will be automatically deleted from the server 4 hours after download. Save it immediately.
            </p>
          </div>

          {/* CSV columns */}
          <div style={styles.colBox}>
            <p style={styles.colTitle}>REPORT COLUMNS</p>
            <div style={styles.colList}>
              {['student_id', 'name', 'score', 'rank', 'timestamp'].map((col) => (
                <span key={col} style={styles.colBadge}>{col}</span>
              ))}
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={loading}
            style={{ ...styles.downloadBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined spin" style={{ fontSize: 16 }}>progress_activity</span>
                Downloading…
              </>
            ) : (
              <>
                Download CSV Report
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f9f9f7', fontFamily: 'Geist, sans-serif' },
  header: {
    background: '#fff', borderBottom: '1px solid #d2c5b6',
    padding: '0 20px', height: 56,
    display: 'flex', alignItems: 'center', gap: 10,
    position: 'sticky', top: 0, zIndex: 40,
  },
  logoDot: { width: 28, height: 28, borderRadius: 6, background: '#ff6b00' },
  headerTitle: { fontSize: 16, fontWeight: 600, color: '#1c1c1b' },
  main: { padding: '24px 20px', maxWidth: 560, margin: '0 auto' },
  card: {
    background: '#fff', borderRadius: 14,
    padding: 28, border: '1px solid #d2c5b6',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  cardTitle: { fontSize: 18, fontWeight: 600, color: '#1c1c1b', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#4e473e', marginBottom: 20 },
  successBanner: {
    background: '#d6f5e3', border: '1px solid #1a6b3a',
    borderRadius: 8, padding: '10px 14px', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  errorBanner: {
    background: '#ffdad6', border: '1px solid #ba1a1a',
    borderRadius: 8, padding: '10px 14px', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
    color: '#41484a', letterSpacing: '0.05em',
    textTransform: 'uppercase', display: 'block', marginBottom: 6,
  },
  fieldIcon: {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 18, color: '#80776b', pointerEvents: 'none',
  },
  input: {
    width: '100%', padding: '12px 14px 12px 42px',
    border: '1.5px solid #d2c5b6', borderRadius: 8,
    fontSize: 14, color: '#1c1c1b',
    background: '#f4f4f2', outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Geist, sans-serif',
  },
  infoBox: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: '#ffe8d6', borderRadius: 8,
    padding: '10px 14px', marginBottom: 16,
    border: '1px solid #ffcba4',
  },
  infoText: { fontSize: 12, color: '#331500', lineHeight: '18px', margin: 0 },
  colBox: {
    background: '#f4f4f2', borderRadius: 8,
    padding: '12px 16px', marginBottom: 20,
    border: '1px solid #d2c5b6',
  },
  colTitle: {
    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
    color: '#4e473e', marginBottom: 10, fontWeight: 600,
  },
  colList: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  colBadge: {
    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
    background: '#fff', border: '1px solid #d2c5b6',
    borderRadius: 4, padding: '3px 8px', color: '#1c1c1b',
  },
  downloadBtn: {
    width: '100%', padding: '13px 20px',
    background: '#1a1c1b', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'Geist, sans-serif',
  },
}