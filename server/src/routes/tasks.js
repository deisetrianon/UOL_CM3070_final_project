import { Router } from 'express';
import Task from '../models/Task.js';

const router = Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      message: 'Please log in to access tasks'
    });
  }
  next();
};

/**
 * GET /api/tasks
 * Get all tasks for the authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.getTasksByUser(req.user.id);
    
    res.json({
      success: true,
      tasks: {
        todo: tasks.todo.map(t => t.toClientJSON()),
        in_progress: tasks.in_progress.map(t => t.toClientJSON()),
        done: tasks.done.map(t => t.toClientJSON())
      }
    });
  } catch (error) {
    console.error('[Tasks] Error fetching tasks:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      message: error.message
    });
  }
});

/**
 * GET /api/tasks/overdue
 * Get overdue tasks for the authenticated user
 */
router.get('/overdue', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.getOverdueTasks(req.user.id);
    
    res.json({
      success: true,
      tasks: tasks.map(t => t.toClientJSON())
    });
  } catch (error) {
    console.error('[Tasks] Error fetching overdue tasks:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue tasks'
    });
  }
});

/**
 * GET /api/tasks/urgent
 * Get urgent tasks for the authenticated user
 */
router.get('/urgent', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.getUrgentTasks(req.user.id);
    
    res.json({
      success: true,
      tasks: tasks.map(t => t.toClientJSON())
    });
  } catch (error) {
    console.error('[Tasks] Error fetching urgent tasks:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch urgent tasks'
    });
  }
});

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      task: task.toClientJSON()
    });
  } catch (error) {
    console.error('[Tasks] Error fetching task:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task'
    });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, status, priority, isUrgent, deadline, labels, estimatedTime } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    // Getting the highest position in the target column
    const lastTask = await Task.findOne({
      userId: req.user.id,
      status: status || 'todo'
    }).sort({ position: -1 });
    
    const position = lastTask ? lastTask.position + 1 : 0;
    
    const task = await Task.create({
      userId: req.user.id,
      title: title.trim(),
      description: description?.trim(),
      status: status || 'todo',
      priority: priority || 'medium',
      isUrgent: isUrgent || false,
      deadline: deadline ? new Date(deadline) : undefined,
      position,
      labels: labels || [],
      estimatedTime
    });
    
    console.log(`[Tasks] Created task: ${task.title} for user ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      task: task.toClientJSON()
    });
  } catch (error) {
    console.error('[Tasks] Error creating task:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      message: error.message
    });
  }
});

/**
 * PUT /api/tasks/:id
 * Update a task
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, priority, isUrgent, deadline, labels, estimatedTime, actualTime } = req.body;
    
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Updating fields
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description?.trim();
    if (priority !== undefined) task.priority = priority;
    if (isUrgent !== undefined) task.isUrgent = isUrgent;
    if (deadline !== undefined) task.deadline = deadline ? new Date(deadline) : undefined;
    if (labels !== undefined) task.labels = labels;
    if (estimatedTime !== undefined) task.estimatedTime = estimatedTime;
    if (actualTime !== undefined) task.actualTime = actualTime;
    
    await task.save();
    
    console.log(`[Tasks] Updated task: ${task.title}`);
    
    res.json({
      success: true,
      task: task.toClientJSON()
    });
  } catch (error) {
    console.error('[Tasks] Error updating task:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
});

/**
 * PUT /api/tasks/:id/move
 * Move a task to a new column/position (for drag and drop)
 */
router.put('/:id/move', requireAuth, async (req, res) => {
  try {
    const { status, position } = req.body;
    
    if (!status || position === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Status and position are required'
      });
    }
    
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    const wasCompleted = task.status !== 'done' && status === 'done';
    
    await task.moveTo(status, position);
    
    // Reordering other tasks in the column
    await Task.updateMany(
      {
        userId: req.user.id,
        status,
        _id: { $ne: task._id },
        position: { $gte: position }
      },
      { $inc: { position: 1 } }
    );
    
    console.log(`[Tasks] Moved task: ${task.title} to ${status} at position ${position}`);
    
    res.json({
      success: true,
      task: task.toClientJSON(),
      wasCompleted
    });
  } catch (error) {
    console.error('[Tasks] Error moving task:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to move task'
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    console.log(`[Tasks] Deleted task: ${task.title}`);
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('[Tasks] Error deleting task:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
});

/**
 * POST /api/tasks/reorder
 * Reorder tasks within a column (batch update)
 */
router.post('/reorder', requireAuth, async (req, res) => {
  try {
    const { tasks } = req.body; // Array of { id, position }
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'Tasks array is required'
      });
    }
    
    // Updating each task's position
    const updatePromises = tasks.map(({ id, position }) =>
      Task.updateOne(
        { _id: id, userId: req.user.id },
        { position }
      )
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Tasks reordered successfully'
    });
  } catch (error) {
    console.error('[Tasks] Error reordering tasks:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder tasks'
    });
  }
});

/**
 * GET /api/tasks/stats
 * Get task statistics for the user
 */
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [total, completed, overdue, urgent] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: 'done' }),
      Task.countDocuments({ 
        userId, 
        status: { $ne: 'done' }, 
        deadline: { $lt: new Date() } 
      }),
      Task.countDocuments({ 
        userId, 
        status: { $ne: 'done' },
        $or: [{ isUrgent: true }, { priority: 'urgent' }]
      })
    ]);
    
    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending: total - completed,
        overdue,
        urgent,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (error) {
    console.error('[Tasks] Error fetching stats:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task stats'
    });
  }
});

export default router;
