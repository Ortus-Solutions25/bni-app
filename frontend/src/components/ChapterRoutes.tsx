import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import ChapterDashboard from './ChapterDashboard';
import MemberDashboard from './MemberDashboard';
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
    navigate(`/chapters/${chapter.chapterId}/members`);
  };

  const handleMemberSelect = (chapterId: string, memberName: string) => {
    navigate(`/chapters/${chapterId}/members/${encodeURIComponent(memberName)}`);
  };

  const handleBackToChapters = () => {
    navigate('/chapters');
  };

  const handleBackToMembers = (chapterId: string) => {
    navigate(`/chapters/${chapterId}/members`);
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
          />
        } 
      />
      
      {/* Member Dashboard */}
      <Route 
        path="/:chapterId/members" 
        element={<MemberDashboardRoute 
          chapterData={chapterData}
          onMemberSelect={handleMemberSelect}
          onBackToChapters={handleBackToChapters}
        />} 
      />
      
      {/* Member Details */}
      <Route 
        path="/:chapterId/members/:memberName" 
        element={<MemberDetailsRoute 
          chapterData={chapterData}
          onBackToMembers={handleBackToMembers}
          onBackToChapters={handleBackToChapters}
        />} 
      />
    </Routes>
  );
};

// Route component for Member Dashboard
const MemberDashboardRoute: React.FC<{
  chapterData: ChapterMemberData[];
  onMemberSelect: (chapterId: string, memberName: string) => void;
  onBackToChapters: () => void;
}> = ({ chapterData, onMemberSelect, onBackToChapters }) => {
  const { chapterId } = useParams<{ chapterId: string }>();
  
  const selectedChapter = chapterData.find(chapter => chapter.chapterId === chapterId);
  
  if (!selectedChapter) {
    return <div>Chapter not found</div>;
  }

  return (
    <MemberDashboard
      chapterData={selectedChapter}
      onMemberSelect={(memberName: string) => onMemberSelect(chapterId!, memberName)}
      onBackToChapters={onBackToChapters}
    />
  );
};

// Route component for Member Details
const MemberDetailsRoute: React.FC<{
  chapterData: ChapterMemberData[];
  onBackToMembers: (chapterId: string) => void;
  onBackToChapters: () => void;
}> = ({ chapterData, onBackToMembers, onBackToChapters }) => {
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
    />
  );
};

export default ChapterRoutes;