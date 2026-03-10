import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmailList from '../index';

vi.mock('../EmailItem', () => ({
  default: ({ email, onClick }) => (
    <li onClick={onClick} data-testid={`email-${email.id}`}>
      {email.subject}
    </li>
  ),
}));

describe('EmailList', () => {
  const mockEmails = [
    { id: '1', subject: 'Test Email 1', from: { email: 'test1@example.com' } },
    { id: '2', subject: 'Test Email 2', from: { email: 'test2@example.com' } },
  ];

  const mockProps = {
    filteredEmails: mockEmails,
    emails: mockEmails,
    loading: false,
    error: null,
    selectedEmailIds: new Set(),
    activeLabel: 'INBOX',
    labels: [],
    currentPage: 1,
    nextPageToken: null,
    pageTokenHistory: [],
    totalEstimate: 2,
    emailsPerPage: 20,
    startItem: 1,
    endItem: 2,
    onToggleSelectAll: vi.fn(),
    onSelectEmail: vi.fn(),
    onEmailClick: vi.fn(),
    onToggleStar: vi.fn(),
    onDelete: vi.fn(),
    onBulkMarkAsRead: vi.fn(),
    onBulkToggleStar: vi.fn(),
    onBulkDelete: vi.fn(),
    onRefresh: vi.fn(),
    onNextPage: vi.fn(),
    onPrevPage: vi.fn(),
    onFirstPage: vi.fn(),
  };

  it('should render email list', () => {
    render(<EmailList {...mockProps} />);

    expect(screen.getByText('Test Email 1')).toBeInTheDocument();
    expect(screen.getByText('Test Email 2')).toBeInTheDocument();
  });

  it('should render empty state when no emails', () => {
    render(<EmailList {...mockProps} filteredEmails={[]} emails={[]} />);

    expect(screen.getByText(/no emails/i)).toBeInTheDocument();
  });
});
