import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { People, Business, Email, Phone } from '@mui/icons-material';
import { ChapterMemberData } from '../services/ChapterDataLoader';

interface Member {
  id: number;
  full_name: string;
  business_name: string;
  classification: string;
  email: string;
  phone: string;
}

interface MembersTabProps {
  chapterData: ChapterMemberData;
  onMemberSelect: (memberName: string) => void;
}

const MembersTab: React.FC<MembersTabProps> = ({ chapterData, onMemberSelect }) => {
  const [members, setMembers] = useState<Member[]>([]);
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
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
        {members.map((member) => (
          <Paper 
            key={member.id} 
            elevation={1} 
            sx={{ 
              p: 3, 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              '&:hover': { 
                elevation: 4,
                transform: 'translateY(-2px)'
              } 
            }}
            onClick={() => onMemberSelect(member.full_name)}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
                {member.full_name}
              </Typography>
              {member.business_name && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Business fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {member.business_name}
                  </Typography>
                </Box>
              )}
              {member.classification && (
                <Chip 
                  label={member.classification}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {member.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {member.email}
                  </Typography>
                </Box>
              )}
              {member.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {member.phone}
                  </Typography>
                </Box>
              )}
            </Box>
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