import React from 'react';
import {
  Box,
  Typography,
  Alert,
} from '@mui/material';

interface FileManagementProps {
  onFilesCleared: () => void;
}

const FileManagement: React.FC<FileManagementProps> = ({ onFilesCleared }) => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        🗑️ File Management
      </Typography>
      
      <Alert severity="info">
        File management controls will be displayed here.
        This feature matches the file clearing and management capabilities from the original Streamlit application.
      </Alert>
    </Box>
  );
};

export default FileManagement;