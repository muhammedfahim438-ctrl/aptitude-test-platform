import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const INSTRUCTIONS = [
  { icon: 'info', text: 'Ensure your internet connection is stable before starting.' },
  { icon: 'warning', text: 'Do not refresh the page or switch browser tabs during the test.' },
  { icon: 'timer', text: 'The timer will start immediately and cannot be paused.' },
]

export default function AssessmentDetails() {
  const navigate = useNavigate()
  const [consent, setConsent] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-low font-body-md">

      <header className="w-full sticky top-0 z-50 bg-surface-container-low">
        <div className="flex items-center justify-between px-margin-mobile py-sm w-full">
          <button onClick={() => navigate('/student/dashboard')} className="text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md text-primary font-semibold">Apptist</h1>
        </div>
      </header>

      <main className="flex-1 px-margin-mobile py-lg flex flex-col gap-lg pb-32">
        <div className="flex flex-col gap-xs">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold text-[28px] leading-tight">Aptitude Assessment Details</h2>
          <p className="font-body-md text-body-md text-on-surface-variant text-[15px]">Nehru Group of Institutions</p>
        </div>

        <div className="bg-surface rounded-3xl p-md flex flex-col gap-md border border-outline">
          <h3 className="font-label-md text-label-md text-primary uppercase font-bold tracking-wider text-[12px]">Assessment Parameters</h3>
          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs p-3 bg-primary-container rounded-2xl">
              <div className="flex items-center gap-sm text-on-primary-container">
                <span className="material-symbols-outlined text-[18px]">quiz</span>
                <span className="font-label-sm text-label-sm uppercase font-semibold">Total Questions</span>
              </div>
              <span className="font-body-md text-body-md text-on-surface font-semibold text-[17px]">10 Questions</span>
            </div>
            <div className="flex flex-col gap-xs p-3 bg-secondary-container rounded-2xl">
              <div className="flex items-center gap-sm text-on-secondary-container">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span className="font-label-sm text-label-sm uppercase font-semibold">Time Duration</span>
              </div>
              <span className="font-body-md text-body-md text-on-surface font-semibold text-[17px]">120 Minutes</span>
            </div>
            <div className="flex flex-col gap-xs p-3 bg-tertiary-container rounded-2xl">
              <div className="flex items-center gap-sm text-on-tertiary-container">
                <span className="material-symbols-outlined text-[18px]">military_tech</span>
                <span className="font-label-sm text-label-sm uppercase font-semibold">Total Marks</span>
              </div>
              <span className="font-body-md text-body-md text-on-surface font-semibold text-[17px]">10 Marks</span>
            </div>
            <div className="flex flex-col gap-xs p-3 bg-error-container rounded-2xl">
              <div className="flex items-center gap-sm text-on-error-container">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span className="font-label-sm text-label-sm uppercase font-semibold">Attempt Rule</span>
              </div>
              <span className="font-body-md text-body-md text-on-surface font-semibold text-[17px]">Single Attempt Only</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <h3 className="font-label-md text-label-md text-primary uppercase font-bold tracking-wider text-[12px] pl-2">Instructions</h3>
          <ul className="flex flex-col gap-3">
            {INSTRUCTIONS.map((inst, i) => (
              <li key={i} className="flex items-start gap-md bg-surface rounded-2xl p-4 border border-outline">
                <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">{inst.icon}</span>
                <span className="font-body-md text-body-md text-on-surface text-[15px]">{inst.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-md mt-sm bg-surface p-5 rounded-2xl border border-outline">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="w-6 h-6 rounded border-outline text-primary focus:ring-primary focus:ring-offset-surface bg-surface-container-low cursor-pointer"
          />
          <label className="font-body-md text-body-md text-on-surface cursor-pointer select-none text-[15px]" htmlFor="consent">
            I have read and understand the instructions.
          </label>
        </div>
      </main>

      <div className="fixed bottom-0 w-full z-50 bg-surface-container-low/90 backdrop-blur-md px-margin-mobile py-md">
        <button
          onClick={() => consent && navigate('/student/exam')}
          disabled={!consent}
          className={`w-full text-on-primary font-label-md text-label-md uppercase font-bold tracking-wider rounded-full py-4 shadow-sm active:scale-95 transition-all duration-200 flex items-center justify-center gap-sm ${consent ? 'bg-primary hover:opacity-90 hover:shadow-md' : 'bg-primary/50 opacity-50 cursor-not-allowed'}`}
        >
          <span>START ASSESSMENT</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}
