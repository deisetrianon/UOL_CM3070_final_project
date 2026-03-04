import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useFacialAnalysis } from './FacialAnalysisContext';
import { useKeystroke } from './KeystrokeContext';
import { useAuth } from './AuthContext';
import { announceStressLevelChange } from '../utils/accessibility';
import { STRESS } from '../constants';

const StressFusionContext = createContext(null);

export function StressFusionProvider({ children }) {
  const { lastResult, lastAnalysisTime } = useFacialAnalysis();
  const { stressIndicators: keystrokeStress } = useKeystroke();
  const { isAuthenticated } = useAuth();

  const [stressLevel, setStressLevel] = useState('normal');
  const [stressScore, setStressScore] = useState(0);
  const [fusionData, setFusionData] = useState({
    facialScore: 0,
    keystrokeScore: 0,
    combinedScore: 0,
    lastUpdate: null
  });
  const facialHistoryRef = useRef([]);
  const previousStressLevelRef = useRef('normal');
  const keystrokeHistoryRef = useRef([]);
  const lastSavedScoreRef = useRef(0);
  const lastSaveTimeRef = useRef(Date.now());

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

    const fuseStressData = useCallback(() => {
    let facialScore = 0;
    if (lastResult?.success && lastResult?.analysis?.stressIndicators) {
      const indicators = lastResult.analysis.stressIndicators;
      facialScore = facialFatigueToScore(
        indicators.fatigueLevel,
        indicators.fatigueScore,
        indicators.possibleFatigue
      );

      if (lastAnalysisTime) {
        facialHistoryRef.current.push({
          timestamp: lastAnalysisTime.getTime(),
          value: facialScore
        });

        const cutoff = Date.now() - STRESS.HISTORY_CUTOFF;
        facialHistoryRef.current = facialHistoryRef.current.filter(
          entry => entry.timestamp > cutoff
        );
      }
    }

    const avgFacialScore = calculateWeightedAverage(
      facialHistoryRef.current,
      STRESS.FACIAL_AVERAGE_WINDOW
    );

    const keystrokeScore = getKeystrokeScore();

    if (keystrokeScore > 0) {
      keystrokeHistoryRef.current.push({
        timestamp: Date.now(),
        value: keystrokeScore
      });

      const cutoff = Date.now() - STRESS.HISTORY_CUTOFF;
      keystrokeHistoryRef.current = keystrokeHistoryRef.current.filter(
        entry => entry.timestamp > cutoff
      );
    }

    const avgKeystrokeScore = calculateWeightedAverage(
      keystrokeHistoryRef.current,
      STRESS.KEYSTROKE_AVERAGE_WINDOW
    );

    const keystrokeWeight = avgKeystrokeScore > 0 ? STRESS.KEYSTROKE_WEIGHT : 0;
    const facialWeight = keystrokeWeight > 0 ? STRESS.FACIAL_WEIGHT : 1.0;

    const combinedScore = (avgFacialScore * facialWeight) + (avgKeystrokeScore * keystrokeWeight);
    const finalScore = Math.round(Math.min(STRESS.MAX_SCORE, Math.max(STRESS.MIN_SCORE, combinedScore)));

    let level = STRESS.LEVELS.NORMAL;
    if (finalScore >= STRESS.HIGH_THRESHOLD) {
      level = STRESS.LEVELS.HIGH;
    } else if (finalScore >= STRESS.MODERATE_THRESHOLD) {
      level = STRESS.LEVELS.MODERATE;
    }

    if (previousStressLevelRef.current !== level) {
      announceStressLevelChange(level, finalScore);
      previousStressLevelRef.current = level;
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

  const saveStressLog = useCallback(async (score, level, facialScore, keystrokeScore, zenModeActive = false, interventionTriggered = false) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const response = await fetch('/api/stress-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          stressScore: score,
          stressLevel: level,
          componentScores: {
            facialScore: Math.round(facialScore),
            keystrokeScore: Math.round(keystrokeScore)
          },
          metadata: {
            zenModeActive,
            interventionTriggered
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          lastSavedScoreRef.current = score;
          lastSaveTimeRef.current = Date.now();
          console.log('[StressFusion] Stress log saved:', { score, level });
        }
      } else {
        console.warn('[StressFusion] Failed to save stress log:', response.status);
      }
    } catch (error) {
      console.error('[StressFusion] Error saving stress log:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || stressScore === 0) {
      return;
    }

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;
    const scoreChange = Math.abs(stressScore - lastSavedScoreRef.current);

    const shouldSave = 
      timeSinceLastSave >= STRESS.STRESS_LOG_SAVE_INTERVAL ||
      (scoreChange >= STRESS.MIN_SCORE_CHANGE_FOR_IMMEDIATE_SAVE && timeSinceLastSave >= 60000);

    if (shouldSave) {
      saveStressLog(
        stressScore,
        stressLevel,
        fusionData.facialScore,
        fusionData.keystrokeScore,
        false, 
        false 
      );
    }
  }, [stressScore, stressLevel, fusionData, isAuthenticated, saveStressLog]);

  useEffect(() => {
    if (lastResult?.success) {
      fuseStressData();
    }
  }, [lastResult, fuseStressData]);

  useEffect(() => {
    if (keystrokeStress.stressScore > 0) {
      fuseStressData();
    }
  }, [keystrokeStress.stressScore, fuseStressData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fuseStressData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fuseStressData]);

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
