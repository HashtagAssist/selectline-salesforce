import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
  Divider
} from '@mui/material';

const Settings = () => {
  const [settings, setSettings] = useState({
    general: {
      appName: 'SFSL Sync',
      defaultLanguage: 'de',
      timezone: 'Europe/Berlin',
      enableNotifications: true
    },
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 30000,
      retryAttempts: 3,
      maxConcurrentRequests: 10
    },
    email: {
      smtpServer: 'smtp.example.com',
      smtpPort: 587,
      smtpUser: 'user@example.com',
      smtpPassword: '',
      senderEmail: 'noreply@example.com',
      enableEmailNotifications: true
    },
    security: {
      sessionTimeout: 60,
      requireMfa: false,
      allowedIPs: '',
      maxLoginAttempts: 5
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Fehler beim Laden der Einstellungen');
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/settings', settings);
      toast.success('Einstellungen erfolgreich gespeichert');
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen');
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}>Lade Einstellungen...</Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Einstellungen
        </Typography>
        
        <form onSubmit={handleSubmit}>
          {/* Allgemeine Einstellungen */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Allgemeine Einstellungen
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="App-Name"
                  value={settings.general.appName}
                  onChange={(e) => handleChange('general', 'appName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Standardsprache"
                  value={settings.general.defaultLanguage}
                  onChange={(e) => handleChange('general', 'defaultLanguage', e.target.value)}
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Zeitzone"
                  value={settings.general.timezone}
                  onChange={(e) => handleChange('general', 'timezone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.general.enableNotifications}
                      onChange={(e) => handleChange('general', 'enableNotifications', e.target.checked)}
                    />
                  }
                  label="Benachrichtigungen aktivieren"
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* API Einstellungen */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              API Einstellungen
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Basis-URL"
                  value={settings.api.baseUrl}
                  onChange={(e) => handleChange('api', 'baseUrl', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Timeout (ms)"
                  value={settings.api.timeout}
                  onChange={(e) => handleChange('api', 'timeout', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Wiederholungsversuche"
                  value={settings.api.retryAttempts}
                  onChange={(e) => handleChange('api', 'retryAttempts', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max. gleichzeitige Anfragen"
                  value={settings.api.maxConcurrentRequests}
                  onChange={(e) => handleChange('api', 'maxConcurrentRequests', parseInt(e.target.value))}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* E-Mail Einstellungen */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              E-Mail Einstellungen
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Server"
                  value={settings.email.smtpServer}
                  onChange={(e) => handleChange('email', 'smtpServer', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="SMTP Port"
                  value={settings.email.smtpPort}
                  onChange={(e) => handleChange('email', 'smtpPort', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Benutzer"
                  value={settings.email.smtpUser}
                  onChange={(e) => handleChange('email', 'smtpUser', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="SMTP Passwort"
                  value={settings.email.smtpPassword}
                  onChange={(e) => handleChange('email', 'smtpPassword', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Absender E-Mail"
                  value={settings.email.senderEmail}
                  onChange={(e) => handleChange('email', 'senderEmail', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.email.enableEmailNotifications}
                      onChange={(e) => handleChange('email', 'enableEmailNotifications', e.target.checked)}
                    />
                  }
                  label="E-Mail Benachrichtigungen aktivieren"
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Sicherheitseinstellungen */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Sicherheitseinstellungen
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Session Timeout (Minuten)"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleChange('security', 'sessionTimeout', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.security.requireMfa}
                      onChange={(e) => handleChange('security', 'requireMfa', e.target.checked)}
                    />
                  }
                  label="MFA erforderlich"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Erlaubte IPs"
                  value={settings.security.allowedIPs}
                  onChange={(e) => handleChange('security', 'allowedIPs', e.target.value)}
                  placeholder="IPs durch Komma getrennt"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max. Login-Versuche"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => handleChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
            >
              Einstellungen speichern
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Settings;