import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentBottomNav from '../../components/StudentBottomNav'
import { examAPI, studentAPI } from '../../api/client'

function ReviewQuestion({ q, userAnswer, correctAnswer, index }) {
  const options = [
    { label: 'A', text: q.option_a },
    { label: 'B', text: q.option_b },
    { label: 'C', text: q.option_c },
    { label: 'D', text: q.option_d },
  ].filter(o => o.text)

  const isCorrect = userAnswer === correctAnswer
  const isSkipped = !userAnswer

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline">
      <div className="flex items-center gap-2 mb-3">
        <span className={`font-label-sm text-label-sm px-2.5 py-1 rounded-full font-semibold ${isSkipped ? 'bg-surface-container-high text-on-surface-variant' : isCorrect ? 'bg-tertiary-container text-tertiary' : 'bg-error-container text-error'}`}>
          Q{index + 1} {isSkipped ? 'Skipped' : isCorrect ? 'Correct' : 'Wrong'}
        </span>
      </div>
      <p className="font-body-md text-body-md text-on-surface mb-3 leading-relaxed">{q.text}</p>
      {q.image_url && (
        <img src={q.image_url} alt="" className="w-full rounded-xl mb-3 max-h-48 object-contain" />
      )}
      <div className="flex flex-col gap-2">
        {options.map(opt => {
          const isUserChoice = userAnswer === opt.label
          const isCorrectOpt = opt.label === correctAnswer
          let cls = 'border-outline bg-transparent text-on-surface'
          if (isCorrectOpt) cls = 'border-tertiary bg-tertiary-container/30 text-on-surface'
          if (isUserChoice && !isCorrect) cls = 'border-error bg-error-container/30 text-on-error-container'
          return (
            <div key={opt.label} className={`flex items-center gap-3 px-3 py-2.5 border-2 rounded-xl transition-all ${cls}`}>
              <span className="font-label-md text-label-md font-semibold w-5">{opt.label}</span>
              <span className="font-body-md text-body-md flex-1">{opt.text}</span>
              {isCorrectOpt && <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
              {isUserChoice && !isCorrect && <span className="material-symbols-outlined text-error" style={{ fontSize: 18 }}>cancel</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function StudentResult() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [review, setReview] = useState(null)
  const [questions, setQuestions] = useState([])

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const dashRes = await studentAPI.getDashboard()
        if (cancelled) return
        const todayStatus = dashRes.data.today_status
        if (todayStatus === 'before_window' || todayStatus === 'in_progress') { setStatus('before_window'); return }
        if (todayStatus === 'missed') { setStatus('missed'); return }
        const [reviewRes, questionsRes] = await Promise.all([
          examAPI.getReview(today),
          examAPI.getQuestions(today).catch(() => ({ data: { questions: [] } })),
        ])
        if (cancelled) return
        setReview(reviewRes.data)
        setQuestions(questionsRes.data.questions || [])
        if (reviewRes.data.window_status === 'open' && reviewRes.data.correct_answers) setStatus('reviewed')
        else setStatus('submitted')
      } catch {
        if (!cancelled) setStatus('submitted')
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: 36 }}>sync</span>
          <p className="mt-2 text-body-sm">Loading results...</p>
        </div>
      </div>
    )
  }

  if (status === 'submitted' || status === 'before_window') {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
        <main className="w-full max-w-md flex flex-col items-center gap-8 pb-8">
          <section className="flex flex-col items-center text-center gap-3 mt-8" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="w-24 h-24 bg-tertiary-container rounded-full flex items-center justify-center mb-2 shadow-md shadow-primary/10">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Test Submitted!</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px]">Your responses have been successfully recorded.</p>
          </section>

          <section className="w-full bg-surface-container rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <h2 className="font-headline-md text-headline-md text-tertiary border-b border-outline pb-3">Submission Overview</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-1">
                <span className="font-body-md text-body-md text-on-surface-variant">Status</span>
                <span className="font-label-md text-label-md text-on-surface">Submitted</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-body-md text-body-md text-on-surface-variant">Date</span>
                <span className="font-label-md text-label-md text-on-surface">{today}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-body-md text-body-md text-on-surface-variant">Result Available</span>
                <span className="font-label-md text-label-md text-on-surface">After 2:00 PM IST</span>
              </div>
            </div>
          </section>

          <section className="w-full bg-secondary-container rounded-lg p-4 flex gap-3 items-start shadow-sm">
            <span className="material-symbols-outlined text-secondary mt-0.5">info</span>
            <div className="flex flex-col gap-1">
              <h3 className="font-label-md text-label-md text-on-secondary-container font-bold">Scores Gated Until Deadline</h3>
              <p className="font-body-sm text-body-sm text-on-secondary-container/80">Your score and answer key will be unlocked only after the official exam deadline passes for all students.</p>
            </div>
          </section>

          <button onClick={() => navigate('/student/dashboard')}
            className="w-full bg-primary text-on-primary font-label-md text-label-md py-4 rounded-full shadow-md shadow-primary/20 hover:bg-primary/90 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">home</span>
            Return to Portal
          </button>
        </main>
      </div>
    )
  }

  if (status === 'missed') {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
        <main className="w-full max-w-md flex flex-col items-center gap-6 pb-8">
          <div className="w-24 h-24 bg-error-container rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-error" style={{ fontSize: 48 }}>event_busy</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">No Exam Today</h2>
          <p className="font-body-md text-body-md text-on-surface-variant text-center">You didn't take today's exam.</p>
          <button onClick={() => navigate('/student/dashboard')} className="bg-primary text-on-primary font-label-md text-label-md py-3 px-8 rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all">
            Back to Dashboard
          </button>
        </main>
      </div>
    )
  }

  if (status === 'reviewed' && review) {
    const score = review.score
    const total = review.total_questions || 20
    const correct = score
    const userAnswers = review.answers || {}
    const correctAnswers = review.correct_answers || {}
    const skipped = Object.keys(correctAnswers).length - Object.keys(userAnswers).length
    const wrong = total - correct - Math.max(skipped, 0)
    const pct = Math.round((score / total) * 100)
    const scoreColor = pct >= 70 ? 'text-tertiary' : pct >= 50 ? 'text-secondary' : 'text-error'
    const borderColor = pct >= 70 ? 'border-tertiary' : pct >= 50 ? 'border-secondary' : 'border-error'
    const questionMap = {}
    questions.forEach(q => { questionMap[q.id] = q })

    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="bg-surface-container-lowest sticky top-0 z-30 border-b border-outline">
          <div className="flex items-center gap-3 px-4 h-14">
            <button onClick={() => navigate('/student/dashboard')} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-on-surface">Your Result</h1>
          </div>
        </header>

        <main className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline text-center">
            <div className={`w-24 h-24 rounded-full border-4 ${borderColor} flex flex-col items-center justify-center mx-auto mb-3`}>
              <span className={`font-headline-lg text-headline-lg font-bold ${scoreColor}`}>{score}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">/{total}</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">Your Score</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-tertiary-container rounded-xl p-3 text-center">
              <p className="font-headline-md text-headline-md text-tertiary m-0">{correct}</p>
              <p className="font-label-sm text-label-sm text-tertiary m-0 mt-0.5 uppercase">Correct</p>
            </div>
            <div className="bg-error-container rounded-xl p-3 text-center">
              <p className="font-headline-md text-headline-md text-error m-0">{Math.max(wrong, 0)}</p>
              <p className="font-label-sm text-label-sm text-error m-0 mt-0.5 uppercase">Wrong</p>
            </div>
            <div className="bg-surface-container-high rounded-xl p-3 text-center">
              <p className="font-headline-md text-headline-md text-on-surface-variant m-0">{Math.max(skipped, 0)}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant m-0 mt-0.5 uppercase">Skipped</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {Object.keys(correctAnswers).map((qid, idx) => {
              const num = parseInt(qid.replace('q', ''), 10)
              const q = questionMap[num]
              if (!q) return null
              return <ReviewQuestion key={qid} q={q} userAnswer={userAnswers[qid] || null} correctAnswer={correctAnswers[qid]} index={idx} />
            })}
          </div>
        </main>

        <StudentBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="text-center">
        <span className="material-symbols-outlined text-secondary" style={{ fontSize: 36 }}>info</span>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">Results will appear after 2:00 PM IST.</p>
        <button onClick={() => navigate('/student/dashboard')} className="mt-4 bg-primary text-on-primary font-label-md text-label-md py-3 px-8 rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all">
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
