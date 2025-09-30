# Frontend Refactoring Task - Detailed Instructions

## Context
You are working on a BNI (Business Networking International) analytics application. The frontend is a React + TypeScript application built with Tailwind CSS and Radix UI components. The codebase has grown organically with some components exceeding 800 lines, poor type safety (18 files using `any`), and lacking proper separation of concerns. This needs professional refactoring before adding database features.

## Your Branch
Create and work on branch: `refactor/frontend-restructure`

## Current Problems
1. **Massive components**: admin-dashboard.tsx (849 lines), member-details.tsx (755 lines), matrix-tab.tsx (670 lines)
2. **Poor type safety**: 18 files using `any` type
3. **Monolithic service**: ChapterDataLoader.ts (520 lines) doing too much
4. **No custom hooks**: Repeated patterns (loading states, API calls, forms)
5. **Props drilling**: Data passed through multiple component levels
6. **Code duplication**: Similar patterns across components

## Your Mission: Frontend Refactoring

### Phase 1: Split Large Components (Day 1-2)

**Goal**: Break down components over 400 lines into focused, composable pieces

#### 1. Refactor admin-dashboard.tsx (849 lines)

**Current Structure**:
```typescript
// admin-dashboard.tsx (849 lines - everything in one file)
const AdminDashboard = () => {
  // Member management logic
  // Chapter management logic
  // Bulk upload logic
  // System settings logic
  // All state and handlers
  return (
    <Tabs>
      <TabsContent value="members">{/* 250 lines */}</TabsContent>
      <TabsContent value="chapters">{/* 200 lines */}</TabsContent>
      <TabsContent value="bulk">{/* 200 lines */}</TabsContent>
      <TabsContent value="settings">{/* 199 lines */}</TabsContent>
    </Tabs>
  );
};
```

**Target Structure**:
```
src/features/admin/
├── components/
│   ├── admin-dashboard.tsx (main container, ~150 lines)
│   ├── member-management-tab.tsx (~200 lines)
│   ├── chapter-management-tab.tsx (~200 lines)
│   ├── bulk-upload-tab.tsx (~200 lines)
│   └── system-settings-tab.tsx (~150 lines)
├── hooks/
│   ├── useAdminData.ts
│   ├── useMemberManagement.ts
│   └── useChapterManagement.ts
└── types/
    └── admin.types.ts
```

**Step-by-Step**:

1. **Create admin.types.ts**:
```typescript
// src/features/admin/types/admin.types.ts
export interface AdminMember {
  id: string;
  name: string;
  chapterName: string;
  chapterId: string;
  email?: string;
  phone?: string;
  businessName?: string;
  classification?: string;
}

export interface AdminChapter {
  chapterId: string;
  chapterName: string;
  memberCount: number;
  monthlyReports: number;
  lastUpdated: Date;
}

export interface MemberFilters {
  searchTerm: string;
  chapterFilter: string;
  classificationFilter?: string;
}
```

2. **Extract MemberManagementTab**:
```typescript
// src/features/admin/components/member-management-tab.tsx
import React, { useState, useMemo } from 'react';
import { AdminMember, MemberFilters } from '../types/admin.types';
import { useMemberManagement } from '../hooks/useMemberManagement';

interface MemberManagementTabProps {
  chapterData: ChapterMemberData[];
  onDataRefresh: () => void;
}

export const MemberManagementTab: React.FC<MemberManagementTabProps> = ({
  chapterData,
  onDataRefresh,
}) => {
  const {
    members,
    filters,
    setFilters,
    selectedMembers,
    handleMemberSelect,
    handleBulkDelete,
    exportMemberData,
  } = useMemberManagement(chapterData);

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      {/* Member table */}
      {/* Bulk actions */}
    </div>
  );
};
```

3. **Extract ChapterManagementTab**:
```typescript
// src/features/admin/components/chapter-management-tab.tsx
import React from 'react';
import { useChapterManagement } from '../hooks/useChapterManagement';

interface ChapterManagementTabProps {
  chapterData: ChapterMemberData[];
  onDataRefresh: () => void;
}

export const ChapterManagementTab: React.FC<ChapterManagementTabProps> = ({
  chapterData,
  onDataRefresh,
}) => {
  const {
    showAddForm,
    formData,
    isSubmitting,
    handleFormChange,
    handleSubmit,
    handleDelete,
  } = useChapterManagement(onDataRefresh);

  return (
    <div className="space-y-6">
      {/* Add chapter form */}
      {/* Chapter list */}
    </div>
  );
};
```

