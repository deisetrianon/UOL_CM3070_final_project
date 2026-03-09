/**
 * Pomodoro Timer component.
 * Pomodoro technique timer with work and break sessions.
 * Persists timer state to localStorage and can trigger Zen Mode on completion.
 * 
 * @module components/PomodoroTimer
 * @component
 * @returns {JSX.Element} Pomodoro Timer component
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useZenMode } from '../../contexts/ZenModeContext';
import { useDialog } from '../../contexts/DialogContext';
import { POMODORO } from '../../constants';
import { formatTime } from '../../utils/date';
import { loadPomodoroState, savePomodoroState, calculatePomodoroProgress } from '../../utils/pomodoro';
import pomodoroIcon from '../../assets/icons/pomodoro.png';
import './PomodoroTimer.css';

const { WORK_DURATION_SECONDS, BREAK_DURATION_SECONDS, STORAGE_KEY } = POMODORO;

function PomodoroTimer() {
  const { enableZenMode } = useZenMode();
  const { showAlert } = useDialog();
  const initialState = loadPomodoroState();
  const [mode, setMode] = useState(initialState.mode);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [isActive, setIsActive] = useState(initialState.isActive);
  const [sessionCount, setSessionCount] = useState(initialState.sessionCount);
  const [isExpanded, setIsExpanded] = useState(initialState.isActive); // Auto-expanding if timer is active
  const intervalRef = useRef(null);
  const startTimeRef = useRef(initialState.startTimestamp);
  const originalDurationRef = useRef(initialState.originalDuration);

  const handleTimerExpired = useCallback(async (expiredMode, count) => {
    if (expiredMode === 'work') {
      setMode('break');
      setTimeLeft(BREAK_DURATION_SECONDS);
      setSessionCount(count + 1);
      setIsActive(false);
      
      enableZenMode('Pomodoro break - time to rest');
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Work session complete! Time for a break.', {
          body: 'Zen Mode has been enabled to help you rest.',
          icon: '/favicon.ico'
        });
      } else {
        showAlert('🍅 Work session complete! Time for a break.\n\nZen Mode has been enabled to help you rest.', 'success');
      }
      
      localStorage.removeItem(STORAGE_KEY);
    } else {
      setMode('work');
      setTimeLeft(WORK_DURATION_SECONDS);
      setIsActive(false);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Break complete! Ready to focus?');
      }
      
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [enableZenMode, showAlert]);

  const handleTimerComplete = useCallback(() => {
    handleTimerExpired(mode, sessionCount);
  }, [handleTimerExpired, mode, sessionCount]);

  useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive]);

  useEffect(() => {
    if (initialState.expired) {
      setTimeout(() => {
        handleTimerExpired(initialState.expiredMode, initialState.expiredCount);
      }, 100);
    }
  }, []);

  useEffect(() => {
    const handlePomodoroStart = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const state = JSON.parse(saved);
          if (state.isActive && state.startTimestamp && state.originalDuration) {
            const now = Date.now();
            const elapsed = Math.floor((now - state.startTimestamp) / 1000);
            const remainingTime = state.originalDuration - elapsed;
            
            if (remainingTime > 0) {
              setMode(state.mode);
              setTimeLeft(remainingTime);
              setIsActive(true);
              setSessionCount(state.sessionCount || 0);
              setIsExpanded(true);
              startTimeRef.current = state.startTimestamp;
              originalDurationRef.current = state.originalDuration;
            }
          }
        } catch (error) {
          console.error('[Pomodoro] Error handling external start:', error);
        }
      }
    };

    window.addEventListener('pomodoro-start', handlePomodoroStart);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        handlePomodoroStart();
      }
    });

    return () => {
      window.removeEventListener('pomodoro-start', handlePomodoroStart);
    };
  }, []);

  useEffect(() => {
    if (isActive && startTimeRef.current && originalDurationRef.current) {
      const state = {
        mode,
        timeLeft,
        isActive: true,
        sessionCount,
        startTimestamp: startTimeRef.current,
        originalDuration: originalDurationRef.current
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else if (!isActive) {
      const state = {
        mode,
        timeLeft,
        isActive: false,
        sessionCount,
        startTimestamp: null,
        originalDuration: null
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [mode, isActive, sessionCount, timeLeft]);


  useEffect(() => {
    if (isActive && timeLeft > 0 && startTimeRef.current && originalDurationRef.current) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        const remainingTime = originalDurationRef.current - elapsed;
        
        if (remainingTime <= 0) {
          handleTimerComplete();
          setTimeLeft(0);
        } else {
          setTimeLeft(remainingTime);
        }
      }, 1000);
      
      const saveInterval = setInterval(() => {
        if (startTimeRef.current && originalDurationRef.current) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTimeRef.current) / 1000);
          const currentTimeLeft = originalDurationRef.current - elapsed;
          
          const state = {
            mode,
            timeLeft: currentTimeLeft > 0 ? currentTimeLeft : 0,
            isActive: true,
            sessionCount,
            startTimestamp: startTimeRef.current,
            originalDuration: originalDurationRef.current
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
      }, 10000); // Saving every 10 seconds
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (saveInterval) {
          clearInterval(saveInterval);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, mode, sessionCount, handleTimerComplete]);

  const startTimer = () => {
    const now = Date.now();
    const originalDuration = mode === 'work' ? WORK_DURATION_SECONDS : BREAK_DURATION_SECONDS;
    setIsActive(true);
    setIsExpanded(true); 
    startTimeRef.current = now;
    originalDurationRef.current = originalDuration;
    
    const state = {
      mode,
      timeLeft,
      isActive: true,
      sessionCount,
      startTimestamp: now,
      originalDuration: originalDuration
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? WORK_DURATION_SECONDS : BREAK_DURATION_SECONDS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const stopTimer = () => {
    setIsActive(false);
    setMode('work');
    setTimeLeft(WORK_DURATION_SECONDS);
    setSessionCount(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const progress = calculatePomodoroProgress(mode, timeLeft);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const toggleExpand = () => {
    if (isActive) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`pomodoro-widget ${mode} ${isExpanded ? 'expanded' : 'collapsed'}`}
      onClick={!isExpanded ? toggleExpand : undefined}
    >
      <div 
        className="pomodoro-header" 
        onClick={isExpanded && !isActive ? toggleExpand : undefined}
        style={{ cursor: isExpanded && !isActive ? 'pointer' : 'default' }}
        role="button"
        aria-label={isExpanded && !isActive ? 'Collapse Pomodoro timer' : isExpanded ? 'Pomodoro timer' : 'Expand Pomodoro timer'}
        tabIndex={!isExpanded ? 0 : undefined}
        onKeyDown={(e) => {
          if (!isExpanded && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggleExpand();
          }
        }}
      >
        <img src={pomodoroIcon} alt="" className="pomodoro-icon" aria-hidden="true" />
        {!isExpanded && (
          <span className="pomodoro-mode-text" aria-label="Pomodoro timer">
            POMODORO
          </span>
        )}
        {isExpanded && sessionCount > 0 && (
          <span className="pomodoro-session-count" aria-label={`${sessionCount} completed session${sessionCount !== 1 ? 's' : ''}`}>
            {sessionCount}
          </span>
        )}
      </div>
      {isExpanded && (
        <>
          <div 
            className="pomodoro-time-display" 
            onClick={(e) => e.stopPropagation()}
            role="timer"
            aria-live="polite"
            aria-label={`${mode === 'work' ? 'Work' : 'Break'} time remaining: ${formatTime(timeLeft)}`}
          >
            {formatTime(timeLeft)}
          </div>
          <div 
            className="pomodoro-progress-bar" 
            onClick={(e) => e.stopPropagation()}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Timer progress: ${Math.round(progress)}%`}
          >
            <div 
              className="pomodoro-progress-fill" 
              style={{ width: `${progress}%` }}
              aria-hidden="true"
            />
          </div>
          <div className="pomodoro-controls" onClick={(e) => e.stopPropagation()} role="toolbar" aria-label="Pomodoro timer controls">
            {!isActive ? (
              <button 
                className="pomodoro-btn start" 
                onClick={startTimer} 
                title="Start"
                aria-label={`Start ${mode} timer`}
              >
                <span aria-hidden="true">▶</span>
              </button>
            ) : (
              <button 
                className="pomodoro-btn pause" 
                onClick={pauseTimer} 
                title="Pause"
                aria-label="Pause timer"
              >
                <span aria-hidden="true">⏸</span>
              </button>
            )}
            <button 
              className="pomodoro-btn reset" 
              onClick={resetTimer} 
              title="Reset"
              aria-label="Reset timer"
              disabled={timeLeft === (mode === 'work' ? WORK_DURATION_SECONDS : BREAK_DURATION_SECONDS) && !isActive}
            >
              <span aria-hidden="true">↻</span>
            </button>
            <button 
              className="pomodoro-btn stop" 
              onClick={stopTimer} 
              title="Stop"
              aria-label="Stop timer"
            >
              <span aria-hidden="true">⏹</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default PomodoroTimer;
