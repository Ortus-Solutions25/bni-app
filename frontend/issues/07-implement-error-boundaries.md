# Implement React Error Boundaries

## Objective
Add comprehensive error boundaries to catch and handle JavaScript errors gracefully, preventing the entire application from crashing when individual components fail.

## Context
The application currently lacks error boundaries, meaning any unhandled JavaScript error in a component can crash the entire app. For a business-critical application handling BNI member data and analytics, robust error handling is essential for:
- Maintaining application availability
- Providing good user experience during errors
- Capturing error details for debugging
- Preventing data loss during operations

**Current State:** No error boundaries implemented
**Target:** Multi-level error boundaries with proper fallback UI

## Tasks
- [ ] Create a global error boundary for the entire app
- [ ] Implement route-level error boundaries
- [ ] Add component-level error boundaries for critical features
- [ ] Create error fallback UI components
- [ ] Integrate with error reporting service (optional)
- [ ] Add error boundary tests
- [ ] Document error handling patterns

## Acceptance Criteria
- [ ] Application doesn't crash on component errors
- [ ] Users see helpful error messages instead of blank screens
- [ ] Errors are logged with sufficient detail for debugging
- [ ] Error boundaries have proper fallback UI
- [ ] Critical user flows remain accessible during partial failures
- [ ] Error boundaries can be reset/recovered from
- [ ] Error boundaries are tested

## Implementation Steps

### 1. Create Base Error Boundary Component
Create `src/components/ErrorBoundary.tsx`:
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'global' | 'route' | 'component';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to error service (e.g., Sentry)
    // reportError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6">
                {this.props.level === 'global'
                  ? 'The application encountered an unexpected error.'
                  : 'This section of the app encountered an error.'}
              </p>

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>

                {this.props.level === 'global' && (
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-2 border border-border rounded-md hover:bg-accent"
                  >
                    Reload Application
                  </button>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 2. Create Specific Error Boundary Components
Create `src/components/ChapterErrorBoundary.tsx`:
```typescript
import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const ChapterErrorFallback = () => (
  <div className="p-6 text-center">
    <Home className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
    <h3 className="text-lg font-semibold mb-2">Chapter Data Error</h3>
    <p className="text-muted-foreground mb-4">
      Unable to load chapter information. Please try refreshing the page.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
    >
      Refresh Page
    </button>
  </div>
);

const ChapterErrorBoundary: React.FC<Props> = ({ children }) => {
  return (
    <ErrorBoundary
      level="component"
      fallback={<ChapterErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('Chapter component error:', error);
        // Report chapter-specific errors
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ChapterErrorBoundary;
```

### 3. Integrate Error Boundaries in App Structure
Update `src/App.tsx`:
```typescript
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import ChapterRoutes from './components/ChapterRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary
      level="global"
      onError={(error, errorInfo) => {
        // Report global errors to monitoring service
        console.error('Global error:', error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ErrorBoundary level="route">
            <ChapterRoutes />
          </ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
```

### 4. Add Error Boundaries to Critical Components
Update components to wrap critical sections:
```typescript
// In ChapterDashboard.tsx
import ChapterErrorBoundary from './ChapterErrorBoundary';

export default function ChapterDashboard() {
  return (
    <ChapterErrorBoundary>
      {/* existing component content */}
    </ChapterErrorBoundary>
  );
}
```

### 5. Create Error Boundary Tests
Create `src/components/ErrorBoundary.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    console.error = originalError;
  });

  it('calls onError when an error occurs', () => {
    const onError = jest.fn();
    console.error = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );

    console.error = jest.fn();
  });
});
```

## Files to Create/Modify
- `src/components/ErrorBoundary.tsx` (new)
- `src/components/ChapterErrorBoundary.tsx` (new)
- `src/components/FileUploadErrorBoundary.tsx` (new)
- `src/App.tsx` (modify to add global error boundary)
- `src/components/ChapterDashboard.tsx` (wrap with error boundary)
- `src/components/ErrorBoundary.test.tsx` (new)

## Git Workflow
```bash
git checkout -b feat/implement-error-boundaries
# Create error boundary components
# Update App.tsx and key components
# Add error boundary tests
# Test error scenarios manually
npm test -- --testPathPattern=ErrorBoundary
npm run build  # Ensure no build errors
git add src/components/ErrorBoundary* src/App.tsx
git commit -m "feat: implement comprehensive error boundaries

- Add global error boundary to prevent app crashes
- Create route-level error boundaries for graceful degradation
- Implement component-specific error boundaries for critical features
- Add error fallback UI with recovery options
- Include error logging and optional error reporting integration
- Add comprehensive error boundary tests

Improves application stability and user experience during errors"
git push origin feat/implement-error-boundaries
```

## Testing Commands
```bash
# Test error boundaries
npm test -- --testPathPattern=ErrorBoundary

# Manual testing - trigger errors in dev
# Add temporary code to throw errors in components

# Test in production build
npm run build
npm start
```

## Success Metrics
- [ ] Application remains functional when components error
- [ ] Users see helpful error messages
- [ ] Error boundaries catch and handle all component errors
- [ ] Recovery mechanisms work correctly
- [ ] Error details are logged appropriately
- [ ] Tests verify error boundary behavior
- [ ] No console errors during normal operation

## Error Reporting Integration (Optional)
For production monitoring, consider integrating:
```typescript
// Example with Sentry
import * as Sentry from '@sentry/react';

const reportError = (error: Error, errorInfo: ErrorInfo) => {
  Sentry.withScope((scope) => {
    scope.setContext('errorInfo', errorInfo);
    Sentry.captureException(error);
  });
};
```

## Notes
- Error boundaries only catch errors in class components, not hooks
- Use error boundaries at multiple levels for granular error handling
- Provide meaningful error messages for different error contexts
- Consider implementing error recovery strategies
- Test error scenarios in development and staging environments