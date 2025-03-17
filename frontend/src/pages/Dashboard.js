import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import StorageIcon from '@mui/icons-material/Storage';
import { statsApi } from '../services/api';

// Komponente für Statistik-Karte
const StatCard = ({ title, value, color, icon, description }) => {
  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ color, mr: 1 }}>
          {icon}
        </Box>
        <Typography component="p" variant="h4">
          {value}
        </Typography>
      </Box>
      <Typography color="text.secondary" sx={{ flex: 1 }}>
        {description}
      </Typography>
    </Paper>
  );
};

// Dashboard-Hauptkomponente
const Dashboard = () => {
  // Anfrage für Dashboard-Statistiken
  const { data: apiResponse, isLoading, error } = useQuery('dashboardStats', statsApi.getDashboardStats);
  
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 4,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Fehler beim Laden der Dashboard-Daten: {error.message}
      </Alert>
    );
  }

  // Extrahiere die Daten aus der API-Antwort mit korrekter Struktur
  // Die Backend-API gibt die Daten im Format { status: 'success', data: { ... } } zurück
  const data = apiResponse?.data?.data;
  // Keine Mock-Daten mehr verwenden
  // Wenn keine Daten vom Backend kommen, zeigen wir das entsprechend an
  if (!data) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Keine Dashboard-Daten verfügbar. Bitte stellen Sie sicher, dass der Server läuft und Sie angemeldet sind.
      </Alert>
    );
  }

  const stats = data;

  // Daten für das API-Aufrufe-Diagramm aus echten Daten
  const apiCallsData = stats.apiCalls.history.map(item => ({
    name: item.date.substring(5), // Zeige nur MM-DD an
    calls: item.count
  }));
  
  // Daten für das Fehlerrate-Diagramm aus echten Daten
  // Berechne die Fehlerrate für jeden Tag (Fehler / API-Aufrufe * 100)
  const errorRateData = stats.errors.history.map((item, index) => {
    const apiCallsForDay = stats.apiCalls.history[index]?.count || 1; // Vermeide Division durch 0
    return {
      name: item.date.substring(5), // Zeige nur MM-DD an
      rate: (item.count / apiCallsForDay * 100).toFixed(1)
    };
  });

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Übersicht über das SFSL-Sync-System und aktuelle Statistiken.
      </Typography>
      <Divider sx={{ mb: 4 }} />
      
      {/* Status-Karten */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="API-Aufrufe"
            value={stats.apiCalls.total}
            color="primary.main"
            icon={<AssessmentIcon />}
            description={`${stats.apiCalls.today} heute (${stats.apiCalls.successRate}% erfolgreich)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fehler"
            value={stats.errors.total}
            color="error.main"
            icon={<ErrorIcon />}
            description={`${stats.errors.today} heute (${stats.errors.criticalCount} kritisch)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Transformationen"
            value={stats.transformations.total}
            color="secondary.main"
            icon={<StorageIcon />}
            description={`${stats.transformations.active} aktiv, ${stats.transformations.total - stats.transformations.active} inaktiv`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System"
            value={`${stats.system.cpuUsage}%`}
            color="warning.main"
            icon={<WarningIcon />}
            description={`RAM: ${stats.system.memoryUsage}%, Disk: ${stats.system.diskUsage}%`}
          />
        </Grid>
      </Grid>
      
      {/* Diagramme */}
      <Grid container spacing={3}>
        {/* API-Aufrufe-Diagramm */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="API-Aufrufe (letzte Woche)" />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={apiCallsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calls" name="Anzahl der Aufrufe" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Fehlerrate-Diagramm */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Fehlerrate (%)" />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={errorRateData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" name="Fehlerrate %" fill="#ff6666" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Systemstatus */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Systemstatus" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      SelectLine API: Online
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Datenbank: Verbunden
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Redis-Cache: Aktiv
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 