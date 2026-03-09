import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../Settings';
import { AuthProvider } from '../../contexts/AuthContext';
import { DialogProvider } from '../../contexts/DialogContext';
import { FacialAnalysisProvider } from '../../contexts/FacialAnalysisContext';
import { KeystrokeProvider } from '../../contexts/KeystrokeContext';
import { StressFusionProvider } from '../../contexts/StressFusionContext';
import { ZenModeProvider } from '../../contexts/ZenModeContext';
import { WellnessInterventionProvider } from '../../contexts/WellnessInterventionContext';

const wrapper = ({ children }) => (
  <BrowserRouter>
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
  </BrowserRouter>
);

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        settings: {
          notifications: { email: true, stressAlerts: true },
          facialAnalysis: { enabled: true, frequency: 5 },
          zenMode: { autoEnabled: true },
        },
      }),
    });
  });

  it('should render settings page', async () => {
    render(<Settings />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByText(/settings/i).length).toBeGreaterThan(0);
    });
  });

  it('should display facial analysis settings', async () => {
    render(<Settings />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByText(/facial analysis/i).length).toBeGreaterThan(0);
    });
  });

  it('should display Zen Mode settings', async () => {
    render(<Settings />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByText(/zen mode/i).length).toBeGreaterThan(0);
    });
  });
});
