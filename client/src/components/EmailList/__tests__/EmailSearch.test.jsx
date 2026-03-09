import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailSearch from '../EmailSearch';

describe('EmailSearch', () => {
  const mockProps = {
    searchQuery: '',
    activeSearch: '',
    onSearchChange: vi.fn(),
    onSearch: vi.fn(),
    onClearSearch: vi.fn(),
    onSearchKeyDown: vi.fn(),
  };

  it('should render search input', () => {
    render(<EmailSearch {...mockProps} />);

    expect(screen.getByPlaceholderText(/search emails/i)).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('should call onSearchChange when input changes', async () => {
    const user = userEvent.setup();
    render(<EmailSearch {...mockProps} />);

    const input = screen.getByPlaceholderText(/search emails/i);
    await user.type(input, 'test');

    expect(mockProps.onSearchChange).toHaveBeenCalled();
  });

  it('should call onSearch when search button is clicked', async () => {
    const user = userEvent.setup();
    const props = {
      ...mockProps,
      searchQuery: 'test',
    };

    render(<EmailSearch {...props} />);

    const searchButton = screen.getByRole('button', { name: /^search emails$/i });
    await user.click(searchButton);

    expect(mockProps.onSearch).toHaveBeenCalled();
  });

  it('should call onSearchKeyDown when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<EmailSearch {...mockProps} />);

    const input = screen.getByPlaceholderText(/search emails/i);
    await user.type(input, 'test{Enter}');

    expect(mockProps.onSearchKeyDown).toHaveBeenCalled();
  });

  it('should show clear button when search query exists', () => {
    const props = {
      ...mockProps,
      searchQuery: 'test',
    };

    render(<EmailSearch {...props} />);

    expect(screen.getByLabelText(/clear search query/i)).toBeInTheDocument();
  });
});
