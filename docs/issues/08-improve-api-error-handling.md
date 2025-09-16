# Improve API Error Handling and User Feedback

## Objective
Implement comprehensive API error handling with user-friendly error messages, proper retry mechanisms, and graceful degradation for network failures.

## Context
The application relies heavily on API calls for chapter data, member management, and file uploads. Currently, API errors may not be handled consistently across the application, leading to:
- Poor user experience when API calls fail
- Unclear error messages for users
- Lack of retry mechanisms for transient failures
- Inconsistent error handling patterns

**Current State:** Basic error handling with React Query
**Target:** Comprehensive error handling with user-friendly feedback

## Tasks
- [ ] Standardize API error response handling
- [ ] Create user-friendly error message mapping
- [ ] Implement retry logic for transient failures
- [ ] Add offline/network error detection
- [ ] Create consistent error UI components
- [ ] Add error toast notifications
- [ ] Implement graceful degradation strategies

## Acceptance Criteria
- [ ] All API errors are caught and handled appropriately
- [ ] Users receive clear, actionable error messages
- [ ] Transient failures are automatically retried
- [ ] Network connectivity issues are detected and reported
- [ ] Error states don't block critical user workflows
- [ ] Error handling is consistent across all components
- [ ] Error scenarios are testable and tested

## Implementation Steps

### 1. Create API Error Types and Utilities
Create `src/lib/apiErrors.ts`:
```typescript
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export class ApiErrorHandler {
  static formatError(error: any): ApiError {
    // Handle different error formats
    if (error.response) {
      // HTTP error response
      return {
        message: error.response.data?.message || 'An error occurred',
        code: error.response.data?.code,
        status: error.response.status,
        details: error.response.data?.details,
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        status: 0,
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  static getUserMessage(error: ApiError): string {
    const errorMessages: Record<string, string> = {
      NETWORK_ERROR: 'Please check your internet connection and try again.',
      UNAUTHORIZED: 'Your session has expired. Please log in again.',
      FORBIDDEN: 'You don\'t have permission to perform this action.',
      NOT_FOUND: 'The requested resource was not found.',
      VALIDATION_ERROR: 'Please check your input and try again.',
      SERVER_ERROR: 'We\'re experiencing technical difficulties. Please try again later.',
      FILE_TOO_LARGE: 'The uploaded file is too large. Please choose a smaller file.',
      INVALID_FILE_FORMAT: 'Invalid file format. Please upload an Excel file (.xlsx).',
    };

    // Try to match by error code first
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }

    // Match by HTTP status
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'You don\'t have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 413:
        return 'The uploaded file is too large.';
      case 422:
        return 'Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return 'We\'re experiencing technical difficulties. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  static isRetryable(error: ApiError): boolean {
    // Retry on network errors and 5xx server errors
    return (
      error.code === 'NETWORK_ERROR' ||
      (error.status && error.status >= 500 && error.status < 600) ||
      error.status === 429 // Rate limit
    );
  }
}
```

### 2. Create Error Toast/Notification System
Create `src/components/ErrorToast.tsx`:
```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface ErrorToast {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'network';
  duration?: number;
}

interface ErrorToastContextType {
  showError: (message: string, type?: ErrorToast['type']) => void;
  showNetworkError: (isOnline: boolean) => void;
  dismissError: (id: string) => void;
}

const ErrorToastContext = createContext<ErrorToastContextType | undefined>(undefined);

export const useErrorToast = () => {
  const context = useContext(ErrorToastContext);
  if (!context) {
    throw new Error('useErrorToast must be used within ErrorToastProvider');
  }
  return context;
};

export const ErrorToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ErrorToast[]>([]);

  const showError = useCallback((message: string, type: ErrorToast['type'] = 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ErrorToast = {
      id,
      message,
      type,
      duration: type === 'network' ? 0 : 5000, // Network errors don't auto-dismiss
    };

    setToasts(prev => [...prev, toast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration);
    }
  }, []);

  const showNetworkError = useCallback((isOnline: boolean) => {
    if (!isOnline) {
      showError('You are offline. Some features may not be available.', 'network');
    } else {
      // Remove network error toasts when back online
      setToasts(prev => prev.filter(t => t.type !== 'network'));
      showError('Connection restored.', 'warning');
    }
  }, [showError]);

  const dismissError = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getToastIcon = (type: ErrorToast['type']) => {
    switch (type) {
      case 'network':
        return <WifiOff className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getToastStyles = (type: ErrorToast['type']) => {
    switch (type) {
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'warning':
        return 'bg-orange-500 text-white';
      case 'network':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-destructive text-destructive-foreground';
    }
  };

  return (
    <ErrorToastContext.Provider value={{ showError, showNetworkError, dismissError }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-lg shadow-lg min-w-[300px] ${getToastStyles(toast.type)}`}
          >
            {getToastIcon(toast.type)}
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => dismissError(toast.id)}
              className="opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ErrorToastContext.Provider>
  );
};
```

### 3. Enhance React Query Configuration
Update `src/lib/queryClient.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query';
import { ApiErrorHandler } from './apiErrors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const apiError = ApiErrorHandler.formatError(error);

        // Don't retry if not retryable or if we've tried too many times
        if (!ApiErrorHandler.isRetryable(apiError) || failureCount >= 3) {
          return false;
        }

        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        const apiError = ApiErrorHandler.formatError(error);

        // Only retry mutations for network errors and some 5xx errors
        if (
          (apiError.code === 'NETWORK_ERROR' || apiError.status === 503) &&
          failureCount < 2
        ) {
          return true;
        }

        return false;
      },
      retryDelay: 1000,
    },
  },
});
```

### 4. Create Error Hook for Components
Create `src/hooks/useApiError.ts`:
```typescript
import { useErrorToast } from '@/components/ErrorToast';
import { ApiErrorHandler } from '@/lib/apiErrors';
import { useCallback } from 'react';

