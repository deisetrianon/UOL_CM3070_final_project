/**
 * Zen Mode Toggle component.
 * Toggle button for enabling/disabling Zen Mode with status messages.
 * Shows whether Zen Mode is active, auto-triggered, or manually toggled.
 * 
 * @module components/ZenModeToggle
 * @component
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Zen Mode Toggle component
 */

import { useState, useEffect, useRef } from 'react';
import { useZenMode } from '../../contexts/ZenModeContext';
import './ZenModeToggle.css';

function ZenModeToggle({ className = '' }) {
  const { isZenModeActive, autoTriggeredReason, autoZenModeEnabled, isManuallyToggled, toggleZenMode } = useZenMode();
  const [statusMessage, setStatusMessage] = useState(null);
  const prevStateRef = useRef({ 
    isActive: isZenModeActive, 
    autoTriggered: !!autoTriggeredReason,
    manuallyToggled: isManuallyToggled 
  });

  useEffect(() => {
    const prev = prevStateRef.current;
    const current = { 
      isActive: isZenModeActive, 
      autoTriggered: !!autoTriggeredReason,
      manuallyToggled: isManuallyToggled 
    };

    if (prev.isActive !== current.isActive) {
      if (current.isActive) {
        if (current.autoTriggered && !current.manuallyToggled) {
          setStatusMessage({ type: 'auto-enabled', text: 'Zen Mode enabled automatically' });
        } else if (current.manuallyToggled) {
          setStatusMessage({ type: 'manual-enabled', text: 'Zen Mode enabled manually' });
        }
      } else {
        if (prev.autoTriggered && !prev.manuallyToggled) {
          setStatusMessage({ type: 'auto-disabled', text: 'Zen Mode disabled automatically' });
        } else {
          setStatusMessage({ type: 'manual-disabled', text: 'Zen Mode disabled manually' });
        }
      }

      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);

      prevStateRef.current = current;
      return () => clearTimeout(timer);
    } else {
      prevStateRef.current = current;
    }
  }, [isZenModeActive, autoTriggeredReason, isManuallyToggled]);

  return (
    <div className={`zen-mode-wrapper ${className}`}>
      <label className="zen-toggle-container">
        <div className="zen-labels-row">
          <span className="zen-label">Zen</span>
          {autoZenModeEnabled && (
            <span 
              className={`zen-auto-badge ${isZenModeActive && autoTriggeredReason && !isManuallyToggled ? 'active-auto' : 'available-auto'}`}
            >
              AUTO
            </span>
          )}
        </div>
        <button 
          className={`zen-mode-toggle ${isZenModeActive ? 'active' : ''}`}
          onClick={toggleZenMode}
          type="button"
          role="switch"
          aria-checked={isZenModeActive}
          aria-label={`${isZenModeActive ? 'Disable' : 'Enable'} Zen Mode. ${autoZenModeEnabled ? 'Automatic mode is available.' : ''}`}
        >
          <span className="zen-toggle-track">
            <span className="zen-toggle-handle"></span>
          </span>
        </button>
      </label>
      {statusMessage && (
        <div className={`zen-status-message ${statusMessage.type}`}>
          <span className="status-text">{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}

export default ZenModeToggle;
