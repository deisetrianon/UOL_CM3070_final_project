/**
 * Burnout page component.
 * Information page about burnout with symptoms, prevention strategies, and resources.
 * Provides educational content and actionable advice for managing burnout.
 * 
 * @module pages/Burnout
 * @component
 * @returns {JSX.Element} Burnout page component
 */

import Layout from '../../components/Layout';
import lampIcon from '../../assets/icons/lamp.png';
import physicalIcon from '../../assets/icons/physical.png';
import emotionalIcon from '../../assets/icons/emotion.png';
import behavioralIcon from '../../assets/icons/behavior.png';
import boundariesIcon from '../../assets/icons/boundaries.png';
import breakIcon from '../../assets/icons/coffee-break.png';
import communicationIcon from '../../assets/icons/communication.png';
import heartIcon from '../../assets/icons/heart.png';
import supportIcon from '../../assets/icons/support.png';
import tasksIcon from '../../assets/icons/tasks.png';
import './Burnout.css';

function Burnout() {
  return (
    <Layout>
      <div className="burnout-page">
        <div className="burnout-content">
          <div className="burnout-header">
            <h2 className="burnout-page-title">
              <span className="text-gradient">Feeling burnt out?</span>
            </h2>
          </div>
          <div className="burnout-intro-card">
            <div className="intro-icon">
              <img src={lampIcon} alt="Lamp" />
            </div>
            <p>
              Burnout is a state of physical, mental, and emotional exhaustion caused by 
              prolonged stress. It can make you feel detached, demotivated, and impact your 
              ability to function. Recognizing the signs early is key to prevention.
            </p>
          </div>
          <div className="burnout-section-card">
            <div className="section-header">
              <h3 className="burnout-subtitle">Recognize the signs</h3>
              <p className="section-description">Burnout manifests in three key areas</p>
            </div>
            <div className="symptoms-grid">
              <div className="symptom-category">
                <div className="category-header">
                  <div className="category-icon physical">
                    <img src={physicalIcon} alt="Physical" />
                  </div>
                  <h4>Physical</h4>
                </div>
                <ul>
                  <li>Feeling tired or exhausted</li>
                  <li>Sleep disturbances</li>
                  <li>Frequent headaches</li>
                  <li>Muscle or joint pain</li>
                  <li>Lowered immunity</li>
                </ul>
              </div>
              <div className="symptom-category">
                <div className="category-header">
                  <div className="category-icon emotional">
                    <img src={emotionalIcon} alt="Emotional" />
                  </div>
                  <h4>Emotional</h4>
                </div>
                <ul>
                  <li>Feeling helpless or defeated</li>
                  <li>Self-doubt and worthlessness</li>
                  <li>Feeling detached and alone</li>
                  <li>Loss of interest and enjoyment</li>
                  <li>Persistent worry and anxiety</li>
                </ul>
              </div>
              <div className="symptom-category">
                <div className="category-header">
                  <div className="category-icon behavioral">
                    <img src={behavioralIcon} alt="Behavioral" />
                  </div>
                  <h4>Behavioral</h4>
                </div>
                <ul>
                  <li>Procrastination</li>
                  <li>Difficulty concentrating</li>
                  <li>Decreased productivity</li>
                  <li>Withdrawing from others</li>
                  <li>Increased irritability</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="burnout-section-card">
            <div className="section-header">
              <h3 className="burnout-subtitle">Prevention & self-care</h3>
              <p className="section-description">Practical steps to protect your wellbeing</p>
            </div>
            <div className="prevention-tips">
              <div className="prevention-tip">
                <div className="tip-icon">
                  <img src={boundariesIcon} alt="Boundaries" />
                </div>
                <div className="tip-content">
                  <strong>Set boundaries</strong>
                  <p>Protect your work-life balance by switching off outside contracted hours</p>
                </div>
              </div>
              <div className="prevention-tip">
                <div className="tip-icon">
                  <img src={heartIcon} alt="Heart" />
                </div>
                <div className="tip-content">
                  <strong>Prioritize health</strong>
                  <p>Focus on sleep, exercise, nutrition, and stress management</p>
                </div>
              </div>
              <div className="prevention-tip">
                <div className="tip-icon">
                  <img src={tasksIcon} alt="Tasks" />
                </div>
                <div className="tip-content">
                  <strong>Break tasks down</strong>
                  <p>Break tasks into manageable steps and keep deadlines realistic</p>
                </div>
              </div>
              <div className="prevention-tip">
                <div className="tip-icon">
                  <img src={communicationIcon} alt="Communication" />
                </div>
                <div className="tip-content">
                  <strong>Communicate openly</strong>
                  <p>Discuss workloads and challenges with your manager regularly</p>
                </div>
              </div>
              <div className="prevention-tip">
                <div className="tip-icon">
                  <img src={breakIcon} alt="Break" />
                </div>
                <div className="tip-content">
                  <strong>Take breaks</strong>
                  <p>Make time for activities outside work that bring joy and balance</p>
                </div>
              </div>
              <div className="prevention-tip">
                <div className="tip-icon">
                  <img src={supportIcon} alt="Support" />
                </div>
                <div className="tip-content">
                  <strong>Seek support</strong>
                  <p>Access Employee Assistance Programmes (EAPs) or speak to your GP if needed</p>
                </div>
              </div>
            </div>
          </div>
          <div className="burnout-resources-card">
            <div className="section-header">
              <h3 className="burnout-subtitle">Helpful resources</h3>
              <p className="section-description">Explore these trusted sources for more information</p>
            </div>
            <div className="resource-links">
              <a 
                href="https://mentalhealth-uk.org/burnout/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="resource-link"
              >
                <div className="resource-text">
                  <strong>Mental Health UK</strong>
                  <span>Comprehensive Burnout Guide</span>
                </div>
                <div className="resource-arrow">→</div>
              </a>
              <a 
                href="https://www.nhs.uk/every-mind-matters/lifes-challenges/work-related-stress/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="resource-link"
              >
                <div className="resource-text">
                  <strong>NHS Every Mind Matters</strong>
                  <span>Work-related Stress Support</span>
                </div>
                <div className="resource-arrow">→</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Burnout;
