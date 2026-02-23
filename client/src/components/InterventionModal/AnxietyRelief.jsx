import { useState, useEffect } from 'react';
import './AnxietyRelief.css';

const ANXIETY_TECHNIQUES = [
  {
    name: '5-4-3-2-1 Grounding',
    description: 'A technique to help you reconnect with the present moment by engaging your senses.',
    videoId: '30VMIEmA114',
    isVideo: true
  },
  {
    name: 'Box Breathing',
    description: 'A simple breathing technique used by professionals to maintain calm under pressure.',
    steps: [
      'Breathe in slowly for 4 counts',
      'Hold your breath for 4 counts',
      'Breathe out slowly for 4 counts',
      'Hold for 4 counts',
      'Repeat 4-6 times'
    ]
  },
  {
    name: 'Progressive Muscle Relaxation',
    description: 'Tense and release muscle groups to reduce physical tension and anxiety.',
    videoId: 'Z21Xslddz3Y',
    isVideo: true
  },
  {
    name: 'Positive Affirmations',
    description: 'Use positive self-talk to counter anxious thoughts.',
    steps: [
      'I am capable of handling this situation',
      'I have overcome challenges before',
      'This feeling will pass',
      'I am prepared and ready',
      'I can take things one step at a time'
    ]
  }
];

function AnxietyRelief({ onClose }) {
  const [selectedTechnique, setSelectedTechnique] = useState(ANXIETY_TECHNIQUES[0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState('inhale');
  const [breathingCount, setBreathingCount] = useState(0);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  useEffect(() => {
    if (selectedTechnique.name === 'Box Breathing' && isBreathingActive) {
      const phases = ['inhale', 'hold1', 'exhale', 'hold2'];
      const currentPhaseIndex = currentStep % 4;
      const phase = phases[currentPhaseIndex];
      
      setBreathingPhase(phase);
      
      const durations = {
        inhale: 4000,
        hold1: 4000,
        exhale: 4000,
        hold2: 4000
      };

      const timer = setTimeout(() => {
        if (currentStep < 3) {
          setCurrentStep(prev => prev + 1);
        } else {
          const newCount = breathingCount + 1;
          setBreathingCount(newCount);
          if (newCount < 6) {
            setCurrentStep(0);
          } else {
            setIsBreathingActive(false);
          }
        }
      }, durations[phase]);

      return () => clearTimeout(timer);
    }
  }, [selectedTechnique.name, isBreathingActive, currentStep, breathingCount]);


  const nextStep = () => {
    if (currentStep < selectedTechnique.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetTechnique = () => {
    if (!selectedTechnique.isVideo) {
      setCurrentStep(0);
      setIsBreathingActive(false);
      setBreathingCount(0);
    }
  };

  const startBreathing = () => {
    setIsBreathingActive(true);
    setCurrentStep(0);
    setBreathingCount(0);
  };

  const renderAnimation = () => {
    switch (selectedTechnique.name) {
      case 'Box Breathing':
        return (
          <div className="breathing-animation-container">
            <div className={`breathing-box ${breathingPhase} ${isBreathingActive ? 'active' : ''}`}>
              <div className="breathing-box-inner">
                <div className="breathing-text">
                  {!isBreathingActive ? (
                    <button className="start-breathing-btn" onClick={startBreathing}>
                      Start Breathing Exercise
                    </button>
                  ) : (
                    <>
                      {breathingPhase === 'inhale' && <span className="breathing-instruction">Breathe In</span>}
                      {breathingPhase === 'hold1' && <span className="breathing-instruction">Hold</span>}
                      {breathingPhase === 'exhale' && <span className="breathing-instruction">Breathe Out</span>}
                      {breathingPhase === 'hold2' && <span className="breathing-instruction">Hold</span>}
                      <div className="breathing-count">{breathingCount + 1} / 6</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'Progressive Muscle Relaxation':
        return null;

      case '5-4-3-2-1 Grounding':
        return null;

      case 'Positive Affirmations':
        return (
          <div className="affirmations-animation">
            <div className="affirmation-card">
              <div className="affirmation-text animated">
                {selectedTechnique.steps[currentStep]}
              </div>
              <div className="affirmation-sparkles">
                <span className="sparkle">✨</span>
                <span className="sparkle">✨</span>
                <span className="sparkle">✨</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="anxiety-relief">
      <h2 className="anxiety-title">Anxiety Relief Techniques</h2>
      <p className="anxiety-intro">
        Feeling anxious before a presentation or meeting? These evidence-based techniques can help you regain calm and confidence.
      </p>
      <div className="anxiety-technique-selector">
        {ANXIETY_TECHNIQUES.map((technique, index) => (
          <button
            key={index}
            className={`technique-option ${selectedTechnique.name === technique.name ? 'active' : ''}`}
            onClick={() => {
              setSelectedTechnique(technique);
              if (!technique.isVideo) {
                setCurrentStep(0);
                setIsBreathingActive(false);
                setBreathingCount(0);
              }
            }}
          >
            {technique.name}
          </button>
        ))}
      </div>
      <div className="anxiety-technique-card">
        <h3 className="technique-name">{selectedTechnique.name}</h3>
        <p className="technique-description">{selectedTechnique.description}</p>
        {selectedTechnique.isVideo ? (
          <div className="anxiety-video-player">
            <div className="youtube-embed-container">
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${selectedTechnique.videoId}?autoplay=0&rel=0&modestbranding=1`}
                title={selectedTechnique.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <p className="video-instruction">
              Follow along with this guided exercise to help you manage anxiety and find calm.
            </p>
          </div>
        ) : (
          <>
            <div className="technique-steps">
              <div className="step-indicator">
                Step {currentStep + 1} of {selectedTechnique.steps.length}
              </div>
              <div className="step-content">
                <div className="step-text">{selectedTechnique.steps[currentStep]}</div>
                <div className="step-animation">
                  {renderAnimation()}
                </div>
              </div>
            </div>
            <div className="technique-navigation">
              <button
                className="step-btn prev"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                ← Previous
              </button>
              <button
                className="step-btn next"
                onClick={nextStep}
                disabled={currentStep === selectedTechnique.steps.length - 1}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
      <div className="anxiety-tips">
        <h3>Remember:</h3>
        <ul>
          <li>These techniques work best with practice</li>
          <li>It's normal to feel anxious - you're not alone</li>
          <li>Focus on what you can control</li>
          <li>Take things one step at a time</li>
        </ul>
      </div>
      <div className="anxiety-controls">
        {!selectedTechnique.isVideo && (
          <button className="anxiety-btn reset" onClick={resetTechnique}>
            Start Over
          </button>
        )}
        <button className="anxiety-btn close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default AnxietyRelief;
