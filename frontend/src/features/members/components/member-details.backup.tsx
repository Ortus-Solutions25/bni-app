import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  User,
  ChevronRight,
  UserPlus,
  UserMinus,
  ArrowLeftRight,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import { ChapterMemberData } from '../../../shared/services/ChapterDataLoader';

interface MemberDetailsProps {
  chapterData: ChapterMemberData;
  memberName: string;
  onBackToMembers: () => void;
  onBackToChapters: () => void;
  onDataRefresh?: () => void;
}

interface MemberAnalytics {
  member: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    business_name: string;
    classification: string;
    email: string;
    phone: string;
    joined_date?: string;
    is_active?: boolean;
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

const getPerformanceColor = (score: number): { variant: 'success' | 'secondary' | 'destructive'; icon: React.ReactElement } => {
  if (score >= 85) return { variant: 'success', icon: <CheckCircle className="w-4 h-4" /> };
  if (score >= 70) return { variant: 'secondary', icon: <AlertTriangle className="w-4 h-4" /> };
  return { variant: 'destructive', icon: <AlertCircle className="w-4 h-4" /> };
};

const MemberDetails: React.FC<MemberDetailsProps> = ({
  chapterData,
  memberName,
  onBackToMembers,
  onBackToChapters,
  onDataRefresh,
}) => {
  const [memberAnalytics, setMemberAnalytics] = useState<MemberAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    classification: '',
    email: '',
    phone: '',
    joined_date: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  // Handler functions for edit and delete
  const handleEditMember = () => {
    if (memberAnalytics) {
      setFormData({
        first_name: memberAnalytics.member.first_name || '',
        last_name: memberAnalytics.member.last_name || '',
        business_name: memberAnalytics.member.business_name || '',
        classification: memberAnalytics.member.classification || '',
        email: memberAnalytics.member.email || '',
        phone: memberAnalytics.member.phone || '',
        joined_date: memberAnalytics.member.joined_date || '',
        is_active: memberAnalytics.member.is_active ?? true,
      });
      setOpenEditDialog(true);
    }
  };

  const handleDeleteMember = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'is_active' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateMember = async () => {
    if (!memberAnalytics) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/api/chapters/${chapterData.chapterId}/members/${memberAnalytics.member.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Member updated successfully!",
        });
        setOpenEditDialog(false);
        // Refresh member analytics
        const fetchMemberAnalytics = async () => {
          const encodedMemberName = encodeURIComponent(memberName);
          const response = await fetch(`/api/chapters/${chapterData.chapterId}/members/${encodedMemberName}/analytics/`);
          if (response.ok) {
            const data = await response.json();
            setMemberAnalytics(data);
          }
        };
        fetchMemberAnalytics();
        // Trigger parent data refresh
        if (onDataRefresh) {
          onDataRefresh();
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: `Error: ${errorData.error || 'Failed to update member'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: 'Failed to update member. Please try again.',
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!memberAnalytics) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/api/chapters/${chapterData.chapterId}/members/${memberAnalytics.member.id}/delete/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Member "${memberAnalytics.member.full_name}" deleted successfully!`,
        });
        setOpenDeleteDialog(false);
        // Trigger parent data refresh
        if (onDataRefresh) {
          onDataRefresh();
        }
        // Navigate back to members list
        setTimeout(() => {
          onBackToMembers();
        }, 1500);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: `Error: ${errorData.error || 'Failed to delete member'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: 'Failed to delete member. Please try again.',
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-8">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Loading Member Analytics...
        </h2>
        <p className="text-muted-foreground">
          Analyzing referrals, one-to-ones, and TYFCB data
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load member analytics: {error}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBackToMembers}>
            Back to Members
          </Button>
          <Button variant="outline" onClick={onBackToChapters}>
            Back to Chapters
          </Button>
        </div>
      </div>
    );
  }

  if (!memberAnalytics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No analytics data available for this member.
        </AlertDescription>
      </Alert>
    );
  }

  const performanceInfo = getPerformanceColor(memberAnalytics.performance.performance_score);

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button
                onClick={onBackToChapters}
                className="flex items-center hover:text-foreground"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Chapters
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="w-4 h-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button
                onClick={onBackToMembers}
                className="hover:text-foreground"
              >
                {memberAnalytics.chapter.name}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="w-4 h-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{memberAnalytics.member.full_name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center mb-8">
        <User className="mr-4 h-10 w-10 text-muted-foreground" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">
            {memberAnalytics.member.full_name}
          </h1>
          <p className="text-lg text-muted-foreground mb-1">
            {memberAnalytics.member.business_name} • {memberAnalytics.member.classification}
          </p>
          <p className="text-sm text-muted-foreground">
            Member of {memberAnalytics.chapter.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditMember}
            className="hover:bg-primary hover:text-primary-foreground"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteMember}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Badge variant={performanceInfo.variant} className="text-sm px-3 py-1">
            {performanceInfo.icon}
            <span className="ml-1">{memberAnalytics.performance.performance_score}% Performance</span>
          </Badge>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              📊 Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Overall Performance</span>
                <span className="text-sm font-medium">{memberAnalytics.performance.performance_score}%</span>
              </div>
              <Progress
                value={memberAnalytics.performance.performance_score}
                className="h-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {memberAnalytics.performance.referrals_given}
                </div>
                <div className="text-sm text-muted-foreground">
                  Referrals Given
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {memberAnalytics.performance.referrals_received}
                </div>
                <div className="text-sm text-muted-foreground">
                  Referrals Received
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {memberAnalytics.performance.one_to_ones}
                </div>
                <div className="text-sm text-muted-foreground">
                  One-to-Ones
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">
                  AED {(memberAnalytics.performance.tyfcb_amount / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-muted-foreground">
                  TYFCB Generated
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              📈 Completion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">One-to-One Meetings</span>
                  <span className="text-sm font-medium">{memberAnalytics.completion_rates.oto_completion}%</span>
                </div>
                <Progress
                  value={memberAnalytics.completion_rates.oto_completion}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Referrals Given Coverage</span>
                  <span className="text-sm font-medium">{memberAnalytics.completion_rates.referral_given_coverage}%</span>
                </div>
                <Progress
                  value={memberAnalytics.completion_rates.referral_given_coverage}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Referrals Received Coverage</span>
                  <span className="text-sm font-medium">{memberAnalytics.completion_rates.referral_received_coverage}%</span>
                </div>
                <Progress
                  value={memberAnalytics.completion_rates.referral_received_coverage}
                  className="h-2"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Based on {memberAnalytics.chapter.total_members - 1} possible connections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gap Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <UserPlus className="mr-2 h-5 w-5" />
              Missing One-to-Ones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Members you haven't met with yet
            </p>
            
            {memberAnalytics.gaps.missing_one_to_ones.length === 0 ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Great! You've had one-to-ones with all chapter members.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {memberAnalytics.gaps.missing_one_to_ones.slice(0, 8).map((member) => (
                  <div key={member.id} className="flex items-center py-2">
                    <User className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span className="text-sm">{member.name}</span>
                  </div>
                ))}
                {memberAnalytics.gaps.missing_one_to_ones.length > 8 && (
                  <p className="text-sm text-muted-foreground mt-2 ml-7">
                    +{memberAnalytics.gaps.missing_one_to_ones.length - 8} more members
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ArrowLeftRight className="mr-2 h-5 w-5" />
              Referral Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Members you could refer business to
            </p>
            
            <div className="space-y-2">
              {memberAnalytics.gaps.missing_referrals_to.slice(0, 8).map((member) => (
                <div key={member.id} className="flex items-center py-2">
                  <TrendingUp className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span className="text-sm">{member.name}</span>
                </div>
              ))}
              {memberAnalytics.gaps.missing_referrals_to.length > 8 && (
                <p className="text-sm text-muted-foreground mt-2 ml-7">
                  +{memberAnalytics.gaps.missing_referrals_to.length - 8} more members
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <UserMinus className="mr-2 h-5 w-5" />
              Potential Referral Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Members who could refer business to you
            </p>
            
            <div className="space-y-2">
              {memberAnalytics.gaps.missing_referrals_from.slice(0, 8).map((member) => (
                <div key={member.id} className="flex items-center py-2">
                  <DollarSign className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span className="text-sm">{member.name}</span>
                </div>
              ))}
              {memberAnalytics.gaps.missing_referrals_from.length > 8 && (
                <p className="text-sm text-muted-foreground mt-2 ml-7">
                  +{memberAnalytics.gaps.missing_referrals_from.length - 8} more members
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Recommendations */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <CheckCircle className="mr-2 h-5 w-5" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Prioritized recommendations to improve your networking effectiveness
          </p>
        
          <div className="space-y-4">
            {memberAnalytics.recommendations.map((recommendation, index) => (
              <div key={index}>
                <div className="flex items-start py-3">
                  <Badge variant="default" className="mr-3 mt-1">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{recommendation}</span>
                </div>
                {index < memberAnalytics.recommendations.length - 1 && (
                  <Separator className="my-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 pt-6 border-t">
        <p className="text-sm text-muted-foreground text-center">
          Analysis based on {memberAnalytics.chapter.total_members} members in {memberAnalytics.chapter.name} •
          {memberAnalytics.latest_report.month_year && ` Latest data from ${memberAnalytics.latest_report.month_year} • `}
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <Input
              placeholder="First Name"
              value={formData.first_name}
              onChange={handleFormChange('first_name')}
              required
            />
            <Input
              placeholder="Last Name"
              value={formData.last_name}
              onChange={handleFormChange('last_name')}
              required
            />
            <Input
              placeholder="Business Name"
              value={formData.business_name}
              onChange={handleFormChange('business_name')}
              className="sm:col-span-2"
            />
            <Input
              placeholder="Classification (e.g., Accountant, Lawyer)"
              value={formData.classification}
              onChange={handleFormChange('classification')}
            />
            <Input
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={handleFormChange('email')}
            />
            <Input
              placeholder="Phone"
              value={formData.phone}
              onChange={handleFormChange('phone')}
            />
            <Input
              placeholder="Joined Date"
              type="date"
              value={formData.joined_date}
              onChange={handleFormChange('joined_date')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMember}
              disabled={isSubmitting || !formData.first_name || !formData.last_name}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete "{memberAnalytics?.member.full_name}"?
            This action cannot be undone and will remove all associated data including
            performance metrics, referral history, and analytics.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MemberDetails;