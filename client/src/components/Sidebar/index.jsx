/**
 * Sidebar component.
 * Navigation sidebar with page links, email label filters, and burnout section.
 * Supports Zen Mode filtering to show only priority items.
 * 
 * @module components/Sidebar
 * @component
 * @returns {JSX.Element} Sidebar component
 */

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
import BurnoutSection from './BurnoutSection';
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
    <aside className={sidebarClassName} role="complementary" aria-label="Main navigation">
      <nav className="sidebar-nav" aria-label="Application navigation">
        <div className="sidebar-section">
          <button 
            className="sidebar-section-header"
            onClick={() => toggleSection('emails')}
            aria-expanded={expandedSections.emails}
            aria-controls="email-submenu"
            aria-label={`${expandedSections.emails ? 'Collapse' : 'Expand'} email menu`}
          >
            <img src={emailIcon} alt="" className="section-icon" aria-hidden="true" />
            <span className="section-title">Emails</span>
            <span className={`section-arrow ${expandedSections.emails ? 'expanded' : ''}`} aria-hidden="true">
              ▼
            </span>
          </button>
          {expandedSections.emails && (
            <div className="sidebar-section-content" id="email-submenu" role="menu">
              <button
                className={`sidebar-item ${isActive('/home') && !location.search ? 'active' : ''}`}
                onClick={() => navigate('/home')}
                role="menuitem"
                aria-label="Go to Inbox"
              >
                <img src={inboxIcon} alt="" className="item-icon" aria-hidden="true" />
                <span className="item-text">Inbox</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('STARRED') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=STARRED')}
                role="menuitem"
                aria-label="Go to Starred emails"
              >
                <img src={starredIcon} alt="" className="item-icon" aria-hidden="true" />
                <span className="item-text">Starred</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('IMPORTANT') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=IMPORTANT')}
                role="menuitem"
                aria-label="Go to Important emails"
              >
                <img src={importantIcon} alt="" className="item-icon" aria-hidden="true" />
                <span className="item-text">Important</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('SENT') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=SENT')}
                role="menuitem"
                aria-label="Go to Sent emails"
              >
                <img src={sentIcon} alt="" className="item-icon" aria-hidden="true" />
                <span className="item-text">Sent</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('DRAFT') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=DRAFT')}
                role="menuitem"
                aria-label="Go to Drafts"
              >
                <img src={draftIcon} alt="" className="item-icon" aria-hidden="true" />
                <span className="item-text">Drafts</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('TRASH') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=TRASH')}
                role="menuitem"
                aria-label="Go to Trash"
              >
                <img src={trashIcon} alt="" className="item-icon" aria-hidden="true" />
                <span className="item-text">Trash</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('SPAM') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=SPAM')}
                role="menuitem"
                aria-label="Go to Spam"
              >
                <img src={spamIcon} alt="" className="item-icon" aria-hidden="true" />
                <span className="item-text">Spam</span>
              </button>
            </div>
          )}
        </div>
        <div className="sidebar-section">
          <button 
            className={`sidebar-section-header ${isActive('/tasks') ? 'active' : ''}`}
            onClick={() => navigate('/tasks')}
            aria-label="Go to Tasks"
            aria-current={isActive('/tasks') ? 'page' : undefined}
          >
            <img src={tasksIcon} alt="" className="section-icon" aria-hidden="true" />
            <span className="section-title">Tasks</span>
          </button>
        </div>
        <div className="sidebar-section">
          <button 
            className={`sidebar-section-header ${isActive('/stress-history') ? 'active' : ''}`}
            onClick={() => navigate('/stress-history')}
            aria-label="Go to Stress History"
            aria-current={isActive('/stress-history') ? 'page' : undefined}
          >
            <img src={chartIcon} alt="" className="section-icon" aria-hidden="true" />
            <span className="section-title">Stress History</span>
          </button>
        </div>
        <div className="sidebar-section">
          <button 
            className={`sidebar-section-header ${isActive('/calendar') ? 'active' : ''}`}
            onClick={() => navigate('/calendar')}
            aria-label="Go to Calendar"
            aria-current={isActive('/calendar') ? 'page' : undefined}
          >
            <img src={calendarIcon} alt="" className="section-icon" aria-hidden="true" />
            <span className="section-title">Calendar</span>
          </button>
        </div>
        <BurnoutSection />
      </nav>
    </aside>
  );
}

export default Sidebar;
