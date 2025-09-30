import { useState, useEffect, useCallback, useMemo } from 'react';
import { SystemStats } from '../types/admin.types';
import { ChapterMemberData, loadAllChapterData } from '../../../shared/services/ChapterDataLoader';

export const useAdminData = () => {
  const [chapterData, setChapterData] = useState<ChapterMemberData[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterMemberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load chapter data on mount and refresh trigger
  useEffect(() => {
    const loadChapters = async () => {
      setIsLoading(true);
      try {
        const chapters = await loadAllChapterData();
        setChapterData(chapters);
        if (chapters.length > 0 && !selectedChapter) {
          setSelectedChapter(chapters[0]);
        }
      } catch (error) {
        console.error('Failed to load chapter data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChapters();
  }, [refreshTrigger]);

  const handleDataRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleChapterSelect = useCallback((chapterId: string) => {
    const chapter = chapterData.find(c => c.chapterId === chapterId);
    setSelectedChapter(chapter || null);
  }, [chapterData]);

  const systemStats = useMemo((): SystemStats => ({
    totalChapters: chapterData.length,
    totalMembers: chapterData.reduce((sum, chapter) => sum + chapter.members.length, 0),
    totalReports: chapterData.reduce((sum, chapter) => sum + (chapter.monthlyReports?.length || 0), 0),
    lastUpdated: new Date().toLocaleDateString()
  }), [chapterData]);

  return {
    chapterData,
    selectedChapter,
    isLoading,
    systemStats,
    handleDataRefresh,
    handleChapterSelect,
  };
};
