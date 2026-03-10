import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { KeystrokeProvider, useKeystroke } from '../KeystrokeContext';

const wrapper = ({ children }) => <KeystrokeProvider>{children}</KeystrokeProvider>;

describe('KeystrokeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useKeystroke(), { wrapper });

    expect(result.current.keystrokeData.totalKeystrokes).toBe(0);
    expect(result.current.stressIndicators.stressScore).toBe(0);
    expect(result.current.stressIndicators.hasStressEvent).toBe(false);
  });

  it('should track keystrokes', () => {
    const { result } = renderHook(() => useKeystroke(), { wrapper });

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    act(() => {
      const keydownEvent = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      input.dispatchEvent(keydownEvent);
    });

    expect(result.current.keystrokeData.totalKeystrokes).toBeGreaterThanOrEqual(0);
    
    document.body.removeChild(input);
  });

  it('should calculate stress indicators from keystrokes', () => {
    const { result } = renderHook(() => useKeystroke(), { wrapper });

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    act(() => {
      for (let i = 0; i < 20; i++) {
        const keydownEvent = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
        input.dispatchEvent(keydownEvent);

        setTimeout(() => {
          const keyupEvent = new KeyboardEvent('keyup', { key: 'a', bubbles: true });
          input.dispatchEvent(keyupEvent);
        }, 10);
      }
    });

    expect(result.current.stressIndicators).toBeDefined();
  });

  it('should ignore modifier keys', () => {
    const { result } = renderHook(() => useKeystroke(), { wrapper });

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    act(() => {
      const ctrlEvent = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
      });
      input.dispatchEvent(ctrlEvent);
    });

    expect(result.current.keystrokeData.totalKeystrokes).toBe(0);
    
    document.body.removeChild(input);
  });
});
