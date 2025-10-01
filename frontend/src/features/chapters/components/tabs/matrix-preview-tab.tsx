import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid3X3 } from 'lucide-react';
import { ChapterMemberData } from '../../../../shared/services/ChapterDataLoader';
import MatrixTab from '../../../analytics/components/matrix-tab';

interface MatrixPreviewTabProps {
  chapterData: ChapterMemberData;
  onMemberSelect: (memberName: string) => void;
  refreshKey: number;
}

const MatrixPreviewTab: React.FC<MatrixPreviewTabProps> = ({
  chapterData,
  onMemberSelect,
  refreshKey
}) => {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-primary" />
            Current Matrices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MatrixTab
            chapterData={chapterData}
            onMemberSelect={onMemberSelect}
            key={refreshKey}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MatrixPreviewTab;
