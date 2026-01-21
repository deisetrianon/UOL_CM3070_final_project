import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

/**
 * Home Page
 * Displays user's Gmail inbox with email list
 */
function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activeLabel, setActiveLabel] = useState('INBOX');
  const [gmailProfile, setGmailProfile] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  // Generate fallback avatar URL
  const getFallbackAvatar = () => {
    const name = encodeURIComponent(user?.displayName || user?.email || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=4f46e5&color=fff&size=96`;
  };

  // Fetch emails from Gmail
  const fetchEmails = useCallback(async (label = 'INBOX') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/gmail/emails?label=${label}&maxResults=30`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setEmails(data.emails || []);
      } else if (response.status === 401) {
        // Session expired, redirect to login
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

  // Fetch Gmail profile
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

  useEffect(() => {
    fetchEmails(activeLabel);
    fetchProfile();
  }, [fetchEmails, fetchProfile, activeLabel]);

  // Handle logout
  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      navigate('/login');
    }
  };

  // Format date for display
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

  // Labels for sidebar
  const labels = [
    { id: 'INBOX', name: 'Inbox', icon: '📥' },
    { id: 'STARRED', name: 'Starred', icon: '⭐' },
    { id: 'IMPORTANT', name: 'Important', icon: '🏷️' },
    { id: 'SENT', name: 'Sent', icon: '📤' },
    { id: 'DRAFT', name: 'Drafts', icon: '📝' }
  ];

  return (
    <div className="home-page">
      {/* Header */}
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
            />
          </div>
        </div>

        <div className="header-right">
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

      {/* Main Content */}
      <div className="home-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {labels.map((label) => (
              <button
                key={label.id}
                className={`nav-item ${activeLabel === label.id ? 'active' : ''}`}
                onClick={() => setActiveLabel(label.id)}
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

        {/* Email List */}
        <main className="email-main">
          <div className="email-header">
            <h2>{labels.find(l => l.id === activeLabel)?.name || 'Inbox'}</h2>
            <button 
              className="refresh-btn"
              onClick={() => fetchEmails(activeLabel)}
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
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
                  className={`email-item ${email.isUnread ? 'unread' : ''} ${selectedEmail?.id === email.id ? 'selected' : ''}`}
                  onClick={() => setSelectedEmail(email)}
                >
                  <div className="email-checkbox">
                    <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                  </div>
                  
                  <div className="email-star">
                    <button 
                      className={`star-btn ${email.isStarred ? 'starred' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle star (not implemented for read-only)
                      }}
                    >
                      {email.isStarred ? '⭐' : '☆'}
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
        </main>

        {/* Email Preview Panel */}
        {selectedEmail && (
          <aside className="preview-panel">
            <div className="preview-header">
              <h3>{selectedEmail.subject}</h3>
              <button 
                className="close-preview"
                onClick={() => setSelectedEmail(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="preview-meta">
              <div className="preview-from">
                <div className="sender-avatar">
                  {selectedEmail.from?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="sender-info">
                  <span className="sender-name">{selectedEmail.from?.name}</span>
                  <span className="sender-email">{selectedEmail.from?.email}</span>
                </div>
              </div>
              <span className="preview-date">
                {new Date(selectedEmail.date).toLocaleString()}
              </span>
            </div>

            <div className="preview-body">
              <p>{selectedEmail.snippet}</p>
              <p className="preview-note">
                💡 Full email body view coming soon...
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default Home;
