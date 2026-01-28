import { useFacialAnalysis } from '../../contexts/FacialAnalysisContext';
import { useStressFusion } from '../../contexts/StressFusionContext';
import ZenModeToggle from '../ZenModeToggle';
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

  // Getting stress status for indicator (using unified stress level from fusion)
  const getStressStatus = () => {
    if (stressLevel === 'high') {
      return { level: 'high', emoji: '😖', text: 'High stress detected' };
    } else if (stressLevel === 'moderate') {
      return { level: 'moderate', emoji: '😐', text: 'Moderate stress detected' };
    } else {
      return { level: 'good', emoji: '😊', text: 'Looking good!' };
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
      <div className="navbar-right">
        {cameraPermission === 'granted' && stressStatus && (
          <div className={`wellness-indicator ${stressStatus.level}`} title={stressStatus.text}>
            <span className="wellness-emoji">{stressStatus.emoji}</span>
            {isAnalyzing && <span className="analyzing-dot"></span>}
            {formatLastAnalysis() && (
              <span className="wellness-time">{formatLastAnalysis()}</span>
            )}
          </div>
        )}
        <ZenModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

export default Navbar;
