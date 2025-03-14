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
  const { data, isLoading, error } = useQuery('dashboardStats', statsApi.getDashboardStats);
  
  // Beispieldaten für Diagramme (werden später durch echte Daten ersetzt)
  const apiCallsData = [
    { name: '00:00', calls: 12 },
    { name: '04:00', calls: 8 },
    { name: '08:00', calls: 23 },
    { name: '12:00', calls: 35 },
    { name: '16:00', calls: 29 },
    { name: '20:00', calls: 17 },
  ];
  
  const errorRateData = [
    { name: 'Mo', rate: 2.3 },
    { name: 'Di', rate: 1.8 },
    { name: 'Mi', rate: 3.5 },
    { name: 'Do', rate: 2.9 },
    { name: 'Fr', rate: 1.2 },
    { name: 'Sa', rate: 0.8 },
    { name: 'So', rate: 0.5 },
  ];

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

  // Platzhalter für reale Daten, bis die API-Endpunkte implementiert sind
  const stats = data || {
    apiCalls: {
      total: 12543,
      today: 243,
      successRate: 98.7,
    },
    errors: {
      total: 157,
      today: 3,
      criticalCount: 0,
    },
    system: {
      cpuUsage: 32,
      memoryUsage: 48,
      diskUsage: 27,
    },
    transformations: {
      total: 28,
      active: 24,
    },
    webhooks: {
      total: 12,
      active: 10,
    },
  };

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
            <CardHeader title="API-Aufrufe (heute)" />
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
                  <Line type="monotone" dataKey="calls" stroke="#8884d8" activeDot={{ r: 8 }} />
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
                  <Bar dataKey="rate" fill="#ff6666" />
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