/**
 * Email Header component.
 * Header bar for email list with label selection, bulk actions, and pagination controls.
 * Shows bulk action buttons when emails are selected, otherwise shows pagination controls.
 * 
 * @module components/EmailList/EmailHeader
 * @component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Email Header component
 */

import refreshIcon from '../../assets/icons/refresh.png';
import loadingIcon from '../../assets/icons/loading.png';
import starredFilledIcon from '../../assets/icons/starred-filled.png';
import starredIcon from '../../assets/icons/starred.png';
import trashIcon from '../../assets/icons/trash.png';
import './EmailList.css';

function EmailHeader({ 
  activeLabel, 
  labels, 
  filteredEmails,
  emails,
  selectedEmailIds, 
  currentPage,
  nextPageToken,
  totalEstimate,
  emailsPerPage,
  loading,
  startItem,
  endItem,
  onToggleSelectAll,
  onBulkMarkAsRead,
  onBulkToggleStar,
  onBulkDelete,
  onRefresh,
  onFirstPage,
  onPrevPage,
  onNextPage
}) {
  const allSelected = selectedEmailIds.size === filteredEmails.length && filteredEmails.length > 0;

  return (
    <div className="email-header">
      <div className="email-header-left">
        <h2>{labels.find(l => l.id === activeLabel)?.name || 'Inbox'}</h2>
        {filteredEmails.length > 0 && (
          <label className="select-all-checkbox">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              title={allSelected ? 'Deselect all' : 'Select all'}
              aria-label={allSelected ? 'Deselect all emails' : 'Select all emails'}
            />
            <span>Select all</span>
          </label>
        )}
      </div>
      {selectedEmailIds.size > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-actions-count">
            {selectedEmailIds.size} selected
          </span>
          <button
            className="bulk-action-btn mark-read"
            onClick={onBulkMarkAsRead}
            title="Mark as read"
            aria-label={`Mark ${selectedEmailIds.size} email${selectedEmailIds.size !== 1 ? 's' : ''} as read`}
          >
            ✓ Mark as read
          </button>
          <button
            className="bulk-action-btn star"
            onClick={() => onBulkToggleStar('star')}
            title="Star"
            aria-label={`Star ${selectedEmailIds.size} email${selectedEmailIds.size !== 1 ? 's' : ''}`}
          >
            <img src={starredFilledIcon} alt="Star" className="star-icon-inline" aria-hidden="true" /> Star
          </button>
          <button
            className="bulk-action-btn unstar"
            onClick={() => onBulkToggleStar('unstar')}
            title="Unstar"
            aria-label={`Unstar ${selectedEmailIds.size} email${selectedEmailIds.size !== 1 ? 's' : ''}`}
          >
            <img src={starredIcon} alt="Unstar" className="star-icon-inline" aria-hidden="true" /> Unstar
          </button>
          <button
            className="bulk-action-btn delete"
            onClick={onBulkDelete}
            title="Delete"
            aria-label={`Delete ${selectedEmailIds.size} email${selectedEmailIds.size !== 1 ? 's' : ''}`}
          >
            <img src={trashIcon} alt="Delete" className="trash-icon-inline" aria-hidden="true" /> Delete
          </button>
        </div>
      )}
      <div className="pagination-controls">
        {emails.length > 0 && !loading && (
          <span className="pagination-info">
            {startItem}-{endItem} of {totalEstimate > 0 ? `~${totalEstimate.toLocaleString()}` : 'many'}
          </span>
        )}                 
        <button 
          className="pagination-btn"
          onClick={onFirstPage}
          disabled={loading || currentPage === 1}
          title="First page"
          aria-label="Go to first page"
        >
          ⏮
        </button>                
        <button 
          className="pagination-btn"
          onClick={onPrevPage}
          disabled={loading || currentPage === 1}
          title="Previous page"
          aria-label="Go to previous page"
        >
          ◀
        </button>                
        <span className="page-indicator">
          Page {currentPage}
        </span>
        <button 
          className="pagination-btn"
          onClick={onNextPage}
          disabled={loading || !nextPageToken}
          title="Next page"
          aria-label="Go to next page"
        >
          ▶
        </button>
        <button 
          className="refresh-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh"
          aria-label="Refresh emails"
        >
          {loading ? (
            <img src={loadingIcon} alt="Loading" className="refresh-loading-icon" aria-hidden="true" />
          ) : (
            <img src={refreshIcon} alt="Refresh" className="refresh-loading-icon" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export default EmailHeader;
