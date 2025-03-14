import React, { useState } from 'react';
import { useQuery } from 'react-query';
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
  Tooltip,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { erpApi } from '../services/api';

const ApiCalls = () => {
  // State für Paginierung
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State für Filter
  const [filters, setFilters] = useState({
    endpoint: '',
    method: '',
    status: '',
    startDate: null,
    endDate: null,
    search: '',
  });
  
  // State für erweiterte Zeilen
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Datenabfrage mit React Query
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['apiCalls', page, rowsPerPage, filters],
    () => erpApi.getApiCalls({
      page: page + 1,
      limit: rowsPerPage,
      endpoint: filters.endpoint || undefined,
      method: filters.method || undefined,
      status: filters.status || undefined,
      startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
      search: filters.search || undefined,
    }),
    {
      keepPreviousData: true,
    }
  );
  
  // Handler für Filter
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };
  
  // Handler für Filter zurücksetzen
  const handleResetFilters = () => {
    setFilters({
      endpoint: '',
      method: '',
      status: '',
      startDate: null,
      endDate: null,
      search: '',
    });
    setPage(0);
  };
  
  // Handler für Paginierung
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handler für erweiterte Zeilen
  const handleExpandRow = (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };
  
  // Hilfsfunktion zum Formatieren des Zeitstempels
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
  
  // Hilfsfunktion zum Formatieren der Dauer
  const formatDuration = (ms) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // Beispieldaten für die Tabelle, falls noch keine API-Integration vorhanden ist
  const apiCalls = Array.isArray(data?.data) ? data.data : [
    {
      id: '1',
      endpoint: '/api/artikel',
      method: 'GET',
      status: 200,
      duration: 120,
      timestamp: new Date().toISOString(),
      requestHeaders: { 'Content-Type': 'application/json', 'Authorization': 'Bearer xxx' },
      requestBody: null,
      responseHeaders: { 'Content-Type': 'application/json' },
      responseBody: { data: [{ id: 1, name: 'Produkt 1' }, { id: 2, name: 'Produkt 2' }] },
    },
    {
      id: '2',
      endpoint: '/api/auftraege',
      method: 'POST',
      status: 201,
      duration: 350,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      requestHeaders: { 'Content-Type': 'application/json', 'Authorization': 'Bearer xxx' },
      requestBody: { kundeId: 123, artikel: [{ id: 1, menge: 5 }] },
      responseHeaders: { 'Content-Type': 'application/json' },
      responseBody: { id: 456, status: 'erstellt' },
    },
    {
      id: '3',
      endpoint: '/api/kunden/123',
      method: 'GET',
      status: 404,
      duration: 85,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      requestHeaders: { 'Content-Type': 'application/json', 'Authorization': 'Bearer xxx' },
      requestBody: null,
      responseHeaders: { 'Content-Type': 'application/json' },
      responseBody: { error: 'Kunde nicht gefunden' },
    },
  ];
  
  const totalCalls = data?.pagination?.total || apiCalls.length;

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      <Typography variant="h4" gutterBottom>
        SelectLine API-Aufrufe
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Übersicht und Monitoring aller Aufrufe an die SelectLine API.
      </Typography>
      <Divider sx={{ mb: 4 }} />
      
      {/* Filterbereich */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel id="method-select-label">Methode</InputLabel>
              <Select
                labelId="method-select-label"
                value={filters.method}
                label="Methode"
                onChange={(e) => handleFilterChange('method', e.target.value)}
              >
                <MenuItem value="">Alle</MenuItem>
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">Alle</MenuItem>
                <MenuItem value="success">Erfolgreich (2xx)</MenuItem>
                <MenuItem value="error">Fehler (4xx, 5xx)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.5}>
            <TextField
              fullWidth
              label="Von Datum"
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2.5}>
            <TextField
              fullWidth
              label="Bis Datum"
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Suche (Endpoint)"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="z.B. /api/artikel"
            />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => refetch()}
              >
                Aktualisieren
              </Button>
              <Button
                variant="contained"
                startIcon={<FilterListIcon />}
                onClick={handleResetFilters}
              >
                Filter zurücksetzen
              </Button>
            </Stack>
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
          Fehler beim Laden der API-Aufrufe: {error.message}
        </Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell>Zeitpunkt</TableCell>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Methode</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Dauer</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Keine API-Aufrufe gefunden. Bitte passen Sie die Filter an.
                    </TableCell>
                  </TableRow>
                ) : (
                  apiCalls.map((call) => (
                    <React.Fragment key={call.id}>
                      <TableRow hover>
                        <TableCell padding="checkbox">
                          <IconButton
                            size="small"
                            onClick={() => handleExpandRow(call.id)}
                            aria-label="Details anzeigen"
                          >
                            {expandedRow === call.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{formatTimestamp(call.timestamp)}</TableCell>
                        <TableCell>{call.endpoint}</TableCell>
                        <TableCell>
                          <Chip
                            label={call.method}
                            color={
                              call.method === 'GET' ? 'info' :
                              call.method === 'POST' ? 'success' :
                              call.method === 'PUT' || call.method === 'PATCH' ? 'warning' :
                              call.method === 'DELETE' ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={call.status}
                            color={
                              call.status >= 200 && call.status < 300 ? 'success' :
                              call.status >= 400 && call.status < 500 ? 'warning' :
                              call.status >= 500 ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDuration(call.duration)}</TableCell>
                        <TableCell>
                          <Tooltip title="Details anzeigen">
                            <IconButton
                              size="small"
                              onClick={() => handleExpandRow(call.id)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {expandedRow === call.id && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ p: 3, bgcolor: 'action.hover' }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Anfrage
                                </Typography>
                                <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                                  <strong>Headers:</strong>
                                </Typography>
                                <Paper sx={{ p: 1, bgcolor: 'background.paper', mb: 2 }}>
                                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(call.requestHeaders, null, 2)}
                                  </pre>
                                </Paper>
                                {call.requestBody && (
                                  <>
                                    <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                                      <strong>Body:</strong>
                                    </Typography>
                                    <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
                                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(call.requestBody, null, 2)}
                                      </pre>
                                    </Paper>
                                  </>
                                )}
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Antwort
                                </Typography>
                                <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                                  <strong>Headers:</strong>
                                </Typography>
                                <Paper sx={{ p: 1, bgcolor: 'background.paper', mb: 2 }}>
                                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(call.responseHeaders, null, 2)}
                                  </pre>
                                </Paper>
                                <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                                  <strong>Body:</strong>
                                </Typography>
                                <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
                                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(call.responseBody, null, 2)}
                                  </pre>
                                </Paper>
                              </Grid>
                            </Grid>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalCalls}
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
  );
};

export default ApiCalls; 