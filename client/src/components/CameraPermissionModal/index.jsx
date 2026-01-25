import { useFacialAnalysis } from '../../contexts/FacialAnalysisContext';
import './CameraPermissionModal.css';

function CameraPermissionModal() {
  const { showPermissionModal, handleAllowCamera, handleDenyCamera } = useFacialAnalysis();

  if (!showPermissionModal) return null;

  return (
    <div className="permission-modal-overlay">
      <div className="permission-modal">
        <div className="permission-icon">
          <span className="camera-emoji">📷</span>
          <span className="wellness-emoji">🧘</span>
        </div>     
        <h2>Enable Wellness Monitoring?</h2>       
        <p className="permission-description">
          Empathetic Workspace can monitor your facial expressions to detect signs of 
          stress and fatigue, helping you maintain a healthy work balance.
        </p>
        <div className="permission-features">
          <div className="feature-item">
            <span className="feature-icon">👁️</span>
            <span>Detects fatigue and stress indicators</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⏰</span>
            <span>Runs automatically every 5 minutes</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span>Your video is never stored or shared</span>
          </div>
        </div>
        <p className="permission-privacy">
          You can disable this anytime using the <strong>Zen Mode</strong> toggle.
        </p>
        <p className="permission-browser-note">
          After clicking "Allow Camera", your browser will ask for confirmation.
        </p>
        <div className="permission-actions">
          <button className="deny-btn" onClick={handleDenyCamera}>
            Not Now
          </button>
          <button className="allow-btn" onClick={handleAllowCamera}>
            <span>📷</span> Allow Camera
          </button>
        </div>
      </div>
    </div>
  );
}

export default CameraPermissionModal;
