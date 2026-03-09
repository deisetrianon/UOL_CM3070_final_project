import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ZenModeProvider, useZenMode } from '../ZenModeContext';
import { StressFusionProvider } from '../StressFusionContext';
import { FacialAnalysisProvider } from '../FacialAnalysisContext';
import { KeystrokeProvider } from '../KeystrokeContext';
import { AuthProvider } from '../AuthContext';
import { DialogProvider } from '../DialogContext';

vi.mock('../utils/accessibility', () => ({
  announceZenModeChange: vi.fn(),
}));

const TestComponent = () => {
  const {
    isZenModeActive,
    toggleZenMode,
    enableZenMode,
    disableZenMode,
    showSuggestion,
    suggestionReason,
    dismissSuggestion,
  } = useZenMode();

  return (
    <div>
      <div>Zen Mode: {isZenModeActive ? 'Active' : 'Inactive'}</div>
      {showSuggestion && <div>Suggestion: {suggestionReason}</div>}
      <button onClick={toggleZenMode}>Toggle</button>
      <button onClick={() => enableZenMode('Test reason')}>Enable</button>
      <button onClick={disableZenMode}>Disable</button>
      <button onClick={dismissSuggestion}>Dismiss</button>
    </div>
  );
};

const AllProviders = ({ children }) => (
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

describe('ZenModeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        settings: { zenMode: { autoEnabled: true } },
      }),
    });
  });

  it('should initialize with default state', () => {
    render(
      <AllProviders>
        <TestComponent />
      </AllProviders>
    );

    expect(screen.getByText(/Zen Mode: Inactive/i)).toBeInTheDocument();
  });

  it('should toggle Zen Mode', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <AllProviders>
        <TestComponent />
      </AllProviders>
    );

    const toggleButton = screen.getByText('Toggle');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText(/Zen Mode: Active/i)).toBeInTheDocument();
    });
  });

  it('should enable Zen Mode with reason', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <AllProviders>
        <TestComponent />
      </AllProviders>
    );

    const enableButton = screen.getByText('Enable');
    await user.click(enableButton);

    await waitFor(() => {
      expect(screen.getByText(/Zen Mode: Active/i)).toBeInTheDocument();
    });
  });

  it('should disable Zen Mode', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <AllProviders>
        <TestComponent />
      </AllProviders>
    );

    const enableButton = screen.getByText('Enable');
    await user.click(enableButton);

    await waitFor(() => {
      expect(screen.getByText(/Zen Mode: Active/i)).toBeInTheDocument();
    });

    const disableButton = screen.getByText('Disable');
    await user.click(disableButton);

    await waitFor(() => {
      expect(screen.getByText(/Zen Mode: Inactive/i)).toBeInTheDocument();
    });
  });
});
