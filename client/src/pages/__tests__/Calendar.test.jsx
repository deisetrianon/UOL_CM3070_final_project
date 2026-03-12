import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CalendarPage from '../Calendar';
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

vi.mock('../../utils/api', () => ({
  apiGet: vi.fn().mockResolvedValue({
    success: true,
    events: [],
    calendarEventsCount: 0,
    taskEventsCount: 0,
  }),
}));

describe('Calendar Page', () => {
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

  it('should render calendar page', async () => {
    render(<CalendarPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByText(/calendar/i).length).toBeGreaterThan(0);
    });
  });

  it('should display view buttons', async () => {
    render(<CalendarPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
    });
  });

  it('should display filter buttons', async () => {
    render(<CalendarPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Meetings')).toBeInTheDocument();
      expect(screen.getAllByText('Tasks').length).toBeGreaterThan(0);
    });
  });
});
