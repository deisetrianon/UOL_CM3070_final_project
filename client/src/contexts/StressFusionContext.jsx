import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useFacialAnalysis } from './FacialAnalysisContext';
import { useKeystroke } from './KeystrokeContext';

const StressFusionContext = createContext(null);

/**
 * Stress Fusion Context
 * Combines keystroke dynamics and facial analysis data into a unified stress score
 * 
 * Fusion Algorithm:
 * - Facial Analysis: 60% weight (more reliable, continuous monitoring)
 * - Keystroke Dynamics: 40% weight (behavioral indicator, requires typing)
 * 
 * Stress Levels:
 * - Normal: 0-30
 * - Moderate: 31-60
 * - High: 61-100
 */

// Weight configuration for fusion
const FACIAL_WEIGHT = 0.6;
const KEYSTROKE_WEIGHT = 0.4;
// Stress level thresholds
const MODERATE_STRESS_THRESHOLD = 30;
const HIGH_STRESS_THRESHOLD = 60;
// Time windows for averaging
const FACIAL_AVERAGE_WINDOW = 5 * 60 * 1000; // 5 minutes
const KEYSTROKE_AVERAGE_WINDOW = 2 * 60 * 1000; // 2 minutes

export function StressFusionProvider({ children }) {
  const { lastResult, lastAnalysisTime } = useFacialAnalysis();
  const { stressIndicators: keystrokeStress } = useKeystroke();

  const [stressLevel, setStressLevel] = useState('normal');
  const [stressScore, setStressScore] = useState(0);
  const [fusionData, setFusionData] = useState({
    facialScore: 0,
    keystrokeScore: 0,
    combinedScore: 0,
    lastUpdate: null
  });
  const facialHistoryRef = useRef([]);
  const keystrokeHistoryRef = useRef([]);

  const facialFatigueToScore = useCallback((fatigueLevel, fatigueScore, possibleFatigue) => {
    if (!possibleFatigue) return 0;

    if (fatigueScore !== undefined && fatigueScore !== null) {
      return Math.min(100, fatigueScore);
    }

    const level = fatigueLevel?.toLowerCase();

    switch (level) {
      case 'high':
        return 75;
      case 'moderate':
        return 50;
      case 'low':
        return 25;
      default:
        return 0;
    }
  }, []);

  // Getting keystroke stress score (0-100) using the stress score from keystroke analysis
  const getKeystrokeScore = useCallback(() => {
    return keystrokeStress.stressScore || 0;
  }, [keystrokeStress]);

  const calculateWeightedAverage = useCallback((history, windowMs) => {
    if (history.length === 0) return 0;

    const now = Date.now();
    const recent = history.filter(entry => (now - entry.timestamp) <= windowMs);

    if (recent.length === 0) return 0;

    const sum = recent.reduce((acc, entry) => acc + entry.value, 0);
    return sum / recent.length;
  }, []);

  // Fusing facial and keystroke data into unified stress score
  const fuseStressData = useCallback(() => {
    let facialScore = 0;
    if (lastResult?.success && lastResult?.analysis?.stressIndicators) {
      const indicators = lastResult.analysis.stressIndicators;
      facialScore = facialFatigueToScore(
        indicators.fatigueLevel,
        indicators.fatigueScore,
        indicators.possibleFatigue
      );

      // Adding to history
      if (lastAnalysisTime) {
        facialHistoryRef.current.push({
          timestamp: lastAnalysisTime.getTime(),
          value: facialScore
        });

        // Keeping only recent history (last 10 minutes)
        const cutoff = Date.now() - (10 * 60 * 1000);
        facialHistoryRef.current = facialHistoryRef.current.filter(
          entry => entry.timestamp > cutoff
        );
      }
    }

    const avgFacialScore = calculateWeightedAverage(
      facialHistoryRef.current,
      FACIAL_AVERAGE_WINDOW
    );

    const keystrokeScore = getKeystrokeScore();

    // Adding to history
    if (keystrokeScore > 0) {
      keystrokeHistoryRef.current.push({
        timestamp: Date.now(),
        value: keystrokeScore
      });

      // Keeping only recent history (last 5 minutes)
      const cutoff = Date.now() - (5 * 60 * 1000);
      keystrokeHistoryRef.current = keystrokeHistoryRef.current.filter(
        entry => entry.timestamp > cutoff
      );
    }

    const avgKeystrokeScore = calculateWeightedAverage(
      keystrokeHistoryRef.current,
      KEYSTROKE_AVERAGE_WINDOW
    );

    // Fusion: weighted combination: if keystroke data is not available (user not typing), rely more on facial
    const keystrokeWeight = avgKeystrokeScore > 0 ? KEYSTROKE_WEIGHT : 0;
    const facialWeight = keystrokeWeight > 0 ? FACIAL_WEIGHT : 1.0;

    const combinedScore = (avgFacialScore * facialWeight) + (avgKeystrokeScore * keystrokeWeight);
    const finalScore = Math.round(Math.min(100, Math.max(0, combinedScore)));

    let level = 'normal';
    if (finalScore >= HIGH_STRESS_THRESHOLD) {
      level = 'high';
    } else if (finalScore >= MODERATE_STRESS_THRESHOLD) {
      level = 'moderate';
    }

    setStressScore(finalScore);
    setStressLevel(level);
    setFusionData({
      facialScore: Math.round(avgFacialScore),
      keystrokeScore: Math.round(avgKeystrokeScore),
      combinedScore: finalScore,
      lastUpdate: new Date()
    });

    console.log('[StressFusion] Updated:', {
      level,
      score: finalScore,
      facial: Math.round(avgFacialScore),
      keystroke: Math.round(avgKeystrokeScore)
    });
  }, [
    lastResult,
    lastAnalysisTime,
    facialFatigueToScore,
    getKeystrokeScore,
    calculateWeightedAverage
  ]);

  // Updating fusion when facial analysis completes
  useEffect(() => {
    if (lastResult?.success) {
      fuseStressData();
    }
  }, [lastResult, fuseStressData]);

  // Updating fusion when keystroke stress changes
  useEffect(() => {
    if (keystrokeStress.stressScore > 0) {
      fuseStressData();
    }
  }, [keystrokeStress.stressScore, fuseStressData]);

  // Periodicall updating fusion (every 30 seconds) to refresh averages
  useEffect(() => {
    const interval = setInterval(() => {
      fuseStressData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fuseStressData]);

  // Resetting fusion data
  const resetFusionData = useCallback(() => {
    facialHistoryRef.current = [];
    keystrokeHistoryRef.current = [];
    setStressLevel('normal');
    setStressScore(0);
    setFusionData({
      facialScore: 0,
      keystrokeScore: 0,
      combinedScore: 0,
      lastUpdate: null
    });
    console.log('[StressFusion] Data reset');
  }, []);

  const value = {
    stressLevel,
    stressScore,
    fusionData,
    resetFusionData
  };

  return (
    <StressFusionContext.Provider value={value}>
      {children}
    </StressFusionContext.Provider>
  );
}

export function useStressFusion() {
  const context = useContext(StressFusionContext);
  if (!context) {
    throw new Error('useStressFusion must be used within a StressFusionProvider');
  }
  return context;
}
