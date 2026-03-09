import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WellnessPanel from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DialogProvider } from '../../../contexts/DialogContext';
import { FacialAnalysisProvider } from '../../../contexts/FacialAnalysisContext';
import { KeystrokeProvider } from '../../../contexts/KeystrokeContext';
import { StressFusionProvider } from '../../../contexts/StressFusionContext';
import { WellnessInterventionProvider } from '../../../contexts/WellnessInterventionContext';
import { ZenModeProvider } from '../../../contexts/ZenModeContext';

const mockUseFacialAnalysis = vi.fn();
const mockUseStressFusion = vi.fn();
const mockUseWellnessIntervention = vi.fn();

vi.mock('../../../contexts/FacialAnalysisContext', async () => {
  const actual = await vi.importActual('../../../contexts/FacialAnalysisContext');
  return {
    ...actual,
    useFacialAnalysis: () => mockUseFacialAnalysis(),
  };
});

vi.mock('../../../contexts/StressFusionContext', async () => {
  const actual = await vi.importActual('../../../contexts/StressFusionContext');
  return {
    ...actual,
    useStressFusion: () => mockUseStressFusion(),
  };
});

vi.mock('../../../contexts/WellnessInterventionContext', async () => {
  const actual = await vi.importActual('../../../contexts/WellnessInterventionContext');
  return {
    ...actual,
    useWellnessIntervention: () => mockUseWellnessIntervention(),
  };
});

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

describe('WellnessPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    
    mockUseFacialAnalysis.mockReturnValue({
      isAnalyzing: false,
      cameraPermission: 'prompt',
      lastAnalysisTime: null,
    });
    
    mockUseStressFusion.mockReturnValue({
      stressLevel: 'normal',
      stressScore: 0,
    });
    
    mockUseWellnessIntervention.mockReturnValue({
      openBreathing: vi.fn(),
      openMindfulness: vi.fn(),
      openStretching: vi.fn(),
      openAnxietyRelief: vi.fn(),
      openMentalHealth: vi.fn(),
    });
  });

  it('should render wellness panel', () => {
    render(<WellnessPanel />, { wrapper });

    expect(screen.getByLabelText(/wellness panel/i)).toBeInTheDocument();
  });

  it('should display stress level', () => {
    mockUseFacialAnalysis.mockReturnValue({
      isAnalyzing: false,
      cameraPermission: 'granted',
      lastAnalysisTime: new Date(),
    });
    
    mockUseStressFusion.mockReturnValue({
      stressLevel: 'high',
      stressScore: 75,
    });

    render(<WellnessPanel />, { wrapper });

    expect(screen.getByText(/high stress/i)).toBeInTheDocument();
    expect(screen.getByText(/75%/i)).toBeInTheDocument();
    expect(screen.getByText(/take a break and use the wellness tools to relax/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Current stress status: High Stress, 75%');
  });

  it('should show wellness intervention buttons', () => {
    render(<WellnessPanel />, { wrapper });

    expect(screen.getByText(/breathing/i)).toBeInTheDocument();
    expect(screen.getByText(/mindfulness/i)).toBeInTheDocument();
  });
});
