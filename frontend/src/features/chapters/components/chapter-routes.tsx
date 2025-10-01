import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import UnifiedDashboard from './unified-dashboard';
import { ChapterMemberData, loadAllChapterData } from '../../../shared/services/ChapterDataLoader';

const ChapterDetailPage = lazy(() => import('./chapter-detail-page'));
const MemberDetails = lazy(() => import('../../members/components/member-details'));
const DataUploadPage = lazy(() => import('../../admin/pages/data-upload-page'));
const BulkOperationsPage = lazy(() => import('../../admin/pages/bulk-operations-page'));
const ChapterManagementPage = lazy(() => import('../../admin/pages/chapter-management-page'));
const MemberManagementPage = lazy(() => import('../../admin/pages/member-management-page'));
const SystemStatusPage = lazy(() => import('../../admin/pages/system-status-page'));

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-4">
      <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      <div>
        <p className="text-lg font-medium">Loading...</p>
        <p className="text-sm text-muted-foreground">Please wait</p>
      </div>
    </div>
  </div>
);

interface ChapterRoutesProps {
  selectedChapterId: string;
  onChapterSelect: (chapterId: string) => void;
  onChaptersLoad: (chapters: Array<{ chapterId: string; chapterName: string; memberCount: number }>) => void;
}

const ChapterRoutes: React.FC<ChapterRoutesProps> = ({ selectedChapterId, onChapterSelect, onChaptersLoad }) => {
  const [chapterData, setChapterData] = useState<ChapterMemberData[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const navigate = useNavigate();

  // Load chapter data on mount
  useEffect(() => {
    const loadChapters = async () => {
      setIsLoadingChapters(true);
      try {
        const chapters = await loadAllChapterData();
        setChapterData(chapters);
        // Notify parent of loaded chapters
        onChaptersLoad(chapters.map(c => ({
          chapterId: c.chapterId,
          chapterName: c.chapterName,
          memberCount: c.memberCount
        })));
        // Auto-select first chapter if none selected
        if (chapters.length > 0 && !selectedChapterId) {
          onChapterSelect(chapters[0].chapterId);
        }
      } catch (error) {
        console.error('Failed to load chapter data:', error);
      } finally {
        setIsLoadingChapters(false);
      }
    };

    loadChapters();
  }, []); // Only run once on mount

  // Navigation handlers
  const handleMemberSelect = (chapterId: string, memberName: string) => {
    navigate(`/chapter/${chapterId}/members/${encodeURIComponent(memberName)}`);
  };

  const handleBackToChapters = () => {
    navigate('/');
  };

  const handleBackToMembers = (chapterId: string) => {
    navigate(`/chapter/${chapterId}`);
  };

  const handleDataRefresh = async () => {
    // Reload chapter data after adding a new chapter
    setIsLoadingChapters(true);
    try {
      const chapters = await loadAllChapterData();
      setChapterData(chapters);
    } catch (error) {
      console.error('Failed to reload chapter data:', error);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  return (
    <Routes>
      {/* Unified Dashboard */}
      <Route
        path="/"
        element={
          <UnifiedDashboard
            chapterData={chapterData}
            isLoading={isLoadingChapters}
            selectedChapterId={selectedChapterId}
            onChapterSelect={onChapterSelect}
            onMemberSelect={handleMemberSelect}
            onDataRefresh={handleDataRefresh}
          />
        }
      />

      {/* Admin Pages */}
      <Route
        path="/admin/upload"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <DataUploadPage />
          </Suspense>
        }
      />
      <Route
        path="/admin/bulk"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <BulkOperationsPage />
          </Suspense>
        }
      />
      <Route
        path="/admin/chapters"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ChapterManagementPage />
          </Suspense>
        }
      />
      <Route
        path="/admin/members"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <MemberManagementPage />
          </Suspense>
        }
      />
      <Route
        path="/admin/system"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <SystemStatusPage />
          </Suspense>
        }
      />

      {/* Chapter Detail Page (with 4 tabs as per user requirements) */}
      <Route
        path="/chapter/:chapterId"
        element={<ChapterDetailRoute
          chapterData={chapterData}
          onBackToChapters={handleBackToChapters}
          onMemberSelect={handleMemberSelect}
          onDataRefresh={handleDataRefresh}
        />}
      />

      {/* Member Details */}
      <Route
        path="/chapter/:chapterId/members/:memberName"
        element={<MemberDetailsRoute
          chapterData={chapterData}
          onBackToMembers={handleBackToMembers}
          onBackToChapters={handleBackToChapters}
          onDataRefresh={handleDataRefresh}
        />}
      />
    </Routes>
  );
};

// Route component for Chapter Detail Page with 4 tabs
const ChapterDetailRoute: React.FC<{
  chapterData: ChapterMemberData[];
  onBackToChapters: () => void;
  onMemberSelect: (chapterId: string, memberName: string) => void;
  onDataRefresh: () => void;
}> = ({ chapterData, onBackToChapters, onMemberSelect, onDataRefresh }) => {
  const { chapterId } = useParams<{ chapterId: string }>();
  
  const selectedChapter = chapterData.find(chapter => chapter.chapterId === chapterId);
  
  if (!selectedChapter) {
    return <div>Chapter not found</div>;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ChapterDetailPage
        chapterData={selectedChapter}
        onBackToChapters={onBackToChapters}
        onMemberSelect={(memberName: string) => onMemberSelect(chapterId!, memberName)}
        onDataRefresh={onDataRefresh}
      />
    </Suspense>
  );
};

// Route component for Member Details
const MemberDetailsRoute: React.FC<{
  chapterData: ChapterMemberData[];
  onBackToMembers: (chapterId: string) => void;
  onBackToChapters: () => void;
  onDataRefresh: () => void;
}> = ({ chapterData, onBackToMembers, onBackToChapters, onDataRefresh }) => {
  const { chapterId, memberName } = useParams<{ chapterId: string; memberName: string }>();
  
  const selectedChapter = chapterData.find(chapter => chapter.chapterId === chapterId);
  const decodedMemberName = memberName ? decodeURIComponent(memberName) : '';
  
  if (!selectedChapter || !decodedMemberName) {
    return <div>Chapter or member not found</div>;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <MemberDetails
        chapterData={selectedChapter}
        memberName={decodedMemberName}
        onBackToMembers={() => onBackToMembers(chapterId!)}
        onBackToChapters={onBackToChapters}
        onDataRefresh={onDataRefresh}
      />
    </Suspense>
  );
};

export default ChapterRoutes;