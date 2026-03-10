/**
 * Tasks page component.
 * Task management interface with board and list views, drag-and-drop, and task statistics.
 * Supports task creation, editing, deletion, and status updates.
 * 
 * @module pages/Tasks
 * @component
 * @returns {JSX.Element} Tasks page component
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useZenMode } from '../../contexts/ZenModeContext';
import { useDialog } from '../../contexts/DialogContext';
import { isToday } from '../../utils/date';
import { POMODORO, API_ENDPOINTS } from '../../constants';
import { apiGet, apiPost, apiPatch, apiPut, apiDelete, getErrorMessage } from '../../utils/api';
import Layout from '../../components/Layout';
import TaskBoard from '../../components/Tasks/TaskBoard';
import TaskList from '../../components/Tasks/TaskList';
import TaskModal from '../../components/Tasks/TaskModal';
import TaskStats from '../../components/Tasks/TaskStats';
import refreshIcon from '../../assets/icons/refresh.png';
import importantIcon from '../../assets/icons/important.png';
import boardIcon from '../../assets/icons/board.png';
import listIcon from '../../assets/icons/list.png';
import './Tasks.css';

const COLUMNS = {
  todo: { id: 'todo', title: 'To Do', icon: '📋', headerBg: '#f3f4f6' },
  in_progress: { id: 'in_progress', title: 'In Progress', icon: refreshIcon, headerBg: '#dbeafe' },
  done: { id: 'done', title: 'Done', icon: '✅', headerBg: '#d1fae5' }
};

const isPriorityTask = (task) => {
  const priority = task.priority?.toLowerCase();
  return (
    priority === 'high' ||
    priority === 'urgent' ||
    task.isUrgent ||
    isToday(task.deadline)
  );
};

function Tasks() {
  const navigate = useNavigate();
  const { isZenModeActive, autoTriggeredReason } = useZenMode();
  const { showAlert, showConfirm } = useNotification();

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
      const data = await apiGet(API_ENDPOINTS.TASKS.BASE);
      if (data.success) {
        setTasks(data.tasks);
      } else {
        setError(data.error || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      if (err.message?.includes('401') || err.message?.includes('Not authenticated')) {
        navigate('/login');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiGet(API_ENDPOINTS.TASKS.STATS);
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

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;
    const taskId = draggableId;

    const newTasks = { ...tasks };
    
    if (!Array.isArray(newTasks[sourceColumn])) {
      newTasks[sourceColumn] = [];
    }
    if (!Array.isArray(newTasks[destColumn])) {
      newTasks[destColumn] = [];
    }
    
    const sourceTasks = newTasks[sourceColumn];
    const taskIndex = sourceTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      console.error('Task not found:', taskId, 'in column:', sourceColumn);
      return;
    }
    
    const [movedTask] = sourceTasks.splice(taskIndex, 1);
    movedTask.status = destColumn;
    
    const destTasks = newTasks[destColumn];
    const insertIndex = Math.min(destination.index, destTasks.length);
    destTasks.splice(insertIndex, 0, movedTask);
    
    setTasks(newTasks);

    try {
      const data = await apiPut(API_ENDPOINTS.TASKS.MOVE(taskId), {
        status: destColumn,
        position: destination.index
      });
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
      const data = await apiPost(API_ENDPOINTS.TASKS.BASE, taskData);
      if (data.success) {
        const clientStatus = data.task.status === 'in-progress' ? 'in_progress' : data.task.status;
        const taskWithClientStatus = { ...data.task, status: clientStatus };
        setTasks(prev => ({
          ...prev,
          [clientStatus]: [...prev[clientStatus], taskWithClientStatus]
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
      const data = await apiPatch(`${API_ENDPOINTS.TASKS.BASE}/${taskId}`, taskData);
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
      const data = await apiDelete(`${API_ENDPOINTS.TASKS.BASE}/${taskId}`);
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

  const handleStartPomodoro = (e) => {
    e.stopPropagation();
    const WORK_DURATION = POMODORO.WORK_DURATION_SECONDS;
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
      timeLeft: currentMode === 'work' ? POMODORO.WORK_DURATION_SECONDS : POMODORO.BREAK_DURATION_SECONDS,
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

  const handleEditTask = useCallback((task) => {
    setEditingTask(task);
    setShowAddModal(true);
  }, []);

  const handleAddTask = useCallback((columnId) => {
    setEditingTask({ status: columnId });
    setShowAddModal(true);
  }, []);

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
              onClick={() => handleAddTask('todo')}
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
          <TaskBoard
            tasks={filteredTasks}
            isZenModeActive={isZenModeActive}
            allTasks={tasks}
            onDragEnd={handleDragEnd}
            onEdit={handleEditTask}
            onAddTask={handleAddTask}
            onStartPomodoro={handleStartPomodoro}
          />
        ) : (
          <TaskList
            tasks={filteredTasks}
            onEdit={handleEditTask}
          />
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

export default Tasks;
