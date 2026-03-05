/**
 * Anxiety Relief component.
 * Provides anxiety relief techniques and guided exercises via YouTube videos.
 * Includes grounding techniques, breathing exercises, muscle relaxation techniques, and anxiety relief music.
 * 
 * @module components/InterventionModal/AnxietyRelief
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback when component is closed
 * @returns {JSX.Element} Anxiety Relief component
 */

import { useState } from 'react';
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
    videoId: 'Rt08wzTYKHg',
    isVideo: true
  },
  {
    name: 'Progressive Muscle Relaxation',
    description: 'Tense and release muscle groups to reduce physical tension and anxiety.',
    videoId: 'Z21Xslddz3Y',
    isVideo: true
  },
  {
    name: 'Anxiety Relief Music',
    description: 'Calming music to help reduce anxiety and promote relaxation.',
    videoId: '3GJ-Ljnq1ME',
    isVideo: true
  }
];

function AnxietyRelief({ onClose }) {
  const [selectedTechnique, setSelectedTechnique] = useState(ANXIETY_TECHNIQUES[0]);

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
            }}
          >
            {technique.name}
          </button>
        ))}
      </div>
      <div className="anxiety-technique-card">
        <h3 className="technique-name">{selectedTechnique.name}</h3>
        <p className="technique-description">{selectedTechnique.description}</p>
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
          {selectedTechnique.name !== 'Anxiety Relief Music' && (
            <p className="video-instruction">
              Follow along with this guided exercise to help you manage anxiety and find calm.
            </p>
          )}
        </div>
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
    </div>
  );
}

export default AnxietyRelief;
