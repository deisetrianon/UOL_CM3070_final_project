import { Router } from 'express';
import calendarService from '../services/calendarService.js';
import Task from '../models/Task.js';

const router = Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      message: 'Please log in to access this resource'
    });
  }
  next();
};

/**
 * GET /api/calendar/events
 * Fetching user's calendar events from Google Calendar
 * 
 * Query parameters:
 * - timeMin: ISO date string (optional, defaults to now)
 * - timeMax: ISO date string (optional)
 * - maxResults: number (optional, default: 250)
 * - calendarId: string (optional, default: 'primary')
 */
router.get('/events', requireAuth, async (req, res) => {
  try {
    const { timeMin, timeMax, maxResults, calendarId } = req.query;
    
    const options = {
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || null,
      maxResults: parseInt(maxResults) || 250,
      calendarId: calendarId || 'primary'
    };

    const result = await calendarService.getEvents(
      req.user.accessToken,
      req.user.refreshToken,
      options
    );

    if (result.accessToken) {
      try {
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(req.user.id, {
          'tokens.accessToken': result.accessToken
        });
      } catch (updateError) {
        console.warn('[Calendar] Failed to update access token:', updateError.message);
      }
    }

    res.json({
      success: true,
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
    
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        message: 'Please log in again to refresh your calendar access'
      });
    }

    if (error.message === 'CALENDAR_API_NOT_ENABLED') {
      return res.status(403).json({
        success: false,
        error: 'Calendar API not enabled',
        message: 'Please enable the Google Calendar API in Google Cloud Console'
      });
    }

    if (error.message === 'INSUFFICIENT_SCOPES') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Please log out and log in again to grant calendar access'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar events',
      message: error.message
    });
  }
});

/**
 * GET /api/calendar/combined
 * Fetching combined calendar events (Google Calendar + Tasks with deadlines)
 * 
 * Query parameters:
 * - timeMin: ISO date string (optional, defaults to start of current month)
 * - timeMax: ISO date string (optional, defaults to end of current month)
 */
router.get('/combined', requireAuth, async (req, res) => {
  try {
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
        try {
          const User = (await import('../models/User.js')).default;
          await User.findByIdAndUpdate(req.user.id, {
            'tokens.accessToken': calendarResult.accessToken
          });
        } catch (updateError) {
          console.warn('[Calendar] Failed to update access token:', updateError.message);
        }
      }
    } catch (error) {
      calendarError = error;
      console.error('[Calendar] Error fetching Google Calendar events:', error.message);
    }

    let tasks = [];

    try {
      tasks = await Task.find({
        userId: req.user.id,
        deadline: {
          $gte: new Date(defaultTimeMin),
          $lte: new Date(defaultTimeMax)
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
      start: new Date(task.deadline),
      end: new Date(new Date(task.deadline).getTime() + 60 * 60 * 1000), // 1 hour duration
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

    // Combining and sorting by start time
    const allEvents = [...calendarEvents, ...taskEvents].sort((a, b) => {
      try {
        return new Date(a.start) - new Date(b.start);
      } catch (e) {
        console.warn('[Calendar] Error sorting events:', e.message);
        return 0;
      }
    });

    try {
      res.json({
        success: true,
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
      res.status(500).json({
        success: false,
        error: 'Failed to format response',
        message: jsonError.message
      });
    }
  } catch (error) {
    console.error('[Calendar Route] Error fetching combined events:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.message === 'CALENDAR_API_NOT_ENABLED') {
      return res.status(403).json({
        success: false,
        error: 'Calendar API not enabled',
        message: 'Please enable the Google Calendar API in Google Cloud Console'
      });
    }

    if (error.message === 'INSUFFICIENT_SCOPES') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Please log out and log in again to grant calendar access'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch combined calendar events',
      message: error.message
    });
  }
});

/**
 * GET /api/calendar/calendars
 * Fetching list of user's calendars
 */
router.get('/calendars', requireAuth, async (req, res) => {
  try {
    const result = await calendarService.getCalendarList(
      req.user.accessToken,
      req.user.refreshToken
    );

    if (result.accessToken) {
      try {
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(req.user.id, {
          'tokens.accessToken': result.accessToken
        });
      } catch (updateError) {
        console.warn('[Calendar] Failed to update access token:', updateError.message);
      }
      
      res.json({
        success: true,
        calendars: result.calendars
      });
    } else {
      res.json({
        success: true,
        calendars: result
      });
    }
  } catch (error) {
    console.error('[Calendar Route] Error fetching calendar list:', error.message);
    
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        message: 'Please log in again'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar list',
      message: error.message
    });
  }
});

export default router;
