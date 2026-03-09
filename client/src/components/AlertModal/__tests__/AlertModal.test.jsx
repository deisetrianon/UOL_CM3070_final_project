import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AlertModal from '../index';

describe('AlertModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when message is null', () => {
    const { container } = render(<AlertModal message={null} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render with info type by default', () => {
    render(<AlertModal message="Test message" onClose={mockOnClose} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should render with success type', () => {
    render(<AlertModal message="Success!" type="success" onClose={mockOnClose} />);
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should render with error type', () => {
    render(<AlertModal message="Error occurred" type="error" onClose={mockOnClose} />);
    
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render with warning type', () => {
    render(<AlertModal message="Warning message" type="warning" onClose={mockOnClose} />);
    
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('should call onClose when OK button is clicked', async () => {
    const user = userEvent.setup();
    render(<AlertModal message="Test" onClose={mockOnClose} />);
    
    const okButton = screen.getByRole('button', { name: /close alert/i });
    await user.click(okButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    render(<AlertModal message="Test" onClose={mockOnClose} />);
    
    const overlay = screen.getByRole('dialog');
    await user.click(overlay);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup();
    render(<AlertModal message="Test" onClose={mockOnClose} />);
    
    const modalContent = screen.getByRole('document');
    await user.click(modalContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<AlertModal message="Test" onClose={mockOnClose} />);
    
    await user.keyboard('{Escape}');
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should focus OK button when modal opens', async () => {
    render(<AlertModal message="Test" onClose={mockOnClose} />);
    
    await waitFor(() => {
      const okButton = screen.getByRole('button', { name: /close alert/i });
      expect(okButton).toHaveFocus();
    });
  });

  it('should have correct ARIA attributes', () => {
    render(<AlertModal message="Test message" onClose={mockOnClose} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'alert-modal-title');
  });
});
