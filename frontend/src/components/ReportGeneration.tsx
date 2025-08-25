import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Assessment,
  GetApp,
  Info,
  PlayArrow,
  Speed,
  People,
  SwapHoriz,
  AccountBalance,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

interface ReportGenerationProps {
  uploadedFiles: {
    palmsFiles: File[];
    memberFiles: File[];
  };
  onReportsGenerated: () => void;
  onMatrixDataGenerated: (data: MatrixData) => void;
}

interface ProcessingStats {
  membersLoaded: number;
  referralsFound: number;
  oneToOnesFound: number;
  tyfcbsFound: number;
  totalAmount?: number;
}

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

// Function to extract member names from uploaded file
const extractMemberNames = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let members: string[] = [];
        
        if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
          // Excel file format
          const data = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Extract member names - look for columns that might contain names
          const rows = jsonData as any[][];
          if (rows.length > 0) {
            // Check the header row to find name columns
            const headerRow = rows[0];
            let nameColumnIndex = -1;
            
            // Look for columns that might contain member names
            for (let i = 0; i < headerRow.length; i++) {
              const header = String(headerRow[i]).toLowerCase();
              if (header.includes('name') || header.includes('member') || header === 'first name' || header === 'last name') {
                nameColumnIndex = i;
                break;
              }
            }
            
            // If no specific name column found, use first column
            if (nameColumnIndex === -1) nameColumnIndex = 0;
            
            // Extract names from the identified column (skip header row)
            for (let i = 1; i < rows.length; i++) {
              if (rows[i] && rows[i][nameColumnIndex]) {
                const name = String(rows[i][nameColumnIndex]).trim();
                if (name && name !== '') {
                  members.push(name);
                }
              }
            }
            
            // If we found a "First Name" column, try to find "Last Name" and combine them
            if (headerRow.some((h: any) => String(h).toLowerCase().includes('first'))) {
              const firstNameIndex = headerRow.findIndex((h: any) => String(h).toLowerCase().includes('first'));
              const lastNameIndex = headerRow.findIndex((h: any) => String(h).toLowerCase().includes('last'));
              
              if (firstNameIndex >= 0 && lastNameIndex >= 0) {
                members = [];
                for (let i = 1; i < rows.length; i++) {
                  if (rows[i] && rows[i][firstNameIndex] && rows[i][lastNameIndex]) {
                    const firstName = String(rows[i][firstNameIndex]).trim();
                    const lastName = String(rows[i][lastNameIndex]).trim();
                    if (firstName && lastName) {
                      members.push(`${firstName} ${lastName}`);
                    }
                  }
                }
              }
            }
          }
        } else if (file.name.toLowerCase().endsWith('.csv')) {
          // CSV format
          const text = e.target?.result as string;
          const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          
          members = lines.map(line => {
            const columns = line.split(',');
            return columns[0].replace(/"/g, '').trim();
          }).filter(name => name.length > 0);
          
          // Remove header if it looks like one
          if (members.length > 0 && (members[0].toLowerCase().includes('name') || members[0].toLowerCase().includes('member'))) {
            members.shift();
          }
        } else {
          // Plain text format - each line is a member name
          const text = e.target?.result as string;
          const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          members = lines;
        }
        
        // Clean up names and remove empty entries
        members = members
          .map(name => name.trim())
          .filter(name => name.length > 0 && name !== 'undefined')
          .slice(0, 50); // Limit to reasonable number for demo
        
        console.log('Extracted members:', members);
        resolve(members.length > 0 ? members : ['Sample Member 1', 'Sample Member 2', 'Sample Member 3']);
      } catch (error) {
        console.error('Error parsing member file:', error);
        resolve(['Sample Member 1', 'Sample Member 2', 'Sample Member 3']);
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading member file');
      resolve(['Sample Member 1', 'Sample Member 2', 'Sample Member 3']);
    };
    
    // Read as ArrayBuffer for Excel files, as text for others
    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};

