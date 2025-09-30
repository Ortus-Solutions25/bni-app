import React from 'react';
import {
  Settings,
  CloudUpload,
  Building2,
  Users,
  Database,
  FileSpreadsheet,
  Calendar,
  UserPlus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MemberManagementTab } from './member-management-tab';
import { ChapterManagementTab } from './chapter-management-tab';
import { BulkUploadTab } from './bulk-upload-tab';
import { DataUploadTab } from './data-upload-tab';
import { SystemStatusTab } from './system-status-tab';
import { useAdminData } from '../hooks/useAdminData';

const AdminDashboard: React.FC = () => {
  const {
    chapterData,
    selectedChapter,
    isLoading,
    systemStats,
    handleDataRefresh,
    handleChapterSelect,
  } = useAdminData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">BNI Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage chapters, upload data, and monitor system performance
        </p>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalChapters}</div>
            <p className="text-xs text-muted-foreground">
              Active business chapters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Across all chapters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Monthly data reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sm">{systemStats.lastUpdated}</div>
            <p className="text-xs text-muted-foreground">
              System data refresh
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <CloudUpload className="h-4 w-4" />
            Data Upload
          </TabsTrigger>
          <TabsTrigger value="chapters" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Chapter Management
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Member Management
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Bulk Operations
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            System Status
          </TabsTrigger>
        </TabsList>

        {/* Data Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <DataUploadTab
            selectedChapter={selectedChapter}
            chapterData={chapterData}
            onChapterSelect={handleChapterSelect}
            onUploadSuccess={handleDataRefresh}
          />
        </TabsContent>

        {/* Chapter Management Tab */}
        <TabsContent value="chapters" className="space-y-6">
          <ChapterManagementTab
            chapterData={chapterData}
            onDataRefresh={handleDataRefresh}
          />
        </TabsContent>

        {/* Member Management Tab */}
        <TabsContent value="members" className="space-y-6">
          <MemberManagementTab
            chapterData={chapterData}
            onDataRefresh={handleDataRefresh}
          />
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <BulkUploadTab
            onDataRefresh={handleDataRefresh}
          />
        </TabsContent>

        {/* System Status Tab */}
        <TabsContent value="system" className="space-y-6">
          <SystemStatusTab systemStats={systemStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
