import React, { useState } from 'react';
import { Info, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { UploadResult } from '../types/admin.types';
import { API_BASE_URL } from '@/config/api';

interface BulkUploadTabProps {
  onDataRefresh: () => void;
}

export const BulkUploadTab: React.FC<BulkUploadTabProps> = ({ onDataRefresh }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/upload/bulk/`, {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');

      let result;
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error('Server returned non-JSON response');
      }

      if (response.ok) {
        const details = result.details || result;
        setUploadResult({
          success: true,
          message: `Successfully processed! Created ${details.chapters_created || 0} chapters and ${details.members_created || 0} members.`,
          details: result.details || result,
        });

        // Delay refresh to allow user to see the success message
        setTimeout(() => {
          onDataRefresh();
        }, 3000);
      } else {
        setUploadResult({
          success: false,
          message: result.message || result.error || 'Upload failed',
          details: result,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Bulk Update</h2>
        <p className="text-muted-foreground">
          Upload a Regional PALMS Summary report to bulk create/update chapters and members.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regional PALMS Summary Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Upload a Regional PALMS Summary report (.xls file). The system will automatically:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create new chapters found in the report</li>
                <li>Create new members for each chapter</li>
                <li>Update existing chapter and member information</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
            />
            {isUploading && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>

          {uploadResult && (
            <Alert variant={uploadResult.success ? 'default' : 'destructive'}>
              {uploadResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {uploadResult.message}
                {uploadResult.details && uploadResult.success && (
                  <div className="mt-2 text-sm space-y-1">
                    <div>Chapters created: {uploadResult.details.chapters_created || 0}</div>
                    <div>Chapters updated: {uploadResult.details.chapters_updated || 0}</div>
                    <div>Members created: {uploadResult.details.members_created || 0}</div>
                    <div>Members updated: {uploadResult.details.members_updated || 0}</div>
                    <div>Total processed: {uploadResult.details.total_processed || 0} rows</div>
                    {uploadResult.details.warnings && uploadResult.details.warnings.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium">Warnings ({uploadResult.details.warnings.length}):</div>
                        <div className="text-xs text-muted-foreground">Some rows were skipped due to missing data</div>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
