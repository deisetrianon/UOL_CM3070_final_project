import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailHeader from '../EmailHeader';

describe('EmailHeader', () => {
  const mockLabels = [
    { id: 'INBOX', name: 'Inbox' },
    { id: 'STARRED', name: 'Starred' },
  ];

  const mockProps = {
    activeLabel: 'INBOX',
    labels: mockLabels,
    filteredEmails: [{ id: '1' }, { id: '2' }],
    emails: [{ id: '1' }, { id: '2' }],
    selectedEmailIds: new Set(),
    currentPage: 1,
    nextPageToken: null,
    totalEstimate: 10,
    emailsPerPage: 20,
    loading: false,
    startItem: 1,
    endItem: 2,
    onToggleSelectAll: vi.fn(),
    onBulkMarkAsRead: vi.fn(),
    onBulkToggleStar: vi.fn(),
    onBulkDelete: vi.fn(),
    onRefresh: vi.fn(),
    onFirstPage: vi.fn(),
    onPrevPage: vi.fn(),
    onNextPage: vi.fn(),
  };

  it('should render header with label name', () => {
    render(<EmailHeader {...mockProps} />);

    expect(screen.getByText('Inbox')).toBeInTheDocument();
  });

  it('should show bulk actions when emails are selected', async () => {
    const user = userEvent.setup();
    const props = {
      ...mockProps,
      selectedEmailIds: new Set(['1', '2']),
    };

    render(<EmailHeader {...props} />);

    expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    expect(screen.getByText(/mark as read/i)).toBeInTheDocument();
  });

  it('should show pagination when no emails are selected', () => {
    render(<EmailHeader {...mockProps} />);

    expect(screen.getByText(/1-2 of/i)).toBeInTheDocument();
  });

  it('should call onToggleSelectAll when checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<EmailHeader {...mockProps} />);

    const checkbox = screen.getByLabelText(/select all emails/i);
    await user.click(checkbox);

    expect(mockProps.onToggleSelectAll).toHaveBeenCalled();
  });
});
