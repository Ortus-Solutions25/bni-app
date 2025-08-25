import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  GetApp,
  Search,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MatrixVisualization: React.FC<{ data?: MatrixData }> = ({ data }) => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);

  // Mock data for demonstration
  const mockData: MatrixData = {
    members: [
      'John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Williams', 'Charlie Brown',
      'Diana Prince', 'Edward Norton', 'Fiona Apple', 'George Harris', 'Helen Troy'
    ],
    referralMatrix: [
      [0, 2, 1, 0, 3, 1, 0, 2, 1, 0],
      [1, 0, 2, 1, 0, 2, 1, 0, 1, 2],
      [0, 1, 0, 3, 1, 0, 2, 1, 0, 1],
      [2, 0, 1, 0, 2, 1, 0, 3, 1, 0],
      [1, 2, 0, 1, 0, 3, 1, 0, 2, 1],
      [0, 1, 2, 0, 1, 0, 2, 1, 0, 3],
      [3, 0, 1, 2, 0, 1, 0, 2, 1, 0],
      [1, 2, 0, 1, 3, 0, 1, 0, 2, 1],
      [0, 1, 3, 0, 1, 2, 0, 1, 0, 2],
      [2, 0, 1, 2, 0, 1, 3, 0, 1, 0]
    ],
    oneToOneMatrix: [
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0]
    ],
    combinationMatrix: [
      [0, 3, 3, 0, 3, 3, 0, 3, 3, 0],
      [3, 0, 3, 3, 0, 3, 3, 0, 3, 3],
      [1, 3, 0, 3, 3, 0, 3, 3, 0, 3],
      [2, 1, 3, 0, 3, 3, 0, 3, 3, 0],
      [3, 2, 1, 3, 0, 3, 3, 0, 3, 3],
      [1, 3, 2, 1, 3, 0, 3, 3, 0, 3],
      [2, 1, 3, 2, 1, 3, 0, 3, 3, 0],
      [3, 2, 1, 3, 3, 1, 3, 0, 3, 3],
      [1, 3, 3, 1, 3, 3, 1, 3, 0, 3],
      [2, 1, 3, 3, 1, 3, 3, 1, 3, 0]
    ],
    tyfcbSummary: {
      withinChapter: [
        { member: 'John Smith', amount: 25000, count: 8 },
        { member: 'Jane Doe', amount: 18000, count: 5 },
        { member: 'Bob Johnson', amount: 32000, count: 10 },
        { member: 'Alice Williams', amount: 21000, count: 6 },
        { member: 'Charlie Brown', amount: 15000, count: 4 }
      ],
      outsideChapter: [
        { member: 'John Smith', amount: 45000, count: 3 },
        { member: 'Diana Prince', amount: 68000, count: 4 },
        { member: 'Bob Johnson', amount: 52000, count: 2 },
        { member: 'Edward Norton', amount: 39000, count: 2 }
      ],
      totalWithinChapter: 111000,
      totalOutsideChapter: 204000
    }
  };

  // Only use mock data if no real data is provided (for standalone tab demonstration)
  const matrixData = data || mockData;
  const isUsingRealData = !!data;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getCellColor = (value: number, type: 'referral' | 'onetoone' | 'combination') => {
    if (type === 'referral') {
      if (value === 0) return 'transparent';
      if (value === 1) return '#e3f2fd';
      if (value === 2) return '#90caf9';
      if (value >= 3) return '#1976d2';
    } else if (type === 'onetoone') {
      return value === 1 ? '#4caf50' : 'transparent';
    } else if (type === 'combination') {
      // 0=Neither, 1=OTO only, 2=Referral only, 3=Both
      if (value === 0) return 'transparent';
      if (value === 1) return '#fff3e0'; // OTO only - orange
      if (value === 2) return '#e3f2fd'; // Referral only - blue
      if (value === 3) return '#4caf50'; // Both - green
    }
    return 'transparent';
  };

  const getCombinationLabel = (value: number) => {
    switch (value) {
      case 0: return '';
      case 1: return 'O'; // OTO only
      case 2: return 'R'; // Referral only
      case 3: return 'B'; // Both
      default: return '';
    }
  };

  const filteredMembers = matrixData.members.filter(member =>
    member.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIndices = matrixData.members
    .map((member, index) => ({ member, index }))
    .filter(item => item.member.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(item => item.index);

  const renderMatrix = (matrix: number[][], type: 'referral' | 'onetoone' | 'combination') => {
    // Calculate compact column widths - much smaller than before
    const getColumnWidth = (memberName: string) => {
      const baseWidth = 45; // Smaller base width
      const maxWidth = 80; // Maximum width to prevent excessive spreading
      const charWidth = 3; // Much smaller per-character width
      return Math.min(maxWidth, Math.max(baseWidth, memberName.length * charWidth));
    };

    const maxNameLength = Math.max(...filteredMembers.map(name => name.length));
    const headerHeight = Math.min(120, Math.max(80, maxNameLength * 4)); // Smaller height with max limit

    return (
      <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
        <Table stickyHeader size="small" sx={{ transform: `scale(${zoom})`, transformOrigin: 'top left', tableLayout: 'auto' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                backgroundColor: '#f5f5f5', 
                fontWeight: 'bold', 
                minWidth: 120,
                maxWidth: 200,
                position: 'sticky',
                left: 0,
                zIndex: 3,
                padding: '8px'
              }}>
                From / To
              </TableCell>
              {filteredMembers.map((member) => (
                <TableCell 
                  key={member} 
                  align="center" 
                  sx={{ 
                    backgroundColor: '#f5f5f5', 
                    fontWeight: 'bold',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    width: getColumnWidth(member),
                    minWidth: getColumnWidth(member),
                    maxWidth: getColumnWidth(member),
                    height: headerHeight,
                    padding: '4px 2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    fontSize: '0.75rem',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {member}
                </TableCell>
              ))}
              <TableCell sx={{ 
                backgroundColor: '#f5f5f5', 
                fontWeight: 'bold',
                minWidth: 100,
                position: 'sticky',
                right: 0,
                zIndex: 3
              }}>
                Total Given
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredIndices.map((rowIndex) => {
              const rowTotal = filteredIndices.reduce((sum, colIndex) => 
                sum + (matrix[rowIndex]?.[colIndex] || 0), 0
              );
              
              return (
                <TableRow key={rowIndex}>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    backgroundColor: '#f5f5f5',
                    minWidth: 120,
                    maxWidth: 200,
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    padding: '4px 8px',
                    fontSize: '0.8rem'
                  }}>
                    {matrixData.members[rowIndex]}
                  </TableCell>
                  {filteredIndices.map((colIndex) => {
                    const value = matrix[rowIndex]?.[colIndex] || 0;
                    const isdiagonal = rowIndex === colIndex;
                    const memberName = matrixData.members[colIndex];
                    
                    return (
                      <TableCell 
                        key={colIndex}
                        align="center"
                        sx={{ 
                          backgroundColor: isdiagonal ? '#e0e0e0' : getCellColor(value, type),
                          color: value > 0 ? '#000' : '#999',
                          fontWeight: value > 0 ? 'bold' : 'normal',
                          border: '1px solid #e0e0e0',
                          padding: '4px 2px',
                          width: getColumnWidth(memberName),
                          minWidth: getColumnWidth(memberName),
                          maxWidth: getColumnWidth(memberName),
                          textAlign: 'center',
                          fontSize: '0.8rem'
                        }}
                      >
                        <Tooltip title={
                          type === 'combination' 
                            ? `${matrixData.members[rowIndex]} → ${matrixData.members[colIndex]}: ${getCombinationLabel(value)}`
                            : `${matrixData.members[rowIndex]} → ${matrixData.members[colIndex]}: ${value}`
                        }>
                          <span>
                            {type === 'combination' ? getCombinationLabel(value) : (value || '')}
                          </span>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    backgroundColor: '#e8f5e9',
                    position: 'sticky',
                    right: 0,
                    zIndex: 2,
                    minWidth: 100,
                    textAlign: 'center'
                  }}>
                    {rowTotal}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell sx={{ 
                fontWeight: 'bold', 
                backgroundColor: '#f5f5f5',
                minWidth: 120,
                maxWidth: 200,
                position: 'sticky',
                left: 0,
                zIndex: 2,
                padding: '4px 8px',
                fontSize: '0.8rem'
              }}>
                Total Received
              </TableCell>
              {filteredIndices.map((colIndex) => {
                const colTotal = filteredIndices.reduce((sum, rowIndex) => 
                  sum + (matrix[rowIndex]?.[colIndex] || 0), 0
                );
                const memberName = matrixData.members[colIndex];
                
                return (
                  <TableCell 
                    key={colIndex}
                    align="center"
                    sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: '#e8f5e9',
                      width: getColumnWidth(memberName),
                      minWidth: getColumnWidth(memberName),
                      maxWidth: getColumnWidth(memberName),
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      padding: '4px 2px'
                    }}
                  >
                    {colTotal}
                  </TableCell>
                );
              })}
              <TableCell sx={{ 
                backgroundColor: '#f5f5f5',
                position: 'sticky',
                right: 0,
                zIndex: 2,
                minWidth: 100
              }} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderTYFCBSummary = () => {
    if (!matrixData.tyfcbSummary) return null;
    
    return (
      <Box>
        {/* Summary Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, flex: 1, minWidth: 250, bgcolor: '#e3f2fd' }}>
            <Typography variant="h6" color="primary">Within Chapter Business</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              AED {matrixData.tyfcbSummary.totalWithinChapter.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Business from internal chapter referrals
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 250, bgcolor: '#e8f5e9' }}>
            <Typography variant="h6" color="success.main">Outside Chapter Business</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              AED {matrixData.tyfcbSummary.totalOutsideChapter.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Business from external referrals
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 250, bgcolor: '#fff3e0' }}>
            <Typography variant="h6" color="warning.main">Total Business</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              AED {(matrixData.tyfcbSummary.totalWithinChapter + matrixData.tyfcbSummary.totalOutsideChapter).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Combined chapter business
            </Typography>
          </Paper>
        </Box>

        {/* Within Chapter Table */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          📊 Within Chapter Business (Empty Details)
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Count</TableCell>
                <TableCell align="right">Average</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matrixData.tyfcbSummary.withinChapter
                ?.filter(item => item.member.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => b.amount - a.amount)
                .map((item) => (
                  <TableRow key={`within-${item.member}`}>
                    <TableCell>{item.member}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`AED ${item.amount.toLocaleString()}`}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{item.count}</TableCell>
                    <TableCell align="right">
                      AED {Math.round(item.amount / item.count).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Outside Chapter Table */}
        <Typography variant="h6" gutterBottom>
          🌍 Outside Chapter Business (Has Details)
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Count</TableCell>
                <TableCell align="right">Average</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matrixData.tyfcbSummary.outsideChapter
                ?.filter(item => item.member.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => b.amount - a.amount)
                .map((item) => (
                  <TableRow key={`outside-${item.member}`}>
                    <TableCell>{item.member}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`AED ${item.amount.toLocaleString()}`}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{item.count}</TableCell>
                    <TableCell align="right">
                      AED {Math.round(item.amount / item.count).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box>
      {!isUsingRealData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No matrix data available yet. Upload files and generate reports first to see real analysis results.
          Showing sample data for demonstration.
        </Alert>
      )}
      
      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            📊 Analysis Matrices {isUsingRealData ? '(Real Data)' : '(Sample Data)'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton 
              size="small" 
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              title="Zoom out"
            >
              <ZoomOut />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              title="Zoom in"
            >
              <ZoomIn />
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              startIcon={<GetApp />}
            >
              Export All
            </Button>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="matrix tabs">
            <Tab label="Referral Matrix" />
            <Tab label="One-to-One Matrix" />
            <Tab label="Combination Matrix" />
            <Tab label="TYFCB Summary" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info">
              Shows the number of referrals given from each member (rows) to other members (columns).
              Darker blue indicates more referrals.
            </Alert>
          </Box>
          {matrixData.referralMatrix && renderMatrix(matrixData.referralMatrix, 'referral')}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info">
              Shows completed one-to-one meetings between members. Green indicates a completed meeting.
            </Alert>
          </Box>
          {matrixData.oneToOneMatrix && renderMatrix(matrixData.oneToOneMatrix, 'onetoone')}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info">
              Combined view: O = One-to-One only, R = Referral only, B = Both
            </Alert>
          </Box>
          {matrixData.combinationMatrix && renderMatrix(matrixData.combinationMatrix, 'combination')}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info">
              TYFCB Summary: <strong>Within Chapter</strong> (empty details tab) vs <strong>Outside Chapter</strong> (has details). 
              This differentiates internal chapter referrals from external business referrals.
            </Alert>
          </Box>
          {renderTYFCBSummary()}
        </TabPanel>
      </Paper>

      {/* Legend */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          📖 Legend
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>Referral Matrix Colors:</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#e3f2fd', border: '1px solid #ccc' }} />
              <Typography variant="body2">1 referral</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#90caf9', border: '1px solid #ccc' }} />
              <Typography variant="body2">2 referrals</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#1976d2', border: '1px solid #ccc' }} />
              <Typography variant="body2">3+ referrals</Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>Combination Matrix:</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label="O" size="small" sx={{ backgroundColor: '#fff3e0' }} />
              <Typography variant="body2">One-to-One only</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label="R" size="small" sx={{ backgroundColor: '#e3f2fd' }} />
              <Typography variant="body2">Referral only</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label="B" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
              <Typography variant="body2">Both</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default MatrixVisualization;