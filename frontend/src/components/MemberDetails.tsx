import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Paper,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Business,
  Person,
  NavigateNext,
  PersonAdd,
  PersonOff,
  SwapHoriz,
  MonetizationOn,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  TrendingUp,
} from '@mui/icons-material';
import { ChapterMemberData } from '../services/ChapterDataLoader';

interface MemberDetailsProps {
  chapterData: ChapterMemberData;
  memberName: string;
  onBackToMembers: () => void;
  onBackToChapters: () => void;
}

interface MemberAnalytics {
  member: {
    id: number;
    full_name: string;
    business_name: string;
    classification: string;
    email: string;
    phone: string;
  };
  chapter: {
    id: number;
    name: string;
    total_members: number;
  };
  performance: {
    referrals_given: number;
    referrals_received: number;
    one_to_ones: number;
    tyfcb_amount: number;
    performance_score: number;
  };
  gaps: {
    missing_one_to_ones: Array<{ id: number; name: string }>;
    missing_referrals_to: Array<{ id: number; name: string }>;
    missing_referrals_from: Array<{ id: number; name: string }>;
    priority_connections: Array<{ id: number; name: string }>;
  };
  recommendations: string[];
  completion_rates: {
    oto_completion: number;
    referral_given_coverage: number;
    referral_received_coverage: number;
  };
  latest_report: {
    id: number | null;
    month_year: string | null;
    processed_at: string | null;
  };
}

const getPerformanceColor = (score: number): { color: 'success' | 'warning' | 'error'; icon: React.ReactElement } => {
  if (score >= 85) return { color: 'success', icon: <CheckCircle /> };
  if (score >= 70) return { color: 'warning', icon: <Warning /> };
  return { color: 'error', icon: <ErrorIcon /> };
};

const MemberDetails: React.FC<MemberDetailsProps> = ({
  chapterData,
  memberName,
  onBackToMembers,
  onBackToChapters,
}) => {
  const [memberAnalytics, setMemberAnalytics] = useState<MemberAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemberAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const encodedMemberName = encodeURIComponent(memberName);
        const response = await fetch(`/api/chapters/${chapterData.chapterId}/members/${encodedMemberName}/analytics/`);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setMemberAnalytics(data);
        
      } catch (error) {
        console.error('Failed to load member analytics:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMemberAnalytics();
  }, [chapterData.chapterId, memberName]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={48} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Member Analytics...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Analyzing referrals, one-to-ones, and TYFCB data
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load member analytics: {error}
        </Alert>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link component="button" onClick={onBackToMembers}>
            Back to Members
          </Link>
          <Link component="button" onClick={onBackToChapters}>
            Back to Chapters
          </Link>
        </Box>
      </Box>
    );
  }

  if (!memberAnalytics) {
    return (
      <Alert severity="warning">
        No analytics data available for this member.
      </Alert>
    );
  }

  const performanceInfo = getPerformanceColor(memberAnalytics.performance.performance_score);

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={onBackToChapters}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Business sx={{ mr: 0.5 }} fontSize="inherit" />
          Chapters
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={onBackToMembers}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          {memberAnalytics.chapter.name}
        </Link>
        <Typography color="text.primary">{memberAnalytics.member.full_name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Person sx={{ mr: 2, fontSize: 40 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            {memberAnalytics.member.full_name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {memberAnalytics.member.business_name} • {memberAnalytics.member.classification}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Member of {memberAnalytics.chapter.name}
          </Typography>
        </Box>
        <Chip
          label={`${memberAnalytics.performance.performance_score}% Performance`}
          color={performanceInfo.color}
          size="medium"
          icon={performanceInfo.icon}
          sx={{ fontSize: '1rem', px: 2, py: 1 }}
        />
      </Box>

      {/* Performance Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Performance Summary
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Overall Performance</Typography>
                <Typography variant="body2">{memberAnalytics.performance.performance_score}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memberAnalytics.performance.performance_score}
                color={performanceInfo.color}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="h4" color="primary">
                  {memberAnalytics.performance.referrals_given}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Referrals Given
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="primary">
                  {memberAnalytics.performance.referrals_received}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Referrals Received
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="primary">
                  {memberAnalytics.performance.one_to_ones}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  One-to-Ones
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="primary">
                  AED {(memberAnalytics.performance.tyfcb_amount / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  TYFCB Generated
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📈 Completion Rates
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">One-to-One Meetings</Typography>
                <Typography variant="body2">{memberAnalytics.completion_rates.oto_completion}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memberAnalytics.completion_rates.oto_completion}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Referrals Given Coverage</Typography>
                <Typography variant="body2">{memberAnalytics.completion_rates.referral_given_coverage}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memberAnalytics.completion_rates.referral_given_coverage}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Referrals Received Coverage</Typography>
                <Typography variant="body2">{memberAnalytics.completion_rates.referral_received_coverage}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memberAnalytics.completion_rates.referral_received_coverage}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Based on {memberAnalytics.chapter.total_members - 1} possible connections
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Gap Analysis */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonAdd sx={{ mr: 1 }} />
              Missing One-to-Ones
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Members you haven't met with yet
            </Typography>
            
            {memberAnalytics.gaps.missing_one_to_ones.length === 0 ? (
              <Alert severity="success">
                Great! You've had one-to-ones with all chapter members.
              </Alert>
            ) : (
              <List dense>
                {memberAnalytics.gaps.missing_one_to_ones.slice(0, 8).map((member) => (
                  <ListItem key={member.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={member.name} />
                  </ListItem>
                ))}
                {memberAnalytics.gaps.missing_one_to_ones.length > 8 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 5 }}>
                    +{memberAnalytics.gaps.missing_one_to_ones.length - 8} more members
                  </Typography>
                )}
              </List>
            )}
          </CardContent>
        </Card>
        
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <SwapHoriz sx={{ mr: 1 }} />
              Referral Opportunities
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Members you could refer business to
            </Typography>
            
            <List dense>
              {memberAnalytics.gaps.missing_referrals_to.slice(0, 8).map((member) => (
                <ListItem key={member.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <TrendingUp fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={member.name} />
                </ListItem>
              ))}
              {memberAnalytics.gaps.missing_referrals_to.length > 8 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 5 }}>
                  +{memberAnalytics.gaps.missing_referrals_to.length - 8} more members
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
        
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonOff sx={{ mr: 1 }} />
              Potential Referral Sources
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Members who could refer business to you
            </Typography>
            
            <List dense>
              {memberAnalytics.gaps.missing_referrals_from.slice(0, 8).map((member) => (
                <ListItem key={member.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <MonetizationOn fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={member.name} />
                </ListItem>
              ))}
              {memberAnalytics.gaps.missing_referrals_from.length > 8 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 5 }}>
                  +{memberAnalytics.gaps.missing_referrals_from.length - 8} more members
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </Box>

      {/* Action Recommendations */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircle sx={{ mr: 1 }} />
          Recommended Actions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Prioritized recommendations to improve your networking effectiveness
        </Typography>
        
        <List>
          {memberAnalytics.recommendations.map((recommendation, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemIcon>
                  <Chip
                    label={index + 1}
                    size="small"
                    color="primary"
                    sx={{ minWidth: 32, height: 24 }}
                  />
                </ListItemIcon>
                <ListItemText primary={recommendation} />
              </ListItem>
              {index < memberAnalytics.recommendations.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Analysis based on {memberAnalytics.chapter.total_members} members in {memberAnalytics.chapter.name} • 
          {memberAnalytics.latest_report.month_year && ` Latest data from ${memberAnalytics.latest_report.month_year} • `}
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default MemberDetails;