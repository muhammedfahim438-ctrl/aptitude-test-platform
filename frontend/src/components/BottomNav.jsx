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
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 pb-8 bg-admin-surface border-t border-admin-outline-variant shadow-lg">
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === currentKey
        return (
          <button
            key={item.key}
            className={`flex flex-col items-center justify-center transition-all duration-150 ${isActive ? 'bg-admin-primary text-admin-on-primary rounded-full px-4 py-1 scale-95 shadow-sm' : 'text-admin-on-surface-variant opacity-70 hover:opacity-100'}`}
            onClick={() => navigate(item.path)}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-label-sm font-label-sm mt-1">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
