import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailView from '../EmailView';

describe('EmailView', () => {
  const mockEmail = {
    id: 'email-1',
    subject: 'Test Subject',
    from: { name: 'John Doe', email: 'john@example.com' },
    date: '2024-01-15T10:00:00Z',
    isStarred: false,
    isImportant: false,
  };

  const mockLabels = [
    { id: 'INBOX', name: 'Inbox' },
    { id: 'STARRED', name: 'Starred' },
  ];

  const mockProps = {
    email: mockEmail,
    fullEmailContent: '<p>Email body</p>',
    loadingEmail: false,
    activeLabel: 'INBOX',
    labels: mockLabels,
    onBack: vi.fn(),
    onReply: vi.fn(),
    onReplyAll: vi.fn(),
    onToggleStar: vi.fn(),
    onMarkAsRead: vi.fn(),
    onDelete: vi.fn(),
  };

  it('should render email view', () => {
    render(<EmailView {...mockProps} />);

    expect(screen.getByText('Test Subject')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmailView {...mockProps} />);

    const backButton = screen.getByText(/back to inbox/i);
    await user.click(backButton);

    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('should call onReply when reply button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmailView {...mockProps} />);

    const replyButton = screen.getByLabelText(/reply to email/i);
    await user.click(replyButton);

    expect(mockProps.onReply).toHaveBeenCalled();
  });

  it('should call onToggleStar when star button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmailView {...mockProps} />);

    const starButton = screen.getByLabelText(/add star/i);
    await user.click(starButton);

    expect(mockProps.onToggleStar).toHaveBeenCalledWith('email-1', false);
  });

  it('should show loading state', () => {
    render(<EmailView {...mockProps} loadingEmail={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
