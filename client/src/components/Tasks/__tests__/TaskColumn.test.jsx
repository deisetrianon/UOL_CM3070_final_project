import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskColumn from '../TaskColumn';

vi.mock('../TaskCard', () => {
  const React = require('react');
  const MockTaskCard = React.forwardRef(({ task, onEdit, columnId, onStartPomodoro, isDragging, ...dragProps }, ref) => {
    return (
      <div 
        data-testid={`task-${task.id}`} 
        onClick={() => onEdit(task)} 
        ref={ref}
        {...dragProps}
      >
        {task.title}
      </div>
    );
  });
  MockTaskCard.displayName = 'TaskCard';
  return {
    default: MockTaskCard,
  };
});

vi.mock('@hello-pangea/dnd', () => ({
  Droppable: ({ children }) => children({ innerRef: vi.fn(), droppableProps: {} }, {}),
  Draggable: ({ children, draggableId }) =>
    children(
      { innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} },
      { isDragging: false }
    ),
}));

describe('TaskColumn', () => {
  const mockColumn = {
    id: 'todo',
    title: 'To Do',
    icon: '📋',
    headerBg: '#f3f4f6',
  };

  const mockTasks = [
    { id: '1', title: 'Task 1', status: 'todo' },
    { id: '2', title: 'Task 2', status: 'todo' },
  ];

  const mockProps = {
    column: mockColumn,
    tasks: mockTasks,
    allTasks: mockTasks,
    isZenModeActive: false,
    onEdit: vi.fn(),
    onAddTask: vi.fn(),
    onStartPomodoro: vi.fn(),
  };

  it('should render column with title', () => {
    render(<TaskColumn {...mockProps} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('should render tasks in column', () => {
    render(<TaskColumn {...mockProps} />);

    expect(screen.getByTestId('task-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-2')).toBeInTheDocument();
  });

  it('should show task count', () => {
    render(<TaskColumn {...mockProps} />);

    const countPills = screen.getAllByText('2');
    const countPill = countPills.find(el => el.classList.contains('task-count-pill'));
    expect(countPill).toHaveTextContent('2');
  });
});
