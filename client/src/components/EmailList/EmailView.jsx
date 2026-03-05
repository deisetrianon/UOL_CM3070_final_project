/**
 * Email View component.
 * Detailed view of a selected email with full content, headers, and action buttons.
 * Displays email body, attachments, and provides reply, reply all, delete, and star actions.
 * 
 * @module components/EmailList/EmailView
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.email - Email object to display
 * @param {string|null} props.fullEmailContent - Full email HTML content
 * @param {boolean} props.loadingEmail - Whether email content is loading
 * @param {string} props.activeLabel - Currently active email label
 * @param {Array} props.labels - Available email labels
 * @param {Function} props.onBack - Callback to go back to email list
 * @param {Function} props.onReply - Callback when reply is clicked
 * @param {Function} props.onReplyAll - Callback when reply all is clicked
 * @param {Function} props.onToggleStar - Callback when star is toggled
 * @param {Function} props.onMarkAsRead - Callback when email is marked as read
 * @param {Function} props.onDelete - Callback when email is deleted
 * @returns {JSX.Element} Email View component
 */

import { formatDate } from '../../utils/date';
import starredFilledIcon from '../../assets/icons/starred-filled.png';
import starredIcon from '../../assets/icons/starred.png';
import trashIcon from '../../assets/icons/trash.png';
import './EmailList.css';

function EmailView({ 
  email, 
  fullEmailContent, 
  loadingEmail, 
  activeLabel, 
  labels,
  onBack,
  onReply,
  onReplyAll,
  onToggleStar,
  onMarkAsRead,
  onDelete
}) {
  return (
    <div className="email-view">
      <div className="email-view-header">
        <button 
          className="back-to-list"
          onClick={onBack}
          aria-label={`Back to ${labels.find(l => l.id === activeLabel)?.name || 'Inbox'}`}
        >
          ← Back to {labels.find(l => l.id === activeLabel)?.name || 'Inbox'}
        </button>
      </div>
      <div className="email-view-content">
        <div className="email-view-title">
          <h2>{email.subject}</h2>
          <div className="email-view-labels">
            {email.isImportant && <span className="label-badge important">Important</span>}
            {email.isStarred && (
              <span className="label-badge starred">
                <img src={starredFilledIcon} alt="Starred" className="star-icon-inline" /> Starred
              </span>
            )}
          </div>
        </div>
        <div className="email-view-meta">
          <div className="email-view-from">
            <div className="sender-avatar-large">
              {email.from?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="sender-details">
              <span className="sender-name-large">{email.from?.name}</span>
              <span className="sender-email-large">{email.from?.email}</span>
            </div>
          </div>
          <div className="email-view-actions">
            <button
              className="action-btn reply-action"
              onClick={() => onReply(email, false)}
              title="Reply"
              aria-label="Reply to email"
            >
              ↪ Reply
            </button>
            <button
              className="action-btn reply-all-action"
              onClick={() => onReply(email, true)}
              title="Reply All"
              aria-label="Reply all to email"
            >
              ↪ Reply All
            </button>
            <button
              className={`action-btn star-action ${email.isStarred ? 'starred' : ''}`}
              onClick={() => onToggleStar(email.id, email.isStarred)}
              title={email.isStarred ? 'Remove star' : 'Add star'}
              aria-label={email.isStarred ? 'Remove star' : 'Add star'}
            >
              {email.isStarred ? (
                <><img src={starredFilledIcon} alt="Starred" className="star-icon-inline" /> Starred</>
              ) : (
                <><img src={starredIcon} alt="Star" className="star-icon-inline" /> Star</>
              )}
            </button>
            {email.isUnread && (
              <button
                className="action-btn mark-read-action"
                onClick={() => onMarkAsRead(email.id)}
                title="Mark as read"
                aria-label="Mark email as read"
              >
                ✓ Mark as read
              </button>
            )}
            <button
              className="action-btn delete-action"
              onClick={() => onDelete(email.id)}
              title="Delete email"
              aria-label="Delete email"
            >
              <img src={trashIcon} alt="Delete" className="trash-icon-inline" /> Delete
            </button>
          </div>
          <div className="email-view-date">
            <span className="date-full">
              {formatDate(email.date, 'dddd, MMMM D, YYYY')}
            </span>
            <span className="time-full">
              {formatDate(email.date, 'h:mm A')}
            </span>
          </div>
        </div>
        <div className="email-view-body">
          {loadingEmail ? (
            <div className="email-loading">
              <div className="loading-spinner"></div>
              <p>Loading email content...</p>
            </div>
          ) : fullEmailContent?.bodyHtml ? (
            <div 
              className="email-body-html"
              dangerouslySetInnerHTML={{ __html: fullEmailContent.bodyHtml }}
            />
          ) : fullEmailContent?.body ? (
            <div className="email-body-text">
              {fullEmailContent.body.split('\n').map((line, index) => (
                <p key={index}>{line || '\u00A0'}</p>
              ))}
            </div>
          ) : (
            <p className="email-snippet-fallback">{email.snippet}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailView;
