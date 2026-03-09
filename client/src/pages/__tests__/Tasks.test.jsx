import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Tasks from '../Tasks';
import { AuthProvider } from '../../contexts/AuthContext';
import { DialogProvider } from '../../contexts/DialogContext';
import { ZenModeProvider } from '../../contexts/ZenModeContext';
import { FacialAnalysisProvider } from '../../contexts/FacialAnalysisContext';
import { KeystrokeProvider } from '../../contexts/KeystrokeContext';
import { StressFusionProvider } from '../../contexts/StressFusionContext';
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

const mockApiGet = vi.fn().mockResolvedValue({
  success: true,
  tasks: { todo: [], in_progress: [], done: [] },
  stats: { total: 0, completed: 0, inProgress: 0, todo: 0 },
});

vi.mock('../../utils/api', () => ({
  apiGet: (...args) => mockApiGet(...args),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
  getErrorMessage: vi.fn((err) => err.message),
}));

describe('Tasks Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue({
      success: true,
      tasks: { todo: [], in_progress: [], done: [] },
      stats: { total: 0, completed: 0, inProgress: 0, todo: 0 },
    });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
  });

  it('should render tasks page', async () => {
    render(<Tasks />, { wrapper });

    await waitFor(() => {
      const toDoText = screen.queryByText(/to do/i);
      const inProgressText = screen.queryByText(/in progress/i);
      const doneText = screen.queryByText(/^done$/i);
      
      expect(toDoText || inProgressText || doneText).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('should display task board', async () => {
    render(<Tasks />, { wrapper });

    await waitFor(() => {
      const toDoText = screen.queryByText(/to do/i);
      const inProgressText = screen.queryByText(/in progress/i);
      const doneText = screen.queryByText(/^done$/i);
      
      expect(toDoText || inProgressText || doneText).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('should show loading state', () => {
    mockApiGet.mockImplementation(() => new Promise(() => {}));

    render(<Tasks />, { wrapper });

    expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
  });
});
