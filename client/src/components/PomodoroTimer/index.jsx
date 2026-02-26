import { useState, useEffect, useRef, useCallback } from 'react';
import { useZenMode } from '../../contexts/ZenModeContext';
import pomodoroIcon from '../../assets/icons/pomodoro.png';
import './PomodoroTimer.css';

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds
const STORAGE_KEY = 'pomodoro_timer_state';

const loadInitialState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      const now = Date.now();
      
      if (state.isActive && state.startTimestamp && state.originalDuration) {
        const elapsed = Math.floor((now - state.startTimestamp) / 1000);
        const remainingTime = state.originalDuration - elapsed;
        
        if (remainingTime > 0) {
          return {
            mode: state.mode,
            timeLeft: remainingTime,
            isActive: true,
            sessionCount: state.sessionCount || 0,
            startTimestamp: state.startTimestamp,
            originalDuration: state.originalDuration
          };
        } else {
          return {
            mode: state.mode,
            timeLeft: state.mode === 'work' ? WORK_DURATION : BREAK_DURATION,
            isActive: false,
            sessionCount: state.sessionCount || 0,
            startTimestamp: null,
            originalDuration: null,
            expired: true,
            expiredMode: state.mode,
            expiredCount: state.sessionCount || 0
          };
        }
      } else {
        return {
          mode: state.mode,
          timeLeft: state.timeLeft || (state.mode === 'work' ? WORK_DURATION : BREAK_DURATION),
          isActive: false,
          sessionCount: state.sessionCount || 0,
          startTimestamp: null,
          originalDuration: null,
          expired: false
        };
      }
    }
  } catch (error) {
    console.error('[Pomodoro] Error loading initial state:', error);
  }
  
  // Default state
  return {
    mode: 'work',
    timeLeft: WORK_DURATION,
    isActive: false,
    sessionCount: 0,
    startTimestamp: null,
    originalDuration: null,
    expired: false
  };
};

function PomodoroTimer() {
  const { enableZenMode } = useZenMode();
  const initialState = loadInitialState();
  const [mode, setMode] = useState(initialState.mode);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [isActive, setIsActive] = useState(initialState.isActive);
  const [sessionCount, setSessionCount] = useState(initialState.sessionCount);
  const [breakAlertShown, setBreakAlertShown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialState.isActive); // Auto-expanding if timer is active
  const intervalRef = useRef(null);
  const startTimeRef = useRef(initialState.startTimestamp);
  const originalDurationRef = useRef(initialState.originalDuration);

  const handleTimerExpired = useCallback((expiredMode, count) => {
    if (expiredMode === 'work') {
      setMode('break');
      setTimeLeft(BREAK_DURATION);
      setSessionCount(count + 1);
      setIsActive(false);
      setBreakAlertShown(false);
      
      // Enabling Zen Mode automatically during break
      enableZenMode('Pomodoro break - time to rest');
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Work session complete! Time for a break.', {
          body: 'Zen Mode has been enabled to help you rest.',
          icon: '/favicon.ico'
        });
      } else {
        alert('🍅 Work session complete! Time for a break.\n\nZen Mode has been enabled to help you rest.');
      }
      
      // Clearing saved state
      localStorage.removeItem(STORAGE_KEY);
    } else {
      setMode('work');
      setTimeLeft(WORK_DURATION);
      setIsActive(false);
      setBreakAlertShown(false);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Break complete! Ready to focus?');
      }
      
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [enableZenMode]);

  const handleTimerComplete = useCallback(() => {
    handleTimerExpired(mode, sessionCount);
  }, [handleTimerExpired, mode, sessionCount]);

  // Auto-expanding when timer becomes active
  useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive]);

  // Handling timer expiration on mount if timer expired while away
  useEffect(() => {
    if (initialState.expired) {
      setTimeout(() => {
        handleTimerExpired(initialState.expiredMode, initialState.expiredCount);
      }, 100);
    }
  }, []);

  // Listening for external Pomodoro start events
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

  // Saving state to localStorage when timer starts, pauses, or timeLeft changes
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
      // Recalculating timeLeft from startTimestamp every second for accuracy
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
      
      // Saving state every 10 seconds while timer is running
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
    const originalDuration = mode === 'work' ? WORK_DURATION : BREAK_DURATION;
    setIsActive(true);
    setIsExpanded(true); 
    startTimeRef.current = now;
    originalDurationRef.current = originalDuration;
    setBreakAlertShown(false);
    
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
    setTimeLeft(mode === 'work' ? WORK_DURATION : BREAK_DURATION);
    setBreakAlertShown(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const stopTimer = () => {
    setIsActive(false);
    setMode('work');
    setTimeLeft(WORK_DURATION);
    setSessionCount(0);
    setBreakAlertShown(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'work'
    ? ((WORK_DURATION - timeLeft) / WORK_DURATION) * 100
    : ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100;

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const toggleExpand = () => {
    // Allowing collapsing if timer is not active
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
      >
        <img src={pomodoroIcon} alt="Pomodoro" className="pomodoro-icon" />
        {!isExpanded && (
          <span className="pomodoro-mode-text">
            POMODORO
          </span>
        )}
        {isExpanded && sessionCount > 0 && (
          <span className="pomodoro-session-count">{sessionCount}</span>
        )}
      </div>
      {isExpanded && (
        <>
          <div className="pomodoro-time-display" onClick={(e) => e.stopPropagation()}>
            {formatTime(timeLeft)}
          </div>
          <div className="pomodoro-progress-bar" onClick={(e) => e.stopPropagation()}>
            <div 
              className="pomodoro-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="pomodoro-controls" onClick={(e) => e.stopPropagation()}>
            {!isActive ? (
              <button className="pomodoro-btn start" onClick={startTimer} title="Start">
                ▶
              </button>
            ) : (
              <button className="pomodoro-btn pause" onClick={pauseTimer} title="Pause">
                ⏸
              </button>
            )}
            <button 
              className="pomodoro-btn reset" 
              onClick={resetTimer} 
              title="Reset"
              disabled={timeLeft === (mode === 'work' ? WORK_DURATION : BREAK_DURATION) && !isActive}
            >
              ↻
            </button>
            <button 
              className="pomodoro-btn stop" 
              onClick={stopTimer} 
              title="Stop"
            >
              ⏹
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default PomodoroTimer;
