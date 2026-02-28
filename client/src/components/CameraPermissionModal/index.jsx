import { useFacialAnalysis } from '../../contexts/FacialAnalysisContext';
import webcamIcon from '../../assets/icons/webcam.png';
import './CameraPermissionModal.css';

function CameraPermissionModal() {
  const { showPermissionModal, handleAllowCamera, handleDenyCamera } = useFacialAnalysis();

  if (!showPermissionModal) return null;

  return (
    <div className="permission-modal-overlay">
      <div className="permission-modal">
        <h2>Enable Wellness Monitoring?</h2>       
        <p className="permission-description">
          The Empathetic Workspace can monitor your facial expressions to detect signs of 
          stress and fatigue, helping you maintain a healthy work balance.
        </p>
        <ul className="permission-features">
          <li className="feature-item">
            <span>Detects fatigue and stress indicators</span>
          </li>
          <li className="feature-item">
            <span>Runs automatically every 5 minutes</span>
          </li>
          <li className="feature-item">
            <span>Your video is never stored or shared</span>
          </li>
        </ul>
        <p className="permission-privacy">
          You can disable this anytime using the <strong>Zen Mode</strong> toggle.
          After clicking "Allow Camera", your browser will ask for confirmation.
        </p>
        <div className="permission-actions">
          <button className="deny-btn" onClick={handleDenyCamera}>
            Not Now
          </button>
          <button className="allow-btn" onClick={handleAllowCamera}>
            <img src={webcamIcon} alt="Camera" />
            Allow Camera
          </button>
        </div>
      </div>
    </div>
  );
}

export default CameraPermissionModal;
