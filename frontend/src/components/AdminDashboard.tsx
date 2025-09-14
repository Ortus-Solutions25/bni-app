import React, { useState, useEffect } from 'react';
import {
  Settings,
  CloudUpload,
  Building2,
  Users,
  Database,
  BarChart3,
  FileSpreadsheet,
  Calendar,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import FileUploadComponent from './FileUploadComponent';
import { ChapterMemberData, loadAllChapterData } from '../services/ChapterDataLoader';

const AdminDashboard: React.FC = () => {
  const [chapterData, setChapterData] = useState<ChapterMemberData[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterMemberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load chapter data on mount
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

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleChapterSelect = (chapterId: string) => {
    const chapter = chapterData.find(c => c.chapterId === chapterId);
    setSelectedChapter(chapter || null);
  };

  const systemStats = {
    totalChapters: chapterData.length,
    totalMembers: chapterData.reduce((sum, chapter) => sum + chapter.members.length, 0),
    totalReports: chapterData.reduce((sum, chapter) => sum + (chapter.monthlyReports?.length || 0), 0),
    lastUpdated: new Date().toLocaleDateString()
  };

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <CloudUpload className="h-4 w-4" />
            Data Upload
          </TabsTrigger>
          <TabsTrigger value="chapters" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Chapter Management
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            System Status
          </TabsTrigger>
        </TabsList>

        {/* Data Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Upload PALMS Data</h2>
              <p className="text-muted-foreground">
                Select a chapter and upload slip audit reports or member data files.
              </p>
            </div>

            {/* Chapter Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Chapter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <Select
                    value={selectedChapter?.chapterId || ''}
                    onValueChange={handleChapterSelect}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Choose a chapter to upload data for..." />
                    </SelectTrigger>
                    <SelectContent>
                      {chapterData.map((chapter) => (
                        <SelectItem key={chapter.chapterId} value={chapter.chapterId}>
                          {chapter.chapterName} ({chapter.members.length} members)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedChapter && (
                    <p className="text-sm text-muted-foreground">
                      Selected: <strong>{selectedChapter.chapterName}</strong> with {selectedChapter.members.length} members
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upload Component */}
            {selectedChapter ? (
              <FileUploadComponent
                chapterId={selectedChapter.chapterId}
                chapterName={selectedChapter.chapterName}
                onUploadSuccess={handleUploadSuccess}
              />
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please select a chapter to begin uploading data.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        {/* Chapter Management Tab */}
        <TabsContent value="chapters" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Chapter Management</h2>
            <p className="text-muted-foreground mb-6">
              Monitor and manage all BNI chapters in the system.
            </p>

            <div className="grid gap-4">
              {chapterData.map((chapter) => (
                <Card key={chapter.chapterId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {chapter.chapterName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {chapter.members.length} members
                        </span>
                        {(chapter.monthlyReports?.length || 0) > 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Chapter ID</p>
                        <p className="text-sm text-muted-foreground">{chapter.chapterId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Members</p>
                        <p className="text-sm text-muted-foreground">{chapter.members.length}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Monthly Reports</p>
                        <p className="text-sm text-muted-foreground">
                          {chapter.monthlyReports?.length || 0} reports
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* System Status Tab */}
        <TabsContent value="system" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">System Status</h2>
            <p className="text-muted-foreground mb-6">
              Monitor system health and data integrity.
            </p>

            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  System is operational. All services are running normally.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Data Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">Chapters</p>
                      <p className="text-2xl font-bold">{systemStats.totalChapters}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Members</p>
                      <p className="text-2xl font-bold">{systemStats.totalMembers}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Reports</p>
                      <p className="text-2xl font-bold">{systemStats.totalReports}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Update</p>
                      <p className="text-sm font-bold">{systemStats.lastUpdated}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};


export default AdminDashboard;