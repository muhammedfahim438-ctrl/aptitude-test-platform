import { useNavigate, useLocation } from 'react-router-dom'

export default function StudentBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/student/dashboard'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container shadow-[0_-4px_16px_rgba(70,90,163,0.05)] border-t border-outline">
      <div className="flex justify-around items-center px-margin-mobile py-2">
        <button
          onClick={() => navigate('/student/dashboard')}
          className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 transition-all duration-200 ${isHome ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          {isHome ? (
            <div className="bg-primary-container text-on-primary-container rounded-full px-4 py-1 flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            </div>
          ) : (
            <div className="px-4 py-1 flex items-center justify-center">
              <span className="material-symbols-outlined">home</span>
            </div>
          )}
          <span className="font-label-sm text-label-sm">Home</span>
        </button>

        <button
          onClick={() => navigate('/student/exam')}
          className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 transition-all duration-200 ${!isHome ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          {!isHome ? (
            <div className="bg-primary-container text-on-primary-container rounded-full px-4 py-1 flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            </div>
          ) : (
            <div className="px-4 py-1 flex items-center justify-center">
              <span className="material-symbols-outlined">assignment</span>
            </div>
          )}
          <span className="font-label-sm text-label-sm">Assessments</span>
        </button>
      </div>
    </nav>
  )
}
