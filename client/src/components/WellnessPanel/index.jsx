import { useWellnessIntervention } from '../../contexts/WellnessInterventionContext';
import PomodoroTimer from '../PomodoroTimer';
import breathingIcon from '../../assets/icons/breathing.png';
import mindfulnessIcon from '../../assets/icons/mindfulness.png';
import stretchingIcon from '../../assets/icons/stretching.png';
import anxietyIcon from '../../assets/icons/anxiety.png';
import helpIcon from '../../assets/icons/help.png';
import './WellnessPanel.css';

function WellnessPanel() {
  const { openBreathing, openMindfulness, openStretching, openAnxietyRelief, openMentalHealth } = useWellnessIntervention();

  return (
    <aside className="wellness-panel">
      <div className="wellness-panel-content">
        <div className="wellness-panel-header">
          <h2>Pomodoro</h2>
        </div>
        <div className="wellness-pomodoro-section">
          <PomodoroTimer />
        </div>
        <div className="wellness-panel-header">
          <h2>Wellness</h2>
        </div>
        <div className="wellness-interventions">
          <button 
            className="wellness-option-btn"
            onClick={() => openBreathing()}
            title="Breathing Exercise"
          >
            <img src={breathingIcon} alt="Breathing Exercise" className="wellness-option-icon" />
            <span className="wellness-option-label">Breathing Exercise</span>
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
