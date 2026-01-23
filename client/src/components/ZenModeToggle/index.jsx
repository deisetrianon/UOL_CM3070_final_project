import { useZenMode } from '../../contexts/ZenModeContext';
import './ZenModeToggle.css';

/**
 * Zen Mode Toggle Component
 * Displays a toggle button for activating Zen Mode across the application
 * 
 * When active, filters the UI to show only priority items:
 * - Emails: starred, important
 * - Tasks: high priority, urgent, or deadline today
 */
function ZenModeToggle({ className = '' }) {
  const { isZenModeActive, autoTriggeredReason, toggleZenMode } = useZenMode();

  return (
    <div className={`zen-mode-wrapper ${className}`}>
      <button 
        className={`zen-mode-toggle ${isZenModeActive ? 'active' : ''}`}
        onClick={toggleZenMode}
        title={isZenModeActive ? 'Disable Zen Mode' : 'Enable Zen Mode - Focus on priority items'}
      >
        <span className="zen-icon">{isZenModeActive ? '🧘' : '🌿'}</span>
        <span className="zen-label">Zen Mode</span>
        <span className={`zen-indicator ${isZenModeActive ? 'on' : 'off'}`} />
      </button>
      {isZenModeActive && autoTriggeredReason && (
        <span className="zen-auto-reason" title={autoTriggeredReason}>
          Auto
        </span>
      )}
    </div>
  );
}

export default ZenModeToggle;
