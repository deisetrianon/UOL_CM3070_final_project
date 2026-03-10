import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MeetingReminderNotification from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DialogProvider } from '../../../contexts/DialogContext';
import { ZenModeProvider } from '../../../contexts/ZenModeContext';
import { WellnessInterventionProvider } from '../../../contexts/WellnessInterventionContext';
import { FacialAnalysisProvider } from '../../../contexts/FacialAnalysisContext';
import { KeystrokeProvider } from '../../../contexts/KeystrokeContext';
import { StressFusionProvider } from '../../../contexts/StressFusionContext';

const mockUseZenMode = vi.fn(() => ({
  isZenModeActive: false,
}));

vi.mock('../../../contexts/ZenModeContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useZenMode: () => mockUseZenMode(),
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

describe('MeetingReminderNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseZenMode.mockReturnValue({
      isZenModeActive: false,
    });
    global.fetch = vi.fn((url) => {
      if (url === '/api/auth/user') {
        return Promise.resolve({
          json: async () => ({
            success: true,
            isAuthenticated: true,
            user: { id: '1', email: 'test@example.com' },
          }),
        });
      }
      if (url.includes('/api/calendar/combined')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            events: [],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: false }),
      });
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when no meeting', () => {
    const { container } = render(<MeetingReminderNotification />, { wrapper });

    expect(container.firstChild).toBeNull();
  });

  it('should render when meeting is upcoming', async () => {
    vi.useRealTimers();

    mockUseZenMode.mockReturnValue({
      isZenModeActive: true,
    });

    const futureDate = new Date(Date.now() + 5 * 60 * 1000);
    
    global.fetch = vi.fn((url) => {
      if (url === '/api/auth/user') {
        return Promise.resolve({
          json: async () => ({
            success: true,
            isAuthenticated: true,
            user: { id: '1', email: 'test@example.com' },
          }),
        });
      }
      if (url.includes('/api/calendar/combined')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            events: [
              {
                id: 'meeting-1',
                title: 'Team Meeting',
                start: futureDate.toISOString(),
                isGoogleMeet: true,
              },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: false }),
      });
    });

    render(<MeetingReminderNotification />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/team meeting/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
