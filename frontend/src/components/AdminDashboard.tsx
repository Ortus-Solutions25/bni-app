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
  UserPlus,
  UserMinus,
  Download,
  Upload,
  Edit,
  Trash2,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
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

        {/* Member Management Tab */}
        <TabsContent value="members" className="space-y-6">
          <MemberManagementTab
            chapterData={chapterData}
            onDataRefresh={handleUploadSuccess}
          />
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <BulkOperationsTab
            chapterData={chapterData}
            selectedChapter={selectedChapter}
            onChapterSelect={handleChapterSelect}
            onDataRefresh={handleUploadSuccess}
          />
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

// Member Management Tab Component
const MemberManagementTab: React.FC<{
  chapterData: ChapterMemberData[];
  onDataRefresh: () => void;
}> = ({ chapterData, onDataRefresh }) => {
  const [selectedChapter, setSelectedChapter] = useState<ChapterMemberData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const filteredMembers = selectedChapter?.members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.business?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.classification?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleMemberSelect = (memberId: string, checked: boolean) => {
    setSelectedMembers(prev =>
      checked
        ? [...prev, memberId]
        : prev.filter(id => id !== memberId)
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedChapter || selectedMembers.length === 0) return;

    // Implementation would call DELETE API for each selected member
    console.log('Bulk delete members:', selectedMembers);
    // Reset selections
    setSelectedMembers([]);
    onDataRefresh();
  };

  const exportMemberData = () => {
    if (!selectedChapter) return;

    const csvContent = "data:text/csv;charset=utf-8,"
      + "Name,Business,Classification,Email,Phone,Join Date,Status\n"
      + selectedChapter.members.map(member =>
          `${member.name},"${member.business || ''}","${member.classification || ''}","${member.email || ''}","${member.phone || ''}","${member.joinDate || ''}","${member.active ? 'Active' : 'Inactive'}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedChapter.chapterName}_members.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Member Management</h2>
        <p className="text-muted-foreground">
          Manage chapter members, perform bulk operations, and export member data.
        </p>
      </div>

      {/* Chapter Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Chapter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedChapter?.chapterId || ''}
            onValueChange={(value) => {
              const chapter = chapterData.find(c => c.chapterId === value);
              setSelectedChapter(chapter || null);
              setSelectedMembers([]);
            }}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a chapter to manage members..." />
            </SelectTrigger>
            <SelectContent>
              {chapterData.map((chapter) => (
                <SelectItem key={chapter.chapterId} value={chapter.chapterId}>
                  {chapter.chapterName} ({chapter.members.length} members)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedChapter && (
        <>
          {/* Actions Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search members by name, business, or classification..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportMemberData}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  {selectedMembers.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete ({selectedMembers.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chapter Members</CardTitle>
                <Badge variant="secondary">
                  {filteredMembers.length} of {selectedChapter.members.length} members
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers(filteredMembers.map((_, index) => index.toString()));
                            } else {
                              setSelectedMembers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(index.toString())}
                            onChange={(e) => handleMemberSelect(index.toString(), e.target.checked)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.business || 'N/A'}</TableCell>
                        <TableCell>{member.classification || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={member.active ? 'default' : 'secondary'}>
                            {member.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// Bulk Operations Tab Component
const BulkOperationsTab: React.FC<{
  chapterData: ChapterMemberData[];
  selectedChapter: ChapterMemberData | null;
  onChapterSelect: (chapterId: string) => void;
  onDataRefresh: () => void;
}> = ({ chapterData, selectedChapter, onChapterSelect, onDataRefresh }) => {
  const [bulkAction, setBulkAction] = useState<'update' | 'delete' | 'export' | 'import'>('update');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Bulk Operations</h2>
        <p className="text-muted-foreground">
          Perform bulk operations on member data across chapters.
        </p>
      </div>

      {/* Bulk Action Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Bulk Operation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant={bulkAction === 'update' ? 'default' : 'outline'}
              onClick={() => setBulkAction('update')}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Edit className="h-6 w-6" />
              Bulk Update
            </Button>
            <Button
              variant={bulkAction === 'delete' ? 'default' : 'outline'}
              onClick={() => setBulkAction('delete')}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Trash2 className="h-6 w-6" />
              Bulk Delete
            </Button>
            <Button
              variant={bulkAction === 'export' ? 'default' : 'outline'}
              onClick={() => setBulkAction('export')}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Download className="h-6 w-6" />
              Export Data
            </Button>
            <Button
              variant={bulkAction === 'import' ? 'default' : 'outline'}
              onClick={() => setBulkAction('import')}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Upload className="h-6 w-6" />
              Import Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chapter Selection for Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Target Chapter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedChapter?.chapterId || ''}
            onValueChange={onChapterSelect}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a chapter for bulk operations..." />
            </SelectTrigger>
            <SelectContent>
              {chapterData.map((chapter) => (
                <SelectItem key={chapter.chapterId} value={chapter.chapterId}>
                  {chapter.chapterName} ({chapter.members.length} members)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bulk Operation Interface */}
      {selectedChapter && (
        <Card>
          <CardHeader>
            <CardTitle>
              {bulkAction === 'update' && 'Bulk Update Members'}
              {bulkAction === 'delete' && 'Bulk Delete Members'}
              {bulkAction === 'export' && 'Export Member Data'}
              {bulkAction === 'import' && 'Import Member Data'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bulkAction === 'update' && (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Upload a CSV file with updated member information. The system will match existing members by name and update their details.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-4">
                  <Input type="file" accept=".csv" className="flex-1" />
                  <Button>Process Updates</Button>
                </div>
              </div>
            )}

            {bulkAction === 'delete' && (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: This will permanently delete selected members. This action cannot be undone.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-4">
                  <Input type="file" accept=".csv" placeholder="Upload CSV with member names to delete" className="flex-1" />
                  <Button variant="destructive">Delete Members</Button>
                </div>
              </div>
            )}

            {bulkAction === 'export' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Export all member data from {selectedChapter.chapterName} to CSV format.
                </p>
                <Button className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export {selectedChapter.members.length} Members
                </Button>
              </div>
            )}

            {bulkAction === 'import' && (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Import new members from a CSV file. Required columns: Name, Business, Classification, Email, Phone.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-4">
                  <Input type="file" accept=".csv" className="flex-1" />
                  <Button>Import Members</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;