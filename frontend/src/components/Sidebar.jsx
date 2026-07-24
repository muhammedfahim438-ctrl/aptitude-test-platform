import { useNavigate, useLocation } from 'react-router-dom'

const SIDEBAR_LINKS = [
  { key: 'home', label: 'Home', icon: 'home', path: '/admin/dashboard' },
  { key: 'stats', label: 'Stats', icon: 'analytics', path: '/admin/stats' },
  { key: 'rank', label: 'Rank', icon: 'leaderboard', path: '/admin/rank' },
  { key: 'library', label: 'Library', icon: 'inventory_2', path: '/admin/questions' },
  { key: 'reports', label: 'Reports', icon: 'assessment', path: '/admin/reports' },
]

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigate = (path) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    onClose()
    navigate('/admin/login')
  }

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-200 ease-in-out ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[80vw] bg-admin-surface z-[70] shadow-xl
        flex flex-col transition-transform duration-250 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-admin-outline-variant">
          <div className="w-8 h-8 rounded-full bg-admin-primary-container flex items-center justify-center overflow-hidden">
            <img src="/app-logo.png" alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-headline-sm font-headline-md font-bold text-admin-on-surface">APPTIST</span>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-full hover:bg-admin-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-admin-on-surface-variant">close</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {SIDEBAR_LINKS.map((link) => {
            const active = location.pathname === link.path
            return (
              <div
                key={link.key}
                onClick={() => handleNavigate(link.path)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer mb-1 transition-colors
                ${active
                  ? 'bg-admin-secondary-container text-admin-secondary font-bold'
                  : 'text-admin-on-surface hover:bg-admin-surface-container-high'}`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span className="text-body-md">{link.label}</span>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-admin-outline-variant p-2">
          <div
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer text-admin-primary hover:bg-admin-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-body-md font-bold">Logout</span>
          </div>
        </div>
      </aside>
    </>
  )
}