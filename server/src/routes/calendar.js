/**
 * Calendar routes.
 * Handles Google Calendar integration and combined calendar view with tasks.
 * 
 * @module routes/calendar
 */

import { Router } from 'express';
import calendarService from '../services/calendarService.js';
import Task from '../models/Task.js';
import { requireAuth, asyncHandler, sendSuccess, sendError, sendValidationError, sendUnauthorized } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/index.js';

const router = Router();

const deadlineToUtcDateString = (deadline) => {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const handleCalendarError = (error, res) => {
  if (error.message === 'TOKEN_EXPIRED') {
    return sendUnauthorized(res, 'Session expired. Please log in again to refresh your calendar access');
  }
  if (error.message === 'CALENDAR_API_NOT_ENABLED') {
    return sendError(res, 'Calendar API not enabled. Please enable the Google Calendar API in Google Cloud Console', HTTP_STATUS.FORBIDDEN);
  }
  if (error.message === 'INSUFFICIENT_SCOPES') {
    return sendError(res, 'Insufficient permissions. Please log out and log in again to grant calendar access', HTTP_STATUS.FORBIDDEN);
  }
  return null;
};

const updateAccessToken = async (userId, newToken) => {
  try {
    const User = (await import('../models/User.js')).default;
    await User.findByIdAndUpdate(userId, {
      'tokens.accessToken': newToken
    });
  } catch (updateError) {
    console.warn('[Calendar] Failed to update access token:', updateError.message);
  }
};

router.get('/events', requireAuth, asyncHandler(async (req, res) => {
  const { timeMin, timeMax, maxResults, calendarId } = req.query;
  
  const options = {
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax || null,
    maxResults: parseInt(maxResults) || 250,
    calendarId: calendarId || 'primary'
  };

  try {
    const result = await calendarService.getEvents(
      req.user.accessToken,
      req.user.refreshToken,
      options
    );

    if (result.accessToken) {
      await updateAccessToken(req.user.id, result.accessToken);
    }

    sendSuccess(res, {
      events: result.events,
      nextPageToken: result.nextPageToken,
      timeZone: result.timeZone
    });
  } catch (error) {
    console.error('[Calendar Route] Error fetching events:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    const handled = handleCalendarError(error, res);
    if (!handled) {
      sendError(res, 'Failed to fetch calendar events', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}));

router.get('/combined', requireAuth, asyncHandler(async (req, res) => {
  const { timeMin, timeMax } = req.query;
  
  const now = new Date();
  const defaultTimeMin = timeMin || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const defaultTimeMax = timeMax || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  let calendarEvents = [];
  let calendarError = null;

  try {
    const calendarResult = await calendarService.getAllEvents(
      req.user.accessToken,
      req.user.refreshToken,
      {
        timeMin: defaultTimeMin,
        timeMax: defaultTimeMax,
        maxResults: 250
      }
    );
    calendarEvents = calendarResult.events || [];

    if (calendarResult.accessToken) {
      await updateAccessToken(req.user.id, calendarResult.accessToken);
    }
  } catch (error) {
    calendarError = error;
    console.error('[Calendar] Error fetching Google Calendar events:', error.message);
  }

  let tasks = [];

  try {
    const rangeStart = new Date(defaultTimeMin);
    const rangeEnd = new Date(defaultTimeMax);
    const DAY_MS = 24 * 60 * 60 * 1000;
    const bufferedStart = new Date(rangeStart.getTime() - DAY_MS);
    const bufferedEnd = new Date(rangeEnd.getTime() + DAY_MS);

    tasks = await Task.find({
      userId: req.user.id,
      deadline: {
        $gte: bufferedStart,
        $lte: bufferedEnd
      }
    }).sort({ deadline: 1 }).lean();
  } catch (taskError) {
    console.error('[Calendar] Error fetching tasks:', taskError.message);
    tasks = [];
  }

  const taskEvents = tasks.map(task => ({
    id: `task-${task._id}`,
    title: task.title,
    description: task.description || '',
    deadlineDate: deadlineToUtcDateString(task.deadline),
    start: new Date(task.deadline),
    end: new Date(new Date(task.deadline).getTime() + 60 * 60 * 1000),
    isAllDay: false,
    location: '',
    organizer: '',
    attendees: [],
    isGoogleMeet: false,
    meetLink: null,
    status: task.status,
    htmlLink: null,
    colorId: null,
    reminders: null,
    recurrence: [],
    isTask: true,
    taskId: task._id.toString(),
    taskPriority: task.priority,
    taskStatus: task.status,
    taskIsUrgent: task.isUrgent || false
  }));

  const allEvents = [...calendarEvents, ...taskEvents].sort((a, b) => {
    try {
      return new Date(a.start) - new Date(b.start);
    } catch (e) {
      console.warn('[Calendar] Error sorting events:', e.message);
      return 0;
    }
  });

  try {
    sendSuccess(res, {
      events: allEvents,
      calendarEventsCount: calendarEvents.length,
      taskEventsCount: taskEvents.length,
      timeMin: defaultTimeMin,
      timeMax: defaultTimeMax,
      calendarError: calendarError ? {
        message: calendarError.message,
        code: calendarError.code,
        status: calendarError.response?.status
      } : null
    });
  } catch (jsonError) {
    console.error('[Calendar] Error sending JSON response:', jsonError);
    sendError(res, 'Failed to format response', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}));

router.get('/calendars', requireAuth, asyncHandler(async (req, res) => {
  try {
    const result = await calendarService.getCalendarList(
      req.user.accessToken,
      req.user.refreshToken
    );

    if (result.accessToken) {
      await updateAccessToken(req.user.id, result.accessToken);
      sendSuccess(res, { calendars: result.calendars });
    } else {
      sendSuccess(res, { calendars: result });
    }
  } catch (error) {
    console.error('[Calendar Route] Error fetching calendar list:', error.message);
    const handled = handleCalendarError(error, res);
    if (!handled) {
      sendError(res, 'Failed to fetch calendar list', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}));

export default router;
