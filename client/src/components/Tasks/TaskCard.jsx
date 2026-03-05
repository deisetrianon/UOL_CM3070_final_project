/**
 * Task Card component.
 * Individual task card displayed in task columns.
 * Shows task title, description, priority, deadline, and Pomodoro timer button for urgent tasks.
 * 
 * @module components/Tasks/TaskCard
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.task - Task object
 * @param {string} props.columnId - ID of the column this card belongs to
 * @param {Function} props.onEdit - Callback when task is clicked to edit
 * @param {Function} props.onStartPomodoro - Callback when Pomodoro timer is started
 * @param {boolean} props.isDragging - Whether the card is currently being dragged
 * @param {Object} props.dragProps - Drag and drop props from react-beautiful-dnd
 * @param {Object} ref - Forwarded ref for drag and drop
 * @returns {JSX.Element} Task Card component
 */

import { forwardRef } from 'react';
import { formatDeadline } from '../../utils/date';
import pomodoroIcon from '../../assets/icons/pomodoro.png';
import './Tasks.css';

const TaskCard = forwardRef(({ task, columnId, onEdit, onStartPomodoro, isDragging, ...dragProps }, ref) => {
  return (
    <div
      ref={ref}
      {...dragProps}
      className={`task-card ${task.isUrgent ? 'urgent' : ''} ${isDragging ? 'dragging' : ''}`}
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
      <h3 className="task-title">{task.title}</h3>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      <div className="task-tags">
        {task.isUrgent && <span className="tag tag-urgent">Urgent</span>}
        {task.priority === 'high' && !task.isUrgent && <span className="tag tag-high-priority">High Priority</span>}
      </div>
      <div className="task-card-footer">
        {task.deadline && (
          <span className={`deadline ${formatDeadline(task.deadline)?.class}`}>
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
      {task.isUrgent && columnId === 'in_progress' && onStartPomodoro && (
        <div className="start-pomodoro-btn-container">
          <button
            className="start-pomodoro-btn"
            onClick={(e) => {
              e.stopPropagation();
              onStartPomodoro(e);
            }}
          >
            <img src={pomodoroIcon} alt="Start Pomodoro" />
            Start Pomodoro
          </button>
        </div>
      )}
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
