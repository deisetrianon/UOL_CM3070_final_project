import sirenIcon from '../../assets/icons/siren.png';
import therapyIcon from '../../assets/icons/therapy.png';
import './MentalHealthResources.css';

const CRISIS_LINES = [
  {
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    url: 'https://988lifeline.org',
    description: 'Free, confidential support 24/7 for people in distress',
    available: '24/7'
  },
  {
    name: 'Crisis Text Line',
    phone: 'Text HOME or HOLA to 741741',
    url: 'https://www.crisistextline.org',
    description: 'Free 24/7 crisis support via text message',
    available: '24/7'
  },
  {
    name: 'National Alliance on Mental Illness (NAMI)',
    phone: '1-800-950-NAMI (6264)',
    url: 'https://www.nami.org/nami-helpline/',
    description: 'Information, support, and resources for mental health',
    available: 'Monday-Friday, 10:00 AM - 10:00 PM ET'
  }
];

const PROFESSIONAL_RESOURCES = [
  {
    title: 'Find a Therapist',
    description: 'Connect with licensed mental health professionals in your area',
    links: [
      { name: 'BetterHelp', url: 'https://www.betterhelp.com' },
      { name: 'Talkspace', url: 'https://www.talkspace.com' }
    ]
  },
  {
    title: 'Online Support Groups',
    description: 'Connect with others who understand what you\'re going through',
    links: [
      { name: 'NAMI Support Groups', url: 'https://www.nami.org/Support-Education/Support-Groups' },
      { name: 'Mental Health UK Support Groups', url: 'https://mentalhealth-uk.org/partnerships/projects/support-groups/' }
    ]
  },
  {
    title: 'Self-Help Resources',
    description: 'Evidence-based tools and information for managing mental health',
    links: [
      { name: 'Mental Health UK', url: 'https://mentalhealth-uk.org/' },
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
      <div className="resources-sections-container">
        <div className="crisis-section">
          <h3 className="section-title">
            <img src={sirenIcon} alt="Siren" />
            Crisis Support
          </h3>
          <p className="section-description">
            If you're in immediate danger or experiencing a mental health crisis, reach out:
          </p>
          <div className="crisis-cards">
            {CRISIS_LINES.map((line, index) => (
              <div key={index} className="crisis-card">
                <div className="crisis-name">{line.name}</div>
                <div className="crisis-phone">
                  <a href={line.url} target="_blank" rel="noopener noreferrer">{line.phone}</a>
                </div>
                <div className="crisis-description">{line.description}</div>
                <div className="crisis-available">Available: {line.available}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="professional-section">
          <h3 className="section-title">
            <img src={therapyIcon} alt="Therapy" />
            Professional Support
          </h3>
          <p className="section-description">
            Consider reaching out to a mental health professional for ongoing support:
          </p>
          <div className="resource-cards">
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
        </div>
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
