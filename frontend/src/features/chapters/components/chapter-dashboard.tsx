import React, { useMemo } from 'react';
import { Building2, Loader2, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const ChapterDashboard: React.FC<ChapterDashboardProps> = ({
  chapterData,
  isLoading,
  onChapterSelect,
  onChapterAdded,
}) => {
  const navigate = useNavigate();

  const processedChapterData = useMemo(() => {
    return chapterData.map(chapter => ({
      ...chapter,
      performanceMetrics: chapter.performanceMetrics || generateMockPerformanceMetrics(chapter.members)
    })).sort((a, b) => a.chapterName.localeCompare(b.chapterName));
  }, [chapterData]);

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
      {/* Clickable Header with Stats */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin')}
          className="group flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            BNI Chapter Dashboard
          </h1>
          <Settings className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
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


      {/* Chapters Grid */}
      <div>
        {processedChapterData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {processedChapterData.map((chapter) => (
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