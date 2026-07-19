import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI } from '../../api/client';

const C = {
  primary: '#465aa3',
  primaryContainer: '#EAEFFD',
  onPrimaryContainer: '#1e347b',
  success: '#116b51',
  successContainer: '#E5FAF1',
  error: '#E2737A',
  errorContainer: '#FCEAEC',
  onErrorContainer: '#93000a',
  warning: '#F2924B',
  warningContainer: '#FFEEDC',
  onSurface: '#1b1b20',
  onSurfaceVariant: '#6C7596',
  surface: '#FFFFFF',
  surfaceContainerLow: '#f5f3fa',
  background: '#faf8ff',
  outline: '#E6E9F7',
  border: '#ece9e2',
}

const Icon = ({ name, size = 24, color, style = {} }) => (
  <span className="material-symbols-outlined"
    style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
)

function getOptionText(question, label) {
  if (!question || !label) return null
  const map = { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d }
  return map[label] || null
}

function OptionRow({ label, text, state }) {
  const styles = {
    base: {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 8, fontSize: 14,
    },
    neutral: { border: '1px solid #e5e3dd', background: '#fff', color: C.onSurface },
    correct: { border: '2px solid #116b51', background: C.successContainer, color: C.success },
    wrong: { border: '2px solid #E2737A', background: C.errorContainer, color: C.onErrorContainer },
    dim: { border: '1px dashed #d6d4ce', background: '#fafafa', color: '#8a8a86' },
  }
  const style = { ...styles.base, ...styles[state] }
  const badge = state === 'correct'
    ? <Icon name="check_circle" size={18} color={C.success} />
    : state === 'wrong'
      ? <Icon name="cancel" size={18} color={C.error} />
      : null
  return (
    <div style={style}>
      <span style={{ fontWeight: 700, minWidth: 18 }}>{label}.</span>
      <span style={{ flex: 1 }}>{text}</span>
      {badge}
    </div>
  )
}

function ReviewQuestion({ question, userAnswer, correctAnswer }) {
  const isCorrect = userAnswer === correctAnswer
  const options = [
    { label: 'A', value: question.option_a },
    { label: 'B', value: question.option_b },
    { label: 'C', value: question.option_c },
    { label: 'D', value: question.option_d },
  ].filter(o => o.value)

  const resultColor = isCorrect ? C.success : C.error
  const resultBg = isCorrect ? C.successContainer : C.errorContainer
  const resultText = isCorrect ? 'Correct' : userAnswer ? 'Wrong' : 'Skipped'
  const resultIcon = isCorrect ? 'check_circle' : (userAnswer ? 'cancel' : 'remove_circle')

  return (
    <div style={{
      background: C.surface, border: '1px solid #ece9e2', borderRadius: 14, padding: 16,
    }}>
      {question.image_url && (
        <div style={{
          width: '100%', aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden',
          marginBottom: 12, background: '#f5f5f2',
        }}>
          <img src={question.image_url} alt={`Question ${question.id} diagram`}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.onSurface, flex: 1, margin: 0 }}>
          <strong>Q{question.id}.</strong> {question.text}
        </p>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 999,
          background: resultBg, color: resultColor, fontSize: 12, fontWeight: 600,
          fontFamily: 'JetBrains Mono', flexShrink: 0,
        }}>
          <Icon name={resultIcon} size={14} color={resultColor} />
          {resultText}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt) => {
          let state = 'neutral'
          if (opt.label === correctAnswer) state = 'correct'
          else if (opt.label === userAnswer) state = 'wrong'
          else if (correctAnswer) state = 'dim'
          return <OptionRow key={opt.label} label={opt.label} text={opt.value} state={state} />
        })}
      </div>
    </div>
  )
}

