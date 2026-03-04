import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './UserMenu.css';

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const getFallbackAvatar = () => {
    const name = encodeURIComponent(user?.displayName || user?.email || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=4f46e5&color=fff&size=96`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button 
        className="user-menu-trigger" 
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`User menu for ${user.displayName}. ${isOpen ? 'Close menu' : 'Open menu'}`}
      >
        <img 
          src={user.picture || getFallbackAvatar()} 
          alt=""
          className="user-avatar"
          onError={(e) => { e.target.src = getFallbackAvatar(); }}
          referrerPolicy="no-referrer"
          aria-hidden="true"
        />
        <div className="user-info">
          <span className="user-name">{user.displayName}</span>
          <span className="user-email">{user.email}</span>
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`} aria-hidden="true">▼</span>
      </button>
      {isOpen && (
        <div 
          className="user-menu-dropdown" 
          role="menu"
          aria-label="User account menu"
        >
          <div className="user-menu-header" role="presentation">
            <img 
              src={user.picture || getFallbackAvatar()} 
              alt=""
              className="user-avatar-large"
              onError={(e) => { e.target.src = getFallbackAvatar(); }}
              referrerPolicy="no-referrer"
              aria-hidden="true"
            />
            <div className="user-info-large">
              <span className="user-name-large">{user.displayName}</span>
              <span className="user-email-large">{user.email}</span>
            </div>
          </div>
          <div className="user-menu-divider" role="separator" aria-hidden="true"></div>
          <button 
            className="user-menu-item" 
            onClick={handleSettings}
            role="menuitem"
            aria-label="Go to Settings"
          >
            <span className="menu-icon" aria-hidden="true">⚙️</span>
            <span>Settings</span>
          </button>
          <button 
            className="user-menu-item logout" 
            onClick={handleLogout}
            role="menuitem"
            aria-label="Sign out of account"
          >
            <span className="menu-icon" aria-hidden="true">➜]</span>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
