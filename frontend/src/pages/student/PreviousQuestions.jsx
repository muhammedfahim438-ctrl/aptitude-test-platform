import { useNavigate } from 'react-router-dom'
import StudentBottomNav from '../../components/StudentBottomNav'

export default function PreviousQuestions() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col font-body-md text-on-surface">
      <header className="w-full sticky top-0 z-50 bg-surface shadow-sm flex items-center justify-between px-md py-base">
        <div className="flex items-center gap-sm">
          <button onClick={() => navigate(-1)} className="p-2 transition-colors duration-200 hover:bg-surface-container rounded-full text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-lg text-headline-lg text-primary">Previous Questions</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-lg relative overflow-hidden">
        <div className="absolute inset-0 empty-state-gradient pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
          <div className="w-48 h-48 mb-lg flex items-center justify-center bg-surface-container-low rounded-full shadow-inner relative group">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-secondary-container rounded-xl opacity-20 rotate-12 transition-transform group-hover:rotate-45 duration-500" />
            <div className="absolute -bottom-2 -left-6 w-8 h-8 bg-primary-container rounded-full opacity-20 transition-transform group-hover:scale-125 duration-500" />
            <span className="material-symbols-outlined text-[96px] text-on-surface-variant/40 select-none">folder_off</span>
          </div>

          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Nothing posted yet</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Previous exam questions and answer keys will appear here once they are available.</p>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-container rounded-full blur-3xl" />
        </div>
      </main>

      <StudentBottomNav />
      <div className="h-20 w-full md:hidden" />
    </div>
  )
}
