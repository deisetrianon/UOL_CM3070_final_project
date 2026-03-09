import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailPagination from '../EmailPagination';

describe('EmailPagination', () => {
  const mockProps = {
    currentPage: 1,
    nextPageToken: 'token',
    pageTokenHistory: [],
    totalEstimate: 100,
    emailsPerPage: 20,
    filteredEmails: Array(20).fill({ id: '1' }),
    onNextPage: vi.fn(),
    onPrevPage: vi.fn(),
    onFirstPage: vi.fn(),
  };

  it('should render pagination controls', () => {
    render(<EmailPagination {...mockProps} />);

    expect(screen.getByText(/page 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/go to next page/i)).toBeInTheDocument();
  });

  it('should display page information', () => {
    render(<EmailPagination {...mockProps} />);

    expect(screen.getByText(/showing 1-20/i)).toBeInTheDocument();
  });

  it('should call onNextPage when next button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmailPagination {...mockProps} />);

    const nextButton = screen.getByLabelText(/go to next page/i);
    await user.click(nextButton);

    expect(mockProps.onNextPage).toHaveBeenCalled();
  });

  it('should disable previous button on first page', () => {
    render(<EmailPagination {...mockProps} />);

    const prevButton = screen.getByLabelText(/go to previous page/i);
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button when no next page token', () => {
    const props = {
      ...mockProps,
      nextPageToken: null,
    };

    render(<EmailPagination {...props} />);

    const nextButton = screen.getByLabelText(/go to next page/i);
    expect(nextButton).toBeDisabled();
  });
});
