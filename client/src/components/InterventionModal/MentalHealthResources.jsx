import './MentalHealthResources.css';

const CRISIS_LINES = [
  {
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    description: 'Free, confidential support 24/7 for people in distress',
    available: '24/7'
  },
  {
    name: 'Crisis Text Line',
    phone: 'Text HOME to 741741',
    description: 'Free 24/7 crisis support via text message',
    available: '24/7'
  },
  {
    name: 'National Alliance on Mental Illness (NAMI)',
    phone: '1-800-950-NAMI (6264)',
    description: 'Information, support, and resources for mental health',
    available: 'Mon-Fri, 10am-6pm ET'
  }
];

const PROFESSIONAL_RESOURCES = [
  {
    title: 'Find a Therapist',
    description: 'Connect with licensed mental health professionals in your area',
    links: [
      { name: 'Psychology Today', url: 'https://www.psychologytoday.com' },
      { name: 'BetterHelp', url: 'https://www.betterhelp.com' },
      { name: 'Talkspace', url: 'https://www.talkspace.com' }
    ]
  },
  {
    title: 'Online Support Groups',
    description: 'Connect with others who understand what you\'re going through',
    links: [
      { name: 'NAMI Support Groups', url: 'https://www.nami.org/Support-Education/Support-Groups' },
      { name: 'Mental Health America', url: 'https://www.mhanational.org/find-support-groups' }
    ]
  },
  {
    title: 'Self-Help Resources',
    description: 'Evidence-based tools and information for managing mental health',
    links: [
      { name: 'Mental Health America', url: 'https://www.mhanational.org' },
      { name: 'Mind.org.uk', url: 'https://www.mind.org.uk' },
      { name: 'Headspace', url: 'https://www.headspace.com' }
    ]
  }
];

function MentalHealthResources({ onClose }) {
  return (
    <div className="mental-health-resources">
      <h2 className="resources-title">Mental Health Support Resources</h2>
      <p className="resources-intro">
        If you're experiencing persistent stress, anxiety, or other mental health concerns, professional support is available. 
        You don't have to face this alone.
      </p>
      <div className="crisis-section">
        <h3 className="section-title">🚨 Crisis Support (Available 24/7)</h3>
        <p className="section-description">
          If you're in immediate danger or experiencing a mental health crisis, please reach out:
        </p>
        <div className="crisis-cards">
          {CRISIS_LINES.map((line, index) => (
            <div key={index} className="crisis-card">
              <div className="crisis-name">{line.name}</div>
              <div className="crisis-phone">
                <a href={`tel:${line.phone.replace(/\s/g, '')}`}>{line.phone}</a>
              </div>
              <div className="crisis-description">{line.description}</div>
              <div className="crisis-available">Available: {line.available}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="professional-section">
        <h3 className="section-title">💼 Professional Support</h3>
        <p className="section-description">
          Consider reaching out to a mental health professional for ongoing support:
        </p>
        {PROFESSIONAL_RESOURCES.map((resource, index) => (
          <div key={index} className="resource-card">
            <h4 className="resource-title">{resource.title}</h4>
            <p className="resource-description">{resource.description}</p>
            <div className="resource-links">
              {resource.links.map((link, linkIndex) => (
                <a
                  key={linkIndex}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-link"
                >
                  {link.name} →
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="resources-note">
        <p>
          <strong>Important:</strong> This application is not a substitute for professional mental health care. 
          If you're experiencing persistent or severe symptoms, please consult with a qualified mental health professional.
        </p>
      </div>
    </div>
  );
}

export default MentalHealthResources;
