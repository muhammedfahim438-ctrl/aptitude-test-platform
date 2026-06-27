// src/hooks/usePersistedAnswers.js  ── US-K01 (VIKKY)
// Persists exam answers to localStorage with Base64 obfuscation.
// Connects to ExamPage via onSelect — Vijay passes this hook's saveAnswer to QuestionCard.

import { useState } from 'react'

const encode = (data) => btoa(JSON.stringify(data))
const decode = (raw)  => JSON.parse(atob(raw))

export function usePersistedAnswers(userId, examDate) {
  const storageKey = `exam_answers_${userId}_${examDate}`

  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return {}
      return decode(saved)
    } catch {
      // Corrupted or tampered → safe reset
      return {}
    }
  })

  const saveAnswer = (questionId, answer) => {
    const updated = { ...answers, [questionId]: answer }
    setAnswers(updated)
    localStorage.setItem(storageKey, encode(updated))
  }

  const clearAnswers = () => {
    setAnswers({})
    localStorage.removeItem(storageKey)
  }

  return { answers, saveAnswer, clearAnswers }
}
