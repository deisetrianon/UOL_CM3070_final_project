import { google } from 'googleapis';

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
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {Object} options
   * @returns {Promise<Object>}
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

      // Fetching full details for each message
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
      
      // Handling token expiry
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      throw error;
    }
  }

  /**
   * Get a single email with full body content
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {string} messageId
   * @returns {Promise<Object>}
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
   * @param {string} accessToken
   * @param {string} refreshToken
   * @returns {Promise<Object>}
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

    // Parsing sender name and email
    const fromHeader = getHeader('From');
    const fromMatch = fromHeader.match(/^(?:"?(.+?)"?\s*)?<?([^<>]+@[^<>]+)>?$/);
    const senderName = fromMatch?.[1]?.trim() || fromMatch?.[2] || fromHeader;
    const senderEmail = fromMatch?.[2] || fromHeader;

    // Parsing date
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

  /**
   * Marking an email as read (removing UNREAD label)
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {string} messageId
   * @returns {Promise<Object>}
   */
  async markAsRead(accessToken, refreshToken, messageId) {
    this.setCredentials(accessToken, refreshToken);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });

      return {
        id: response.data.id,
        labelIds: response.data.labelIds,
        threadId: response.data.threadId
      };
    } catch (error) {
      console.error('[Gmail] Error marking email as read:', error.message);
      
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      throw error;
    }
  }

  /**
   * Toggling star on an email (adding/removing STARRED label)
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {string} messageId
   * @param {boolean} isStarred - Current starred state
   * @returns {Promise<Object>}
   */
  async toggleStar(accessToken, refreshToken, messageId, isStarred) {
    this.setCredentials(accessToken, refreshToken);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const requestBody = isStarred
        ? { removeLabelIds: ['STARRED'] }
        : { addLabelIds: ['STARRED'] };

      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody
      });

      return {
        id: response.data.id,
        labelIds: response.data.labelIds,
        threadId: response.data.threadId,
        isStarred: !isStarred
      };
    } catch (error) {
      console.error('[Gmail] Error toggling star:', error.message);
      
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      throw error;
    }
  }

  /**
   * Sending an email
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {Object} emailData - { to, subject, body, cc, bcc, replyTo, fromName, fromEmail }
   * @returns {Promise<Object>}
   */
  async sendEmail(accessToken, refreshToken, emailData) {
    this.setCredentials(accessToken, refreshToken);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const { to, subject, body, cc, bcc, replyTo, fromName, fromEmail } = emailData;

      let senderEmail = fromEmail;
      if (!senderEmail) {
        const profile = await this.getProfile(accessToken, refreshToken);
        senderEmail = profile.emailAddress;
      }

      const fromHeader = fromName 
        ? `From: "${fromName}" <${senderEmail}>`
        : `From: ${senderEmail}`;

      const headers = [
        fromHeader,
        `To: ${to}`,
        `Subject: ${subject}`
      ];

      if (cc) headers.push(`Cc: ${cc}`);
      if (bcc) headers.push(`Bcc: ${bcc}`);
      if (replyTo) headers.push(`Reply-To: ${replyTo}`);

      headers.push('Content-Type: text/html; charset=utf-8');
      headers.push('');

      const rawMessage = [
        ...headers,
        body
      ].join('\n');

      // Encoding the message in base64url format
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return {
        id: response.data.id,
        threadId: response.data.threadId,
        labelIds: response.data.labelIds
      };
    } catch (error) {
      console.error('[Gmail] Error sending email:', error.message);
      
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      throw error;
    }
  }

  /**
   * Replying to an email
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {string} messageId - ID of the email to reply to
   * @param {Object} replyData - { body, replyAll, fromName, fromEmail }
   * @returns {Promise<Object>}
   */
  async replyToEmail(accessToken, refreshToken, messageId, replyData) {
    this.setCredentials(accessToken, refreshToken);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      let senderEmail = replyData.fromEmail;
      if (!senderEmail) {
        const profile = await this.getProfile(accessToken, refreshToken);
        senderEmail = profile.emailAddress;
      }

      const originalMessage = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Message-ID', 'References', 'In-Reply-To']
      });

      const headers = originalMessage.data.payload?.headers || [];
      const getHeader = (name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header?.value || '';
      };

      const originalSubject = getHeader('Subject');
      const originalFrom = getHeader('From');
      const originalTo = getHeader('To');
      const originalMessageId = getHeader('Message-ID');
      const originalReferences = getHeader('References');

      let replyTo = originalFrom;
      let replyCc = '';
      
      if (replyData.replyAll) {
        const originalCc = getHeader('Cc') || '';
        
        // Building reply-all recipients
        const allRecipients = [
          ...originalTo.split(',').map(e => e.trim()),
          ...originalCc.split(',').map(e => e.trim())
        ].filter(email => email && !email.toLowerCase().includes(senderEmail.toLowerCase()));
        
        replyTo = originalFrom;
        replyCc = allRecipients.join(', ');
      }

      const replySubject = originalSubject.startsWith('Re:') 
        ? originalSubject 
        : `Re: ${originalSubject}`;

      const fromHeader = replyData.fromName 
        ? `From: "${replyData.fromName}" <${senderEmail}>`
        : `From: ${senderEmail}`;

      // Building email headers
      const replyHeaders = [
        fromHeader,
        `To: ${replyTo}`,
        `Subject: ${replySubject}`
      ];

      if (replyCc) replyHeaders.push(`Cc: ${replyCc}`);
      
      // Adding threading headers
      if (originalMessageId) {
        replyHeaders.push(`In-Reply-To: ${originalMessageId}`);
        replyHeaders.push(`References: ${originalReferences ? `${originalReferences} ` : ''}${originalMessageId}`);
      }

      replyHeaders.push('Content-Type: text/html; charset=utf-8');
      replyHeaders.push(''); 

      const rawMessage = [
        ...replyHeaders,
        replyData.body
      ].join('\n');

      // Encoding the message in base64url format
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: originalMessage.data.threadId // Threading the reply
        }
      });

      return {
        id: response.data.id,
        threadId: response.data.threadId,
        labelIds: response.data.labelIds
      };
    } catch (error) {
      console.error('[Gmail] Error replying to email:', error.message);
      
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      throw error;
    }
  }

  /**
   * Deleting an email (move to trash)
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {string} messageId
   * @returns {Promise<Object>}
   */
  async deleteEmail(accessToken, refreshToken, messageId) {
    this.setCredentials(accessToken, refreshToken);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await gmail.users.messages.trash({
        userId: 'me',
        id: messageId
      });

      return {
        id: response.data.id,
        labelIds: response.data.labelIds,
        threadId: response.data.threadId
      };
    } catch (error) {
      console.error('[Gmail] Error deleting email:', error.message);
      
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      throw error;
    }
  }
}

export default new GmailService();
