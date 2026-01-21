import { google } from 'googleapis';

/**
 * Gmail Service
 * Handles all Gmail API interactions for fetching user emails
 */
class GmailService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
  }

  /**
   * Set credentials for the OAuth2 client
   * @param {string} accessToken - User's access token
   * @param {string} refreshToken - User's refresh token (optional)
   */
  setCredentials(accessToken, refreshToken = null) {
    const credentials = { access_token: accessToken };
    if (refreshToken) {
      credentials.refresh_token = refreshToken;
    }
    this.oauth2Client.setCredentials(credentials);
  }

  /**
   * Fetch user's emails from Gmail
   * @param {string} accessToken - User's access token
   * @param {string} refreshToken - User's refresh token
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - List of emails with metadata
   */
  async getEmails(accessToken, refreshToken, options = {}) {
    const {
      maxResults = 20,
      labelIds = ['INBOX'],
      query = '',
      pageToken = null
    } = options;

    this.setCredentials(accessToken, refreshToken);
    
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      // First, get list of message IDs
      const listParams = {
        userId: 'me',
        maxResults,
        labelIds
      };

      if (query) listParams.q = query;
      if (pageToken) listParams.pageToken = pageToken;

      const listResponse = await gmail.users.messages.list(listParams);
      
      if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
        return {
          emails: [],
          nextPageToken: null,
          resultSizeEstimate: 0
        };
      }

      // Fetch full details for each message
      const emailPromises = listResponse.data.messages.map(async (message) => {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date', 'Reply-To']
        });

        return this.parseEmailMetadata(fullMessage.data);
      });

      const emails = await Promise.all(emailPromises);

      return {
        emails,
        nextPageToken: listResponse.data.nextPageToken || null,
        resultSizeEstimate: listResponse.data.resultSizeEstimate || emails.length
      };
    } catch (error) {
      console.error('[Gmail] Error fetching emails:', error.message);
      
      // Handle token expiry
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      throw error;
    }
  }

  /**
   * Get a single email with full body content
   * @param {string} accessToken - User's access token
   * @param {string} refreshToken - User's refresh token
   * @param {string} messageId - Gmail message ID
   * @returns {Promise<Object>} - Full email data
   */
  async getEmail(accessToken, refreshToken, messageId) {
    this.setCredentials(accessToken, refreshToken);
    
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      return this.parseFullEmail(response.data);
    } catch (error) {
      console.error('[Gmail] Error fetching email:', error.message);
      throw error;
    }
  }

  /**
   * Get user's Gmail profile
   * @param {string} accessToken - User's access token
   * @param {string} refreshToken - User's refresh token
   * @returns {Promise<Object>} - Gmail profile
   */
  async getProfile(accessToken, refreshToken) {
    this.setCredentials(accessToken, refreshToken);
    
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await gmail.users.getProfile({
        userId: 'me'
      });

      return {
        emailAddress: response.data.emailAddress,
        messagesTotal: response.data.messagesTotal,
        threadsTotal: response.data.threadsTotal,
        historyId: response.data.historyId
      };
    } catch (error) {
      console.error('[Gmail] Error fetching profile:', error.message);
      throw error;
    }
  }

  /**
   * Parse email metadata from Gmail API response
   * @param {Object} message - Raw Gmail message
   * @returns {Object} - Parsed email metadata
   */
  parseEmailMetadata(message) {
    const headers = message.payload?.headers || [];
    
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    // Parse sender name and email
    const fromHeader = getHeader('From');
    const fromMatch = fromHeader.match(/^(?:"?(.+?)"?\s*)?<?([^<>]+@[^<>]+)>?$/);
    const senderName = fromMatch?.[1]?.trim() || fromMatch?.[2] || fromHeader;
    const senderEmail = fromMatch?.[2] || fromHeader;

    // Parse date
    const dateStr = getHeader('Date');
    const date = dateStr ? new Date(dateStr) : new Date();

    return {
      id: message.id,
      threadId: message.threadId,
      snippet: message.snippet || '',
      subject: getHeader('Subject') || '(No Subject)',
      from: {
        name: senderName,
        email: senderEmail
      },
      to: getHeader('To'),
      date: date.toISOString(),
      timestamp: date.getTime(),
      labelIds: message.labelIds || [],
      isUnread: message.labelIds?.includes('UNREAD') || false,
      isStarred: message.labelIds?.includes('STARRED') || false,
      isImportant: message.labelIds?.includes('IMPORTANT') || false
    };
  }

  /**
   * Parse full email content from Gmail API response
   * @param {Object} message - Raw Gmail message with full content
   * @returns {Object} - Parsed email with body
   */
  parseFullEmail(message) {
    const metadata = this.parseEmailMetadata(message);
    
    // Extract body content
    let body = '';
    let bodyHtml = '';

    const extractBody = (part) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.parts) {
        part.parts.forEach(extractBody);
      }
    };

    if (message.payload) {
      extractBody(message.payload);
    }

    return {
      ...metadata,
      body: body || bodyHtml,
      bodyHtml,
      sizeEstimate: message.sizeEstimate
    };
  }
}

export default new GmailService();
