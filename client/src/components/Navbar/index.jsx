/**
 * Navbar component.
 * Top navigation bar with facial analysis status, stress level indicator, Zen Mode toggle, Pomodoro timer, and user menu.
 * 
 * @module components/Navbar
 * @component
 * @returns {JSX.Element} Navbar component
 */

import { Link } from 'react-router-dom';
import { useFacialAnalysis } from '../../contexts/FacialAnalysisContext';
import { useStressFusion } from '../../contexts/StressFusionContext';
import ZenModeToggle from '../ZenModeToggle';
import PomodoroTimer from '../PomodoroTimer';
import UserMenu from '../UserMenu';
import './Navbar.css';

function Navbar() {
  const { isAnalyzing, lastAnalysisTime, cameraPermission } = useFacialAnalysis();
  const { stressLevel } = useStressFusion();

  const formatLastAnalysis = () => {
    if (!lastAnalysisTime) return null;
    const now = new Date();
    const diff = now - lastAnalysisTime;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const getStressStatus = () => {
    if (stressLevel === 'high') {
      return { level: 'high', label: 'High stress', color: '#ef4444' };
    } else if (stressLevel === 'moderate') {
      return { level: 'moderate', label: 'Moderate stress', color: '#f59e0b' };
    } else {
      return { level: 'low', label: 'Low stress', color: '#22c55e' };
    }
  };

  const stressStatus = getStressStatus();

  return (
    <header className="app-navbar" role="banner">
      <nav className="navbar-left" aria-label="Main navigation">
        <div className="navbar-logo">
          <Link to="/home" className="logo-title" aria-label="ZenFlow - Go to home">
            <span className="text-gradient">ZenFlow</span>
          </Link>
        </div>
      </nav>
      <div className="navbar-center" role="toolbar" aria-label="Wellness controls">
        <PomodoroTimer />
        {cameraPermission === 'granted' && stressStatus && (
          <div 
            className={`wellness-indicator ${stressStatus.level}`} 
            role="status"
            aria-live="polite"
            aria-label={`Current stress level: ${stressStatus.label}`}
            title={`Stress level: ${stressStatus.label}`}
          >
            <span className="stress-dot" aria-hidden="true"></span>
            <span className="stress-label">{stressStatus.label}</span>
            {isAnalyzing && (
              <span className="analyzing-dot" aria-label="Analyzing stress level" aria-hidden="true"></span>
            )}
          </div>
        )}
        <ZenModeToggle />
      </div>
      <div className="navbar-right" role="toolbar" aria-label="User menu">
        <UserMenu />
      </div>
    </header>
  );
}

export default Navbar;
