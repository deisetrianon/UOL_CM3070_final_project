import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FacialAnalysisProvider } from './contexts/FacialAnalysisContext';
import { KeystrokeProvider } from './contexts/KeystrokeContext';
import { StressFusionProvider } from './contexts/StressFusionContext';
import { ZenModeProvider } from './contexts/ZenModeContext';
import ProtectedRoute from './components/ProtectedRoute';
import CameraPermissionModal from './components/CameraPermissionModal';
import ZenModeSuggestion from './components/ZenModeSuggestion';
import Login from './pages/Login';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import StressHistoryPage from './pages/StressHistory';
import CalendarPage from './pages/Calendar';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <FacialAnalysisProvider>
        <KeystrokeProvider>
          <StressFusionProvider>
            <ZenModeProvider>
              <div className="app">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tasks"
                    element={
                      <ProtectedRoute>
                        <Tasks />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stress-history"
                    element={
                      <ProtectedRoute>
                        <StressHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <ProtectedRoute>
                        <CalendarPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
                <CameraPermissionModal />
                <ZenModeSuggestion />
              </div>
            </ZenModeProvider>
          </StressFusionProvider>
        </KeystrokeProvider>
      </FacialAnalysisProvider>
    </AuthProvider>
  );
}

export default App;
