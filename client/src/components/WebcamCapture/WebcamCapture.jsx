import { useState, useRef, useCallback, useEffect } from 'react';
import './WebcamCapture.css';

/**
 * WebcamCapture Component
 * Captures webcam frames and sends them to the Azure Face API for analysis
 * POC component for validating the facial analysis feature
 */
function WebcamCapture() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [privacyMode, setPrivacyMode] = useState(true); 

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('/api/facial-analysis/status');
      const data = await response.json();
      setApiStatus(data);
    } catch (err) {
      setApiStatus({ success: false, error: 'Cannot connect to server' });
    }
  };

  const startWebcam = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          // Higher resolution for better face detection: Azure recommends up to 1920x1080
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          // Requesting higher frame rate and auto-focus for clearer images
          frameRate: { ideal: 30 },
          // The following constraints help reduce blur
          autoGainControl: true,
          noiseSuppression: true
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        console.log('Webcam settings:', {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate
        });
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions.'
          : `Failed to access webcam: ${err.message}`
      );
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas size to match video (use actual video dimensions)
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // Drawing current video frame to canvas with high quality settings
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Converting to base64 JPEG with HIGH quality (0.95) to reduce blur. Azure recommends clear images for best detection results
      const imageData = canvas.toDataURL('image/jpeg', 0.95);

      const response = await fetch('/api/facial-analysis/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imageData })
      });

      const result = await response.json();

      console.log('Azure Face API Response: ', result);

      if (result.success) {        
        if (result.analysis?.detected) {
          console.log('📊 Stress Indicators:', result.analysis.stressIndicators);
          console.log('🎯 Head Pose:', result.analysis.headPose);
          console.log('👁️ Eye Aspect Ratio:', result.analysis.eyeAspectRatio);
          console.log('📷 Image Quality:', result.analysis.imageQuality);
        }
        
        setLastResult(result);
      } else {
        console.error('Analysis failed:', result.error);
        setError(result.error);
      }

    } catch (err) {
      console.error('Request error:', err);
      setError(`Failed to analyze: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return (
    <div className="webcam-capture">
      <div className="webcam-header">
        <h2>🎥 Facial Analysis POC</h2>
        <p className="webcam-subtitle">
          POC using Azure Face API integration
        </p>
      </div>
      <div className={`api-status ${apiStatus?.success ? 'success' : 'error'}`}>
        <span className="status-dot"></span>
        <span>
          {apiStatus?.success 
            ? 'Azure Face API configured' 
            : apiStatus?.error || 'Checking API status...'}
        </span>
      </div>
      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <div className="main-content">
        <div className="video-section">
          <div className="privacy-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={privacyMode}
                onChange={(e) => setPrivacyMode(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">
                Privacy Mode
              </span>
            </label>
          </div>
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`${isStreaming ? 'active' : ''} ${privacyMode ? 'privacy-blur' : ''}`}
            />
            {!isStreaming && (
              <div className="video-placeholder">
                <span className="placeholder-icon">📷</span>
                <span>Camera not started</span>
              </div>
            )}
            {isStreaming && privacyMode && (
              <div className="privacy-indicator">
                <span>🔒 Privacy Mode Active</span>
              </div>
            )}
            {isAnalyzing && (
              <div className="analyzing-overlay">
                <div className="spinner"></div>
                <span>Analyzing...</span>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="controls">
            {!isStreaming ? (
              <button 
                className="btn btn-primary" 
                onClick={startWebcam}
                disabled={!apiStatus?.success}
              >
                START
              </button>
            ) : (
              <>
                <button 
                  className="btn btn-accent" 
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? '⏳ Analyzing...' : 'Capture & Analyze'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={stopWebcam}
                  disabled={isAnalyzing}
                >
                  ⏹️ Stop Camera
                </button>
              </>
            )}
          </div>
        </div>
        <div className="results-section">
          {lastResult && lastResult.success ? (
            <div className="results-panel">
              <h3>📊 Analysis Result</h3>
              <div className="result-grid">
                <div className="result-card">
                  <span className="result-label">Faces Detected</span>
                  <span className="result-value">{lastResult.faceCount}</span>
                </div>
                {lastResult.analysis?.detected && (
                  <>
                    <div className="result-card">
                      <span className="result-label">Head Pose</span>
                      <span className="result-value small">
                        Pitch: {lastResult.analysis.headPose.pitch.toFixed(1)}°<br/>
                        Yaw: {lastResult.analysis.headPose.yaw.toFixed(1)}°<br/>
                        Roll: {lastResult.analysis.headPose.roll.toFixed(1)}°
                      </span>
                    </div>
                    <div className="result-card">
                      <span className="result-label">Eye Aspect Ratio</span>
                      <span className="result-value">
                        {lastResult.analysis.eyeAspectRatio?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="result-card fatigue-card">
                      <span className="result-label">Fatigue Score</span>
                      <span className={`result-value ${
                        lastResult.analysis.stressIndicators.fatigueLevel === 'high' ? 'error' :
                        lastResult.analysis.stressIndicators.fatigueLevel === 'moderate' ? 'warning' : 'good'
                      }`}>
                        {lastResult.analysis.stressIndicators.fatigueScore}/100
                        <span className="fatigue-level">
                          ({lastResult.analysis.stressIndicators.fatigueLevel})
                        </span>
                      </span>
                    </div>
                    <div className="result-card">
                      <span className="result-label">Distraction</span>
                      <span className={`result-value ${lastResult.analysis.stressIndicators.possibleDistraction ? 'warning' : 'good'}`}>
                        {lastResult.analysis.stressIndicators.possibleDistraction ? '⚠️ Looking away' : '✅ Focused'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {lastResult.analysis?.stressIndicators?.fatigueReasons?.length > 0 && (
                <div className="fatigue-reasons">
                  <h4>⚠️ Fatigue Indicators Detected:</h4>
                  <ul>
                    {lastResult.analysis.stressIndicators.fatigueReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="results-panel results-placeholder">
              <h3>Analysis Result</h3>
              <div className="test-hints">
                <h4>How to test fatigue detection:</h4>
                <ul>
                  <li><strong>Head drop:</strong> Tilt head down (pitch &lt; -7°)</li>
                  <li><strong>Head tilt:</strong> Tilt head sideways (roll &gt; 15°)</li>
                  <li><strong>Eyes closing:</strong> Squint or partially close eyes (EAR &lt; 0.28)</li>
                  <li><strong>Distraction:</strong> Look left/right (yaw &gt; 20°)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WebcamCapture;
