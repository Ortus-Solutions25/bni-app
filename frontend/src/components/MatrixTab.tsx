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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ViewModule,
  TrendingUp,
  People,
  MergeType,
  AttachMoney,
} from '@mui/icons-material';
import { ChapterMemberData, MonthlyReport, loadMonthlyReports, loadMatrixData } from '../services/ChapterDataLoader';

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

interface TYFCBData {
  inside: {
    total_amount: number;
    count: number;
    by_member: Record<string, number>;
  };
  outside: {
    total_amount: number;
    count: number;
    by_member: Record<string, number>;
  };
  month_year: string;
  processed_at: string;
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
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [referralMatrix, setReferralMatrix] = useState<MatrixData | null>(null);
  const [oneToOneMatrix, setOneToOneMatrix] = useState<MatrixData | null>(null);
  const [combinationMatrix, setCombinationMatrix] = useState<MatrixData | null>(null);
  const [tyfcbData, setTyfcbData] = useState<TYFCBData | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isLoadingMatrices, setIsLoadingMatrices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load monthly reports when component mounts
  useEffect(() => {
    const loadReports = async () => {
      if (!chapterData.chapterId) return;
      
      setIsLoadingReports(true);
      setError(null);
      
      try {
        const reports = await loadMonthlyReports(chapterData.chapterId);
        setMonthlyReports(reports);
        
        // Select the most recent report by default
        if (reports.length > 0) {
          setSelectedReport(reports[0]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load monthly reports');
      } finally {
        setIsLoadingReports(false);
      }
    };
    
    loadReports();
  }, [chapterData.chapterId]);

  // Load matrices when a report is selected
  useEffect(() => {
    const fetchMatrices = async () => {
      if (!selectedReport || !chapterData.chapterId) return;
      
      setIsLoadingMatrices(true);
      setError(null);
      
      // Clear previous matrices
      setReferralMatrix(null);
      setOneToOneMatrix(null);
      setCombinationMatrix(null);
      setTyfcbData(null);
      
      try {
        // Only load matrices that are available for this report
        const promises = [];
        
        if (selectedReport.has_referral_matrix) {
          promises.push(loadMatrixData(chapterData.chapterId, selectedReport.id, 'referral-matrix'));
        } else {
          promises.push(Promise.resolve(null));
        }
        
        if (selectedReport.has_oto_matrix) {
          promises.push(loadMatrixData(chapterData.chapterId, selectedReport.id, 'one-to-one-matrix'));
        } else {
          promises.push(Promise.resolve(null));
        }
        
        if (selectedReport.has_combination_matrix) {
          promises.push(loadMatrixData(chapterData.chapterId, selectedReport.id, 'combination-matrix'));
        } else {
          promises.push(Promise.resolve(null));
        }

        // Always try to load TYFCB data
        promises.push(
          fetch(`/api/chapters/${chapterData.chapterId}/reports/${selectedReport.id}/tyfcb-data/`)
            .then(response => response.json())
            .catch(() => null)
        );

        const [referralData, otoData, combinationData, tyfcbDataResponse] = await Promise.all(promises);

        setReferralMatrix(referralData);
        setOneToOneMatrix(otoData);
        setCombinationMatrix(combinationData);
        setTyfcbData(tyfcbDataResponse);

      } catch (error) {
        console.error('Failed to load matrices:', error);
        setError(error instanceof Error ? error.message : 'Failed to load matrix data');
      } finally {
        setIsLoadingMatrices(false);
      }
    };
    
    if (selectedReport) {
      fetchMatrices();
    }
  }, [selectedReport, chapterData.chapterId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleReportChange = (event: any) => {
    const reportId = event.target.value;
    const report = monthlyReports.find(r => r.id === reportId);
    setSelectedReport(report || null);
  };

  const renderTYFCBReport = (tyfcbData: TYFCBData | null) => {
    if (!tyfcbData) {
      return (
        <Alert severity="warning">
          No TYFCB data available for this report
        </Alert>
      );
    }

    const { inside, outside } = tyfcbData;
    const totalAmount = inside.total_amount + outside.total_amount;
    const totalTransactions = inside.count + outside.count;

    // Get top performers for inside and outside
    const topInsideMembers = Object.entries(inside.by_member)
      .filter(([_, amount]) => amount > 0)
      .sort(([_a, amountA], [_b, amountB]) => amountB - amountA)
      .slice(0, 10);

    const topOutsideMembers = Object.entries(outside.by_member)
      .filter(([_, amount]) => amount > 0)
      .sort(([_a, amountA], [_b, amountB]) => amountB - amountA)
      .slice(0, 10);

    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Thank You For Closed Business (TYFCB) report showing business closed through referrals
        </Typography>

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Total TYFCB
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              AED {totalAmount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalTransactions} transactions
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Inside Chapter
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              AED {inside.total_amount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {inside.count} transactions
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Outside Chapter
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              AED {outside.total_amount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {outside.count} transactions
            </Typography>
          </Paper>
        </Box>

        {/* Top Performers Tables */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
          {/* Inside Chapter Top Performers */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Top Inside Chapter TYFCB
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topInsideMembers.map(([member, amount], index) => (
                    <TableRow key={member} hover>
                      <TableCell>{member}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                        AED {amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {topInsideMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ color: 'text.secondary' }}>
                        No inside chapter TYFCB data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Outside Chapter Top Performers */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Top Outside Chapter TYFCB
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topOutsideMembers.map(([member, amount], index) => (
                    <TableRow key={member} hover>
                      <TableCell>{member}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                        AED {amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {topOutsideMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ color: 'text.secondary' }}>
                        No outside chapter TYFCB data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    );
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

  if (isLoadingReports) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading monthly reports...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ViewModule />
        Matrices & Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Interactive matrices and TYFCB reports showing relationships and business results for {chapterData.chapterName}
      </Typography>

      {/* Report Selection */}
      {monthlyReports.length > 0 && (
        <Box sx={{ mb: 3, maxWidth: 400 }}>
          <FormControl fullWidth>
            <InputLabel>Select Monthly Report</InputLabel>
            <Select
              value={selectedReport?.id || ''}
              label="Select Monthly Report"
              onChange={handleReportChange}
            >
              {monthlyReports.map((report) => (
                <MenuItem key={report.id} value={report.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>{report.month_year}</span>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {report.has_referral_matrix && <Chip label="Ref" size="small" />}
                      {report.has_oto_matrix && <Chip label="OTO" size="small" />}
                      {report.has_combination_matrix && <Chip label="Combo" size="small" />}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* No Reports State */}
      {monthlyReports.length === 0 && (
        <Alert severity="info">
          No monthly reports have been uploaded yet for {chapterData.chapterName}. 
          Use the "Upload Palms Data" tab to upload PALMS slip audit reports.
        </Alert>
      )}

      {/* Loading Matrices */}
      {isLoadingMatrices && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading matrices for {selectedReport?.month_year}...
          </Typography>
        </Box>
      )}

      {/* Matrix Content - only show if we have a selected report and not loading */}
      {selectedReport && !isLoadingMatrices && monthlyReports.length > 0 && (
        <Box>
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
              <Tab 
                label="TYFCB Report" 
                icon={<AttachMoney />} 
                iconPosition="start"
                {...a11yProps(3)} 
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

          <TabPanel value={tabValue} index={3}>
            {renderTYFCBReport(tyfcbData)}
          </TabPanel>
        </Box>
      )}
    </Box>
  );
};

export default MatrixTab;