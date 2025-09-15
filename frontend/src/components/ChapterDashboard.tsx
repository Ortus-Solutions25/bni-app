import React, { useState, useMemo } from 'react';
import { Building2, ArrowUpDown, Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ChapterCard from './ChapterCard';
import { ChapterMemberData, generateMockPerformanceMetrics } from '../services/ChapterDataLoader';
import { formatNumber } from '../lib/utils';

interface ChapterDashboardProps {
  chapterData: ChapterMemberData[];
  isLoading: boolean;
  onChapterSelect: (chapter: ChapterMemberData) => void;
  onChapterAdded?: () => void;
}

type SortOption = 'name' | 'memberCount' | 'performance';

const ChapterDashboard: React.FC<ChapterDashboardProps> = ({
  chapterData,
  isLoading,
  onChapterSelect,
  onChapterAdded,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const processedChapterData = useMemo(() => {
    return chapterData.map(chapter => ({
      ...chapter,
      performanceMetrics: chapter.performanceMetrics || generateMockPerformanceMetrics(chapter.members)
    }));
  }, [chapterData]);

  const filteredAndSortedChapters = useMemo(() => {
    let filtered = processedChapterData;

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'memberCount':
          return b.memberCount - a.memberCount;
        case 'performance':
          const getScore = (chapter: ChapterMemberData) => {
            if (chapter.loadError) return 0;
            const metrics = chapter.performanceMetrics;
            if (!metrics) return 0;
            return metrics.avgReferralsPerMember + metrics.avgOTOsPerMember;
          };
          return getScore(b) - getScore(a);
        case 'name':
        default:
          return a.chapterName.localeCompare(b.chapterName);
      }
    });

    return filtered;
  }, [processedChapterData, sortBy]);

  const dashboardStats = useMemo(() => {
    const totalMembers = processedChapterData.reduce((sum, chapter) => sum + chapter.memberCount, 0);
    const successfulLoads = processedChapterData.filter(chapter => !chapter.loadError).length;
    const totalChapters = processedChapterData.length;
    const avgMembersPerChapter = totalChapters > 0 ? Math.round(totalMembers / totalChapters) : 0;

    return { totalMembers, successfulLoads, totalChapters, avgMembersPerChapter };
  }, [processedChapterData]);



  if (isLoading && chapterData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <p className="text-lg font-medium">Loading chapters...</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            BNI Chapter Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            View and analyze your business networking chapters
          </p>
        </div>
      </div>


      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalChapters}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.successfulLoads} loaded successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardStats.totalMembers)}</div>
            <p className="text-xs text-muted-foreground">
              Across all chapters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Chapter</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.avgMembersPerChapter}</div>
            <p className="text-xs text-muted-foreground">
              Members per chapter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((dashboardStats.successfulLoads / dashboardStats.totalChapters) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successful loads
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Controls and Chapters */}
      <div className="space-y-6">
        {/* Sort Control */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Chapters ({filteredAndSortedChapters.length})
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Chapter Name</SelectItem>
                <SelectItem value="memberCount">Member Count</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chapter Grid - Professional CSS Grid Layout */}
        {filteredAndSortedChapters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedChapters.map((chapter) => (
              <ChapterCard
                key={chapter.chapterId}
                chapterData={chapter}
                onClick={() => onChapterSelect(chapter)}
                isLoading={isLoading}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No chapters found</h3>
              <p className="text-muted-foreground">
                Contact your administrator to add BNI chapters
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChapterDashboard;