import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Business,
  History,
  ViewModule,
  CloudUpload,
  People,
} from '@mui/icons-material';
import { ChapterMemberData } from '../services/ChapterDataLoader';
import PreviousDataTab from './PreviousDataTab';
import MembersTab from './MembersTab';
import MatrixTab from './MatrixTab';
import FileUploadComponent from './FileUploadComponent';

interface ChapterDetailPageProps {
  chapterData: ChapterMemberData;
  onBackToChapters: () => void;
  onMemberSelect: (memberName: string) => void;
}

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
      id={`chapter-tabpanel-${index}`}
      aria-labelledby={`chapter-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `chapter-tab-${index}`,
    "aria-controls": `chapter-tabpanel-${index}`,
  };
}

const ChapterDetailPage: React.FC<ChapterDetailPageProps> = ({
  chapterData,
  onBackToChapters,
  onMemberSelect,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUploadSuccess = () => {
    // Trigger refresh of other tabs by incrementing counter
    setRefreshTrigger(prev => prev + 1);
    // Switch to Previous Data tab to show the results
    setTabValue(0);
  };

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton 
          onClick={onBackToChapters}
          sx={{ color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
        
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            underline="hover" 
            color="inherit" 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              onBackToChapters();
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Business fontSize="inherit" />
            BNI Chapters
          </Link>
          <Typography 
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Business fontSize="inherit" />
            {chapterData.chapterName}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Chapter Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {chapterData.chapterName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chapterData.memberCount} members • Loaded {chapterData.loadedAt.toLocaleDateString()}
        </Typography>
      </Box>

      {/* Tab Navigation */}
      <Paper elevation={0}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="chapter detail tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="Previous Data" 
              icon={<History />} 
              iconPosition="start"
              {...a11yProps(0)} 
            />
            <Tab 
              label="Matrices" 
              icon={<ViewModule />} 
              iconPosition="start"
              {...a11yProps(1)} 
            />
            <Tab 
              label="Upload Palms Data" 
              icon={<CloudUpload />} 
              iconPosition="start"
              {...a11yProps(2)} 
            />
            <Tab 
              label="Members" 
              icon={<People />} 
              iconPosition="start"
              {...a11yProps(3)} 
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
          <PreviousDataTab chapterData={chapterData} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <MatrixTab chapterData={chapterData} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <FileUploadComponent
            chapterId={chapterData.chapterId}
            chapterName={chapterData.chapterName}
            onUploadSuccess={handleUploadSuccess}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <MembersTab chapterData={chapterData} onMemberSelect={onMemberSelect} />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ChapterDetailPage;