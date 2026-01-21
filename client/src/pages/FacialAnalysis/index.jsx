import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import WebcamCapture from '../../components/WebcamCapture';
import './FacialAnalysis.css';

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
        <WebcamCapture />
      </main>
    </div>
  );
}

export default FacialAnalysis;
