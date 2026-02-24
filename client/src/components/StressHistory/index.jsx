import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import importantIcon from '../../assets/icons/important.png';
import './StressHistory.css';

// Displaying a graphical visualization of the user's stress indicator history
function StressHistory() {
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(7); // Default time range: 7 days

  const fetchHistory = useCallback(async (days = 7) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stress-logs?days=${days}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Sorting by timestamp (oldest first) for chart
        const sortedHistory = data.history
          .map(log => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        setHistory(sortedHistory);
      } else {
        setError(data.error || 'Failed to fetch stress history');
      }
    } catch (err) {
      console.error('[StressHistory] Error fetching history:', err);
      setError('Failed to load stress history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatistics = useCallback(async (days = 7) => {
    try {
      const response = await fetch(`/api/stress-logs/statistics?days=${days}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.statistics) {
        setStatistics(data.statistics);
      } else {
        console.error('[StressHistory] Statistics fetch failed:', data);
        setStatistics(null);
      }
    } catch (err) {
      console.error('[StressHistory] Error fetching statistics:', err);
      setStatistics(null);
    }
  }, []);

  const calculateStatisticsFromHistory = useCallback((historyData) => {
    if (!historyData || historyData.length === 0) {
      return null;
    }

    const scores = historyData.map(log => log.stressScore).filter(score => score != null);
    if (scores.length === 0) {
      return null;
    }

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const totalEntries = historyData.length;

    const highStressCount = historyData.filter(log => log.stressLevel === 'high').length;
    const moderateStressCount = historyData.filter(log => log.stressLevel === 'moderate').length;
    const normalStressCount = historyData.filter(log => log.stressLevel === 'normal').length;

    return {
      averageScore: Math.round(averageScore * 100) / 100,
      maxScore: maxScore,
      minScore: minScore,
      totalEntries: totalEntries,
      highStressCount: highStressCount,
      moderateStressCount: moderateStressCount,
      normalStressCount: normalStressCount,
      highStressPercentage: totalEntries > 0
        ? Math.round((highStressCount / totalEntries) * 100 * 100) / 100
        : 0,
      moderateStressPercentage: totalEntries > 0
        ? Math.round((moderateStressCount / totalEntries) * 100 * 100) / 100
        : 0,
      normalStressPercentage: totalEntries > 0
        ? Math.round((normalStressCount / totalEntries) * 100 * 100) / 100
        : 0
    };
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      if (!statistics || (statistics.totalEntries === 0 && history.length > 0)) {
        const calculatedStats = calculateStatisticsFromHistory(history);
        if (calculatedStats && calculatedStats.totalEntries > 0) {
          console.log('[StressHistory] Using calculated statistics as fallback');
          setStatistics(calculatedStats);
        }
      }
    }
  }, [history.length, calculateStatisticsFromHistory]);

  useEffect(() => {
    fetchHistory(timeRange);
    fetchStatistics(timeRange);
  }, [timeRange, fetchHistory, fetchStatistics]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const chartData = history.map(log => ({
    timestamp: log.timestamp.getTime(),
    timeLabel: formatTimestamp(log.timestamp),
    stressScore: log.stressScore,
    facialScore: log.componentScores?.facialScore || 0,
    keystrokeScore: log.componentScores?.keystrokeScore || 0,
    stressLevel: log.stressLevel
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="stress-tooltip">
          <p className="tooltip-time">{data.timeLabel}</p>
          <p className="tooltip-score">
            <span className="tooltip-label">Stress Score:</span>
            <span className={`tooltip-value stress-${data.stressLevel}`}>
              {data.stressScore}
            </span>
          </p>
          {data.facialScore > 0 && (
            <p className="tooltip-component">
              <span className="tooltip-label">Facial:</span>
              <span className="tooltip-value">{data.facialScore}</span>
            </p>
          )}
          {data.keystrokeScore > 0 && (
            <p className="tooltip-component">
              <span className="tooltip-label">Keystroke:</span>
              <span className="tooltip-value">{data.keystrokeScore}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="stress-history-container">
        <div className="stress-history-loading">
          <div className="loading-spinner"></div>
          <p>Loading stress history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stress-history-container">
        <div className="stress-history-error">
          <p>
            <img src={importantIcon} alt="Warning" className="warning-icon" /> {error}
          </p>
          <button onClick={() => fetchHistory(timeRange)} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="stress-history-container">
        <div className="stress-history-empty">
          <p>No stress history available yet.</p>
          <p className="empty-subtitle">
            Stress data will appear here once the system starts monitoring your stress levels.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="stress-history-container">
      <div className="stress-history-header">
        <div className="time-range-selector">
          <button
            className={timeRange === 1 ? 'active' : ''}
            onClick={() => setTimeRange(1)}
          >
            1 Day
          </button>
          <button
            className={timeRange === 7 ? 'active' : ''}
            onClick={() => setTimeRange(7)}
          >
            7 Days
          </button>
          <button
            className={timeRange === 30 ? 'active' : ''}
            onClick={() => setTimeRange(30)}
          >
            30 Days
          </button>
        </div>
      </div>
      {statistics && (
        <div className="stress-statistics">
          <div className="stat-card">
            <div className="stat-label">Average Score</div>
            <div className="stat-value">
              {statistics.averageScore != null ? statistics.averageScore.toFixed(1) : '0.0'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Maximum</div>
            <div className="stat-value stat-max">
              {statistics.maxScore != null ? statistics.maxScore : 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Minimum</div>
            <div className="stat-value stat-min">
              {statistics.minScore != null ? statistics.minScore : 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Entries</div>
            <div className="stat-value">
              {statistics.totalEntries != null ? statistics.totalEntries : 0}
            </div>
          </div>
        </div>
      )}
      <div className="stress-chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="timeLabel"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Stress Score', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="stressScore"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorStress)"
              name="Stress Score"
            />
            <Line
              type="monotone"
              dataKey={() => 60}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={1}
              dot={false}
              name="High Threshold"
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey={() => 30}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={1}
              dot={false}
              name="Moderate Threshold"
              legendType="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {statistics && (
        <div className="stress-level-breakdown">
          <h3>Stress Level Distribution</h3>
          <div className="breakdown-bars">
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span className="breakdown-color" style={{ backgroundColor: '#22c55e' }}></span>
                Normal
              </div>
              <div className="breakdown-bar-container">
                <div
                  className="breakdown-bar normal"
                  style={{ width: `${statistics.normalStressPercentage}%` }}
                >
                  {statistics.normalStressPercentage > 5 && `${statistics.normalStressPercentage.toFixed(1)}%`}
                </div>
              </div>
              <div className="breakdown-count">{statistics.normalStressCount}</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span className="breakdown-color" style={{ backgroundColor: '#f59e0b' }}></span>
                Moderate
              </div>
              <div className="breakdown-bar-container">
                <div
                  className="breakdown-bar moderate"
                  style={{ width: `${statistics.moderateStressPercentage}%` }}
                >
                  {statistics.moderateStressPercentage > 5 && `${statistics.moderateStressPercentage.toFixed(1)}%`}
                </div>
              </div>
              <div className="breakdown-count">{statistics.moderateStressCount}</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span className="breakdown-color" style={{ backgroundColor: '#ef4444' }}></span>
                High
              </div>
              <div className="breakdown-bar-container">
                <div
                  className="breakdown-bar high"
                  style={{ width: `${statistics.highStressPercentage}%` }}
                >
                  {statistics.highStressPercentage > 5 && `${statistics.highStressPercentage.toFixed(1)}%`}
                </div>
              </div>
              <div className="breakdown-count">{statistics.highStressCount}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StressHistory;
