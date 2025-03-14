import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 100, color: 'warning.main', mb: 2 }} />
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Seite nicht gefunden
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600 }}>
          Die angeforderte Seite existiert nicht. Sie haben möglicherweise einen falschen Link angeklickt
          oder die Seite wurde verschoben oder gelöscht.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Zum Dashboard
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(-1)}
          >
            Zurück
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFound;
