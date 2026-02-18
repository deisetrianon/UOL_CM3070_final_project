import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFacialAnalysis } from '../../contexts/FacialAnalysisContext';
import { useZenMode } from '../../contexts/ZenModeContext';
import Layout from '../../components/Layout';
import EmailWriter from '../../components/EmailWriter';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { promptForPermission } = useFacialAnalysis();
  const { isZenModeActive, autoTriggeredReason } = useZenMode();

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [fullEmailContent, setFullEmailContent] = useState(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [activeLabel, setActiveLabel] = useState('INBOX');
  const [gmailProfile, setGmailProfile] = useState(null);

  const [nextPageToken, setNextPageToken] = useState(null);
  const [pageTokenHistory, setPageTokenHistory] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState(''); 
  const [showWriter, setShowWriter] = useState(false);
  const [writerMode, setWriterMode] = useState('write'); // 'write' or 'reply'
  const [replyEmail, setReplyEmail] = useState(null);
  const [replyAll, setReplyAll] = useState(false);
  const [selectedEmailIds, setSelectedEmailIds] = useState(new Set());
  const EMAILS_PER_PAGE = 20;

  // Prompt for camera permission after page load
  useEffect(() => {
    const timer = setTimeout(() => {
      promptForPermission();
    }, 1500);

    return () => clearTimeout(timer);
  }, [promptForPermission]);

  // Fetching emails from Gmail with pagination and search support
  const fetchEmails = useCallback(async (label = 'INBOX', pageToken = null, query = '') => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/gmail/emails?label=${label}&maxResults=${EMAILS_PER_PAGE}`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }
      if (query) {
        url += `&query=${encodeURIComponent(query)}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setEmails(data.emails || []);
        setNextPageToken(data.nextPageToken || null);
        setTotalEstimate(data.resultSizeEstimate || 0);
      } else if (response.status === 401) {
        // Redirecting to login if session expired
        navigate('/login');
      } else {
        setError(data.error || 'Failed to fetch emails');
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to connect to email service');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Fetching Gmail profile
  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/gmail/profile', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setGmailProfile(data.profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  const fetchFullEmail = useCallback(async (emailId) => {
    try {
      setLoadingEmail(true);
      
      const response = await fetch(`/api/gmail/emails/${emailId}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setFullEmailContent(data.email);
      } else {
        console.error('Failed to fetch email:', data.error);
        setFullEmailContent(null);
      }
    } catch (err) {
      console.error('Error fetching full email:', err);
      setFullEmailContent(null);
    } finally {
      setLoadingEmail(false);
    }
  }, []);

  const markEmailAsRead = useCallback(async (emailId) => {
    try {
      const response = await fetch(`/api/gmail/emails/${emailId}/mark-read`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setEmails(prevEmails => 
          prevEmails.map(email => 
            email.id === emailId 
              ? { ...email, isUnread: false, labelIds: data.email.labelIds }
              : email
          )
        );
        
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(prev => prev ? { ...prev, isUnread: false, labelIds: data.email.labelIds } : null);
        }
      }
    } catch (err) {
      console.error('Error marking email as read:', err);
    }
  }, [selectedEmail]);

  const toggleStar = useCallback(async (emailId, currentStarredState) => {
    try {
      const response = await fetch(`/api/gmail/emails/${emailId}/toggle-star`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isStarred: currentStarredState })
      });

      const data = await response.json();

      if (data.success) {
        setEmails(prevEmails => 
          prevEmails.map(email => 
            email.id === emailId 
              ? { ...email, isStarred: data.email.isStarred, labelIds: data.email.labelIds }
              : email
          )
        );
        
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(prev => prev ? { ...prev, isStarred: data.email.isStarred, labelIds: data.email.labelIds } : null);
        }
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  }, [selectedEmail]);

  const handleSelectEmail = useCallback((email) => {
    setSelectedEmail(email);
    setFullEmailContent(null);
    fetchFullEmail(email.id);
    
    if (email.isUnread) {
      markEmailAsRead(email.id);
    }
  }, [fetchFullEmail, markEmailAsRead]);

  const handleSendEmail = useCallback(async (emailData) => {
    try {
      const response = await fetch('/api/gmail/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(emailData)
      });

      const data = await response.json();

      if (data.success) {
        fetchEmails(activeLabel, null, activeSearch);
        setShowWriter(false);
        setReplyEmail(null);
        return;
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      throw err;
    }
  }, [activeLabel, activeSearch, fetchEmails]);

  const handleReplyEmail = useCallback(async (emailData) => {
    if (!replyEmail) return;

    try {
      const response = await fetch(`/api/gmail/emails/${replyEmail.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          body: emailData.body,
          replyAll: replyAll
        })
      });

      const data = await response.json();

      if (data.success) {
        fetchEmails(activeLabel, null, activeSearch);
        setShowWriter(false);
        setReplyEmail(null);
        setReplyAll(false);
        return;
      } else {
        throw new Error(data.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error replying to email:', err);
      throw err;
    }
  }, [replyEmail, replyAll, activeLabel, activeSearch, fetchEmails]);

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

  const handleDeleteEmail = useCallback(async (emailId) => {
    if (!window.confirm('Are you sure you want to delete this email? It will be moved to trash.')) {
      return;
    }

    try {
      const response = await fetch(`/api/gmail/emails/${emailId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
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
        
        fetchEmails(activeLabel, null, activeSearch);
      } else {
        throw new Error(data.message || 'Failed to delete email');
      }
    } catch (err) {
      console.error('Error deleting email:', err);
      alert('Failed to delete email. Please try again.');
    }
  }, [selectedEmail, activeLabel, activeSearch, fetchEmails]);

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
        fetch(`/api/gmail/emails/${emailId}/mark-read`, {
          method: 'POST',
          credentials: 'include'
        }).then(res => res.json())
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

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
      alert('Failed to mark some emails as read. Please try again.');
    }
  }, [selectedEmailIds, activeLabel, activeSearch, fetchEmails]);

  const handleBulkToggleStar = useCallback(async (starAction) => {
    if (selectedEmailIds.size === 0) return;

    try {
      const promises = Array.from(selectedEmailIds).map(async (emailId) => {
        const email = emails.find(e => e.id === emailId);
        if (!email) return null;
        
        if (starAction === 'star' && email.isStarred) return null;
        if (starAction === 'unstar' && !email.isStarred) return null;
        
        return fetch(`/api/gmail/emails/${emailId}/toggle-star`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isStarred: email.isStarred })
        }).then(res => res.json());
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;

      if (successful > 0) {
        setEmails(prevEmails =>
          prevEmails.map(email =>
            selectedEmailIds.has(email.id)
              ? { ...email, isStarred: starAction === 'star' ? true : false }
              : email
          )
        );
        setSelectedEmailIds(new Set());
        fetchEmails(activeLabel, null, activeSearch);
      }
    } catch (err) {
      console.error('Error toggling stars:', err);
      alert('Failed to update stars. Please try again.');
    }
  }, [selectedEmailIds, emails, activeLabel, activeSearch, fetchEmails]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedEmailIds.size === 0) return;

    const count = selectedEmailIds.size;
    if (!window.confirm(`Are you sure you want to delete ${count} email${count > 1 ? 's' : ''}? They will be moved to trash.`)) {
      return;
    }

    try {
      const promises = Array.from(selectedEmailIds).map(emailId =>
        fetch(`/api/gmail/emails/${emailId}`, {
          method: 'DELETE',
          credentials: 'include'
        }).then(res => res.json())
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

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
      alert('Failed to delete some emails. Please try again.');
    }
  }, [selectedEmailIds, selectedEmail, activeLabel, activeSearch, fetchEmails]);

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();
    setActiveSearch(trimmedQuery);
    setNextPageToken(null);
    setPageTokenHistory([]);
    setCurrentPage(1);
    setSelectedEmail(null);
    setFullEmailContent(null);
    setSelectedEmailIds(new Set());
    fetchEmails(activeLabel, null, trimmedQuery);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setNextPageToken(null);
    setPageTokenHistory([]);
    setCurrentPage(1);
    setSelectedEmail(null);
    setFullEmailContent(null);
    setSelectedEmailIds(new Set());
    fetchEmails(activeLabel, null, '');
  };

  const handleNextPage = () => {
    if (nextPageToken) {
      setPageTokenHistory(prev => [...prev, { 
        token: pageTokenHistory.length === 0 ? null : pageTokenHistory[pageTokenHistory.length - 1]?.nextToken,
        nextToken: nextPageToken 
      }]);
      setCurrentPage(prev => prev + 1);
      fetchEmails(activeLabel, nextPageToken, activeSearch);
      setSelectedEmail(null);
      setFullEmailContent(null);
      setSelectedEmailIds(new Set());
    }
  };

  const handlePrevPage = () => {
    if (pageTokenHistory.length > 0) {
      const newHistory = [...pageTokenHistory];
      newHistory.pop();
      
      const prevToken = newHistory.length > 0 ? newHistory[newHistory.length - 1]?.nextToken : null;
      
      setPageTokenHistory(newHistory);
      setCurrentPage(prev => prev - 1);
      fetchEmails(activeLabel, prevToken, activeSearch);
      setSelectedEmail(null);
      setFullEmailContent(null);
      setSelectedEmailIds(new Set());
    }
  };

  const handleFirstPage = () => {
    setPageTokenHistory([]);
    setCurrentPage(1);
    fetchEmails(activeLabel, null, activeSearch);
    setSelectedEmail(null);
    setFullEmailContent(null);
    setSelectedEmailIds(new Set());
  };

  // Reading label from URL query params
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

  // Fetching emails when activeLabel changes
  useEffect(() => {
    if (activeLabel) {
      // Resetting pagination and search when label changes
      setPageTokenHistory([]);
      setCurrentPage(1);
      setNextPageToken(null);
      setSelectedEmail(null);
      setFullEmailContent(null);
      setActiveSearch('');
      setSearchQuery('');
      fetchEmails(activeLabel, null, '');
    }
  }, [activeLabel, fetchEmails]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handling ESC key to go back to email list
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


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const labels = [
    { id: 'INBOX', name: 'Inbox', icon: '📥' },
    { id: 'STARRED', name: 'Starred', icon: '⭐' },
    { id: 'IMPORTANT', name: 'Important', icon: '🏷️' },
    { id: 'SENT', name: 'Sent', icon: '📤' },
    { id: 'DRAFT', name: 'Drafts', icon: '📝' }
  ];

  // Calculating display range for pagination
  const startItem = (currentPage - 1) * EMAILS_PER_PAGE + 1;
  const endItem = startItem + emails.length - 1;

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

  return (
    <Layout>
      <div className={`home-page ${isZenModeActive ? 'zen-mode-active' : ''}`}>
        <div className="home-header-section">
          <div className="home-header-actions">
            <button
              className="compose-btn"
              onClick={openWriter}
              title="Write new email"
            >
              ✏️ Write
            </button>
          </div>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search emails..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {(searchQuery || activeSearch) && (
              <button 
                className="search-clear"
                onClick={handleClearSearch}
                title="Clear search"
              >
                ✕
              </button>
            )}
            <button 
              className="search-btn"
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              title="Search"
            >
              Search
            </button>
          </div>
          {activeSearch && (
            <div className="search-active-indicator">
              Showing results for: <strong>"{activeSearch}"</strong>
            </div>
          )}
        </div>
        <main className="email-main">
          {selectedEmail ? (
            <div className="email-view">
              <div className="email-view-header">
                <button 
                  className="back-to-list"
                  onClick={() => {
                    setSelectedEmail(null);
                    setFullEmailContent(null);
                  }}
                >
                  ← Back to {labels.find(l => l.id === activeLabel)?.name || 'Inbox'}
                </button>
              </div>
              <div className="email-view-content">
                <div className="email-view-title">
                  <h2>{selectedEmail.subject}</h2>
                  <div className="email-view-labels">
                    {selectedEmail.isImportant && <span className="label-badge important">Important</span>}
                    {selectedEmail.isStarred && <span className="label-badge starred">⭐ Starred</span>}
                  </div>
                </div>
                <div className="email-view-meta">
                  <div className="email-view-from">
                    <div className="sender-avatar-large">
                      {selectedEmail.from?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="sender-details">
                      <span className="sender-name-large">{selectedEmail.from?.name}</span>
                      <span className="sender-email-large">{selectedEmail.from?.email}</span>
                    </div>
                  </div>
                  <div className="email-view-actions">
                    <button
                      className="action-btn reply-action"
                      onClick={() => openReply(selectedEmail, false)}
                      title="Reply"
                    >
                      ↪ Reply
                    </button>
                    <button
                      className="action-btn reply-all-action"
                      onClick={() => openReply(selectedEmail, true)}
                      title="Reply All"
                    >
                      ↪ Reply All
                    </button>
                    <button
                      className={`action-btn star-action ${selectedEmail.isStarred ? 'starred' : ''}`}
                      onClick={() => toggleStar(selectedEmail.id, selectedEmail.isStarred)}
                      title={selectedEmail.isStarred ? 'Remove star' : 'Add star'}
                    >
                      {selectedEmail.isStarred ? '⭐' : '☆'} {selectedEmail.isStarred ? 'Starred' : 'Star'}
                    </button>
                    {selectedEmail.isUnread && (
                      <button
                        className="action-btn mark-read-action"
                        onClick={() => markEmailAsRead(selectedEmail.id)}
                        title="Mark as read"
                      >
                        ✓ Mark as read
                      </button>
                    )}
                    <button
                      className="action-btn delete-action"
                      onClick={() => handleDeleteEmail(selectedEmail.id)}
                      title="Delete email"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <div className="email-view-date">
                    <span className="date-full">
                      {new Date(selectedEmail.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="time-full">
                      {new Date(selectedEmail.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
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
                    <p className="email-snippet-fallback">{selectedEmail.snippet}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="email-header">
                <div className="email-header-left">
                  <h2>{labels.find(l => l.id === activeLabel)?.name || 'Inbox'}</h2>
                  {filteredEmails.length > 0 && (
                    <label className="select-all-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedEmailIds.size === filteredEmails.length && filteredEmails.length > 0}
                        onChange={toggleSelectAll}
                        title={selectedEmailIds.size === filteredEmails.length ? 'Deselect all' : 'Select all'}
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
                      onClick={handleBulkMarkAsRead}
                      title="Mark as read"
                    >
                      ✓ Mark as read
                    </button>
                    <button
                      className="bulk-action-btn star"
                      onClick={() => handleBulkToggleStar('star')}
                      title="Star"
                    >
                      ⭐ Star
                    </button>
                    <button
                      className="bulk-action-btn unstar"
                      onClick={() => handleBulkToggleStar('unstar')}
                      title="Unstar"
                    >
                      ☆ Unstar
                    </button>
                    <button
                      className="bulk-action-btn delete"
                      onClick={handleBulkDelete}
                      title="Delete"
                    >
                      🗑️ Delete
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
                    onClick={handleFirstPage}
                    disabled={loading || currentPage === 1}
                    title="First page"
                  >
                    ⏮
                  </button>                
                  <button 
                    className="pagination-btn"
                    onClick={handlePrevPage}
                    disabled={loading || currentPage === 1}
                    title="Previous page"
                  >
                    ◀
                  </button>                
                  <span className="page-indicator">
                    Page {currentPage}
                  </span>
                  <button 
                    className="pagination-btn"
                    onClick={handleNextPage}
                    disabled={loading || !nextPageToken}
                    title="Next page"
                  >
                    ▶
                  </button>
                  <button 
                    className="refresh-btn"
                    onClick={handleFirstPage}
                    disabled={loading}
                    title="Refresh"
                  >
                    {loading ? '⏳' : '🔄'}
                  </button>
                </div>
              </div>
              {error && (
                <div className="error-banner">
                  <span>⚠️</span>
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
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading emails...</p>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">{isZenModeActive ? '🧘' : '📭'}</span>
                  <h3>{isZenModeActive ? 'No priority emails' : 'No emails found'}</h3>
                  <p>
                    {isZenModeActive 
                      ? 'No starred or important emails in your inbox. Take a break!' 
                      : `Your ${activeLabel.toLowerCase()} is empty`}
                  </p>
                </div>
              ) : (
                <ul className="email-list">
                  {filteredEmails.map((email) => (
                    <li 
                      key={email.id}
                      className={`email-item ${email.isUnread ? 'unread' : ''} ${selectedEmailIds.has(email.id) ? 'selected' : ''}`}
                      onClick={() => handleSelectEmail(email)}
                    >
                      <div className="email-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedEmailIds.has(email.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleEmailSelection(email.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          title={selectedEmailIds.has(email.id) ? 'Deselect' : 'Select'}
                        />
                      </div>
                      <div className="email-actions-inline">
                        <button 
                          className={`star-btn ${email.isStarred ? 'starred' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(email.id, email.isStarred);
                          }}
                          title={email.isStarred ? 'Remove star' : 'Add star'}
                        >
                          {email.isStarred ? '⭐' : '☆'}
                        </button>
                        <button 
                          className="delete-btn-inline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEmail(email.id);
                          }}
                          title="Delete email"
                        >
                          🗑️
                        </button>
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
                  ))}
                </ul>
              )}
              {filteredEmails.length > 0 && !loading && (
                <div className="pagination-footer">
                  <button 
                    className="pagination-btn-text"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>                 
                  <span className="pagination-info">
                    Page {currentPage} • Showing {filteredEmails.length} emails
                    {isZenModeActive && zenModeEmailStats?.hidden > 0 && (
                      <span className="zen-filter-note"> (Zen Mode: {zenModeEmailStats.hidden} hidden)</span>
                    )}
                  </span>
                  <button 
                    className="pagination-btn-text"
                    onClick={handleNextPage}
                    disabled={!nextPageToken}
                  >
                    Next →
                  </button>
                </div>
              )}
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
