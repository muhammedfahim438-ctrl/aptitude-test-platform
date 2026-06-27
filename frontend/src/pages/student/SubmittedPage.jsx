import { useNavigate } from 'react-router-dom';

export default function SubmittedPage() {
  const navigate = useNavigate();

  // Get time spent from localStorage if available
  const examDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">

      {/* Header */}
      <header className="bg-white flex justify-between items-center px-4 md:px-10 w-full h-16 shadow-sm">
        <h1 className="font-space text-xl font-bold text-navy-deep">AptitudePortal</h1>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-ink-subtle text-lg">help</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-mono text-sm font-bold">JD</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Success Icon */}
        <div className="w-24 h-24 bg-tertiary rounded-full flex items-center justify-center mb-8 shadow-lg">
          <span className="material-symbols-outlined text-white text-5xl"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            done_all
          </span>
        </div>

        {/* Title */}
        <h2 className="font-space text-3xl font-bold text-navy-deep mb-3 text-center">
          Assessment Submitted
        </h2>
        <p className="font-inter text-base text-ink-subtle text-center max-w-sm mb-10">
          Your results have been successfully recorded. A confirmation email has been sent to your registered address.
        </p>

        {/* Return Button */}
        <button
          onClick={() => navigate('/login')}
          className="w-full max-w-sm py-4 bg-navy-deep text-white rounded-xl font-space font-bold text-base shadow-md hover:bg-primary transition-all active:scale-95 mb-10"
        >
          Return to Dashboard
        </button>

        {/* Stats Row */}
        <div className="w-full max-w-sm border border-outline-variant rounded-xl overflow-hidden">
          <div className="flex divide-x divide-outline-variant">
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                <p className="font-mono text-xs text-ink-subtle uppercase tracking-widest">Time Spent</p>
              </div>
              <p className="font-space text-xl font-bold text-navy-deep">42m 12s</p>
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <p className="font-mono text-xs text-ink-subtle uppercase tracking-widest">Questions</p>
              </div>
              <p className="font-space text-xl font-bold text-navy-deep">50/50</p>
            </div>
          </div>
          <div className="border-t border-outline-variant p-4 bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-ink-subtle text-lg">info</span>
              <p className="font-mono text-xs text-ink-subtle">
                Your temporary ID: <span className="text-primary font-bold">APT-7729-QX</span>
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}