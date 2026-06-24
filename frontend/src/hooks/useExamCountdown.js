import { useState, useEffect, useRef } from 'react';

export function useExamCountdown(examEndTime, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const calcRemaining = () => {
      const now = new Date();
      const end = new Date(examEndTime);
      return Math.max(0, Math.floor((end - now) / 1000));
    };

    setSecondsLeft(calcRemaining());

    intervalRef.current = setInterval(() => {
      const remaining = calcRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [examEndTime, onExpire]);

  const hh = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}