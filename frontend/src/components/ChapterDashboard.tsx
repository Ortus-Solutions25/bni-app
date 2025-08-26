import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import {
  Business,
  Add,
} from '@mui/icons-material';
import ChapterCard from './ChapterCard';
import { ChapterMemberData, generateMockPerformanceMetrics } from '../services/ChapterDataLoader';

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
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    meeting_day: '',
    meeting_time: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<ChapterMemberData | null>(null);

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

  const totalMembers = useMemo(() => {
    return processedChapterData.reduce((sum, chapter) => sum + chapter.memberCount, 0);
  }, [processedChapterData]);

  const successfulLoads = useMemo(() => {
    return processedChapterData.filter(chapter => !chapter.loadError).length;
  }, [processedChapterData]);

  const handleAddChapter = () => {
    setFormData({
      name: '',
      location: '',
      meeting_day: '',
      meeting_time: '',
    });
    setOpenAddDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setFormData({
      name: '',
      location: '',
      meeting_day: '',
      meeting_time: '',
    });
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
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
        setSnackbarMessage('Chapter added successfully!');
        setSnackbarOpen(true);
        handleCloseDialog();
        onChapterAdded?.();
      } else {
        const errorData = await response.json();
        setSnackbarMessage(`Error: ${errorData.error || 'Failed to add chapter'}`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Failed to add chapter. Please try again.');
      setSnackbarOpen(true);
    }
    setIsSubmitting(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleDeleteChapter = (chapterId: string) => {
    const chapter = processedChapterData.find(ch => ch.chapterId === chapterId);
    if (chapter) {
      setChapterToDelete(chapter);
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!chapterToDelete) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/api/chapters/${chapterToDelete.chapterId}/delete/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSnackbarMessage(`Chapter "${chapterToDelete.chapterName}" deleted successfully!`);
        setSnackbarOpen(true);
        setDeleteConfirmOpen(false);
        setChapterToDelete(null);
        onChapterAdded?.(); // Refresh the chapter list
      } else {
        const errorData = await response.json();
        setSnackbarMessage(`Error: ${errorData.error || 'Failed to delete chapter'}`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Failed to delete chapter. Please try again.');
      setSnackbarOpen(true);
    }
    setIsSubmitting(false);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setChapterToDelete(null);
  };


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={48} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading BNI Chapters...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Reading member data from 9 chapter files
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Business sx={{ mr: 2 }} />
          BNI Chapters Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddChapter}
          sx={{ ml: 2 }}
        >
          Add Chapter
        </Button>
      </Box>

      {/* Summary Statistics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="primary">
              {processedChapterData.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Chapters
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h4" color="primary">
              {totalMembers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Members
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h4" color="primary">
              {successfulLoads}/{processedChapterData.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chapters Loaded
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <MenuItem value="name">Chapter Name</MenuItem>
            <MenuItem value="memberCount">Member Count</MenuItem>
            <MenuItem value="performance">Performance</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Error Alert */}
      {processedChapterData.some(chapter => chapter.loadError) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Some chapters failed to load. Check that all member files are accessible in the needed-data/member-names directory.
        </Alert>
      )}

      {/* Chapter Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {filteredAndSortedChapters.map((chapter) => (
          <ChapterCard
            key={chapter.chapterId}
            chapterData={chapter}
            onClick={() => onChapterSelect(chapter)}
            onDelete={handleDeleteChapter}
          />
        ))}
      </Box>

      <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Last updated: {new Date().toLocaleString()} • 
          {processedChapterData.length} chapters total
        </Typography>
      </Box>

      {/* Add Chapter Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Chapter</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chapter Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleFormChange('name')}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            variant="outlined"
            value={formData.location}
            onChange={handleFormChange('location')}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Meeting Day"
            fullWidth
            variant="outlined"
            value={formData.meeting_day}
            onChange={handleFormChange('meeting_day')}
            placeholder="e.g., Tuesday"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Meeting Time"
            type="time"
            fullWidth
            variant="outlined"
            value={formData.meeting_time}
            onChange={handleFormChange('meeting_time')}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isSubmitting || !formData.name || !formData.location}
          >
            {isSubmitting ? 'Adding...' : 'Add Chapter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Chapter</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the chapter "{chapterToDelete?.chapterName}"? 
            This action cannot be undone and will delete all associated data including members, 
            reports, and analytics.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete Chapter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default ChapterDashboard;