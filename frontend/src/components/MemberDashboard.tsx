import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Card,
  CardContent,
  CardActionArea,
  Breadcrumbs,
  Link,
  Chip,
  Alert,
} from '@mui/material';
import {
  Search,
  Person,
  TrendingUp,
  Business,
  NavigateNext,
} from '@mui/icons-material';
import { ChapterMemberData } from '../services/ChapterDataLoader';

interface MemberDashboardProps {
  chapterData: ChapterMemberData;
  onMemberSelect: (memberName: string) => void;
  onBackToChapters: () => void;
}

interface MemberStats {
  name: string;
  totalReferralsGiven: number;
  totalReferralsReceived: number;
  totalOTOs: number;
  tyfcbAmount: number;
  performanceScore: number;
}

const generateMemberStats = (members: string[]): MemberStats[] => {
  return members.map(member => ({
    name: member,
    totalReferralsGiven: Math.floor(Math.random() * 20) + 5,
    totalReferralsReceived: Math.floor(Math.random() * 15) + 3,
    totalOTOs: Math.floor(Math.random() * 12) + 8,
    tyfcbAmount: Math.floor(Math.random() * 150000) + 20000,
    performanceScore: Math.floor(Math.random() * 40) + 60,
  }));
};

const getPerformanceColor = (score: number): 'success' | 'warning' | 'error' => {
  if (score >= 85) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
};

const MemberDashboard: React.FC<MemberDashboardProps> = ({
  chapterData,
  onMemberSelect,
  onBackToChapters,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'referrals' | 'otos' | 'performance'>('name');

  const memberStats = useMemo(() => generateMemberStats(chapterData.members), [chapterData.members]);

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = memberStats.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'referrals':
          return b.totalReferralsGiven - a.totalReferralsGiven;
        case 'otos':
          return b.totalOTOs - a.totalOTOs;
        case 'performance':
          return b.performanceScore - a.performanceScore;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [memberStats, searchTerm, sortBy]);

  const chapterSummary = useMemo(() => {
    if (memberStats.length === 0) {
      return {
        totalReferrals: 0,
        totalOTOs: 0,
        totalTYFCB: 0,
        avgPerformance: 0,
        topPerformer: 'N/A'
      };
    }

    const totalReferrals = memberStats.reduce((sum, member) => sum + member.totalReferralsGiven, 0);
    const totalOTOs = memberStats.reduce((sum, member) => sum + member.totalOTOs, 0);
    const totalTYFCB = memberStats.reduce((sum, member) => sum + member.tyfcbAmount, 0);
    const avgPerformance = Math.round(memberStats.reduce((sum, member) => sum + member.performanceScore, 0) / memberStats.length);

    return {
      totalReferrals,
      totalOTOs,
      totalTYFCB,
      avgPerformance,
      topPerformer: memberStats.reduce((prev, current) => 
        prev.performanceScore > current.performanceScore ? prev : current
      ).name
    };
  }, [memberStats]);

  if (chapterData.loadError) {
    return (
      <Box>
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
          <Typography color="text.primary">{chapterData.chapterName}</Typography>
        </Breadcrumbs>
        
        <Alert severity="error">
          Failed to load member data for {chapterData.chapterName}: {chapterData.loadError}
        </Alert>
      </Box>
    );
  }

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
        <Typography color="text.primary">{chapterData.chapterName}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Person sx={{ mr: 2 }} />
        {chapterData.chapterName} Members
      </Typography>

      {/* Chapter Summary */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" color="primary">
              {chapterData.memberCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Members
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" color="primary">
              {chapterSummary.totalReferrals}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Referrals
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" color="primary">
              {chapterSummary.totalOTOs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total OTOs
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" color="primary">
              AED {(chapterSummary.totalTYFCB / 1000).toFixed(0)}K
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total TYFCB
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" color="primary">
              {chapterSummary.avgPerformance}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Performance
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Filter Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 300 }}
        />
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <MenuItem value="name">Member Name</MenuItem>
            <MenuItem value="referrals">Referrals Given</MenuItem>
            <MenuItem value="otos">One-to-Ones</MenuItem>
            <MenuItem value="performance">Performance</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Member Grid */}
      {filteredAndSortedMembers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No members found matching your search
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {filteredAndSortedMembers.map((member) => (
            <Card
              key={member.name}
              sx={{
                height: 200,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                }
              }}
            >
              <CardActionArea
                onClick={() => onMemberSelect(member.name)}
                sx={{ height: '100%' }}
              >
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '1rem' }}>
                      {member.name}
                    </Typography>
                    <Chip
                      label={`${member.performanceScore}%`}
                      color={getPerformanceColor(member.performanceScore)}
                      size="small"
                      icon={<TrendingUp />}
                    />
                  </Box>

                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Referrals Given:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {member.totalReferralsGiven}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Referrals Received:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {member.totalReferralsReceived}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        One-to-Ones:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {member.totalOTOs}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        TYFCB:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        AED {(member.tyfcbAmount / 1000).toFixed(0)}K
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Showing {filteredAndSortedMembers.length} of {chapterData.memberCount} members from {chapterData.chapterName}
        </Typography>
      </Box>
    </Box>
  );
};

export default MemberDashboard;