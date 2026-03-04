import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { KEYSTROKE } from '../constants';

const KeystrokeContext = createContext(null);

export function KeystrokeProvider({ children }) {
  const [keystrokeData, setKeystrokeData] = useState({
    dwellTimes: [],
    flightTimes: [],
    totalKeystrokes: 0,
    lastKeydown: null,
    lastKeyup: null
  });

  const [stressIndicators, setStressIndicators] = useState({
    hasStressEvent: false,
    panicTyping: false,
    dwellTimeDeviation: 0,
    flightTimeDeviation: 0,
    averageDwellTime: KEYSTROKE.BASELINE_DWELL_TIME_MS,
    averageFlightTime: KEYSTROKE.BASELINE_FLIGHT_TIME_MS,
    stressScore: 0
  });

  const keystrokeHistoryRef = useRef([]);
  const lastKeydownRef = useRef(null);
  const lastKeyupRef = useRef(null);

  const calculateRollingAverage = useCallback((values, windowSize) => {
    if (values.length === 0) return 0;
    const recent = values.slice(-windowSize);
    return recent.reduce((sum, val) => sum + val, 0) / recent.length;
  }, []);

  const calculateDeviation = useCallback((current, baseline) => {
    if (baseline === 0) return 0;
    return Math.abs((current - baseline) / baseline);
  }, []);

  const detectPanicTyping = useCallback((flightTimes, dwellTimes) => {
    if (flightTimes.length < KEYSTROKE.MIN_KEYSTROKES_FOR_ANALYSIS) return false;

    const recentFlight = flightTimes.slice(-KEYSTROKE.ROLLING_WINDOW_SIZE);
    const recentDwell = dwellTimes.slice(-KEYSTROKE.ROLLING_WINDOW_SIZE);

    const avgFlight = calculateRollingAverage(recentFlight, KEYSTROKE.ROLLING_WINDOW_SIZE);
    const avgDwell = calculateRollingAverage(recentDwell, KEYSTROKE.ROLLING_WINDOW_SIZE);

    const flightVariance = recentFlight.reduce((sum, val) => {
      return sum + Math.pow(val - avgFlight, 2);
    }, 0) / recentFlight.length;
    const flightStdDev = Math.sqrt(flightVariance);

    const isRapid = avgFlight < KEYSTROKE.PANIC_TYPING_FLIGHT_TIME_MS;
    const isErratic = flightStdDev > (avgFlight * KEYSTROKE.PANIC_TYPING_VARIANCE_THRESHOLD);
    const isQuickPresses = avgDwell < KEYSTROKE.PANIC_TYPING_DWELL_TIME_MS;

    return isRapid && (isErratic || isQuickPresses);
  }, [calculateRollingAverage]);

  const analyzeKeystrokes = useCallback(() => {
    const history = keystrokeHistoryRef.current;
    
    if (history.length < KEYSTROKE.MIN_KEYSTROKES_FOR_ANALYSIS) {
      setStressIndicators(prev => ({
        ...prev,
        hasStressEvent: false,
        panicTyping: false,
        stressScore: 0
      }));
      return;
    }

    const dwellTimes = history
      .filter(k => k.dwellTime !== null)
      .map(k => k.dwellTime);
    
    const flightTimes = history
      .filter(k => k.flightTime !== null)
      .map(k => k.flightTime);

    if (dwellTimes.length === 0 && flightTimes.length === 0) {
      return;
    }

    const avgDwellTime = calculateRollingAverage(dwellTimes, KEYSTROKE.ROLLING_WINDOW_SIZE);
    const avgFlightTime = calculateRollingAverage(flightTimes, KEYSTROKE.ROLLING_WINDOW_SIZE);
    const dwellDeviation = calculateDeviation(avgDwellTime, KEYSTROKE.BASELINE_DWELL_TIME_MS);
    const flightDeviation = calculateDeviation(avgFlightTime, KEYSTROKE.BASELINE_FLIGHT_TIME_MS);
    const hasDwellStress = dwellDeviation > KEYSTROKE.BASELINE_DEVIATION_THRESHOLD;
    const hasFlightStress = flightDeviation > KEYSTROKE.BASELINE_DEVIATION_THRESHOLD;
    const hasStressEvent = hasDwellStress || hasFlightStress;
    const panicTyping = detectPanicTyping(flightTimes, dwellTimes);
    let stressScore = 0;
    if (hasDwellStress) stressScore += 30;
    if (hasFlightStress) stressScore += 30;
    if (panicTyping) stressScore += 40;
    
    stressScore = Math.min(100, stressScore);

    setStressIndicators({
      hasStressEvent,
      panicTyping,
      dwellTimeDeviation: dwellDeviation,
      flightTimeDeviation: flightDeviation,
      averageDwellTime: avgDwellTime,
      averageFlightTime: avgFlightTime,
      stressScore
    });

    if (hasStressEvent || panicTyping) {
      console.log('[Keystroke] Stress detected:', {
        hasStressEvent,
        panicTyping,
        dwellDeviation: (dwellDeviation * 100).toFixed(1) + '%',
        flightDeviation: (flightDeviation * 100).toFixed(1) + '%',
        stressScore
      });
    }
  }, [calculateRollingAverage, calculateDeviation, detectPanicTyping]);

  const handleKeydown = useCallback((event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return;
    }

    if (event.key.length > 1 && !['Enter', 'Space', 'Backspace', 'Delete'].includes(event.key)) {
      return;
    }

    const timestamp = Date.now();
    lastKeydownRef.current = timestamp;

    let flightTime = null;
    if (lastKeyupRef.current !== null) {
      flightTime = timestamp - lastKeyupRef.current;
    }

    keystrokeHistoryRef.current.push({
      key: event.key,
      keydown: timestamp,
      keyup: null,
      dwellTime: null,
      flightTime
    });

    if (keystrokeHistoryRef.current.length > KEYSTROKE.ROLLING_WINDOW_SIZE * 2) {
      keystrokeHistoryRef.current = keystrokeHistoryRef.current.slice(-KEYSTROKE.ROLLING_WINDOW_SIZE * 2);
    }

    setKeystrokeData(prev => ({
      ...prev,
      lastKeydown: timestamp,
      totalKeystrokes: prev.totalKeystrokes + 1
    }));
  }, []);


  const handleKeyup = useCallback((event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return;
    }

    const timestamp = Date.now();
    lastKeyupRef.current = timestamp;

    const history = keystrokeHistoryRef.current;
    const lastEntry = history[history.length - 1];

    if (lastEntry && lastEntry.keydown !== null && lastEntry.keyup === null) {
      const dwellTime = timestamp - lastEntry.keydown;
      lastEntry.dwellTime = dwellTime;
      lastEntry.keyup = timestamp;

      setKeystrokeData(prev => ({
        ...prev,
        lastKeyup: timestamp
      }));

      analyzeKeystrokes();
    }
  }, [analyzeKeystrokes]);


  useEffect(() => {
    const handleKeydownWrapper = (e) => {
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable;
      
      if (isInput) {
        handleKeydown(e);
      }
    };

    const handleKeyupWrapper = (e) => {
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable;
      
      if (isInput) {
        handleKeyup(e);
      }
    };

    window.addEventListener('keydown', handleKeydownWrapper);
    window.addEventListener('keyup', handleKeyupWrapper);

    return () => {
      window.removeEventListener('keydown', handleKeydownWrapper);
      window.removeEventListener('keyup', handleKeyupWrapper);
    };
  }, [handleKeydown, handleKeyup]);

  const resetKeystrokeData = useCallback(() => {
    keystrokeHistoryRef.current = [];
    lastKeydownRef.current = null;
    lastKeyupRef.current = null;
    setKeystrokeData({
      dwellTimes: [],
      flightTimes: [],
      totalKeystrokes: 0,
      lastKeydown: null,
      lastKeyup: null
    });
    setStressIndicators({
      hasStressEvent: false,
      panicTyping: false,
      dwellTimeDeviation: 0,
      flightTimeDeviation: 0,
      averageDwellTime: KEYSTROKE.BASELINE_DWELL_TIME_MS,
      averageFlightTime: KEYSTROKE.BASELINE_FLIGHT_TIME_MS,
      stressScore: 0
    });
    console.log('[Keystroke] Data reset');
  }, []);

  const value = {
    keystrokeData,
    stressIndicators,
    resetKeystrokeData
  };

  return (
    <KeystrokeContext.Provider value={value}>
      {children}
    </KeystrokeContext.Provider>
  );
}

export function useKeystroke() {
  const context = useContext(KeystrokeContext);
  if (!context) {
    throw new Error('useKeystroke must be used within a KeystrokeProvider');
  }
  return context;
}
