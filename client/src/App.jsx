import { useState, useEffect } from 'react';
import WebcamCapture from './components/WebcamCapture';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFacialPOC, setShowFacialPOC] = useState(false);

  useEffect(() => {
    // Check API health on mount
    const checkApiHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setApiStatus(data);
      } catch (error) {
        setApiStatus({ status: 'error', message: 'Cannot connect to API' });
      } finally {
        setLoading(false);
      }
    };

    checkApiHealth();
  }, []);

  if (showFacialPOC) {
    return (
      <div className="app">
        <nav className="poc-nav">
          <button className="back-btn" onClick={() => setShowFacialPOC(false)}>
            ← Back to Home
          </button>
          <span className="nav-title">Facial Analysis POC</span>
        </nav>
        <main className="poc-main">
          <WebcamCapture />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content animate-slide-up">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="url(#logoGrad)"/>
                <path d="M30 50 Q50 30 70 50 Q50 70 30 50" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="50" cy="50" r="8" fill="white"/>
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="logo-text">
              <span className="text-gradient">Empathetic</span> Workspace
            </h1>
          </div>
          <p className="hero-description">
            An emotion-aware adaptive email and task manager designed to reduce 
            workplace stress and enhance your productivity through intelligent 
            cognitive load management.
          </p>
          <div className="status-card">
            <div className="status-header">
              <span className="status-icon">
                {loading ? '⏳' : apiStatus?.status === 'ok' ? '✓' : '✗'}
              </span>
              <span className="status-title">System Status</span>
            </div>
            <div className="status-body">
              {loading ? (
                <p className="status-message animate-pulse">Connecting to server...</p>
              ) : (
                <>
                  <p className={`status-message ${apiStatus?.status === 'ok' ? 'success' : 'error'}`}>
                    {apiStatus?.message}
                  </p>
                  {apiStatus?.timestamp && (
                    <p className="status-timestamp">
                      Last checked: {new Date(apiStatus.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="features">
            <div className="feature-card" style={{ animationDelay: '0.1s' }}>
              <div className="feature-icon">🧘</div>
              <h3>Zen Mode</h3>
              <p>Adaptive UI that simplifies when you&apos;re stressed</p>
            </div>
            <div className="feature-card" style={{ animationDelay: '0.2s' }}>
              <div className="feature-icon">📧</div>
              <h3>Smart Email</h3>
              <p>Priority-filtered inbox with Gmail integration</p>
            </div>
            <div className="feature-card" style={{ animationDelay: '0.3s' }}>
              <div className="feature-icon">✅</div>
              <h3>Task Manager</h3>
              <p>Drag-and-drop task board with stress-aware filtering</p>
            </div>
            <div className="feature-card" style={{ animationDelay: '0.4s' }}>
              <div className="feature-icon">🎯</div>
              <h3>Focus Detection</h3>
              <p>Facial & keystroke analysis for stress monitoring</p>
            </div>
          </div>
          <div className="poc-section">
            <h3>🧪 Proof of Concept</h3>
            <button 
              className="poc-button"
              onClick={() => setShowFacialPOC(true)}
            >
              🎥 Test Facial Analysis (Azure Face API)
            </button>
          </div>
          <div className="tech-stack">
            <span className="tech-badge">React</span>
            <span className="tech-badge">Node.js</span>
            <span className="tech-badge">Express</span>
            <span className="tech-badge">MongoDB</span>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </header>
    </div>
  );
}

export default App;
