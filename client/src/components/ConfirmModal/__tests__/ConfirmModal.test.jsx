import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from '../index';

describe('ConfirmModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when message is null', () => {
    const { container } = render(
      <ConfirmModal message={null} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render with default props', () => {
    render(
      <ConfirmModal
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmModal
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmModal
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onCancel when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmModal
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    await user.keyboard('{Escape}');

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when overlay is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmModal
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const overlay = screen.getByRole('dialog');
    await user.click(overlay);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should not call onCancel when modal content is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmModal
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const modalContent = screen.getByRole('document');
    await user.click(modalContent);

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should use custom title and button text', () => {
    render(
      <ConfirmModal
        message="Test"
        title="Custom Title"
        confirmText="Yes"
        cancelText="No"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
  });

  it('should focus cancel button when modal opens', async () => {
    render(
      <ConfirmModal
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveFocus();
    });
  });
});
