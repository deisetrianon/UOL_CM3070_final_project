import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import './Tasks.css';

function TaskColumn({ column, tasks, isZenModeActive, allTasks, onEdit, onAddTask, onStartPomodoro }) {
  return (
    <div className="task-column" data-column={column.id}>
      <div className="column-header" style={{ backgroundColor: column.headerBg }}>
        <h2>{column.title}</h2>
        <span className="task-count-pill">{tasks?.length || 0}</span>
      </div>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
          >
            <button 
              className="add-task-in-column-btn"
              onClick={() => onAddTask(column.id)}
              aria-label={`Add new task to ${column.title} column`}
            >
              Add task
            </button>
            {tasks?.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <TaskCard
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    task={task}
                    columnId={column.id}
                    onEdit={onEdit}
                    onStartPomodoro={onStartPomodoro}
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks?.length === 0 && (
              <div className="empty-column">
                <p>
                  {isZenModeActive && allTasks?.length > 0 
                    ? 'No priority tasks' 
                    : 'No tasks'}
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default TaskColumn;
