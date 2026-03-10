import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PomodoroTimer from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DialogProvider } from '../../../contexts/DialogContext';
import { ZenModeProvider } from '../../../contexts/ZenModeContext';
import { FacialAnalysisProvider } from '../../../contexts/FacialAnalysisContext';
import { KeystrokeProvider } from '../../../contexts/KeystrokeContext';
import { StressFusionProvider } from '../../../contexts/StressFusionContext';

const wrapper = ({ children }) => (
  <AuthProvider>
    <DialogProvider>
      <FacialAnalysisProvider>
        <KeystrokeProvider>
          <StressFusionProvider>
            <ZenModeProvider>{children}</ZenModeProvider>
          </StressFusionProvider>
        </KeystrokeProvider>
      </FacialAnalysisProvider>
    </DialogProvider>
  </AuthProvider>
);

describe('PomodoroTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render timer with default state', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PomodoroTimer />, { wrapper });

    const expandButton = screen.getByLabelText(/expand pomodoro timer/i);
    await user.click(expandButton);

    expect(screen.getByText(/25:00/i)).toBeInTheDocument();
  });

  it('should start timer when play button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PomodoroTimer />, { wrapper });

    const expandButton = screen.getByLabelText(/expand pomodoro timer/i);
    await user.click(expandButton);

    const playButton = screen.getByRole('button', { name: /start/i });
    await user.click(playButton);

    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('should pause timer when pause button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PomodoroTimer />, { wrapper });

    const expandButton = screen.getByLabelText(/expand pomodoro timer/i);
    await user.click(expandButton);

    const playButton = screen.getByRole('button', { name: /start/i });
    await user.click(playButton);

    const pauseButton = screen.getByRole('button', { name: /pause/i });
    await user.click(pauseButton);

    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
  });

  it('should reset timer', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PomodoroTimer />, { wrapper });

    const expandButton = screen.getByLabelText(/expand pomodoro timer/i);
    await user.click(expandButton);

    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    expect(screen.getByText(/25:00/i)).toBeInTheDocument();
  });

  it('should expand when timer is active', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PomodoroTimer />, { wrapper });

    const expandButton = screen.getByLabelText(/expand pomodoro timer/i);
    await user.click(expandButton);

    const playButton = screen.getByRole('button', { name: /start/i });
    await user.click(playButton);

    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });
});
