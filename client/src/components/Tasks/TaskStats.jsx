/**
 * Task Stats component.
 * Displays task statistics including total tasks, tasks by status, and completion rate.
 * 
 * @module components/Tasks/TaskStats
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.stats - Task statistics object with total, todo, inProgress, done, completionRate
 * @returns {JSX.Element|null} Task Stats component or null if no stats
 */

import './Tasks.css';

function TaskStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="task-stats" role="region" aria-label="Task statistics">
      <div className="stat-item">
        <span className="stat-label">Total</span>
        <span className="stat-value">{stats.total || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">To Do</span>
        <span className="stat-value">{stats.todo || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">In Progress</span>
        <span className="stat-value">{stats.inProgress || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Done</span>
        <span className="stat-value">{stats.done || 0}</span>
      </div>
    </div>
  );
}

export default TaskStats;
