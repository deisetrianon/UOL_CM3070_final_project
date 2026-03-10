import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailItem from '../EmailItem';

describe('EmailItem', () => {
  const mockEmail = {
    id: 'email-1',
    from: { name: 'John Doe', email: 'john@example.com' },
    subject: 'Test Subject',
    snippet: 'Test snippet',
    date: '2024-01-15T10:00:00Z',
    isUnread: true,
    isStarred: false,
  };

  const mockOnSelect = vi.fn();
  const mockOnClick = vi.fn();
  const mockOnToggleStar = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email information', () => {
    render(
      <EmailItem
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        onToggleStar={mockOnToggleStar}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Subject')).toBeInTheDocument();
    expect(screen.getByText('Test snippet')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    render(
      <EmailItem
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        onToggleStar={mockOnToggleStar}
        onDelete={mockOnDelete}
      />
    );

    const emailItem = screen.getByRole('button', { name: /email from john doe/i });
    await user.click(emailItem);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it('should call onToggleStar when star button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EmailItem
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        onToggleStar={mockOnToggleStar}
        onDelete={mockOnDelete}
      />
    );

    const starButton = screen.getByTitle('Add star');
    await user.click(starButton);

    expect(mockOnToggleStar).toHaveBeenCalled();
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EmailItem
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        onToggleStar={mockOnToggleStar}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTitle('Delete email');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('email-1');
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should show starred icon when email is starred', () => {
    const starredEmail = { ...mockEmail, isStarred: true };
    render(
      <EmailItem
        email={starredEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        onToggleStar={mockOnToggleStar}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByTitle('Remove star')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    render(
      <EmailItem
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        onToggleStar={mockOnToggleStar}
        onDelete={mockOnDelete}
      />
    );

    const emailItem = screen.getByRole('button', { name: /email from john doe/i });
    emailItem.focus();
    await user.keyboard('{Enter}');

    expect(mockOnClick).toHaveBeenCalled();
  });
});
