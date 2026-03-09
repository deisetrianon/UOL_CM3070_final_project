import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Sidebar from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DialogProvider } from '../../../contexts/DialogContext';
import { ZenModeProvider } from '../../../contexts/ZenModeContext';
import { FacialAnalysisProvider } from '../../../contexts/FacialAnalysisContext';
import { KeystrokeProvider } from '../../../contexts/KeystrokeContext';
import { StressFusionProvider } from '../../../contexts/StressFusionContext';

const wrapper = ({ children }) => (
  <MemoryRouter>
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
  </MemoryRouter>
);

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
  });

  it('should render sidebar navigation', () => {
    render(<Sidebar />, { wrapper });

    expect(screen.getByLabelText(/main navigation/i)).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<Sidebar />, { wrapper });

    expect(screen.getByLabelText(/go to inbox/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/go to tasks/i)).toBeInTheDocument();
  });

  it('should toggle email section', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<Sidebar />, { wrapper });

    const emailSection = screen.getByLabelText(/email menu/i);
    await user.click(emailSection);

    expect(emailSection).toHaveAttribute('aria-expanded');
  });
});
