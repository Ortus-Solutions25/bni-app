import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Home, Info, Upload, Grid3X3, GitCompare } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ChapterMemberData } from '../../../shared/services/ChapterDataLoader';
import ChapterInfoTab from './tabs/chapter-info-tab';
import FileUploadTab from './tabs/file-upload-tab';
import ComparisonTab from '../../analytics/components/comparison-tab';
import MatrixPreviewTab from './tabs/matrix-preview-tab';

interface ChapterDetailTabbedProps {
  chapterData: ChapterMemberData;
  onBackToChapters: () => void;
  onMemberSelect: (memberName: string) => void;
  onDataRefresh?: () => void;
}

const ChapterDetailTabbed: React.FC<ChapterDetailTabbedProps> = ({
  chapterData,
  onBackToChapters,
  onMemberSelect,
  onDataRefresh,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as 'info' | 'upload' | 'compare' | 'preview' | null;
  const [activeTab, setActiveTab] = useState<'info' | 'upload' | 'compare' | 'preview'>(tabFromUrl || 'info');
  const [refreshKey, setRefreshKey] = useState(0);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabFromUrl && ['info', 'upload', 'compare', 'preview'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleUploadSuccess = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    if (onDataRefresh) {
      onDataRefresh();
    }
    // Switch to preview tab after successful upload
    setTimeout(() => {
      setActiveTab('preview');
    }, 500);
  }, [onDataRefresh]);

  const tabs = useMemo(() => [
    { id: 'info' as const, label: 'Chapter Info', icon: Info },
    { id: 'upload' as const, label: 'Upload', icon: Upload },
    { id: 'compare' as const, label: 'Compare', icon: GitCompare },
    { id: 'preview' as const, label: 'Matrices', icon: Grid3X3 }
  ], []);

  const handleTabChange = useCallback((tabId: 'info' | 'upload' | 'compare' | 'preview') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  }, [setSearchParams]);

  return (
    <div className="min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="px-4 sm:px-6 py-4 bg-background border-b">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={onBackToChapters}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Home className="h-4 w-4" />
                Chapters
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{chapterData.chapterName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 sm:px-6 py-4 bg-background border-b">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
                  <span className="text-sm">{tab.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="chapterActiveTab"
                    className="absolute inset-0 bg-secondary/20 rounded-lg -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6"
      >
        {activeTab === 'info' && (
          <ChapterInfoTab chapterData={chapterData} />
        )}
        {activeTab === 'upload' && (
          <FileUploadTab
            chapterData={chapterData}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
        {activeTab === 'compare' && (
          <ComparisonTab
            chapterId={chapterData.chapterId}
            key={refreshKey}
          />
        )}
        {activeTab === 'preview' && (
          <MatrixPreviewTab
            chapterData={chapterData}
            onMemberSelect={onMemberSelect}
            refreshKey={refreshKey}
          />
        )}
      </motion.div>
    </div>
  );
};

export default ChapterDetailTabbed;
