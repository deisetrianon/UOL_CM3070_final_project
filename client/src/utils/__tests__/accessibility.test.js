import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  announceToScreenReader,
  announceZenModeChange,
  announceStressLevelChange,
} from '../accessibility.js';

describe('Accessibility Utilities', () => {
  let mockLiveRegion;

  beforeEach(() => {
    mockLiveRegion = {
      textContent: '',
      setAttribute: vi.fn(),
    };

    document.getElementById = vi.fn().mockReturnValue(mockLiveRegion);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('announceToScreenReader', () => {
    it('should announce message to live region', () => {
      announceToScreenReader('Test message');

      vi.advanceTimersByTime(100);

      expect(mockLiveRegion.textContent).toBe('Test message');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
    });

    it('should use assertive priority when specified', () => {
      announceToScreenReader('Urgent message', 'assertive');

      vi.advanceTimersByTime(100);

      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');
    });

    it('should clear text before setting new message', () => {
      mockLiveRegion.textContent = 'Old message';
      
      announceToScreenReader('New message');

      expect(mockLiveRegion.textContent).toBe('');

      vi.advanceTimersByTime(100);

      expect(mockLiveRegion.textContent).toBe('New message');
    });

    it('should handle missing live region gracefully', () => {
      document.getElementById = vi.fn().mockReturnValue(null);

      expect(() => announceToScreenReader('Test')).not.toThrow();
    });
  });

  describe('announceZenModeChange', () => {
    it('should announce Zen Mode enabled manually', () => {
      announceZenModeChange(true, 'User enabled', false);

      vi.advanceTimersByTime(100);

      expect(mockLiveRegion.textContent).toContain('Zen Mode enabled manually');
      expect(mockLiveRegion.textContent).toContain('User enabled');
    });

    it('should announce Zen Mode enabled automatically', () => {
      announceZenModeChange(true, 'High stress detected', true);

      vi.advanceTimersByTime(100);

      expect(mockLiveRegion.textContent).toContain('Zen Mode enabled automatically');
    });

    it('should announce Zen Mode disabled', () => {
      announceZenModeChange(false, 'User disabled', false);

      vi.advanceTimersByTime(100);

      expect(mockLiveRegion.textContent).toContain('Zen Mode disabled manually');
    });
  });

  describe('announceStressLevelChange', () => {
    it('should announce high stress level', () => {
      announceStressLevelChange('high', 85);

      vi.advanceTimersByTime(100);

      expect(mockLiveRegion.textContent).toContain('high');
      expect(mockLiveRegion.textContent).toContain('85 percent');
    });

    it('should announce moderate stress level', () => {
      announceStressLevelChange('moderate', 50);

      vi.advanceTimersByTime(100);

      expect(mockLiveRegion.textContent).toContain('moderate');
      expect(mockLiveRegion.textContent).toContain('50 percent');
    });

    it('should announce low stress level', () => {
      announceStressLevelChange('low', 20);

      vi.advanceTimersByTime(100);

      expect(mockLiveRegion.textContent).toContain('low');
      expect(mockLiveRegion.textContent).toContain('20 percent');
    });
  });
});
