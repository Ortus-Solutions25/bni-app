import React from 'react';
import { Plus, Building2, CheckCircle, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChapterMemberData } from '../../../shared/services/ChapterDataLoader';
import { useChapterManagement } from '../hooks/useChapterManagement';

interface ChapterManagementTabProps {
  chapterData: ChapterMemberData[];
  onDataRefresh: () => void;
}

export const ChapterManagementTab: React.FC<ChapterManagementTabProps> = ({
  chapterData,
  onDataRefresh,
}) => {
  const {
    showAddForm,
    formData,
    isSubmitting,
    handleFormChange,
    handleSubmit,
    handleDelete,
    handleAddChapter,
    setShowAddForm,
  } = useChapterManagement(onDataRefresh);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Chapter Management</h2>
          <p className="text-muted-foreground">
            Create, monitor and manage all BNI chapters in the system.
          </p>
        </div>
        <Button onClick={handleAddChapter} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>
      </div>

      {/* Add Chapter Form */}
      {showAddForm && (
        <Card className="border-l-4 border-l-primary/30">
          <CardHeader>
            <CardTitle>Add New Chapter</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium">Chapter Name</label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleFormChange('name')}
                    placeholder="Enter chapter name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="location" className="text-sm font-medium">Location</label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={handleFormChange('location')}
                    placeholder="Enter location"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="meeting_day" className="text-sm font-medium">Meeting Day</label>
                  <Input
                    id="meeting_day"
                    value={formData.meeting_day}
                    onChange={handleFormChange('meeting_day')}
                    placeholder="e.g., Tuesday"
                  />
                </div>
                <div>
                  <label htmlFor="meeting_time" className="text-sm font-medium">Meeting Time</label>
                  <Input
                    id="meeting_time"
                    value={formData.meeting_time}
                    onChange={handleFormChange('meeting_time')}
                    placeholder="e.g., 9:00 AM"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Chapter'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {chapterData.map((chapter) => (
          <Card key={chapter.chapterId} className="border-l-4 border-l-primary/30">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(chapter.chapterId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
  );
};
