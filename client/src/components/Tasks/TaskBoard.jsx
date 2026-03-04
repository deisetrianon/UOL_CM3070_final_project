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
