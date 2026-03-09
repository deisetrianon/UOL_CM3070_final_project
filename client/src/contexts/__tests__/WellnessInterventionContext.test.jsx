import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { WellnessInterventionProvider, useWellnessIntervention } from '../WellnessInterventionContext';
import { StressFusionProvider } from '../StressFusionContext';
import { ZenModeProvider } from '../ZenModeContext';
import { FacialAnalysisProvider } from '../FacialAnalysisContext';
import { KeystrokeProvider } from '../KeystrokeContext';
import { AuthProvider } from '../AuthContext';
import { DialogProvider } from '../DialogContext';

const wrapper = ({ children }) => (
  <AuthProvider>
    <DialogProvider>
      <FacialAnalysisProvider>
        <KeystrokeProvider>
          <StressFusionProvider>
            <ZenModeProvider>
              <WellnessInterventionProvider>{children}</WellnessInterventionProvider>
            </ZenModeProvider>
          </StressFusionProvider>
        </KeystrokeProvider>
      </FacialAnalysisProvider>
    </DialogProvider>
  </AuthProvider>
);

describe('WellnessInterventionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWellnessIntervention(), { wrapper });

    expect(result.current.activeIntervention).toBeNull();
    expect(result.current.interventionHistory).toEqual([]);
  });

  it('should trigger intervention manually', () => {
    const { result } = renderHook(() => useWellnessIntervention(), { wrapper });

    act(() => {
      const success = result.current.triggerIntervention('breathing', 'Test', true);
      expect(success).toBe(true);
    });

    expect(result.current.activeIntervention).toBeDefined();
    expect(result.current.activeIntervention.type).toBe('breathing');
  });

  it('should respect cooldown periods', () => {
    const { result } = renderHook(() => useWellnessIntervention(), { wrapper });

    act(() => {
      result.current.triggerIntervention('breathing', 'Test', false);
    });

    act(() => {
      const success = result.current.triggerIntervention('breathing', 'Test', false);
      expect(success).toBe(false);
    });
  });

  it('should open breathing exercise', () => {
    const { result } = renderHook(() => useWellnessIntervention(), { wrapper });

    act(() => {
      result.current.openBreathing();
    });

    expect(result.current.activeIntervention?.type).toBe('breathing');
  });

  it('should close intervention', () => {
    const { result } = renderHook(() => useWellnessIntervention(), { wrapper });

    act(() => {
      result.current.triggerIntervention('breathing', 'Test', true);
      result.current.closeIntervention();
    });

    expect(result.current.activeIntervention).toBeNull();
  });
});
