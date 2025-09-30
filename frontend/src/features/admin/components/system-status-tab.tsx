import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SystemStats } from '../types/admin.types';

interface SystemStatusTabProps {
  systemStats: SystemStats;
}

export const SystemStatusTab: React.FC<SystemStatusTabProps> = ({ systemStats }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">System Status</h2>
        <p className="text-muted-foreground mb-6">
          Monitor system health and data integrity.
        </p>
      </div>

      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            System is operational. All services are running normally.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Chapters</p>
                <p className="text-2xl font-bold">{systemStats.totalChapters}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Members</p>
                <p className="text-2xl font-bold">{systemStats.totalMembers}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Reports</p>
                <p className="text-2xl font-bold">{systemStats.totalReports}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Update</p>
                <p className="text-sm font-bold">{systemStats.lastUpdated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
