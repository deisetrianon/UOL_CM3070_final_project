import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import { StressFusionProvider, useStressFusion } from '../StressFusionContext';
import { FacialAnalysisProvider } from '../FacialAnalysisContext';
import { KeystrokeProvider } from '../KeystrokeContext';
import { AuthProvider } from '../AuthContext';
import { DialogProvider } from '../DialogContext';

vi.mock('../utils/accessibility', () => ({
  announceStressLevelChange: vi.fn(),
}));

const TestComponent = () => {
  const { stressLevel, stressScore, fusionData, resetFusionData } = useStressFusion();
  return (
    <div>
      <div>Level: {stressLevel}</div>
      <div>Score: {stressScore}</div>
      <button onClick={resetFusionData}>Reset</button>
    </div>
  );
};

const AllProviders = ({ children }) => (
  <AuthProvider>
    <DialogProvider>
      <FacialAnalysisProvider>
        <KeystrokeProvider>
          <StressFusionProvider>{children}</StressFusionProvider>
        </KeystrokeProvider>
      </FacialAnalysisProvider>
    </DialogProvider>
  </AuthProvider>
);

describe('StressFusionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
  });

  it('should initialize with default state', () => {
    render(
      <AllProviders>
        <TestComponent />
      </AllProviders>
    );

    expect(screen.getByText(/Level: normal/i)).toBeInTheDocument();
    expect(screen.getByText(/Score: 0/i)).toBeInTheDocument();
  });

  it('should provide fusion data', () => {
    const { result } = renderHook(() => useStressFusion(), {
      wrapper: AllProviders,
    });

    expect(result.current.fusionData).toBeDefined();
    expect(result.current.fusionData.facialScore).toBe(0);
    expect(result.current.fusionData.keystrokeScore).toBe(0);
  });

  it('should reset fusion data', () => {
    const { result } = renderHook(() => useStressFusion(), {
      wrapper: AllProviders,
    });

    act(() => {
      result.current.resetFusionData();
    });

    expect(result.current.stressLevel).toBe('normal');
    expect(result.current.stressScore).toBe(0);
  });
});
