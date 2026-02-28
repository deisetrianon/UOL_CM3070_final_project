import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useFacialAnalysis } from './FacialAnalysisContext';
import { useStressFusion } from './StressFusionContext';
import { useAuth } from './AuthContext';
import { announceZenModeChange } from '../utils/accessibility';

const ZenModeContext = createContext(null);

/**
 * ZenMode Provider (Context)
 * Manages the Zen Mode state globally across the application
 * 
 * Zen Mode can be activated:
 * 1. Manually by the user clicking the toggle
 * 2. Automatically when fatigue level is moderate or high (if auto is enabled in settings)
 * 
 * When active, the UI filters to show only:
 * - Emails: starred, important
 * - Tasks: high priority, urgent, or deadline is today
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

  // Resetting state on logout
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

  // Registering logout callback
  useEffect(() => {
    if (registerLogoutCallback) {
      const unregister = registerLogoutCallback(resetState);
      return unregister;
    }
  }, [registerLogoutCallback, resetState]);

  // Toggle Zen Mode manually
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

  // Enable Zen Mode, which can be called externally.
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

  // Dismissing suggestion notification
  const dismissSuggestion = useCallback(() => {
    setShowSuggestion(false);
    setSuggestionReason(null);
    // Setting cooldown to not show suggestion again for 10 minutes
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

  // Auto-triggering or auto-disabling Zen Mode based on unified stress level
  useEffect(() => {
    if (!preferencesLoaded) {
      return; // Awaiting preferences to load
    }

    // Using unified stress level from fusion (combines facial + keystroke)
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
          // Checking cooldown: 10 minutes between suggestions
          const now = Date.now();
          const cooldownMs = 10 * 60 * 1000; // 10 minutes
          
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
      // Stress is normal - auto-disable Zen Mode if it was auto-triggered
      // Only auto-disable if:
      // 1. Zen Mode is currently active
      // 2. It was auto-triggered (has autoTriggeredReason), not manually toggled
      // 3. Auto Zen Mode is enabled in settings
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

export function useZenMode() {
  const context = useContext(ZenModeContext);
  if (!context) {
    throw new Error('useZenMode must be used within a ZenModeProvider');
  }
  return context;
}
