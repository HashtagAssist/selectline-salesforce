import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { userApi } from '../services/api';

// Benutzerverwaltungskomponente
const Users = () => {
  const queryClient = useQueryClient();
  
  // State für Tabellenpaginierung
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State für Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // State für Formularfelder
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
  });
  
  // Anfrage für Benutzerliste
  const { data: users, isLoading, error } = useQuery('users', userApi.getUsers);
  
  // Mutation für Benutzer erstellen
  const createMutation = useMutation(userApi.createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      handleCloseCreateDialog();
    },
  });
  
  // Mutation für Benutzer aktualisieren
  const updateMutation = useMutation(
    (user) => userApi.updateUser(user.id, user),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        handleCloseEditDialog();
      },
    }
  );
  
  // Mutation für Benutzer löschen
  const deleteMutation = useMutation(
    (userId) => userApi.deleteUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        handleCloseDeleteDialog();
      },
    }
  );
  
  // Mutation für Benutzerstatus ändern
  const toggleStatusMutation = useMutation(
    ({ userId, isActive }) => userApi.changeUserStatus(userId, isActive),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
      },
    }
  );
  
  // Handler für Formularfeld-Änderungen
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handler für Paginierung
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handler für Dialog öffnen/schließen
  const handleOpenCreateDialog = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'user',
    });
    setCreateDialogOpen(true);
  };
  
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };
  
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',  // Passwort leer lassen, da es nicht angezeigt werden soll
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
    });
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };
  
  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };
  
  // Handler für Formular-Submit
  const handleCreateUser = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };
  
  const handleUpdateUser = (e) => {
    e.preventDefault();
    const updatedUser = {
      id: selectedUser._id,
      ...formData,
    };
    // Wenn Passwort leer ist, aus dem Objekt entfernen
    if (!updatedUser.password) {
      delete updatedUser.password;
    }
    updateMutation.mutate(updatedUser);
  };
  
  const handleDeleteUser = () => {
    deleteMutation.mutate(selectedUser._id);
  };
  
  const handleToggleStatus = (userId, currentStatus) => {
    toggleStatusMutation.mutate({ userId, isActive: !currentStatus });
  };
  
  // Wenn Daten geladen werden
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
  
  // Wenn ein Fehler auftritt
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Fehler beim Laden der Benutzer: {error.message}
      </Alert>
    );
  }
  
  // Beispieldaten für die Tabelle, falls keine realen Daten vorhanden sind
  const userList = users || [
    { _id: '1', username: 'admin', email: 'admin@example.com', role: 'admin', firstName: 'Admin', lastName: 'User', isActive: true, createdAt: new Date().toISOString() },
    { _id: '2', username: 'user1', email: 'user1@example.com', role: 'user', firstName: 'Normal', lastName: 'User', isActive: true, createdAt: new Date().toISOString() },
    { _id: '3', username: 'user2', email: 'user2@example.com', role: 'user', firstName: 'Another', lastName: 'User', isActive: false, createdAt: new Date().toISOString() },
  ];
  
  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Benutzerverwaltung
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Neuen Benutzer anlegen
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Verwalten Sie hier alle Benutzer des Systems.
      </Typography>
      <Divider sx={{ mb: 4 }} />
      
      {/* Benutzertabelle */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader aria-label="Benutzertabelle">
            <TableHead>
              <TableRow>
                <TableCell>Benutzername</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>E-Mail</TableCell>
                <TableCell>Rolle</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Erstellt am</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userList
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role === 'admin' ? 'Administrator' : 'Benutzer'}
                        color={user.role === 'admin' ? 'secondary' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Aktiv' : 'Inaktiv'}
                        color={user.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Status ändern">
                        <IconButton
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          color={user.isActive ? 'error' : 'success'}
                          size="small"
                        >
                          {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Bearbeiten">
                        <IconButton
                          onClick={() => handleOpenEditDialog(user)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Löschen">
                        <IconButton
                          onClick={() => handleOpenDeleteDialog(user)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={userList.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Zeilen pro Seite:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} von ${count}`}
        />
      </Paper>
      
      {/* Dialog zum Erstellen eines Benutzers */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateUser}>
          <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                name="username"
                label="Benutzername"
                value={formData.username}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                name="email"
                label="E-Mail"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                name="password"
                label="Passwort"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  name="firstName"
                  label="Vorname"
                  value={formData.firstName}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  name="lastName"
                  label="Nachname"
                  value={formData.lastName}
                  onChange={handleChange}
                  fullWidth
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel id="role-label">Rolle</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Rolle"
                >
                  <MenuItem value="user">Benutzer</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {createMutation.error.message}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateDialog}>Abbrechen</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? <CircularProgress size={24} /> : 'Erstellen'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Dialog zum Bearbeiten eines Benutzers */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleUpdateUser}>
          <DialogTitle>Benutzer bearbeiten</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                name="username"
                label="Benutzername"
                value={formData.username}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                name="email"
                label="E-Mail"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                name="password"
                label="Passwort (leer lassen für keine Änderung)"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  name="firstName"
                  label="Vorname"
                  value={formData.firstName}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  name="lastName"
                  label="Nachname"
                  value={formData.lastName}
                  onChange={handleChange}
                  fullWidth
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel id="role-label">Rolle</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Rolle"
                >
                  <MenuItem value="user">Benutzer</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {updateMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {updateMutation.error.message}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Abbrechen</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? <CircularProgress size={24} /> : 'Speichern'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Dialog zum Löschen eines Benutzers */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Benutzer löschen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie den Benutzer "{selectedUser?.username}" wirklich löschen? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteMutation.error.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Abbrechen</Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? <CircularProgress size={24} /> : 'Löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users; 