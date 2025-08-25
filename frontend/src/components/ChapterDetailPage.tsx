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

interface ChapterDetailPageProps {
  chapterData: ChapterMemberData;
  onBackToChapters: () => void;
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
}) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewModule />
            Referral Matrices
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Interactive matrices showing referral relationships between chapter members
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
            {/* Referral Matrix */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📊 Referral Matrix
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Shows who has given referrals to whom this month
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Matrix visualization will be implemented here
                </Typography>
              </Box>
            </Paper>

            {/* One-to-One Matrix */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                🤝 One-to-One Matrix
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tracks one-to-one meetings between members
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  OTO matrix visualization will be implemented here
                </Typography>
              </Box>
            </Paper>

            {/* Combination Matrix */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                🔄 Combination Matrix
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Combined view of referrals and one-to-ones
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Combination matrix visualization will be implemented here
                </Typography>
              </Box>
            </Paper>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUpload />
            Upload Palms Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload slip audit reports from PALMS for {chapterData.chapterName}
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, maxWidth: 600 }}>
            {/* Upload Section */}
            <Paper elevation={1} sx={{ p: 3, textAlign: 'center', border: '2px dashed', borderColor: 'grey.300' }}>
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drop PALMS Files Here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload Excel files exported from PALMS for monthly reporting
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: .xls, .xlsx
              </Typography>
            </Paper>

            {/* Instructions */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📋 Upload Instructions
              </Typography>
              <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
                <li>
                  <Typography variant="body2">
                    Export slip audit reports from PALMS system
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Ensure files contain member names and referral data
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Files will be processed automatically and added to monthly data
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Use "Previous Data" tab to view processed results
                  </Typography>
                </li>
              </Box>
            </Paper>

            {/* Recent Uploads */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📁 Recent Uploads
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No files uploaded yet for this chapter
              </Typography>
            </Paper>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People />
            Chapter Members
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            All {chapterData.memberCount} active members in {chapterData.chapterName}
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {chapterData.members.map((member, index) => (
              <Paper key={index} elevation={1} sx={{ p: 2 }}>
                <Typography variant="body1" fontWeight="medium">
                  {member}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Member
                </Typography>
              </Paper>
            ))}
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ChapterDetailPage;