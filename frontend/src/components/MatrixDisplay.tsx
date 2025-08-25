import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
} from '@mui/material';

interface MatrixData {
  members: string[];
  matrix: number[][];
  totals?: {
    given?: { [key: string]: number };
    received?: { [key: string]: number };
  };
  legend?: {
    [key: string]: string;
  };
}

interface MatrixDisplayProps {
  chapterId: number;
}

type MatrixType = 'referral' | 'one-to-one' | 'combination';

export const MatrixDisplay: React.FC<MatrixDisplayProps> = ({ chapterId }) => {
  const [matrixType, setMatrixType] = useState<MatrixType>('referral');
  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatrix = async (type: MatrixType) => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = {
        referral: 'referral-matrix',
        'one-to-one': 'one-to-one-matrix',
        combination: 'combination-matrix',
      }[type];

      const response = await fetch(`http://localhost:8000/api/chapters/${chapterId}/${endpoint}/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} matrix`);
      }

      const matrixData = await response.json();
      setData(matrixData);
    } catch (err) {
      setError((err as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix(matrixType);
  }, [matrixType, chapterId]);

  const handleMatrixTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: MatrixType,
  ) => {
    if (newType !== null) {
      setMatrixType(newType);
    }
  };

  const getCellColor = (value: number, type: MatrixType) => {
    if (value === 0) return 'transparent';
    
    if (type === 'combination') {
      const colors = {
        1: '#FFF3CD', // OTO only - yellow
        2: '#D1ECF1', // Referral only - blue  
        3: '#D4EDDA', // Both - green
      };
      return colors[value as keyof typeof colors] || 'transparent';
    }
    
    // For referral and one-to-one matrices, use intensity-based coloring
    const intensity = Math.min(value / 3, 1); // Normalize to 0-1
    return `rgba(25, 118, 210, ${0.1 + intensity * 0.3})`;
  };

  const getCellText = (value: number, type: MatrixType) => {
    if (type === 'combination' && data?.legend) {
      return data.legend[value.toString()] || value.toString();
    }
    return value === 0 ? '' : value.toString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading matrix: {error}
      </Alert>
    );
  }

  if (!data || data.members.length === 0) {
    return (
      <Alert severity="info">
        No data available. Please upload a file first or add members to the chapter.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Chapter Analytics Matrix
        </Typography>
        
        <ToggleButtonGroup
          value={matrixType}
          exclusive
          onChange={handleMatrixTypeChange}
          aria-label="matrix type"
        >
          <ToggleButton value="referral" aria-label="referral matrix">
            Referrals
          </ToggleButton>
          <ToggleButton value="one-to-one" aria-label="one-to-one matrix">
            One-to-Ones
          </ToggleButton>
          <ToggleButton value="combination" aria-label="combination matrix">
            Combined
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {matrixType === 'combination' && data.legend && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Legend
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(data.legend).map(([key, value]) => (
                <Chip
                  key={key}
                  label={value}
                  sx={{
                    bgcolor: getCellColor(parseInt(key), 'combination'),
                    border: '1px solid #ccc',
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  bgcolor: 'primary.light',
                  minWidth: 120 
                }}
              >
                {matrixType === 'referral' ? 'Giver \\ Receiver' : 
                 matrixType === 'one-to-one' ? 'Member 1 \\ Member 2' : 
                 'Member Relationships'}
              </TableCell>
              {data.members.map((member, index) => (
                <TableCell 
                  key={index}
                  sx={{ 
                    fontWeight: 'bold',
                    bgcolor: 'primary.light',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    minWidth: 40,
                    maxWidth: 60,
                    fontSize: '0.75rem'
                  }}
                >
                  {member}
                </TableCell>
              ))}
              {data.totals?.given && (
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold',
                    bgcolor: 'secondary.light',
                    minWidth: 60
                  }}
                >
                  Total
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.members.map((member, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold',
                    bgcolor: 'primary.light',
                    fontSize: '0.875rem'
                  }}
                >
                  {member}
                </TableCell>
                {data.matrix[rowIndex].map((value, colIndex) => (
                  <TableCell
                    key={colIndex}
                    align="center"
                    sx={{
                      bgcolor: rowIndex === colIndex ? 'grey.200' : getCellColor(value, matrixType),
                      fontWeight: value > 0 ? 'bold' : 'normal',
                      fontSize: '0.875rem',
                    }}
                  >
                    {rowIndex === colIndex ? '—' : getCellText(value, matrixType)}
                  </TableCell>
                ))}
                {data.totals?.given && (
                  <TableCell
                    align="center"
                    sx={{ 
                      bgcolor: 'secondary.light',
                      fontWeight: 'bold'
                    }}
                  >
                    {data.totals.given[member] || 0}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {data.totals?.received && (
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1">
            Summary Stats:
          </Typography>
          <Chip
            label={`Total Given: ${Object.values(data.totals.given || {}).reduce((a, b) => a + b, 0)}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`Total Received: ${Object.values(data.totals.received).reduce((a, b) => a + b, 0)}`}
            color="secondary"
            variant="outlined"
          />
          <Chip
            label={`Active Members: ${data.members.length}`}
            color="info"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
};