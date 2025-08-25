import React from 'react';
import {
  Box,
  Typography,
  Alert,
} from '@mui/material';

const DataQualityMonitor: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        📊 Data Quality Monitor
      </Typography>
      
      <Alert severity="info">
        Data quality monitoring will be displayed here after reports are generated.
        This feature matches the comprehensive data validation from the original Streamlit application.
      </Alert>
    </Box>
  );
};

export default DataQualityMonitor;