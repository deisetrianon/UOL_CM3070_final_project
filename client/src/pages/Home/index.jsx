import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [fullEmailContent, setFullEmailContent] = useState(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [activeLabel, setActiveLabel] = useState('INBOX');
  const [gmailProfile, setGmailProfile] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  const [nextPageToken, setNextPageToken] = useState(null);
  const [pageTokenHistory, setPageTokenHistory] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState(''); 
  const EMAILS_PER_PAGE = 20;

  // Generating fallback avatar URL
  const getFallbackAvatar = () => {
    const name = encodeURIComponent(user?.displayName || user?.email || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=4f46e5&color=fff&size=96`;
  };

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

  const handleSelectEmail = useCallback((email) => {
    setSelectedEmail(email);
    setFullEmailContent(null);
    fetchFullEmail(email.id);
  }, [fetchFullEmail]);

  // Resetting pagination when label changes
  const handleLabelChange = (labelId) => {
    setActiveLabel(labelId);
    setNextPageToken(null);
    setPageTokenHistory([]);
    setCurrentPage(1);
    setSelectedEmail(null);
    setFullEmailContent(null);
    // Keeping the active search when changing labels
    fetchEmails(labelId, null, activeSearch);
  };

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();
    setActiveSearch(trimmedQuery);
    setNextPageToken(null);
    setPageTokenHistory([]);
    setCurrentPage(1);
    setSelectedEmail(null);
    setFullEmailContent(null);
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
    }
  };

  const handleFirstPage = () => {
    setPageTokenHistory([]);
    setCurrentPage(1);
    fetchEmails(activeLabel, null, activeSearch);
    setSelectedEmail(null);
    setFullEmailContent(null);
  };

  useEffect(() => {
    fetchEmails(activeLabel, null, '');
    fetchProfile();
  }, []);

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

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      navigate('/login');
    }
  };

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

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-left">
          <div className="header-logo">
            <span className="logo-title">Empathetic Workspace</span>
          </div>
        </div>
        <div className="header-center">
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
        <div className="header-right">
          <button 
            className="nav-btn"
            onClick={() => navigate('/tasks')}
            title="Task Board"
          >
            📋
          </button>
          <button 
            className="nav-btn"
            onClick={() => navigate('/facial-analysis')}
            title="Facial Analysis POC"
          >
            🎥
          </button>
          <div className="user-menu">
            <img 
              src={avatarError ? getFallbackAvatar() : (user?.picture || getFallbackAvatar())} 
              alt={user?.displayName} 
              className="user-avatar"
              onError={() => setAvatarError(true)}
              referrerPolicy="no-referrer"
            />
            <div className="user-info">
              <span className="user-name">{user?.displayName}</span>
              <span className="user-email">{user?.email}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="home-content">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {labels.map((label) => (
              <button
                key={label.id}
                className={`nav-item ${activeLabel === label.id ? 'active' : ''}`}
                onClick={() => handleLabelChange(label.id)}
              >
                <span className="nav-icon">{label.icon}</span>
                <span className="nav-text">{label.name}</span>
              </button>
            ))}
          </nav>
          {gmailProfile && (
            <div className="sidebar-stats">
              <p className="stat">
                <span className="stat-value">{gmailProfile.messagesTotal?.toLocaleString()}</span>
                <span className="stat-label">Total emails</span>
              </p>
            </div>
          )}
        </aside>
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
                <h2>{labels.find(l => l.id === activeLabel)?.name || 'Inbox'}</h2>
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
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading emails...</p>
                </div>
              ) : emails.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <h3>No emails found</h3>
                  <p>Your {activeLabel.toLowerCase()} is empty</p>
                </div>
              ) : (
                <ul className="email-list">
                  {emails.map((email) => (
                    <li 
                      key={email.id}
                      className={`email-item ${email.isUnread ? 'unread' : ''}`}
                      onClick={() => handleSelectEmail(email)}
                    >
                      {/* <div className="email-checkbox">
                        <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                      </div> */}
                      {/* <div className="email-star">
                        <button 
                          className={`star-btn ${email.isStarred ? 'starred' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            // (TODO: Toggle star (not implemented yet for read-only))
                          }}
                        >
                          {email.isStarred ? '⭐' : '☆'}
                        </button>
                      </div> */}
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
              {emails.length > 0 && !loading && (
                <div className="pagination-footer">
                  <button 
                    className="pagination-btn-text"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>                 
                  <span className="pagination-info">
                    Page {currentPage} • Showing {emails.length} emails
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
      </div>
    </div>
  );
}

export default Home;
