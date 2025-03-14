import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await authApi.resetPasswordRequest(email);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(
        err.response?.data?.message || 
        'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
            Passwort zurücksetzen
          </Typography>
          
          {success ? (
            <Box sx={{ mt: 3, width: '100%' }}>
              <Alert severity="success">
                Es wurde eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts gesendet.
                Bitte überprüfen Sie Ihren Posteingang.
              </Alert>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Link component={RouterLink} to="/login" variant="body2">
                  Zurück zur Anmeldung
                </Link>
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
                Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
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
                  id="email"
                  label="E-Mail-Adresse"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default ForgotPassword; 