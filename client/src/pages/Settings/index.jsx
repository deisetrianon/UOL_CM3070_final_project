import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFacialAnalysis } from '../../contexts/FacialAnalysisContext';
import { useZenMode } from '../../contexts/ZenModeContext';
import Layout from '../../components/Layout';
import importantIcon from '../../assets/icons/important.png';
import lampIcon from '../../assets/icons/lamp.png';
import privacyIcon from '../../assets/icons/privacy.png';
import './Settings.css';

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateAnalysisFrequency, analysisFrequency: currentFrequency } = useFacialAnalysis();
  const { refetchPreferences: refetchZenPreferences } = useZenMode();

  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      stressAlerts: true
    },
    facialAnalysis: {
      enabled: false,
      frequency: 5
    },
    zenMode: {
      autoEnabled: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/settings', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        setError(data.error || 'Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to connect to settings service');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (category, field) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [field]: !settings[category][field]
      }
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
    
    if (category === 'zenMode') {
      refetchZenPreferences();
    }
  };

  const handleFrequencyChange = (value) => {
    const frequency = Math.max(1, Math.min(60, parseInt(value) || 5));
    const newSettings = {
      ...settings,
      facialAnalysis: {
        ...settings.facialAnalysis,
        frequency
      }
    };
    
    updateAnalysisFrequency(frequency);
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const getFallbackAvatar = () => {
    const name = encodeURIComponent(user?.displayName || user?.email || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=4f46e5&color=fff&size=96`;
  };

  return (
    <Layout>
      <div className="settings-page">
        <div className="settings-header-section">
          <div className="settings-header-left">
            <h1>Settings</h1>
          </div>
          <div className="settings-header-right">
          </div>
        </div>
        <main className="settings-content">
        <section className="settings-section profile-section">
          <div className="profile-card">
            <img 
              src={user?.picture || getFallbackAvatar()} 
              alt="Profile"
              className="profile-avatar"
              onError={(e) => { e.target.src = getFallbackAvatar(); }}
              referrerPolicy="no-referrer"
            />
            <div className="profile-info">
              <h3>{user?.displayName}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
        </section>
        {error && (
          <div className="error-banner">
            <img src={importantIcon} alt="Warning" className="warning-icon" />
            <span>{error}</span>
            <button onClick={fetchSettings}>Retry</button>
          </div>
        )}
        {successMessage && (
          <div className="success-banner">
            <span>✓ {successMessage}</span>
          </div>
        )}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : (
          <>
            <section className="settings-section zen-mode-section">
              <div className="section-header">
                <h2>Zen Mode</h2>
                <p className="section-description">
                  Zen Mode filters your view to show only priority items when you're fatigued
                </p>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Automatic Zen Mode</h3>
                  <p>
                    Automatically enable Zen Mode when facial analysis detects moderate or high fatigue levels.
                    When disabled, you'll receive a notification asking if you want to enable it instead.
                  </p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox"
                    checked={settings.zenMode?.autoEnabled ?? true}
                    onChange={() => handleToggle('zenMode', 'autoEnabled')}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-note">
                <span className="note-icon">
                  <img src={lampIcon} alt="Lamp" />
                </span>
                <span>
                  {settings.zenMode?.autoEnabled 
                    ? "When fatigue is detected, Zen Mode will activate automatically to help you focus on priority items."
                    : "When fatigue is detected, you'll be notified and can choose to enable Zen Mode manually."}
                </span>
              </div>
            </section>
            <section className="settings-section">
              <div className="section-header">
                <h2>Wellness Monitoring</h2>
                <p className="section-description">
                  Configure how the application monitors your well-being through facial analysis.
                  Camera permission can be managed in your browser settings.
                </p>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Analysis Frequency</h3>
                  <p>How often should facial analysis run (in minutes)</p>
                </div>
                <div className="frequency-input">
                  <input 
                    type="number"
                    value={settings.facialAnalysis?.frequency ?? 5}
                    onChange={(e) => handleFrequencyChange(e.target.value)}
                    min="1"
                    max="60"
                    disabled={saving}
                  />
                  <span>min</span>
                </div>
              </div>
            </section>
            <section className="settings-section">
              <div className="section-header">
                <h2>Notifications</h2>
                <p className="section-description">
                  Manage how you receive alerts and notifications
                </p>
              </div>             
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Email Notifications</h3>
                  <p>Receive important updates via email</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox"
                    checked={settings.notifications?.email ?? true}
                    onChange={() => handleToggle('notifications', 'email')}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Stress Alerts</h3>
                  <p>Show alerts when high stress or fatigue is detected</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox"
                    checked={settings.notifications?.stressAlerts ?? true}
                    onChange={() => handleToggle('notifications', 'stressAlerts')}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </section>
            <section className="settings-section privacy-note">
              <div className="section-header">
                <h2>
                  <img src={privacyIcon} alt="Privacy" />
                  Privacy
                </h2>
              </div>
              <div className="privacy-content">
                <p>
                  <strong>Your privacy matters.</strong> Facial analysis data is processed in real-time 
                  and is never stored or shared. Only anonymized stress metrics are saved to help 
                  track your wellness over time.
                </p>
                <ul>
                  <li>✓ Camera images are processed and immediately discarded</li>
                  <li>✓ Email content is never stored on our servers</li>
                  <li>✓ All email operations (read, send, reply, delete) are performed securely through Google APIs</li>
                  <li>✓ Your data remains under your control</li>
                </ul>
              </div>
            </section>
          </>
        )}
      </main>
      </div>
    </Layout>
  );
}

export default Settings;
