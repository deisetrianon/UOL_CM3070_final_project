import EmailHeader from './EmailHeader';
import EmailItem from './EmailItem';
import EmailPagination from './EmailPagination';
import loadingIcon from '../../assets/icons/loading.png';
import './EmailList.css';

function EmailList({
  filteredEmails,
  emails,
  loading,
  error,
  activeLabel,
  labels,
  selectedEmailIds,
  currentPage,
  nextPageToken,
  pageTokenHistory,
  totalEstimate,
  emailsPerPage,
  zenModeEmailStats,
  startItem,
  endItem,
  onToggleSelectAll,
  onSelectEmail,
  onEmailClick,
  onToggleStar,
  onDelete,
  onBulkMarkAsRead,
  onBulkToggleStar,
  onBulkDelete,
  onRefresh,
  onNextPage,
  onPrevPage,
  onFirstPage
}) {
  if (loading) {
    return (
      <div className="email-list-loading">
        <img src={loadingIcon} alt="Loading" className="loading-icon" />
        <p>Loading emails...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="email-list-error" role="alert">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (filteredEmails.length === 0) {
    return (
      <div className="email-list-empty">
        <p>No emails found</p>
      </div>
    );
  }

  return (
    <>
      <EmailHeader
        activeLabel={activeLabel}
        labels={labels}
        filteredEmails={filteredEmails}
        emails={emails}
        selectedEmailIds={selectedEmailIds}
        currentPage={currentPage}
        nextPageToken={nextPageToken}
        totalEstimate={totalEstimate}
        emailsPerPage={emailsPerPage}
        loading={loading}
        startItem={startItem}
        endItem={endItem}
        onToggleSelectAll={onToggleSelectAll}
        onBulkMarkAsRead={onBulkMarkAsRead}
        onBulkToggleStar={onBulkToggleStar}
        onBulkDelete={onBulkDelete}
        onRefresh={onRefresh}
        onFirstPage={onFirstPage}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />
      <ul className="email-list" role="list" aria-label="Email list">
        {filteredEmails.map((email) => (
          <EmailItem
            key={email.id}
            email={email}
            isSelected={selectedEmailIds.has(email.id)}
            onSelect={(checked) => onSelectEmail(email.id, checked)}
            onClick={() => onEmailClick(email)}
            onToggleStar={() => onToggleStar(email.id, email.isStarred)}
            onDelete={onDelete}
          />
        ))}
      </ul>
      <EmailPagination
        currentPage={currentPage}
        nextPageToken={nextPageToken}
        pageTokenHistory={pageTokenHistory}
        totalEstimate={totalEstimate}
        emailsPerPage={emailsPerPage}
        filteredEmails={filteredEmails}
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
        onFirstPage={onFirstPage}
        zenModeEmailStats={zenModeEmailStats}
      />
    </>
  );
}

export default EmailList;
