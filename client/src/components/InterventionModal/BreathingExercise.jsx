/**
 * Breathing Exercise component.
 * Interactive breathing exercise with guided techniques (4-7-8, Box Breathing).
 * Provides visual and audio guidance for stress relief.
 * 
 * @module components/InterventionModal/BreathingExercise
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback when exercise is closed
 * @returns {JSX.Element} Breathing Exercise component
 */

import { useState, useEffect, useRef } from 'react';
import './BreathingExercise.css';

const BREATHING_TECHNIQUES = {
  '4-7-8': {
    name: '4-7-8 Breathing',
    inhale: 4,
    hold: 7,
    exhale: 8,
    description: 'A calming technique that helps reduce anxiety and promote relaxation.'
  },
  'box': {
    name: 'Box Breathing',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfter: 4,
    description: 'A simple technique used by professionals to maintain focus and calm.'
  }
};

function BreathingExercise({ onClose }) {
  const [technique, setTechnique] = useState('4-7-8');
  const [phase, setPhase] = useState('idle'); // idle, inhale, hold, exhale, holdAfter
  const [countdown, setCountdown] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const intervalRef = useRef(null);

  const currentTechnique = BREATHING_TECHNIQUES[technique];

  useEffect(() => {
    if (isActive && phase !== 'idle') {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (phase === 'inhale') {
              setPhase('hold');
              setCountdown(currentTechnique.hold);
            } else if (phase === 'hold') {
              setPhase('exhale');
              setCountdown(currentTechnique.exhale);
            } else if (phase === 'exhale') {
              if (technique === 'box' && currentTechnique.holdAfter) {
                setPhase('holdAfter');
                setCountdown(currentTechnique.holdAfter);
              } else {
                setCycleCount(prev => prev + 1);
                setPhase('inhale');
                setCountdown(currentTechnique.inhale);
              }
            } else if (phase === 'holdAfter') {
              setCycleCount(prev => prev + 1);
              setPhase('inhale');
              setCountdown(currentTechnique.inhale);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isActive, phase, technique, currentTechnique]);

  const startExercise = () => {
    setIsActive(true);
    setPhase('inhale');
    setCountdown(currentTechnique.inhale);
    setCycleCount(0);
  };

  const stopExercise = () => {
    setIsActive(false);
    setPhase('idle');
    setCountdown(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetExercise = () => {
    stopExercise();
    setCycleCount(0);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'holdAfter':
        return 'Hold';
      default:
        return 'Ready';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return '#4a90e2';
      case 'hold':
        return '#f5a623';
      case 'exhale':
        return '#50c878';
      case 'holdAfter':
        return '#f5a623';
      default:
        return '#ccc';
    }
  };

  return (
    <div className="breathing-exercise">
      <h2 className="breathing-title">Guided Breathing Exercise</h2>
      <div className="breathing-technique-selector">
        <label>Technique:</label>
        <select 
          value={technique} 
          onChange={(e) => {
            setTechnique(e.target.value);
            resetExercise();
          }}
          disabled={isActive}
        >
          <option value="4-7-8">4-7-8 Breathing</option>
          <option value="box">Box Breathing</option>
        </select>
      </div>
      <p className="breathing-description">{currentTechnique.description}</p>
      <div className="breathing-visualizer">
        <div 
          className="breathing-circle"
          style={{
            backgroundColor: getPhaseColor(),
            transform: phase === 'inhale' 
              ? `scale(${1.5 - (countdown / currentTechnique.inhale) * 0.5})`
              : phase === 'exhale'
              ? `scale(${1 + (countdown / currentTechnique.exhale) * 0.5})`
              : 'scale(1.5)',
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="breathing-countdown">{countdown || getPhaseText()}</div>
        </div>
        <div className="breathing-phase-text" style={{ color: getPhaseColor() }}>
          {phase !== 'idle' ? getPhaseText() : 'Press Start to Begin'}
        </div>
      </div>
      <div className="breathing-controls">
        {!isActive ? (
          <button className="breathing-btn start" onClick={startExercise}>
            Start
          </button>
        ) : (
          <button className="breathing-btn reset" onClick={resetExercise}>
            Reset
          </button>
        )}
      </div>
      <div className="breathing-instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>Find a comfortable seated position</li>
          <li>Close your eyes or soften your gaze</li>
          <li>Follow the visual guide and countdown</li>
          <li>Breathe naturally through your nose</li>
          <li>Try to complete at least 4-6 cycles</li>
        </ul>
      </div>
    </div>
  );
}

export default BreathingExercise;
