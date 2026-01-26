import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FacialAnalysisProvider } from './contexts/FacialAnalysisContext';
import { ZenModeProvider } from './contexts/ZenModeContext';
import ProtectedRoute from './components/ProtectedRoute';
import CameraPermissionModal from './components/CameraPermissionModal';
import ZenModeSuggestion from './components/ZenModeSuggestion';
import Login from './pages/Login';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <FacialAnalysisProvider>
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
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <CameraPermissionModal />
            <ZenModeSuggestion />
          </div>
        </ZenModeProvider>
      </FacialAnalysisProvider>
    </AuthProvider>
  );
}

export default App;
