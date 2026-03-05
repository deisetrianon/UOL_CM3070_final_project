/**
 * Login page component.
 * Handles user authentication via Google OAuth.
 * Displays login interface and authentication status.
 * 
 * @module pages/Login
 * @component
 * @returns {JSX.Element} Login page component
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import importantIcon from '../../assets/icons/important.png';
import checkIcon from '../../assets/icons/check.png';
import faceIcon from '../../assets/icons/face.png';
import clipboardIcon from '../../assets/icons/clipboard.png';
import './Login.css';

function Login() {
  const { isAuthenticated, isLoading, loginWithGoogle, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/home';

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const searchParams = new URLSearchParams(location.search);
  const authError = searchParams.get('error');
  
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth_failed': 'Authentication failed. Please try again.',
      'network_error': 'Network connection error. Please check your internet connection and try again.',
      'invalid_credentials': 'Authentication error. Please try signing in again.',
      'oauth_not_configured': 'Google OAuth is not configured. Please add credentials to server/.env',
      'session_expired': 'Your session has expired. Please sign in again.'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  };

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="loading-spinner"></div>
            <p style={{ textAlign: 'center', marginTop: '16px', color: '#4b5563' }}>Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="logo-text">
            <span className="text-gradient">ZenFlow</span>
          </h1>
          <p className="login-subtitle">Your emotion-aware productivity companion</p>
        </div>
        <div className="login-card">
          <h2>Welcome</h2>
          <p className="login-description">
            Sign in to manage your work with wellness in mind.
          </p>
          {(error || authError) && (
            <div className="login-error">
              <img src={importantIcon} alt="Warning" className="warning-icon" />
              <span>{error || getErrorMessage(authError)}</span>
            </div>
          )}
          <button 
            className="google-signin-btn"
            onClick={loginWithGoogle}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
          <div className="login-divider">
            <span className="divider-text">What you'll get</span>
          </div>
          <div className="login-features">
            <div className="feature">
              <div className="feature-icon-wrapper feature-icon-green">
                <img src={checkIcon} alt="Check" className="feature-icon" />
              </div>
              <div className="feature-content">
                <div className="feature-title">Real-time Stress Detection</div>
                <div className="feature-description">AI-powered monitoring through facial analysis and typing patterns</div>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon-wrapper feature-icon-purple">
                <img src={faceIcon} alt="Face" className="feature-icon" />
              </div>
              <div className="feature-content">
                <div className="feature-title">Personalized Wellness Support</div>
                <div className="feature-description">Breathing exercises, mindfulness, and proactive break reminders</div>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon-wrapper feature-icon-blue">
                <img src={clipboardIcon} alt="Clipboard" className="feature-icon" />
              </div>
              <div className="feature-content">
                <div className="feature-title">Integrated Productivity Tools</div>
                <div className="feature-description">Email, tasks, calendar with Gmail & Google Calendar sync</div>
              </div>
            </div>
          </div>
          <p className="login-privacy">
            Your sensitive data is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
