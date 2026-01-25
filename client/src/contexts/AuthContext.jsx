import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

/**
 * Authentication Context Provider
 * Manages user authentication state and provides auth methods
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Callbacks to run on logout, for other contexts to clean up
  const logoutCallbacksRef = useRef([]);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.isAuthenticated) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('[Auth] Error checking authentication:', err);
      setError('Failed to check authentication status');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loginWithGoogle = useCallback(() => {
    window.location.href = '/api/auth/google';
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        logoutCallbacksRef.current.forEach(callback => {
          try {
            callback();
          } catch (err) {
            console.error('[Auth] Error in logout callback:', err);
          }
        });
        
        setUser(null);
        setIsAuthenticated(false);
        return true;
      }
      
      throw new Error(data.error || 'Logout failed');
    } catch (err) {
      console.error('[Auth] Logout error:', err);
      setError('Failed to logout');
      return false;
    }
  }, []);

  const registerLogoutCallback = useCallback((callback) => {
    logoutCallbacksRef.current.push(callback);
    return () => {
      logoutCallbacksRef.current = logoutCallbacksRef.current.filter(cb => cb !== callback);
    };
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginWithGoogle,
    logout,
    checkAuth,
    registerLogoutCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
