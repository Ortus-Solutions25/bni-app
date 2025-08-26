import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  Delete,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface UploadFile {
  file: File;
  name: string;
  size: string;
  type: 'slip_audit' | 'member_names';
}

interface FileUploadComponentProps {
  chapterId: string;
  chapterName: string;
  onUploadSuccess: () => void;
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  chapterId,
  chapterName,
  onUploadSuccess,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [monthYear, setMonthYear] = useState('');
  const [uploadOption, setUploadOption] = useState<'slip_only' | 'slip_and_members'>('slip_only');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      // Try to determine file type based on name
      const isSlipAudit = file.name.toLowerCase().includes('slip') || 
                         file.name.toLowerCase().includes('audit');
      
      return {
        file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: (isSlipAudit ? 'slip_audit' : 'member_names') as 'slip_audit' | 'member_names'
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
    setUploadResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const changeFileType = (index: number, newType: 'slip_audit' | 'member_names') => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, type: newType } : file
    ));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadResult({type: 'error', message: 'Please select at least one file'});
      return;
    }

    if (!monthYear) {
      setUploadResult({type: 'error', message: 'Please enter month/year (e.g., 2024-08)'});
      return;
    }

    const slipAuditFile = files.find(f => f.type === 'slip_audit');
    if (!slipAuditFile) {
      setUploadResult({type: 'error', message: 'Please select at least one slip audit file'});
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('slip_audit_file', slipAuditFile.file);
      
      const memberNamesFile = files.find(f => f.type === 'member_names');
      if (memberNamesFile) {
        formData.append('member_names_file', memberNamesFile.file);
      }
      
      formData.append('chapter_id', chapterId);
      formData.append('month_year', monthYear);
      formData.append('upload_option', uploadOption);

      const response = await fetch('/api/upload/', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({
          type: 'success', 
          message: `Successfully uploaded and processed ${files.length} file(s) for ${monthYear}`
        });
        setFiles([]);
        setMonthYear('');
        onUploadSuccess();
      } else {
        setUploadResult({
          type: 'error',
          message: result.error || 'Upload failed'
        });
      }
    } catch (error: any) {
      setUploadResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudUpload />
        Upload Palms Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload slip audit reports from PALMS for {chapterName}
      </Typography>

      {/* Upload Form */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, maxWidth: 800 }}>
        
        {/* Month/Year Input */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Month/Year"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            placeholder="e.g., 2024-08"
            helperText="Format: YYYY-MM"
            sx={{ minWidth: 200 }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Upload Option</InputLabel>
            <Select
              value={uploadOption}
              label="Upload Option"
              onChange={(e) => setUploadOption(e.target.value as 'slip_only' | 'slip_and_members')}
            >
              <MenuItem value="slip_only">Slip Audit Only</MenuItem>
              <MenuItem value="slip_and_members">Slip Audit + Member Names</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* File Drop Zone */}
        <Paper
          {...getRootProps()}
          elevation={1}
          sx={{
            p: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop files here...' : 'Drop PALMS Files Here'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Or click to select files
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported formats: .xls, .xlsx
          </Typography>
        </Paper>

        {/* Selected Files */}
        {files.length > 0 && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Selected Files ({files.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {files.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {file.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {file.size}
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>File Type</InputLabel>
                      <Select
                        value={file.type}
                        label="File Type"
                        onChange={(e) => changeFileType(index, e.target.value as 'slip_audit' | 'member_names')}
                      >
                        <MenuItem value="slip_audit">Slip Audit</MenuItem>
                        <MenuItem value="member_names">Member Names</MenuItem>
                      </Select>
                    </FormControl>
                    <Chip
                      label={file.type === 'slip_audit' ? 'Slip Audit' : 'Member Names'}
                      color={file.type === 'slip_audit' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </Box>
                  <Button
                    onClick={() => removeFile(index)}
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* Upload Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleUpload}
            disabled={isUploading || files.length === 0 || !monthYear}
            startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUpload />}
          >
            {isUploading ? 'Uploading...' : 'Upload & Process Files'}
          </Button>
        </Box>

        {/* Upload Result */}
        {uploadResult && (
          <Alert
            severity={uploadResult.type}
            icon={uploadResult.type === 'success' ? <CheckCircle /> : <Error />}
          >
            {uploadResult.message}
          </Alert>
        )}

        {/* Instructions */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            📋 Upload Instructions
          </Typography>
          <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
            <li>
              <Typography variant="body2">
                Select the month/year in YYYY-MM format (e.g., 2024-08 for August 2024)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Upload slip audit reports exported from PALMS system (.xls or .xlsx files)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Optionally upload member names file if you have updated member information
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Files will be processed automatically and matrices will be generated
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Use "Previous Data" tab to view processed results after upload
              </Typography>
            </li>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default FileUploadComponent;