4. **Update main AdminDashboard**:
```typescript
// src/features/admin/components/admin-dashboard.tsx (~150 lines)
import { MemberManagementTab } from './member-management-tab';
import { ChapterManagementTab } from './chapter-management-tab';
import { BulkUploadTab } from './bulk-upload-tab';
import { SystemSettingsTab } from './system-settings-tab';

const AdminDashboard: React.FC = () => {
  const [chapterData, setChapterData] = useState<ChapterMemberData[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDataRefresh = useCallback(async () => {
    const data = await loadAllChapterData();
    setChapterData(data);
  }, []);

  useEffect(() => {
    handleDataRefresh();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Member Management</TabsTrigger>
          <TabsTrigger value="chapters">Chapter Management</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MemberManagementTab
            chapterData={chapterData}
            onDataRefresh={handleDataRefresh}
          />
        </TabsContent>

        <TabsContent value="chapters">
          <ChapterManagementTab
            chapterData={chapterData}
            onDataRefresh={handleDataRefresh}
          />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkUploadTab onDataRefresh={handleDataRefresh} />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

#### 2. Refactor member-details.tsx (755 lines)

**Target Structure**:
```
src/features/members/
├── components/
│   ├── member-details.tsx (main container, ~150 lines)
│   ├── member-profile-card.tsx (~150 lines)
│   ├── member-stats-section.tsx (~150 lines)
│   ├── member-interactions-section.tsx (~200 lines)
│   └── missing-connections-section.tsx (~150 lines)
├── hooks/
│   ├── useMemberDetail.ts
│   └── useMemberStats.ts
└── types/
    └── member.types.ts
```

**Step-by-Step**:

1. **Create member.types.ts**:
```typescript
// src/features/members/types/member.types.ts
export interface MemberProfile {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  businessName: string;
  classification: string;
  email: string;
  phone: string;
}

export interface MemberStats {
  referralsGiven: number;
  referralsReceived: number;
  oneToOnesCompleted: number;
  tyfcbInside: number;
  tyfcbOutside: number;
}

export interface MissingConnection {
  id: number;
  name: string;
  type: 'oto' | 'referral_given' | 'referral_received';
}
```

2. **Extract MemberProfileCard**:
```typescript
// src/features/members/components/member-profile-card.tsx
import { MemberProfile } from '../types/member.types';

interface MemberProfileCardProps {
  profile: MemberProfile;
  chapterName: string;
}

export const MemberProfileCard: React.FC<MemberProfileCardProps> = ({
  profile,
  chapterName,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{profile.fullName}</CardTitle>
        <CardDescription>{profile.businessName}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Profile details */}
      </CardContent>
    </Card>
  );
};
```

3. **Extract MemberStatsSection**:
```typescript
// src/features/members/components/member-stats-section.tsx
import { MemberStats } from '../types/member.types';

interface MemberStatsSectionProps {
  stats: MemberStats;
  monthYear: string;
}

export const MemberStatsSection: React.FC<MemberStatsSectionProps> = ({
  stats,
  monthYear,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Referrals Given"
        value={stats.referralsGiven}
        icon={<ArrowRight />}
      />
      {/* Other stats */}
    </div>
  );
};
```

#### 3. Refactor matrix-tab.tsx (670 lines)

**Target Structure**:
```
src/features/analytics/
├── components/
│   ├── matrix-tab.tsx (main container, ~150 lines)
│   ├── matrix-selector.tsx (~100 lines)
│   ├── matrix-display.tsx (~200 lines)
│   ├── matrix-legend.tsx (~100 lines)
│   └── matrix-export-button.tsx (~50 lines)
├── hooks/
│   ├── useMatrixData.ts
│   └── useMatrixVisualization.ts
└── types/
    └── matrix.types.ts
```

### Phase 2: Fix Type Safety - Remove `any` (Day 2-3)

**Goal**: Replace all `any` types with proper TypeScript interfaces

**Create Comprehensive Type Definitions**:

```typescript
// src/shared/types/api.types.ts
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
  type?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

```typescript
// src/shared/types/chapter.types.ts
export interface Chapter {
  id: number;
  name: string;
  location?: string;
  meetingDay?: string;
  meetingTime?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterWithMembers extends Chapter {
  members: Member[];
}

export interface ChapterWithStats extends Chapter {
  avgReferralsPerMember: number;
  avgOTOsPerMember: number;
  totalTYFCB: number;
  topPerformer: string;
}
```

```typescript
// src/shared/types/report.types.ts
export interface MonthlyReport {
  id: number;
  chapterId: number;
  monthYear: string;
  uploadedAt: string;
  processedAt: string | null;
  slipAuditFile: string | null;
  memberNamesFile: string | null;
  hasReferralMatrix: boolean;
  hasOTOMatrix: boolean;
  hasCombinationMatrix: boolean;
}

export interface MatrixData {
  members: string[];
  matrix: number[][];
  summary: MatrixSummary;
}

export interface MatrixSummary {
  totalInteractions: number;
  avgInteractionsPerMember: number;
  topPerformers: TopPerformer[];
}
```

