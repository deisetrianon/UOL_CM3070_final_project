import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import WebcamCapture from '../../components/WebcamCapture';
import './FacialAnalysis.css';

/**
 * Facial Analysis Page
 * POC for Azure Face API integration
 */
function FacialAnalysis() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="facial-analysis-page">
      <nav className="facial-nav">
        <button 
          className="back-btn" 
          onClick={() => navigate(isAuthenticated ? '/home' : '/login')}
        >
          ← {isAuthenticated ? 'Back to Inbox' : 'Back to Login'}
        </button>
        <span className="nav-title">🎥 Facial Analysis POC</span>
        <span className="nav-badge">Azure Face API</span>
      </nav>

      <main className="facial-main">
        <div className="poc-info">
          <div className="info-card">
            <span className="info-icon">ℹ️</span>
            <div className="info-content">
              <h4>Proof of Concept</h4>
              <p>
                This facial analysis feature validates our Azure Face API integration.
                In the final product, analysis will occur <strong>automatically every few minutes</strong> in the background,
                without requiring any manual button clicks.
              </p>
            </div>
          </div>
        </div>
        
        <WebcamCapture />
      </main>
    </div>
  );
}

export default FacialAnalysis;
