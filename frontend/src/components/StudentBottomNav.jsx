import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Home',    icon: 'dashboard',   path: '/student/dashboard' },
  { key: 'exam',      label: 'Exam',    icon: 'quiz',        path: '/student/exam' },
  { key: 'leaderboard', label: 'Rank',  icon: 'leaderboard', path: '/student/leaderboard' },
]

export default function StudentBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentKey = NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))?.key

  return (
    <nav style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === currentKey
        return (
          <button
            key={item.key}
            style={isActive ? styles.navItemActive : styles.navItem}
            onClick={() => navigate(item.path)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {item.icon}
            </span>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

const styles = {
  bottomNav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
    background: '#fff', borderTop: '1px solid #e5e7eb',
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    padding: '10px 8px 24px', boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
    maxWidth: 480, margin: '0 auto',
  },
  navItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  navItemActive: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    background: '#dbeafe', border: 'none', color: '#1e3a8a',
    borderRadius: 999, padding: '4px 16px', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
}
