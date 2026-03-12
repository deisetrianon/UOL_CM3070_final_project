/**
 * Home page component.
 * Main email management interface with inbox, search, pagination, and email operations.
 * Displays email list, email viewer, and email composer.
 * 
 * @module pages/Home
 * @component
 * @returns {JSX.Element} Home page component
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFacialAnalysis } from '../../contexts/FacialAnalysisContext';
import { useZenMode } from '../../contexts/ZenModeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useEmailOperations } from '../../hooks/useEmailOperations';
import { usePagination } from '../../hooks/usePagination';
import Layout from '../../components/Layout';
import EmailWriter from '../../components/EmailWriter';
import EmailList from '../../components/EmailList';
import EmailSearch from '../../components/EmailList/EmailSearch';
import EmailView from '../../components/EmailList/EmailView';
import writeIcon from '../../assets/icons/write.png';
import starredFilledIcon from '../../assets/icons/starred-filled.png';
import trashIcon from '../../assets/icons/trash.png';
import importantIcon from '../../assets/icons/important.png';
import './Home.css';

const LABELS = [
  { id: 'INBOX', name: 'Inbox', icon: '📥' },
  { id: 'STARRED', name: 'Starred', icon: starredFilledIcon },
  { id: 'IMPORTANT', name: 'Important', icon: '🏷️' },
  { id: 'SENT', name: 'Sent', icon: '📤' },
  { id: 'DRAFT', name: 'Drafts', icon: '📝' },
  { id: 'TRASH', name: 'Trash', icon: trashIcon },
  { id: 'SPAM', name: 'Spam', icon: '🚫' }
];

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { promptForPermission } = useFacialAnalysis();
  const { isZenModeActive, autoTriggeredReason } = useZenMode();
  const { showAlert, showConfirm } = useNotification();
  
  const {
    loading: emailOperationsLoading,
    error: emailOperationsError,
    fetchEmails: fetchEmailsOperation,
    fetchFullEmail: fetchFullEmailOperation,
    deleteEmail: deleteEmailOperation,
    markEmailAsRead: markEmailAsReadOperation,
    toggleStar: toggleStarOperation,
    sendEmail: sendEmailOperation,
    replyToEmail: replyToEmailOperation,
    EMAILS_PER_PAGE
  } = useEmailOperations();

  const {
    currentPage,
    nextPageToken,
    pageTokenHistory,
    setNextPageToken,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    reset: resetPagination
  } = usePagination();

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [fullEmailContent, setFullEmailContent] = useState(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [activeLabel, setActiveLabel] = useState('INBOX');
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [showWriter, setShowWriter] = useState(false);
  const [writerMode, setWriterMode] = useState('write');
  const [replyEmail, setReplyEmail] = useState(null);
  const [replyAll, setReplyAll] = useState(false);
  const [selectedEmailIds, setSelectedEmailIds] = useState(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      promptForPermission();
    }, 1500);
    return () => clearTimeout(timer);
  }, [promptForPermission]);

  const fetchEmails = useCallback(async (label = 'INBOX', pageToken = null, query = '') => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchEmailsOperation(label, pageToken, query);
      setEmails(result.emails || []);
      setNextPageToken(result.nextPageToken || null);
      setTotalEstimate(result.totalEstimate || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }, [fetchEmailsOperation, setNextPageToken]);

  const fetchFullEmail = useCallback(async (emailId) => {
    try {
      setLoadingEmail(true);
      const email = await fetchFullEmailOperation(emailId);
      setFullEmailContent(email);
    } catch (err) {
      console.error('Error fetching full email:', err);
      setFullEmailContent(null);
    } finally {
      setLoadingEmail(false);
    }
  }, [fetchFullEmailOperation]);

  const markEmailAsRead = useCallback(async (emailId) => {
    try {
      await markEmailAsReadOperation(emailId);
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === emailId 
            ? { ...email, isUnread: false }
            : email
        )
      );
      
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, isUnread: false } : null);
      }
    } catch (err) {
      console.error('Error marking email as read:', err);
    }
  }, [markEmailAsReadOperation, selectedEmail]);

  const handleSelectEmail = useCallback((email) => {
    setSelectedEmail(email);
    setFullEmailContent(null);
    fetchFullEmail(email.id);
    
    if (email.isUnread) {
      markEmailAsRead(email.id);
    }
  }, [fetchFullEmail, markEmailAsRead]);

  const toggleStar = useCallback(async (emailId, currentStarredState) => {
    try {
      const result = await toggleStarOperation(emailId, currentStarredState);
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === emailId 
            ? { ...email, isStarred: result.isStarred, labelIds: result.labelIds || email.labelIds }
            : email
        )
      );
      
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, isStarred: result.isStarred, labelIds: result.labelIds || prev.labelIds } : null);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  }, [toggleStarOperation, selectedEmail]);

  const handleDeleteEmail = useCallback(async (emailId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this email? It will be moved to trash.',
      {
        title: 'Delete Email',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    );
    
    if (!confirmed) return;

    try {
      await deleteEmailOperation(emailId);
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      setSelectedEmailIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
      
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
        setFullEmailContent(null);
      }
    } catch (err) {
      console.error('Error deleting email:', err);
      await showAlert('Failed to delete email. Please try again.', 'error');
    }
  }, [selectedEmail, deleteEmailOperation, showAlert, showConfirm]);

  const toggleEmailSelection = useCallback((emailId) => {
    setSelectedEmailIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  }, []);

  const handleBulkMarkAsRead = useCallback(async () => {
    if (selectedEmailIds.size === 0) return;

    try {
      const promises = Array.from(selectedEmailIds).map(emailId =>
        markEmailAsReadOperation(emailId)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;

      if (successful > 0) {
        setEmails(prevEmails =>
          prevEmails.map(email =>
            selectedEmailIds.has(email.id)
              ? { ...email, isUnread: false }
              : email
          )
        );
        setSelectedEmailIds(new Set());
        fetchEmails(activeLabel, null, activeSearch);
      }
    } catch (err) {
      console.error('Error marking emails as read:', err);
      await showAlert('Failed to mark some emails as read. Please try again.', 'error');
    }
  }, [selectedEmailIds, activeLabel, activeSearch, fetchEmails, markEmailAsReadOperation, showAlert]);

  const handleBulkToggleStar = useCallback(async (starAction) => {
    if (selectedEmailIds.size === 0) return;

    try {
      const promises = Array.from(selectedEmailIds).map(async (emailId) => {
        const email = emails.find(e => e.id === emailId);
        if (!email) return null;
        
        if (starAction === 'star' && email.isStarred) return null;
        if (starAction === 'unstar' && !email.isStarred) return null;
        
        return toggleStarOperation(emailId, email.isStarred);
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;

      if (successful > 0) {
        setEmails(prevEmails =>
          prevEmails.map(email =>
            selectedEmailIds.has(email.id)
              ? { ...email, isStarred: starAction === 'star' ? true : false }
              : email
          )
        );
        setSelectedEmailIds(new Set());
      }
    } catch (err) {
      console.error('Error toggling stars:', err);
      await showAlert('Failed to update stars. Please try again.', 'error');
    }
  }, [selectedEmailIds, emails, toggleStarOperation, showAlert]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedEmailIds.size === 0) return;

    const count = selectedEmailIds.size;
    const confirmed = await showConfirm(
      `Are you sure you want to delete ${count} email${count > 1 ? 's' : ''}? They will be moved to trash.`,
      {
        title: 'Delete Emails',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    );
    
    if (!confirmed) return;

    try {
      const promises = Array.from(selectedEmailIds).map(emailId =>
        deleteEmailOperation(emailId)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;

      if (successful > 0) {
        setEmails(prevEmails => prevEmails.filter(email => !selectedEmailIds.has(email.id)));
        setSelectedEmailIds(new Set());
        
        if (selectedEmail && selectedEmailIds.has(selectedEmail.id)) {
          setSelectedEmail(null);
          setFullEmailContent(null);
        }
        
        fetchEmails(activeLabel, null, activeSearch);
      }
    } catch (err) {
      console.error('Error deleting emails:', err);
      await showAlert('Failed to delete some emails. Please try again.', 'error');
    }
  }, [selectedEmailIds, selectedEmail, activeLabel, activeSearch, fetchEmails, deleteEmailOperation, showAlert, showConfirm]);

  const handleSendEmail = useCallback(async (emailData) => {
    try {
      await sendEmailOperation(emailData);
      fetchEmails(activeLabel, null, activeSearch);
      setShowWriter(false);
      setReplyEmail(null);
    } catch (err) {
      console.error('Error sending email:', err);
      throw err;
    }
  }, [activeLabel, activeSearch, fetchEmails, sendEmailOperation]);

  const handleReplyEmail = useCallback(async (emailData) => {
    if (!replyEmail) return;

    try {
      await replyToEmailOperation(replyEmail.id, emailData.body, replyAll);
      fetchEmails(activeLabel, null, activeSearch);
      setShowWriter(false);
      setReplyEmail(null);
      setReplyAll(false);
    } catch (err) {
      console.error('Error replying to email:', err);
      throw err;
    }
  }, [replyEmail, replyAll, activeLabel, activeSearch, fetchEmails, replyToEmailOperation]);

  const openWriter = useCallback(() => {
    setWriterMode('write');
    setReplyEmail(null);
    setShowWriter(true);
  }, []);

  const openReply = useCallback((email, all = false) => {
    setWriterMode('reply');
    setReplyEmail(email);
    setReplyAll(all);
    setShowWriter(true);
  }, []);

  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    setActiveSearch(trimmedQuery);
    resetPagination();
    setSelectedEmail(null);
    setFullEmailContent(null);
    setSelectedEmailIds(new Set());
    fetchEmails(activeLabel, null, trimmedQuery);
  }, [searchQuery, activeLabel, fetchEmails, resetPagination]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setActiveSearch('');
    resetPagination();
    setSelectedEmail(null);
    setFullEmailContent(null);
    setSelectedEmailIds(new Set());
    fetchEmails(activeLabel, null, '');
  }, [activeLabel, fetchEmails, resetPagination]);

  const handleNextPage = useCallback(() => {
    if (nextPageToken) {
      const currentToken = nextPageToken;
      goToNextPage(currentToken);
      setSelectedEmail(null);
      setFullEmailContent(null);
      setSelectedEmailIds(new Set());
      fetchEmails(activeLabel, currentToken, activeSearch);
    }
  }, [nextPageToken, activeLabel, activeSearch, fetchEmails, goToNextPage]);

  const handlePrevPage = useCallback(() => {
    if (pageTokenHistory.length > 0) {
      const prevToken = pageTokenHistory[pageTokenHistory.length - 1];
      goToPrevPage();
      fetchEmails(activeLabel, prevToken, activeSearch);
      setSelectedEmail(null);
      setFullEmailContent(null);
      setSelectedEmailIds(new Set());
    }
  }, [pageTokenHistory, activeLabel, activeSearch, fetchEmails, goToPrevPage]);

  const handleFirstPage = useCallback(() => {
    goToFirstPage();
    fetchEmails(activeLabel, null, activeSearch);
    setSelectedEmail(null);
    setFullEmailContent(null);
    setSelectedEmailIds(new Set());
  }, [activeLabel, activeSearch, fetchEmails, goToFirstPage]);

  const handleRefresh = useCallback(() => {
    handleFirstPage();
  }, [handleFirstPage]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const label = searchParams.get('label');
    if (label) {
      setActiveLabel(label);
      setSelectedEmailIds(new Set());
    } else {
      setActiveLabel('INBOX');
      setSelectedEmailIds(new Set());
    }
  }, [location.search]);

  useEffect(() => {
    if (activeLabel) {
      resetPagination();
      setSelectedEmail(null);
      setFullEmailContent(null);
      setActiveSearch('');
      setSearchQuery('');
      fetchEmails(activeLabel, null, '');
    }
  }, [activeLabel, fetchEmails, resetPagination]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedEmail) {
        setSelectedEmail(null);
        setFullEmailContent(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedEmail]);

  const filteredEmails = useMemo(() => {
    if (!isZenModeActive) return emails;
    return emails.filter(email => email.isStarred || email.isImportant);
  }, [emails, isZenModeActive]);

  const toggleSelectAll = useCallback(() => {
    if (selectedEmailIds.size === filteredEmails.length) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(filteredEmails.map(email => email.id)));
    }
  }, [selectedEmailIds.size, filteredEmails]);

  const zenModeEmailStats = useMemo(() => {
    if (!isZenModeActive) return null;
    return {
      showing: filteredEmails.length,
      hidden: emails.length - filteredEmails.length
    };
  }, [emails, filteredEmails, isZenModeActive]);

  const startItem = (currentPage - 1) * EMAILS_PER_PAGE + 1;
  const endItem = startItem + emails.length - 1;

  const handleEmailClick = useCallback((email) => {
    handleSelectEmail(email);
  }, [handleSelectEmail]);

  const handleSelectEmailId = useCallback((emailId, checked) => {
    if (checked) {
      setSelectedEmailIds(prev => new Set([...prev, emailId]));
    } else {
      setSelectedEmailIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
    }
  }, []);

  return (
    <Layout>
      <div className={`home-page ${isZenModeActive ? 'zen-mode-active' : ''}`}>
        <div className="home-header-section">
          <div className="home-header-actions">
            <button
              className="write-email-btn"
              onClick={openWriter}
              title="Write new email"
              aria-label="Write new email"
            >
              <img src={writeIcon} alt="" className="write-icon" aria-hidden="true" /> Write
            </button>
            <EmailSearch
              searchQuery={searchQuery}
              activeSearch={activeSearch}
              onSearchChange={setSearchQuery}
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
              onSearchKeyDown={handleSearchKeyDown}
            />
          </div>
          {activeSearch && (
            <div className="search-active-indicator" role="status" aria-live="polite">
              Showing results for: <strong>"{activeSearch}"</strong>
            </div>
          )}
        </div>
        <main className="email-main">
          {selectedEmail ? (
            <EmailView
              email={selectedEmail}
              fullEmailContent={fullEmailContent}
              loadingEmail={loadingEmail}
              activeLabel={activeLabel}
              labels={LABELS}
              onBack={() => {
                setSelectedEmail(null);
                setFullEmailContent(null);
              }}
              onReply={openReply}
              onReplyAll={openReply}
              onToggleStar={toggleStar}
              onMarkAsRead={markEmailAsRead}
              onDelete={handleDeleteEmail}
            />
          ) : (
            <>
              {error && (
                <div className="error-banner">
                  <img src={importantIcon} alt="Warning" className="warning-icon" />
                  <span>{error}</span>
                  <button onClick={() => fetchEmails(activeLabel)}>Retry</button>
                </div>
              )}
              {isZenModeActive && (
                <div className="zen-mode-banner">
                  <div className="zen-banner-text">
                    <strong>Zen Mode Active</strong>
                    <span>
                      {autoTriggeredReason || 'Showing only starred and important emails'}
                      {zenModeEmailStats && zenModeEmailStats.hidden > 0 && (
                        <> • {zenModeEmailStats.hidden} emails hidden</>
                      )}
                    </span>
                  </div>
                </div>
              )}
              <EmailList
                filteredEmails={filteredEmails}
                emails={emails}
                loading={loading}
                error={null}
                activeLabel={activeLabel}
                labels={LABELS}
                selectedEmailIds={selectedEmailIds}
                currentPage={currentPage}
                nextPageToken={nextPageToken}
                pageTokenHistory={pageTokenHistory}
                totalEstimate={totalEstimate}
                emailsPerPage={EMAILS_PER_PAGE}
                zenModeEmailStats={zenModeEmailStats}
                startItem={startItem}
                endItem={endItem}
                onToggleSelectAll={toggleSelectAll}
                onSelectEmail={handleSelectEmailId}
                onEmailClick={handleEmailClick}
                onToggleStar={toggleStar}
                onDelete={handleDeleteEmail}
                onBulkMarkAsRead={handleBulkMarkAsRead}
                onBulkToggleStar={handleBulkToggleStar}
                onBulkDelete={handleBulkDelete}
                onRefresh={handleRefresh}
                onNextPage={handleNextPage}
                onPrevPage={handlePrevPage}
                onFirstPage={handleFirstPage}
              />
            </>
          )}
        </main>
        {showWriter && (
          <EmailWriter
            onClose={() => {
              setShowWriter(false);
              setReplyEmail(null);
              setReplyAll(false);
            }}
            onSend={writerMode === 'reply' ? handleReplyEmail : handleSendEmail}
            initialTo={replyEmail ? replyEmail.from?.email : ''}
            initialSubject={replyEmail ? (replyEmail.subject.startsWith('Re:') ? replyEmail.subject : `Re: ${replyEmail.subject}`) : ''}
            initialBody={replyEmail ? `\n\n--- Original Message ---\nFrom: ${replyEmail.from?.name || replyEmail.from?.email}\nDate: ${new Date(replyEmail.date).toLocaleString()}\n\n${replyEmail.snippet}` : ''}
            isReply={writerMode === 'reply'}
            replyAll={replyAll}
          />
        )}
      </div>
    </Layout>
  );
}

export default Home;
