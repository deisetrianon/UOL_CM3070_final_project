import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DialogProvider } from '../../../contexts/DialogContext';
import { FacialAnalysisProvider } from '../../../contexts/FacialAnalysisContext';
import { KeystrokeProvider } from '../../../contexts/KeystrokeContext';
import { StressFusionProvider } from '../../../contexts/StressFusionContext';
import { ZenModeProvider } from '../../../contexts/ZenModeContext';

const mockUseFacialAnalysis = vi.fn();
const mockUseStressFusion = vi.fn();

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

const wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <DialogProvider>
        <FacialAnalysisProvider>
          <KeystrokeProvider>
            <StressFusionProvider>
              <ZenModeProvider>
                {children}
              </ZenModeProvider>
            </StressFusionProvider>
          </KeystrokeProvider>
        </FacialAnalysisProvider>
      </DialogProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    
    mockUseFacialAnalysis.mockReturnValue({
      isAnalyzing: false,
      lastAnalysisTime: null,
      cameraPermission: 'prompt',
    });
    
    mockUseStressFusion.mockReturnValue({
      stressLevel: 'normal',
    });
  });

  it('should render navbar with logo', () => {
    render(<Navbar />, { wrapper });

    expect(screen.getByText(/ZenFlow/i)).toBeInTheDocument();
  });

  it('should display stress level indicator', () => {
    mockUseFacialAnalysis.mockReturnValue({
      isAnalyzing: false,
      lastAnalysisTime: null,
      cameraPermission: 'granted',
    });
    
    mockUseStressFusion.mockReturnValue({
      stressLevel: 'high',
    });

    render(<Navbar />, { wrapper });

    expect(screen.getByText(/high stress/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Current stress level: High stress');
  });

  it('should have proper ARIA labels', () => {
    render(<Navbar />, { wrapper });

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });
});
