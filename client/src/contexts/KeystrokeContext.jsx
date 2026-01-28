import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const KeystrokeContext = createContext(null);

/**
 * Keystroke Dynamics Context
 * Captures and analyzes keystroke patterns to detect stress indicators
 * 
 * - Dwell Time: time between keydown and keyup (long = fatigue/hesitation)
 * - Flight Time: time between keyup and next keydown (short = rapid/anxious typing)
 * - Panic Typing: erratic rhythm + high speed
 */
const ROLLING_WINDOW_SIZE = 50; // Number of keystrokes to analyze
const BASELINE_DEVIATION_THRESHOLD = 0.15; // 15% deviation triggers stress event
const MIN_KEYSTROKES_FOR_ANALYSIS = 10; // Minimum keystrokes before analysis
// Baseline values (milliseconds)
const BASELINE_DWELL_TIME = 100; // Average time key is held down
const BASELINE_FLIGHT_TIME = 150; // Average time between keystrokes

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
    averageDwellTime: BASELINE_DWELL_TIME,
    averageFlightTime: BASELINE_FLIGHT_TIME,
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

  /**
   * Detecting panic typing: erratic rhythm + high speed
   * 
   * - Very short flight times: rapid typing (< 80ms = very rapid)
   * - High variance in flight times: erratic rhythm (> 50% of average = erratic)
   * - Short dwell times: quick key presses (< 80ms = very quick)
   */
  const detectPanicTyping = useCallback((flightTimes, dwellTimes) => {
    if (flightTimes.length < MIN_KEYSTROKES_FOR_ANALYSIS) return false;

    const recentFlight = flightTimes.slice(-ROLLING_WINDOW_SIZE);
    const recentDwell = dwellTimes.slice(-ROLLING_WINDOW_SIZE);

    const avgFlight = calculateRollingAverage(recentFlight, ROLLING_WINDOW_SIZE);
    const avgDwell = calculateRollingAverage(recentDwell, ROLLING_WINDOW_SIZE);

    const flightVariance = recentFlight.reduce((sum, val) => {
      return sum + Math.pow(val - avgFlight, 2);
    }, 0) / recentFlight.length;
    const flightStdDev = Math.sqrt(flightVariance);

    const isRapid = avgFlight < 80;
    const isErratic = flightStdDev > (avgFlight * 0.5);
    const isQuickPresses = avgDwell < 80;

    return isRapid && (isErratic || isQuickPresses);
  }, [calculateRollingAverage]);

  const analyzeKeystrokes = useCallback(() => {
    const history = keystrokeHistoryRef.current;
    
    if (history.length < MIN_KEYSTROKES_FOR_ANALYSIS) {
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

    // Calculating rolling averages
    const avgDwellTime = calculateRollingAverage(dwellTimes, ROLLING_WINDOW_SIZE);
    const avgFlightTime = calculateRollingAverage(flightTimes, ROLLING_WINDOW_SIZE);
    // Calculating deviations from baseline
    const dwellDeviation = calculateDeviation(avgDwellTime, BASELINE_DWELL_TIME);
    const flightDeviation = calculateDeviation(avgFlightTime, BASELINE_FLIGHT_TIME);
    // Detecting stress events
    const hasDwellStress = dwellDeviation > BASELINE_DEVIATION_THRESHOLD;
    const hasFlightStress = flightDeviation > BASELINE_DEVIATION_THRESHOLD;
    const hasStressEvent = hasDwellStress || hasFlightStress;
    // Detecting panic typing
    const panicTyping = detectPanicTyping(flightTimes, dwellTimes);

    // Calculating stress score (0-100) by combining multiple indicators
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

    // Keeping only last ROLLING_WINDOW_SIZE * 2 entries
    if (keystrokeHistoryRef.current.length > ROLLING_WINDOW_SIZE * 2) {
      keystrokeHistoryRef.current = keystrokeHistoryRef.current.slice(-ROLLING_WINDOW_SIZE * 2);
    }

    // Updating state
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

    // Finding the most recent keydown for this key
    const history = keystrokeHistoryRef.current;
    const lastEntry = history[history.length - 1];

    if (lastEntry && lastEntry.keydown !== null && lastEntry.keyup === null) {
      const dwellTime = timestamp - lastEntry.keydown;
      lastEntry.dwellTime = dwellTime;
      lastEntry.keyup = timestamp;

      // Updating state
      setKeystrokeData(prev => ({
        ...prev,
        lastKeyup: timestamp
      }));

      // Analyzing after each keystroke
      analyzeKeystrokes();
    }
  }, [analyzeKeystrokes]);


  useEffect(() => {
    const handleKeydownWrapper = (e) => {
      // Not capturing if user is typing in an input/textarea
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

  // Resetting keystroke data
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
      averageDwellTime: BASELINE_DWELL_TIME,
      averageFlightTime: BASELINE_FLIGHT_TIME,
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
