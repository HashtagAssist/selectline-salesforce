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
  Stack,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { logsApi } from '../services/api';

const LogViewer = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  
  // Filter- und Paginierungszustand
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
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
    const defaultLogTypes = {
      system: {
        title: 'System-Logs',
        description: 'Allgemeine System-Logs des Backends',
        api: logsApi.getSystemLogs,
      },
      api: {
        title: 'API-Logs',
        description: 'Logs von API-Aufrufen',
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
      erp: {
        title: 'ERP-Logs',
        description: 'Logs der ERP-Integration',
        api: logsApi.getErpLogs,
      },
      monitoring: {
        title: 'Monitoring-Logs',
        description: 'Logs des System-Monitorings',
        api: logsApi.getMonitoringLogs,
      },
    };
    
    // Dynamische Erweiterung basierend auf der Liste der verfügbaren Log-Dateien
    if (logFilesList && Array.isArray(logFilesList)) {
      // Erstelle eine Map von Dateinamen zu Log-Typen
      const logFileToType = {
        'combined.log': 'system',
        'error.log': 'error',
        'auth.log': 'auth',
        'database.log': 'database',
        'redis.log': 'redis',
        'email-service.log': 'email',
        'erp.log': 'erp',
        'monitoring.log': 'monitoring',
      };
      
      // Füge zusätzliche Log-Typen hinzu, die noch nicht in defaultLogTypes definiert sind
      logFilesList.forEach(filename => {
        // Extrahiere den Basisnamen ohne .log
        const baseName = filename.replace('.log', '');
        // Normalisiere zu einem gültigen URL-Parameter
        const typeKey = baseName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        
        // Wenn dieser Log-Typ nicht bereits definiert ist, füge ihn hinzu
        if (!defaultLogTypes[typeKey] && !logFileToType[filename]) {
          defaultLogTypes[typeKey] = {
            title: `${baseName.charAt(0).toUpperCase() + baseName.slice(1)}-Logs`,
            description: `Logs für ${baseName}`,
            api: (params) => logsApi.getLogs(typeKey, params),
            filename: filename,
          };
        }
      });
    } else if (logFilesList?.data && Array.isArray(logFilesList.data)) {
      // Falls die API die Log-Dateien als verschachteltes Objekt zurückgibt
      const logFileToType = {
        'combined.log': 'system',
        'error.log': 'error',
        'auth.log': 'auth',
        'database.log': 'database',
        'redis.log': 'redis',
        'email-service.log': 'email',
        'erp.log': 'erp',
        'monitoring.log': 'monitoring',
      };
      
      logFilesList.data.forEach(filename => {
        const baseName = filename.replace('.log', '');
        const typeKey = baseName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        
        if (!defaultLogTypes[typeKey] && !logFileToType[filename]) {
          defaultLogTypes[typeKey] = {
            title: `${baseName.charAt(0).toUpperCase() + baseName.slice(1)}-Logs`,
            description: `Logs für ${baseName}`,
            api: (params) => logsApi.getLogs(typeKey, params),
            filename: filename,
          };
        }
      });
    }
    
    return defaultLogTypes;
  }, [logFilesList]);
  
  // Falls der Log-Typ ungültig ist, zur System-Logs-Seite umleiten
  useEffect(() => {
    if (!type || !logTypes[type]) {
      navigate('/logs/system');
    }
  }, [type, navigate, logTypes]);
  
  // Anfrage für Logs mit Filtern
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['logs', type, filters, page, rowsPerPage],
    () => {
      // Nur ausführen, wenn type gültig ist
      if (type && logTypes[type]) {
        return logTypes[type].api({
          page: page + 1, // Backend-Paginierung beginnt bei 1
          limit: rowsPerPage,
          startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
          endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
          level: filters.level || undefined,
          search: filters.search || undefined,
        });
      }
      return null;
    },
    {
      keepPreviousData: true,
      enabled: !!type && !!logTypes[type], // Query nur aktivieren, wenn type gültig ist
    }
  );
  
  // Wenn der Log-Typ ungültig ist, leere Komponente rendern
  if (!type || !logTypes[type]) {
    return null;
  }
  
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
    // Beispieldaten für die Tabelle, falls keine realen Daten vorhanden sind
    const logsToDownload = Array.isArray(data?.data) ? data.data : [];
    
    if (logsToDownload.length === 0) {
      alert('Keine Logs zum Herunterladen vorhanden.');
      return;
    }
    
    try {
      // Log-Einträge in CSV-Format konvertieren
      const headers = ['Zeitstempel', 'Level', 'Nachricht', 'Quelle'];
      if (type === 'api') {
        headers.push('Endpoint', 'Status');
      }
      
      const csvContent = [
        headers.join(','),
        ...logsToDownload.map(log => {
          const row = [
            formatTimestamp(log.timestamp),
            log.level,
            `"${log.message?.replace(/"/g, '""') || ''}"`, // Anführungszeichen escapen
            log.source || logTypes[type]?.filename || type
          ];
          
          if (type === 'api') {
            row.push(log.endpoint || log.path || '-');
            row.push(log.statusCode || '-');
          }
          
          return row.join(',');
        })
      ].join('\n');
      
      // CSV-Datei erzeugen und herunterladen
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
  
  // Handler für Wechsel zwischen Log-Typen über Tabs
  const handleChangeLogType = (event, newType) => {
    navigate(`/logs/${newType}`);
  };
  
  // Öffnen des Dialogs mit der Log-Nachricht
  const handleOpenLogDialog = (log) => {
    // Sicherstellen, dass wir eine gültige Nachricht haben
    const message = log.message || log.msg || log.text || log.content || JSON.stringify(log);
    setSelectedLogMessage(formatLogMessage(message));
    setSelectedLogDetails(log);
    setDialogOpen(true);
  };
  
  // Schließen des Dialogs
  const handleCloseLogDialog = () => {
    setDialogOpen(false);
  };
  
  // Logs aus der API-Antwort extrahieren
  let logs = [];
  let totalLogs = 0;

  // Extrahieren der Logs aus verschiedenen möglichen Antwortstrukturen
  if (data) {
    // Standard-API-Antwort
    if (data.status === 'success' && Array.isArray(data.data) && data.pagination) {
      logs = data.data;
      totalLogs = data.pagination.total || logs.length;
    }
    // Axios-Antwort mit verschachtelter Struktur
    else if (data.data && data.data.status === 'success' && Array.isArray(data.data.data)) {
      logs = data.data.data;
      totalLogs = data.data.pagination?.total || logs.length;
    }
    // data.data ist ein Array
    else if (Array.isArray(data.data)) {
      logs = data.data;
      totalLogs = data.pagination?.total || logs.length;
    }
    // data selbst ist ein Array
    else if (Array.isArray(data)) {
      logs = data;
      totalLogs = logs.length;
    }
    // data.data.logs ist ein Array
    else if (data.data && Array.isArray(data.data.logs)) {
      logs = data.data.logs;
      totalLogs = data.data.pagination?.total || logs.length;
    }
    // data hat ein "logs" Feld, das ein Array ist
    else if (data.logs && Array.isArray(data.logs)) {
      logs = data.logs;
      totalLogs = data.pagination?.total || logs.length;
    }
    // Fallback: Versuche, irgendwelche Daten zu extrahieren
    else {
      // Versuche, in jeder Eigenschaft von data nach einem Array zu suchen
      for (const key in data) {
        if (Array.isArray(data[key])) {
          logs = data[key];
          break;
        } else if (data[key] && typeof data[key] === 'object') {
          // Überprüfe geschachtelte Eigenschaften
          for (const nestedKey in data[key]) {
            if (Array.isArray(data[key][nestedKey])) {
              logs = data[key][nestedKey];
              break;
            }
          }
        }
      }
      totalLogs = logs.length;
    }
  }
  
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

  // Definieren Sie die Haupt-Logs, die als Tabs angezeigt werden sollen
  const mainLogTypes = ['system', 'error', 'api', 'auth'];

  // Alle anderen Logs werden im Dropdown angezeigt
  const otherLogTypes = Object.entries(logTypes).filter(
    ([key]) => !mainLogTypes.includes(key)
  );

  return (
    <Box sx={{ 
      flexGrow: 1, 
      pb: 4, 
      overflowX: 'hidden',
     
    }}>
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
        </Stack>
      </Box>
       {/* Tabs für einfaches Umschalten zwischen Log-Typen */}
       <Paper sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tabs
            value={mainLogTypes.includes(type) ? type : false}
            onChange={handleChangeLogType}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="primary log tabs"
            sx={{ flexGrow: 1 }}
          >
            {mainLogTypes.map((key) => 
              logTypes[key] && (
                <Tab key={key} label={logTypes[key].title} value={key} />
              )
            )}
          </Tabs>
          
          {otherLogTypes.length > 0 && (
            <>
              <Button
                id="logs-menu-button"
                aria-controls={open ? 'logs-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleMenuClick}
                endIcon={<ArrowDropDownIcon />}
                sx={{ ml: 1, whiteSpace: 'nowrap' }}
              >
                Weitere Logs
              </Button>
              <Menu
                id="logs-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'logs-menu-button',
                }}
              >
                {otherLogTypes.map(([key, value]) => (
                  <MenuItem 
                    key={key} 
                    onClick={() => handleMenuItemClick(key)}
                    selected={type === key}
                  >
                    {value.title}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
      </Paper>
     
      
      <Divider sx={{ mb: 4 }} />
      
      {/* Filterbereich */}
      <Paper sx={{ p: 2, mb: 4, maxWidth: '100%', overflowX: 'hidden' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              label="Von Datum"
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              label="Bis Datum"
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            width: '100%'
          }}
        >
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
          {error.response && (
            <Typography variant="body2" component="div">
              Server-Antwort: 
              <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(error.response.data, null, 2)}
              </pre>
            </Typography>
          )}
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ mt: 1 }} 
            onClick={() => refetch()}
          >
            Erneut versuchen
          </Button>
        </Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden', maxWidth: '100%' }}>
          <TableContainer sx={{ 
            maxHeight: 'calc(100vh - 400px)', 
            overflowX: 'auto', 
            width: '100%',
            '& table': {
              width: '100% !important'
            }
          }}>
            <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell width="180px" sx={{ minWidth: '180px', maxWidth: '180px' }}>Zeitstempel</TableCell>
                  <TableCell width="100px" sx={{ minWidth: '100px', maxWidth: '100px' }}>Level</TableCell>
                  <TableCell sx={{ 
                    width: 'auto', 
                    minWidth: '200px',
                    maxWidth: { xs: '200px', sm: '300px', md: '400px', lg: '500px' },
                    whiteSpace: 'normal', 
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    '& .message-content': {
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }
                  }}>Nachricht</TableCell>
                  <TableCell width="120px" sx={{ minWidth: '120px', maxWidth: '120px' }}>Quelle</TableCell>
                  {type === 'api' && <TableCell width="120px" sx={{ minWidth: '120px', maxWidth: '120px' }}>Endpoint</TableCell>}
                  {type === 'api' && <TableCell width="80px" sx={{ minWidth: '80px', maxWidth: '80px' }}>Status</TableCell>}
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
                  logs.map((log, index) => (
                    <TableRow key={log._id || log.id || index} hover>
                      <TableCell width="180px" sx={{ minWidth: '180px', maxWidth: '180px' }}>{formatTimestamp(log.timestamp)}</TableCell>
                      <TableCell width="100px" sx={{ minWidth: '100px', maxWidth: '100px' }}>{renderLogLevel(log.level)}</TableCell>
                      <TableCell sx={{ 
                        width: 'auto', 
                        minWidth: '200px',
                        maxWidth: { xs: '200px', sm: '300px', md: '400px', lg: '500px' },
                        whiteSpace: 'normal', 
                        wordBreak: 'break-word',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        '& .message-content': {
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }
                      }}>
                        <Box 
                          className="message-content"
                          onClick={() => handleOpenLogDialog(log)}
                        >
                          {formatLogMessage(log.message || log.msg || log.text || log.content || "Keine Nachricht")}
                        </Box>
                      </TableCell>
                      <TableCell width="120px" sx={{ minWidth: '120px', maxWidth: '120px' }}>
                        {log.source || log.logger || log.service || (logTypes[type]?.filename || type)}
                      </TableCell>
                      {type === 'api' && <TableCell width="120px" sx={{ minWidth: '120px', maxWidth: '120px' }}>{log.endpoint || log.path || '-'}</TableCell>}
                      {type === 'api' && (
                        <TableCell width="80px" sx={{ minWidth: '80px', maxWidth: '80px' }}>
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
      
      {/* Dialog zum Anzeigen der vollständigen Log-Nachricht */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseLogDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxWidth: 'calc(80% - 64px)'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6">
            {selectedLogDetails?.level && renderLogLevel(selectedLogDetails.level)}
            {' '}Log-Eintrag
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseLogDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
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
            {selectedLogDetails?.endpoint && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Endpoint:</Typography>
                <Typography variant="body1" gutterBottom>{selectedLogDetails.endpoint}</Typography>
              </Grid>
            )}
            {selectedLogDetails?.statusCode && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Status:</Typography>
                <Typography variant="body1" gutterBottom>{selectedLogDetails.statusCode}</Typography>
              </Grid>
            )}
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
            {selectedLogDetails?.stack && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Stack Trace:</Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    mt: 1, 
                    bgcolor: 'background.paper', 
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}
                >
                  {selectedLogDetails.stack}
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLogDialog}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogViewer;