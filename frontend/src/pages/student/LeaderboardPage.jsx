// src/pages/student/LeaderboardPage.jsx
// Shell — to be filled by VIKKY (US-K03 answer key toggle lives here too)

import { useEffect, useState } from 'react'
import { examAPI } from '../../api/axiosClient'

export default function LeaderboardPage() {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    examAPI.getLeaderboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', fontFamily: 'Geist, sans-serif' }}>
      <header style={header}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1c1c1b' }}>Leaderboard</span>
      </header>
      <main style={{ padding: '16px 20px', maxWidth: 640, margin: '0 auto' }}>
        {loading && <p style={{ color: '#4e473e', fontSize: 14 }}>Loading…</p>}
        {!loading && data.map((row, i) => (
          <div key={row.student_id} style={rowStyle}>
            <span style={rankBadge}>{i + 1}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1c1b' }}>{row.name}</p>
              <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#4e473e' }}>
                {row.roll_number}
              </p>
            </div>
            <span style={scoreBadge}>{row.score}</span>
          </div>
        ))}
      </main>
    </div>
  )
}

const header = {
  background: '#fff', borderBottom: '1px solid #d2c5b6',
  padding: '0 20px', height: 56,
  display: 'flex', alignItems: 'center',
  position: 'sticky', top: 0, zIndex: 40,
}
const rowStyle = {
  background: '#fff', border: '1px solid #d2c5b6',
  borderRadius: 10, padding: '12px 16px', marginBottom: 10,
  display: 'flex', alignItems: 'center', gap: 14,
}
const rankBadge = {
  width: 32, height: 32, borderRadius: '50%',
  background: '#ffe8d6', color: '#ff6b00',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
  flexShrink: 0,
}
const scoreBadge = {
  marginLeft: 'auto',
  fontSize: 18, fontWeight: 700,
  color: '#ff6b00', fontFamily: 'JetBrains Mono, monospace',
}
