import { useWellnessIntervention } from '../../contexts/WellnessInterventionContext';
import { useStressFusion } from '../../contexts/StressFusionContext';
import { useFacialAnalysis } from '../../contexts/FacialAnalysisContext';
import breathingIcon from '../../assets/icons/breathing.png';
import mindfulnessIcon from '../../assets/icons/mindfulness.png';
import stretchingIcon from '../../assets/icons/stretching.png';
import anxietyIcon from '../../assets/icons/anxiety.png';
import helpIcon from '../../assets/icons/help.png';
import loadingIcon from '../../assets/icons/loading.png';
import happyIcon from '../../assets/icons/happy.png';
import neutralFaceIcon from '../../assets/icons/neutral-face.png';
import stressIcon from '../../assets/icons/stress.png';
import './WellnessPanel.css';

function WellnessPanel() {
  const { openBreathing, openMindfulness, openStretching, openAnxietyRelief, openMentalHealth } = useWellnessIntervention();
  const { stressLevel, stressScore } = useStressFusion();
  const { isAnalyzing, cameraPermission, lastAnalysisTime } = useFacialAnalysis();

  const getStatusInfo = () => {
    if (stressLevel === 'high') {
      return {
        label: 'High Stress',
        icon: stressIcon,
        message: 'Take a break and use the wellness tools to relax',
        color: '#fee2e2',
        borderColor: '#fca5a5',
        progressColor: '#ef4444',
        circleBg: '#ffb3b3'
      };
    } else if (stressLevel === 'moderate') {
      return {
        label: 'Moderate Stress',
        icon: neutralFaceIcon,
        message: 'Take a moment to breathe',
        color: '#fef3c7',
        borderColor: '#fcd34d',
        progressColor: '#f59e0b',
        circleBg: '#ffe4a3'
      };
    } else {
      return {
        label: 'Low Stress',
        icon: happyIcon,
        message: 'You\'re doing great!',
        color: '#dcfce7',
        borderColor: '#86efac',
        progressColor: '#22c55e',
        circleBg: '#b8ffd0'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const isLoading = isAnalyzing || (cameraPermission === 'granted' && !lastAnalysisTime);

  return (
    <aside className="wellness-panel">
      <div className="wellness-panel-content">
        {cameraPermission === 'granted' && (
          <div className="current-status-section">
            <div className="wellness-panel-header">
              <h2>Current Status</h2>
            </div>
            {isLoading ? (
              <div className="current-status-card current-status-loading">
                <div className="status-icon-circle">
                  <img src={loadingIcon} alt="Loading" className="status-loading-icon" />
                </div>
                <div className="status-content">
                  <div className="status-main">
                    <h4 className="status-label">Analyzing...</h4>
                    <p className="status-message">Please wait while we analyze your stress level</p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="current-status-card"
                style={{
                  '--status-bg': statusInfo.color,
                  '--status-border': statusInfo.borderColor,
                  '--status-progress': statusInfo.progressColor
                }}
              >
                <div className="status-icon-circle" style={{ backgroundColor: statusInfo.circleBg }}>
                  <img src={statusInfo.icon} alt={statusInfo.label} className="status-icon" />
                </div>
                <div className="status-content">
                  <div className="status-main">
                    <h4 className="status-label">{statusInfo.label}</h4>
                    <p className="status-message">{statusInfo.message}</p>
                  </div>
                  <div className="status-details">
                    <div className="status-level-row">
                      <span className="status-level-label">Stress Level</span>
                      <span className="status-percentage">{stressScore}%</span>
                    </div>
                    <div className="status-progress-bar">
                      <div 
                        className="status-progress-fill"
                        style={{ width: `${stressScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="wellness-panel-header">
          <h2>Wellness</h2>
        </div>
        <div className="wellness-interventions">
          <button 
            className="wellness-option-btn"
            onClick={() => openBreathing()}
            title="Breathing Exercises"
          >
            <img src={breathingIcon} alt="Breathing Exercise" className="wellness-option-icon" />
            <span className="wellness-option-label">Breathing Exercises</span>
          </button>
          <button 
            className="wellness-option-btn"
            onClick={() => openMindfulness()}
            title="Mindfulness Meditation"
          >
            <img src={mindfulnessIcon} alt="Mindfulness Meditation" className="wellness-option-icon" />
            <span className="wellness-option-label">Mindfulness</span>
          </button>
          <button 
            className="wellness-option-btn"
            onClick={() => openStretching()}
            title="Stretching Exercises"
          >
            <img src={stretchingIcon} alt="Stretching Exercises" className="wellness-option-icon" />
            <span className="wellness-option-label">Stretching</span>
          </button>
          <button 
            className="wellness-option-btn"
            onClick={() => openAnxietyRelief()}
            title="Anxiety Relief"
          >
            <img src={anxietyIcon} alt="Anxiety Relief" className="wellness-option-icon" />
            <span className="wellness-option-label">Anxiety Relief</span>
          </button>
          <button 
            className="wellness-option-btn"
            onClick={() => openMentalHealth()}
            title="Mental Health Resources"
          >
            <img src={helpIcon} alt="Mental Health Resources" className="wellness-option-icon" />
            <span className="wellness-option-label">Mental Health Resources</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default WellnessPanel;
