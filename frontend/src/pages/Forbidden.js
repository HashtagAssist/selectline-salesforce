import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BlockIcon from '@mui/icons-material/Block';

const Forbidden = () => {
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
        <BlockIcon sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
        <Typography variant="h1" component="h1" gutterBottom>
          403
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Zugriff verweigert
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600 }}>
          Sie haben keine Berechtigung, auf diese Seite zuzugreifen. Wenn Sie glauben, dass dies ein
          Fehler ist, wenden Sie sich bitte an Ihren Administrator.
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

export default Forbidden; 