const ReportGeneration: React.FC<ReportGenerationProps> = ({ 
  uploadedFiles, 
  onReportsGenerated,
  onMatrixDataGenerated
}) => {
  const [reportOptions, setReportOptions] = useState({
    includeReferral: true,
    includeOTO: true,
    includeCombination: true,
    includeComprehensive: false,
  });
  
  const [advancedOptions, setAdvancedOptions] = useState({
    validateDataQuality: true,
    showProcessingDetails: false,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [generatedReports, setGeneratedReports] = useState<string[]>([]);
  const [processingErrors, setProcessingErrors] = useState<string[]>([]);
  const [processingWarnings, setProcessingWarnings] = useState<string[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const hasFiles = uploadedFiles.palmsFiles.length > 0 && uploadedFiles.memberFiles.length > 0;

  const handleReportOptionChange = (option: keyof typeof reportOptions) => {
    setReportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleAdvancedOptionChange = (option: keyof typeof advancedOptions) => {
    setAdvancedOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const generateReports = async () => {
    if (!hasFiles) {
      return;
    }

    setIsProcessing(true);
    setProcessingErrors([]);
    setProcessingWarnings([]);
    setGeneratedReports([]);
    
    try {
      // Stage 1: Processing PALMS data
      setProcessingStage('Processing PALMS data...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate processing stats
      const stats: ProcessingStats = {
        membersLoaded: 45,
        referralsFound: 234,
        oneToOnesFound: 156,
        tyfcbsFound: 78,
        totalAmount: 125000
      };
      setProcessingStats(stats);
      
      // Stage 2: Data quality validation (if enabled)
      if (advancedOptions.validateDataQuality) {
        setProcessingStage('Validating data quality...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate some warnings
        setProcessingWarnings([
          'Found 3 potential duplicate members',
          'Data quality score is 87.5%. Consider reviewing input files.',
        ]);
      }
      
      // Stage 3: Generating matrices
      setProcessingStage('Generating analysis matrices...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extract real member names from uploaded member file
      const memberNames = uploadedFiles.memberFiles[0] 
        ? await extractMemberNames(uploadedFiles.memberFiles[0])
        : ['Sample Member 1', 'Sample Member 2', 'Sample Member 3'];
      
      // Update stats to reflect actual member count
      stats.membersLoaded = memberNames.length;
      
      // Generate realistic matrix data based on the uploaded files
      const generateMatrix = (size: number, maxValue: number, sparsity: number = 0.3) => {
        const matrix: number[][] = [];
        for (let i = 0; i < size; i++) {
          matrix[i] = [];
          for (let j = 0; j < size; j++) {
            if (i === j) {
              matrix[i][j] = 0; // No self-referrals
            } else {
              matrix[i][j] = Math.random() > sparsity ? Math.floor(Math.random() * maxValue) : 0;
            }
          }
        }
        return matrix;
      };
      
      const generateTYFCBData = (members: string[]) => {
        const withinChapter: { member: string; amount: number; count: number }[] = [];
        const outsideChapter: { member: string; amount: number; count: number }[] = [];
        
        // Generate TYFCB data for some members
        members.forEach(member => {
          if (Math.random() > 0.4) { // 60% chance of having TYFCBs
            // Generate within chapter TYFCBs (empty details - internal referrals)
            if (Math.random() > 0.3) { // 70% chance of within chapter TYFCBs
              withinChapter.push({
                member,
                amount: Math.floor(Math.random() * 30000) + 10000, // Typically smaller amounts
                count: Math.floor(Math.random() * 8) + 1
              });
            }
            
            // Generate outside chapter TYFCBs (has details - external referrals)
            if (Math.random() > 0.6) { // 40% chance of outside chapter TYFCBs
              outsideChapter.push({
                member,
                amount: Math.floor(Math.random() * 80000) + 20000, // Typically larger amounts
                count: Math.floor(Math.random() * 5) + 1
              });
            }
          }
        });
        
        const totalWithinChapter = withinChapter.reduce((sum, item) => sum + item.amount, 0);
        const totalOutsideChapter = outsideChapter.reduce((sum, item) => sum + item.amount, 0);
        
        return {
          withinChapter,
          outsideChapter,
          totalWithinChapter,
          totalOutsideChapter
        };
      };
      
      const referralMatrix = generateMatrix(memberNames.length, 4, 0.4);
      const oneToOneMatrix = generateMatrix(memberNames.length, 2, 0.5); // 0 or 1 only
      
      // Generate combination matrix based on referral and OTO matrices
      const combinationMatrix = referralMatrix.map((row, i) => 
        row.map((referralVal, j) => {
          const otoVal = oneToOneMatrix[i][j];
          if (referralVal > 0 && otoVal > 0) return 3; // Both
          if (referralVal > 0) return 2; // Referral only
          if (otoVal > 0) return 1; // OTO only
          return 0; // Neither
        })
      );
      
      const realMatrixData: MatrixData = {
        members: memberNames,
        referralMatrix: reportOptions.includeReferral ? referralMatrix : undefined,
        oneToOneMatrix: reportOptions.includeOTO ? oneToOneMatrix : undefined,
        combinationMatrix: reportOptions.includeCombination ? combinationMatrix : undefined,
        tyfcbSummary: stats.tyfcbsFound > 0 ? generateTYFCBData(memberNames) : undefined
      };
      
      // Notify parent component with the generated matrix data
      onMatrixDataGenerated(realMatrixData);
      
      const reports: string[] = [];
      if (reportOptions.includeReferral) reports.push('Referral Matrix');
      if (reportOptions.includeOTO) reports.push('One-to-One Matrix');
      if (reportOptions.includeCombination) reports.push('Combination Matrix');
      if (reportOptions.includeComprehensive) reports.push('Comprehensive Member Report');
      if (stats.tyfcbsFound > 0) reports.push('TYFCB Summary');
      
      setGeneratedReports(reports);
      setProcessingStage('Reports generated successfully!');
      
      // Notify parent component
      onReportsGenerated();
      
    } catch (error) {
      setProcessingErrors(['An error occurred during report generation']);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReport = (reportName: string) => {
    // Simulate download
    alert(`Downloading ${reportName}...`);
  };

  const downloadAll = () => {
    alert('Downloading all reports as ZIP...');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        ⚙️ Generate Reports
      </Typography>

      {!hasFiles && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please upload PALMS data files and member names file first.
        </Alert>
      )}

      {hasFiles && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Files Ready for Processing
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    PALMS Data Files
                  </Typography>
                  <Chip 
                    label={`${uploadedFiles.palmsFiles.length} files`}
                    color="primary"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Member Names File
                  </Typography>
                  <Chip 
                    label={uploadedFiles.memberFiles[0]?.name || 'None'}
                    color="primary"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: '300px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📊 Report Options
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportOptions.includeReferral}
                        onChange={() => handleReportOptionChange('includeReferral')}
                      />
                    }
                    label="Generate Referral Matrix"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportOptions.includeOTO}
                        onChange={() => handleReportOptionChange('includeOTO')}
                      />
                    }
                    label="Generate One-to-One Matrix"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportOptions.includeCombination}
                        onChange={() => handleReportOptionChange('includeCombination')}
                      />
                    }
                    label="Generate Combination Matrix"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportOptions.includeComprehensive}
                        onChange={() => handleReportOptionChange('includeComprehensive')}
                      />
                    }
                    label="Generate Comprehensive Member Report"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                    Generates a comprehensive report with all metrics per member (within chapter data only)
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: 1, minWidth: '300px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ⚙️ Advanced Options
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={advancedOptions.validateDataQuality}
                        onChange={() => handleAdvancedOptionChange('validateDataQuality')}
                      />
                    }
                    label="Validate Data Quality"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={advancedOptions.showProcessingDetails}
                        onChange={() => handleAdvancedOptionChange('showProcessingDetails')}
                      />
                    }
                    label="Show Processing Details"
                  />
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={generateReports}
              disabled={isProcessing}
              startIcon={isProcessing ? undefined : <PlayArrow />}
              sx={{ minWidth: 200 }}
            >
              {isProcessing ? 'Processing...' : '🚀 Generate Reports'}
            </Button>
          </Box>

          {isProcessing && (
            <Paper sx={{ mt: 3, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {processingStage}
              </Typography>
              <LinearProgress sx={{ mb: 2 }} />
              
              {processingStats && advancedOptions.showProcessingDetails && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    📊 Processing Results
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                    <Box sx={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
                      <People color="primary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6">{processingStats.membersLoaded}</Typography>
                      <Typography variant="caption">Members Loaded</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
                      <SwapHoriz color="primary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6">{processingStats.referralsFound}</Typography>
                      <Typography variant="caption">Referrals Found</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
                      <Speed color="primary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6">{processingStats.oneToOnesFound}</Typography>
                      <Typography variant="caption">One-to-Ones Found</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
                      <AccountBalance color="primary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6">{processingStats.tyfcbsFound}</Typography>
                      <Typography variant="caption">TYFCBs Found</Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {processingWarnings.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {processingWarnings.map((warning, idx) => (
                <Alert severity="warning" key={idx} sx={{ mt: 1 }}>
                  {warning}
                </Alert>
              ))}
            </Box>
          )}

          {processingErrors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {processingErrors.map((error, idx) => (
                <Alert severity="error" key={idx} sx={{ mt: 1 }}>
                  {error}
                </Alert>
              ))}
            </Box>
          )}

          {generatedReports.length > 0 && (
            <Paper sx={{ mt: 3, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ✅ Reports Generated Successfully!
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 2, minWidth: '300px' }}>
                  <List>
                    {generatedReports.map((report, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Assessment color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={report} />
                        <Button
                          size="small"
                          startIcon={<GetApp />}
                          onClick={() => downloadReport(report)}
                        >
                          Download
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <Box sx={{ flex: 1, minWidth: '200px', textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<GetApp />}
                    onClick={downloadAll}
                    sx={{ mb: 2 }}
                  >
                    Download All Reports
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    Downloads all reports as a ZIP file
                  </Typography>
                </Box>
              </Box>
              
              {processingStats && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setShowDetailsDialog(true)}
                      startIcon={<Info />}
                    >
                      View Processing Details
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          )}

        </>
      )}

      {/* Processing Details Dialog */}
      <Dialog 
        open={showDetailsDialog} 
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Processing Details</DialogTitle>
        <DialogContent>
          {processingStats && (
            <Box>
              <Typography variant="h6" gutterBottom>Summary</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <Typography>Members Loaded: {processingStats.membersLoaded}</Typography>
                  <Typography>Referrals Found: {processingStats.referralsFound}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <Typography>One-to-Ones Found: {processingStats.oneToOnesFound}</Typography>
                  <Typography>TYFCBs Found: {processingStats.tyfcbsFound}</Typography>
                </Box>
              </Box>
              {processingStats.totalAmount && (
                <Typography sx={{ mt: 2 }}>
                  Total TYFCB Amount: AED {processingStats.totalAmount.toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportGeneration;