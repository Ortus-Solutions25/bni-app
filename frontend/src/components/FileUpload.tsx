import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileUploadProps {
  chapterId: number;
  onUploadSuccess: (result: any) => void;
}

interface ProcessingResult {
  success: boolean;
  referrals_created: number;
  one_to_ones_created: number;
  tyfcbs_created: number;
  total_processed: number;
  errors: string[];
  warnings: string[];
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ chapterId, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chapter_id', chapterId.toString());

      const response = await fetch('http://localhost:8000/api/upload/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        onUploadSuccess(data);
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Upload failed: ' + (error as Error).message,
        referrals_created: 0,
        one_to_ones_created: 0,
        tyfcbs_created: 0,
        total_processed: 0,
        errors: [(error as Error).message],
        warnings: [],
      });
    } finally {
      setIsUploading(false);
    }
  }, [chapterId, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'primary.light' : 'grey.50',
          cursor: 'pointer',
          textAlign: 'center',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.light',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Drop the Excel file here'
            : 'Drag & drop an Excel file here, or click to select'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Supports .xls and .xlsx files
        </Typography>
        {isUploading && (
          <Box sx={{ mt: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Processing file...
            </Typography>
          </Box>
        )}
      </Paper>

      {result && (
        <Box sx={{ mt: 3 }}>
          {result.success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                File processed successfully!
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary={`Referrals Created: ${result.referrals_created}`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`One-to-Ones Created: ${result.one_to_ones_created}`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`TYFCBs Created: ${result.tyfcbs_created}`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`Total Records Processed: ${result.total_processed}`} 
                  />
                </ListItem>
              </List>
            </Alert>
          ) : (
            <Alert severity="error">
              <Typography variant="subtitle1" gutterBottom>
                Processing failed
              </Typography>
              <Typography variant="body2">
                {result.error || 'Unknown error occurred'}
              </Typography>
            </Alert>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Warnings ({result.warnings.length})
              </Typography>
              <List dense>
                {result.warnings.slice(0, 5).map((warning, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
                {result.warnings.length > 5 && (
                  <ListItem>
                    <ListItemText primary={`... and ${result.warnings.length - 5} more`} />
                  </ListItem>
                )}
              </List>
            </Alert>
          )}

          {result.errors && result.errors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Errors ({result.errors.length})
              </Typography>
              <List dense>
                {result.errors.slice(0, 3).map((error, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={error} />
                  </ListItem>
                ))}
                {result.errors.length > 3 && (
                  <ListItem>
                    <ListItemText primary={`... and ${result.errors.length - 3} more`} />
                  </ListItem>
                )}
              </List>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};