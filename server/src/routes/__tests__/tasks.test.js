import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import Task from '../../models/Task.js';
import tasksRouter from '../tasks.js';

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../models/Task.js');

const mockRequireAuth = jest.fn((req, res, next) => {
  req.isAuthenticated = jest.fn(() => true);
  req.user = { id: 'test-user-id' };
  next();
});

jest.mock('../../utils/response.js', async () => {
  const actual = await jest.requireActual('../../utils/response.js');
  return {
    ...actual,
    requireAuth: mockRequireAuth,
  };
});

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.isAuthenticated = jest.fn(() => true);
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  next();
});
app.use('/api/tasks', tasksRouter);

describe('Tasks Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return tasks grouped by status', async () => {
      const mockTasks = {
        todo: [{ _id: '1', title: 'Task 1', toClientJSON: () => ({ id: '1', title: 'Task 1' }) }],
        in_progress: [{ _id: '2', title: 'Task 2', toClientJSON: () => ({ id: '2', title: 'Task 2' }) }],
        done: [],
      };

      Task.getTasksByUser = jest.fn().mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tasks.todo).toHaveLength(1);
      expect(response.body.tasks.in_progress).toHaveLength(1);
      expect(response.body.tasks.done).toHaveLength(0);
      expect(Task.getTasksByUser).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return a task by id', async () => {
      const mockTask = {
        _id: 'task-id',
        title: 'Test Task',
        toClientJSON: () => ({ id: 'task-id', title: 'Test Task' }),
      };

      Task.findOne = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .get('/api/tasks/task-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.task.title).toBe('Test Task');
      expect(Task.findOne).toHaveBeenCalledWith({
        _id: 'task-id',
        userId: 'test-user-id',
      });
    });

    it('should return 404 if task not found', async () => {
      Task.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tasks/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        status: 'todo',
      };

      const mockTask = {
        _id: 'new-task-id',
        ...taskData,
        toClientJSON: () => ({ id: 'new-task-id', ...taskData }),
      };

      Task.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });
      Task.create = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.task.title).toBe('New Task');
      expect(Task.create).toHaveBeenCalled();
    });

    it('should return validation error for invalid task data', async () => {
      const invalidData = { title: '' };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update an existing task', async () => {
      const mockTask = {
        _id: 'task-id',
        userId: 'test-user-id',
        title: 'Updated Task',
        save: jest.fn().mockResolvedValue(true),
        toClientJSON: () => ({ id: 'task-id', title: 'Updated Task' }),
      };

      Task.findOne = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .put('/api/tasks/task-id')
        .send({ title: 'Updated Task' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockTask.save).toHaveBeenCalled();
    });

    it('should return 404 if task not found', async () => {
      Task.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/tasks/non-existent')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const mockTask = {
        _id: 'task-id',
        userId: 'test-user-id',
        title: 'Test Task',
        toClientJSON: () => ({ id: 'task-id', title: 'Test Task' }),
      };

      Task.findOneAndDelete = jest.fn().mockResolvedValue(mockTask);

      const response = await request(app)
        .delete('/api/tasks/task-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Task.findOneAndDelete).toHaveBeenCalled();
    });
  });
});
