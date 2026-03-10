import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HTTP_STATUS, API_MESSAGES } from '../../constants/index.js';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendNotFound,
  requireAuth,
  asyncHandler,
} from '../response.js';

describe('Response', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('sendSuccess', () => {
    it('should send success response with data', () => {
      const data = { id: 1, name: 'Test' };
      sendSuccess(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: API_MESSAGES.SUCCESS,
        ...data,
      });
    });

    it('should send success response with array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      sendSuccess(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: API_MESSAGES.SUCCESS,
        data,
      });
    });

    it('should send success response with custom message and status', () => {
      sendSuccess(mockRes, null, 'Custom message', HTTP_STATUS.CREATED);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Custom message',
      });
    });

    it('should send success response without data', () => {
      sendSuccess(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: API_MESSAGES.SUCCESS,
      });
    });
  });

  describe('sendError', () => {
    it('should send error response with Error object', () => {
      const error = new Error('Test error');
      sendError(mockRes, error, HTTP_STATUS.BAD_REQUEST);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should send error response with string', () => {
      sendError(mockRes, 'Error message', HTTP_STATUS.INTERNAL_SERVER_ERROR);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error message',
        code: 'SERVER_ERROR',
      });
    });

    it('should send error response with custom code', () => {
      sendError(mockRes, 'Error', HTTP_STATUS.BAD_REQUEST, 'CUSTOM_ERROR');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error',
        code: 'CUSTOM_ERROR',
      });
    });
  });

  describe('sendValidationError', () => {
    it('should send validation error with errors object', () => {
      const errors = { field: 'Error message' };
      sendValidationError(mockRes, errors);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: API_MESSAGES.VALIDATION_ERROR,
        code: 'VALIDATION_ERROR',
        errors,
      });
    });

    it('should send validation error with string', () => {
      sendValidationError(mockRes, 'Validation failed');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('sendUnauthorized', () => {
    it('should send unauthorized response', () => {
      sendUnauthorized(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: API_MESSAGES.UNAUTHORIZED,
        code: 'UNAUTHORIZED',
      });
    });

    it('should send unauthorized response with custom message', () => {
      sendUnauthorized(mockRes, 'Custom unauthorized message');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Custom unauthorized message',
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('sendNotFound', () => {
    it('should send not found response with default resource', () => {
      sendNotFound(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
        code: 'NOT_FOUND',
      });
    });

    it('should send not found response with custom resource', () => {
      sendNotFound(mockRes, 'Task');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Task not found',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('requireAuth', () => {
    it('should call next when user is authenticated', () => {
      const mockReq = {
        isAuthenticated: jest.fn().mockReturnValue(true),
        user: { id: '123' },
      };
      const mockNext = jest.fn();

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should send unauthorized when user is not authenticated', () => {
      const mockReq = {
        isAuthenticated: jest.fn().mockReturnValue(false),
        user: null,
      };
      const mockNext = jest.fn();

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should send unauthorized when user is null', () => {
      const mockReq = {
        isAuthenticated: jest.fn().mockReturnValue(true),
        user: null,
      };
      const mockNext = jest.fn();

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const mockReq = {};
      const mockNext = jest.fn();
      const asyncFn = jest.fn().mockResolvedValue('success');

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle async function error', async () => {
      const mockReq = {};
      const mockNext = jest.fn();
      const error = new Error('Test error');
      const asyncFn = jest.fn().mockRejectedValue(error);

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous function', async () => {
      const mockReq = {};
      const mockNext = jest.fn();
      const syncFn = jest.fn().mockReturnValue('success');

      const handler = asyncHandler(syncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(syncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
