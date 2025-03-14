import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Avatar,
  Button,
  TextField,
  Link,
  Paper,
  Box,
  Grid,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { authApi } from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Bei Komponenten-Montage den Token überprüfen
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setError('Ungültiger oder fehlender Token.');
        return;
      }
      
      try {
        // TODO: Implementieren einer API-Funktion zum Überprüfen des Tokens
        // Für den Moment nehmen wir an, dass der Token gültig ist
        setIsTokenValid(true);
      } catch (err) {
        console.error('Token verification error:', err);
        setIsTokenValid(false);
        setError('Der Token ist ungültig oder abgelaufen.');
      }
    };
    
    verifyToken();
  }, [token]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Bitte geben Sie ein Passwort ein.');
      return;
    }
    
    if (password !== passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      
      // Nach 3 Sekunden zur Login-Seite weiterleiten
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err.response?.data?.message || 
        'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isTokenValid === null) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (isTokenValid === false) {
      return (
        <Box sx={{ mt: 3, width: '100%' }}>
          <Alert severity="error">
            {error || 'Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.'}
          </Alert>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Neuen Link anfordern
            </Link>
          </Box>
        </Box>
      );
    }
    
    if (success) {
      return (
        <Box sx={{ mt: 3, width: '100%' }}>
          <Alert severity="success">
            Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden in Kürze zur Anmeldeseite weitergeleitet.
          </Alert>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Zur Anmeldeseite
            </Link>
          </Box>
        </Box>
      );
    }
    
    return (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
          Geben Sie Ihr neues Passwort ein.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Neues Passwort"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="passwordConfirm"
            label="Passwort bestätigen"
            type="password"
            id="passwordConfirm"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Passwort zurücksetzen'}
          </Button>
          <Grid container justifyContent="center">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Zurück zur Anmeldung
              </Link>
            </Grid>
          </Grid>
        </Box>
      </>
    );
  };

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(https://source.unsplash.com/random?technology)',
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) =>
            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Neues Passwort festlegen
          </Typography>
          
          {renderContent()}
        </Box>
      </Grid>
    </Grid>
  );
};

export default ResetPassword; 