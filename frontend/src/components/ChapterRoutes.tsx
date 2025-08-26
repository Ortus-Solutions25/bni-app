import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import ChapterDashboard from './ChapterDashboard';
import ChapterDetailPage from './ChapterDetailPage';
import MemberDetails from './MemberDetails';
import { ChapterMemberData, loadAllChapterData } from '../services/ChapterDataLoader';

const ChapterRoutes: React.FC = () => {
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
      } catch (error) {
        console.error('Failed to load chapter data:', error);
      } finally {
        setIsLoadingChapters(false);
      }
    };
    
    loadChapters();
  }, []);

  // Navigation handlers
  const handleChapterSelect = (chapter: ChapterMemberData) => {
    navigate(`/chapter/${chapter.chapterId}`);
  };

  const handleMemberSelect = (chapterId: string, memberName: string) => {
    navigate(`/chapter/${chapterId}/members/${encodeURIComponent(memberName)}`);
  };

  const handleBackToChapters = () => {
    navigate('/');
  };

  const handleBackToMembers = (chapterId: string) => {
    navigate(`/chapter/${chapterId}`);
  };

  const handleChapterAdded = async () => {
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
      {/* Chapters Dashboard */}
      <Route 
        path="/" 
        element={
          <ChapterDashboard
            chapterData={chapterData}
            isLoading={isLoadingChapters}
            onChapterSelect={handleChapterSelect}
            onChapterAdded={handleChapterAdded}
          />
        } 
      />
      
      {/* Chapter Detail Page (with 4 tabs as per user requirements) */}
      <Route 
        path="/chapter/:chapterId" 
        element={<ChapterDetailRoute 
          chapterData={chapterData}
          onBackToChapters={handleBackToChapters}
          onMemberSelect={handleMemberSelect}
          onDataRefresh={handleChapterAdded}
        />} 
      />
      
      {/* Member Details */}
      <Route 
        path="/chapter/:chapterId/members/:memberName" 
        element={<MemberDetailsRoute 
          chapterData={chapterData}
          onBackToMembers={handleBackToMembers}
          onBackToChapters={handleBackToChapters}
          onDataRefresh={handleChapterAdded}
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
    <ChapterDetailPage
      chapterData={selectedChapter}
      onBackToChapters={onBackToChapters}
      onMemberSelect={(memberName: string) => onMemberSelect(chapterId!, memberName)}
      onDataRefresh={onDataRefresh}
    />
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
    <MemberDetails
      chapterData={selectedChapter}
      memberName={decodedMemberName}
      onBackToMembers={() => onBackToMembers(chapterId!)}
      onBackToChapters={onBackToChapters}
      onDataRefresh={onDataRefresh}
    />
  );
};

export default ChapterRoutes;