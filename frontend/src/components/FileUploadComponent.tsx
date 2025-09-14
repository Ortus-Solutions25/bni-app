import React, { useState, useCallback } from 'react';
import {
  CloudUpload,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Loader2,
  File,
  Info,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useDropzone } from 'react-dropzone';

interface UploadFile {
  file: File;
  name: string;
  size: string;
  type: 'slip_audit' | 'member_names';
}

interface FileUploadComponentProps {
  chapterId: string;
  chapterName: string;
  onUploadSuccess: () => void;
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  chapterId,
  chapterName,
  onUploadSuccess,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  // Initialize with current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  const [monthYear, setMonthYear] = useState(getCurrentMonth());
  const [uploadOption, setUploadOption] = useState<'slip_only' | 'slip_and_members'>('slip_only');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      // Try to determine file type based on name
      const isSlipAudit = file.name.toLowerCase().includes('slip') ||
                         file.name.toLowerCase().includes('audit');

      return {
        file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: (isSlipAudit ? 'slip_audit' : 'member_names') as 'slip_audit' | 'member_names'
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    setUploadResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const changeFileType = (index: number, newType: 'slip_audit' | 'member_names') => {
    setFiles(prev => prev.map((file, i) =>
      i === index ? { ...file, type: newType } : file
    ));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadResult({type: 'error', message: 'Please select at least one file'});
      return;
    }

    if (!monthYear) {
      setUploadResult({type: 'error', message: 'Please enter month/year (e.g., 2024-08)'});
      return;
    }

    const slipAuditFile = files.find(f => f.type === 'slip_audit');
    if (!slipAuditFile) {
      setUploadResult({type: 'error', message: 'Please select at least one slip audit file'});
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('slip_audit_file', slipAuditFile.file);

      const memberNamesFile = files.find(f => f.type === 'member_names');
      if (memberNamesFile) {
        formData.append('member_names_file', memberNamesFile.file);
      }

      formData.append('chapter_id', chapterId);
      formData.append('month_year', monthYear);
      formData.append('upload_option', uploadOption);

      const response = await fetch('/api/upload/', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({
          type: 'success',
          message: `Successfully uploaded and processed ${files.length} file(s) for ${monthYear}`
        });
        setFiles([]);
        // Keep current month for next upload
        setMonthYear(getCurrentMonth());
        onUploadSuccess();
      } else {
        setUploadResult({
          type: 'error',
          message: result.error || 'Upload failed'
        });
      }
    } catch (error: any) {
      setUploadResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <CloudUpload className="h-5 w-5" />
          Upload Palms Data
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload slip audit reports from PALMS for {chapterName}
        </p>
      </div>

      <div className="space-y-6 max-w-4xl">

        {/* Month/Year and Upload Option */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2 flex-1 max-w-xs">
            <label htmlFor="month-year" className="text-sm font-medium">
              Report Month
            </label>
            <Input
              id="month-year"
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Select the month for this report
            </p>
          </div>

          <div className="space-y-2 flex-1 max-w-xs">
            <label className="text-sm font-medium">Upload Option</label>
            <Select value={uploadOption} onValueChange={(value) => setUploadOption(value as 'slip_only' | 'slip_and_members')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slip_only">Slip Audit Only</SelectItem>
                <SelectItem value="slip_and_members">Slip Audit + Member Names</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* File Drop Zone */}
        <Card>
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={`
                p-8 text-center border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
                ${isDragActive
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <CloudUpload className={`h-12 w-12 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <h3 className="text-lg font-medium">
                    {isDragActive ? 'Drop files here...' : 'Drop PALMS Files Here'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Or click to select files
                  </p>
                </div>
                <Badge variant="outline">
                  Supported formats: .xls, .xlsx
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Files */}
        {files.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <File className="h-5 w-5" />
                Selected Files ({files.length})
              </h3>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <File className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {file.size}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={file.type}
                          onValueChange={(value) => changeFileType(index, value as 'slip_audit' | 'member_names')}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slip_audit">Slip Audit</SelectItem>
                            <SelectItem value="member_names">Member Names</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant={file.type === 'slip_audit' ? 'default' : 'secondary'}>
                          {file.type === 'slip_audit' ? 'Slip Audit' : 'Member Names'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeFile(index)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        <div className="flex justify-start">
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0 || !monthYear}
            size="lg"
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CloudUpload className="h-5 w-5" />
            )}
            {isUploading ? 'Uploading...' : 'Upload & Process Files'}
          </Button>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <Alert>
            {uploadResult.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className={uploadResult.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
              {uploadResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Upload Instructions
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="font-medium text-primary min-w-[20px]">1.</span>
                <span>Select the month/year in YYYY-MM format (e.g., 2024-08 for August 2024)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-primary min-w-[20px]">2.</span>
                <span>Upload slip audit reports exported from PALMS system (.xls or .xlsx files)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-primary min-w-[20px]">3.</span>
                <span>Optionally upload member names file if you have updated member information</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-primary min-w-[20px]">4.</span>
                <span>Files will be processed automatically and matrices will be generated</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-primary min-w-[20px]">5.</span>
                <span>Use "Previous Data" tab to view processed results after upload</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FileUploadComponent;