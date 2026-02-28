import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import confetti from 'canvas-confetti';
import { useZenMode } from '../../contexts/ZenModeContext';
import { useDialog } from '../../contexts/DialogContext';
import Layout from '../../components/Layout';
import refreshIcon from '../../assets/icons/refresh.png';
import importantIcon from '../../assets/icons/important.png';
import boardIcon from '../../assets/icons/board.png';
import listIcon from '../../assets/icons/list.png';
import pomodoroIcon from '../../assets/icons/pomodoro.png';
import './Tasks.css';

const COLUMNS = {
  todo: { id: 'todo', title: 'To Do', icon: '📋', headerBg: '#f3f4f6' },
  in_progress: { id: 'in_progress', title: 'In Progress', icon: refreshIcon, headerBg: '#dbeafe' },
  done: { id: 'done', title: 'Done', icon: '✅', headerBg: '#d1fae5' }
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
  const { showAlert, showConfirm } = useDialog();

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
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('board');

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
        setEditingTask(null);
        fetchStats();
      } else {
        await showAlert(data.error || 'Failed to create task', 'error');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      await showAlert('Failed to create task', 'error');
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
        await showAlert(data.error || 'Failed to update task', 'error');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      await showAlert('Failed to update task', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this task?',
      {
        title: 'Delete Task',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setEditingTask(null);
        setShowAddModal(false);
        fetchTasks();
        fetchStats();
      } else {
        await showAlert(data.error || 'Failed to delete task', 'error');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      await showAlert('Failed to delete task', 'error');
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

  const handleStartPomodoro = (e) => {
    e.stopPropagation();
    const WORK_DURATION = 25 * 60; // 25 minutes
    const now = Date.now();
    
    const existingState = localStorage.getItem('pomodoro_timer_state');
    let sessionCount = 0;
    let currentMode = 'work';
    
    if (existingState) {
      try {
        const parsed = JSON.parse(existingState);
        sessionCount = parsed.sessionCount || 0;
        currentMode = parsed.mode || 'work';
      } catch (e) {
        console.error('Error parsing pomodoro state:', e);
      }
    }
    
    const timerState = {
      mode: currentMode,
      timeLeft: currentMode === 'work' ? WORK_DURATION : 5 * 60,
      isActive: true,
      sessionCount: sessionCount,
      startTimestamp: now,
      originalDuration: currentMode === 'work' ? WORK_DURATION : 5 * 60
    };
    
    localStorage.setItem('pomodoro_timer_state', JSON.stringify(timerState));
    
    window.dispatchEvent(new CustomEvent('pomodoro-start'));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pomodoro_timer_state',
      newValue: JSON.stringify(timerState)
    }));
  };

  // Filtering tasks based on active filter and Zen Mode
  const filteredTasks = useMemo(() => {
    let filtered = { ...tasks };
    
    if (activeFilter === 'today') {
      const now = new Date();
      
      const filterByToday = (taskList) => {
        if (!taskList || !Array.isArray(taskList)) return [];
        return taskList.filter(task => {
          if (!task || !task.deadline) return false;
          
          try {
            const deadlineDate = new Date(task.deadline);

            if (isNaN(deadlineDate.getTime())) return false;
            
            const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
            return diffDays === 0;
          } catch (e) {
            return false;
          }
        });
      };
      
      filtered = {
        todo: filterByToday(tasks.todo || []),
        in_progress: filterByToday(tasks.in_progress || []),
        done: filterByToday(tasks.done || [])
      };
    }
    
    if (isZenModeActive) {
      return {
        todo: filtered.todo?.filter(isPriorityTask) || [],
        in_progress: filtered.in_progress?.filter(isPriorityTask) || [],
        done: filtered.done?.filter(isPriorityTask) || []
      };
    }
    
    return filtered;
  }, [tasks, isZenModeActive, activeFilter]);

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
            <div className="tasks-nav-buttons" role="tablist" aria-label="Task filter options">
              <button 
                className={`nav-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
                role="tab"
                aria-selected={activeFilter === 'all'}
                aria-controls="tasks-content"
                aria-label="Show all tasks"
              >
                All Tasks
              </button>
              <button 
                className={`nav-btn ${activeFilter === 'today' ? 'active' : ''}`}
                onClick={() => setActiveFilter('today')}
                role="tab"
                aria-selected={activeFilter === 'today'}
                aria-controls="tasks-content"
                aria-label="Show today's tasks"
              >
                Today
              </button>
            </div>
          </div>
          <div className="tasks-header-right">
            <div className="view-toggle" role="group" aria-label="View mode selection">
              <button 
                className={`view-btn ${viewMode === 'board' ? 'active' : ''}`}
                onClick={() => setViewMode('board')}
                title="Board View"
                aria-label="Switch to board view"
                aria-pressed={viewMode === 'board'}
              >
                <img src={boardIcon} alt="" className="view-icon" aria-hidden="true" />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
                aria-label="Switch to list view"
                aria-pressed={viewMode === 'list'}
              >
                <img src={listIcon} alt="" className="view-icon" aria-hidden="true" />
              </button>
            </div>
            <button 
              className="add-task-btn" 
              onClick={() => setShowAddModal(true)}
              aria-label="Create new task"
            >
              New Task
            </button>
          </div>
        </div>
      {error && (
        <div className="error-banner" role="alert" aria-live="assertive">
          <img src={importantIcon} alt="" className="warning-icon" aria-hidden="true" />
          <span>{error}</span>
          <button onClick={fetchTasks} aria-label="Retry loading tasks">Retry</button>
        </div>
      )}
      {isZenModeActive && (
        <div className="zen-mode-banner">
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
      ) : viewMode === 'board' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="task-board">
            {Object.values(COLUMNS).map((column) => (
              <div key={column.id} className="task-column" data-column={column.id}>
                <div className="column-header" style={{ backgroundColor: column.headerBg }}>
                  <h2>{column.title}</h2>
                  <span className="task-count-pill">{filteredTasks[column.id]?.length || 0}</span>
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
                        onClick={() => {
                          setEditingTask({ status: column.id });
                          setShowAddModal(true);
                        }}
                        aria-label={`Add new task to ${column.title} column`}
                      >
                        Add task
                      </button>
                      {filteredTasks[column.id]?.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${task.isUrgent ? 'urgent' : ''}`}
                              onClick={() => setEditingTask(task)}
                              role="button"
                              tabIndex={0}
                              aria-label={`Task: ${task.title}. ${task.isUrgent ? 'Urgent. ' : ''}${task.priority === 'high' ? 'High priority. ' : ''}${task.deadline ? `Deadline: ${formatDeadline(task.deadline)?.text}. ` : ''}Click to edit.`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setEditingTask(task);
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
                              {task.isUrgent && column.id === 'in_progress' && (
                                <div className="start-pomodoro-btn-container">
                                  <button
                                    className="start-pomodoro-btn"
                                    onClick={handleStartPomodoro}
                                  >
                                    <img src={pomodoroIcon} alt="Start Pomodoro" />
                                    Start Pomodoro
                                  </button>
                                </div>
                              )}
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
      ) : (
        <div className="task-list-view">
          <div className="list-view-content">
            {Object.values(COLUMNS).map((column) => {
              const columnTasks = filteredTasks[column.id] || [];
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
                        onClick={() => setEditingTask(task)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Task: ${task.title}. ${task.isUrgent ? 'Urgent. ' : ''}${task.priority === 'high' ? 'High priority. ' : ''}${task.deadline ? `Deadline: ${formatDeadline(task.deadline)?.text}. ` : ''}Click to edit.`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setEditingTask(task);
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
            {Object.values(COLUMNS).every(column => (filteredTasks[column.id]?.length || 0) === 0) && (
              <div className="empty-list-view">
                <p>No tasks found</p>
              </div>
            )}
          </div>
        </div>
      )}
      {(showAddModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowAddModal(false);
            setEditingTask(null);
          }}
          onSave={editingTask && editingTask.id ? handleUpdateTask : handleCreateTask}
          onDelete={editingTask && editingTask.id ? handleDeleteTask : null}
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
  const { showAlert } = useDialog();
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    isUrgent: task?.isUrgent || false,
    deadline: task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
  });
  const [saving, setSaving] = useState(false);

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

export default Tasks;
