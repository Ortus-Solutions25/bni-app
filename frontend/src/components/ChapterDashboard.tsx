import React, { useState, useMemo } from 'react';
import { Building2, Plus, Loader2, ArrowUpDown, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import ChapterCard from './ChapterCard';
import { ChapterMemberData, generateMockPerformanceMetrics } from '../services/ChapterDataLoader';
import { formatNumber } from '../lib/utils';

interface ChapterDashboardProps {
  chapterData: ChapterMemberData[];
  isLoading: boolean;
  onChapterSelect: (chapter: ChapterMemberData) => void;
  onChapterAdded?: () => void;
}

type SortOption = 'name' | 'memberCount' | 'performance';

const ChapterDashboard: React.FC<ChapterDashboardProps> = ({
  chapterData,
  isLoading,
  onChapterSelect,
  onChapterAdded,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    meeting_day: '',
    meeting_time: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const processedChapterData = useMemo(() => {
    return chapterData.map(chapter => ({
      ...chapter,
      performanceMetrics: chapter.performanceMetrics || generateMockPerformanceMetrics(chapter.members)
    }));
  }, [chapterData]);

  const filteredAndSortedChapters = useMemo(() => {
    let filtered = processedChapterData;

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'memberCount':
          return b.memberCount - a.memberCount;
        case 'performance':
          const getScore = (chapter: ChapterMemberData) => {
            if (chapter.loadError) return 0;
            const metrics = chapter.performanceMetrics;
            if (!metrics) return 0;
            return metrics.avgReferralsPerMember + metrics.avgOTOsPerMember;
          };
          return getScore(b) - getScore(a);
        case 'name':
        default:
          return a.chapterName.localeCompare(b.chapterName);
      }
    });

    return filtered;
  }, [processedChapterData, sortBy]);

  const dashboardStats = useMemo(() => {
    const totalMembers = processedChapterData.reduce((sum, chapter) => sum + chapter.memberCount, 0);
    const successfulLoads = processedChapterData.filter(chapter => !chapter.loadError).length;
    const totalChapters = processedChapterData.length;
    const avgMembersPerChapter = totalChapters > 0 ? Math.round(totalMembers / totalChapters) : 0;

    return { totalMembers, successfulLoads, totalChapters, avgMembersPerChapter };
  }, [processedChapterData]);

  const handleAddChapter = () => {
    setFormData({
      name: '',
      location: '',
      meeting_day: '',
      meeting_time: '',
    });
    setShowAddForm(true);
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/api/chapters/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setNotification({type: 'success', message: 'Chapter added successfully!'});
        setShowAddForm(false);
        setFormData({ name: '', location: '', meeting_day: '', meeting_time: '' });
        onChapterAdded?.();
      } else {
        const errorData = await response.json();
        setNotification({type: 'error', message: errorData.error || 'Failed to add chapter'});
      }
    } catch (error) {
      setNotification({type: 'error', message: 'Failed to add chapter. Please try again.'});
    }
    setIsSubmitting(false);
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!window.confirm('Are you sure you want to delete this chapter?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/chapters/${chapterId}/delete/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotification({type: 'success', message: 'Chapter deleted successfully'});
        onChapterAdded?.(); // Refresh data
      } else {
        setNotification({type: 'error', message: 'Failed to delete chapter'});
      }
    } catch (error) {
      setNotification({type: 'error', message: 'Failed to delete chapter'});
    }
  };

  if (isLoading && chapterData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <p className="text-lg font-medium">Loading chapters...</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            BNI Chapter Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and analyze your business networking chapters
          </p>
        </div>
        <Button onClick={handleAddChapter} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>
      </div>

      {/* Notification */}
      {notification && (
        <Alert
          variant={notification.type === 'error' ? 'destructive' : 'default'}
          className="mb-6"
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalChapters}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.successfulLoads} loaded successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardStats.totalMembers)}</div>
            <p className="text-xs text-muted-foreground">
              Across all chapters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Chapter</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.avgMembersPerChapter}</div>
            <p className="text-xs text-muted-foreground">
              Members per chapter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((dashboardStats.successfulLoads / dashboardStats.totalChapters) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successful loads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Chapter Form */}
      {showAddForm && (
        <Card>
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

      {/* Controls and Chapters */}
      <div className="space-y-6">
        {/* Sort Control */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Chapters ({filteredAndSortedChapters.length})
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="name">Chapter Name</option>
              <option value="memberCount">Member Count</option>
              <option value="performance">Performance</option>
            </select>
          </div>
        </div>

        {/* Chapter Grid - Professional CSS Grid Layout */}
        {filteredAndSortedChapters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedChapters.map((chapter) => (
              <ChapterCard
                key={chapter.chapterId}
                chapterData={chapter}
                onClick={() => onChapterSelect(chapter)}
                onDelete={handleDeleteChapter}
                isLoading={isLoading}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No chapters found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first BNI chapter
              </p>
              <Button onClick={handleAddChapter}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Chapter
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChapterDashboard;