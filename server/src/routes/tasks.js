import { Router } from 'express';
import Task from '../models/Task.js';
import { requireAuth, asyncHandler, sendSuccess, sendError, sendValidationError, sendNotFound } from '../utils/response.js';
import { validateTaskData, isValidTaskStatus } from '../utils/validation.js';
import { TASK_STATUS } from '../constants/index.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const tasks = await Task.getTasksByUser(req.user.id);
  
  sendSuccess(res, {
    tasks: {
      todo: tasks.todo.map(t => t.toClientJSON()),
      in_progress: tasks.in_progress.map(t => t.toClientJSON()),
      done: tasks.done.map(t => t.toClientJSON())
    }
  });
}));

router.get('/overdue', requireAuth, asyncHandler(async (req, res) => {
  const tasks = await Task.getOverdueTasks(req.user.id);
  sendSuccess(res, {
    tasks: tasks.map(t => t.toClientJSON())
  });
}));

router.get('/urgent', requireAuth, asyncHandler(async (req, res) => {
  const tasks = await Task.getUrgentTasks(req.user.id);
  sendSuccess(res, {
    tasks: tasks.map(t => t.toClientJSON())
  });
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    userId: req.user.id
  });
  
  if (!task) {
    return sendNotFound(res, 'Task');
  }
  
  sendSuccess(res, {
    task: task.toClientJSON()
  });
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, status, priority, isUrgent, deadline, labels, estimatedTime } = req.body;
  
  const validation = validateTaskData({ title, description, priority, status });
  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }
  
  const dbStatus = status === 'in-progress' ? 'in_progress' : (status || 'todo');
  
  const lastTask = await Task.findOne({
    userId: req.user.id,
    status: dbStatus
  }).sort({ position: -1 });
  
  const position = lastTask ? lastTask.position + 1 : 0;
  
  const task = await Task.create({
    userId: req.user.id,
    title: title.trim(),
    description: description?.trim(),
    status: dbStatus,
    priority: priority || 'medium',
    isUrgent: isUrgent || false,
    deadline: deadline ? new Date(deadline) : undefined,
    position,
    labels: labels || [],
    estimatedTime
  });
  
  console.log(`[Tasks] Created task: ${task.title} for user ${req.user.email}`);
  
  sendSuccess(res, {
    task: task.toClientJSON()
  }, 'Task created successfully', 201);
}));

router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, priority, isUrgent, deadline, labels, estimatedTime, actualTime } = req.body;
  
  const task = await Task.findOne({
    _id: req.params.id,
    userId: req.user.id
  });
  
  if (!task) {
    return sendNotFound(res, 'Task');
  }
  
  const validation = validateTaskData({ title, description, priority });
  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }
  
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
  
  sendSuccess(res, {
    task: task.toClientJSON()
  }, 'Task updated successfully');
}));

router.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, priority, isUrgent, deadline, labels, estimatedTime, actualTime } = req.body;
  
  const task = await Task.findOne({
    _id: req.params.id,
    userId: req.user.id
  });
  
  if (!task) {
    return sendNotFound(res, 'Task');
  }
  
  const validation = validateTaskData({ title, description, priority });
  if (!validation.isValid) {
    return sendValidationError(res, validation.errors);
  }
  
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
  
  sendSuccess(res, {
    task: task.toClientJSON()
  }, 'Task updated successfully');
}));

router.put('/:id/move', requireAuth, asyncHandler(async (req, res) => {
  const { status, position } = req.body;
  
  if (!status || position === undefined) {
    return sendValidationError(res, 'Status and position are required');
  }
  
  if (!isValidTaskStatus(status)) {
    return sendValidationError(res, `Invalid status. Must be one of: ${Object.values(TASK_STATUS).join(', ')}`);
  }
  
  const task = await Task.findOne({
    _id: req.params.id,
    userId: req.user.id
  });
  
  if (!task) {
    return sendNotFound(res, 'Task');
  }
  
  const dbStatus = status === 'in-progress' ? 'in_progress' : status;
  const wasCompleted = (task.status !== 'done' && dbStatus === 'done');
  
  await task.moveTo(dbStatus, position);
  
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
  
  sendSuccess(res, {
    task: task.toClientJSON(),
    wasCompleted
  }, 'Task moved successfully');
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  });
  
  if (!task) {
    return sendNotFound(res, 'Task');
  }
  
  console.log(`[Tasks] Deleted task: ${task.title}`);
  
  sendSuccess(res, null, 'Task deleted successfully');
}));

router.post('/reorder', requireAuth, asyncHandler(async (req, res) => {
  const { tasks } = req.body;
  
  if (!Array.isArray(tasks)) {
    return sendValidationError(res, 'Tasks array is required');
  }
  
  const updatePromises = tasks.map(({ id, position }) =>
    Task.updateOne(
      { _id: id, userId: req.user.id },
      { position }
    )
  );
  
  await Promise.all(updatePromises);
  
  sendSuccess(res, null, 'Tasks reordered successfully');
}));

router.get('/stats/summary', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const [total, completed, overdue, urgent] = await Promise.all([
    Task.countDocuments({ userId }),
    Task.countDocuments({ userId, status: TASK_STATUS.DONE }),
    Task.countDocuments({ 
      userId, 
      status: { $ne: TASK_STATUS.DONE }, 
      deadline: { $lt: new Date() } 
    }),
    Task.countDocuments({ 
      userId, 
      status: { $ne: TASK_STATUS.DONE },
      $or: [{ isUrgent: true }, { priority: 'urgent' }]
    })
  ]);
  
  sendSuccess(res, {
    stats: {
      total,
      completed,
      pending: total - completed,
      overdue,
      urgent,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  });
}));

export default router;
