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
} from '@mui/material';
import {
  Business,
} from '@mui/icons-material';
import ChapterCard from './ChapterCard';
import { ChapterMemberData, generateMockPerformanceMetrics } from '../services/ChapterDataLoader';

interface ChapterDashboardProps {
  chapterData: ChapterMemberData[];
  isLoading: boolean;
  onChapterSelect: (chapter: ChapterMemberData) => void;
}

type SortOption = 'name' | 'memberCount' | 'performance';

const ChapterDashboard: React.FC<ChapterDashboardProps> = ({
  chapterData,
  isLoading,
  onChapterSelect,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('name');

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
      <Typography variant="h4" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Business sx={{ mr: 2 }} />
        BNI Chapters Dashboard
      </Typography>

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
          />
        ))}
      </Box>

      <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Last updated: {new Date().toLocaleString()} • 
          {processedChapterData.length} chapters total
        </Typography>
      </Box>
    </Box>
  );
};

export default ChapterDashboard;