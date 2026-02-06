import Layout from '../../components/Layout';
import StressHistory from '../../components/StressHistory';
import './StressHistory.css';

function StressHistoryPage() {
  return (
    <Layout>
      <div className="stress-history-page">
        <div className="page-header">
          <h1>Stress History</h1>
          <p className="page-description">
            View your stress indicator trends over time to understand your wellness patterns.
          </p>
        </div>
        <div className="page-content">
          <StressHistory />
        </div>
      </div>
    </Layout>
  );
}

export default StressHistoryPage;
