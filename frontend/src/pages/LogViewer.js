import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { deDE } from '@mui/material/locale';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { logsApi } from '../services/api';

// Angepasstes Theme für deutsche Lokalisierung
const theme = createTheme({}, deDE);

const LogViewer = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const queryClient = useQuery.queryClient;
  
  // Mapping für Log-Typ auf Anzeigenamen und API-Funktion
  const logTypes = {
    system: {
      title: 'System-Logs',
      description: 'Allgemeine System-Logs des Backends',
      api: logsApi.getSystemLogs,
    },
    api: {
      title: 'API-Logs',
      description: 'Logs der SelectLine-API-Aufrufe',
      api: logsApi.getApiLogs,
    },
    error: {
      title: 'Fehler-Logs',
      description: 'Fehler und Ausnahmen im System',
      api: logsApi.getErrorLogs,
    },
    auth: {
      title: 'Authentifizierungs-Logs',
      description: 'Login-, Logout- und andere Authentifizierungsereignisse',
      api: logsApi.getAuthLogs,
    },
    database: {
      title: 'Datenbank-Logs',
      description: 'Logs der Datenbankoperationen',
      api: logsApi.getDatabaseLogs,
    },
    redis: {
      title: 'Redis-Logs',
      description: 'Logs des Redis-Caches',
      api: logsApi.getRedisLogs,
    },
    email: {
      title: 'E-Mail-Logs',
      description: 'Logs der E-Mail-Operationen',
      api: logsApi.getEmailLogs,
    },
  };
  
  // Falls der Log-Typ ungültig ist, zur System-Logs-Seite umleiten
  useEffect(() => {
    if (!type || !logTypes[type]) {
      navigate('/logs/system');
    }
  }, [type, navigate]);
  
  // Wenn der Log-Typ ungültig ist, leere Komponente rendern
  if (!type || !logTypes[type]) {
    return null;
  }
  
  // Filter- und Paginierungszustand
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    level: '',
    search: '',
  });
  
  // Anfrage für Logs mit Filtern
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['logs', type, filters, page, rowsPerPage],
    () => logTypes[type].api({
      page: page + 1, // Backend-Paginierung beginnt bei 1
      limit: rowsPerPage,
      startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
      level: filters.level || undefined,
      search: filters.search || undefined,
    }),
    {
      keepPreviousData: true,
    }
  );
  
  // Handler für Filter-Änderungen
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0); // Zurück zur ersten Seite bei Filteränderung
  };
  
  // Handler für Paginierung
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handler für Filter zurücksetzen
  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      level: '',
      search: '',
    });
    setPage(0);
  };
  
  // Handler für Logs herunterladen
  const handleDownloadLogs = () => {
    // Implementieren des Log-Downloads (z.B. API-Aufruf für CSV-Export)
    alert('Download-Funktion wird implementiert...');
  };
  
  // Beispieldaten für die Tabelle, falls keine realen Daten vorhanden sind
  const logs = data?.data || [];
  const totalLogs = data?.pagination?.total || 0;
  
  // Hilfsfunktion für die Formatierung des Zeitstempels
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return timestamp;
    }
  };
  
  // Hilfsfunktion für die Anzeige des Log-Levels mit entsprechender Farbe
  const renderLogLevel = (level) => {
    const levelMap = {
      error: { color: 'error', label: 'Fehler' },
      warn: { color: 'warning', label: 'Warnung' },
      info: { color: 'info', label: 'Info' },
      debug: { color: 'default', label: 'Debug' },
    };
    
    const levelInfo = levelMap[level.toLowerCase()] || { color: 'default', label: level };
    
    return (
      <Chip
        label={levelInfo.label}
        color={levelInfo.color}
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, pb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {logTypes[type].title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {logTypes[type].description}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
            >
              Aktualisieren
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownloadLogs}
            >
              Herunterladen
            </Button>
          </Stack>
        </Box>
        <Divider sx={{ mb: 4 }} />
        
        {/* Filterbereich */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2.5}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={deDE}>
                <DatePicker
                  label="Von Datum"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={2.5}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={deDE}>
                <DatePicker
                  label="Bis Datum"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel id="level-select-label">Level</InputLabel>
                <Select
                  labelId="level-select-label"
                  value={filters.level}
                  label="Level"
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                >
                  <MenuItem value="">Alle</MenuItem>
                  <MenuItem value="error">Fehler</MenuItem>
                  <MenuItem value="warn">Warnung</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="debug">Debug</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Suche"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Suchbegriff eingeben..."
              />
            </Grid>
            <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<FilterListIcon />}
                onClick={handleResetFilters}
              >
                Filter zurücksetzen
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Ergebnisbereich */}
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Fehler beim Laden der Logs: {error.message}
          </Alert>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Zeitstempel</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Nachricht</TableCell>
                    <TableCell>Quelle</TableCell>
                    {type === 'api' && <TableCell>Endpoint</TableCell>}
                    {type === 'api' && <TableCell>Status</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={type === 'api' ? 6 : 4} align="center">
                        Keine Logs gefunden. Bitte passen Sie die Filter an.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log._id || log.id} hover>
                        <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                        <TableCell>{renderLogLevel(log.level)}</TableCell>
                        <TableCell sx={{ maxWidth: '400px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {log.message}
                        </TableCell>
                        <TableCell>{log.source || '-'}</TableCell>
                        {type === 'api' && <TableCell>{log.endpoint || '-'}</TableCell>}
                        {type === 'api' && (
                          <TableCell>
                            {log.statusCode && (
                              <Chip
                                label={log.statusCode}
                                color={log.statusCode >= 400 ? 'error' : 'success'}
                                size="small"
                              />
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalLogs}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Zeilen pro Seite:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} von ${count}`}
            />
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default LogViewer; 