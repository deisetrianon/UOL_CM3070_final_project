import './ConfirmModal.css';

function ConfirmModal({ message, onConfirm, onCancel, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🗑️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-modal-icon confirm-modal-icon-${type}`}>
          {getIcon()}
        </div>
        <div className="confirm-modal-content">
          <h3 className="confirm-modal-title">{title}</h3>
          <p className="confirm-modal-message">{message}</p>
        </div>
        <div className="confirm-modal-actions">
          <button className="confirm-modal-button confirm-modal-button-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirm-modal-button confirm-modal-button-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
