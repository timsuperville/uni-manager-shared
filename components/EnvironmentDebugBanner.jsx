/**
 * Environment Debug Banner
 * Shows current environment detection for debugging purposes
 */
import React from 'react';
import { Alert, Chip, Box } from '@mui/material';
import { isDevelopmentMode } from '../config/environment.ts';

export function EnvironmentDebugBanner() {
  // Only show in development mode
  if (!isDevelopmentMode()) {
    return null;
  }

  const envData = {
    'import.meta.env.MODE': import.meta.env.MODE,
    'import.meta.env.DEV': import.meta.env.DEV,
    'import.meta.env.PROD': import.meta.env.PROD,
    'import.meta.env.VITE_ENV': import.meta.env.VITE_ENV,
    'isDevelopmentMode()': isDevelopmentMode(),
  };

  return (
    <Alert
      severity='info'
      sx={{
        mb: 2,
        backgroundColor: '#1976d2',
        color: 'white',
        '& .MuiAlert-icon': { color: 'white' },
      }}
    >
      <Box
        sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
      >
        <strong>DEVELOPMENT ENV DEBUG:</strong>
        {Object.entries(envData).map(([key, value]) => (
          <Chip
            key={key}
            label={`${key}: ${String(value)}`}
            size='small'
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '0.75rem',
            }}
          />
        ))}
      </Box>
    </Alert>
  );
}

export default EnvironmentDebugBanner;
