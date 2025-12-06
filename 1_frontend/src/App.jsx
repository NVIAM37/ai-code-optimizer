import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OptimizerProvider } from './context/OptimizerContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Signup from './pages/Signup';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Optimizer from './pages/Optimizer';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import AppLayout from './components/Layout/AppLayout';
import { Toaster } from 'sonner';
import api from './api';

// Wrapper component to handle auth-based redirection for the main app
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0c0c0c]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="optimizer" element={<Optimizer />} />
        <Route path="history" element={<History />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<Profile />} />
        <Route path="chat" element={<Chat />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  console.log('[App] Application starting...');

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <OptimizerProvider>
            <AppContent />
            <Toaster position="top-right" theme="dark" />
          </OptimizerProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
