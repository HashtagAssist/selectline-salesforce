import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('profile'); // 'profile' oder 'password'
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // TODO: Implementieren der API zum Aktualisieren des Profils
      // await authApi.updateProfile({
      //   firstName: formData.firstName,
      //   lastName: formData.lastName,
      // });
      
      // Hier simulieren wir eine erfolgreiche Aktualisierung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Ihr Profil wurde erfolgreich aktualisiert.');
    } catch (err) {
      console.error('Profile update error:', err);
      setError(
        err.response?.data?.message || 
        'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validierung
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    
    if (formData.newPassword.length < 8) {
      setError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // TODO: Implementieren der API zum Ändern des Passworts
      // await authApi.changePassword({
      //   currentPassword: formData.currentPassword,
      //   newPassword: formData.newPassword,
      // });
      
      // Hier simulieren wir eine erfolgreiche Aktualisierung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Passwortfelder zurücksetzen
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setSuccess('Ihr Passwort wurde erfolgreich geändert.');
    } catch (err) {
      console.error('Password change error:', err);
      setError(
        err.response?.data?.message || 
        'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user?.username?.charAt(0) || 'U';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profil
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Hier können Sie Ihre persönlichen Daten und Ihr Passwort verwalten.
      </Typography>
      <Divider sx={{ mb: 4 }} />
      
      <Grid container spacing={4}>
        {/* Linke Spalte - Benutzerinformation */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                fontSize: '2.5rem',
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
              }}
            >
              {getInitials()}
            </Avatar>
            <Typography variant="h6" gutterBottom>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user?.email}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                display: 'inline-block',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: user?.role === 'admin' ? 'secondary.light' : 'primary.light',
                color: 'white',
                mt: 1,
              }}
            >
              {user?.role === 'admin' ? 'Administrator' : 'Benutzer'}
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Button variant="outlined" color="error" onClick={logout}>
                Abmelden
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Rechte Spalte - Bearbeitungsformulare */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {/* Tabs für die Abschnitte */}
            <Box sx={{ mb: 3 }}>
              <Button
                variant={activeSection === 'profile' ? 'contained' : 'text'}
                sx={{ mr: 1 }}
                onClick={() => setActiveSection('profile')}
              >
                Profil bearbeiten
              </Button>
              <Button
                variant={activeSection === 'password' ? 'contained' : 'text'}
                onClick={() => setActiveSection('password')}
              >
                Passwort ändern
              </Button>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Fehlermeldung oder Erfolgsmeldung */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}
            
            {/* Profil bearbeiten */}
            {activeSection === 'profile' && (
              <Box component="form" onSubmit={handleProfileUpdate}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Vorname"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      margin="normal"
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nachname"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      margin="normal"
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="E-Mail-Adresse"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      margin="normal"
                      disabled={true} // E-Mail-Adresse kann nicht geändert werden
                      helperText="Die E-Mail-Adresse kann nicht geändert werden."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{ mt: 2 }}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Speichern'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Passwort ändern */}
            {activeSection === 'password' && (
              <Box component="form" onSubmit={handlePasswordChange}>
                <TextField
                  fullWidth
                  label="Aktuelles Passwort"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={isSubmitting}
                />
                <TextField
                  fullWidth
                  label="Neues Passwort"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={isSubmitting}
                  helperText="Das Passwort muss mindestens 8 Zeichen lang sein."
                />
                <TextField
                  fullWidth
                  label="Neues Passwort bestätigen"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ mt: 2 }}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Passwort ändern'}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 