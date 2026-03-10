import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../Home';
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

const mockFetchEmails = vi.fn();
const mockFetchFullEmail = vi.fn();
const mockDeleteEmail = vi.fn();
const mockMarkEmailAsRead = vi.fn();
const mockToggleStar = vi.fn();
const mockSendEmail = vi.fn();
const mockReplyToEmail = vi.fn();

vi.mock('../../hooks/useEmailOperations', () => ({
  useEmailOperations: () => ({
    loading: false,
    error: null,
    fetchEmails: mockFetchEmails,
    fetchFullEmail: mockFetchFullEmail,
    deleteEmail: mockDeleteEmail,
    markEmailAsRead: mockMarkEmailAsRead,
    toggleStar: mockToggleStar,
    sendEmail: mockSendEmail,
    replyToEmail: mockReplyToEmail,
    EMAILS_PER_PAGE: 20,
  }),
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    
    mockFetchEmails.mockResolvedValue({
      emails: [],
      nextPageToken: null,
      totalEstimate: 0,
    });
    mockFetchFullEmail.mockResolvedValue(null);
    mockDeleteEmail.mockResolvedValue({ success: true });
    mockMarkEmailAsRead.mockResolvedValue({ success: true });
    mockToggleStar.mockResolvedValue({ isStarred: false, labelIds: [] });
    mockSendEmail.mockResolvedValue({ success: true });
    mockReplyToEmail.mockResolvedValue({ success: true });
    
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
        json: async () => ({ success: false, isAuthenticated: false }),
      });
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should render home page', async () => {
    render(<Home />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/inbox/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    expect(mockFetchEmails).toHaveBeenCalledWith('INBOX', null, '');
  }, 10000);

  it('should display email list or empty state', async () => {
    render(<Home />, { wrapper });

    await waitFor(() => {
      const list = screen.queryByRole('list');
      const emptyState = screen.queryByText(/no emails found/i);
      const loadingState = screen.queryByText(/loading emails/i);
      
      expect(loadingState).not.toBeInTheDocument();
      expect(list || emptyState).toBeTruthy();
    }, { timeout: 5000 });
    
    expect(mockFetchEmails).toHaveBeenCalled();
  }, 10000);
});
