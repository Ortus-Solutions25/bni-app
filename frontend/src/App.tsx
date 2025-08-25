import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  AppBar,
  Toolbar,
  Tab,
  Tabs,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { FileUpload } from './components/FileUpload';
import { MatrixDisplay } from './components/MatrixDisplay';
import { MemberManagement } from './components/MemberManagement';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // For now, we'll hardcode a chapter ID. In a real app, this would come from auth/routing
  const CHAPTER_ID = 1;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUploadSuccess = () => {
    // Refresh matrices when a file is uploaded successfully
    setRefreshKey(prev => prev + 1);
    setTabValue(1); // Switch to matrix view
  };

  const handleMemberAdded = () => {
    // Refresh data when a member is added
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              BNI Analytics Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs">
                <Tab label="Upload Data" />
                <Tab label="View Matrices" />
                <Tab label="Manage Members" />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h4" gutterBottom>
                Upload Excel File
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Upload your BNI chapter data file (.xls or .xlsx) to process referrals, 
                one-to-one meetings, and TYFCB records.
              </Typography>
              <FileUpload 
                chapterId={CHAPTER_ID} 
                onUploadSuccess={handleUploadSuccess}
              />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <MatrixDisplay 
                key={refreshKey} 
                chapterId={CHAPTER_ID} 
              />
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h4" gutterBottom>
                Member Management
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Add and manage chapter members. Members must be added before processing Excel files
                to ensure proper name matching.
              </Typography>
              <MemberManagement 
                chapterId={CHAPTER_ID} 
                onMemberAdded={handleMemberAdded}
              />
            </TabPanel>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
