import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskBoard from '../TaskBoard';

vi.mock('../TaskColumn', () => ({
  default: ({ column, tasks }) => (
    <div data-testid={`column-${column.id}`}>
      <h3>{column.title}</h3>
      <div>{tasks.length} tasks</div>
    </div>
  ),
}));

describe('TaskBoard', () => {
  const mockTasks = {
    todo: [{ id: '1', title: 'Task 1' }],
    in_progress: [{ id: '2', title: 'Task 2' }],
    done: [],
  };

  const mockProps = {
    tasks: mockTasks,
    allTasks: mockTasks,
    isZenModeActive: false,
    onDragEnd: vi.fn(),
    onEdit: vi.fn(),
    onAddTask: vi.fn(),
    onStartPomodoro: vi.fn(),
  };

  it('should render task board with columns', () => {
    render(<TaskBoard {...mockProps} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('should render tasks in columns', () => {
    render(<TaskBoard {...mockProps} />);

    expect(screen.getByTestId('column-todo')).toBeInTheDocument();
    expect(screen.getByTestId('column-in_progress')).toBeInTheDocument();
    expect(screen.getByTestId('column-done')).toBeInTheDocument();
  });
});
