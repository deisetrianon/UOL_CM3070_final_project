/**
 * Pomodoro timer utility functions.
 * Handles loading, saving, and calculating Pomodoro timer state from localStorage.
 * 
 * @module pomodoro
 */

import { POMODORO } from '../constants';

const { WORK_DURATION_SECONDS, BREAK_DURATION_SECONDS, STORAGE_KEY } = POMODORO;

/**
 * Loads Pomodoro timer state from localStorage and calculates remaining time.
 * 
 * @returns {Object} Pomodoro state with mode, timeLeft, isActive, sessionCount, etc.
 */
export function loadPomodoroState() {
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
            timeLeft: state.mode === 'work' ? WORK_DURATION_SECONDS : BREAK_DURATION_SECONDS,
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
          timeLeft: state.timeLeft || (state.mode === 'work' ? WORK_DURATION_SECONDS : BREAK_DURATION_SECONDS),
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
  
  return {
    mode: 'work',
    timeLeft: WORK_DURATION_SECONDS,
    isActive: false,
    sessionCount: 0,
    startTimestamp: null,
    originalDuration: null,
    expired: false
  };
}

/**
 * Saves Pomodoro timer state to localStorage.
 * 
 * @param {Object} state - The Pomodoro state to save
 */
export function savePomodoroState(state) {
  try {
    const stateToSave = {
      mode: state.mode,
      timeLeft: state.timeLeft,
      isActive: state.isActive,
      sessionCount: state.sessionCount,
      startTimestamp: state.startTimestamp,
      originalDuration: state.originalDuration
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('[Pomodoro] Error saving state:', error);
  }
}

/**
 * Calculates the progress percentage of the current Pomodoro session.
 * 
 * @param {string} mode - The Pomodoro mode ('work' or 'break')
 * @param {number} timeLeft - The remaining time in seconds
 * @returns {number} Progress percentage (0-100)
 */
export function calculatePomodoroProgress(mode, timeLeft) {
  const totalDuration = mode === 'work' ? WORK_DURATION_SECONDS : BREAK_DURATION_SECONDS;
  return ((totalDuration - timeLeft) / totalDuration) * 100;
}
