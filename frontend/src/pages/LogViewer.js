import React, { useState, useEffect, useMemo } from 'react';
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
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FilterListIcon from '@mui/icons-material/FilterList';
import { logsApi } from '../services/api';

// Hilfsfunktion für die Formatierung des Zeitstempels
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '-';
  
  try {
    // Manchmal kann der Zeitstempel in Millisekunden als Zahl vorliegen
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
    
    // Wenn es ein Objekt ist, könnte es ein Date-Objekt sein
    if (typeof timestamp === 'object' && timestamp instanceof Date) {
      return timestamp.toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
    
    // Sonst string als Datum parsen
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return String(timestamp);
    }
    
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (e) {
    return String(timestamp);
  }
};

// Hilfsfunktion für die Anzeige des Log-Levels mit entsprechender Farbe
const renderLogLevel = (level) => {
  if (!level) return <Chip label="Unknown" color="default" size="small" variant="outlined" />;
  
  // Normalisiere den Level-String
  const normalizedLevel = String(level).toLowerCase();
  
  const levelMap = {
    error: { color: 'error', label: 'Fehler' },
    err: { color: 'error', label: 'Fehler' },
    fatal: { color: 'error', label: 'Fatal' },
    critical: { color: 'error', label: 'Kritisch' },
    warn: { color: 'warning', label: 'Warnung' },
    warning: { color: 'warning', label: 'Warnung' },
    info: { color: 'info', label: 'Info' },
    information: { color: 'info', label: 'Info' },
    debug: { color: 'default', label: 'Debug' },
    trace: { color: 'default', label: 'Trace' },
    verbose: { color: 'default', label: 'Verbose' },
  };
  
  // Suche nach dem passenden Level oder verwende einen Standard
  const levelInfo = levelMap[normalizedLevel] || 
                   // Versuche, passende Level-Informationen anhand von Teilstrings zu finden
                   Object.entries(levelMap).find(([key]) => normalizedLevel.includes(key))?.[1] || 
                   { color: 'default', label: level };
  
  return (
    <Chip
      label={levelInfo.label}
      color={levelInfo.color}
      size="small"
      variant="outlined"
    />
  );
};

// Formattierung von JSON-Objekten in Log-Nachrichten
const formatLogMessage = (message) => {
  if (!message) return 'Keine Nachricht verfügbar';
  
  // Wenn message bereits ein Objekt ist
  if (typeof message === 'object') {
    try {
      return JSON.stringify(message, null, 2);
    } catch (e) {
      // Falls Fehler bei JSON.stringify
      return String(message);
    }
  }
  
  // Prüfen, ob die Nachricht ein JSON-String ist und formatieren
  if (typeof message === 'string') {
    try {
      if (message.trim().startsWith('{') || message.trim().startsWith('[')) {
        const jsonObj = JSON.parse(message);
        return JSON.stringify(jsonObj, null, 2);
      }
    } catch (e) {
      // Keine JSON-Nachricht, ignorieren
    }
  }
  
  // Fallback: Nachricht als String zurückgeben
  return String(message);
};

