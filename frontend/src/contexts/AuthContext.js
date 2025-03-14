import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

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
            // Token ist gültig, setze Axios-Header und hole Benutzerdaten
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await axios.get('/api/auth/profile');
            setUser(response.data);
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

  // Login-Funktion (geändert, um username statt email zu verwenden)
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/login', { username, password });
      const { token, refreshToken, user: userData } = response.data.data;
      
      // Token im localStorage speichern
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Axios-Header für zukünftige Anfragen setzen
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Benutzer im State speichern
      setUser(userData);
      
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
        await axios.post('/api/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Token aus localStorage entfernen
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Axios-Header zurücksetzen
      delete axios.defaults.headers.common['Authorization'];
      
      // Benutzer aus State entfernen
      setUser(null);
    }
  };

  // Registrierungsfunktion
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await axios.post('/api/auth/register', userData);
      
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
      
      await axios.post('/api/auth/password-reset', { email });
      
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
    return user?.role === 'admin';
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