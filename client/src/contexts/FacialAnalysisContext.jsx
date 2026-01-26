import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FacialAnalysisContext = createContext(null);

/**
 * Facial Analysis Context Provider
 * Manages facial analysis state and provides methods for analyzing facial expressions
 */
export function FacialAnalysisProvider({ children }) {
  const { registerLogoutCallback, isAuthenticated } = useAuth();
  const [cameraPermission, setCameraPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null);
  const [error, setError] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [analysisFrequency, setAnalysisFrequency] = useState(5);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const hasRequestedPermission = useRef(false);
  const isVideoReadyRef = useRef(false);
  const analysisFrequencyRef = useRef(5); // Ref to avoid closure issues

  const fetchFrequencyPreference = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/settings', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.settings?.facialAnalysis?.frequency) {
        const frequency = data.settings.facialAnalysis.frequency;
        setAnalysisFrequency(frequency);
        analysisFrequencyRef.current = frequency;
        console.log('[FacialAnalysis] Loaded frequency preference:', frequency, 'minutes');
      }
    } catch (err) {
      console.error('[FacialAnalysis] Failed to fetch frequency preference:', err);
    }
  }, [isAuthenticated]);

  // Fetching preferences on auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchFrequencyPreference();
    }
  }, [isAuthenticated, fetchFrequencyPreference]);

  // Updating frequency and restarting interval if running
  const updateAnalysisFrequency = useCallback((newFrequency) => {
    const frequency = Math.max(1, Math.min(60, newFrequency));
    setAnalysisFrequency(frequency);
    analysisFrequencyRef.current = frequency;
    console.log('[FacialAnalysis] Frequency updated to:', frequency, 'minutes');

    // Restarting auto-analysis with new frequency if running
    if (intervalRef.current && streamRef.current) {
      console.log('[FacialAnalysis] Restarting auto-analysis with new frequency');
      clearInterval(intervalRef.current);
      
      const intervalMs = frequency * 60 * 1000;
      intervalRef.current = setInterval(() => {
        console.log('[FacialAnalysis] Performing scheduled analysis');
        performAnalysisInternal();
      }, intervalMs);
    }
  }, []);

  // Checking browser's camera permission state without triggering the prompt
  useEffect(() => {
    const checkExistingPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' });
        console.log('[FacialAnalysis] Browser camera permission state:', result.state);
        setCameraPermission(result.state);
        
        // Listening for permission changes on browser settings
        result.addEventListener('change', () => {
          console.log('[FacialAnalysis] Permission state changed to:', result.state);
          setCameraPermission(result.state);
        });
      } catch (err) {
        // Safari doesn't support permissions.query for camera. Defaults to 'prompt' and shows the modal
        console.log('[FacialAnalysis] Could not query camera permission (Safari?)');
        setCameraPermission('prompt');
      }
    };

    checkExistingPermission();
  }, []);

  const setupVideoElement = useCallback((stream) => {
    return new Promise((resolve, reject) => {
      try {
        if (!videoRef.current) {
          videoRef.current = document.createElement('video');
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.muted = true;
        }

        const video = videoRef.current;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play()
            .then(() => {
              console.log('[FacialAnalysis] Video is ready:', video.videoWidth, 'x', video.videoHeight);
              isVideoReadyRef.current = true;
              setIsVideoReady(true);
              resolve(true);
            })
            .catch(err => {
              console.error('[FacialAnalysis] Error playing video:', err);
              reject(err);
            });
        };

        video.onerror = (err) => {
          console.error('[FacialAnalysis] Video error:', err);
          reject(err);
        };

      } catch (err) {
        console.error('[FacialAnalysis] Error setting up video:', err);
        reject(err);
      }
    });
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      setError(null);
      console.log('[FacialAnalysis] Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      streamRef.current = stream;
      setCameraPermission('granted');
      setShowPermissionModal(false);
      
      await setupVideoElement(stream);
      
      console.log('[FacialAnalysis] Camera permission granted and video ready');
      return true;
    } catch (err) {
      console.error('[FacialAnalysis] Camera permission denied:', err.message);
      setCameraPermission('denied');
      setShowPermissionModal(false);
      isVideoReadyRef.current = false;
      setIsVideoReady(false);
      setError('Camera access was denied. You can enable Zen Mode manually.');
      return false;
    }
  }, [setupVideoElement]);

  const captureFrame = useCallback(() => {
    if (!streamRef.current || !videoRef.current || !isVideoReadyRef.current) {
      console.log('[FacialAnalysis] Cannot capture: stream/video not ready', {
        hasStream: !!streamRef.current,
        hasVideo: !!videoRef.current,
        isVideoReady: isVideoReadyRef.current
      });
      return null;
    }

    const video = videoRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('[FacialAnalysis] Video has no dimensions yet');
      return null;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.95);
  }, []);

  // Performing internal analysis to avoid circular dependency
  const performAnalysisInternal = async () => {
    if (!streamRef.current || !isVideoReadyRef.current) {
      console.log('[FacialAnalysis] Stream or video not ready, skipping analysis');
      return null;
    }

    try {
      console.log('[FacialAnalysis] Starting analysis...');

      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('[FacialAnalysis] Video not ready for capture');
        return null;
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg', 0.95);

      console.log('[FacialAnalysis] Captured image, sending to API...');

      const response = await fetch('/api/facial-analysis/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imageData }),
        credentials: 'include'
      });

      const result = await response.json();
      
      // Updating state outside of the interval callback
      setLastResult(result);
      setLastAnalysisTime(new Date());
      
      console.log('[FacialAnalysis] Analysis completed:', result.success ? 'Success' : 'Failed');
      
      return result;
    } catch (err) {
      console.error('[FacialAnalysis] Analysis error:', err.message);
      setError(err.message);
      return null;
    }
  };

  const performAnalysis = useCallback(async () => {
    if (isAnalyzing) {
      console.log('[FacialAnalysis] Already analyzing, skipping');
      return null;
    }
    
    if (!streamRef.current || !isVideoReadyRef.current) {
      console.log('[FacialAnalysis] Stream or video not ready, skipping analysis', {
        hasStream: !!streamRef.current,
        isVideoReady: isVideoReadyRef.current
      });
      return null;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      console.log('[FacialAnalysis] Starting analysis...');

      const imageData = captureFrame();
      if (!imageData) {
        throw new Error('Could not capture frame from video');
      }

      console.log('[FacialAnalysis] Captured image, sending to API...');

      const response = await fetch('/api/facial-analysis/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imageData }),
        credentials: 'include'
      });

      const result = await response.json();
      
      setLastResult(result);
      setLastAnalysisTime(new Date());
      
      console.log('[FacialAnalysis] Analysis completed:', result.success ? 'Success' : 'Failed', result);
      
      return result;
    } catch (err) {
      console.error('[FacialAnalysis] Analysis error:', err.message);
      setError(err.message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, captureFrame]);

  // Starting automatic analysis with user-configured frequency
  const startAutoAnalysis = useCallback(() => {
    // Checking if there is a stream (not cameraPermission state to avoid closure issues)
    if (!streamRef.current) {
      console.log('[FacialAnalysis] No stream available, cannot start auto-analysis');
      return;
    }

    // Clearing any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const intervalMs = analysisFrequencyRef.current * 60 * 1000;
    console.log(`[FacialAnalysis] Starting auto-analysis (initial + every ${analysisFrequencyRef.current} minutes)`);

    // Performing initial analysis immediately (with a small delay for video to stabilize)
    setTimeout(() => {
      console.log('[FacialAnalysis] Performing initial analysis');
      performAnalysisInternal();
    }, 1000);

    // Setting up interval for subsequent analyses using the configured frequency
    intervalRef.current = setInterval(() => {
      console.log('[FacialAnalysis] Performing scheduled analysis');
      performAnalysisInternal();
    }, intervalMs);
  }, []);

  const promptForPermission = useCallback(async () => {
    if (hasRequestedPermission.current) return;
    
    console.log('[FacialAnalysis] promptForPermission called, state:', cameraPermission);
    
    if (cameraPermission === 'granted') {
      console.log('[FacialAnalysis] Permission already granted, starting analysis');
      hasRequestedPermission.current = true;
      
      if (!streamRef.current) {
        const success = await requestCameraPermission();
        if (success) {
          startAutoAnalysis();
        }
      } else {
        startAutoAnalysis();
      }
      return;
    }
    
    if (cameraPermission === 'denied') {
      console.log('[FacialAnalysis] Permission denied by browser');
      hasRequestedPermission.current = true;
      setError('Camera access was previously denied. Please enable it in your browser settings.');
      return;
    }
    
    hasRequestedPermission.current = true;
    setShowPermissionModal(true);
  }, [cameraPermission, requestCameraPermission, startAutoAnalysis]);

  // Stopping automatic analysis
  const stopAutoAnalysis = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stopping video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Resetting video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    isVideoReadyRef.current = false;
    setIsVideoReady(false);
    console.log('[FacialAnalysis] Auto-analysis stopped');
  }, []);

  const handleAllowCamera = useCallback(async () => {
    console.log('[FacialAnalysis] User clicked Allow Camera');
    const granted = await requestCameraPermission();
    if (granted) {
      startAutoAnalysis();
    }
  }, [requestCameraPermission, startAutoAnalysis]);

  // Handle permission modal actions - user clicked "Not Now"
  const handleDenyCamera = useCallback(() => {
    setShowPermissionModal(false);
    console.log('[FacialAnalysis] User declined camera permission in our modal');
  }, []);

  // Resetting session state on logout
  const resetSession = useCallback(() => {
    console.log('[FacialAnalysis] Resetting session state');
    hasRequestedPermission.current = false;
    isVideoReadyRef.current = false;
    analysisFrequencyRef.current = 5; // Resetting to default
    setAnalysisFrequency(5);
    setShowPermissionModal(false);
    setLastResult(null);
    setLastAnalysisTime(null);
    setError(null);
    setIsVideoReady(false);
    stopAutoAnalysis();
  }, [stopAutoAnalysis]);

  useEffect(() => {
    if (registerLogoutCallback) {
      const unregister = registerLogoutCallback(resetSession);
      return unregister;
    }
  }, [registerLogoutCallback, resetSession]);

  // Cleaning up on unmount
  useEffect(() => {
    return () => {
      stopAutoAnalysis();
    };
  }, [stopAutoAnalysis]);

  const value = {
    cameraPermission,
    isAnalyzing,
    lastResult,
    lastAnalysisTime,
    error,
    showPermissionModal,
    isVideoReady,
    analysisFrequency,
    promptForPermission,
    requestCameraPermission,
    performAnalysis,
    startAutoAnalysis,
    stopAutoAnalysis,
    handleAllowCamera,
    handleDenyCamera,
    resetSession,
    updateAnalysisFrequency,
    refetchFrequency: fetchFrequencyPreference
  };

  return (
    <FacialAnalysisContext.Provider value={value}>
      {children}
    </FacialAnalysisContext.Provider>
  );
}

export function useFacialAnalysis() {
  const context = useContext(FacialAnalysisContext);
  if (!context) {
    throw new Error('useFacialAnalysis must be used within a FacialAnalysisProvider');
  }
  return context;
}