**Find and Replace `any`**:

```bash
# Find all files using any
cd frontend
grep -r "any" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

**Before**:
```typescript
const handleUpload = async (files: any) => {
  const result: any = await uploadFiles(files);
  return result;
};
```

**After**:
```typescript
interface UploadResult {
  success: boolean;
  reportId: number;
  message: string;
}

const handleUpload = async (files: File[]): Promise<UploadResult> => {
  const result = await uploadFiles(files);
  return result;
};
```

### Phase 3: Create Custom Hooks (Day 3-4)

**Goal**: Extract repeated patterns into reusable custom hooks

#### 1. useAsync Hook

```typescript
// src/shared/hooks/useAsync.ts
import { useState, useEffect, useCallback } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: () => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
```

**Usage**:
```typescript
// Before (repetitive)
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await loadChapterData();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

// After (clean)
const { data, loading, error, execute } = useAsync(loadChapterData);
```

#### 2. useApiCall Hook

```typescript
// src/shared/hooks/useApiCall.ts
import { useState, useCallback } from 'react';
import { ApiError } from '../types/api.types';

interface UseApiCallReturn<T, P extends any[]> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: P) => Promise<T | null>;
  reset: () => void;
}

export function useApiCall<T, P extends any[] = []>(
  apiFunction: (...args: P) => Promise<T>
): UseApiCallReturn<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err: any) {
        const apiError: ApiError = {
          error: err.message || 'An error occurred',
          details: err.details,
          type: err.type,
        };
        setError(apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
```

**Usage**:
```typescript
const { data, loading, error, execute } = useApiCall(uploadMonthlyReport);

const handleUpload = async () => {
  const result = await execute(chapterId, files, monthYear);
  if (result) {
    toast.success('Upload successful!');
  }
};
```

#### 3. useFormState Hook

```typescript
// src/shared/hooks/useFormState.ts
import { useState, useCallback, ChangeEvent } from 'react';

interface UseFormStateReturn<T> {
  formData: T;
  handleChange: (field: keyof T) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  resetForm: () => void;
}

export function useFormState<T extends Record<string, any>>(
  initialState: T
): UseFormStateReturn<T> {
  const [formData, setFormData] = useState<T>(initialState);

  const handleChange = useCallback((field: keyof T) => {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialState);
  }, [initialState]);

  return { formData, handleChange, setFormData, resetForm };
}
```

**Usage**:
```typescript
// Before (repetitive)
const [formData, setFormData] = useState({ name: '', email: '' });
const handleNameChange = (e) => setFormData({ ...formData, name: e.target.value });
const handleEmailChange = (e) => setFormData({ ...formData, email: e.target.value });

// After (clean)
const { formData, handleChange } = useFormState({ name: '', email: '' });

<Input value={formData.name} onChange={handleChange('name')} />
<Input value={formData.email} onChange={handleChange('email')} />
```

#### 4. usePagination Hook

```typescript
// src/shared/hooks/usePagination.ts
import { useState, useMemo } from 'react';

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  paginatedItems: (items: T[]) => T[];
  pageNumbers: number[];
}

export function usePagination<T>({
  totalItems,
  itemsPerPage,
  initialPage = 1,
}: UsePaginationProps): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const previousPage = () => goToPage(currentPage - 1);

  const paginatedItems = (items: T[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  return {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    paginatedItems,
    pageNumbers,
  };
}
```

#### 5. useDebounce Hook

```typescript
// src/shared/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Usage**:
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearchTerm) {
    // Perform search with debounced value
    searchMembers(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

### Phase 4: Refactor Services Layer (Day 4-5)

**Goal**: Split ChapterDataLoader.ts (520 lines) into focused API services

**Target Structure**:
```
src/shared/services/
├── api/
│   ├── client.ts (axios instance with interceptors)
│   ├── chapterApi.ts
│   ├── memberApi.ts
│   ├── reportApi.ts
│   ├── matrixApi.ts
│   └── comparisonApi.ts
└── ChapterDataLoader.ts (backward compatibility wrapper)
```

#### Create API Client

```typescript
// src/shared/services/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error.message);
      }
    );
  }

  get<T>(url: string): Promise<T> {
    return this.client.get(url);
  }

  post<T>(url: string, data?: any): Promise<T> {
    return this.client.post(url, data);
  }

  put<T>(url: string, data?: any): Promise<T> {
    return this.client.put(url, data);
  }

  delete<T>(url: string): Promise<T> {
    return this.client.delete(url);
  }

  upload<T>(url: string, formData: FormData): Promise<T> {
    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const apiClient = new ApiClient();
```

#### Create Feature-Specific API Services

```typescript
// src/shared/services/api/chapterApi.ts
import { apiClient } from './client';
import { Chapter, ChapterWithStats } from '../../types/chapter.types';

export const chapterApi = {
  getAll: (): Promise<ChapterWithStats[]> => {
    return apiClient.get('/chapters/');
  },

  getById: (id: string): Promise<Chapter> => {
    return apiClient.get(`/chapters/${id}/`);
  },

  create: (data: Partial<Chapter>): Promise<Chapter> => {
    return apiClient.post('/chapters/', data);
  },

  update: (id: string, data: Partial<Chapter>): Promise<Chapter> => {
    return apiClient.put(`/chapters/${id}/`, data);
  },

  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/chapters/${id}/`);
  },
};
```

```typescript
// src/shared/services/api/reportApi.ts
import { apiClient } from './client';
import { MonthlyReport } from '../../types/report.types';

