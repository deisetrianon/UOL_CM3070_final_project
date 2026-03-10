import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskModal from '../TaskModal';
import { DialogProvider } from '../../../contexts/DialogContext';
import { AuthProvider } from '../../../contexts/AuthContext';

const wrapper = ({ children }) => (
  <AuthProvider>
    <DialogProvider>{children}</DialogProvider>
  </AuthProvider>
);

describe('TaskModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
  });

  it('should render modal for new task', () => {
    render(<TaskModal onClose={mockOnClose} onSave={mockOnSave} />, { wrapper });

    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it('should render modal for editing task', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      description: 'Test description',
      priority: 'high',
      isUrgent: true,
      deadline: '2024-12-31',
    };

    render(
      <TaskModal task={task} onClose={mockOnClose} onSave={mockOnSave} />,
      { wrapper }
    );

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<TaskModal onClose={mockOnClose} onSave={mockOnSave} />, { wrapper });

    const submitButton = screen.getByRole('button', { name: /create new task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  it('should call onSave when form is submitted', async () => {
    const user = userEvent.setup();
    render(<TaskModal onClose={mockOnClose} onSave={mockOnSave} />, { wrapper });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'New Task');

    const submitButton = screen.getByRole('button', { name: /create new task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskModal onClose={mockOnClose} onSave={mockOnSave} />, { wrapper });

    const closeButton = screen.getByLabelText(/close task modal/i);
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
