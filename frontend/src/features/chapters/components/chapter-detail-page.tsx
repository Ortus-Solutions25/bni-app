import React from 'react';
import {
  ArrowLeft,
  Building2,
  History,
  Grid3X3,
  CloudUpload,
  GitCompare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChapterMemberData } from '../../../shared/services/ChapterDataLoader';
import PreviousDataTab from '../../reports/components/previous-data-tab';
import MatrixTab from '../../analytics/components/matrix-tab';
import ComparisonTab from '../../analytics/components/comparison-tab';
import FileUploadComponent from '../../file-upload/components/file-upload-component';
import FileUploadErrorBoundary from '../../file-upload/components/file-upload-error-boundary';

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
  const handleUploadSuccess = () => {
    if (onDataRefresh) {
      onDataRefresh();
    }
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
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid grid-cols-4 w-full lg:w-auto">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <CloudUpload className="h-4 w-4" />
              <span className="hidden sm:inline">Uploads</span>
              <span className="sm:hidden">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="matrices" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Previews</span>
              <span className="sm:hidden">Preview</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
              <span className="sm:hidden">Compare</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <FileUploadErrorBoundary>
              <FileUploadComponent
                chapterId={chapterData.chapterId}
                chapterName={chapterData.chapterName}
                onUploadSuccess={handleUploadSuccess}
              />
            </FileUploadErrorBoundary>
          </TabsContent>

          <TabsContent value="matrices" className="mt-6">
            <MatrixTab chapterData={chapterData} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <PreviousDataTab chapterData={chapterData} />
          </TabsContent>

          <TabsContent value="compare" className="mt-6">
            <ComparisonTab
              chapterId={chapterData.chapterId}
              monthlyReports={chapterData.monthlyReports || []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChapterDetailPage;