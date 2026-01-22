import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FacialAnalysisProvider } from './contexts/FacialAnalysisContext';
import ProtectedRoute from './components/ProtectedRoute';
import CameraPermissionModal from './components/CameraPermissionModal';
import Login from './pages/Login';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <FacialAnalysisProvider>
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
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <CameraPermissionModal />
        </div>
      </FacialAnalysisProvider>
    </AuthProvider>
  );
}

export default App;
