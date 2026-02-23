import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useStressFusion } from './StressFusionContext';
import { useZenMode } from './ZenModeContext';
import { useAuth } from './AuthContext';

const WellnessInterventionContext = createContext(null);

/**
 * Wellness Intervention Context
 * Manages wellness intervention triggers and state based on stress levels and context
 * 
 * Intervention Types:
 * - Breathing
 * - Mindfulness
 * - Pomodoro
 * - Stretching
 * - Anxiety Relief
 * - Mental Health
 */

const MODERATE_STRESS_THRESHOLD = 30;
const HIGH_STRESS_THRESHOLD = 60;
const PROLONGED_STRESS_DURATION = 10 * 60 * 1000; // 10 minutes
// Cooldown periods
const INTERVENTION_COOLDOWN = 5 * 60 * 1000; // 5 minutes between same type
const GENERAL_COOLDOWN = 2 * 60 * 1000; // 2 minutes between any interventions

export function WellnessInterventionProvider({ children }) {
  const { stressLevel, stressScore } = useStressFusion();
  const { isZenModeActive } = useZenMode();
  const { isAuthenticated } = useAuth();

  const [activeIntervention, setActiveIntervention] = useState(null);
  const [interventionHistory, setInterventionHistory] = useState([]);
  const [highStressStartTime, setHighStressStartTime] = useState(null);
  const [lastInterventionTime, setLastInterventionTime] = useState(null);
  const [lastInterventionType, setLastInterventionType] = useState(null);
  const interventionCooldownsRef = useRef({});

  // Tracking prolonged high stress
  useEffect(() => {
    if (stressLevel === 'high' && stressScore >= HIGH_STRESS_THRESHOLD) {
      if (!highStressStartTime) {
        setHighStressStartTime(Date.now());
      }
    } else {
      setHighStressStartTime(null);
    }
  }, [stressLevel, stressScore, highStressStartTime]);

  // Checking if intervention can be triggered 
  const canTriggerIntervention = useCallback((type, isManual = false) => {
    const now = Date.now();
    
    // For manual interventions, skipping general cooldown (user-initiated)
    if (!isManual && lastInterventionTime && (now - lastInterventionTime) < GENERAL_COOLDOWN) {
      return false;
    }

    if (!isManual) {
      const lastTime = interventionCooldownsRef.current[type];
      if (lastTime && (now - lastTime) < INTERVENTION_COOLDOWN) {
        return false;
      }
    }

    return true;
  }, [lastInterventionTime]);

  // Triggering intervention based on stress level and context
  const triggerIntervention = useCallback((type, reason = null, isManual = false) => {
    if (!canTriggerIntervention(type, isManual)) {
      console.log(`[WellnessIntervention] Cooldown active for ${type}`);
      return false;
    }

    const now = Date.now();
    setActiveIntervention({ type, reason, timestamp: now });
    
    // Updating cooldowns for automatic interventions
    if (!isManual) {
      setLastInterventionTime(now);
      setLastInterventionType(type);
      interventionCooldownsRef.current[type] = now;
    }

    setInterventionHistory(prev => [
      ...prev.slice(-9), // Keep last 10
      { type, reason, timestamp: now }
    ]);

    console.log(`[WellnessIntervention] Triggered ${type}:`, reason, isManual ? '(manual)' : '(auto)');
    return true;
  }, [canTriggerIntervention]);

  // Auto-triggering interventions based on stress if none are active
  useEffect(() => {
    if (activeIntervention) {
      return;
    }

    const now = Date.now();
    const isModerate = stressLevel === 'moderate' && stressScore >= MODERATE_STRESS_THRESHOLD;
    const isHigh = stressLevel === 'high' && stressScore >= HIGH_STRESS_THRESHOLD;
    const isProlonged = highStressStartTime && (now - highStressStartTime) >= PROLONGED_STRESS_DURATION;

    if (isHigh) {
      if (canTriggerIntervention('breathing')) {
        triggerIntervention('breathing', 'High stress detected. Take a moment to breathe.');
      } else if (canTriggerIntervention('anxietyRelief')) {
        triggerIntervention('anxietyRelief', 'Feeling anxious? Try this grounding exercise.');
      }
    } else if (isProlonged) {
      if (canTriggerIntervention('mindfulness')) {
        triggerIntervention('mindfulness', 'You\'ve been under stress for a while. Take a mindful break.');
      }
    } else if (isModerate && isZenModeActive) {
      if (canTriggerIntervention('breathing')) {
        triggerIntervention('breathing', 'Moderate stress detected. A quick breathing exercise might help.');
      }
    }
  }, [stressLevel, stressScore, highStressStartTime, isZenModeActive, activeIntervention, canTriggerIntervention, triggerIntervention]);

  // Logging intervention to stress logs
  const logIntervention = useCallback(async (type) => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/stress-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          stressScore: stressScore || 0,
          stressLevel: stressLevel || 'normal',
          componentScores: {
            facialScore: 0,
            keystrokeScore: 0
          },
          metadata: {
            zenModeActive: isZenModeActive,
            interventionTriggered: true,
            interventionType: type
          }
        })
      });

      if (response.ok) {
        console.log('[WellnessIntervention] Intervention logged:', type);
      }
    } catch (error) {
      console.error('[WellnessIntervention] Error logging intervention:', error);
    }
  }, [isAuthenticated, stressScore, stressLevel, isZenModeActive]);

  const closeIntervention = useCallback(() => {
    if (activeIntervention) {
      logIntervention(activeIntervention.type);
    }
    setActiveIntervention(null);
    setLastInterventionTime(null);
    console.log('[WellnessIntervention] Closed');
  }, [activeIntervention, logIntervention]);

  const openBreathing = useCallback(() => {
    triggerIntervention('breathing', 'Guided breathing exercise', true);
  }, [triggerIntervention]);

  const openMindfulness = useCallback(() => {
    triggerIntervention('mindfulness', 'Guided mindfulness meditation', true);
  }, [triggerIntervention]);

  const openStretching = useCallback((context = 'general') => {
    const reason = context === 'warmup' 
      ? 'Start your day with a gentle warm-up'
      : context === 'cooldown'
      ? 'End your day with a relaxing cool-down'
      : 'Guided stretching exercise';
    triggerIntervention('stretching', reason, true);
  }, [triggerIntervention]);

  const openAnxietyRelief = useCallback(() => {
    triggerIntervention('anxietyRelief', 'Feeling anxious before a presentation or meeting?', true);
  }, [triggerIntervention]);

  const openMentalHealth = useCallback(() => {
    triggerIntervention('mentalHealth', 'Professional mental health support resources', true);
  }, [triggerIntervention]);

  const value = {
    activeIntervention,
    interventionHistory,
    triggerIntervention,
    closeIntervention,
    openBreathing,
    openMindfulness,
    openStretching,
    openAnxietyRelief,
    openMentalHealth,
    canTriggerIntervention
  };

  return (
    <WellnessInterventionContext.Provider value={value}>
      {children}
    </WellnessInterventionContext.Provider>
  );
}

export function useWellnessIntervention() {
  const context = useContext(WellnessInterventionContext);
  if (!context) {
    throw new Error('useWellnessIntervention must be used within a WellnessInterventionProvider');
  }
  return context;
}
