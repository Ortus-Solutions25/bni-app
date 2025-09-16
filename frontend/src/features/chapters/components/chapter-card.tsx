import React from 'react';
import { Users, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { cn, formatCurrency } from '../../../shared/lib/utils';
import { ChapterMemberData } from '../../../shared/services/ChapterDataLoader';

interface ChapterCardProps {
  chapterData: ChapterMemberData;
  onClick: () => void;
  onDelete?: (chapterId: string) => void;
  isLoading?: boolean;
}


const ChapterCard: React.FC<ChapterCardProps> = ({ chapterData, onClick, onDelete, isLoading = false }) => {

  if (isLoading) {
    return (
      <Card className="h-[280px] flex items-center justify-center animate-pulse">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading {chapterData.chapterName}...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "h-[280px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer",
        "border-l-4 border-l-primary/30"
      )}
      onClick={onClick}
      data-testid={`chapter-card-${chapterData.chapterId}`}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2 pr-2" data-testid={`chapter-name-${chapterData.chapterId}`}>
          {chapterData.chapterName}
        </CardTitle>
        <div className="flex items-center gap-1">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(chapterData.chapterId);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {chapterData.loadError && (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-[calc(280px-80px)]">
        {chapterData.loadError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle className="h-12 w-12 text-destructive/50" />
            <p className="text-sm text-destructive font-medium">
              Failed to load chapter data
            </p>
            <p className="text-xs text-muted-foreground">
              {chapterData.loadError}
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Member Count */}
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {chapterData.memberCount} members
              </span>
            </div>

            {/* Performance Metrics */}
            <div className="flex-1 space-y-3">
              {chapterData.performanceMetrics && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Avg Referrals:</span>
                    <span className="text-xs font-medium">
                      {chapterData.performanceMetrics.avgReferralsPerMember}/member
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Avg OTOs:</span>
                    <span className="text-xs font-medium">
                      {chapterData.performanceMetrics.avgOTOsPerMember}/member
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total TYFCB:</span>
                    <span className="text-xs font-medium">
                      {formatCurrency(chapterData.performanceMetrics.totalTYFCB / 1000)}K
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(chapterData.loadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChapterCard;