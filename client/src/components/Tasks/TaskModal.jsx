/**
 * Task Modal component.
 * Modal dialog for creating and editing tasks.
 * Handles task form with title, description, priority, urgency, and deadline fields.
 * 
 * @module components/Tasks/TaskModal
 * @component
 * @param {Object} props - Component props
 * @param {Object|null} props.task - Task object to edit (null for new task)
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSave - Callback when task is saved
 * @param {Function} props.onDelete - Callback when task is deleted
 * @returns {JSX.Element} Task Modal component
 */

import { useState, useEffect } from 'react';
import { useDialog } from '../../contexts/DialogContext';
import './Tasks.css';

function TaskModal({ task, onClose, onSave, onDelete }) {
  const { showAlert } = useDialog();
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    isUrgent: task?.isUrgent || false,
    deadline: task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'medium',
      isUrgent: task?.isUrgent || false,
      deadline: task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
    });
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      await showAlert('Title is required', 'warning');
      return;
    }

    setSaving(true);

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      isUrgent: formData.isUrgent,
      deadline: formData.deadline || null,
      status: task?.status || 'todo'
    };

    if (task && task.id) {
      await onSave(task.id, taskData);
    } else {
      await onSave(taskData);
    }

    setSaving(false);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="task-modal" onClick={(e) => e.stopPropagation()} role="document">
        <div className="modal-header">
          <h2 id="task-modal-title">{task && task.id ? 'Edit Task' : 'New Task'}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close task modal">✕</button>
        </div>
        <form onSubmit={handleSubmit} aria-label={task && task.id ? 'Edit task form' : 'Create new task form'}>
          <div className="form-group">
            <label htmlFor="task-title">Title <span aria-label="required">*</span></label>
            <input
              id="task-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              autoFocus
              maxLength={200}
              required
              aria-required="true"
              aria-describedby="task-title-help"
            />
            <span id="task-title-help" className="sr-only">Maximum 200 characters</span>
          </div>
          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details..."
              rows={3}
              maxLength={1000}
              aria-describedby="task-description-help"
            />
            <span id="task-description-help" className="sr-only">Maximum 1000 characters</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                aria-label="Task priority level"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
                <option value="urgent">🔥 Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="task-deadline">Deadline</label>
              <input
                id="task-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                aria-label="Task deadline date"
              />
            </div>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isUrgent}
                onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                aria-label="Mark task as urgent"
              />
              <span>🔥 Mark as Urgent</span>
            </label>
          </div>
          <div className="modal-actions">
            {task && onDelete && (
              <button 
                type="button" 
                className="delete-btn"
                onClick={() => onDelete(task.id)}
                aria-label="Delete this task"
              >
                Delete
              </button>
            )}
            <div className="right-actions">
              <button type="button" className="cancel-btn" onClick={onClose} aria-label="Cancel and close task form">
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={saving} aria-label={saving ? 'Saving task' : (task && task.id ? 'Update task' : 'Create new task')}>
                {saving ? 'Saving...' : (task && task.id ? 'Update' : 'Create Task')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
