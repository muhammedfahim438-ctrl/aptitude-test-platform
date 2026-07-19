import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function SubmissionProcessing() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}
  const totalQuestions = state.totalQuestions || 10
  const answers = state.answers || {}
  const answeredCount = Object.keys(answers).length
  const unansweredCount = totalQuestions - answeredCount
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(Math.min(progressPct, 60)), 300)
    const timer2 = setTimeout(() => setProgress(Math.min(progressPct, 85)), 1500)
    const timer3 = setTimeout(() => setProgress(Math.min(progressPct, 95)), 3000)
    const timer4 = setTimeout(() => navigate('/student/result', { replace: true }), 4000)
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); clearTimeout(timer4) }
  }, [navigate, progressPct])

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface font-body-md antialiased flex flex-col">

      <header className="bg-surface sticky top-0 z-40">
        <div className="flex justify-between items-center w-full px-margin-mobile h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant shrink-0">
              <img src="/app-logo.png" alt="Apptist" className="w-full h-full object-cover" />
            </div>
            <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">Apptist</span>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-2xl mx-auto px-margin-mobile py-lg flex flex-col gap-xl">
        <section className="flex flex-col gap-md w-full">
          <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-primary">Submission Processing</h2>

          <div className="bg-surface-container-lowest rounded-xl shadow-md p-md flex flex-col gap-md relative overflow-hidden border border-outline-variant">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="flex flex-col items-center justify-center space-y-xl relative z-10 py-8">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary-fixed/20" style={{ animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }} />
                <div className="absolute inset-0 rounded-full border-4 border-primary/40" style={{ animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite', animationDelay: '0.5s' }} />
                <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center z-10 shadow-md">
                  <span className="material-symbols-outlined text-on-primary-container text-3xl animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
                </div>
              </div>

              <div className="text-center space-y-sm w-full">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Submitting your test</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px] mx-auto">Please wait while we securely save your responses.</p>
              </div>

              {unansweredCount > 0 && (
                <div className="w-full bg-secondary-container/30 border border-secondary/20 rounded-xl p-md flex items-start gap-sm shadow-sm relative z-10">
                  <span className="material-symbols-outlined text-secondary mt-0.5">warning</span>
                  <div className="flex-grow">
                    <h3 className="font-bold text-label-md uppercase tracking-wide text-secondary mb-1">⚠️ {unansweredCount} Question{unansweredCount !== 1 ? 's' : ''} remaining unanswered</h3>
                    <p className="font-body-sm text-on-surface-variant">This may affect your final assessment score. Processing will continue momentarily.</p>
                  </div>
                </div>
              )}

              <div className="w-full px-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-label-sm font-bold text-primary uppercase tracking-wider">Progress</span>
                  <span className="text-label-sm font-bold text-primary">{progressPct}% Complete</span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full relative overflow-hidden transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}>
                    <div className="absolute inset-0 shimmer-overlay" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
