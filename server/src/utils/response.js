import { HTTP_STATUS, API_MESSAGES } from '../constants/index.js';

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

export function sendUnauthorized(res, message = API_MESSAGES.UNAUTHORIZED) {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
}

export function sendNotFound(res, resource = 'Resource') {
  return sendError(res, `${resource} not found`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
}

export function requireAuth(req, res, next) {
  if (!req.isAuthenticated() || !req.user) {
    return sendUnauthorized(res, 'Please log in to access this resource');
  }
  next();
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
