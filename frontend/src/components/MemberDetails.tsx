import React, { useMemo } from 'react';
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
} from '@mui/material';
import {
  Business,
  Person,
  NavigateNext,
  TrendingUp,
  PersonAdd,
  PersonOff,
  SwapHoriz,
  MonetizationOn,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { ChapterMemberData } from '../services/ChapterDataLoader';

interface MemberDetailsProps {
  chapterData: ChapterMemberData;
  memberName: string;
  onBackToMembers: () => void;
  onBackToChapters: () => void;
}

interface MemberAnalysis {
  memberName: string;
  chapterName: string;
  totalMembers: number;
  // Performance stats
  referralsGiven: number;
  referralsReceived: number;
  oneToOnes: number;
  tyfcbAmount: number;
  performanceScore: number;
  // Gap analysis
  missingOneToOnes: string[];
  notReferredTo: string[];
  notReferredBy: string[];
  potentialConnections: string[];
  recommendations: string[];
}

const generateMemberAnalysis = (memberName: string, chapterData: ChapterMemberData): MemberAnalysis => {
  const otherMembers = chapterData.members.filter(m => m !== memberName);
  
  // Generate random performance data
  const referralsGiven = Math.floor(Math.random() * 20) + 5;
  const referralsReceived = Math.floor(Math.random() * 15) + 3;
  const oneToOnes = Math.floor(Math.random() * 12) + 8;
  const tyfcbAmount = Math.floor(Math.random() * 150000) + 20000;
  
  // Calculate performance score
  const referralScore = Math.min(referralsGiven * 2, 40);
  const receivedScore = Math.min(referralsReceived * 2, 30);
  const otoScore = Math.min(oneToOnes * 2, 30);
  const performanceScore = Math.round(referralScore + receivedScore + otoScore);
  
  // Generate gap analysis
  const shuffled = [...otherMembers].sort(() => 0.5 - Math.random());
  const missingOneToOnes = shuffled.slice(0, Math.floor(Math.random() * 8) + 3);
  const notReferredTo = shuffled.slice(2, Math.floor(Math.random() * 6) + 4);
  const notReferredBy = shuffled.slice(4, Math.floor(Math.random() * 5) + 3);
  const potentialConnections = shuffled.slice(0, 5);
  
  // Generate recommendations
  const recommendations = [
    `Schedule one-to-ones with ${missingOneToOnes.slice(0, 3).join(', ')}`,
    `Focus on referring business to ${notReferredTo.slice(0, 2).join(' and ')}`,
    `Build stronger relationships with ${potentialConnections.slice(0, 2).join(' and ')}`,
    'Attend more chapter events to increase visibility',
    'Follow up on previous referrals to track success'
  ];
  
  return {
    memberName,
    chapterName: chapterData.chapterName,
    totalMembers: chapterData.memberCount,
    referralsGiven,
    referralsReceived,
    oneToOnes,
    tyfcbAmount,
    performanceScore,
    missingOneToOnes,
    notReferredTo,
    notReferredBy,
    potentialConnections,
    recommendations
  };
};

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
  const memberAnalysis = useMemo(() => 
    generateMemberAnalysis(memberName, chapterData), 
    [memberName, chapterData]
  );

  const performanceInfo = getPerformanceColor(memberAnalysis.performanceScore);
  
  const completionRates = useMemo(() => {
    const totalPossibleOTOs = chapterData.memberCount - 1;
    const totalPossibleReferrals = chapterData.memberCount - 1;
    
    return {
      otoCompletion: Math.round((memberAnalysis.oneToOnes / totalPossibleOTOs) * 100),
      referralGivenCompletion: Math.round((memberAnalysis.referralsGiven / totalPossibleReferrals) * 100),
      referralReceivedCompletion: Math.round((memberAnalysis.referralsReceived / totalPossibleReferrals) * 100)
    };
  }, [memberAnalysis, chapterData.memberCount]);

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
          {chapterData.chapterName}
        </Link>
        <Typography color="text.primary">{memberName}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Person sx={{ mr: 2, fontSize: 40 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            {memberName}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Member of {chapterData.chapterName}
          </Typography>
        </Box>
        <Chip
          label={`${memberAnalysis.performanceScore}% Performance`}
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
                <Typography variant="body2">{memberAnalysis.performanceScore}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memberAnalysis.performanceScore}
                color={performanceInfo.color}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="h4" color="primary">
                  {memberAnalysis.referralsGiven}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Referrals Given
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="primary">
                  {memberAnalysis.referralsReceived}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Referrals Received
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="primary">
                  {memberAnalysis.oneToOnes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  One-to-Ones
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="primary">
                  AED {(memberAnalysis.tyfcbAmount / 1000).toFixed(0)}K
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
                <Typography variant="body2">{completionRates.otoCompletion}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionRates.otoCompletion}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Referrals Given Coverage</Typography>
                <Typography variant="body2">{completionRates.referralGivenCompletion}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionRates.referralGivenCompletion}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Referrals Received Coverage</Typography>
                <Typography variant="body2">{completionRates.referralReceivedCompletion}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionRates.referralReceivedCompletion}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Based on {chapterData.memberCount - 1} possible connections
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
            
            {memberAnalysis.missingOneToOnes.length === 0 ? (
              <Alert severity="success">
                Great! You've had one-to-ones with all chapter members.
              </Alert>
            ) : (
              <List dense>
                {memberAnalysis.missingOneToOnes.slice(0, 8).map((member) => (
                  <ListItem key={member} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={member} />
                  </ListItem>
                ))}
                {memberAnalysis.missingOneToOnes.length > 8 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 5 }}>
                    +{memberAnalysis.missingOneToOnes.length - 8} more members
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
              {memberAnalysis.notReferredTo.slice(0, 8).map((member) => (
                <ListItem key={member} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <TrendingUp fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={member} />
                </ListItem>
              ))}
              {memberAnalysis.notReferredTo.length > 8 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 5 }}>
                  +{memberAnalysis.notReferredTo.length - 8} more members
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
              {memberAnalysis.notReferredBy.slice(0, 8).map((member) => (
                <ListItem key={member} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <MonetizationOn fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={member} />
                </ListItem>
              ))}
              {memberAnalysis.notReferredBy.length > 8 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 5 }}>
                  +{memberAnalysis.notReferredBy.length - 8} more members
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
          {memberAnalysis.recommendations.map((recommendation, index) => (
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
              {index < memberAnalysis.recommendations.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Analysis based on chapter membership of {chapterData.memberCount} members • Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default MemberDetails;