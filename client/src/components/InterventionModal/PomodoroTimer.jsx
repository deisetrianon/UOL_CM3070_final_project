import { useState, useEffect, useRef } from 'react';
import './PomodoroTimer.css';

const WORK_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes

function PomodoroTimer({ onClose }) {
  const [mode, setMode] = useState('work'); // 'work' or 'break'
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    if (mode === 'work') {
      setMode('break');
      setTimeLeft(BREAK_DURATION);
      setSessionCount(prev => prev + 1);
      setIsActive(false);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Work session complete! Time for a break.');
      }
    } else {
      setMode('work');
      setTimeLeft(WORK_DURATION);
      setIsActive(false);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Break complete! Ready to focus?');
      }
    }
  };

  const startTimer = () => {
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? WORK_DURATION : BREAK_DURATION);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'work'
    ? ((WORK_DURATION - timeLeft) / WORK_DURATION) * 100
    : ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100;

  return (
    <div className="pomodoro-timer">
      <h2 className="pomodoro-title">Pomodoro Timer</h2>     
      <div className="pomodoro-mode-indicator">
        <div className={`mode-badge ${mode}`}>
          {mode === 'work' ? '⚡ Focus Time' : '☕ Break Time'}
        </div>
      </div>
      <div className="pomodoro-display">
        <div className="pomodoro-circle" style={{ '--progress': `${progress}%` }}>
          <div className="pomodoro-time">{formatTime(timeLeft)}</div>
          <div className="pomodoro-mode-text">{mode === 'work' ? 'Work Session' : 'Break Session'}</div>
        </div>
      </div>
      <div className="pomodoro-stats">
        <div className="pomodoro-stat">
          <span className="stat-label">Sessions Completed:</span>
          <span className="stat-value">{sessionCount}</span>
        </div>
      </div>
      <div className="pomodoro-instructions">
        <h3>How it works:</h3>
        <ul>
          <li><strong>Work Session (25 min):</strong> Focus on a single task without distractions</li>
          <li><strong>Break (5 min):</strong> Step away, stretch, or do a quick breathing exercise</li>
          <li>After 4 work sessions, take a longer 15-30 minute break</li>
          <li>Use this technique to maintain focus and prevent burnout</li>
        </ul>
      </div>
      <div className="pomodoro-controls">
        {!isActive ? (
          <button className="pomodoro-btn start" onClick={startTimer}>
            Start {mode === 'work' ? 'Work' : 'Break'}
          </button>
        ) : (
          <button className="pomodoro-btn pause" onClick={pauseTimer}>
            Pause
          </button>
        )}
        <button className="pomodoro-btn reset" onClick={resetTimer} disabled={timeLeft === (mode === 'work' ? WORK_DURATION : BREAK_DURATION)}>
          Reset
        </button>
        <button className="pomodoro-btn close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default PomodoroTimer;
