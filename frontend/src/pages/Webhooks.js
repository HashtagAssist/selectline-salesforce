import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { webhookApi, statsApi } from '../services/api';

const Webhooks = () => {
  const queryClient = useQueryClient();
  
  // React Query für Webhooks-Daten
  const { 
    data: webhooksResponse, 
    isLoading: webhooksLoading, 
    error: webhooksError 
  } = useQuery('webhooks', webhookApi.getWebhooks);
  
  // Statistiken laden
  const { 
    data: statsResponse, 
    isLoading: statsLoading 
  } = useQuery('webhookStats', () => statsApi.getWebhookStats({ timeRange: '7d' }));
  
  // Extrahiere Daten aus Antworten oder Fallback
  const webhooksData = webhooksResponse?.data?.data || [];
  const webhookStats = statsResponse?.data?.data || {
    total: 0,
    active: 0,
    successRate: 0,
    history: [],
    endpoints: []
  };

  const [webhooks, setWebhooks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentWebhook, setCurrentWebhook] = useState({
    name: '',
    url: '',
    events: '',
    active: true
  });
  const [isEditing, setIsEditing] = useState(false);

  // Mutationen für API-Interaktionen
  const createWebhookMutation = useMutation(webhookApi.createWebhook, {
    onSuccess: () => {
      queryClient.invalidateQueries('webhooks');
    }
  });

  const updateWebhookMutation = useMutation(
    (webhook) => webhookApi.updateWebhook(webhook.id, webhook),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('webhooks');
      }
    }
  );

  const deleteWebhookMutation = useMutation(webhookApi.deleteWebhook, {
    onSuccess: () => {
      queryClient.invalidateQueries('webhooks');
    }
  });

  // Daten aus API übernehmen, wenn sie geladen sind
  useEffect(() => {
    if (webhooksData.length > 0) {
      setWebhooks(webhooksData);
    }
  }, [webhooksData]);

  const handleOpenDialog = (webhook = null) => {
    if (webhook) {
      setCurrentWebhook(webhook);
      setIsEditing(true);
    } else {
      setCurrentWebhook({ name: '', url: '', events: '', active: true });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentWebhook(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (isEditing) {
      updateWebhookMutation.mutate(currentWebhook);
    } else {
      createWebhookMutation.mutate(currentWebhook);
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Webhook löschen möchten?')) {
      deleteWebhookMutation.mutate(id);
    }
  };

  const copyWebhookUrl = (url) => {
    navigator.clipboard.writeText(url);
    // Hier könnte ein Toast angezeigt werden
  };

  // Komponente für die Statistik-Übersicht
  const WebhookStats = () => {
    if (statsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={30} />
        </Box>
      );
    }

    return (
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">Gesamt</Typography>
          <Typography variant="h6">{webhookStats.total}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">Aktiv</Typography>
          <Typography variant="h6">{webhookStats.active}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">Erfolgsrate</Typography>
          <Typography variant="h6">{webhookStats.successRate}%</Typography>
        </Box>
        
        {webhookStats.endpoints?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>Aktivste Endpoints:</Typography>
            {webhookStats.endpoints.slice(0, 3).map((endpoint, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>{endpoint.name}</Typography>
                <Chip 
                  size="small" 
                  label={`${endpoint.calls} Aufrufe`} 
                  color={endpoint.successRate > 90 ? 'success' : 'warning'} 
                  variant="outlined" 
                />
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    );
  };

  // Zeige Ladeindikator, wenn Daten noch geladen werden
  if (webhooksLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Zeige Fehlermeldung, wenn ein Fehler aufgetreten ist
  if (webhooksError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Fehler beim Laden der Webhooks: {webhooksError.message}
      </Alert>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Webhooks</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Webhook hinzufügen
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Statistikübersicht */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Statistiken</Typography>
            <Divider sx={{ mb: 2 }} />
            <WebhookStats />
          </Paper>
        </Grid>

        {/* Webhook-Liste */}
        <Grid item xs={12} md={8}>
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>Events</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>{webhook.name}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {webhook.url}
                          </Typography>
                          <Tooltip title="URL kopieren">
                            <IconButton size="small" onClick={() => copyWebhookUrl(webhook.url)}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>{webhook.events}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={webhook.active ? 'Aktiv' : 'Inaktiv'}
                          color={webhook.active ? 'success' : 'default'}
                          variant="outlined"
                          icon={webhook.active ? <CheckCircleIcon /> : <ErrorIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Bearbeiten">
                          <IconButton onClick={() => handleOpenDialog(webhook)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Löschen">
                          <IconButton onClick={() => handleDelete(webhook.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Webhook bearbeiten' : 'Neuen Webhook erstellen'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            fullWidth
            variant="outlined"
            value={currentWebhook.name}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="url"
            label="Webhook URL"
            fullWidth
            variant="outlined"
            value={currentWebhook.url}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="events"
            label="Events (durch Komma getrennt)"
            fullWidth
            variant="outlined"
            value={currentWebhook.events}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={createWebhookMutation.isLoading || updateWebhookMutation.isLoading}
          >
            {(createWebhookMutation.isLoading || updateWebhookMutation.isLoading) ? (
              <CircularProgress size={24} />
            ) : (
              'Speichern'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Webhooks; 