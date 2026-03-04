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
