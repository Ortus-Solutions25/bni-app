import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  TrendingUp,
  Users,
  Trash2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Alert, AlertDescription } from '../../../shared/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { ChapterMemberData, MonthlyReport, loadMonthlyReports, deleteMonthlyReport } from '../../../shared/services/ChapterDataLoader';

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
  const loadReports = useCallback(async () => {
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
  }, [chapterData.chapterId]);

  useEffect(() => {
    if (chapterData.chapterId) {
      loadReports();
    }
  }, [chapterData.chapterId, loadReports]);

  const handleReportChange = (reportId: string) => {
    const report = monthlyReports.find(r => r.id === parseInt(reportId));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Monthly Reports
        </h2>
        <Button
          onClick={loadReports}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Report Selection */}
      {monthlyReports.length > 0 && (
        <div className="w-full max-w-md">
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
                      {report.has_referral_matrix && <Badge variant="secondary">Referrals</Badge>}
                      {report.has_oto_matrix && <Badge variant="secondary">OTOs</Badge>}
                      {report.has_combination_matrix && <Badge variant="secondary">Combined</Badge>}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading monthly reports...
            </span>
          </div>
        </div>
      )}

      {/* Selected Report Display */}
      {!isLoading && selectedReport && (
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">
                {chapterData.chapterName} - {selectedReport.month_year}
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">
                  Uploaded: {new Date(selectedReport.uploaded_at).toLocaleDateString()}
                </Badge>
                {selectedReport.processed_at && (
                  <Badge variant="success">
                    Processed: {new Date(selectedReport.processed_at).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>

            <Button
              onClick={() => handleDeleteReport(selectedReport)}
              disabled={isDeleting}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Report
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Report Files */}
            <Card>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Files
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Slip Audit:</span>
                    <Badge variant={selectedReport.slip_audit_file ? "success" : "destructive"}>
                      {selectedReport.slip_audit_file ? 'Uploaded' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Names:</span>
                    <Badge variant={selectedReport.member_names_file ? "success" : "outline"}>
                      {selectedReport.member_names_file ? 'Uploaded' : 'Not provided'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matrix Data Status */}
            <Card>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Processed Data
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Referral Matrix:</span>
                    <Badge variant={selectedReport.has_referral_matrix ? "success" : "destructive"}>
                      {selectedReport.has_referral_matrix ? 'Available' : 'Not processed'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">One-to-One Matrix:</span>
                    <Badge variant={selectedReport.has_oto_matrix ? "success" : "destructive"}>
                      {selectedReport.has_oto_matrix ? 'Available' : 'Not processed'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Combination Matrix:</span>
                    <Badge variant={selectedReport.has_combination_matrix ? "success" : "destructive"}>
                      {selectedReport.has_combination_matrix ? 'Available' : 'Not processed'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Actions
                </h4>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Use the "Matrices" tab to view detailed referral and OTO data for this month.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Use the "Members" tab to see individual member performance and missing connections.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Processing Status Alert */}
          <div>
            {selectedReport.processed_at ? (
              <Alert>
                <AlertDescription className="text-green-800 dark:text-green-200">
                  This report has been successfully processed and matrix data is available in the "Matrices" tab.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  This report is still being processed. Matrix data will be available once processing is complete.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {/* No Reports State */}
      {!isLoading && monthlyReports.length === 0 && !error && (
        <Alert>
          <AlertDescription>
            No monthly reports have been uploaded yet for {chapterData.chapterName}.
            Use the "Upload Palms Data" tab to upload PALMS slip audit reports.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PreviousDataTab;