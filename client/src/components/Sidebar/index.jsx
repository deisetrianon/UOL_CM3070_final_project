import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    emails: true,
    tasks: true,
    wellness: true,
    calendar: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <button 
            className="sidebar-section-header"
            onClick={() => toggleSection('emails')}
          >
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
                <span className="item-icon">📥</span>
                <span className="item-text">Inbox</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('STARRED') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=STARRED')}
              >
                <span className="item-icon">⭐</span>
                <span className="item-text">Starred</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('IMPORTANT') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=IMPORTANT')}
              >
                <span className="item-icon">🏷️</span>
                <span className="item-text">Important</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('SENT') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=SENT')}
              >
                <span className="item-icon">📤</span>
                <span className="item-text">Sent</span>
              </button>
              <button
                className={`sidebar-item ${location.search.includes('DRAFT') ? 'active' : ''}`}
                onClick={() => navigate('/home?label=DRAFT')}
              >
                <span className="item-icon">📝</span>
                <span className="item-text">Drafts</span>
              </button>
            </div>
          )}
        </div>
        <div className="sidebar-section">
          <button 
            className="sidebar-section-header"
            onClick={() => toggleSection('tasks')}
          >
            <span className="section-title">Task Management</span>
            <span className={`section-arrow ${expandedSections.tasks ? 'expanded' : ''}`}>
              ▼
            </span>
          </button>
          {expandedSections.tasks && (
            <div className="sidebar-section-content">
              <button
                className={`sidebar-item ${isActive('/tasks') ? 'active' : ''}`}
                onClick={() => navigate('/tasks')}
              >
                <span className="item-text">Task Board</span>
              </button>
            </div>
          )}
        </div>
        <div className="sidebar-section">
          <button 
            className="sidebar-section-header"
            onClick={() => toggleSection('wellness')}
          >
            <span className="section-title">Wellness</span>
            <span className={`section-arrow ${expandedSections.wellness ? 'expanded' : ''}`}>
              ▼
            </span>
          </button>
          {expandedSections.wellness && (
            <div className="sidebar-section-content">
              <button
                className={`sidebar-item ${isActive('/stress-history') ? 'active' : ''}`}
                onClick={() => navigate('/stress-history')}
              >
                <span className="item-text">Stress History</span>
              </button>
            </div>
          )}
        </div>
        <div className="sidebar-section">
          <button 
            className="sidebar-section-header"
            onClick={() => toggleSection('calendar')}
          >
            <span className="section-title">Calendar</span>
            <span className={`section-arrow ${expandedSections.calendar ? 'expanded' : ''}`}>
              ▼
            </span>
          </button>
          {expandedSections.calendar && (
            <div className="sidebar-section-content">
              <button
                className={`sidebar-item ${isActive('/calendar') ? 'active' : ''}`}
                onClick={() => navigate('/calendar')}
              >
                <span className="item-text">Calendar View</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
