import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  ArcElement 
} from 'chart.js';
import { useQuery } from 'react-query';
import { statsApi } from '../services/api';

// Chart.js registrieren
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  
  // Anfrage für detaillierte Statistiken mit dem aktuellen Zeitbereich
  const { data: apiResponse, isLoading, error } = useQuery(
    ['detailedStats', timeRange], 
    () => statsApi.getApiCallStats({ timeRange }),
    { keepPreviousData: true }
  );
  
  // Transformationsstatistiken abrufen
  const { data: transformationsResponse } = useQuery(
    ['transformationStats', timeRange],
    () => statsApi.getTransformationStats({ timeRange }),
    { keepPreviousData: true }
  );

  // Webhook-Statistiken abrufen
  const { data: webhooksResponse } = useQuery(
    ['webhookStats', timeRange],
    () => statsApi.getWebhookStats({ timeRange }),
    { keepPreviousData: true }
  );

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Fehler beim Laden der Statistiken: {error.message}
      </Alert>
    );
  }
  
  // Daten aus der API-Antwort extrahieren oder Fallback verwenden
  const apiStats = apiResponse?.data?.data || {
    dailyCalls: { labels: [], data: [] },
    endpointDistribution: { labels: [], data: [] },
    responseTime: { average: 0, min: 0, max: 0, p95: 0 },
    errorRate: { overall: 0, byEndpoint: {} }
  };
  
  const transformationStats = transformationsResponse?.data?.data || {
    total: 0,
    active: 0,
    history: [],
    usage: { labels: [], data: [] }
  };
  
  const webhookStats = webhooksResponse?.data?.data || {
    total: 0,
    active: 0,
    successRate: 0,
    history: [],
    endpoints: []
  };
  
  // Daten für Charts vorbereiten
  const apiCallsData = {
    labels: apiStats.dailyCalls.labels,
    datasets: [
      {
        label: 'API-Aufrufe',
        data: apiStats.dailyCalls.data,
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }
    ]
  };
  
  const transformationsData = {
    labels: transformationStats.usage.labels,
    datasets: [
      {
        label: 'Nutzung',
        data: transformationStats.usage.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Fehlerverteilung als Kreisdiagramm
  const errorDistributionData = {
    labels: Object.keys(apiStats.errorRate.byEndpoint),
    datasets: [
      {
        data: Object.values(apiStats.errorRate.byEndpoint),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Gesamtzahlen berechnen
  const totalApiCalls = apiStats.dailyCalls.data.reduce((sum, val) => sum + val, 0);
  const totalTransformations = transformationStats.history.reduce((sum, day) => sum + day.count, 0);
  const totalErrors = Math.round(totalApiCalls * (apiStats.errorRate.overall / 100));

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Statistiken</Typography>
        <FormControl variant="outlined" sx={{ minWidth: 120 }}>
          <InputLabel>Zeitraum</InputLabel>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            label="Zeitraum"
          >
            <MenuItem value="1d">1 Tag</MenuItem>
            <MenuItem value="7d">7 Tage</MenuItem>
            <MenuItem value="30d">30 Tage</MenuItem>
            <MenuItem value="90d">90 Tage</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* API-Aufrufe Linienchart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>API-Aufrufe</Typography>
            <Box sx={{ height: 300 }}>
              <Line 
                data={apiCallsData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* Transformationen Balkendiagramm */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Transformationen</Typography>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={transformationsData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>

        {/* Fehlerverteilung Kreisdiagramm */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Fehlerverteilung (%)</Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: '70%', height: '100%' }}>
                <Pie 
                  data={errorDistributionData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right'
                      }
                    }
                  }} 
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Zusammenfassung */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Zusammenfassung</Typography>
            <Box>
              <Typography variant="body1">
                Gesamtzahl API-Aufrufe: <strong>{totalApiCalls}</strong>
              </Typography>
              <Typography variant="body1">
                Gesamtzahl Transformationen: <strong>{totalTransformations}</strong>
              </Typography>
              <Typography variant="body1">
                Gesamtzahl Fehler: <strong>{totalErrors}</strong>
              </Typography>
              <Typography variant="body1">
                Erfolgsrate: <strong>{100 - apiStats.errorRate.overall}%</strong>
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Durchschnittliche Antwortzeit: <strong>{apiStats.responseTime.average}ms</strong>
              </Typography>
              <Typography variant="body1">
                Minimale Antwortzeit: <strong>{apiStats.responseTime.min}ms</strong>
              </Typography>
              <Typography variant="body1">
                Maximale Antwortzeit: <strong>{apiStats.responseTime.max}ms</strong>
              </Typography>
              <Typography variant="body1">
                95% Percentil: <strong>{apiStats.responseTime.p95}ms</strong>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Statistics; 