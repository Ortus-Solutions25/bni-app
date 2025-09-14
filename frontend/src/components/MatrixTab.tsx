import React, { useState, useEffect } from 'react';
import {
  Grid3x3,
  TrendingUp,
  Users,
  GitMerge,
  DollarSign,
  Download,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
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
    unique_given?: Record<string, number>;
    unique_received?: Record<string, number>;
  };
  summaries?: {
    neither?: Record<string, number>;
    oto_only?: Record<string, number>;
    referral_only?: Record<string, number>;
    both?: Record<string, number>;
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

const MatrixTab: React.FC<MatrixTabProps> = ({ chapterData }) => {
  const [tabValue, setTabValue] = useState('referral');
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

  const handleReportChange = (reportId: string) => {
    const report = monthlyReports.find(r => r.id === parseInt(reportId));
    setSelectedReport(report || null);
  };

  const handleDownloadExcel = async () => {
    if (!selectedReport) return;

    try {
      // Fetch the Excel file from the API
      const response = await fetch(`/api/chapters/${chapterData.chapterId}/reports/${selectedReport.id}/download-matrices/`);

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chapterData.chapterName.replace(/ /g, '_')}_Matrices_${selectedReport.month_year}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download Excel file:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  const renderTYFCBReport = (tyfcbData: TYFCBData | null) => {
    if (!tyfcbData) {
      return (
        <Alert>
          <AlertDescription>
            No TYFCB data available for this report
          </AlertDescription>
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
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Thank You For Closed Business (TYFCB) report showing business closed through referrals
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Total TYFCB
              </h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                AED {totalAmount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {totalTransactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Inside Chapter
              </h3>
              <p className="text-3xl font-bold">
                AED {inside.total_amount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {inside.count} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Outside Chapter
              </h3>
              <p className="text-3xl font-bold">
                AED {outside.total_amount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {outside.count} transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inside Chapter Top Performers */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Top Inside Chapter TYFCB
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Member</TableHead>
                      <TableHead className="text-right font-semibold">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topInsideMembers.map(([member, amount], index) => (
                      <TableRow key={member} className="hover:bg-muted/50">
                        <TableCell>{member}</TableCell>
                        <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                          AED {amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {topInsideMembers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No inside chapter TYFCB data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Outside Chapter Top Performers */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Top Outside Chapter TYFCB
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Member</TableHead>
                      <TableHead className="text-right font-semibold">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topOutsideMembers.map(([member, amount], index) => (
                      <TableRow key={member} className="hover:bg-muted/50">
                        <TableCell>{member}</TableCell>
                        <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                          AED {amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {topOutsideMembers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No outside chapter TYFCB data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderMatrix = (matrixData: MatrixData | null, title: string, description: string, matrixType: 'referral' | 'oto' | 'combination' = 'referral') => {
    if (!matrixData) {
      return (
        <Alert>
          <AlertDescription>
            No data available for {title.toLowerCase()}
          </AlertDescription>
        </Alert>
      );
    }

    const { members, matrix, totals, summaries, legend } = matrixData;
    const hasData = matrix.some(row => row.some(cell => cell > 0));

    if (!hasData) {
      return (
        <Alert>
          <AlertDescription>
            No {title.toLowerCase()} data available for this chapter yet.
            Data will appear after importing PALMS reports.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <TooltipProvider>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {description}
          </p>

          {/* Legend for combination matrix */}
          {legend && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Legend:</h4>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(legend).map(([key, value]) => (
                  <Badge
                    key={key}
                    variant="outline"
                  >
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Matrix Table */}
          <div className="rounded-md border">
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="font-bold min-w-[120px] sticky left-0 bg-background">Giver \ Receiver</TableHead>
                    {members.map((member, index) => (
                      <TableHead
                        key={index}
                        className="font-bold min-w-[40px] max-w-[40px] text-xs p-2"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {member.split(' ').map(n => n[0]).join('')}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{member}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                    ))}
                    {/* Summary columns based on matrix type */}
                    {matrixType === 'combination' && summaries ? (
                      <>
                        <TableHead className="font-bold min-w-[80px] text-xs">Neither</TableHead>
                        <TableHead className="font-bold min-w-[80px] text-xs">OTO Only</TableHead>
                        <TableHead className="font-bold min-w-[80px] text-xs">Referral Only</TableHead>
                        <TableHead className="font-bold min-w-[80px] text-xs">OTO & Referral</TableHead>
                      </>
                    ) : totals ? (
                      <>
                        <TableHead className="font-bold min-w-[80px] text-xs">
                          {matrixType === 'oto' ? 'Total OTO' : 'Total Referrals'}
                        </TableHead>
                        <TableHead className="font-bold min-w-[80px] text-xs">
                          {matrixType === 'oto' ? 'Unique OTO' : 'Unique Referrals'}
                        </TableHead>
                      </>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((giver, i) => (
                    <TableRow key={i} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-sm sticky left-0 bg-background">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{giver}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{giver}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      {members.map((receiver, j) => (
                        <TableCell
                          key={j}
                          className={`text-center ${
                            matrix[i][j] > 0
                              ? 'bg-primary/20 dark:bg-primary/30 font-bold text-primary'
                              : ''
                          }`}
                        >
                          {matrix[i][j] || '-'}
                        </TableCell>
                      ))}
                      {/* Summary values based on matrix type */}
                      {matrixType === 'combination' && summaries ? (
                        <>
                          <TableCell className="font-bold text-center">
                            {summaries.neither?.[giver] || 0}
                          </TableCell>
                          <TableCell className="font-bold text-center">
                            {summaries.oto_only?.[giver] || 0}
                          </TableCell>
                          <TableCell className="font-bold text-center">
                            {summaries.referral_only?.[giver] || 0}
                          </TableCell>
                          <TableCell className="font-bold text-center">
                            {summaries.both?.[giver] || 0}
                          </TableCell>
                        </>
                      ) : totals ? (
                        <>
                          <TableCell className="font-bold text-center">
                            {totals.given?.[giver] || 0}
                          </TableCell>
                          <TableCell className="font-bold text-center">
                            {totals.unique_given?.[giver] || 0}
                          </TableCell>
                        </>
                      ) : null}
                    </TableRow>
                  ))}
                  {/* Totals received row */}
                  {totals?.received && (
                    <TableRow>
                      <TableCell className="font-bold sticky left-0 bg-background">Total Received</TableCell>
                      {members.map((member, i) => (
                        <TableCell key={i} className="font-bold text-center">
                          {totals.received?.[member] || 0}
                        </TableCell>
                      ))}
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  };

  if (isLoadingReports) {
    return (
      <div className="flex flex-col items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2 text-sm text-muted-foreground">
          Loading monthly reports...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <Grid3x3 className="h-5 w-5" />
          Matrices & Reports
        </h2>
        <p className="text-sm text-muted-foreground">
          Interactive matrices and TYFCB reports showing relationships and business results for {chapterData.chapterName}
        </p>
      </div>

      {/* Report Selection */}
      {monthlyReports.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-full sm:w-80">
            <Select value={selectedReport?.id?.toString() || ''} onValueChange={handleReportChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Monthly Report" />
              </SelectTrigger>
              <SelectContent>
                {monthlyReports.map((report) => (
                  <SelectItem key={report.id} value={report.id.toString()}>
                    <div className="flex justify-between items-center w-full">
                      <span>{report.month_year}</span>
                      <div className="flex gap-1 ml-4">
                        {report.has_referral_matrix && <Badge variant="secondary">Ref</Badge>}
                        {report.has_oto_matrix && <Badge variant="secondary">OTO</Badge>}
                        {report.has_combination_matrix && <Badge variant="secondary">Combo</Badge>}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedReport && (
            <Button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download All Matrices
            </Button>
          )}
        </div>
      )}

      {/* No Reports State */}
      {monthlyReports.length === 0 && (
        <Alert>
          <AlertDescription>
            No monthly reports have been uploaded yet for {chapterData.chapterName}.
            Use the "Upload Palms Data" tab to upload PALMS slip audit reports.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Matrices */}
      {isLoadingMatrices && (
        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading matrices for {selectedReport?.month_year}...
          </p>
        </div>
      )}

      {/* Matrix Content - only show if we have a selected report and not loading */}
      {selectedReport && !isLoadingMatrices && monthlyReports.length > 0 && (
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="referral" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Referral Matrix</span>
              <span className="sm:hidden">Referral</span>
            </TabsTrigger>
            <TabsTrigger value="oto" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">One-to-One Matrix</span>
              <span className="sm:hidden">One-to-One</span>
            </TabsTrigger>
            <TabsTrigger value="combination" className="flex items-center gap-2">
              <GitMerge className="h-4 w-4" />
              <span className="hidden sm:inline">Combination Matrix</span>
              <span className="sm:hidden">Combination</span>
            </TabsTrigger>
            <TabsTrigger value="tyfcb" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">TYFCB Report</span>
              <span className="sm:hidden">TYFCB</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referral" className="mt-6">
            {renderMatrix(
              referralMatrix,
              "Referral Matrix",
              "Shows who has given referrals to whom. Numbers represent the count of referrals given.",
              'referral'
            )}
          </TabsContent>

          <TabsContent value="oto" className="mt-6">
            {renderMatrix(
              oneToOneMatrix,
              "One-to-One Matrix",
              "Tracks one-to-one meetings between members. Numbers represent the count of meetings.",
              'oto'
            )}
          </TabsContent>

          <TabsContent value="combination" className="mt-6">
            {renderMatrix(
              combinationMatrix,
              "Combination Matrix",
              "Combined view showing both referrals and one-to-ones using coded values.",
              'combination'
            )}
          </TabsContent>

          <TabsContent value="tyfcb" className="mt-6">
            {renderTYFCBReport(tyfcbData)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MatrixTab;