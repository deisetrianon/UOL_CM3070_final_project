import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ZenModeSuggestion from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DialogProvider } from '../../../contexts/DialogContext';

const mockUseZenMode = vi.fn();

vi.mock('../../../contexts/ZenModeContext', async () => {
  const actual = await vi.importActual('../../../contexts/ZenModeContext');
  return {
    ...actual,
    useZenMode: () => mockUseZenMode(),
  };
});

const wrapper = ({ children }) => (
  <AuthProvider>
    <DialogProvider>{children}</DialogProvider>
  </AuthProvider>
);

describe('ZenModeSuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    vi.useFakeTimers();
    mockUseZenMode.mockReturnValue({
      showSuggestion: false,
      suggestionReason: '',
      enableZenMode: vi.fn(),
      dismissSuggestion: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when suggestion is not shown', () => {
    const { container } = render(<ZenModeSuggestion />, { wrapper });

    expect(container.firstChild).toBeNull();
  });

  it('should render suggestion when shown', async () => {
    mockUseZenMode.mockReturnValue({
      showSuggestion: true,
      suggestionReason: 'Test reason',
      enableZenMode: vi.fn(),
      dismissSuggestion: vi.fn(),
    });

    render(<ZenModeSuggestion />, { wrapper });

    await vi.advanceTimersByTime(200);

    expect(screen.getByText(/feeling tired/i)).toBeInTheDocument();
  });

  it('should call enableZenMode when enable button is clicked', async () => {
    const mockEnableZenMode = vi.fn();
    mockUseZenMode.mockReturnValue({
      showSuggestion: true,
      suggestionReason: 'Test',
      enableZenMode: mockEnableZenMode,
      dismissSuggestion: vi.fn(),
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ZenModeSuggestion />, { wrapper });

    await vi.advanceTimersByTime(500);

    const enableButton = screen.getByRole('button', { name: /enable zen mode/i });
    enableButton.click();

    expect(mockEnableZenMode).toHaveBeenCalled();
  });
});
