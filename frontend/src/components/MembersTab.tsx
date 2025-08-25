import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { People } from '@mui/icons-material';
import { ChapterMemberData } from '../services/ChapterDataLoader';

interface MembersTabProps {
  chapterData: ChapterMemberData;
}

const MembersTab: React.FC<MembersTabProps> = ({ chapterData }) => {
  const [members, setMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!chapterData.chapterId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Call the real backend API for chapter details including members
        const response = await fetch(`/api/chapters/${chapterData.chapterId}/`);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract members array
        setMembers(data.members || []);
        
      } catch (error) {
        console.error('Failed to load members:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMembers();
  }, [chapterData.chapterId]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading members...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load members: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <People />
        Chapter Members
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        All {members.length} active members in {chapterData.chapterName}
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {members.map((member, index) => (
          <Paper key={index} elevation={1} sx={{ p: 2 }}>
            <Typography variant="body1" fontWeight="medium">
              {member}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Member
            </Typography>
          </Paper>
        ))}
      </Box>
      
      {members.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No active members found for this chapter.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MembersTab;