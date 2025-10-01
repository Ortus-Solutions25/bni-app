import React, { useMemo } from 'react';
import { Building2, Loader2, Users, Settings, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  const location = useLocation();

  const tabs = [
    { id: 'dashboard', label: 'Chapter Dashboard', icon: Building2, path: '/' },
    { id: 'admin', label: 'Admin Dashboard', icon: Settings, path: '/admin' },
    { id: 'summary', label: 'Summary', icon: BarChart3, path: '/summary' }
  ];

  const currentTab = location.pathname === '/admin' ? 'admin' : location.pathname === '/summary' ? 'summary' : 'dashboard';

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 sm:space-y-8 p-4 sm:p-6"
        data-testid="chapter-dashboard"
      >
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`relative px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-secondary/20 rounded-lg -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="font-semibold">{formatNumber(dashboardStats.totalMembers)}</span>
            <span className="text-xs opacity-80 hidden sm:inline">Total Members</span>
          </Badge>
          {dashboardStats.biggestChapter.chapterName && (
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span className="font-semibold truncate max-w-[120px]">{dashboardStats.biggestChapter.chapterName}</span>
              <span className="text-xs opacity-80 hidden sm:inline">({dashboardStats.biggestChapter.memberCount})</span>
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
    </motion.div>
    </ChapterErrorBoundary>
  );
};

export default ChapterDashboard;