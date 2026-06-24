import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function AnswerKeyPage({ userId, examDate }) {
  const [answerKey, setAnswerKey] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [ended, setEnded] = useState(false);
  const intervalRef = useRef(null);

  // Load student's saved answers from localStorage for comparison
  const storageKey = `exam_answers_${userId}_${examDate}`;
  const getSavedAnswers = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return {};
      return JSON.parse(atob(saved));
    } catch {
      return {};
    }
  };

  const fetchAnswerKey = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(
        `/api/tests/answers/?date=${examDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200) {
        setAnswerKey(res.data);
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        // Not yet 2 PM — update countdown
        const now = new Date();
        const unlock = new Date();
        unlock.setHours(14, 0, 0, 0);
        const diff = Math.max(0, Math.floor((unlock - now) / 1000));
        const mm = String(Math.floor(diff / 60)).padStart(2, '0');
        const ss = String(diff % 60).padStart(2, '0');
        setTimeLeft(`${mm}:${ss}`);
      }
    }
  };

  useEffect(() => {
    const now = new Date();
    const endTime = new Date();
    endTime.setHours(19, 0, 0, 0);

    // After 7 PM — stop everything
    if (now >= endTime) {
      setEnded(true);
      return;
    }

    fetchAnswerKey();

    // Start polling every 60 seconds after 1:50 PM
    const startPolling = new Date();
    startPolling.setHours(13, 50, 0, 0);
    if (now >= startPolling) {
      intervalRef.current = setInterval(() => {
        const current = new Date();
        if (current >= endTime) {
          setEnded(true);
          clearInterval(intervalRef.current);
          return;
        }
        fetchAnswerKey();
      }, 60000);
    }

    return () => clearInterval(intervalRef.current);
  }, [examDate]);

  const savedAnswers = getSavedAnswers();

  if (ended) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
        Answer key review period has ended.
      </div>
    );
  }

  if (!answerKey) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{
          backgroundColor: '#1a1a2e',
          color: '#e94560',
          padding: '20px',
          borderRadius: '8px',
          fontSize: '20px'
        }}>
          🔒 Answer key unlocks at 2:00 PM — {timeLeft} remaining
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>✅ Answer Key</h2>
      {answerKey.map((item) => {
        const studentAnswer = savedAnswers[item.question_id];
        const isCorrect = studentAnswer === item.correct_answer;
        return (
          <div key={item.question_id} style={{
            padding: '12px',
            marginBottom: '10px',
            borderRadius: '8px',
            backgroundColor: isCorrect ? '#1a3a1a' : '#3a1a1a',
            borderLeft: `4px solid ${isCorrect ? '#4caf50' : '#e94560'}`
          }}>
            <strong>Q{item.question_id}.</strong> Correct Answer: <strong>{item.correct_answer}</strong>
            {studentAnswer && (
              <span style={{ marginLeft: '12px', color: isCorrect ? '#4caf50' : '#e94560' }}>
                {isCorrect ? '✅ You got it right!' : `❌ You answered: ${studentAnswer}`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}