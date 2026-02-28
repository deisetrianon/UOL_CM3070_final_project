import { useState } from 'react';
import Layout from '../../components/Layout';
import StressHistory from '../../components/StressHistory';
import './StressHistory.css';

function StressHistoryPage() {
  const [timeRange, setTimeRange] = useState(7); // Default: 7 days

  return (
    <Layout>
      <div className="stress-history-page">
        <div className="stress-history-header-section">
          <div className="stress-history-header-left">
            <h1>Stress History</h1>
            <div className="stress-history-nav-buttons">
              <button 
                className={`nav-btn ${timeRange === 1 ? 'active' : ''}`}
                onClick={() => setTimeRange(1)}
              >
                1 Day
              </button>
              <button 
                className={`nav-btn ${timeRange === 7 ? 'active' : ''}`}
                onClick={() => setTimeRange(7)}
              >
                7 Days
              </button>
              <button 
                className={`nav-btn ${timeRange === 30 ? 'active' : ''}`}
                onClick={() => setTimeRange(30)}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>
        <div className="page-content">
          <StressHistory timeRange={timeRange} />
        </div>
      </div>
    </Layout>
  );
}

export default StressHistoryPage;
