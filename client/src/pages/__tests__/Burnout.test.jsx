import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Burnout from '../Burnout';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { FacialAnalysisProvider } from '../../contexts/FacialAnalysisContext';
import { KeystrokeProvider } from '../../contexts/KeystrokeContext';
import { StressFusionProvider } from '../../contexts/StressFusionContext';
import { ZenModeProvider } from '../../contexts/ZenModeContext';
import { WellnessInterventionProvider } from '../../contexts/WellnessInterventionContext';

const wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <FacialAnalysisProvider>
        <KeystrokeProvider>
          <StressFusionProvider>
            <ZenModeProvider>
              <NotificationProvider>
                <WellnessInterventionProvider>{children}</WellnessInterventionProvider>
              </NotificationProvider>
            </ZenModeProvider>
          </StressFusionProvider>
        </KeystrokeProvider>
      </FacialAnalysisProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Burnout Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url) => {
      if (url === '/api/settings') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            settings: {
              notifications: { email: true, stressAlerts: true },
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    });
  });

  it('should render burnout page', () => {
    render(<Burnout />, { wrapper });

    expect(screen.getAllByText(/feeling burnt out/i).length).toBeGreaterThan(0);
  });

  it('should display burnout information', () => {
    render(<Burnout />, { wrapper });

    expect(screen.getByText(/recognize the signs/i)).toBeInTheDocument();
    expect(screen.getByText(/prevention.*self-care/i)).toBeInTheDocument();
  });

  it('should display symptom categories', () => {
    render(<Burnout />, { wrapper });

    expect(screen.getAllByText(/physical/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/emotional/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/behavioral/i).length).toBeGreaterThan(0);
  });
});
