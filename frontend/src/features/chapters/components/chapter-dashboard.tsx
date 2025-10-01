import React, { useState, useMemo } from 'react';
import { Building2, ArrowUpDown, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ChapterCard from './chapter-card';
import ChapterErrorBoundary from './chapter-error-boundary';
import ChapterCardSkeleton from '@/components/skeletons/ChapterCardSkeleton';
import { ChapterMemberData, generateMockPerformanceMetrics } from '../../../shared/services/ChapterDataLoader';
import { formatNumber } from '@/lib/utils';

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
    const biggestChapter = processedChapterData.reduce((max, chapter) =>
      (!chapter.loadError && chapter.memberCount > max.memberCount) ? chapter : max
    , { chapterName: '', memberCount: 0 } as ChapterMemberData);

    return { totalMembers, biggestChapter };
  }, [processedChapterData]);



  if (isLoading && chapterData.length === 0) {
    return (
      <div className="space-y-6 p-6">
        {/* Dashboard Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ChapterCardSkeleton key={i} />
          ))}
        </div>

        {/* Chapter Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ChapterCardSkeleton key={`chapter-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ChapterErrorBoundary>
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 animate-fade-in" data-testid="chapter-dashboard">
      {/* Header Section with Stats Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            BNI Chapter Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            View and analyze your business networking chapters
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="font-semibold">{formatNumber(dashboardStats.totalMembers)}</span>
            <span className="text-xs opacity-80">Total Members</span>
          </Badge>
          {dashboardStats.biggestChapter.chapterName && (
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span className="font-semibold">{dashboardStats.biggestChapter.chapterName}</span>
              <span className="text-xs opacity-80">({dashboardStats.biggestChapter.memberCount} members)</span>
            </Badge>
          )}
        </div>
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
    </ChapterErrorBoundary>
  );
};

export default ChapterDashboard;