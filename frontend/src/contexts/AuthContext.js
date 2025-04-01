import React, { createContext, useState, useEffect, useContext } from 'react';
import jwtDecode from 'jwt-decode';
import api from '../services/api';

// Auth Context erstellen
const AuthContext = createContext();

// AuthProvider Komponente
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Beim Laden der App prüfen, ob ein Token im localStorage existiert
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Token Ablauf prüfen
          const decodedToken = jwtDecode(token);
          const isExpired = decodedToken.exp * 1000 < Date.now();

          if (isExpired) {
            // Token ist abgelaufen, Logout durchführen
            logout();
          } else {
            // Token ist gültig, hole Benutzerdaten
            const response = await api.get('/api/auth/profile');
            // Prüfe die verschiedenen möglichen Strukturen des Benutzerobjekts
            if (response.data?.data?.user) {
              setUser(response.data);
            } else if (response.data?.user) {
              setUser({ data: { user: response.data.user } });
            } else {
              // Fallback: Setze den Benutzer direkt
              setUser(response.data);
            }
          }
        } catch (err) {
          console.error('Auth check error:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login-Funktion
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/api/auth/login', { username, password });
      const { token, refreshToken, user: userData } = response.data;
      // Prüfe, ob die Daten in der erwarteten Struktur vorliegen
      let userToStore = userData;
      if (userData && !userData.data && userData.role) {
        // Umstrukturierung des Benutzerobjekts, wenn die Rolle direkt auf der obersten Ebene liegt
        userToStore = { data: { user: userData } };
      }
      
      // Token im localStorage speichern
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Benutzer im State speichern
      setUser(userToStore);
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login fehlgeschlagen');
      return { success: false, error: err.response?.data?.message || 'Login fehlgeschlagen' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout-Funktion
  const logout = async () => {
    try {
      // Wenn der Benutzer angemeldet ist, senden wir eine Logout-Anfrage
      if (user) {
        await api.post('/api/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Token aus localStorage entfernen
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Benutzer aus State entfernen
      setUser(null);
    }
  };

  // Registrierungsfunktion
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.post('/api/auth/register', userData);
      
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registrierung fehlgeschlagen');
      return { success: false, error: err.response?.data?.message || 'Registrierung fehlgeschlagen' };
    } finally {
      setIsLoading(false);
    }
  };

  // Passwort-Zurücksetzen Funktion
  const resetPassword = async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.post('/api/auth/password-reset', { email });
      
      return { success: true };
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Zurücksetzen des Passworts fehlgeschlagen');
      return { success: false, error: err.response?.data?.message || 'Zurücksetzen des Passworts fehlgeschlagen' };
    } finally {
      setIsLoading(false);
    }
  };

  // Hilfsfunktion zur Prüfung, ob der Benutzer ein Admin ist
  const isAdmin = () => {
    // Debug-Ausgaben, um die Benutzerstruktur zu überprüfen
    
    // Korrekter Zugriff auf die Rolle in der verschachtelten Struktur
    const userRole = user?.data?.user?.role || user?.role;
    
    // Prüfung, ob die Rolle 'admin' ist
    const isUserAdmin = userRole === 'admin';
    
    return isUserAdmin;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        error,
        login,
        logout,
        register,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook für den einfacheren Zugriff auf den Auth-Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 