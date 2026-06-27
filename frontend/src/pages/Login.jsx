import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login/', {
        email: identifier,
        password: password,
      });

      const { access, refresh } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Decode token to check role
      const payload = JSON.parse(atob(access.split('.')[1]));

      if (payload.is_student) {
        navigate('/student/exam');
      } else if (payload.is_teacher) {
        navigate('/teacher/upload');
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col justify-center items-center relative overflow-hidden px-4">
      
      {/* Ambient Orbs */}
      <div className="ambient-orb bg-primary w-96 h-96 -top-20 -left-20" />
      <div className="ambient-orb bg-tertiary w-80 h-80 bottom-0 right-0" style={{ animationDelay: '-5s' }} />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary-container rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <span className="material-symbols-outlined text-on-primary-container text-4xl">
              terminal
            </span>
          </div>
          <h1 className="font-space text-2xl font-bold text-white tracking-tight">
            AptitudePortal
          </h1>
          <p className="font-mono text-sm text-outline-variant mt-1">
            Professional Assessment Standard
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-card p-8 rounded-xl shadow-2xl">
          <h2 className="font-space text-2xl font-semibold text-white mb-6 text-center">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1">
              <label className="font-mono text-xs text-outline-variant ml-1">
                Email or Registration ID
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg">
                  person
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. candidate_123"
                  className="w-full h-12 pl-10 pr-4 bg-navy-deep/50 border border-outline/30 rounded-lg text-white font-inter text-base placeholder:text-outline/50 transition-all focus:border-primary-container focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="font-mono text-xs text-outline-variant ml-1">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-12 bg-navy-deep/50 border border-outline/30 rounded-lg text-white font-inter text-base placeholder:text-outline/50 transition-all focus:border-primary-container focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <a href="#" className="font-mono text-xs text-primary hover:text-inverse-primary transition-colors">
                Forgot Password?
              </a>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-3">
                <p className="text-error font-mono text-xs">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 bg-navy-deep text-white font-semibold rounded-lg shadow-sm hover:bg-primary transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] border border-white/10 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Portal
                  <span className="material-symbols-outlined text-lg">login</span>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="font-inter text-sm text-outline-variant">
              Don't have an account?{' '}
              <a href="#" className="text-primary-fixed font-semibold hover:underline">
                Register Now
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 grid grid-cols-2 gap-4 px-4">
          <div className="flex items-center gap-3 opacity-60">
            <span className="material-symbols-outlined text-primary-fixed text-lg">verified_user</span>
            <span className="font-mono text-xs text-outline-variant">ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-3 opacity-60 justify-end">
            <span className="material-symbols-outlined text-primary-fixed text-lg">support_agent</span>
            <span className="font-mono text-xs text-outline-variant">24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}