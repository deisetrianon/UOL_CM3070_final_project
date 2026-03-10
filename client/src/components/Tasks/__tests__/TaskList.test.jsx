import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../TaskList';

describe('TaskList', () => {
  const mockTasks = {
    todo: [
      { id: '1', title: 'Task 1', status: 'todo' },
      { id: '2', title: 'Task 2', status: 'todo' },
    ],
    in_progress: [{ id: '3', title: 'Task 3', status: 'in_progress' }],
    done: [],
  };

  const mockOnEdit = vi.fn();

  it('should render task list', () => {
    render(<TaskList tasks={mockTasks} onEdit={mockOnEdit} />);

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('should call onEdit when task is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskList tasks={mockTasks} onEdit={mockOnEdit} />);

    const task = screen.getByText('Task 1').closest('[role="button"]');
    await user.click(task);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTasks.todo[0]);
  });

  it('should not render empty columns', () => {
    const emptyTasks = {
      todo: [],
      in_progress: [],
      done: [],
    };

    render(<TaskList tasks={emptyTasks} onEdit={mockOnEdit} />);

    expect(screen.queryByText('To Do')).not.toBeInTheDocument();
  });
});