function WindowBanner({ status, opensAt, closesAt }) {
  const config = {
    before_window: {
      bg: C.warningContainer, color: C.warning, icon: 'schedule',
      title: 'Answer key not released yet',
      body: `The answer key will be available at ${opensAt} IST. Polling every 60s.`,
    },
    after_window: {
      bg: C.errorContainer, color: C.error, icon: 'lock',
      title: 'Review period ended',
      body: `The answer key was visible from ${opensAt} to ${closesAt} IST.`,
    },
  }[status]

  if (!config) return null

  return (
    <div style={{
      background: config.bg, border: `1px solid ${config.color}30`,
      borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <Icon name={config.icon} size={28} color={config.color} />
      <div>
        <p style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700, color: config.color, margin: 0 }}>
          {config.title}
        </p>
        <p style={{ fontFamily: 'Inter', fontSize: 13, color: C.onSurfaceVariant, margin: '4px 0 0' }}>
          {config.body}
        </p>
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

  const fetchReview = useCallback(async () => {
    try {
      const res = await examAPI.getReview(examDate)
      setReview(res.data)
      setError(null)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Unable to load your review.'
      setError(msg)
    }
  }, [examDate])

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await examAPI.getQuestions(examDate)
      setQuestions(res.data.questions || [])
    } catch {
      setQuestions([])
    }
  }, [examDate])

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      await Promise.all([fetchReview(), fetchQuestions()])
      if (!cancelled) setLoading(false)
    }
    init()
    return () => { cancelled = true; }
  }, [fetchReview, fetchQuestions])

  useEffect(() => {
    if (!review) return
    if (review.window_status !== 'before_window') return
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.background, fontFamily: 'Inter' }}>
        <p style={{ color: C.onSurfaceVariant }}>Loading your review...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.background, fontFamily: 'Inter' }}>
        <header style={{ background: C.surface, padding: '12px 16px', borderBottom: `1px solid ${C.outline}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: C.primary, cursor: 'pointer' }}
            onClick={() => navigate('/student/dashboard')}>
            arrow_back
          </span>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.onSurface }}>Answer Review</h1>
        </header>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ background: C.errorContainer, borderRadius: 12, padding: 16, color: C.onErrorContainer }}>{error}</div>
        </div>
      </div>
    )
  }

  const windowOpen = review?.window_status === 'open'
  const questionsById = useMemo(() => {
    const map = {}
    questions.forEach(q => { map[q.id] = q })
    return map
  }, [questions])

  return (
    <div style={{ minHeight: '100vh', background: C.background, fontFamily: 'Inter, sans-serif', paddingBottom: 80 }}>
      <header style={{ background: C.surface, padding: '12px 16px', borderBottom: `1px solid ${C.outline}`, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 30 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 24, color: C.primary, cursor: 'pointer' }}
          onClick={() => navigate('/student/dashboard')}>
          arrow_back
        </span>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: C.onSurface, margin: 0 }}>Answer Review</h1>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.onSurfaceVariant, margin: 0 }}>{review?.date}</p>
        </div>
      </header>

      <main style={{ padding: '16px', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!windowOpen && review && (
          <WindowBanner
            status={review.window_status}
            opensAt={review.opens_at}
            closesAt={review.closes_at}
          />
        )}

        {windowOpen && stats && (
          <div style={{
            background: C.primaryContainer, border: `1px solid ${C.primary}30`, borderRadius: 14,
            padding: 16, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 700, color: '#fff' }}>
                {review.score ?? stats.right}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: C.onPrimaryContainer, margin: 0 }}>
                Your Score
              </p>
              <p style={{ fontFamily: 'Inter', fontSize: 12, color: C.onSurfaceVariant, margin: '2px 0 6px' }}>
                {stats.right} correct · {stats.wrong} wrong · {stats.skipped} skipped
              </p>
              <div style={{ display: 'flex', gap: 4, height: 8, borderRadius: 4, overflow: 'hidden', background: '#fff' }}>
                <div style={{ width: `${(stats.right / stats.total) * 100}%`, background: C.success }} />
                <div style={{ width: `${(stats.wrong / stats.total) * 100}%`, background: C.error }} />
                <div style={{ width: `${(stats.skipped / stats.total) * 100}%`, background: '#d6d4ce' }} />
              </div>
            </div>
          </div>
        )}

        {windowOpen && review?.correct_answers ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(review.correct_answers).map(([qid, correctLabel]) => {
              const qNum = parseInt(String(qid).replace(/\D/g, ''), 10)
              const question = questionsById[qNum] || questionsById[qid]
              if (!question) {
                return (
                  <div key={qid} style={{ background: C.surface, border: `1px solid ${C.outline}`, borderRadius: 12, padding: 16 }}>
                    <p style={{ fontWeight: 600, color: C.onSurface }}>Q{qid}</p>
                    <p style={{ fontSize: 13, color: C.onSurfaceVariant, marginTop: 8 }}>
                      Correct answer: <strong>{correctLabel}</strong>
                      {review.answers?.[qid] && (
                        <> · You answered: <strong>{review.answers[qid]}</strong></>
                      )}
                    </p>
                  </div>
                )
              }
              return (
                <ReviewQuestion
                  key={qid}
                  question={question}
                  userAnswer={review.answers?.[qid]}
                  correctAnswer={correctLabel}
                />
              )
            })}
          </div>
        ) : windowOpen ? (
          <div style={{ background: C.surfaceContainerLow, border: `1px solid ${C.outline}`, borderRadius: 12, padding: 16, textAlign: 'center', color: C.onSurfaceVariant }}>
            Answer key has not been published yet.
          </div>
        ) : null}
      </main>
    </div>
  )
}
