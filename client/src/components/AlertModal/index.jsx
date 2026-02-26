import './AlertModal.css';

function AlertModal({ message, onClose, type = 'info' }) {
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

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`alert-modal-icon alert-modal-icon-${type}`}>
          {getIcon()}
        </div>
        <div className="alert-modal-content">
          <h3 className="alert-modal-title">{getTitle()}</h3>
          <p className="alert-modal-message">{message}</p>
        </div>
        <button className="alert-modal-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

export default AlertModal;
