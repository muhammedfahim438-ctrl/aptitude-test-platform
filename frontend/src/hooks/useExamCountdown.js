// src/hooks/useExamCountdown.js  ── US-K02 (VIKKY)
// Countdown to exam close. Fires onExpire() at zero.
// Fix: onExpire stored in a ref so the interval never restarts
// when the parent re-renders with a new function reference
// (e.g. every time student selects an answer).

import { useState, useEffect, useRef } from 'react'

export function useExamCountdown(examEndTime, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const intervalRef  = useRef(null)
  const onExpireRef  = useRef(onExpire)   // always holds the latest callback

  // Keep ref in sync without re-triggering the timer effect
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    const calcRemaining = () => {
      const end = new Date(examEndTime)
      return Math.max(0, Math.floor((end - Date.now()) / 1000))
    }

    setSecondsLeft(calcRemaining())

    intervalRef.current = setInterval(() => {
      const remaining = calcRemaining()
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(intervalRef.current)
        onExpireRef.current()   // call via ref — never stale, never restarts timer
      }
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [examEndTime])   // onExpire intentionally excluded — handled via ref above

  const hh = String(Math.floor(secondsLeft / 3600)).padStart(2, '0')
  const mm = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return `${hh}:${mm}:${ss}`
}