import { useState } from 'react';
import './ZenModeToggle.css';

/**
 * Zen Mode Toggle Component
 * Displays a toggle button for activating Zen Mode across the application
 * TODO: Implement actual Zen Mode functionality later
 */
function ZenModeToggle({ className = '' }) {
  const [isEnabled, setIsEnabled] = useState(false);

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
    // TODO: Trigger actual Zen Mode functionality
    console.log(`[ZenMode] ${!isEnabled ? 'Enabled' : 'Disabled'}`);
  };

  return (
    <button 
      className={`zen-mode-toggle ${isEnabled ? 'active' : ''} ${className}`}
      onClick={handleToggle}
      title={isEnabled ? 'Disable Zen Mode' : 'Enable Zen Mode'}
    >
      <span className="zen-icon">{isEnabled ? '🧘' : '🌿'}</span>
      <span className="zen-label">Zen Mode</span>
      <span className={`zen-indicator ${isEnabled ? 'on' : 'off'}`} />
    </button>
  );
}

export default ZenModeToggle;
