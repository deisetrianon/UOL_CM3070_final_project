import { useNavigate, useLocation } from 'react-router-dom';
import stressIcon from '../../assets/icons/stress.png';

function BurnoutSection() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === '/burnout';

  return (
    <div className="sidebar-section">
      <button 
        className={`sidebar-section-header ${isActive ? 'active' : ''}`}
        onClick={() => navigate('/burnout')}
      >
        <img src={stressIcon} alt="Burnout" className="section-icon" />
        <span className="section-title">Feeling burnt out?</span>
      </button>
    </div>
  );
}

export default BurnoutSection;
