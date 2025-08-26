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
  Button,
  IconButton,
} from '@mui/material';
import {
  CalendarMonth,
  TrendingUp,
  People,
  AttachMoney,
  Delete,
  Refresh,
} from '@mui/icons-material';
import { ChapterMemberData, MonthlyReport, loadMonthlyReports, deleteMonthlyReport } from '../services/ChapterDataLoader';

interface PreviousDataTabProps {
  chapterData: ChapterMemberData;
}

const PreviousDataTab: React.FC<PreviousDataTabProps> = ({ chapterData }) => {
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load monthly reports when component mounts
  const loadReports = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chapterData.chapterId) {
      loadReports();
    }
  }, [chapterData.chapterId]);

  const handleReportChange = (event: any) => {
    const reportId = event.target.value;
    const report = monthlyReports.find(r => r.id === reportId);
    setSelectedReport(report || null);
  };

  const handleDeleteReport = async (reportToDelete: MonthlyReport) => {
    if (!window.confirm(`Are you sure you want to delete the ${reportToDelete.month_year} report?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMonthlyReport(chapterData.chapterId, reportToDelete.id);
      
      // Reload reports after deletion
      await loadReports();
      
      // Clear selection if the deleted report was selected
      if (selectedReport?.id === reportToDelete.id) {
        setSelectedReport(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonth />
          Monthly Reports
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={loadReports}
          disabled={isLoading}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
                      {report.has_referral_matrix && <Chip label="Referrals" size="small" />}
                      {report.has_oto_matrix && <Chip label="OTOs" size="small" />}
                      {report.has_combination_matrix && <Chip label="Combined" size="small" />}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading monthly reports...
          </Typography>
        </Box>
      )}

      {/* Selected Report Display */}
      {!isLoading && selectedReport && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {chapterData.chapterName} - {selectedReport.month_year}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  label={`Uploaded: ${new Date(selectedReport.uploaded_at).toLocaleDateString()}`}
                  size="small"
                  variant="outlined"
                />
                {selectedReport.processed_at && (
                  <Chip 
                    label={`Processed: ${new Date(selectedReport.processed_at).toLocaleDateString()}`}
                    size="small"
                    color="success"
                  />
                )}
              </Box>
            </Box>
            
            <IconButton
              color="error"
              onClick={() => handleDeleteReport(selectedReport)}
              disabled={isDeleting}
              title="Delete this report"
            >
              <Delete />
            </IconButton>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {/* Report Files */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Files
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Slip Audit: {selectedReport.slip_audit_file ? '✅ Uploaded' : '❌ Missing'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Member Names: {selectedReport.member_names_file ? '✅ Uploaded' : '❌ Not provided'}
                </Typography>
              </CardContent>
            </Card>

            {/* Matrix Data Status */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Processed Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Referral Matrix: {selectedReport.has_referral_matrix ? '✅ Available' : '❌ Not processed'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  One-to-One Matrix: {selectedReport.has_oto_matrix ? '✅ Available' : '❌ Not processed'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Combination Matrix: {selectedReport.has_combination_matrix ? '✅ Available' : '❌ Not processed'}
                </Typography>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Use the "Matrices" tab to view detailed referral and OTO data for this month.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use the "Members" tab to see individual member performance and missing connections.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Processing Status Alert */}
          {selectedReport.processed_at ? (
            <Box sx={{ mt: 4 }}>
              <Alert severity="success">
                This report has been successfully processed and matrix data is available in the "Matrices" tab.
              </Alert>
            </Box>
          ) : (
            <Box sx={{ mt: 4 }}>
              <Alert severity="warning">
                This report is still being processed. Matrix data will be available once processing is complete.
              </Alert>
            </Box>
          )}
        </Box>
      )}

      {/* No Reports State */}
      {!isLoading && monthlyReports.length === 0 && !error && (
        <Alert severity="info">
          No monthly reports have been uploaded yet for {chapterData.chapterName}. 
          Use the "Upload Palms Data" tab to upload PALMS slip audit reports.
        </Alert>
      )}
    </Box>
  );
};

export default PreviousDataTab;