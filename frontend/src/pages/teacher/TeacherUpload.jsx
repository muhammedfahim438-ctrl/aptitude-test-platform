// src/pages/teacher/TeacherUpload.jsx
// Connects to FAHIM's POST /api/admin/upload-questions/ endpoint.
// Accepts a JSON file upload with exam date selection.

import { useState } from 'react'
import axiosClient from '../../api/axiosClient'

export default function TeacherUpload() {
  const [date, setDate]       = useState('')
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  const handleUpload = async () => {
    if (!date || !file) {
      setError('Please select a date and a JSON file.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('date', date)
      formData.append('file', file)

      await axiosClient.post('/api/admin/upload-questions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess(`Questions uploaded successfully for ${date}.`)
      setFile(null)
      setDate('')
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Upload failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoDot} />
        <span style={styles.headerTitle}>Upload Questions</span>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Upload Exam Questions</h2>
          <p style={styles.cardSub}>Upload a JSON file containing today's aptitude test questions.</p>

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

          {/* File upload */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>QUESTIONS FILE (JSON)</label>
            <label style={styles.fileLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ff6b00' }}>upload_file</span>
              <span style={{ fontSize: 13, color: '#4e473e' }}>
                {file ? file.name : 'Click to choose a .json file'}
              </span>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setFile(e.target.files[0] || null)}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* JSON format hint */}
          <div style={styles.hintBox}>
            <p style={styles.hintTitle}>Expected JSON format:</p>
            <pre style={styles.hintCode}>{`[
  {
    "text": "Question text here",
    "option_a": "Option A",
    "option_b": "Option B",
    "option_c": "Option C",
    "option_d": "Option D",
    "image_url": null
  }
]`}</pre>
          </div>

          {/* Submit */}
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined spin" style={{ fontSize: 16 }}>progress_activity</span>
                Uploading…
              </>
            ) : (
              <>
                Upload Questions
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
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
  fileLabel: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px', border: '1.5px dashed #d2c5b6',
    borderRadius: 8, background: '#f4f4f2',
    cursor: 'pointer',
  },
  hintBox: {
    background: '#f4f4f2', borderRadius: 8,
    padding: '12px 16px', marginBottom: 20,
    border: '1px solid #d2c5b6',
  },
  hintTitle: { fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#4e473e', marginBottom: 8, fontWeight: 600 },
  hintCode:  { fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#1c1c1b', margin: 0, whiteSpace: 'pre-wrap' },
  submitBtn: {
    width: '100%', padding: '13px 20px',
    background: '#ff6b00', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'Geist, sans-serif',
  },
}