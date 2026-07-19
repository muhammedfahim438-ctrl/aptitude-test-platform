import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { authAPI } from '../../api/client'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.login(email, password)
      const { access, refresh, user } = res.data

      const decoded = jwtDecode(access)
      if (!decoded.is_teacher) {
        setError('This portal is for teacher/admin accounts only.')
        setLoading(false)
        return
      }

      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user || decoded))

      navigate('/admin/dashboard')
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password.')
      } else {
        setError(err.response?.data?.detail || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen text-admin-on-surface bg-admin-secondary-container">
      <div className="fixed top-0 left-0 w-full h-1 bg-admin-primary-container z-50" />

      <header className="w-full pt-10 pb-6 flex flex-col items-center justify-center px-4">
        <div className="mb-4">
          <div className="w-16 h-16 bg-admin-primary-container rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
            <img src="/app-logo.png" alt="Apptist" className="w-full h-full object-cover rounded-xl" />
          </div>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-admin-on-surface tracking-tight mb-1">APPTIST</h1>
        <p className="font-label-md text-label-md text-admin-on-surface-variant uppercase tracking-widest">Admin Portal</p>
      </header>

      <main className="flex-grow flex items-start justify-center px-5">
        <div className="w-full max-w-sm">
          <div className="bg-admin-surface-container-lowest rounded-lg p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#F0F0EE]">
            <div className="mb-6">
              <h2 className="font-body-lg text-body-lg text-admin-on-surface">Welcome Back</h2>
              <p className="font-body-md text-body-md text-admin-on-surface-variant opacity-80">Access your institutional dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-admin-on-surface ml-1">Username</label>
                <div className="relative group rounded-lg transition-all duration-200 focus-within:border-admin-primary focus-within:shadow-[0_0_0_2px_rgba(255,107,0,0.15)]">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-on-surface opacity-60">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin_user"
                    className="block w-full pl-[44px] pr-4 py-3 bg-admin-surface border border-admin-outline-variant rounded-lg text-admin-on-surface font-body-md focus:ring-0 focus:border-admin-primary-container transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <label className="font-label-md text-label-md text-admin-on-surface">Password</label>
                </div>
                <div className="relative group rounded-lg transition-all duration-200 focus-within:border-admin-primary focus-within:shadow-[0_0_0_2px_rgba(255,107,0,0.15)]">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-on-surface opacity-60">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-[44px] pr-12 py-3 bg-admin-surface border border-admin-outline-variant rounded-lg text-admin-on-surface font-body-md focus:ring-0 focus:border-admin-primary-container transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-admin-on-surface opacity-40 hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-admin-error/10 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-admin-error">error</span>
                  <p className="text-[13px] text-admin-error">{error}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1a1c1b] text-white rounded-lg font-body-lg shadow-md active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 flex items-center justify-center gap-1">
              <span className="w-1 h-1 bg-admin-on-surface opacity-30 rounded-full" />
              <span className="w-1 h-1 bg-admin-on-surface opacity-30 rounded-full" />
              <span className="w-1 h-1 bg-admin-on-surface opacity-30 rounded-full" />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 right-0 p-6 pointer-events-none opacity-[0.03]">
        <span className="material-symbols-outlined text-[240px]">shield</span>
      </div>
    </div>
  )
}
