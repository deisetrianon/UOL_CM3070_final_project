/**
 * Confirm Modal component.
 * Displays confirmation dialogs with customizable title, message, and button text.
 * Handles keyboard navigation and focus management for accessibility.
 * 
 * @module components/ConfirmModal
 * @component
 * @param {Object} props - Component props
 * @param {string} props.message - Confirmation message to display
 * @param {Function} props.onConfirm - Callback when confirmed
 * @param {Function} props.onCancel - Callback when cancelled
 * @param {string} props.title - Modal title (default: 'Confirm Action')
 * @param {string} props.confirmText - Confirm button text (default: 'Confirm')
 * @param {string} props.cancelText - Cancel button text (default: 'Cancel')
 * @param {string} props.type - Modal type ('warning', 'danger', 'info', default: 'warning')
 * @returns {JSX.Element|null} Confirm Modal component or null if no message
 */

import { useEffect, useRef } from 'react';
import trashIcon from '../../assets/icons/trash.png';
import importantIcon from '../../assets/icons/important.png';
import infoIcon from '../../assets/icons/info.png';
import './ConfirmModal.css';

function ConfirmModal({ message, onConfirm, onCancel, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) {
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (message) {
      previousFocusRef.current = document.activeElement;
      setTimeout(() => {
        if (cancelButtonRef.current) {
          cancelButtonRef.current.focus();
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
      if (!message) return;

      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (message) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [message, onCancel]);

  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <img src={trashIcon} alt="" aria-hidden="true" />;
      case 'warning':
        return <img src={importantIcon} alt="" aria-hidden="true" />;
      case 'info':
        return <img src={infoIcon} alt="" aria-hidden="true" />;
      default:
        return '';
    }
  };

  return (
    <div 
      className="confirm-modal-overlay" 
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()} role="document">
        <div className={`confirm-modal-icon confirm-modal-icon-${type}`} aria-hidden="true">
          {getIcon()}
        </div>
        <div className="confirm-modal-content">
          <h3 id="confirm-modal-title" className="confirm-modal-title">{title}</h3>
          <p className="confirm-modal-message">{message}</p>
        </div>
        <div className="confirm-modal-actions">
          <button 
            className="confirm-modal-button confirm-modal-button-cancel" 
            onClick={onCancel}
            ref={cancelButtonRef}
            aria-label={`${cancelText} action`}
          >
            {cancelText}
          </button>
          <button 
            className="confirm-modal-button confirm-modal-button-confirm" 
            onClick={onConfirm}
            aria-label={`${confirmText} action`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
