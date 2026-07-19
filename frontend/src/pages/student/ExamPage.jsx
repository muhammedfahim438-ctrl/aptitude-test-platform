import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import useExamCountdown from '../../hooks/useExamCountdown'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { examAPI } from '../../api/client'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

function getExamEndTime(examDate) {
  return new Date(`${examDate}T14:00:00`)
}

function getExamStartTime(examDate) {
  return new Date(`${examDate}T10:00:00`)
}

export default function ExamPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [examDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showPalette, setShowPalette] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try { setUser(jwtDecode(token)) } catch { setUser(null) }
    }
  }, [])

  const userId = user?.user_id ?? user?.sub ?? 'anonymous'
  const { answers, saveAnswer, clearAnswers } = usePersistedAnswers(userId, examDate)

  const now = new Date()
  const examStart = getExamStartTime(examDate)
  const examEnd = getExamEndTime(examDate)
  const isBeforeWindow = now < examStart
  const isAfterWindow = now > examEnd
  const isReadOnly = isAfterWindow || submitted

  useEffect(() => {
    let cancelled = false
    async function fetchQuestions() {
      setLoading(true)
      setError(null)
      try {
        const res = await examAPI.getQuestions(examDate)
        if (!cancelled) setQuestions(res.data.questions || [])
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.status === 404
            ? 'No questions available for today. Please check back later.'
            : err.response?.status === 503
                ? 'Questions are loading, please wait a moment and refresh.'
                : err.response?.data?.error || 'Failed to load questions. Please refresh.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (!isBeforeWindow) fetchQuestions()
    else setLoading(false)
    return () => { cancelled = true }
  }, [examDate, isBeforeWindow])

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (submitted) return
    setSubmitting(true)
    setSubmitError(null)
    const attempt = async (retriesLeft) => {
      try {
        await examAPI.submitAnswers(examDate, answers)
        setSubmitted(true)
        clearAnswers()
        navigate('/student/submission-processing', { replace: true, state: { answers, totalQuestions: questions.length } })
      } catch (err) {
        const status = err.response?.status
        const isRetryable = !status || status === 503 || status === 500
        if (retriesLeft > 0 && isRetryable) {
          await new Promise(r => setTimeout(r, 2000))
          return attempt(retriesLeft - 1)
        }
        const msg = err.response?.data?.error || err.message || 'Unknown error'
        setSubmitError(isAutoSubmit ? `Auto-submit failed: ${msg}. Please submit manually if possible.` : `Submission failed: ${msg}`)
      }
    }
    await attempt(isAutoSubmit ? 3 : 0)
    setSubmitting(false)
  }, [examDate, answers, submitted, clearAnswers, navigate, questions.length])

  const handleAutoSubmit = useCallback(() => {
    if (questions.length === 0) return
    handleSubmit(true)
  }, [handleSubmit, questions.length])

  const timerDisplay = useExamCountdown(examEnd, handleAutoSubmit)
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const currentQuestion = questions[currentIdx]
  const unansweredCount = questions.length - answeredCount

  if (isBeforeWindow && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 gap-4">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 48 }}>schedule</span>
        <h2 className="font-headline-md text-headline-md text-on-surface">Exam not started yet</h2>
        <p className="font-body-md text-body-md text-on-surface-variant text-center">The exam window opens at 10:00 AM IST.<br />Please come back then.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-surface overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-surface shadow-sm flex items-center justify-between px-margin-mobile md:px-margin-desktop py-md">
        <div className="flex items-center gap-md">
          <button onClick={() => navigate('/student/dashboard')} className="flex items-center justify-center p-xs hover:bg-primary-container/50 transition-colors rounded-full active:scale-95 duration-150">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md text-primary truncate max-w-[180px] md:max-w-none">
            Quantitative Aptitude – Round 1
          </h1>
        </div>
        <div className="flex items-center gap-sm md:gap-lg">
          {!isAfterWindow && !submitted && (
            <div className="flex items-center gap-xs px-md py-xs bg-error-container text-on-error-container rounded-full font-label-md text-label-md border border-error/20">
              <span className="material-symbols-outlined text-[18px]">timer</span>
              <span>{timerDisplay}</span>
            </div>
          )}
          <button onClick={() => setShowPalette(!showPalette)} className="md:hidden flex items-center justify-center p-xs text-primary">
            <span className="material-symbols-outlined">{showPalette ? 'close' : 'grid_view'}</span>
          </button>
        </div>
      </header>

      <main className="pt-[88px] pb-[100px] px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row gap-gutter min-h-screen">
        <div className="flex-1 flex flex-col gap-lg">
          <div className="flex flex-col gap-sm">
            <div className="flex justify-between items-end">
              <span className="font-headline-md text-headline-md text-on-surface">
                {currentQuestion ? `Question ${currentIdx + 1} of ${questions.length}` : 'Loading...'}
              </span>
            </div>
            <div className="w-full h-2 bg-outline rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: questions.length ? `${((currentIdx + 1) / questions.length) * 100}%` : '0%' }} />
            </div>
            <p className="text-body-sm text-on-surface-variant font-medium">{answeredCount} of {questions.length} Questions Answered</p>
          </div>

          {loading && (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: 32 }}>sync</span>
              <p className="mt-2 text-body-sm">Loading questions...</p>
            </div>
          )}

          {error && (
            <div className="bg-error-container border border-error/20 rounded-2xl p-4 text-on-error-container text-body-sm">{error}</div>
          )}

          {submitError && (
            <div className="bg-error-container border border-error/20 rounded-2xl p-4 text-on-error-container text-body-sm">{submitError}</div>
          )}

          {currentQuestion && !loading && (
            <div className="bg-surface-container-lowest border border-outline rounded-2xl p-lg md:p-xl custom-shadow flex flex-col gap-lg">
              {currentQuestion.image_url && (
                <div className="w-full rounded-xl overflow-hidden bg-surface-container-low">
                  <img src={currentQuestion.image_url} alt="" className="w-full max-h-48 object-contain" />
                </div>
              )}

              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">{currentQuestion.text}</p>

              <div className="grid grid-cols-1 gap-md">
                {OPTION_LABELS.map(label => {
                  const text = currentQuestion[`option_${label.toLowerCase()}`]
                  if (!text) return null
                  const isSelected = answers[`q${currentQuestion.id}`] === label
                  return (
                    <label key={label}
                      className={`group flex items-center gap-md p-md border-2 rounded-2xl cursor-pointer transition-all active:scale-[0.99] ${isSelected ? 'border-primary bg-primary-container/30' : 'border-outline hover:border-primary-fixed'}`}
                      onClick={() => !isReadOnly && saveAnswer(`q${currentQuestion.id}`, label)}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-outline-variant'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                      </div>
                      <span className={`font-body-md text-body-md flex-1 ${isSelected ? 'text-on-primary-container font-semibold' : 'text-on-surface'}`}>{text}</span>
                      {isSelected && <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <aside className={`w-full md:w-80 flex flex-col gap-lg h-fit sticky top-[88px] ${showPalette ? 'block' : 'hidden md:block'}`}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-md p-md flex flex-col gap-md relative overflow-hidden border border-outline-variant">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-outline-variant pb-sm mb-sm z-10 relative">
              <div className="flex items-center gap-md">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-tertiary-fixed border border-tertiary" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Answered: {answeredCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary-fixed border border-secondary" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Pending: {unansweredCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-primary font-semibold">Total: {questions.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-sm z-10 relative">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[`q${q.id}`]
                const isCurrent = idx === currentIdx
                return (
                  <button key={q.id} onClick={() => { setCurrentIdx(idx); setShowPalette(false) }}
                    className={`h-10 w-full rounded-full flex items-center justify-center font-label-md text-label-md transition-transform hover:scale-105 active:scale-95 border ${isCurrent ? 'bg-surface-container-lowest text-on-primary-container border-2 border-primary-container shadow-md relative' : isAnswered ? 'bg-tertiary-fixed text-tertiary border-tertiary/20 shadow-sm' : 'bg-secondary-fixed text-secondary border-secondary/20 shadow-sm'}`}>
                    {isCurrent && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-container rounded-full animate-pulse" />}
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="hidden md:flex p-md bg-surface-bright border border-primary/10 rounded-2xl items-start gap-md">
            <span className="material-symbols-outlined text-primary">lightbulb</span>
            <p className="text-body-sm text-on-surface-variant">
              <strong className="text-primary">Pro Tip:</strong> You can use the number keys on your keyboard to navigate between questions quickly.
            </p>
          </div>
        </aside>
      </main>

      {!isAfterWindow && !submitted && questions.length > 0 && (
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-surface-container shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-margin-mobile md:px-margin-desktop py-md">
            <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
              className="flex items-center gap-xs px-lg py-md bg-surface-container-highest text-primary hover:bg-primary-container/50 transition-colors rounded-full font-label-md text-label-md active:scale-95 duration-150 disabled:opacity-40">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              <span>Previous</span>
            </button>
            <div className="flex items-center gap-md">
              {currentIdx < questions.length - 1 ? (
                <button onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                  className="flex items-center gap-xs px-lg py-md bg-primary text-on-primary hover:opacity-90 transition-all rounded-full font-label-md text-label-md active:scale-95 duration-150">
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              ) : (
                <button onClick={() => handleSubmit(false)} disabled={submitting}
                  className="flex items-center gap-xs px-lg py-md bg-primary text-on-primary hover:opacity-90 transition-all rounded-full font-label-md text-label-md active:scale-95 duration-150 disabled:opacity-60">
                  <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                  {!submitting && <span className="material-symbols-outlined text-[20px]">send</span>}
                </button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
