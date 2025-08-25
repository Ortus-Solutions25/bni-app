import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  People,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface FileUploadSectionProps {
  onFilesUploaded: (palmsFiles: File[], memberFiles: File[]) => void;
  onNavigateToReports?: () => void;
}

const steps = [
  'Upload PALMS Data Files',
  'Upload Member Names File', 
  'Validate Files',
  'Ready for Processing'
];

const FileUploadSection: React.FC<FileUploadSectionProps> = ({ onFilesUploaded, onNavigateToReports }) => {
  const [palmsFiles, setPalmsFiles] = useState<File[]>([]);
  const [memberFiles, setMemberFiles] = useState<File[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationComplete, setValidationComplete] = useState(false);

  // Validation function
  const validateFiles = useCallback(async () => {
    setIsValidating(true);
    setValidationErrors([]);
    
    // Simulate validation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const errors: string[] = [];
    
    if (palmsFiles.length === 0) {
      errors.push('At least one PALMS data file is required');
    }
    
    if (memberFiles.length === 0) {
      errors.push('Member names file is required');
    }

    // Check file sizes
    [...palmsFiles, ...memberFiles].forEach(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        errors.push(`File ${file.name} is too large (max 50MB)`);
      }
      if (file.size === 0) {
        errors.push(`File ${file.name} is empty`);
      }
    });

    setValidationErrors(errors);
    setIsValidating(false);
    setValidationComplete(true);
    
    if (errors.length === 0) {
      setActiveStep(3);
      onFilesUploaded(palmsFiles, memberFiles);
      
      // Automatically navigate to reports page after successful validation
      setTimeout(() => {
        onNavigateToReports?.();
      }, 1500); // Wait 1.5 seconds to show success message
    }
  }, [palmsFiles, memberFiles, onFilesUploaded, onNavigateToReports]);

  // Auto-validate when both files are uploaded
  useEffect(() => {
    if (palmsFiles.length > 0 && memberFiles.length > 0 && activeStep === 2 && !isValidating && !validationComplete) {
      setTimeout(() => {
        validateFiles();
      }, 1000); // Wait 1 second after files are uploaded
    }
  }, [palmsFiles.length, memberFiles.length, activeStep, isValidating, validationComplete, validateFiles]);

  // PALMS files dropzone
  const onDropPalms = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx')
    );
    
    if (validFiles.length !== acceptedFiles.length) {
      setValidationErrors(prev => [...prev, 'Some files were rejected. Only .xls and .xlsx files are allowed.']);
    }
    
    setPalmsFiles(prev => [...prev, ...validFiles]);
    if (validFiles.length > 0 && activeStep === 0) {
      setActiveStep(1);
    }
  }, [activeStep]);

  // Member files dropzone  
  const onDropMembers = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx')
    );
    
    if (validFiles.length !== acceptedFiles.length) {
      setValidationErrors(prev => [...prev, 'Some files were rejected. Only .xls and .xlsx files are allowed.']);
    }

    // Only allow one member file
    if (validFiles.length > 0) {
      setMemberFiles([validFiles[0]]);
      if (activeStep === 1) {
        setActiveStep(2);
      }
    }
  }, [activeStep, palmsFiles]);

  const {
    getRootProps: getPalmsRootProps,
    getInputProps: getPalmsInputProps,
    isDragActive: isPalmsDragActive
  } = useDropzone({
    onDrop: onDropPalms,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true
  });

  const {
    getRootProps: getMembersRootProps,
    getInputProps: getMembersInputProps,
    isDragActive: isMembersDragActive
  } = useDropzone({
    onDrop: onDropMembers,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const removeFile = (fileName: string, type: 'palms' | 'members') => {
    if (type === 'palms') {
      setPalmsFiles(prev => prev.filter(f => f.name !== fileName));
    } else {
      setMemberFiles([]);
    }
    setValidationComplete(false);
    setValidationErrors([]);
  };

  const clearAllFiles = () => {
    setPalmsFiles([]);
    setMemberFiles([]);
    setActiveStep(0);
    setValidationComplete(false);
    setValidationErrors([]);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        📤 File Upload
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Instructions:</strong><br/>
          1. Upload your BNI PALMS slip-audit-reports (multiple Excel files supported)<br/>
          2. Upload member names file (single Excel file with first and last names)<br/>
          3. Validate files to ensure they're properly formatted<br/>
          4. Proceed to generate your analysis matrices
        </Typography>
      </Alert>

      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              {index === 0 && (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    Upload your BNI PALMS slip-audit-reports (.xls or .xlsx files)
                  </Typography>
                  <Card 
                    sx={{ 
                      mt: 2,
                      border: isPalmsDragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
                      backgroundColor: isPalmsDragActive ? 'action.hover' : 'background.paper'
                    }}
                  >
                    <CardContent>
                      <div {...getPalmsRootProps()} style={{ cursor: 'pointer', textAlign: 'center', padding: '20px' }}>
                        <input {...getPalmsInputProps()} />
                        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          {isPalmsDragActive ? 'Drop PALMS files here' : 'Drop PALMS files here or click to browse'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Supports .xls and .xlsx files • Multiple files allowed
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {palmsFiles.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        PALMS Files ({palmsFiles.length}):
                      </Typography>
                      <List dense>
                        {palmsFiles.map((file) => (
                          <ListItem key={file.name} sx={{ px: 0 }}>
                            <ListItemIcon>
                              <Description />
                            </ListItemIcon>
                            <ListItemText 
                              primary={file.name}
                              secondary={`${(file.size / 1024).toFixed(1)} KB`}
                            />
                            <Button 
                              size="small" 
                              color="error"
                              onClick={() => removeFile(file.name, 'palms')}
                            >
                              Remove
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}

              {index === 1 && (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    Upload your member names file (.xls or .xlsx with first and last names)
                  </Typography>
                  <Card 
                    sx={{ 
                      mt: 2,
                      border: isMembersDragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
                      backgroundColor: isMembersDragActive ? 'action.hover' : 'background.paper'
                    }}
                  >
                    <CardContent>
                      <div {...getMembersRootProps()} style={{ cursor: 'pointer', textAlign: 'center', padding: '20px' }}>
                        <input {...getMembersInputProps()} />
                        <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          {isMembersDragActive ? 'Drop member file here' : 'Drop member file here or click to browse'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Supports .xls and .xlsx files • Single file only
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>

                  {memberFiles.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Member File:
                      </Typography>
                      <List dense>
                        {memberFiles.map((file) => (
                          <ListItem key={file.name} sx={{ px: 0 }}>
                            <ListItemIcon>
                              <People />
                            </ListItemIcon>
                            <ListItemText 
                              primary={file.name}
                              secondary={`${(file.size / 1024).toFixed(1)} KB`}
                            />
                            <Button 
                              size="small" 
                              color="error"
                              onClick={() => removeFile(file.name, 'members')}
                            >
                              Remove
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}

              {index === 2 && (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    {isValidating || validationComplete ? 
                      'Validating your uploaded files...' : 
                      'Files will be validated automatically'
                    }
                  </Typography>
                  
                  {isValidating && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Checking file format, structure and content...
                      </Typography>
                      <LinearProgress />
                    </Box>
                  )}

                  {!isValidating && !validationComplete && (
                    <Button
                      variant="contained"
                      onClick={validateFiles}
                      disabled={palmsFiles.length === 0 || memberFiles.length === 0}
                      sx={{ mt: 2 }}
                    >
                      Validate Now
                    </Button>
                  )}

                  {validationErrors.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      {validationErrors.map((error, idx) => (
                        <Alert severity="error" key={idx} sx={{ mt: 1 }}>
                          {error}
                        </Alert>
                      ))}
                    </Box>
                  )}

                  {validationComplete && validationErrors.length === 0 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <CheckCircle sx={{ mr: 1 }} />
                      All files validated successfully! Automatically navigating to Generate Reports...
                    </Alert>
                  )}
                </Box>
              )}

              {index === 3 && (
                <Box>
                  <Alert severity="success">
                    <CheckCircle sx={{ mr: 1 }} />
                    Files uploaded and validated successfully! You can now proceed to the "Generate Reports" tab.
                  </Alert>
                  
                  <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Summary:
                    </Typography>
                    <Typography variant="body2">
                      • PALMS Files: {palmsFiles.length}<br/>
                      • Member File: {memberFiles.length > 0 ? memberFiles[0].name : 'None'}<br/>
                      • Total Size: {((palmsFiles.reduce((sum, f) => sum + f.size, 0) + memberFiles.reduce((sum, f) => sum + f.size, 0)) / 1024).toFixed(1)} KB
                    </Typography>
                  </Paper>
                </Box>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {(palmsFiles.length > 0 || memberFiles.length > 0) && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Button
            variant="outlined"
            color="error"
            onClick={clearAllFiles}
            startIcon={<Warning />}
          >
            Clear All Files
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FileUploadSection;