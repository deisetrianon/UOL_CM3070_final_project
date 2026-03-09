import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailWriter from '../index';
import { DialogProvider } from '../../../contexts/DialogContext';
import { AuthProvider } from '../../../contexts/AuthContext';

const wrapper = ({ children }) => (
  <AuthProvider>
    <DialogProvider>{children}</DialogProvider>
  </AuthProvider>
);

describe('EmailWriter', () => {
  const mockOnClose = vi.fn();
  const mockOnSend = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
  });

  it('should render email writer', () => {
    render(<EmailWriter onClose={mockOnClose} onSend={mockOnSend} />, { wrapper });

    expect(screen.getByText('Write Email')).toBeInTheDocument();
    expect(screen.getByLabelText(/^to/i)).toBeInTheDocument();
  });

  it('should render reply mode', () => {
    render(
      <EmailWriter
        onClose={mockOnClose}
        onSend={mockOnSend}
        isReply={true}
        initialTo="test@example.com"
        initialSubject="Re: Test"
      />,
      { wrapper }
    );

    expect(screen.getByText('Reply')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('should validate email fields', async () => {
    const user = userEvent.setup();
    render(<EmailWriter onClose={mockOnClose} onSend={mockOnSend} />, { wrapper });

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  it('should call onSend when form is valid', async () => {
    const user = userEvent.setup();
    render(<EmailWriter onClose={mockOnClose} onSend={mockOnSend} />, { wrapper });

    const toInput = screen.getByLabelText(/^to/i);
    await user.type(toInput, 'test@example.com');

    const subjectInput = screen.getByLabelText(/subject/i);
    await user.type(subjectInput, 'Test Subject');

    const bodyInput = screen.getByLabelText(/body/i);
    await user.type(bodyInput, 'Test body content');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalled();
    });
  });

  it('should toggle CC/BCC fields', async () => {
    const user = userEvent.setup();
    render(<EmailWriter onClose={mockOnClose} onSend={mockOnSend} />, { wrapper });

    const toggleButton = screen.getByText(/cc.*bcc/i);
    await user.click(toggleButton);

    const ccFields = screen.getAllByLabelText(/cc/i);
    const bccFields = screen.getAllByLabelText(/bcc/i);
    expect(ccFields.length).toBeGreaterThan(0);
    expect(bccFields.length).toBeGreaterThan(0);
  });
});
