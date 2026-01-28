import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import confetti from 'canvas-confetti';
import { useZenMode } from '../../contexts/ZenModeContext';
import Layout from '../../components/Layout';
import './Tasks.css';

const COLUMNS = {
  todo: { id: 'todo', title: 'To Do', icon: '📋' },
  in_progress: { id: 'in_progress', title: 'In Progress', icon: '🔄' },
  done: { id: 'done', title: 'Done', icon: '✅' }
};

const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#dc2626'
};

const isDeadlineToday = (deadline) => {
  if (!deadline) return false;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  return today.toDateString() === deadlineDate.toDateString();
};

const isPriorityTask = (task) => {
  const priority = task.priority?.toLowerCase();
  return (
    priority === 'high' ||
    priority === 'urgent' ||
    task.isUrgent ||
    isDeadlineToday(task.deadline)
  );
};

function Tasks() {
  const navigate = useNavigate();
  const { isZenModeActive, autoTriggeredReason } = useZenMode();

  const [tasks, setTasks] = useState({
    todo: [],
    in_progress: [],
    done: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/tasks', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setTasks(data.tasks);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        setError(data.error || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to connect to task service');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks/stats/summary', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Handling dropped outside a droppable area
    if (!destination) return;

    // Handling dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;
    const taskId = draggableId;

    // Updating UI optimistically
    const newTasks = { ...tasks };
    const [movedTask] = newTasks[sourceColumn].splice(source.index, 1);
    movedTask.status = destColumn;
    newTasks[destColumn].splice(destination.index, 0, movedTask);
    setTasks(newTasks);

    try {
      const response = await fetch(`/api/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: destColumn,
          position: destination.index
        })
      });

      const data = await response.json();

      if (data.success && data.wasCompleted) {
        triggerConfetti();
        fetchStats();
      } else if (!data.success) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Error moving task:', err);
      fetchTasks();
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(taskData)
      });

      const data = await response.json();

      if (data.success) {
        setTasks(prev => ({
          ...prev,
          [data.task.status]: [...prev[data.task.status], data.task]
        }));
        setShowAddModal(false);
        fetchStats();
      } else {
        alert(data.error || 'Failed to create task');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(taskData)
      });

      const data = await response.json();

      if (data.success) {
        fetchTasks();
        setEditingTask(null);
      } else {
        alert(data.error || 'Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        fetchTasks();
        fetchStats();
      } else {
        alert(data.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', class: 'overdue' };
    if (diffDays === 0) return { text: 'Today', class: 'today' };
    if (diffDays === 1) return { text: 'Tomorrow', class: 'soon' };
    if (diffDays <= 7) return { text: `${diffDays} days`, class: 'soon' };
    
    return { 
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
      class: 'normal' 
    };
  };

  // Filtering tasks when Zen Mode is active - show only high priority, urgent, or deadline today
  const filteredTasks = useMemo(() => {
    if (!isZenModeActive) return tasks;
    
    return {
      todo: tasks.todo?.filter(isPriorityTask) || [],
      in_progress: tasks.in_progress?.filter(isPriorityTask) || [],
      done: tasks.done?.filter(isPriorityTask) || []
    };
  }, [tasks, isZenModeActive]);

  const zenModeTaskStats = useMemo(() => {
    if (!isZenModeActive) return null;
    
    const totalOriginal = (tasks.todo?.length || 0) + (tasks.in_progress?.length || 0) + (tasks.done?.length || 0);
    const totalFiltered = (filteredTasks.todo?.length || 0) + (filteredTasks.in_progress?.length || 0) + (filteredTasks.done?.length || 0);
    
    return {
      showing: totalFiltered,
      hidden: totalOriginal - totalFiltered
    };
  }, [tasks, filteredTasks, isZenModeActive]);

  return (
    <Layout>
      <div className={`tasks-page ${isZenModeActive ? 'zen-mode-active' : ''}`}>
        <div className="tasks-header-section">
          <div className="tasks-header-left">
            <h1>Task Board</h1>
            {stats && (
              <div className="task-stats">
                <span className="stat">
                  <span className="stat-value">{stats.pending}</span>
                  <span className="stat-label">Pending</span>
                </span>
                <span className="stat">
                  <span className="stat-value">{stats.completed}</span>
                  <span className="stat-label">Done</span>
                </span>
                {stats.overdue > 0 && (
                  <span className="stat overdue">
                    <span className="stat-value">{stats.overdue}</span>
                    <span className="stat-label">Overdue</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <button className="add-task-btn" onClick={() => setShowAddModal(true)}>
            + New Task
          </button>
        </div>
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={fetchTasks}>Retry</button>
        </div>
      )}
      {isZenModeActive && (
        <div className="zen-mode-banner">
          <span className="zen-banner-icon">🧘</span>
          <div className="zen-banner-text">
            <strong>Zen Mode Active</strong>
            <span>
              {autoTriggeredReason || 'Showing only high priority, urgent, and deadline-today tasks'}
              {zenModeTaskStats && zenModeTaskStats.hidden > 0 && (
                <> • {zenModeTaskStats.hidden} tasks hidden</>
              )}
            </span>
          </div>
        </div>
      )}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="task-board">
            {Object.values(COLUMNS).map((column) => (
              <div key={column.id} className="task-column">
                <div className="column-header">
                  <span className="column-icon">{column.icon}</span>
                  <h2>{column.title}</h2>
                  <span className="task-count">
                    {filteredTasks[column.id]?.length || 0}
                    {isZenModeActive && tasks[column.id]?.length !== filteredTasks[column.id]?.length && (
                      <span className="hidden-count"> / {tasks[column.id]?.length || 0}</span>
                    )}
                  </span>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                      {filteredTasks[column.id]?.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${task.isUrgent ? 'urgent' : ''}`}
                              onClick={() => setEditingTask(task)}
                            >
                              <div className="task-card-header">
                                <span 
                                  className="priority-indicator"
                                  style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                                  title={`${task.priority} priority`}
                                />
                                {task.isUrgent && <span className="urgent-badge">🔥 Urgent</span>}
                              </div>                            
                              <h3 className="task-title">{task.title}</h3>                              
                              {task.description && (
                                <p className="task-description">{task.description}</p>
                              )}
                              <div className="task-card-footer">
                                {task.deadline && (
                                  <span className={`deadline ${formatDeadline(task.deadline)?.class}`}>
                                    📅 {formatDeadline(task.deadline)?.text}
                                  </span>
                                )}                               
                                {task.labels?.length > 0 && (
                                  <div className="task-labels">
                                    {task.labels.slice(0, 2).map((label, i) => (
                                      <span key={i} className="label">{label}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}                     
                      {filteredTasks[column.id]?.length === 0 && (
                        <div className="empty-column">
                          <p>
                            {isZenModeActive && tasks[column.id]?.length > 0 
                              ? 'No priority tasks' 
                              : 'No tasks'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
      {(showAddModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowAddModal(false);
            setEditingTask(null);
          }}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
          onDelete={editingTask ? handleDeleteTask : null}
        />
      )}
      </div>
    </Layout>
  );
}

/**
 * Task Modal Component
 * Used for creating and editing tasks
 */
function TaskModal({ task, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    isUrgent: task?.isUrgent || false,
    deadline: task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
    labels: task?.labels?.join(', ') || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    setSaving(true);

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      isUrgent: formData.isUrgent,
      deadline: formData.deadline || null,
      labels: formData.labels.split(',').map(l => l.trim()).filter(l => l)
    };

    if (task) {
      await onSave(task.id, taskData);
    } else {
      await onSave(taskData);
    }

    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              autoFocus
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details..."
              rows={3}
              maxLength={1000}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
                <option value="urgent">🔥 Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isUrgent}
                onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
              />
              <span>🔥 Mark as Urgent</span>
            </label>
          </div>
          <div className="form-group">
            <label>Labels (comma-separated)</label>
            <input
              type="text"
              value={formData.labels}
              onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
              placeholder="work, personal, project..."
            />
          </div>
          <div className="modal-actions">
            {task && onDelete && (
              <button 
                type="button" 
                className="delete-btn"
                onClick={() => onDelete(task.id)}
              >
                Delete
              </button>
            )}
            <div className="right-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving...' : (task ? 'Update' : 'Create Task')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Tasks;
