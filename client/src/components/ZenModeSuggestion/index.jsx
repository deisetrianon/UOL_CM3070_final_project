import { useState, useEffect } from 'react';
import { useZenMode } from '../../contexts/ZenModeContext';
import './ZenModeSuggestion.css';

function ZenModeSuggestion() {
  const { 
    showSuggestion, 
    suggestionReason, 
    enableZenMode,
    dismissSuggestion 
  } = useZenMode();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (showSuggestion) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [showSuggestion]);

  const handleEnable = () => {
    enableZenMode('Enabled via suggestion');
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      dismissSuggestion();
    }, 300);
  };

  if (!showSuggestion) return null;

  return (
    <div className={`zen-suggestion ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}>
      <div className="zen-suggestion-content">
        <div className="zen-suggestion-icon">
          <span className="pulse-emoji">😴</span>
        </div>
        <div className="zen-suggestion-text">
          <h4>Feeling tired?</h4>
          <p>{suggestionReason || 'We noticed signs of fatigue. Would you like to enable Zen Mode?'}</p>
        </div>
        <div className="zen-suggestion-actions">
          <button className="dismiss-btn" onClick={handleDismiss}>
            Not now
          </button>
          <button className="enable-btn" onClick={handleEnable}>
            <span>🧘</span> Enable Zen Mode
          </button>
        </div>
        <button className="close-btn" onClick={handleDismiss} title="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}

export default ZenModeSuggestion;
