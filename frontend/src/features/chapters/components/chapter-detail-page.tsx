import React from 'react';
import { ChapterMemberData } from '../../../shared/services/ChapterDataLoader';
import OptimizedChapterDashboard from './optimized-chapter-dashboard';

interface ChapterDetailPageProps {
  chapterData: ChapterMemberData;
  onBackToChapters: () => void;
  onMemberSelect: (memberName: string) => void;
  onDataRefresh?: () => void;
}

const ChapterDetailPage: React.FC<ChapterDetailPageProps> = (props) => {
  return <OptimizedChapterDashboard {...props} />;
};

export default ChapterDetailPage;