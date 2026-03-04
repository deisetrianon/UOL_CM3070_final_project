import { google } from 'googleapis';

class GmailService {
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
      
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      throw error;
    }
  }

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

  async getLabels(accessToken, refreshToken) {
    this.setCredentials(accessToken, refreshToken);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await gmail.users.labels.list({
        userId: 'me'
      });

      if (!response.data.labels || response.data.labels.length === 0) {
        return { labels: [] };
      }

      const labels = response.data.labels
        .filter(label => label.labelListVisibility !== 'hide')
        .map(label => ({
          id: label.id,
          name: label.name,
          type: label.type || 'user', // 'system' or 'user'
          messageListVisibility: label.messageListVisibility,
          labelListVisibility: label.labelListVisibility,
          color: label.color
        }));

      const essentialLabelIds = ['TRASH', 'SPAM'];
      const existingLabelIds = labels.map(l => l.id);
      
      essentialLabelIds.forEach(labelId => {
        if (!existingLabelIds.includes(labelId)) {
          const originalLabel = response.data.labels.find(l => l.id === labelId);
          if (originalLabel) {
            labels.push({
              id: originalLabel.id,
              name: originalLabel.name,
              type: originalLabel.type || 'system',
              messageListVisibility: originalLabel.messageListVisibility,
              labelListVisibility: originalLabel.labelListVisibility || 'show',
              color: originalLabel.color
            });
          }
        }
      });

      return { labels };
    } catch (error) {
      console.error('[Gmail] Error fetching labels:', error.message);
      
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      throw error;
    }
  }

  parseEmailMetadata(message) {
    const headers = message.payload?.headers || [];
    
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const fromHeader = getHeader('From');
    const fromMatch = fromHeader.match(/^(?:"?(.+?)"?\s*)?<?([^<>]+@[^<>]+)>?$/);
    const senderName = fromMatch?.[1]?.trim() || fromMatch?.[2] || fromHeader;
    const senderEmail = fromMatch?.[2] || fromHeader;

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

      const replyHeaders = [
        fromHeader,
        `To: ${replyTo}`,
        `Subject: ${replySubject}`
      ];

      if (replyCc) replyHeaders.push(`Cc: ${replyCc}`);
      
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
