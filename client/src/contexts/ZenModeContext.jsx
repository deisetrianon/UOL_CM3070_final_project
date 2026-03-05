/**
 * Zen Mode context provider.
 * Manages Zen Mode state (manual and automatic activation), preferences, and suggestions.
 * Provides a distraction-free mode that can be triggered automatically based on stress levels.
 * 
 * @module ZenModeContext
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useFacialAnalysis } from './FacialAnalysisContext';
import { useStressFusion } from './StressFusionContext';
import { useAuth } from './AuthContext';
import { announceZenModeChange } from '../utils/accessibility';

const ZenModeContext = createContext(null);

/**
 * Zen Mode context provider component.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with Zen Mode context
 * @returns {JSX.Element} Zen Mode context provider
 */
export function ZenModeProvider({ children }) {
  const [isZenModeActive, setIsZenModeActive] = useState(false);
  const [isManuallyToggled, setIsManuallyToggled] = useState(false);
  const [autoTriggeredReason, setAutoTriggeredReason] = useState(null);
  const [autoZenModeEnabled, setAutoZenModeEnabled] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionReason, setSuggestionReason] = useState(null);

  const lastSuggestionTime = useRef(null);
  
  const { stressLevel, stressScore } = useStressFusion();
  const { isAuthenticated, registerLogoutCallback } = useAuth();

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.settings?.zenMode) {
        setAutoZenModeEnabled(data.settings.zenMode.autoEnabled ?? true);
        console.log('[ZenMode] Loaded preferences: autoEnabled =', data.settings.zenMode.autoEnabled);
      }
    } catch (error) {
      console.error('[ZenMode] Failed to fetch preferences:', error);
    } finally {
      setPreferencesLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated, fetchPreferences]);

  const resetState = useCallback(() => {
    setIsZenModeActive(false);
    setIsManuallyToggled(false);
    setAutoTriggeredReason(null);
    setShowSuggestion(false);
    setSuggestionReason(null);
    setAutoZenModeEnabled(true);
    setPreferencesLoaded(false);
    lastSuggestionTime.current = null;
    console.log('[ZenMode] State reset on logout');
  }, []);

  useEffect(() => {
    if (registerLogoutCallback) {
      const unregister = registerLogoutCallback(resetState);
      return unregister;
    }
  }, [registerLogoutCallback, resetState]);

  const toggleZenMode = useCallback(() => {
    const willBeActive = !isZenModeActive;
    setIsManuallyToggled(prev => !prev);
    setIsZenModeActive(prev => !prev);
    setShowSuggestion(false); // Hide suggestion when manually toggled
    
    if (willBeActive) {
      console.log('[ZenMode] Manually activated');
      announceZenModeChange(true, 'Zen Mode enabled manually', false);
    } else {
      console.log('[ZenMode] Manually deactivated');
      setAutoTriggeredReason(null);
      announceZenModeChange(false, 'Zen Mode disabled manually', false);
    }
  }, [isZenModeActive]);

  const enableZenMode = useCallback((reason = null) => {
    if (!isZenModeActive) {
      setIsZenModeActive(true);
      setShowSuggestion(false);
      const isAutomatic = !!reason;
      if (reason) {
        setAutoTriggeredReason(reason);
      }
      console.log('[ZenMode] Enabled:', reason || 'manual');
      announceZenModeChange(true, reason || 'Zen Mode enabled', isAutomatic);
    }
  }, [isZenModeActive]);

  const disableZenMode = useCallback(() => {
    setIsZenModeActive(false);
    setIsManuallyToggled(false);
    setAutoTriggeredReason(null);
    console.log('[ZenMode] Disabled');
  }, []);

  const dismissSuggestion = useCallback(() => {
    setShowSuggestion(false);
    setSuggestionReason(null);
        lastSuggestionTime.current = Date.now();
    console.log('[ZenMode] Suggestion dismissed');
  }, []);

  const updateAutoZenModePreference = useCallback(async (enabled) => {
    setAutoZenModeEnabled(enabled);
    
    try {
      const response = await fetch('/api/settings/zen-mode', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ autoEnabled: enabled }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('[ZenMode] Preference updated: autoEnabled =', enabled);
      }
    } catch (error) {
      console.error('[ZenMode] Failed to update preference:', error);
    }
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    const isStressed = stressLevel === 'moderate' || stressLevel === 'high';

    if (isStressed) {
      const reason = stressLevel === 'high' 
        ? `High stress detected - focusing on priority items`
        : `Moderate stress detected - focusing on priority items`;

      if (autoZenModeEnabled) {
        if (!isZenModeActive && !isManuallyToggled) {
          enableZenMode(reason);
          console.log('[ZenMode] Auto-triggered due to stress level:', stressLevel, 'score:', stressScore);
        }
      } else {
        if (!isZenModeActive && !showSuggestion) {
          const now = Date.now();
          const cooldownMs = 10 * 60 * 1000;
          
          if (!lastSuggestionTime.current || (now - lastSuggestionTime.current) > cooldownMs) {
            setSuggestionReason(
              stressLevel === 'high'
                ? `High stress detected. Would you like to focus on priority items?`
                : `Moderate stress detected. Enable Zen Mode to reduce distractions?`
            );
            setShowSuggestion(true);
            console.log('[ZenMode] Showing suggestion due to stress level:', stressLevel);
          }
        }
      }
    } else {
      if (isZenModeActive && autoTriggeredReason && !isManuallyToggled && autoZenModeEnabled) {
        const reason = `Stress returned to normal (score: ${stressScore})`;
        console.log('[ZenMode] Auto-disabling - stress returned to normal (score:', stressScore, ')');
        setIsZenModeActive(false);
        announceZenModeChange(false, reason, true);
        setAutoTriggeredReason(null);
      }
    }
  }, [stressLevel, stressScore, isZenModeActive, isManuallyToggled, autoZenModeEnabled, preferencesLoaded, enableZenMode, showSuggestion, autoTriggeredReason]);

  const value = {
    isZenModeActive,
    isManuallyToggled,
    autoTriggeredReason,
    autoZenModeEnabled,
    showSuggestion,
    suggestionReason,
    toggleZenMode,
    enableZenMode,
    disableZenMode,
    dismissSuggestion,
    updateAutoZenModePreference,
    refetchPreferences: fetchPreferences
  };

  return (
    <ZenModeContext.Provider value={value}>
      {children}
    </ZenModeContext.Provider>
  );
}

/**
 * Hook to access Zen Mode context.
 * 
 * @returns {Object} Zen Mode context with state, preferences, and control methods
 * @throws {Error} If used outside ZenModeProvider
 */
export function useZenMode() {
  const context = useContext(ZenModeContext);
  if (!context) {
    throw new Error('useZenMode must be used within a ZenModeProvider');
  }
  return context;
}
