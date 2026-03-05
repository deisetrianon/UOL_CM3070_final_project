/**
 * Task Board component.
 * Kanban-style board view with drag-and-drop functionality for task management.
 * Displays tasks in columns (To Do, In Progress, Done) with drag-and-drop reordering.
 * 
 * @module components/Tasks/TaskBoard
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.tasks - Tasks organized by status (todo, in_progress, done)
 * @param {boolean} props.isZenModeActive - Whether Zen Mode is active
 * @param {Array} props.allTasks - All tasks for Zen Mode filtering
 * @param {Function} props.onDragEnd - Callback when drag operation ends
 * @param {Function} props.onEdit - Callback when task is edited
 * @param {Function} props.onAddTask - Callback when new task is added
 * @param {Function} props.onStartPomodoro - Callback when Pomodoro timer is started
 * @returns {JSX.Element} Task Board component
 */

import { DragDropContext } from '@hello-pangea/dnd';
import TaskColumn from './TaskColumn';
import './Tasks.css';

const COLUMNS = {
  todo: { id: 'todo', title: 'To Do', icon: '📋', headerBg: '#f3f4f6' },
  in_progress: { id: 'in_progress', title: 'In Progress', icon: null, headerBg: '#dbeafe' },
  done: { id: 'done', title: 'Done', icon: '✅', headerBg: '#d1fae5' }
};

function TaskBoard({ tasks, isZenModeActive, allTasks, onDragEnd, onEdit, onAddTask, onStartPomodoro }) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="task-board">
        {Object.values(COLUMNS).map((column) => (
          <TaskColumn
            key={column.id}
            column={column}
            tasks={tasks[column.id]}
            isZenModeActive={isZenModeActive}
            allTasks={allTasks[column.id]}
            onEdit={onEdit}
            onAddTask={onAddTask}
            onStartPomodoro={onStartPomodoro}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

export default TaskBoard;
