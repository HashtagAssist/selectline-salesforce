import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // Hier würden Sie Ihre Einstellungen vom Server laden
    // Beispiel:
    // const fetchSettings = async () => {
    //   try {
    //     const response = await api.getSettings();
    //     setSettings(response.data);
    //   } catch (error) {
    //     console.error('Fehler beim Laden der Einstellungen:', error);
    //   }
    // };
    // fetchSettings();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = (category) => {
    // Hier würden Sie die Einstellungen an den Server senden
    // Beispiel:
    // const saveSettings = async () => {
    //   try {
    //     await api.updateSettings(category, settings[category]);
    //     setSnackbar({
    //       open: true,
    //       message: 'Einstellungen erfolgreich gespeichert',
    //       severity: 'success'
    //     });
    //   } catch (error) {
    //     console.error('Fehler beim Speichern der Einstellungen:', error);
    //     setSnackbar({
    //       open: true,
    //       message: 'Fehler beim Speichern der Einstellungen',
    //       severity: 'error'
    //     });
    //   }
    // };
    // saveSettings();

    // Dummy-Implementierung
    console.log('Gespeicherte Einstellungen:', category, settings[category]);
    setSnackbar({
      open: true,
      message: 'Einstellungen erfolgreich gespeichert',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Einstellungen</Typography>
      
      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Allgemein" id="settings-tab-0" />
          <Tab label="API" id="settings-tab-1" />
          <Tab label="E-Mail" id="settings-tab-2" />
          <Tab label="Sicherheit" id="settings-tab-3" />
        </Tabs>

        {/* Allgemeine Einstellungen */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Allgemeine Einstellungen</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Anwendungsname"
                value={settings.general.appName}
                onChange={(e) => handleInputChange('general', 'appName', e.target.value)}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Standardsprache"
                value={settings.general.defaultLanguage}
                onChange={(e) => handleInputChange('general', 'defaultLanguage', e.target.value)}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Zeitzone"
                value={settings.general.timezone}
                onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.enableNotifications}
                    onChange={(e) => handleInputChange('general', 'enableNotifications', e.target.checked)}
                    color="primary"
                  />
                }
                label="Benachrichtigungen aktivieren"
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('general')}
              >
                Speichern
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* API-Einstellungen */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>API-Einstellungen</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API-Basis-URL"
                value={settings.api.baseUrl}
                onChange={(e) => handleInputChange('api', 'baseUrl', e.target.value)}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Timeout (ms)"
                type="number"
                value={settings.api.timeout}
                onChange={(e) => handleInputChange('api', 'timeout', parseInt(e.target.value))}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Wiederholungsversuche"
                type="number"
                value={settings.api.retryAttempts}
                onChange={(e) => handleInputChange('api', 'retryAttempts', parseInt(e.target.value))}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maximale gleichzeitige Anfragen"
                type="number"
                value={settings.api.maxConcurrentRequests}
                onChange={(e) => handleInputChange('api', 'maxConcurrentRequests', parseInt(e.target.value))}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('api')}
              >
                Speichern
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* E-Mail-Einstellungen */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>E-Mail-Einstellungen</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP-Server"
                value={settings.email.smtpServer}
                onChange={(e) => handleInputChange('email', 'smtpServer', e.target.value)}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP-Port"
                type="number"
                value={settings.email.smtpPort}
                onChange={(e) => handleInputChange('email', 'smtpPort', parseInt(e.target.value))}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP-Benutzer"
                value={settings.email.smtpUser}
                onChange={(e) => handleInputChange('email', 'smtpUser', e.target.value)}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP-Passwort"
                type="password"
                value={settings.email.smtpPassword}
                onChange={(e) => handleInputChange('email', 'smtpPassword', e.target.value)}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Absender-E-Mail"
                value={settings.email.senderEmail}
                onChange={(e) => handleInputChange('email', 'senderEmail', e.target.value)}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.email.enableEmailNotifications}
                    onChange={(e) => handleInputChange('email', 'enableEmailNotifications', e.target.checked)}
                    color="primary"
                  />
                }
                label="E-Mail-Benachrichtigungen aktivieren"
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('email')}
              >
                Speichern
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Sicherheitseinstellungen */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Sicherheitseinstellungen</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sitzungstimeout (Minuten)"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maximale Anmeldeversuche"
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Erlaubte IP-Adressen (durch Komma getrennt)"
                value={settings.security.allowedIPs}
                onChange={(e) => handleInputChange('security', 'allowedIPs', e.target.value)}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.requireMfa}
                    onChange={(e) => handleInputChange('security', 'requireMfa', e.target.checked)}
                    color="primary"
                  />
                }
                label="Multi-Faktor-Authentifizierung erforderlich"
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('security')}
              >
                Speichern
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 