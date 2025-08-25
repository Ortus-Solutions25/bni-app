import React, { useState } from 'react';
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
  const [tabValue, setTabValue] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{
    palmsFiles: File[];
    memberFiles: File[];
  }>({ palmsFiles: [], memberFiles: [] });
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilesUploaded = (palmsFiles: File[], memberFiles: File[]) => {
    setUploadedFiles({ palmsFiles, memberFiles });
  };

  const handleMatrixDataGenerated = (newMatrixData: MatrixData) => {
    setMatrixData(newMatrixData);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
                variant="fullWidth"
              >
                <Tab label="📤 File Upload" {...a11yProps(0)} />
                <Tab label="📊 Generate Reports" {...a11yProps(1)} />
                <Tab label="🔍 View Matrices" {...a11yProps(2)} />
                <Tab label="📋 Data Quality" {...a11yProps(3)} />
                <Tab label="🗑️ File Management" {...a11yProps(4)} />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <FileUploadSection onFilesUploaded={handleFilesUploaded} />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <ReportGeneration 
                uploadedFiles={uploadedFiles}
                onReportsGenerated={() => setTabValue(2)}
                onMatrixDataGenerated={handleMatrixDataGenerated}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <MatrixVisualization data={matrixData || undefined} />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <DataQualityMonitor />
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <FileManagement onFilesCleared={() => {
                setUploadedFiles({ palmsFiles: [], memberFiles: [] });
                setTabValue(0);
              }} />
            </TabPanel>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
