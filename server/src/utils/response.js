/**
 * HTTP response utility functions.
 * Provides standardized response helpers for success, error, validation, and authorization responses.
 * 
 * @module utils/response
 */

import { HTTP_STATUS, API_MESSAGES } from '../constants/index.js';

/**
 * Sends a successful HTTP response.
 * 
 * @param {Object} res - Express response object
 * @param {Object|Array|null} data - Response data to include
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Express response
 */
export function sendSuccess(res, data = null, message = API_MESSAGES.SUCCESS, statusCode = HTTP_STATUS.OK) {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    if (Array.isArray(data)) {
      response.data = data;
    } else if (typeof data === 'object') {
      Object.assign(response, data);
    } else {
      response.data = data;
    }
  }

  return res.status(statusCode).json(response);
}

/**
 * Sends an error HTTP response.
 * 
 * @param {Object} res - Express response object
 * @param {Error|string} error - Error message or Error object
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string|null} code - Error code (default: 'SERVER_ERROR' or 'VALIDATION_ERROR')
 * @returns {Object} Express response
 */
export function sendError(res, error, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = null) {
  const message = error instanceof Error ? error.message : error;
  const errorCode = code || (statusCode === HTTP_STATUS.BAD_REQUEST ? 'VALIDATION_ERROR' : 'SERVER_ERROR');

  return res.status(statusCode).json({
    success: false,
    error: message || API_MESSAGES.ERROR,
    code: errorCode,
  });
}

export function sendValidationError(res, errors) {
  const message = typeof errors === 'string' ? errors : API_MESSAGES.VALIDATION_ERROR;
  
  return res.status(HTTP_STATUS.BAD_REQUEST).json({
    success: false,
    error: message,
    code: 'VALIDATION_ERROR',
    errors: typeof errors === 'object' ? errors : undefined,
  });
}

/**
 * Sends an unauthorized HTTP response.
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message (default: API_MESSAGES.UNAUTHORIZED)
 * @returns {Object} Express response
 */
export function sendUnauthorized(res, message = API_MESSAGES.UNAUTHORIZED) {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
}

/**
 * Sends a not found HTTP response.
 * 
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name (default: 'Resource')
 * @returns {Object} Express response
 */
export function sendNotFound(res, resource = 'Resource') {
  return sendError(res, `${resource} not found`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
}

/**
 * Express middleware to require authentication.
 * Checks if user is authenticated via session, redirects to login if not.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function requireAuth(req, res, next) {
  if (!req.isAuthenticated() || !req.user) {
    return sendUnauthorized(res, 'Please log in to access this resource');
  }
  next();
}

/**
 * Wraps async route handlers to automatically catch and handle errors.
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped route handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
