import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

// Komponente für Routen, die nur für authentifizierte Benutzer zugänglich sind
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Wenn der Benutzer nicht angemeldet ist, zur Login-Seite weiterleiten
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wenn Rollen definiert sind, prüfen ob der Benutzer die richtige Rolle hat
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Wenn der Benutzer nicht die richtige Rolle hat, zur 403-Seite weiterleiten
    return <Navigate to="/forbidden" replace />;
  }

  // Wenn der Benutzer angemeldet ist und die richtige Rolle hat, Kinder-Komponenten rendern
  return <Outlet />;
};

export default ProtectedRoute; 