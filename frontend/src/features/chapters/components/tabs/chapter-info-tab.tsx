import React, { useMemo } from 'react';
import { Trophy, TrendingUp, DollarSign, Users, Award, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChapterMemberData } from '../../../../shared/services/ChapterDataLoader';
import { formatCurrency } from '@/lib/utils';

interface ChapterInfoTabProps {
  chapterData: ChapterMemberData;
}

const ChapterInfoTab: React.FC<ChapterInfoTabProps> = ({ chapterData }) => {
  const stats = useMemo(() => {
    const members = chapterData.members || [];

    // Calculate totals
    const totalReferrals = members.reduce((sum, m) => sum + (m.referralsGiven || 0), 0);
    const totalOTOs = members.reduce((sum, m) => sum + (m.oneToOnesAttended || 0), 0);
    const totalTYFCB = members.reduce((sum, m) => sum + (m.tyfcb || 0), 0);
    const totalVisitors = members.reduce((sum, m) => sum + (m.visitorsInvited || 0), 0);

    // Find top performers
    const topReferrer = members.reduce((max, m) =>
      (m.referralsGiven || 0) > (max.referralsGiven || 0) ? m : max, members[0] || {});

    const topOTO = members.reduce((max, m) =>
      (m.oneToOnesAttended || 0) > (max.oneToOnesAttended || 0) ? m : max, members[0] || {});

    const topTYFCB = members.reduce((max, m) =>
      (m.tyfcb || 0) > (max.tyfcb || 0) ? m : max, members[0] || {});

    const topVisitors = members.reduce((max, m) =>
      (m.visitorsInvited || 0) > (max.visitorsInvited || 0) ? m : max, members[0] || {});

    return {
      totals: { totalReferrals, totalOTOs, totalTYFCB, totalVisitors },
      topPerformers: { topReferrer, topOTO, topTYFCB, topVisitors }
    };
  }, [chapterData]);

  return (
    <div className="space-y-6">
      {/* Chapter Overview */}
      <Card className="border-l-4 border-l-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {chapterData.chapterName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold">{chapterData.memberCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chapter ID</p>
              <p className="text-lg font-semibold">{chapterData.chapterId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reports</p>
              <p className="text-lg font-semibold">{chapterData.monthlyReports?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium">{new Date(chapterData.loadedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapter Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totals.totalReferrals}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Total One-to-Ones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totals.totalOTOs}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Total TYFCB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totals.totalTYFCB)}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Total Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totals.totalVisitors}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="border-l-4 border-l-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Performers This Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Referrals */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Most Referrals Given</p>
              </div>
              <div className="pl-6">
                <p className="font-bold text-lg">{stats.topPerformers.topReferrer.name}</p>
                <Badge variant="secondary" className="mt-1">
                  {stats.topPerformers.topReferrer.referralsGiven || 0} referrals
                </Badge>
              </div>
            </div>

            {/* Most One-to-Ones */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Most One-to-Ones</p>
              </div>
              <div className="pl-6">
                <p className="font-bold text-lg">{stats.topPerformers.topOTO.name}</p>
                <Badge variant="secondary" className="mt-1">
                  {stats.topPerformers.topOTO.oneToOnesAttended || 0} meetings
                </Badge>
              </div>
            </div>

            {/* Highest TYFCB */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Highest TYFCB</p>
              </div>
              <div className="pl-6">
                <p className="font-bold text-lg">{stats.topPerformers.topTYFCB.name}</p>
                <Badge variant="secondary" className="mt-1">
                  {formatCurrency(stats.topPerformers.topTYFCB.tyfcb || 0)}
                </Badge>
              </div>
            </div>

            {/* Most Visitors */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Most Visitors Invited</p>
              </div>
              <div className="pl-6">
                <p className="font-bold text-lg">{stats.topPerformers.topVisitors.name}</p>
                <Badge variant="secondary" className="mt-1">
                  {stats.topPerformers.topVisitors.visitorsInvited || 0} visitors
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChapterInfoTab;
