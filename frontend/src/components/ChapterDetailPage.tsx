import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  History,
  Grid3X3,
  CloudUpload,
  Users
} from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChapterMemberData } from '../services/ChapterDataLoader';
import PreviousDataTab from './PreviousDataTab';
import MembersTab from './MembersTab';
import MatrixTab from './MatrixTab';
import FileUploadComponent from './FileUploadComponent';

interface ChapterDetailPageProps {
  chapterData: ChapterMemberData;
  onBackToChapters: () => void;
  onMemberSelect: (memberName: string) => void;
  onDataRefresh?: () => void;
}


const ChapterDetailPage: React.FC<ChapterDetailPageProps> = ({
  chapterData,
  onBackToChapters,
  onMemberSelect,
  onDataRefresh,
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-4 p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToChapters}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chapters
        </Button>

        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <button
            onClick={onBackToChapters}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <Building2 className="h-4 w-4" />
            BNI Chapters
          </button>
          <span>/</span>
          <span className="flex items-center gap-1 text-foreground font-medium">
            <Building2 className="h-4 w-4" />
            {chapterData.chapterName}
          </span>
        </nav>
      </div>

      {/* Chapter Header */}
      <div className="px-4 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          {chapterData.chapterName}
        </h1>
        <p className="text-muted-foreground">
          {chapterData.memberCount} members • Loaded {chapterData.loadedAt.toLocaleDateString()}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="px-4">
        <Tabs defaultValue="previous" className="w-full">
          <TabsList className="grid grid-cols-4 w-full lg:w-auto">
            <TabsTrigger value="previous" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Previous Data</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
            <TabsTrigger value="matrices" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Matrices</span>
              <span className="sm:hidden">Matrix</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <CloudUpload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Data</span>
              <span className="sm:hidden">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
              <span className="sm:hidden">Members</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="previous" className="mt-6">
            <PreviousDataTab chapterData={chapterData} />
          </TabsContent>

          <TabsContent value="matrices" className="mt-6">
            <MatrixTab chapterData={chapterData} />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <FileUploadComponent
              chapterId={chapterData.chapterId}
              chapterName={chapterData.chapterName}
              onUploadSuccess={handleUploadSuccess}
            />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <MembersTab
              chapterData={chapterData}
              onMemberSelect={onMemberSelect}
              onMemberAdded={onDataRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChapterDetailPage;