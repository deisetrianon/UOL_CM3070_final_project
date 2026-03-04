export const TIME = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
};

export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};

export const POMODORO = {
  WORK_DURATION_SECONDS: 25 * TIME.MINUTE,
  BREAK_DURATION_SECONDS: 5 * TIME.MINUTE,
  STORAGE_KEY: 'pomodoro_timer_state',
};

export const STRESS = {
  MODERATE_THRESHOLD: 30,
  HIGH_THRESHOLD: 60,
  MAX_SCORE: 100,
  MIN_SCORE: 0,
  
  FACIAL_WEIGHT: 0.6,
  KEYSTROKE_WEIGHT: 0.4,
  
  FACIAL_AVERAGE_WINDOW: 5 * TIME_MS.MINUTE,
  KEYSTROKE_AVERAGE_WINDOW: 2 * TIME_MS.MINUTE,
  STRESS_LOG_SAVE_INTERVAL: 5 * TIME_MS.MINUTE,
  HISTORY_CUTOFF: 10 * TIME_MS.MINUTE,
  
  MIN_SCORE_CHANGE_FOR_IMMEDIATE_SAVE: 10,
  
  LEVELS: {
    NORMAL: 'normal',
    MODERATE: 'moderate',
    HIGH: 'high',
  },
};

export const KEYSTROKE = {
  ROLLING_WINDOW_SIZE: 50,
  BASELINE_DEVIATION_THRESHOLD: 0.15,
  MIN_KEYSTROKES_FOR_ANALYSIS: 10,
  BASELINE_DWELL_TIME_MS: 100,
  BASELINE_FLIGHT_TIME_MS: 150,
  PANIC_TYPING_FLIGHT_TIME_MS: 80,
  PANIC_TYPING_DWELL_TIME_MS: 80,
  PANIC_TYPING_VARIANCE_THRESHOLD: 0.5,
};

export const WELLNESS = {
  PROLONGED_STRESS_DURATION: 10 * TIME_MS.MINUTE,
  INTERVENTION_COOLDOWN: 5 * TIME_MS.MINUTE,
  GENERAL_COOLDOWN: 2 * TIME_MS.MINUTE,
  ZEN_MODE_SUGGESTION_COOLDOWN: 10 * TIME_MS.MINUTE,
  
  INTERVENTION_TYPES: {
    BREATHING: 'breathing',
    MINDFULNESS: 'mindfulness',
    STRETCHING: 'stretching',
    ANXIETY_RELIEF: 'anxietyRelief',
    MENTAL_HEALTH: 'mentalHealth',
  },
};

export const FACIAL_ANALYSIS = {
  DEFAULT_INTERVAL_MINUTES: 5,
  MIN_INTERVAL_MINUTES: 1,
  MAX_INTERVAL_MINUTES: 60,
  STORAGE_KEY: 'facial_analysis_interval',
};

export const TASK = {
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  },
  
  STATUSES: {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    DONE: 'done',
  },
  
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    USER: '/api/auth/user',
  },
  TASKS: {
    BASE: '/api/tasks',
    STATS: '/api/tasks/stats/summary',
    MOVE: (taskId) => `/api/tasks/${taskId}/move`,
  },
  EMAIL: {
    LIST: '/api/gmail/emails',
    GET: (messageId) => `/api/gmail/emails/${messageId}`,
    SEND: '/api/gmail/emails/send',
    PROFILE: '/api/gmail/profile',
  },
  STRESS: {
    LOGS: '/api/stress-logs',
    STATISTICS: '/api/stress-logs/statistics',
  },
  CALENDAR: {
    COMBINED: '/api/calendar/combined',
  },
  SETTINGS: {
    BASE: '/api/settings',
    ZEN_MODE: '/api/settings/zen-mode',
  },
  FACIAL_ANALYSIS: {
    ANALYZE: '/api/facial-analysis/analyze',
  },
};

export const STORAGE_KEYS = {
  POMODORO: POMODORO.STORAGE_KEY,
  FACIAL_ANALYSIS_INTERVAL: FACIAL_ANALYSIS.STORAGE_KEY,
};

export const UI = {
  ZEN_MODE_STATUS_MESSAGE_DURATION: 3000,
  MODAL_ANIMATION_DURATION: 300,
  FOCUS_DELAY: 100,
};

export const DATE_FORMATS = {
  DISPLAY: 'MMM D, YYYY',
  FULL: 'MMMM D, YYYY',
  TIME: 'h:mm A',
  DATETIME: 'MMM D, YYYY h:mm A',
};
