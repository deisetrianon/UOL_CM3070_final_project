import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskCard from '../TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    priority: 'high',
    isUrgent: false,
    deadline: '2024-12-31',
  };

  const mockOnEdit = vi.fn();
  const mockOnStartPomodoro = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render task information', () => {
    render(
      <TaskCard
        task={mockTask}
        columnId="todo"
        onEdit={mockOnEdit}
        onStartPomodoro={mockOnStartPomodoro}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should call onEdit when clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskCard
        task={mockTask}
        columnId="todo"
        onEdit={mockOnEdit}
        onStartPomodoro={mockOnStartPomodoro}
      />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('should show urgent badge for urgent tasks', () => {
    const urgentTask = { ...mockTask, isUrgent: true };
    render(
      <TaskCard
        task={urgentTask}
        columnId="in_progress"
        onEdit={mockOnEdit}
        onStartPomodoro={mockOnStartPomodoro}
      />
    );

    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('should show Pomodoro button for urgent tasks in progress', async () => {
    const user = userEvent.setup();
    const urgentTask = { ...mockTask, isUrgent: true };
    render(
      <TaskCard
        task={urgentTask}
        columnId="in_progress"
        onEdit={mockOnEdit}
        onStartPomodoro={mockOnStartPomodoro}
      />
    );

    const pomodoroButton = screen.getByText('Start Pomodoro');
    await user.click(pomodoroButton);

    expect(mockOnStartPomodoro).toHaveBeenCalled();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    render(
      <TaskCard
        task={mockTask}
        columnId="todo"
        onEdit={mockOnEdit}
        onStartPomodoro={mockOnStartPomodoro}
      />
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(mockOnEdit).toHaveBeenCalled();
  });
});
