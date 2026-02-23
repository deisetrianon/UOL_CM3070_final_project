import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useZenMode } from '../../contexts/ZenModeContext';
import emailIcon from '../../assets/icons/email.png';
import tasksIcon from '../../assets/icons/tasks.png';
import chartIcon from '../../assets/icons/chart.png';
import calendarIcon from '../../assets/icons/calendar.png';
import inboxIcon from '../../assets/icons/inbox.png';
import starredIcon from '../../assets/icons/starred.png';
import importantIcon from '../../assets/icons/important.png';
import sentIcon from '../../assets/icons/sent.png';
import draftIcon from '../../assets/icons/drafts.png';
import trashIcon from '../../assets/icons/trash.png';
import spamIcon from '../../assets/icons/spam.png';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isZenModeActive } = useZenMode();
  const [expandedSections, setExpandedSections] = useState({
    emails: true
  });

  useEffect(() => {
    if (isZenModeActive) {
      setExpandedSections({
        emails: false
      });
    } else {
      setExpandedSections({
        emails: true
      });
    }
  }, [isZenModeActive]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const hasExpandedSection = Object.values(expandedSections).some(expanded => expanded);
  const sidebarClassName = isZenModeActive 
    ? `app-sidebar zen-mode-collapsed ${hasExpandedSection ? 'expanded-section' : ''}`
    : 'app-sidebar';

  return (
    <aside className={sidebarClassName}>
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <button 
            className="sidebar-section-header"
            onClick={() => toggleSection('emails')}
          >
            <img src={emailIcon} alt="Emails" className="section-icon" />
            <span className="section-title">Emails</span>
            <span className={`section-arrow ${expandedSections.emails ? 'expanded' : ''}`}>
              ▼
            </span>
          </button>
          {expandedSections.emails && (
            <div className="sidebar-section-content">
              <button
                className={`sidebar-item ${isActive('/home') && !location.search ? 'active' : ''}`}
                onClick={() => navigate('/home')}
              >
                <img src={inboxIcon} alt="Inbox" className="item-icon" />
                <span className="item-text">Inbox</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('STARRED') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=STARRED')}
              >
                <img src={starredIcon} alt="Starred" className="item-icon" />
                <span className="item-text">Starred</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('IMPORTANT') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=IMPORTANT')}
              >
                <img src={importantIcon} alt="Important" className="item-icon" />
                <span className="item-text">Important</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('SENT') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=SENT')}
              >
                <img src={sentIcon} alt="Sent" className="item-icon" />
                <span className="item-text">Sent</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('DRAFT') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=DRAFT')}
              >
                <img src={draftIcon} alt="Drafts" className="item-icon" />
                <span className="item-text">Drafts</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('TRASH') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=TRASH')}
              >
                <img src={trashIcon} alt="Trash" className="item-icon" />
                <span className="item-text">Trash</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('SPAM') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=SPAM')}
              >
                <img src={spamIcon} alt="Spam" className="item-icon" />
                <span className="item-text">Spam</span>
              </button>
            </div>
          )}
        </div>
        <div className="sidebar-section">
          <button 
            className={`sidebar-section-header ${isActive('/tasks') ? 'active' : ''}`}
            onClick={() => navigate('/tasks')}
          >
            <img src={tasksIcon} alt="Tasks" className="section-icon" />
            <span className="section-title">Tasks</span>
          </button>
        </div>
        <div className="sidebar-section">
          <button 
            className={`sidebar-section-header ${isActive('/stress-history') ? 'active' : ''}`}
            onClick={() => navigate('/stress-history')}
          >
            <img src={chartIcon} alt="Stress History" className="section-icon" />
            <span className="section-title">Stress History</span>
          </button>
        </div>
        <div className="sidebar-section">
          <button 
            className={`sidebar-section-header ${isActive('/calendar') ? 'active' : ''}`}
            onClick={() => navigate('/calendar')}
          >
            <img src={calendarIcon} alt="Calendar" className="section-icon" />
            <span className="section-title">Calendar</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
