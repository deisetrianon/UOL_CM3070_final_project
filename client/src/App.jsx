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
            ← Home
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
            <h1 className="logo-text">
              <span className="text-gradient">Empathetic Workspace</span> POC
            </h1>
          </div>
          <div className="status-card">
            <div className="status-header">
              <span className="status-icon">
                {loading ? '⏳' : apiStatus?.status === 'ok' ? '✓' : '✗'}
              </span>
              <span className="status-title">API Status</span>
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
            <h3>Proof of Concept (POC)</h3>
            <button 
              className="poc-button"
              onClick={() => setShowFacialPOC(true)}
            >
              🎥 Test Facial Analysis (Azure Face API)
            </button>
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
