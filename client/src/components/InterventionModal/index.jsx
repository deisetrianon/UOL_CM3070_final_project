/**
 * Intervention Modal component.
 * Container modal for displaying wellness interventions (breathing, mindfulness, stretching, etc.).
 * Manages focus and keyboard navigation for accessibility.
 * 
 * @module components/InterventionModal
 * @component
 * @returns {JSX.Element|null} Intervention Modal component or null if no active intervention
 */

import { useEffect, useRef } from 'react';
import { useWellnessIntervention } from '../../contexts/WellnessInterventionContext';
import BreathingExercise from './BreathingExercise';
import MindfulnessExercise from './MindfulnessExercise';
import StretchingGuide from './StretchingGuide';
import AnxietyRelief from './AnxietyRelief';
import MentalHealthResources from './MentalHealthResources';
import './InterventionModal.css';

function InterventionModal() {
  const { activeIntervention, closeIntervention } = useWellnessIntervention();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (activeIntervention) {
      document.body.style.overflow = 'hidden';
      previousFocusRef.current = document.activeElement;
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      }, 100);
    } else {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [activeIntervention]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeIntervention) return;

      if (e.key === 'Escape') {
        closeIntervention();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    if (activeIntervention) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeIntervention, closeIntervention]);

  if (!activeIntervention) {
    return null;
  }

  const renderIntervention = () => {
    switch (activeIntervention.type) {
      case 'breathing':
        return <BreathingExercise onClose={closeIntervention} />;
      case 'mindfulness':
        return <MindfulnessExercise onClose={closeIntervention} />;
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

  if (!activeIntervention) {
    return null;
  }

  const interventionNames = {
    breathing: 'Breathing Exercise',
    mindfulness: 'Mindfulness Meditation',
    stretching: 'Stretching Guide',
    anxietyRelief: 'Anxiety Relief',
    mentalHealth: 'Mental Health Resources'
  };

  return (
    <div 
      className="intervention-modal-overlay" 
      onClick={closeIntervention}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intervention-modal-title"
    >
      <div 
        className="intervention-modal" 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="document"
      >
        <button 
          className="intervention-close-btn" 
          onClick={closeIntervention} 
          ref={closeButtonRef}
          aria-label="Close intervention modal"
          title="Close (Escape)"
        >
          <span aria-hidden="true">✕</span>
        </button>
        <h2 id="intervention-modal-title" className="sr-only">
          {interventionNames[activeIntervention.type] || 'Wellness Intervention'}
        </h2>
        <div className="intervention-modal-content">
          {renderIntervention()}
        </div>
      </div>
    </div>
  );
}

export default InterventionModal;
