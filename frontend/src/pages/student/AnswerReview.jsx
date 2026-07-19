import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { examAPI } from '../../api/client'
import StudentBottomNav from '../../components/StudentBottomNav'

function WindowBanner({ status, opensAt, closesAt }) {
  const config = {
    before_window: {
      bg: 'bg-secondary-container/30', border: 'border-secondary/20', iconColor: 'text-secondary',
      icon: 'schedule', title: 'Answer key not released yet',
      body: `The answer key will be available at ${opensAt} IST. Polling every 60s.`,
    },
    after_window: {
      bg: 'bg-error-container/30', border: 'border-error/20', iconColor: 'text-error',
      icon: 'lock', title: 'Review period ended',
      body: `The answer key was visible from ${opensAt} to ${closesAt} IST.`,
    },
  }[status]
  if (!config) return null
  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-4 flex items-center gap-3`}>
      <span className={`material-symbols-outlined ${config.iconColor}`} style={{ fontSize: 28 }}>{config.icon}</span>
      <div>
        <p className={`font-headline-md text-headline-md ${config.iconColor} m-0`}>{config.title}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 m-0">{config.body}</p>
      </div>
    </div>
  )
}

export default function AnswerReview() {
  const navigate = useNavigate()
  const [examDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [review, setReview] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)

  const fetchReview = useCallback(async () => {
    try {
      const res = await examAPI.getReview(examDate)
      setReview(res.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load your review.')
    }
  }, [examDate])

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await examAPI.getQuestions(examDate)
      setQuestions(res.data.questions || [])
    } catch { setQuestions([]) }
  }, [examDate])

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      await Promise.all([fetchReview(), fetchQuestions()])
      if (!cancelled) setLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [fetchReview, fetchQuestions])

  useEffect(() => {
    if (!review || review.window_status !== 'before_window') return
    const t = setInterval(() => { fetchReview() }, 60000)
    return () => clearInterval(t)
  }, [review, fetchReview])

  const stats = useMemo(() => {
    if (!review?.correct_answers) return null
    const correct = review.correct_answers
    const user = review.answers || {}
    let right = 0, wrong = 0, skipped = 0
    Object.keys(correct).forEach(qid => {
      if (!user[qid]) skipped += 1
      else if (user[qid] === correct[qid]) right += 1
      else wrong += 1
    })
    return { right, wrong, skipped, total: Object.keys(correct).length }
  }, [review])

  const questionsById = useMemo(() => {
    const map = {}
    questions.forEach(q => { map[q.id] = q })
    return map
  }, [questions])

  const windowOpen = review?.window_status === 'open'
  const correctAnswers = review?.correct_answers || {}
  const userAnswers = review?.answers || {}
  const questionIds = Object.keys(correctAnswers)

  const currentQid = questionIds[currentIdx]
  const qNum = currentQid ? parseInt(String(currentQid).replace(/\D/g, ''), 10) : null
  const currentQuestion = qNum ? (questionsById[qNum] || questionsById[currentQid]) : null
  const currentCorrect = correctAnswers[currentQid]
  const currentUser = userAnswers[currentQid]
  const isCorrect = currentUser === currentCorrect

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-on-surface-variant">Loading your review...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="bg-surface-container-lowest p-3 border-b border-outline flex items-center gap-3">
          <span className="material-symbols-outlined text-primary cursor-pointer" onClick={() => navigate('/student/dashboard')}>arrow_back</span>
          <h1 className="font-headline-md text-headline-md text-on-surface">Answer Review</h1>
        </header>
        <div className="p-6 text-center">
          <div className="bg-error-container rounded-xl p-4 text-on-error-container">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="bg-surface-container shadow-sm docked top-0 z-50 fixed border-b border-outline/30">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/student/dashboard')} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-primary">Answer Review</h1>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{review?.date}</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-4 gap-6 pt-20 overflow-x-hidden">
        {!windowOpen && review && (
          <WindowBanner status={review.window_status} opensAt={review.opens_at} closesAt={review.closes_at} />
        )}

        {windowOpen && stats && (
          <div className="w-full max-w-lg bg-primary-container border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="font-label-md text-label-md text-on-primary font-bold">{review.score ?? stats.right}</span>
            </div>
            <div className="flex-1">
              <p className="font-headline-md text-headline-md text-on-primary-container m-0">Your Score</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 mb-1.5">{stats.right} correct · {stats.wrong} wrong · {stats.skipped} skipped</p>
              <div className="flex gap-1 h-2 rounded overflow-hidden bg-white">
                <div className="bg-tertiary rounded" style={{ width: `${(stats.right / stats.total) * 100}%` }} />
                <div className="bg-error rounded" style={{ width: `${(stats.wrong / stats.total) * 100}%` }} />
                <div className="bg-outline-variant rounded" style={{ width: `${(stats.skipped / stats.total) * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        {windowOpen && currentQuestion ? (
          <div className="w-full bg-surface-container rounded-xl shadow-md overflow-hidden border border-outline flex flex-col" style={{ maxWidth: 480 }}>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Question {currentIdx + 1}</h2>
                <span className={`font-label-sm text-label-sm px-3 py-1 rounded-full whitespace-nowrap mt-1 ${isCorrect ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'}`}>
                  {isCorrect ? 'Correct' : currentUser ? 'Wrong' : 'Skipped'}
                </span>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed break-words">{currentQuestion.text}</p>

              {currentQuestion.image_url && (
                <div className="w-full rounded-xl overflow-hidden bg-surface-container-low">
                  <img src={currentQuestion.image_url} alt="" className="w-full max-h-48 object-contain" />
                </div>
              )}

              <div className="space-y-3">
                {currentUser && (
                  <div className={`w-full flex items-center justify-between p-4 rounded-xl border ${isCorrect ? 'bg-tertiary-container border-tertiary/20' : 'bg-error-container border-error/20'}`}>
                    <div className="flex flex-col gap-1">
                      <span className={`font-label-sm text-label-sm uppercase tracking-wider ${isCorrect ? 'text-on-tertiary-container/70' : 'text-on-error-container/70'}`}>Your Answer</span>
                      <span className={`font-headline-md text-headline-md ${isCorrect ? 'text-on-tertiary-container' : 'text-on-error-container'}`}>{currentUser} {currentQuestion[`option_${currentUser.toLowerCase()}`]}</span>
                    </div>
                    <span className={`material-symbols-outlined font-bold text-2xl ${isCorrect ? 'text-tertiary' : 'text-error'}`} style={{ fontVariationSettings: isCorrect ? "'FILL' 1" : "'FILL' 0" }}>{isCorrect ? 'check' : 'close'}</span>
                  </div>
                )}
                <div className="w-full flex items-center justify-between p-4 bg-tertiary-container border border-tertiary/20 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-on-tertiary-container/70 uppercase tracking-wider">Correct Answer</span>
                    <span className="font-headline-md text-headline-md text-on-tertiary-container">{currentCorrect} {currentQuestion[`option_${currentCorrect.toLowerCase()}`]}</span>
                  </div>
                  <span className="material-symbols-outlined text-tertiary font-bold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
              </div>
            </div>
          </div>
        ) : windowOpen ? (
          <div className="bg-surface-container-high border border-outline rounded-xl p-6 text-center text-on-surface-variant">
            Answer key has not been published yet.
          </div>
        ) : null}

        {windowOpen && questionIds.length > 1 && (
          <div className="w-full flex justify-between items-center gap-4" style={{ maxWidth: 480 }}>
            <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-full font-label-md text-label-md text-on-surface-variant bg-surface-container hover:bg-surface-variant transition-all border border-outline disabled:opacity-40">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              Previous
            </button>
            <button onClick={() => setCurrentIdx(i => Math.min(questionIds.length - 1, i + 1))} disabled={currentIdx === questionIds.length - 1}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-full font-label-md text-label-md text-on-primary bg-primary hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40">
              Next
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </div>
        )}
      </main>

      <div className="h-20 md:hidden" />
      <StudentBottomNav />
    </div>
  )
}
