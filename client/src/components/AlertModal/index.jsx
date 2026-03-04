import { useEffect, useRef } from 'react';
import './AlertModal.css';

function AlertModal({ message, onClose, type = 'info' }) {
  const buttonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (message) {
      previousFocusRef.current = document.activeElement;
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.focus();
        }
      }, 100);
    }

    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [message]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && message) {
        onClose();
      }
    };

    if (message) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [message, onClose]);

  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'success':
        return 'Success';
      default:
        return 'Information';
    }
  };

  const getRole = () => {
    switch (type) {
      case 'error':
        return 'alert';
      default:
        return 'alertdialog';
    }
  };

  return (
    <div 
      className="alert-modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
    >
      <div className="alert-modal" onClick={(e) => e.stopPropagation()} role="document">
        <div className={`alert-modal-icon alert-modal-icon-${type}`} aria-hidden="true">
          {getIcon()}
        </div>
        <div className="alert-modal-content">
          <h3 id="alert-modal-title" className="alert-modal-title">{getTitle()}</h3>
          <p className="alert-modal-message" role={getRole()}>{message}</p>
        </div>
        <button 
          className="alert-modal-button" 
          onClick={onClose}
          ref={buttonRef}
          aria-label="Close alert"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default AlertModal;
