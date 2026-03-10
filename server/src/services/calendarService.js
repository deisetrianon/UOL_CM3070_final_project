/**
 * Google Calendar service.
 * Handles Google Calendar API operations for fetching events and meetings.
 * Manages OAuth2 authentication and token refresh for Calendar API access.
 * 
 * @module services/calendarService
 */

import { google } from 'googleapis';

/**
 * Google Calendar service class for interacting with Calendar API.
 */
class CalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
  }

  setCredentials(accessToken, refreshToken = null) {
    const credentials = { access_token: accessToken };
    if (refreshToken) {
      credentials.refresh_token = refreshToken;
    }
    this.oauth2Client.setCredentials(credentials);
  }

  async refreshAccessToken(refreshToken) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials.access_token;
  }

  async getEvents(accessToken, refreshToken, options = {}) {
    const {
      timeMin = new Date().toISOString(),
      timeMax = null,
      maxResults = 250,
      singleEvents = true,
      orderBy = 'startTime',
      calendarId = 'primary'
    } = options;

    this.setCredentials(accessToken, refreshToken);
    
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const params = {
        calendarId,
        timeMin,
        singleEvents,
        maxResults,
        orderBy
      };

      if (timeMax) {
        params.timeMax = timeMax;
      }

      const response = await calendar.events.list(params);

      if (!response.data.items || response.data.items.length === 0) {
        return {
          events: [],
          nextPageToken: null,
          timeZone: response.data.timeZone || 'UTC'
        };
      }

      const events = response.data.items.map(event => this.parseEvent(event));

      return {
        events,
        nextPageToken: response.data.nextPageToken || null,
        timeZone: response.data.timeZone || 'UTC'
      };
    } catch (error) {
      console.error('[CalendarService] Error fetching events:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack
      });

      if (error.code === 401 || error.response?.status === 401) {
        try {
          const newAccessToken = await this.refreshAccessToken(refreshToken);
          this.setCredentials(newAccessToken, refreshToken);
          const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
          
          const params = {
            calendarId,
            timeMin,
            singleEvents,
            maxResults,
            orderBy
          };
          if (timeMax) params.timeMax = timeMax;

          const response = await calendar.events.list(params);
          const events = (response.data.items || []).map(event => this.parseEvent(event));
          
          return {
            events,
            nextPageToken: response.data.nextPageToken || null,
            timeZone: response.data.timeZone || 'UTC',
            accessToken: newAccessToken
          };
        } catch (refreshError) {
          console.error('[CalendarService] Token refresh failed:', refreshError.message);
          throw new Error('TOKEN_EXPIRED');
        }
      }

      if (error.response?.status === 403) {
        const errorData = error.response.data;
        const errorMessage = errorData?.error?.message || '';
        const errorReason = errorData?.error?.errors?.[0]?.reason || '';

        if (errorMessage.includes('Calendar API') || 
            errorMessage.includes('calendar') ||
            errorReason === 'accessNotConfigured' ||
            errorReason === 'forbidden') {
          throw new Error('CALENDAR_API_NOT_ENABLED');
        }
        
        if (errorMessage.includes('insufficient authentication scopes') ||
            errorMessage.includes('insufficient') ||
            errorReason === 'insufficientPermissions') {
          throw new Error('INSUFFICIENT_SCOPES');
        }
      }

      if (error.response?.status === 404) {
        const errorData = error.response.data;
        const errorMessage = errorData?.error?.message || '';
        if (errorMessage.includes('Calendar API') || errorMessage.includes('not found')) {
          throw new Error('CALENDAR_API_NOT_ENABLED');
        }
      }

      throw error;
    }
  }

  parseEvent(event) {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    const isAllDay = !event.start?.dateTime;

    const hasMeetLink = !!(event.hangoutLink || 
                       (event.conferenceData && event.conferenceData.entryPoints?.some(ep => ep.entryPointType === 'video')));

    return {
      id: event.id,
      title: event.summary || '(No Title)',
      description: event.description || '',
      start: new Date(start),
      end: new Date(end),
      isAllDay,
      location: event.location || '',
      organizer: event.organizer?.email || '',
      attendees: (event.attendees || []).map(attendee => ({
        email: attendee.email,
        displayName: attendee.displayName || attendee.email,
        responseStatus: attendee.responseStatus || 'needsAction'
      })),
      isGoogleMeet: hasMeetLink,
      meetLink: event.hangoutLink || 
                (event.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri),
      status: event.status,
      htmlLink: event.htmlLink,
      colorId: event.colorId,
      reminders: event.reminders,
      recurrence: event.recurrence || []
    };
  }

  async getAllEvents(accessToken, refreshToken, options = {}) {
    const {
      timeMin = new Date().toISOString(),
      timeMax = null,
      maxResults = 250,
      singleEvents = true,
      orderBy = 'startTime'
    } = options;

    try {
      const calendarListResult = await this.getCalendarList(accessToken, refreshToken);
      const calendars = calendarListResult.calendars || [];
      
      let updatedAccessToken = calendarListResult.accessToken;

      const eventPromises = calendars.map(async (cal) => {
        try {
          const eventsResult = await this.getEvents(
            updatedAccessToken || accessToken,
            refreshToken,
            {
              timeMin,
              timeMax,
              maxResults,
              singleEvents,
              orderBy,
              calendarId: cal.id
            }
          );
          
          if (eventsResult.accessToken) {
            updatedAccessToken = eventsResult.accessToken;
          }
          
          return (eventsResult.events || []).map(event => ({
            ...event,
            calendarId: cal.id,
            calendarName: cal.summary,
            calendarColor: cal.backgroundColor
          }));
        } catch (error) {
          console.warn(`[CalendarService] Failed to fetch events from calendar ${cal.summary}:`, error.message);
          return [];
        }
      });

      const allEventsArrays = await Promise.all(eventPromises);
      const allEvents = allEventsArrays.flat();

      allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

      return {
        events: allEvents,
        nextPageToken: null,
        timeZone: 'UTC',
        accessToken: updatedAccessToken
      };
    } catch (error) {
      console.error('[CalendarService] Error fetching all events:', error.message);
      throw error;
    }
  }

  async getCalendarList(accessToken, refreshToken) {
    this.setCredentials(accessToken, refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.calendarList.list();
      const calendars = (response.data.items || []).map(cal => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        timeZone: cal.timeZone,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
        primary: cal.primary || false
      }));
      return { calendars };
    } catch (error) {
      if (error.code === 401) {
        try {
          const newAccessToken = await this.refreshAccessToken(refreshToken);
          this.setCredentials(newAccessToken, refreshToken);
          const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
          const response = await calendar.calendarList.list();
          return {
            calendars: (response.data.items || []).map(cal => ({
              id: cal.id,
              summary: cal.summary,
              description: cal.description,
              timeZone: cal.timeZone,
              backgroundColor: cal.backgroundColor,
              foregroundColor: cal.foregroundColor,
              primary: cal.primary || false
            })),
            accessToken: newAccessToken
          };
        } catch (refreshError) {
          throw new Error('TOKEN_EXPIRED');
        }
      }
      throw error;
    }
  }
}

const calendarService = new CalendarService();
export { CalendarService };
export default calendarService;
