/**
 * Email Item component.
 * Individual email item in the email list.
 * Displays sender, subject, snippet, date, and action buttons (star, delete).
 * 
 * @module components/EmailList/EmailItem
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.email - Email object
 * @param {boolean} props.isSelected - Whether the email is selected
 * @param {Function} props.onSelect - Callback when email is selected/deselected
 * @param {Function} props.onClick - Callback when email is clicked
 * @param {Function} props.onToggleStar - Callback when star button is clicked
 * @param {Function} props.onDelete - Callback when delete button is clicked
 * @returns {JSX.Element} Email Item component
 */

import { formatDate } from '../../utils/date';
import starredFilledIcon from '../../assets/icons/starred-filled.png';
import starredIcon from '../../assets/icons/starred.png';
import trashIcon from '../../assets/icons/trash.png';
import './EmailList.css';

function EmailItem({ 
  email, 
  isSelected, 
  onSelect, 
  onClick, 
  onToggleStar,
  onDelete
}) {
  return (
    <li 
      className={`email-item ${email.isUnread ? 'unread' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Email from ${email.from?.name || email.from?.email || 'Unknown'}: ${email.subject || 'No subject'}`}
    >
      <div className="email-checkbox" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select email from ${email.from?.name || email.from?.email || 'Unknown'}`}
        />
      </div>
      <div className="email-actions-inline">
        <button 
          className={`star-btn ${email.isStarred ? 'starred' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
          title={email.isStarred ? 'Remove star' : 'Add star'}
        >
          {email.isStarred ? (
            <img src={starredFilledIcon} alt="Starred" className="star-icon-inline" />
          ) : (
            <img src={starredIcon} alt="Star" className="star-icon-inline" />
          )}
        </button>
        {onDelete && (
          <button 
            className="delete-btn-inline"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(email.id);
            }}
            title="Delete email"
          >
            <img src={trashIcon} alt="Delete" className="trash-icon-inline" />
          </button>
        )}
      </div>
      <div className="email-sender">
        <span className={email.isUnread ? 'unread' : ''}>
          {email.from?.name || email.from?.email}
        </span>
      </div>
      <div className="email-content">
        <span className={`email-subject ${email.isUnread ? 'unread' : ''}`}>
          {email.subject}
        </span>
        <span className="email-snippet">
          {email.snippet}
        </span>
      </div>
      <div className="email-meta">
        {email.isImportant && (
          <span className="important-badge">🏷️</span>
        )}
        <span className="email-date">{formatDate(email.date)}</span>
      </div>
    </li>
  );
}

export default EmailItem;
