/**
 * Server-side constants and configuration values.
 * Contains HTTP status codes, API messages, task statuses, and priorities.
 * 
 * @module constants
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const API_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  ERROR: 'An error occurred',
  UNAUTHORIZED: 'Not authenticated',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
};

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const STRESS_LEVEL = {
  NORMAL: 'normal',
  MODERATE: 'moderate',
  HIGH: 'high',
};

export const COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  STRESS_LOGS: 'stresslogs',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
};

export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};

export const AZURE_FACE_CONFIG = {
  DETECTION_MODEL: 'detection_03',
  RETURN_FACE_LANDMARKS: true,
  RETURN_FACE_ATTRIBUTES: 'headPose,blur,exposure,occlusion,glasses',
  MAX_FACES: 1,
};

export const GMAIL_CONFIG = {
  MAX_RESULTS: 50,
  DEFAULT_LABEL: 'INBOX',
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SERVER_ERROR: 'SERVER_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
};