export const reportApi = {
  getByChapter: (chapterId: string): Promise<MonthlyReport[]> => {
    return apiClient.get(`/chapters/${chapterId}/reports/`);
  },

  getById: (chapterId: string, reportId: number): Promise<MonthlyReport> => {
    return apiClient.get(`/chapters/${chapterId}/reports/${reportId}/`);
  },

  delete: (chapterId: string, reportId: number): Promise<void> => {
    return apiClient.delete(`/chapters/${chapterId}/reports/${reportId}/`);
  },

  upload: (chapterId: string, formData: FormData): Promise<any> => {
    return apiClient.upload('/upload/', formData);
  },
};
```

```typescript
// src/shared/services/api/matrixApi.ts
import { apiClient } from './client';
import { MatrixData } from '../../types/report.types';

export const matrixApi = {
  getReferralMatrix: (
    chapterId: string,
    reportId: number
  ): Promise<MatrixData> => {
    return apiClient.get(
      `/chapters/${chapterId}/reports/${reportId}/referral-matrix/`
    );
  },

  getOTOMatrix: (
    chapterId: string,
    reportId: number
  ): Promise<MatrixData> => {
    return apiClient.get(
      `/chapters/${chapterId}/reports/${reportId}/one-to-one-matrix/`
    );
  },

  getCombinationMatrix: (
    chapterId: string,
    reportId: number
  ): Promise<MatrixData> => {
    return apiClient.get(
      `/chapters/${chapterId}/reports/${reportId}/combination-matrix/`
    );
  },
};
```

```typescript
// src/shared/services/api/comparisonApi.ts
import { apiClient } from './client';
import { ComparisonData } from '../../types/comparison.types';

export const comparisonApi = {
  compareReports: (
    chapterId: string,
    currentReportId: number,
    previousReportId: number
  ): Promise<ComparisonData> => {
    return apiClient.get(
      `/chapters/${chapterId}/reports/${currentReportId}/compare/${previousReportId}/`
    );
  },

  compareReferrals: (
    chapterId: string,
    currentReportId: number,
    previousReportId: number
  ): Promise<any> => {
    return apiClient.get(
      `/chapters/${chapterId}/reports/${currentReportId}/compare/${previousReportId}/referrals/`
    );
  },

  // ... other comparison methods
};
```

### Phase 5: Add Error Boundaries (Day 5)

**Goal**: Graceful error handling at feature level

```typescript
// src/shared/components/error-boundary.tsx
import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We encountered an unexpected error. Please try again.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset}>Try Again</Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

**Usage**:
```typescript
// Wrap feature components
<ErrorBoundary>
  <AdminDashboard />
</ErrorBoundary>

<ErrorBoundary>
  <MemberDetails />
</ErrorBoundary>
```

## Testing Your Changes

```bash
# Type check
npm run type-check

# Run tests
npm test

# Build
npm run build

# Check bundle size
npm run analyze
```

## Commit Strategy

```bash
# After splitting components
git add .
git commit -m "Refactor admin dashboard into focused components"

# After fixing types
git add .
git commit -m "Replace any types with proper TypeScript interfaces"

# After custom hooks
git add .
git commit -m "Add reusable custom hooks (useAsync, useApiCall, etc.)"

# After services refactor
git add .
git commit -m "Split ChapterDataLoader into feature-specific API services"

# After error boundaries
git add .
git commit -m "Add error boundaries for graceful error handling"
```

## Success Criteria

- [ ] No component over 400 lines
- [ ] No files using `any` type
- [ ] 5+ custom hooks created and used
- [ ] API services split into focused files
- [ ] Error boundaries implemented
- [ ] All type errors resolved
- [ ] Tests passing
- [ ] Build successful

## Notes

- **Maintain backward compatibility** during refactoring
- **Test incrementally** after each major change
- **Keep the app running** - refactor without breaking functionality
- **Document new patterns** in comments
- **Ask for help** if stuck on TypeScript errors

Good luck! Focus on clean, maintainable, and type-safe code.
