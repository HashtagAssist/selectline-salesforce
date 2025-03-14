import React, { useState, useEffect } from 'react';
import { Box, TextField, Paper, Typography } from '@mui/material';

const CodeEditor = ({ 
  value, 
  onChange, 
  language = 'javascript', 
  height = '300px',
  label = 'Code',
  placeholder = 'Geben Sie Ihren Code hier ein...',
  helperText = '',
  error = false,
  disabled = false
}) => {
  const [editorValue, setEditorValue] = useState(value || '');

  useEffect(() => {
    setEditorValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setEditorValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="textSecondary">
          {language.toUpperCase()}
        </Typography>
      </Box>
      <TextField
        fullWidth
        multiline
        label={label}
        value={editorValue}
        onChange={handleChange}
        variant="outlined"
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        disabled={disabled}
        InputProps={{
          sx: {
            fontFamily: 'Consolas, monospace',
            fontSize: '14px',
            '& .MuiInputBase-input': {
              height,
              overflowY: 'auto',
              whiteSpace: 'pre',
              lineHeight: 1.5,
              padding: 2,
            },
          },
        }}
      />
    </Paper>
  );
};

export default CodeEditor; 