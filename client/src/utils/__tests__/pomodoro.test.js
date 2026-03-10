import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadPomodoroState,
  savePomodoroState,
  calculatePomodoroProgress,
} from '../pomodoro.js';
import { POMODORO } from '../../constants';

const { WORK_DURATION_SECONDS, BREAK_DURATION_SECONDS, STORAGE_KEY } = POMODORO;

describe('Pomodoro Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('loadPomodoroState', () => {
    it('should return default state when no saved state exists', () => {
      const state = loadPomodoroState();
      
      expect(state.mode).toBe('work');
      expect(state.timeLeft).toBe(WORK_DURATION_SECONDS);
      expect(state.isActive).toBe(false);
      expect(state.sessionCount).toBe(0);
    });

    it('should load saved inactive state', () => {
      const savedState = {
        mode: 'break',
        timeLeft: 300,
        isActive: false,
        sessionCount: 5,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
      
      const state = loadPomodoroState();
      expect(state.mode).toBe('break');
      expect(state.timeLeft).toBe(300);
      expect(state.isActive).toBe(false);
      expect(state.sessionCount).toBe(5);
    });

    it('should calculate remaining time for active timer', () => {
      const now = Date.now();
      const savedState = {
        mode: 'work',
        timeLeft: 1500,
        isActive: true,
        sessionCount: 2,
        startTimestamp: now - 300000,
        originalDuration: 1500,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
      
      vi.useFakeTimers();
      vi.setSystemTime(now);
      
      const state = loadPomodoroState();
      expect(state.isActive).toBe(true);
      expect(state.timeLeft).toBe(1200);
      
      vi.useRealTimers();
    });

    it('should mark timer as expired when time runs out', () => {
      const now = Date.now();
      const savedState = {
        mode: 'work',
        timeLeft: 1500,
        isActive: true,
        sessionCount: 2,
        startTimestamp: now - 1600000,
        originalDuration: 1500,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
      
      vi.useFakeTimers();
      vi.setSystemTime(now);
      
      const state = loadPomodoroState();
      expect(state.expired).toBe(true);
      expect(state.expiredMode).toBe('work');
      expect(state.isActive).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('savePomodoroState', () => {
    it('should save state to localStorage', () => {
      const state = {
        mode: 'work',
        timeLeft: 1200,
        isActive: true,
        sessionCount: 3,
        startTimestamp: Date.now(),
        originalDuration: 1500,
      };
      
      savePomodoroState(state);
      
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      expect(saved.mode).toBe('work');
      expect(saved.timeLeft).toBe(1200);
      expect(saved.isActive).toBe(true);
      expect(saved.sessionCount).toBe(3);
    });

    it('should handle errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const state = { mode: 'work', timeLeft: 1200, isActive: false, sessionCount: 0 };
      savePomodoroState(state);
      
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
      mockSetItem.mockRestore();
    });
  });

  describe('calculatePomodoroProgress', () => {
    it('should calculate progress for work mode', () => {
      const progress = calculatePomodoroProgress('work', WORK_DURATION_SECONDS / 2);
      expect(progress).toBe(50);
    });

    it('should calculate progress for break mode', () => {
      const progress = calculatePomodoroProgress('break', BREAK_DURATION_SECONDS / 2);
      expect(progress).toBe(50);
    });

    it('should return 0 when timer is at start', () => {
      const progress = calculatePomodoroProgress('work', WORK_DURATION_SECONDS);
      expect(progress).toBe(0);
    });

    it('should return 100 when timer is complete', () => {
      const progress = calculatePomodoroProgress('work', 0);
      expect(progress).toBe(100);
    });
  });
});
