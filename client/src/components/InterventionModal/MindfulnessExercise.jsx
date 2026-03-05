/**
 * Mindfulness Exercise component.
 * Displays guided mindfulness meditation videos from YouTube.
 * Provides different duration options for meditation sessions.
 * 
 * @module components/InterventionModal/MindfulnessExercise
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback when exercise is closed
 * @returns {JSX.Element} Mindfulness Exercise component
 */

import { useState } from 'react';
import './MindfulnessExercise.css';

const MINDFULNESS_VIDEOS = [
  {
    id: 'ssss7V1_eyA',
    title: '5-Minute Mindfulness Meditation',
    duration: '5 min',
    description: 'A quick guided meditation to help you reset and refocus.'
  },
  {
    id: 'ZToicYcHIOU',
    title: '10-Minute Mindfulness Meditation',
    duration: '10 min',
    description: 'A longer session for deeper relaxation and stress relief.'
  },
  {
    id: 'Nw3Kn_VvTpY',
    title: '15-Minute Body Scan Meditation',
    duration: '15 min',
    description: 'A comprehensive body scan meditation for complete relaxation.'
  }
];

function MindfulnessExercise({ onClose }) {
  const [selectedVideo, setSelectedVideo] = useState(MINDFULNESS_VIDEOS[0]);

  return (
    <div className="mindfulness-exercise">
      <h2 className="mindfulness-title">Guided Mindfulness Meditation</h2>
      <p className="mindfulness-description">
        Take a moment to pause and reconnect with the present. Choose a meditation length that works for you.
      </p>
      <div className="mindfulness-video-selector">
        {MINDFULNESS_VIDEOS.map((video) => (
          <button
            key={video.id}
            className={`mindfulness-video-option ${selectedVideo.id === video.id ? 'active' : ''}`}
            onClick={() => setSelectedVideo(video)}
          >
            <div className="video-option-title">{video.title}</div>
            <div className="video-option-duration">{video.duration}</div>
            <div className="video-option-description">{video.description}</div>
          </button>
        ))}
      </div>
      <div className="mindfulness-player">
        <div className="youtube-embed-container">
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=0&rel=0`}
            title={selectedVideo.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      <div className="mindfulness-tips">
        <h3>Tips for a Better Experience:</h3>
        <ul>
          <li>Find a quiet, comfortable space</li>
          <li>Use headphones for better focus</li>
          <li>Close your eyes or soften your gaze</li>
          <li>Let go of expectations and judgments</li>
          <li>Return your attention gently when your mind wanders</li>
        </ul>
      </div>
    </div>
  );
}

export default MindfulnessExercise;
