import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { key: 'home',    label: 'Home',    icon: 'dashboard',   path: '/admin/dashboard' },
  { key: 'stats',   label: 'Stats',   icon: 'analytics',   path: '/admin/stats' },
  { key: 'rank',    label: 'Rank',    icon: 'leaderboard', path: '/admin/rank' },
  { key: 'library', label: 'Library', icon: 'inventory_2', path: '/admin/questions' },
  { key: 'reports', label: 'Reports', icon: 'assessment',  path: '/admin/reports' },
]

export default function BottomNav({ active }) {
  const navigate = useNavigate()
  const location = useLocation()

  const currentKey = active || NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))?.key

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
