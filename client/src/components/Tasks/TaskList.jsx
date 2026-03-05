/**
 * Task List component.
 * List view of tasks organized by status columns.
 * Displays tasks in a vertical list format grouped by status.
 * 
 * @module components/Tasks/TaskList
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.tasks - Tasks organized by status (todo, in_progress, done)
 * @param {Function} props.onEdit - Callback when task is clicked to edit
 * @returns {JSX.Element} Task List component
 */

import { formatDeadline } from '../../utils/date';
import './Tasks.css';

const COLUMNS = {
  todo: { id: 'todo', title: 'To Do', headerBg: '#f3f4f6' },
  in_progress: { id: 'in_progress', title: 'In Progress', headerBg: '#dbeafe' },
  done: { id: 'done', title: 'Done', headerBg: '#d1fae5' }
};

function TaskList({ tasks, onEdit }) {
  return (
    <div className="task-list-view">
      <div className="list-view-content">
        {Object.values(COLUMNS).map((column) => {
          const columnTasks = tasks[column.id] || [];
          if (columnTasks.length === 0) return null;
          
          return (
            <div key={column.id} className="list-view-section" data-column={column.id}>
              <div className="list-section-header" style={{ backgroundColor: column.headerBg }}>
                <h3>{column.title}</h3>
                <span className="task-count-pill">{columnTasks.length}</span>
              </div>
              <div className="list-view-tasks">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="list-task-item"
                    onClick={() => onEdit(task)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Task: ${task.title}. ${task.isUrgent ? 'Urgent. ' : ''}${task.priority === 'high' ? 'High priority. ' : ''}${task.deadline ? `Deadline: ${formatDeadline(task.deadline)?.text}. ` : ''}Click to edit.`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onEdit(task);
                      }
                    }}
                  >
                    <div className="list-task-main">
                      <h4 className="list-task-title">{task.title}</h4>
                      {task.description && (
                        <p className="list-task-description">{task.description}</p>
                      )}
                    </div>
                    <div className="list-task-meta">
                      <div className="list-task-tags">
                        {task.isUrgent && <span className="tag tag-urgent">Urgent</span>}
                        {task.priority === 'high' && !task.isUrgent && <span className="tag tag-high-priority">High Priority</span>}
                      </div>
                      {task.deadline && (
                        <span className={`list-task-deadline ${formatDeadline(task.deadline)?.class}`}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }} aria-hidden="true">
                            <rect x="2" y="3" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                            <line x1="4" y1="1" x2="4" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            <line x1="7" y1="1" x2="7" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            <line x1="10" y1="1" x2="10" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                          {formatDeadline(task.deadline)?.text}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {Object.values(COLUMNS).every(column => (tasks[column.id]?.length || 0) === 0) && (
          <div className="empty-list-view">
            <p>No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskList;
