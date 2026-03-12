import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DialogProvider, useDialog } from './DialogContext';
import { useZenMode } from './ZenModeContext';
import { useAuth } from './AuthContext';

/**
 * Notification context provider.
 * Manages all notifications (alerts, browser notifications, meeting reminders) with Zen Mode and user preference checks.
 * Automatically suppresses notifications when Zen Mode is active or when user has disabled specific notification types.
 * 
 * @module NotificationContext
 */
const NotificationContext = createContext(null);

/**
 * Internal notification provider that uses DialogContext and adds notification logic.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Notification context provider
 */
function NotificationProviderInternal({ children }) {
  const { showAlert: dialogShowAlert, showConfirm: dialogShowConfirm } = useDialog();
  const { isZenModeActive } = useZenMode();
  const { isAuthenticated } = useAuth();
  
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    stressAlerts: true
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const fetchNotificationSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setSettingsLoaded(true);
      return;
    }

    try {
      const response = await fetch('/api/settings', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.settings?.notifications) {
        setNotificationSettings({
          email: data.settings.notifications.email ?? true,
          stressAlerts: data.settings.notifications.stressAlerts ?? true
        });
      }
    } catch (error) {
      console.error('[NotificationContext] Failed to fetch notification settings:', error);
      setNotificationSettings({
        email: true,
        stressAlerts: true
      });
    } finally {
      setSettingsLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  /**
   * Checks if a notification should be shown based on Zen Mode and notification settings.
   * 
   * @param {string} type - Notification type ('email', 'stressAlerts', 'meeting', 'pomodoro', 'general')
   * @param {boolean} force - Force show notification even if Zen Mode is active (default: false)
   * @returns {boolean} True if notification should be shown
   */
  const shouldShowNotification = useCallback((type = 'general', force = false) => {
    if (force) {
      return true;
    }

    if (isZenModeActive) {
      console.log('[NotificationContext] Notification suppressed: Zen Mode is active');
      return false;
    }

    if (type === 'email' && !notificationSettings.email) {
      console.log('[NotificationContext] Notification suppressed: Email notifications disabled');
      return false;
    }

    if (type === 'stressAlerts' && !notificationSettings.stressAlerts) {
      console.log('[NotificationContext] Notification suppressed: Stress alerts disabled');
      return false;
    }

    if (type === 'meeting' && !notificationSettings.email) {
      console.log('[NotificationContext] Notification suppressed: Meeting reminders disabled');
      return false;
    }

    return true;
  }, [isZenModeActive, notificationSettings]);

  /**
   * Shows an alert notification (modal) if allowed by Zen Mode and settings.
   * 
   * @param {string} message - Alert message
   * @param {string} type - Alert type ('info', 'success', 'warning', 'error')
   * @param {boolean} force - Force show even if Zen Mode is active
   * @returns {Promise} Promise that resolves when alert is closed
   */
  const showAlert = useCallback(async (message, type = 'info', force = false) => {
    if (!shouldShowNotification('general', force)) {
      return Promise.resolve();
    }

    return dialogShowAlert(message, type);
  }, [shouldShowNotification, dialogShowAlert]);

  /**
   * Shows a confirmation dialog if allowed by Zen Mode and settings.
   * 
   * @param {string} message - Confirmation message
   * @param {Object} options - Confirmation options
   * @param {boolean} force - Force show even if Zen Mode is active
   * @returns {Promise<boolean>} Promise that resolves to true if confirmed, false if cancelled
   */
  const showConfirm = useCallback(async (message, options = {}, force = false) => {
    if (!shouldShowNotification('general', force)) {
      return Promise.resolve(false);
    }

    return dialogShowConfirm(message, options);
  }, [shouldShowNotification, dialogShowConfirm]);

  /**
   * Shows a browser/desktop notification if allowed by Zen Mode and settings.
   * 
   * @param {string} title - Notification title
   * @param {Object} options - Notification options (body, icon, etc.)
   * @param {string} type - Notification type for settings check
   * @param {boolean} force - Force show even if Zen Mode is active
   * @returns {Notification|null} Notification object or null if suppressed
   */
  const showBrowserNotification = useCallback((title, options = {}, type = 'general', force = false) => {
    if (!shouldShowNotification(type, force)) {
      return null;
    }

    if (!('Notification' in window)) {
      console.warn('[NotificationContext] Browser notifications not supported');
      return null;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          return new Notification(title, {
            icon: '/favicon.ico',
            ...options
          });
        }
        return null;
      });
      return null;
    }

    if (Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/favicon.ico',
        ...options
      });
    }

    return null;
  }, [shouldShowNotification]);

  const refetchSettings = useCallback(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  const value = {
    showAlert,
    showConfirm,
    showBrowserNotification,
    shouldShowNotification,
    notificationSettings,
    settingsLoaded,
    refetchSettings,
    isZenModeActive
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Notification context provider component.
 * Wraps DialogProvider and adds notification management logic.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with notification context
 * @returns {JSX.Element} Notification context provider
 */
export function NotificationProvider({ children }) {
  return (
    <DialogProvider>
      <NotificationProviderInternal>
        {children}
      </NotificationProviderInternal>
    </DialogProvider>
  );
}

/**
 * Hook to access notification context.
 * 
 * @returns {Object} Notification context with showAlert, showConfirm, showBrowserNotification, and other methods
 * @throws {Error} If used outside NotificationProvider
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
