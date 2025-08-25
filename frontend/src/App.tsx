import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  CssBaseline,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Analytics } from '@mui/icons-material';

// Import components
import FileUploadSection from './components/FileUploadSection';
import ReportGeneration from './components/ReportGeneration';
import DataQualityMonitor from './components/DataQualityMonitor';
import FileManagement from './components/FileManagement';
import MatrixVisualization from './components/MatrixVisualization';
import ChapterRoutes from './components/ChapterRoutes';

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

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

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

interface MatrixData {
  members: string[];
  referralMatrix?: number[][];
  oneToOneMatrix?: number[][];
  combinationMatrix?: number[][];
  tyfcbSummary?: {
    withinChapter: { member: string; amount: number; count: number }[];
    outsideChapter: { member: string; amount: number; count: number }[];
    totalWithinChapter: number;
    totalOutsideChapter: number;
  };
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine current tab based on URL
  const getCurrentTab = useCallback(() => {
    if (location.pathname.startsWith('/chapters') || location.pathname === '/') {
      return 5; // Chapters tab
    } else if (location.pathname.startsWith('/upload')) {
      return 0;
    } else if (location.pathname.startsWith('/reports')) {
      return 1;
    } else if (location.pathname.startsWith('/matrices')) {
      return 2;
    } else if (location.pathname.startsWith('/quality')) {
      return 3;
    } else if (location.pathname.startsWith('/management')) {
      return 4;
    }
    return 5; // Default to chapters
  }, [location.pathname]);
  
  const [tabValue, setTabValue] = useState(getCurrentTab());
  const [uploadedFiles, setUploadedFiles] = useState<{
    palmsFiles: File[];
    memberFiles: File[];
  }>({ palmsFiles: [], memberFiles: [] });
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);

  // Update tab when location changes
  useEffect(() => {
    setTabValue(getCurrentTab());
  }, [location, getCurrentTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Navigate to appropriate route when tab changes
    switch (newValue) {
      case 0:
        navigate('/upload');
        break;
      case 1:
        navigate('/reports');
        break;
      case 2:
        navigate('/matrices');
        break;
      case 3:
        navigate('/quality');
        break;
      case 4:
        navigate('/management');
        break;
      case 5:
        navigate('/chapters');
        break;
      default:
        navigate('/chapters');
    }
  };

  const handleFilesUploaded = (palmsFiles: File[], memberFiles: File[]) => {
    setUploadedFiles({ palmsFiles, memberFiles });
  };

  const handleMatrixDataGenerated = (newMatrixData: MatrixData) => {
    setMatrixData(newMatrixData);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Analytics sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            📊 BNI PALMS Analysis
          </Typography>
          <Typography variant="body2">
            Version 2.0
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <Paper elevation={0}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="BNI Analysis tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="📤 File Upload" {...a11yProps(0)} />
              <Tab label="📊 Generate Reports" {...a11yProps(1)} />
              <Tab label="🔍 View Matrices" {...a11yProps(2)} />
              <Tab label="📋 Data Quality" {...a11yProps(3)} />
              <Tab label="🗑️ File Management" {...a11yProps(4)} />
              <Tab label="🏢 Chapters" {...a11yProps(5)} />
            </Tabs>
          </Box>

          <Routes>
            <Route path="/" element={
              <TabPanel value={tabValue} index={5}>
                <ChapterRoutes />
              </TabPanel>
            } />
            <Route path="/chapters/*" element={
              <TabPanel value={tabValue} index={5}>
                <ChapterRoutes />
              </TabPanel>
            } />
            <Route path="/upload" element={
              <TabPanel value={tabValue} index={0}>
                <FileUploadSection 
                  onFilesUploaded={handleFilesUploaded} 
                  onNavigateToReports={() => setTabValue(1)}
                />
              </TabPanel>
            } />
            <Route path="/reports" element={
              <TabPanel value={tabValue} index={1}>
                <ReportGeneration 
                  uploadedFiles={uploadedFiles}
                  onReportsGenerated={() => setTabValue(2)}
                  onMatrixDataGenerated={handleMatrixDataGenerated}
                />
              </TabPanel>
            } />
            <Route path="/matrices" element={
              <TabPanel value={tabValue} index={2}>
                <MatrixVisualization data={matrixData || undefined} />
              </TabPanel>
            } />
            <Route path="/quality" element={
              <TabPanel value={tabValue} index={3}>
                <DataQualityMonitor />
              </TabPanel>
            } />
            <Route path="/management" element={
              <TabPanel value={tabValue} index={4}>
                <FileManagement onFilesCleared={() => {
                  setUploadedFiles({ palmsFiles: [], memberFiles: [] });
                  setTabValue(0);
                }} />
              </TabPanel>
            } />
          </Routes>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
