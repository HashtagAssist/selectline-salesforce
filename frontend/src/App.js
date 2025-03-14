import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './contexts/AuthContext';

// Layout-Komponenten
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Öffentliche Seiten
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';

// Dashboard-Seiten
import Dashboard from './pages/Dashboard';
import ApiCalls from './pages/ApiCalls';
import Transformations from './pages/Transformations';
import Webhooks from './pages/Webhooks';
import Statistics from './pages/Statistics';
import LogViewer from './pages/LogViewer';
import Profile from './pages/Profile';

// Admin-Seiten
import Users from './pages/Users';
import Settings from './pages/Settings';

const App = () => {
  const { isLoading } = useAuth();

  // Warten, bis die Auth-Überprüfung abgeschlossen ist
  if (isLoading) {
    return null;
  }

  return (
    <>
      <CssBaseline />
      <Routes>
        {/* Öffentliche Routen */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/forbidden" element={<Forbidden />} />
        
        {/* Geschützte Routen mit DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Dashboard und Hauptrouten */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/api-calls" element={<ApiCalls />} />
            <Route path="/transformations" element={<Transformations />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Log-Routen */}
            <Route path="/logs/:type" element={<LogViewer />} />
            
            {/* Standardroute */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Route>
        </Route>
        
        {/* Admin-Routen mit Rollenprüfung */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        
        {/* 404-Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App; 