const LogViewer = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  
  // Paginierungszustand
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Filter- und Paginierungszustand
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    level: '',
    search: '',
  });
  
  // State für den Dialog zum Anzeigen der vollständigen Log-Nachricht
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLogMessage, setSelectedLogMessage] = useState('');
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);
  
  // State für das Dropdown
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // Abrufen der verfügbaren Log-Dateien
  const {
    data: logFilesList,
    isLoading: isLoadingLogFiles,
    error: logFilesError,
  } = useQuery(['log-files-list'], () => logsApi.getLogsList(), {
    staleTime: 60000, // 1 Minute Caching
  });
  
  // Erstellung der Log-Typen basierend auf den verfügbaren Backend-Routen
  const logTypes = useMemo(() => {
    const defaultLogTypes = {};
    
    if (logFilesList && Array.isArray(logFilesList)) {
      logFilesList.forEach(filename => {
        const baseName = filename.replace('.log', '');
        const typeKey = baseName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        
        defaultLogTypes[typeKey] = {
          title: `${baseName.charAt(0).toUpperCase() + baseName.slice(1)}-Logs`,
          description: `Logs für ${baseName}`,
          api: (params) => logsApi.getLogs(typeKey, params),
          filename: filename,
        };
      });
    }
    
    return defaultLogTypes;
  }, [logFilesList]);
  
  // Falls der Log-Typ ungültig ist oder nicht vorhanden, zur ersten verfügbaren Log-Datei umleiten
  useEffect(() => {
    if (logFilesList && Array.isArray(logFilesList) && logFilesList.length > 0) {
      if (!type) {
        // Wenn keine Route mit Typ aufgerufen wurde, zur ersten Log-Datei umleiten
        const firstLogType = logFilesList[0].replace('.log', '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        navigate(`/logs/${firstLogType}`, { replace: true });
      } else if (!logTypes[type]) {
        // Wenn der Typ ungültig ist, zur ersten Log-Datei umleiten
        const firstLogType = logFilesList[0].replace('.log', '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        navigate(`/logs/${firstLogType}`, { replace: true });
      }
    }
  }, [type, navigate, logTypes, logFilesList]);
  
  // Anfrage für Logs
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['logs', type, filters, page, rowsPerPage],
    () => {
      if (type && logTypes[type]) {
        // Datumsfilter korrekt formatieren
        const formattedFilters = {
          page: page + 1,
          limit: rowsPerPage,
          startDate: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
          endDate: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
          level: filters.level || undefined,
          search: filters.search || undefined,
        };
        return logTypes[type].api(formattedFilters);
      }
      return null;
    },
    {
      keepPreviousData: true,
      enabled: !!type && !!logTypes[type],
    }
  );
  
  // Handler für Filter-Änderungen
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0); // Zurück zur ersten Seite bei Filteränderung
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
  
  // Wenn die Log-Dateien noch geladen werden, Ladeanzeige anzeigen
  if (isLoadingLogFiles) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Wenn ein Fehler beim Laden der Log-Dateien auftritt
  if (logFilesError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="subtitle1" gutterBottom>
            Fehler beim Laden der Log-Dateien:
          </Typography>
          <Typography variant="body2" gutterBottom>
            {logFilesError.message}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Wenn keine Log-Dateien verfügbar sind
  if (!logFilesList || logFilesList.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="subtitle1" gutterBottom>
            Keine Log-Dateien verfügbar
          </Typography>
          <Typography variant="body2">
            Es sind derzeit keine Log-Dateien im System vorhanden.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Wenn der Log-Typ ungültig ist, leere Komponente rendern
  if (!type || !logTypes[type]) {
    return null;
  }
  
  // Handler für Paginierung
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handler für Logs herunterladen
  const handleDownloadLogs = () => {
    const logsToDownload = Array.isArray(data?.data) ? data.data : [];
    
    if (logsToDownload.length === 0) {
      alert('Keine Logs zum Herunterladen vorhanden.');
      return;
    }
    
    try {
      const headers = ['Zeitstempel', 'Level', 'Nachricht', 'Quelle'];
      const csvContent = [
        headers.join(','),
        ...logsToDownload.map(log => {
          const row = [
            formatTimestamp(log.timestamp),
            log.level,
            `"${log.message?.replace(/"/g, '""') || ''}"`,
            log.source || logTypes[type]?.filename || type
          ];
          return row.join(',');
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${logTypes[type].title.replace(/ /g, '-')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Fehler beim Herunterladen der Logs:', error);
      alert(`Fehler beim Herunterladen: ${error.message}`);
    }
  };
  
  // Öffnen des Dialogs mit der Log-Nachricht
  const handleOpenLogDialog = (log) => {
    const message = log.message || log.msg || log.text || log.content || JSON.stringify(log);
    setSelectedLogMessage(formatLogMessage(message));
    setSelectedLogDetails(log);
    setDialogOpen(true);
  };
  
  // Schließen des Dialogs
  const handleCloseLogDialog = () => {
    setDialogOpen(false);
  };
  
  // Handler für das Öffnen/Schließen des Dropdown-Menüs
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handler für die Auswahl aus dem Dropdown
  const handleMenuItemClick = (key) => {
    navigate(`/logs/${key}`);
    handleMenuClose();
  };

  // Logs aus der API-Antwort extrahieren
  let logs = [];
  let totalLogs = 0;

  if (data) {
    if (data.status === 'success' && Array.isArray(data.data) && data.pagination) {
      logs = data.data;
      totalLogs = data.pagination.total || logs.length;
    } else if (data.data && data.data.status === 'success' && Array.isArray(data.data.data)) {
      logs = data.data.data;
      totalLogs = data.data.pagination?.total || logs.length;
    } else if (Array.isArray(data.data)) {
      logs = data.data;
      totalLogs = data.pagination?.total || logs.length;
    } else if (Array.isArray(data)) {
      logs = data;
      totalLogs = logs.length;
    }
  }

  return (
    <Box sx={{ flexGrow: 1, pb: 4, overflowX: 'hidden' }}>
      {/* Kopfzeile mit Titel und Aktionsbuttons */}
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
          <Button
            variant="outlined"
            endIcon={<ArrowDropDownIcon />}
            onClick={handleMenuClick}
          >
            Weitere Logs
          </Button>
        </Stack>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {/* Filterbereich */}
      <Paper sx={{ p: 2, mb: 4, maxWidth: '100%', overflowX: 'hidden' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              label="Von Datum"
              value={filters.startDate ? new Date(filters.startDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              label="Bis Datum"
              value={filters.endDate ? new Date(filters.endDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
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
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Suche"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Suchbegriff eingeben..."
            />
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', width: '100%' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
          <Typography variant="subtitle1" gutterBottom>
            Fehler beim Laden der Logs:
          </Typography>
          <Typography variant="body2" gutterBottom>
            {error.message}
          </Typography>
          <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => refetch()}>
            Erneut versuchen
          </Button>
        </Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden', maxWidth: '100%' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)', overflowX: 'auto', width: '100%' }}>
            <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell width="180px">Zeitstempel</TableCell>
                  <TableCell width="100px">Level</TableCell>
                  <TableCell>Nachricht</TableCell>
                  <TableCell width="120px">Quelle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Keine Logs gefunden. Bitte passen Sie die Filter an.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, index) => (
                    <TableRow key={log._id || log.id || index} hover>
                      <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                      <TableCell>{renderLogLevel(log.level)}</TableCell>
                      <TableCell>
                        <Box 
                          onClick={() => handleOpenLogDialog(log)}
                          sx={{ cursor: 'pointer' }}
                        >
                          {formatLogMessage(log.message || log.msg || log.text || log.content || "Keine Nachricht")}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {log.source || log.logger || log.service || (logTypes[type]?.filename || type)}
                      </TableCell>
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
      
      {/* Dialog zum Anzeigen der vollständigen Log-Nachricht */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseLogDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            {selectedLogDetails?.level && renderLogLevel(selectedLogDetails.level)}
            {' '}Log-Eintrag
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseLogDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Zeitstempel:</Typography>
              <Typography variant="body1" gutterBottom>
                {selectedLogDetails?.timestamp ? formatTimestamp(selectedLogDetails.timestamp) : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Quelle:</Typography>
              <Typography variant="body1" gutterBottom>
                {selectedLogDetails?.source || (selectedLogDetails && logTypes[type]?.filename) || type || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Nachricht:</Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mt: 1, 
                  bgcolor: 'background.paper', 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}
              >
                {selectedLogMessage}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLogDialog}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Dropdown-Menü für Log-Auswahl */}
      <Menu
        id="logs-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'logs-menu-button',
        }}
      >
        {Object.entries(logTypes).map(([key, value]) => (
          <MenuItem 
            key={key} 
            onClick={() => handleMenuItemClick(key)}
            selected={type === key}
          >
            {value.title}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LogViewer;