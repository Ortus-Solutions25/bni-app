import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ViewModule,
  TrendingUp,
  People,
  MergeType,
} from '@mui/icons-material';
import { ChapterMemberData } from '../services/ChapterDataLoader';

interface MatrixTabProps {
  chapterData: ChapterMemberData;
}

interface MatrixData {
  members: string[];
  matrix: number[][];
  totals?: {
    given?: Record<string, number>;
    received?: Record<string, number>;
  };
  legend?: Record<string, string>;
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
      id={`matrix-tabpanel-${index}`}
      aria-labelledby={`matrix-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `matrix-tab-${index}`,
    'aria-controls': `matrix-tabpanel-${index}`,
  };
}

const MatrixTab: React.FC<MatrixTabProps> = ({ chapterData }) => {
  const [tabValue, setTabValue] = useState(0);
  const [referralMatrix, setReferralMatrix] = useState<MatrixData | null>(null);
  const [oneToOneMatrix, setOneToOneMatrix] = useState<MatrixData | null>(null);
  const [combinationMatrix, setCombinationMatrix] = useState<MatrixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatrices = async () => {
      if (!chapterData.chapterId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all three matrices in parallel
        const [referralRes, otoRes, combinationRes] = await Promise.all([
          fetch(`/api/chapters/${chapterData.chapterId}/referral-matrix/`),
          fetch(`/api/chapters/${chapterData.chapterId}/one-to-one-matrix/`),
          fetch(`/api/chapters/${chapterData.chapterId}/combination-matrix/`)
        ]);

        if (!referralRes.ok || !otoRes.ok || !combinationRes.ok) {
          throw new Error('Failed to fetch matrix data');
        }

        const [referralData, otoData, combinationData] = await Promise.all([
          referralRes.json(),
          otoRes.json(),
          combinationRes.json()
        ]);

        setReferralMatrix(referralData);
        setOneToOneMatrix(otoData);
        setCombinationMatrix(combinationData);

      } catch (error) {
        console.error('Failed to load matrices:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMatrices();
  }, [chapterData.chapterId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderMatrix = (matrixData: MatrixData | null, title: string, description: string) => {
    if (!matrixData) {
      return (
        <Alert severity="warning">
          No data available for {title.toLowerCase()}
        </Alert>
      );
    }

    const { members, matrix, totals, legend } = matrixData;
    const hasData = matrix.some(row => row.some(cell => cell > 0));

    if (!hasData) {
      return (
        <Alert severity="info">
          No {title.toLowerCase()} data available for this chapter yet. 
          Data will appear after importing PALMS reports.
        </Alert>
      );
    }

    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>

        {/* Legend for combination matrix */}
        {legend && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Legend:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(legend).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Matrix Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>From / To</TableCell>
                {members.map((member, index) => (
                  <TableCell 
                    key={index} 
                    sx={{ 
                      writingMode: 'vertical-rl', 
                      textOrientation: 'mixed',
                      minWidth: 40,
                      maxWidth: 40,
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    <Tooltip title={member}>
                      <span>{member.split(' ').map(n => n[0]).join('')}</span>
                    </Tooltip>
                  </TableCell>
                ))}
                {totals?.given && (
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 60 }}>
                    Total Given
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((giver, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                    <Tooltip title={giver}>
                      <span>{giver}</span>
                    </Tooltip>
                  </TableCell>
                  {members.map((receiver, j) => (
                    <TableCell 
                      key={j}
                      sx={{ 
                        textAlign: 'center',
                        backgroundColor: matrix[i][j] > 0 ? 'primary.light' : 'transparent',
                        color: matrix[i][j] > 0 ? 'primary.contrastText' : 'text.primary',
                        fontWeight: matrix[i][j] > 0 ? 'bold' : 'normal'
                      }}
                    >
                      {matrix[i][j] || '-'}
                    </TableCell>
                  ))}
                  {totals?.given && (
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                      {totals.given[giver] || 0}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* Totals received row */}
              {totals?.received && (
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Received</TableCell>
                  {members.map((member, i) => (
                    <TableCell key={i} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                      {totals.received?.[member] || 0}
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading matrices...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load matrices: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ViewModule />
        Referral Matrices
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Interactive matrices showing relationships between chapter members for {chapterData.chapterName}
      </Typography>

      {/* Matrix Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="matrix tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Referral Matrix" 
            icon={<TrendingUp />} 
            iconPosition="start"
            {...a11yProps(0)} 
          />
          <Tab 
            label="One-to-One Matrix" 
            icon={<People />} 
            iconPosition="start"
            {...a11yProps(1)} 
          />
          <Tab 
            label="Combination Matrix" 
            icon={<MergeType />} 
            iconPosition="start"
            {...a11yProps(2)} 
          />
        </Tabs>
      </Box>

      {/* Matrix Content */}
      <TabPanel value={tabValue} index={0}>
        {renderMatrix(
          referralMatrix,
          "Referral Matrix",
          "Shows who has given referrals to whom. Numbers represent the count of referrals given."
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderMatrix(
          oneToOneMatrix,
          "One-to-One Matrix", 
          "Tracks one-to-one meetings between members. Numbers represent the count of meetings."
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderMatrix(
          combinationMatrix,
          "Combination Matrix",
          "Combined view showing both referrals and one-to-ones using coded values."
        )}
      </TabPanel>
    </Box>
  );
};

export default MatrixTab;