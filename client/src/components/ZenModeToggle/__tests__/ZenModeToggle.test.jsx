import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ZenModeToggle from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DialogProvider } from '../../../contexts/DialogContext';
import { FacialAnalysisProvider } from '../../../contexts/FacialAnalysisContext';
import { KeystrokeProvider } from '../../../contexts/KeystrokeContext';
import { StressFusionProvider } from '../../../contexts/StressFusionContext';
import { ZenModeProvider } from '../../../contexts/ZenModeContext';

const mockZenModeState = {
  isZenModeActive: false,
  autoTriggeredReason: null,
  autoZenModeEnabled: false,
  isManuallyToggled: false,
  toggleZenMode: vi.fn(),
};

let renderCallback = null;

vi.mock('../../../contexts/ZenModeContext', async () => {
  const actual = await vi.importActual('../../../contexts/ZenModeContext');
  return {
    ...actual,
    useZenMode: () => {
      const result = {
        ...mockZenModeState,
        toggleZenMode: () => {
          mockZenModeState.isZenModeActive = !mockZenModeState.isZenModeActive;
          mockZenModeState.isManuallyToggled = mockZenModeState.isZenModeActive;
          mockZenModeState.autoTriggeredReason = null;
          mockZenModeState.toggleZenMode();
          if (renderCallback) {
            renderCallback();
          }
        },
      };
      return result;
    },
  };
});

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

describe('ZenModeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderCallback = null;
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    
    Object.assign(mockZenModeState, {
      isZenModeActive: false,
      autoTriggeredReason: null,
      autoZenModeEnabled: false,
      isManuallyToggled: false,
      toggleZenMode: vi.fn(),
    });
  });

  it('should render toggle button', () => {
    render(<ZenModeToggle />, { wrapper });

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('should toggle Zen Mode when clicked', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ZenModeToggle />, { wrapper });

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    renderCallback = () => rerender(<ZenModeToggle />, { wrapper });
    
    await user.click(toggle);
    
    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('should show status message when toggled', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ZenModeToggle />, { wrapper });

    const toggle = screen.getByRole('switch');
    
    renderCallback = () => rerender(<ZenModeToggle />, { wrapper });
    
    await user.click(toggle);
    
    await waitFor(() => {
      expect(screen.getByText(/Zen Mode enabled manually/i)).toBeInTheDocument();
    });
  });

  it('should show AUTO badge when auto mode is enabled', () => {
    Object.assign(mockZenModeState, {
      isZenModeActive: false,
      autoTriggeredReason: null,
      autoZenModeEnabled: true,
      isManuallyToggled: false,
    });

    render(<ZenModeToggle />, { wrapper });

    const autoBadge = screen.getByText('AUTO');
    expect(autoBadge).toBeInTheDocument();
    expect(autoBadge).toHaveClass('zen-auto-badge', 'available-auto');
  });

  it('should show active AUTO badge when Zen Mode is auto-triggered', () => {
    Object.assign(mockZenModeState, {
      isZenModeActive: true,
      autoTriggeredReason: 'High stress detected',
      autoZenModeEnabled: true,
      isManuallyToggled: false,
    });

    render(<ZenModeToggle />, { wrapper });

    const autoBadge = screen.getByText('AUTO');
    expect(autoBadge).toBeInTheDocument();
    expect(autoBadge).toHaveClass('zen-auto-badge', 'active-auto');
  });

  it('should not show AUTO badge when auto mode is disabled', () => {
    Object.assign(mockZenModeState, {
      isZenModeActive: false,
      autoTriggeredReason: null,
      autoZenModeEnabled: false,
      isManuallyToggled: false,
    });

    render(<ZenModeToggle />, { wrapper });

    const autoBadge = screen.queryByText('AUTO');
    expect(autoBadge).not.toBeInTheDocument();
  });
});
