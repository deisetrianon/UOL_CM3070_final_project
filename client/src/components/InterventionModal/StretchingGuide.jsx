import { useState } from 'react';
import './StretchingGuide.css';

const STRETCHING_VIDEOS = [
  { id: '9bWnHUogD18' },
  { id: 'Fo1LFQZ9Q0c' },
  { id: 'YdDO8Ge74jY' },
  { id: 'wrI2IMnCLAY' },
  { id: '9b-jZwmYNLY' },
  { id: 'wCTNXgiNlz0' },
  { id: 'k3zDJ9YK9k8' },
  { id: 'E8mwKxOvy5o' },
  { id: 'bdbzq623rsU' },
  { id: '4DyD3Z6OG-I' }
];

function StretchingGuide({ onClose }) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const currentVideo = STRETCHING_VIDEOS[currentVideoIndex];

  const nextVideo = () => {
    if (currentVideoIndex < STRETCHING_VIDEOS.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    }
  };

  const prevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
    }
  };

  return (
    <div className="stretching-guide">
      <h2 className="stretching-title">Guided Stretching Exercises</h2>
      <div className="stretching-player">
        <div className="youtube-embed-container">
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=0&rel=0&modestbranding=1`}
            title="Stretching Exercise"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      <div className="stretching-navigation">
        <button
          className="nav-btn prev"
          onClick={prevVideo}
          disabled={currentVideoIndex === 0}
        >
          ← Previous
        </button>
        <span className="video-counter">
          {currentVideoIndex + 1} / {STRETCHING_VIDEOS.length}
        </span>
        <button
          className="nav-btn next"
          onClick={nextVideo}
          disabled={currentVideoIndex === STRETCHING_VIDEOS.length - 1}
        >
          Next →
        </button>
      </div>
      <div className="stretching-tips">
        <h3>Tips:</h3>
        <ul>
          <li>Move slowly and gently - never force a stretch</li>
          <li>Breathe deeply throughout each exercise</li>
          <li>Stop if you feel any pain</li>
          <li>Hold each stretch for the recommended duration</li>
          <li>Repeat exercises as needed throughout your day</li>
        </ul>
      </div>
    </div>
  );
}

export default StretchingGuide;
