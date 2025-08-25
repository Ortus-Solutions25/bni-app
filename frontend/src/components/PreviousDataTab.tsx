import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  CalendarMonth,
  TrendingUp,
  People,
  AttachMoney,
} from '@mui/icons-material';
import { ChapterMemberData } from '../services/ChapterDataLoader';

interface PreviousDataTabProps {
  chapterData: ChapterMemberData;
}

interface MonthlyData {
  month: string;
  year: number;
  totalReferrals: number;
  totalOTOs: number;
  totalTYFCB: number;
  memberCount: number;
  avgReferralsPerMember: number;
  avgOTOsPerMember: number;
  topPerformer: string;
}

const PreviousDataTab: React.FC<PreviousDataTabProps> = ({ chapterData }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Only August 2024 available - based on provided slip audit reports
  useEffect(() => {
    const months = [
      'August 2024'
    ];
    setAvailableMonths(months);
    setSelectedMonth(months[0]); // Default to August 2024 (only available month)
  }, []);

  // Load data for selected month
  useEffect(() => {
    if (selectedMonth && chapterData.chapterId) {
      setIsLoading(true);
      
      const fetchRealData = async () => {
        try {
          // Call the real backend API for chapter details
          const response = await fetch(`/api/chapters/${chapterData.chapterId}/`);
          
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Transform API data to our MonthlyData interface
          const realData: MonthlyData = {
            month: selectedMonth.split(' ')[0],
            year: parseInt(selectedMonth.split(' ')[1]),
            totalReferrals: data.total_referrals || 0,
            totalOTOs: data.total_otos || 0,
            totalTYFCB: data.total_tyfcb || 0,
            memberCount: data.member_count || 0,
            avgReferralsPerMember: data.avg_referrals_per_member || 0,
            avgOTOsPerMember: data.avg_otos_per_member || 0,
            topPerformer: data.top_performer || 'N/A'
          };
          
          setMonthlyData(realData);
          
        } catch (error) {
          console.error('Failed to load chapter details:', error);
          // Show error state
          setMonthlyData(null);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchRealData();
    }
  }, [selectedMonth, chapterData]);

  const handleMonthChange = (event: any) => {
    setSelectedMonth(event.target.value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarMonth />
        Previous Month Data
      </Typography>

      {/* Month Selection */}
      <Box sx={{ mb: 3, maxWidth: 300 }}>
        <FormControl fullWidth>
          <InputLabel>Select Month</InputLabel>
          <Select
            value={selectedMonth}
            label="Select Month"
            onChange={handleMonthChange}
          >
            {availableMonths.map((month) => (
              <MenuItem key={month} value={month}>
                {month}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading {selectedMonth} data...
          </Typography>
        </Box>
      )}

      {/* Monthly Data Display */}
      {!isLoading && monthlyData && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {chapterData.chapterName} - {monthlyData.month} {monthlyData.year}
            </Typography>
            <Chip 
              label={`${monthlyData.memberCount} members`} 
              color="primary" 
              variant="outlined" 
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            {/* Total Referrals */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {monthlyData.totalReferrals}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Referrals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg: {monthlyData.avgReferralsPerMember} per member
                </Typography>
              </CardContent>
            </Card>

            {/* Total OTOs */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <People color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {monthlyData.totalOTOs}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total One-to-Ones
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg: {monthlyData.avgOTOsPerMember} per member
                </Typography>
              </CardContent>
            </Card>

            {/* Total TYFCB */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {formatCurrency(monthlyData.totalTYFCB)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total TYFCB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Thank You For Closed Business
                </Typography>
              </CardContent>
            </Card>

            {/* Top Performer */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div" sx={{ fontSize: '0.9rem' }}>
                    {monthlyData.topPerformer}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Top Performer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Most referrals this month
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Additional Info */}
          <Box sx={{ mt: 4 }}>
            <Alert severity="info">
              This data is based on the August 2024 PALMS slip audit reports that were provided. 
              Use the "Upload Palms Data" tab to add reports for additional months.
            </Alert>
          </Box>
        </Box>
      )}

      {/* No Data State */}
      {!isLoading && !monthlyData && (
        <Alert severity="warning">
          No data available. Currently only August 2024 PALMS reports have been provided. 
          Use the "Upload Palms Data" tab to add reports for additional months.
        </Alert>
      )}
    </Box>
  );
};

export default PreviousDataTab;