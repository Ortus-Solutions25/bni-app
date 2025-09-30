import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthlyReport, ComparisonData, loadComparisonData, loadMonthlyReports } from '../../../shared/services/ChapterDataLoader';

interface ComparisonTabProps {
  chapterId: string;
}

const ComparisonTab: React.FC<ComparisonTabProps> = ({ chapterId }) => {
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [currentReportId, setCurrentReportId] = useState<number | null>(null);
  const [previousReportId, setPreviousReportId] = useState<number | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load monthly reports when component mounts
  useEffect(() => {
    const fetchReports = async () => {
      setLoadingReports(true);
      try {
        const reports = await loadMonthlyReports(chapterId);
        setMonthlyReports(reports);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load monthly reports');
      } finally {
        setLoadingReports(false);
      }
    };

    if (chapterId) {
      fetchReports();
    }
  }, [chapterId]);

  // Sort reports by month_year descending (newest first)
  const sortedReports = [...monthlyReports].sort((a, b) =>
    b.month_year.localeCompare(a.month_year)
  );

  const handleCompare = async () => {
    if (!currentReportId || !previousReportId) {
      setError('Please select both months to compare');
      return;
    }

    if (currentReportId === previousReportId) {
      setError('Please select two different months');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loadComparisonData(chapterId, currentReportId, previousReportId);
      setComparisonData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case '↗️':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case '↘️':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowRight className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'improved':
        return <Badge variant="default" className="bg-green-500">Improved</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">No Change</Badge>;
    }
  };

  // Show loading state while fetching reports
  if (loadingReports) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading monthly reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Months to Compare
          </CardTitle>
          <CardDescription>
            Choose two months to compare member performance and identify trends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedReports.length >= 2 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Month */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Month</label>
                  <Select
                    value={currentReportId?.toString()}
                    onValueChange={(value) => setCurrentReportId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select current month" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedReports.map((report) => (
                        <SelectItem key={report.id} value={report.id.toString()}>
                          {report.month_year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Previous Month */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Previous Month</label>
                  <Select
                    value={previousReportId?.toString()}
                    onValueChange={(value) => setPreviousReportId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select previous month" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedReports.map((report) => (
                        <SelectItem key={report.id} value={report.id.toString()}>
                          {report.month_year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Compare Button */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">&nbsp;</label>
                  <Button
                    onClick={handleCompare}
                    disabled={loading || !currentReportId || !previousReportId}
                    className="w-full"
                  >
                    {loading ? 'Comparing...' : 'Compare'}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need at least 2 monthly reports to compare performance.
                {monthlyReports.length === 1 && ' You have 1 report uploaded. '}
                Please upload more data to enable comparisons.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonData && (
        <div className="space-y-6">
          {/* Overall Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Performance Summary</CardTitle>
              <CardDescription>
                Comparing {comparisonData.current_report.month_year} vs {comparisonData.previous_report.month_year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{comparisonData.overall_insights.overall.total_members}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">New Members</p>
                  <p className="text-2xl font-bold text-blue-500">{comparisonData.overall_insights.overall.new_members}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Referral Improvement Rate</p>
                  <p className="text-2xl font-bold text-green-500">{comparisonData.overall_insights.referrals.improvement_rate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">OTO Improvement Rate</p>
                  <p className="text-2xl font-bold text-green-500">{comparisonData.overall_insights.one_to_ones.improvement_rate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Comparison Tabs */}
          <Tabs defaultValue="referrals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="otos">One-to-Ones</TabsTrigger>
              <TabsTrigger value="combination">Combined</TabsTrigger>
            </TabsList>

            {/* Referrals Tab */}
            <TabsContent value="referrals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {comparisonData.referral_comparison.summary.improved}
                      </p>
                      <p className="text-xs text-muted-foreground">Improved</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {comparisonData.referral_comparison.summary.declined}
                      </p>
                      <p className="text-xs text-muted-foreground">Declined</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-600">
                        {comparisonData.referral_comparison.summary.no_change}
                      </p>
                      <p className="text-xs text-muted-foreground">No Change</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {comparisonData.referral_comparison.summary.average_change.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Change</p>
                    </div>
                  </div>

                  {/* Top Improvers */}
                  {comparisonData.referral_comparison.summary.top_improvements.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Top Improvers
                      </h4>
                      <div className="space-y-2">
                        {comparisonData.referral_comparison.summary.top_improvements.map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="font-medium">{member.member}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">{member.previous} → {member.current}</span>
                              <Badge variant="default" className="bg-green-500">+{member.change}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Declines */}
                  {comparisonData.referral_comparison.summary.top_declines.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Needs Attention
                      </h4>
                      <div className="space-y-2">
                        {comparisonData.referral_comparison.summary.top_declines.map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <span className="font-medium">{member.member}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">{member.previous} → {member.current}</span>
                              <Badge variant="destructive">{member.change}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* One-to-Ones Tab */}
            <TabsContent value="otos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>One-to-One Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {comparisonData.oto_comparison.summary.improved}
                      </p>
                      <p className="text-xs text-muted-foreground">Improved</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {comparisonData.oto_comparison.summary.declined}
                      </p>
                      <p className="text-xs text-muted-foreground">Declined</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-600">
                        {comparisonData.oto_comparison.summary.no_change}
                      </p>
                      <p className="text-xs text-muted-foreground">No Change</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {comparisonData.oto_comparison.summary.average_change.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Change</p>
                    </div>
                  </div>

                  {/* Top Improvers */}
                  {comparisonData.oto_comparison.summary.top_improvements.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Top Improvers
                      </h4>
                      <div className="space-y-2">
                        {comparisonData.oto_comparison.summary.top_improvements.map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="font-medium">{member.member}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">{member.previous} → {member.current}</span>
                              <Badge variant="default" className="bg-green-500">+{member.change}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Declines */}
                  {comparisonData.oto_comparison.summary.top_declines.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Needs Attention
                      </h4>
                      <div className="space-y-2">
                        {comparisonData.oto_comparison.summary.top_declines.map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <span className="font-medium">{member.member}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">{member.previous} → {member.current}</span>
                              <Badge variant="destructive">{member.change}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Combination Tab */}
            <TabsContent value="combination" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Combined Performance Comparison</CardTitle>
                  <CardDescription>
                    Combined view of referrals and one-to-one meetings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {comparisonData.combination_comparison.summary.improved}
                      </p>
                      <p className="text-xs text-muted-foreground">Improved</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {comparisonData.combination_comparison.summary.declined}
                      </p>
                      <p className="text-xs text-muted-foreground">Declined</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-600">
                        {comparisonData.combination_comparison.summary.no_change}
                      </p>
                      <p className="text-xs text-muted-foreground">No Change</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {comparisonData.overall_insights.overall.combination_improvement_rate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Improvement Rate</p>
                    </div>
                  </div>

                  {/* Most Improved Metric */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Most Improved Metric</p>
                    <p className="text-lg font-bold capitalize">{comparisonData.overall_insights.overall.most_improved_metric.replace('_', ' ')}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ComparisonTab;
