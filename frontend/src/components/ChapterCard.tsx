import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  People,
  TrendingUp,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { ChapterMemberData } from '../services/ChapterDataLoader';

interface ChapterCardProps {
  chapterData: ChapterMemberData;
  onClick: () => void;
  isLoading?: boolean;
}

const getPerformanceColor = (score: number): 'success' | 'warning' | 'error' => {
  if (score >= 85) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
};

const getPerformanceScore = (chapterData: ChapterMemberData): number => {
  if (chapterData.loadError) return 0;
  if (!chapterData.performanceMetrics) return 75;
  
  const { avgReferralsPerMember, avgOTOsPerMember, totalTYFCB } = chapterData.performanceMetrics;
  const referralScore = Math.min(avgReferralsPerMember * 10, 40);
  const otoScore = Math.min(avgOTOsPerMember * 5, 30);
  const tyfcbScore = Math.min(totalTYFCB / 10000, 30);
  
  return Math.round(referralScore + otoScore + tyfcbScore);
};

const ChapterCard: React.FC<ChapterCardProps> = ({ chapterData, onClick, isLoading = false }) => {
  const performanceScore = getPerformanceScore(chapterData);
  const performanceColor = getPerformanceColor(performanceScore);
  
  if (isLoading) {
    return (
      <Card sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading {chapterData.chapterName}...
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: 240, 
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {chapterData.chapterName}
            </Typography>
            {chapterData.loadError ? (
              <ErrorIcon color="error" />
            ) : (
              <Chip
                label={`${performanceScore}%`}
                color={performanceColor}
                size="small"
                icon={<TrendingUp />}
              />
            )}
          </Box>

          {chapterData.loadError ? (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
                Failed to load chapter data
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                {chapterData.loadError}
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {chapterData.memberCount} members
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1 }}>
                {chapterData.performanceMetrics && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Performance Overview
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={performanceScore} 
                      color={performanceColor}
                      sx={{ mb: 2 }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Avg Referrals:
                      </Typography>
                      <Typography variant="caption">
                        {chapterData.performanceMetrics.avgReferralsPerMember}/member
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Avg OTOs:
                      </Typography>
                      <Typography variant="caption">
                        {chapterData.performanceMetrics.avgOTOsPerMember}/member
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Total TYFCB:
                      </Typography>
                      <Typography variant="caption">
                        AED {(chapterData.performanceMetrics.totalTYFCB / 1000).toFixed(0)}K
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {new Date(chapterData.loadedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ChapterCard;