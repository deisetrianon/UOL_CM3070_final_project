import { useState } from 'react';
import { useFacialAnalysis } from '../../contexts/FacialAnalysisContext';
import { useStressFusion } from '../../contexts/StressFusionContext';
import { useWellnessIntervention } from '../../contexts/WellnessInterventionContext';
import ZenModeToggle from '../ZenModeToggle';
import UserMenu from '../UserMenu';
import './Navbar.css';

function Navbar() {
  const { isAnalyzing, lastAnalysisTime, cameraPermission } = useFacialAnalysis();
  const { stressLevel } = useStressFusion();
  const { openBreathing, openMindfulness, openStretching, openAnxietyRelief, openMentalHealth } = useWellnessIntervention();
  const [showWellnessMenu, setShowWellnessMenu] = useState(false);

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
    <header className="app-navbar">
      <div className="navbar-left">
        <div className="navbar-logo">
          <span className="logo-title">Empathetic Workspace</span>
        </div>
      </div>
      <div className="navbar-center">
        {cameraPermission === 'granted' && stressStatus && (
          <div 
            className={`wellness-indicator ${stressStatus.level}`} 
            title={`Stress level: ${stressStatus.label}`}
            style={{ '--stress-color': stressStatus.color }}
          >
            <span className="wellness-stress-label">
              <span className="wellness-status-prefix">Status:</span>{' '}
              <span className="wellness-status-value">{stressStatus.label}</span>
            </span>
            {isAnalyzing && <span className="analyzing-dot"></span>}
            {formatLastAnalysis() && (
              <span className="wellness-time"> - {formatLastAnalysis()}</span>
            )}
          </div>
        )}
        <ZenModeToggle />
      </div>
      <div className="navbar-right">
        <UserMenu />
      </div>
    </header>
  );
}

export default Navbar;
