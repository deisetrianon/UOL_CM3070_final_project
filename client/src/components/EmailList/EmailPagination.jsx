/**
 * Email Pagination component.
 * Pagination controls for navigating through email pages.
 * Displays current page, item range, and navigation buttons (First, Previous, Next).
 * 
 * @module components/EmailList/EmailPagination
 * @component
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current page number
 * @param {string|null} props.nextPageToken - Token for next page
 * @param {Array} props.pageTokenHistory - History of page tokens for backward navigation
 * @param {number} props.totalEstimate - Estimated total number of emails
 * @param {number} props.emailsPerPage - Number of emails per page
 * @param {Array} props.filteredEmails - Currently displayed emails
 * @param {Function} props.onNextPage - Callback for next page
 * @param {Function} props.onPrevPage - Callback for previous page
 * @param {Function} props.onFirstPage - Callback for first page
 * @param {Object} props.zenModeEmailStats - Zen Mode email filtering statistics
 * @returns {JSX.Element} Email Pagination component
 */

import './EmailList.css';

function EmailPagination({
  currentPage,
  nextPageToken,
  pageTokenHistory,
  totalEstimate,
  emailsPerPage,
  filteredEmails,
  onNextPage,
  onPrevPage,
  onFirstPage,
  zenModeEmailStats
}) {
  const startItem = (currentPage - 1) * emailsPerPage + 1;
  const endItem = startItem + filteredEmails.length - 1;

  return (
    <div className="pagination-footer" role="navigation" aria-label="Email pagination">
      <div className="pagination-info">
        <span>
          Page {currentPage} • Showing {startItem}-{endItem} of {totalEstimate > 0 ? `~${totalEstimate.toLocaleString()}` : 'many'}
          {zenModeEmailStats?.hidden > 0 && (
            <span className="zen-filter-note"> (Zen Mode: {zenModeEmailStats.hidden} hidden)</span>
          )}
        </span>
      </div>
      <div className="pagination-controls">
        <button 
          className="pagination-btn-text"
          onClick={onFirstPage}
          disabled={currentPage === 1}
          aria-label="Go to first page"
        >
          First
        </button>
        <button 
          className="pagination-btn-text"
          onClick={onPrevPage}
          disabled={pageTokenHistory.length === 0}
          aria-label="Go to previous page"
        >
          Previous
        </button>
        <button 
          className="pagination-btn-text"
          onClick={onNextPage}
          disabled={!nextPageToken}
          aria-label="Go to next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default EmailPagination;
