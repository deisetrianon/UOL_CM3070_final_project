/**
 * Main application component.
 * Sets up routing, context providers, and global UI components.
 * Manages authentication-protected routes and application-wide modals.
 * 
 * @module App
 * @component
 * @returns {JSX.Element} The root application component with routing and providers
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FacialAnalysisProvider } from './contexts/FacialAnalysisContext';
import { KeystrokeProvider } from './contexts/KeystrokeContext';
import { StressFusionProvider } from './contexts/StressFusionContext';
import { ZenModeProvider } from './contexts/ZenModeContext';
import { WellnessInterventionProvider } from './contexts/WellnessInterventionContext';
import { DialogProvider } from './contexts/DialogContext';
import ProtectedRoute from './components/ProtectedRoute';
import CameraPermissionModal from './components/CameraPermissionModal';
import ZenModeSuggestion from './components/ZenModeSuggestion';
import MeetingReminderNotification from './components/MeetingReminderNotification';
import InterventionModal from './components/InterventionModal';
import Login from './pages/Login';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import StressHistoryPage from './pages/StressHistory';
import CalendarPage from './pages/Calendar';
import Burnout from './pages/Burnout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <FacialAnalysisProvider>
        <KeystrokeProvider>
          <StressFusionProvider>
            <ZenModeProvider>
              <WellnessInterventionProvider>
                <DialogProvider>
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
                    <Route
                      path="/burnout"
                      element={
                        <ProtectedRoute>
                          <Burnout />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                  </Routes>
                  <CameraPermissionModal />
                  <ZenModeSuggestion />
                  <MeetingReminderNotification />
                  <InterventionModal />
                </div>
                </DialogProvider>
              </WellnessInterventionProvider>
            </ZenModeProvider>
          </StressFusionProvider>
        </KeystrokeProvider>
      </FacialAnalysisProvider>
    </AuthProvider>
  );
}

export default App;
