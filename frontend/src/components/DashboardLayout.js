import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';

// Icons importieren
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import TransformIcon from '@mui/icons-material/Transform';
import CodeIcon from '@mui/icons-material/Code';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WarningIcon from '@mui/icons-material/Warning';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import BusinessIcon from '@mui/icons-material/Business';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Breite der geöffneten Seitenleiste
const drawerWidth = 240;

// Styled-Komponenten für das Layout
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

// Hauptkomponente für das Dashboard-Layout
const DashboardLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  
  // Hilfsfunktion, um direkt auf das korrekte Benutzerrollenfeld zuzugreifen
  const checkAdminRole = () => {
    // Berücksichtigt die verschiedenen möglichen Strukturen
    const role = user?.data?.user?.role || user?.role;
    return role === 'admin';
  };
  
  // State für geöffnete/geschlossene Seitenleiste
  const [open, setOpen] = useState(true);
  
  // State für Benutzermenü
  const [anchorEl, setAnchorEl] = useState(null);
  const userMenuOpen = Boolean(anchorEl);
  
  // Funktionen für Seitenleisten-Umschaltung
  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  // Funktionen für Benutzermenü
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Funktion für Logout
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };
  
  // Funktion für Navigation zum Profil
  const handleProfile = () => {
    handleUserMenuClose();
    navigate('/profile');
  };
  
  // Navigationselemente für die Seitenleiste
  const mainNavItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'API-Aufrufe', icon: <CodeIcon />, path: '/api-calls' },
    { text: 'Transformationen', icon: <TransformIcon />, path: '/transformations' },
    { text: 'Webhooks', icon: <StorageIcon />, path: '/webhooks' },
    { text: 'Statistiken', icon: <AssessmentIcon />, path: '/statistics' },
  ];
  
  const adminNavItems = [
    { text: 'Benutzerverwaltung', icon: <PeopleIcon />, path: '/users' },
    { text: 'Systemeinstellungen', icon: <SettingsIcon />, path: '/settings' },
  ];
  
  const logNavItems = [
    { text: 'Log-Viewer (Universal)', icon: <AssessmentIcon />, path: '/logs/system' },
    { text: 'Fehler-Logs', icon: <WarningIcon />, path: '/logs/error' },
    { text: 'System-Logs', icon: <AssessmentIcon />, path: '/logs/system' },
    { text: 'API-Logs', icon: <CodeIcon />, path: '/logs/api' },
    { text: 'Auth-Logs', icon: <LockIcon />, path: '/logs/auth' },
    { text: 'ERP-Logs', icon: <BusinessIcon />, path: '/logs/erp' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Kopfzeile */}
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="Menu öffnen"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            SFSLSync Dashboard
          </Typography>
          
          {/* Benutzer-Menü */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user?.data?.user?.fullName || user?.data?.user?.username || user?.fullName || user?.username || 'Benutzer'}
            </Typography>
            <Tooltip title="Kontoeinstellungen">
              <IconButton
                onClick={handleUserMenuOpen}
                size="small"
                edge="end"
                aria-controls={userMenuOpen ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={userMenuOpen ? 'true' : undefined}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                  {(user?.data?.user?.username || user?.username) ? (user?.data?.user?.username || user?.username).charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Benutzer-Dropdown-Menü */}
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={userMenuOpen}
            onClose={handleUserMenuClose}
            MenuListProps={{
              'aria-labelledby': 'account-button',
            }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Profil
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBarStyled>
      
      {/* Seitenleiste */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        
        {/* Hauptnavigationspunkte */}
        <List>
          {mainNavItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider />
        
        {/* Log-Navigationspunkte */}
        <List>
          {logNavItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {/* Admin-Navigationspunkte (nur für Admins) */}
        {checkAdminRole() && (
          <>
            <Divider />
            <List>
              {adminNavItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton onClick={() => navigate(item.path)}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Drawer>
      
      {/* Hauptinhalt */}
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
};

export default DashboardLayout; 