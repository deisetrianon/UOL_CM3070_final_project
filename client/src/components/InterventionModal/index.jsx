import { useWellnessIntervention } from '../../contexts/WellnessInterventionContext';
import BreathingExercise from './BreathingExercise';
import MindfulnessExercise from './MindfulnessExercise';
import PomodoroTimer from './PomodoroTimer';
import StretchingGuide from './StretchingGuide';
import AnxietyRelief from './AnxietyRelief';
import MentalHealthResources from './MentalHealthResources';
import './InterventionModal.css';

function InterventionModal() {
  const { activeIntervention, closeIntervention } = useWellnessIntervention();

  if (!activeIntervention) {
    return null;
  }

  const renderIntervention = () => {
    switch (activeIntervention.type) {
      case 'breathing':
        return <BreathingExercise onClose={closeIntervention} />;
      case 'mindfulness':
        return <MindfulnessExercise onClose={closeIntervention} />;
      case 'pomodoro':
        return <PomodoroTimer onClose={closeIntervention} />;
      case 'stretching':
        return <StretchingGuide onClose={closeIntervention} />;
      case 'anxietyRelief':
        return <AnxietyRelief onClose={closeIntervention} />;
      case 'mentalHealth':
        return <MentalHealthResources onClose={closeIntervention} />;
      default:
        return null;
    }
  };

  return (
    <div className="intervention-modal-overlay" onClick={closeIntervention}>
      <div className="intervention-modal" onClick={(e) => e.stopPropagation()}>
        <button className="intervention-close-btn" onClick={closeIntervention} title="Close">
          ✕
        </button>
        {renderIntervention()}
      </div>
    </div>
  );
}

export default InterventionModal;
