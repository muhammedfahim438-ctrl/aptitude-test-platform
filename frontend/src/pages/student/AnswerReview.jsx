import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { examAPI } from '../../api/client'
import StudentBottomNav from '../../components/StudentBottomNav'

export default function AnswerReview() {
  const navigate = useNavigate()
  const [review, setReview] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [reviewRes, questionsRes] = await Promise.all([
          examAPI.getReview(today),
          examAPI.getQuestions(today).catch(() => ({ data: { questions: [] } })),
        ])
        if (cancelled) return
        setReview(reviewRes.data)
        setQuestions(questionsRes.data.questions || [])
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: 36 }}>sync</span>
          <p className="mt-2 text-body-sm">Loading review...</p>
        </div>
      </div>
    )
  }

  if (!review || !review.correct_answers) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 gap-4">
        <span className="material-symbols-outlined text-secondary" style={{ fontSize: 48 }}>info</span>
        <h2 className="font-headline-md text-headline-md text-on-surface">Review not available</h2>
        <p className="font-body-md text-body-md text-on-surface-variant text-center">Answer review will be available after 2:00 PM IST.</p>
        <button onClick={() => navigate('/student/dashboard')} className="bg-primary text-on-primary font-label-md text-label-md py-3 px-8 rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all">
          Back to Dashboard
        </button>
      </div>
    )
  }

  const correctAnswers = review.correct_answers || {}
  const userAnswers = review.answers || {}
  const questionMap = {}
  questions.forEach(q => { questionMap[q.id] = q })
  const questionKeys = Object.keys(correctAnswers)
  const currentQid = questionKeys[currentIdx]
  const num = currentQid ? parseInt(currentQid.replace('q', ''), 10) : null
  const currentQuestion = num ? questionMap[num] : null
  const userAns = currentQid ? userAnswers[currentQid] : null
  const correctAns = currentQid ? correctAnswers[currentQid] : null
  const isCorrect = userAns === correctAns

  return (
    <div className="min-h-screen bg-background flex flex-col font-body-md">
      <header className="bg-surface-container shadow-sm docked full-width top-0 z-50 fixed border-b border-outline/30">
        <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <img src="/app-logo.png" alt="Apptist" className="w-8 h-8 rounded-lg object-cover" />
            <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight uppercase">apptist</h1>
          </div>
        </div>
      </header>
      <div className="h-16" />

      <main className="flex-grow flex flex-col items-center p-margin-mobile md:p-margin-desktop gap-gutter w-full overflow-x-hidden">
        {currentQuestion && (
          <div className="w-full bg-surface-container rounded-xl shadow-md overflow-hidden border border-outline flex flex-col" style={{ maxWidth: 480 }}>
            <div className="p-lg md:p-xl space-y-md">
              <div className="flex justify-between items-start gap-4 mb-md">
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Question {currentIdx + 1}</h2>
                <span className="font-label-sm text-label-sm px-3 py-1 bg-primary-container rounded-full text-on-primary-container border border-outline whitespace-nowrap mt-1">
                  Quantitative Analysis
                </span>
              </div>

              <p className="font-body-lg text-body-lg text-on-surface mb-xl leading-relaxed break-words">
                {currentQuestion.text}
              </p>

              {currentQuestion.image_url && (
                <div className="w-full rounded-xl overflow-hidden bg-surface-container-low mb-md">
                  <img src={currentQuestion.image_url} alt="" className="w-full max-h-48 object-contain" />
                </div>
              )}

              <div className="space-y-sm">
                {userAns && (
                  <div className={`w-full flex items-center justify-between p-md rounded-xl transition-all duration-300 ${isCorrect ? 'bg-tertiary-container border border-tertiary/20' : 'bg-error-container border border-error/20'}`}>
                    <div className="flex flex-col gap-1">
                      <span className={`font-label-sm text-label-sm uppercase tracking-wider ${isCorrect ? 'text-on-tertiary-container/70' : 'text-on-error-container/70'}`}>Your Answer</span>
                      <span className={`font-headline-md text-headline-md ${isCorrect ? 'text-on-tertiary-container' : 'text-on-error-container'}`}>{userAns} {currentQuestion[`option_${userAns.toLowerCase()}`]}</span>
                    </div>
                    <span className={`material-symbols-outlined font-bold text-2xl ${isCorrect ? 'text-tertiary' : 'text-error'}`} style={{ fontVariationSettings: isCorrect ? "'FILL' 1" : undefined }}>{isCorrect ? 'check' : 'close'}</span>
                  </div>
                )}

                {!isCorrect && (
                  <div className="w-full flex items-center justify-between p-md bg-tertiary-container border border-tertiary/20 rounded-xl transition-all duration-300">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm text-on-tertiary-container/70 uppercase tracking-wider">Correct Answer</span>
                      <span className="font-headline-md text-headline-md text-on-tertiary-container">{correctAns} {currentQuestion[`option_${correctAns.toLowerCase()}`]}</span>
                    </div>
                    <span className="material-symbols-outlined text-tertiary font-bold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                )}

                {!userAns && (
                  <div className="w-full flex items-center justify-between p-md bg-surface-container-high border border-outline rounded-xl">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Skipped</span>
                      <span className="font-headline-md text-headline-md text-on-surface-variant">No answer provided</span>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant font-bold text-2xl">remove</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="w-full flex justify-between items-center gap-md" style={{ maxWidth: 480 }}>
          <button
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-full font-label-md text-label-md text-on-surface-variant bg-surface-container hover:bg-surface-variant transition-all border border-outline disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Previous
          </button>
          <button
            onClick={() => setCurrentIdx(i => Math.min(questionKeys.length - 1, i + 1))}
            disabled={currentIdx >= questionKeys.length - 1}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-full font-label-md text-label-md text-on-primary bg-primary hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40"
          >
            Next
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </main>

      <StudentBottomNav />
      <div className="h-20 md:hidden" />
    </div>
  )
}
