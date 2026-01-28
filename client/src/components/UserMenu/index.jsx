import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './UserMenu.css';

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Getting fallback avatar
  const getFallbackAvatar = () => {
    const name = encodeURIComponent(user?.displayName || user?.email || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=4f46e5&color=fff&size=96`;
  };

  // Closing menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
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
      <button className="user-menu-trigger" onClick={handleToggle}>
        <img 
          src={user.picture || getFallbackAvatar()} 
          alt={user.displayName}
          className="user-avatar"
          onError={(e) => { e.target.src = getFallbackAvatar(); }}
          referrerPolicy="no-referrer"
        />
        <div className="user-info">
          <span className="user-name">{user.displayName}</span>
          <span className="user-email">{user.email}</span>
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <img 
              src={user.picture || getFallbackAvatar()} 
              alt={user.displayName}
              className="user-avatar-large"
              onError={(e) => { e.target.src = getFallbackAvatar(); }}
              referrerPolicy="no-referrer"
            />
            <div className="user-info-large">
              <span className="user-name-large">{user.displayName}</span>
              <span className="user-email-large">{user.email}</span>
            </div>
          </div>
          <div className="user-menu-divider"></div>
          <button className="user-menu-item" onClick={handleSettings}>
            <span className="menu-icon">⚙️</span>
            <span>Settings</span>
          </button>
          <button className="user-menu-item logout" onClick={handleLogout}>
            <span className="menu-icon">➜]</span>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