export const useApiError = () => {
  const { showError } = useErrorToast();

  const handleError = useCallback((error: any) => {
    const apiError = ApiErrorHandler.formatError(error);
    const userMessage = ApiErrorHandler.getUserMessage(apiError);

    showError(userMessage);

    // Log detailed error for debugging
    console.error('API Error:', apiError);
  }, [showError]);

  return { handleError };
};
```

### 5. Add Network Status Detection
Create `src/hooks/useNetworkStatus.ts`:
```typescript
import { useState, useEffect } from 'react';
import { useErrorToast } from '@/components/ErrorToast';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { showNetworkError } = useErrorToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNetworkError(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      showNetworkError(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showNetworkError]);

  return isOnline;
};
```

### 6. Update Components to Use Error Handling
Example update to `FileUploadComponent.tsx`:
```typescript
import { useApiError } from '@/hooks/useApiError';

export default function FileUploadComponent() {
  const { handleError } = useApiError();

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onError: handleError,
    onSuccess: (data) => {
      // Handle success
    },
  });

  // Component implementation...
}
```

## Files to Create/Modify
- `src/lib/apiErrors.ts` (new)
- `src/components/ErrorToast.tsx` (new)
- `src/hooks/useApiError.ts` (new)
- `src/hooks/useNetworkStatus.ts` (new)
- `src/lib/queryClient.ts` (enhance existing)
- `src/App.tsx` (add ErrorToastProvider)
- Update components to use error handling hooks

## Git Workflow
```bash
git checkout -b feat/improve-api-error-handling
# Create error handling utilities and components
# Update React Query configuration
# Add error handling hooks
# Update components to use new error handling
# Test error scenarios
npm test
npm run build
git add src/lib/apiErrors.ts src/components/ErrorToast.tsx src/hooks/use*Error.ts
git commit -m "feat: improve API error handling and user feedback

- Add comprehensive API error formatting and user message mapping
- Implement error toast notification system with auto-dismiss
- Create retry logic for transient failures (network, 5xx errors)
- Add network status detection and offline handling
- Create reusable error handling hooks for components
- Update React Query configuration for better error handling
- Provide graceful degradation for API failures

Improves user experience during API errors and network issues"
git push origin feat/improve-api-error-handling
```

## Testing Commands
```bash
# Test error handling
npm test -- --testPathPattern="(apiErrors|ErrorToast|useApiError)"

# Manual testing scenarios:
# 1. Disconnect network and test offline behavior
# 2. Use browser dev tools to simulate API errors
# 3. Test file upload with large files
# 4. Test with slow network conditions
```

## Success Metrics
- [ ] All API errors show user-friendly messages
- [ ] Transient failures are automatically retried
- [ ] Network connectivity issues are detected and handled
- [ ] Error toasts appear and dismiss appropriately
- [ ] Users can continue using the app during partial failures
- [ ] Error handling is consistent across all components
- [ ] No unhandled promise rejections or console errors

## Error Scenarios to Test
1. **Network Errors**: Disconnect internet, use throttling
2. **HTTP Errors**: 400, 401, 403, 404, 500, 503
3. **File Upload Errors**: Large files, invalid formats
4. **Rate Limiting**: Rapid API calls
5. **Timeout Errors**: Slow API responses
6. **Malformed Responses**: Invalid JSON

## Notes
- Balance between automatic retries and user feedback
- Provide actionable error messages when possible
- Log detailed errors for debugging while showing simple messages to users
- Consider implementing exponential backoff for retries
- Test error handling thoroughly in development and staging