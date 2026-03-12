import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import StressHistoryPage from '../StressHistory';
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

vi.mock('../../components/StressHistory', () => ({
  default: ({ timeRange }) => (
    <div data-testid="stress-history">Time Range: {timeRange} days</div>
  ),
}));

describe('StressHistory Page', () => {
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

  it('should render stress history page', () => {
    render(<StressHistoryPage />, { wrapper });

    expect(screen.getAllByText(/stress history/i).length).toBeGreaterThan(0);
  });

  it('should display time range buttons', () => {
    render(<StressHistoryPage />, { wrapper });

    expect(screen.getByText('1 Day')).toBeInTheDocument();
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
  });

  it('should change time range when button is clicked', async () => {
    const user = userEvent.setup();
    render(<StressHistoryPage />, { wrapper });

    const dayButton = screen.getByText('1 Day');
    await user.click(dayButton);

    expect(screen.getByTestId('stress-history')).toHaveTextContent('Time Range: 1 days');
  });
});
