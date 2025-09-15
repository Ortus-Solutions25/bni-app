# Create Integration Tests for API and Data Flow

## Objective
Implement integration tests that verify the complete data flow from API calls through component rendering, ensuring the application works correctly as a cohesive system.

## Context
While unit tests verify individual components, integration tests ensure that:
- API calls work correctly with the backend
- Data flows properly through the application
- Components interact correctly with each other
- State management works across the app
- User workflows complete successfully

**Critical Integration Flows:**
1. Chapter data loading and display
2. Excel file upload and processing
3. Member data management
4. Analytics matrix generation
5. Navigation between pages

## Tasks
- [ ] Setup MSW (Mock Service Worker) for API mocking
- [ ] Test chapter data loading and caching
- [ ] Test file upload integration with backend
- [ ] Test member CRUD operations
- [ ] Test analytics data processing
- [ ] Test routing and navigation flows
- [ ] Test error handling across components

## Acceptance Criteria
- [ ] API calls are properly mocked and tested
- [ ] Data flows from API to UI correctly
- [ ] Error states propagate and display properly
- [ ] Loading states work as expected
- [ ] Navigation between pages works correctly
- [ ] React Query caching behavior is tested
- [ ] TypeScript types are validated in tests

## Implementation Steps

### 1. Setup MSW for API Mocking
Install and configure MSW:
```bash
npm install --save-dev msw
```

Create `src/test-utils/server.ts`:
```typescript
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { mockChapter, mockMember } from './mockData';

export const handlers = [
  rest.get('/api/chapters/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        mockChapter({ id: 1, name: 'Alpha Chapter' }),
        mockChapter({ id: 2, name: 'Beta Chapter' }),
      ])
    );
  }),

  rest.get('/api/chapters/:id/', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json(mockChapter({ id: Number(id), name: `Chapter ${id}` }))
    );
  }),

  rest.get('/api/chapters/:id/members/', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json([
        mockMember({ id: 1, chapterId: Number(id) }),
        mockMember({ id: 2, chapterId: Number(id) }),
      ])
    );
  }),

  rest.post('/api/chapters/:id/upload-excel/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'File uploaded successfully',
        recordsCreated: 25,
      })
    );
  }),

  // Error scenarios
  rest.get('/api/chapters/error/', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal server error' })
    );
  }),
];

export const server = setupServer(...handlers);
```

### 2. Setup Test Environment
Update `src/setupTests.ts`:
```typescript
import '@testing-library/jest-dom';
import { server } from './test-utils/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 3. Create Chapter Data Flow Integration Test
Create `src/integration/ChapterDataFlow.test.tsx`:
```typescript
import { render, screen, waitFor } from '@/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChapterDashboard from '@/components/ChapterDashboard';
import ChapterDetailPage from '@/components/ChapterDetailPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

describe('Chapter Data Flow Integration', () => {
  it('loads and displays chapter data from API', async () => {
    render(<ChapterDashboard />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alpha Chapter')).toBeInTheDocument();
      expect(screen.getByText('Beta Chapter')).toBeInTheDocument();
    });

    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('/api/chapters/', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<ChapterDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error loading chapters/i)).toBeInTheDocument();
    });
  });

  it('navigates from dashboard to chapter detail', async () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChapterDashboard />} />
          <Route path="/chapters/:id" element={<ChapterDetailPage />} />
        </Routes>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Chapter')).toBeInTheDocument();
    });

    const chapterCard = screen.getByTestId('chapter-card-1');
    fireEvent.click(chapterCard);

    await waitFor(() => {
      expect(screen.getByText('Chapter Details')).toBeInTheDocument();
    });
  });
});
```

### 4. Create File Upload Integration Test
Create `src/integration/FileUpload.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import FileUploadComponent from '@/components/FileUploadComponent';

describe('File Upload Integration', () => {
  it('uploads file and shows success message', async () => {
    render(<FileUploadComponent chapterId={1} />);

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const input = screen.getByLabelText(/upload excel file/i);
    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = screen.getByText(/upload/i);
    fireEvent.click(uploadButton);

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/25 records created/i)).toBeInTheDocument();
    });
  });

  it('handles upload errors', async () => {
    server.use(
      rest.post('/api/chapters/:id/upload-excel/', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({ error: 'Invalid file format' })
        );
      })
    );

    render(<FileUploadComponent chapterId={1} />);

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const input = screen.getByLabelText(/upload excel file/i);
    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = screen.getByText(/upload/i);
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
    });
  });
});
```

### 5. Create React Query Integration Test
Test caching and refetching behavior:
```typescript
describe('React Query Integration', () => {
  it('caches chapter data correctly', async () => {
    const { rerender } = render(<ChapterDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Chapter')).toBeInTheDocument();
    });

    // Unmount and remount component
    rerender(<div />);
    rerender(<ChapterDashboard />);

    // Should show cached data immediately
    expect(screen.getByText('Alpha Chapter')).toBeInTheDocument();
  });
});
```

## Files to Create
- `src/test-utils/server.ts` (MSW setup)
- `src/integration/ChapterDataFlow.test.tsx`
- `src/integration/FileUpload.test.tsx`
- `src/integration/MemberManagement.test.tsx`
- `src/integration/Analytics.test.tsx`
- `src/integration/Navigation.test.tsx`

## Git Workflow
```bash
git checkout -b test/create-integration-tests
# Install MSW
npm install --save-dev msw
# Create MSW handlers and server setup
# Create integration test files
# Update setupTests.ts for MSW
# Run tests to ensure they pass
npm run test:coverage -- --testPathPattern=integration
git add src/test-utils/server.ts src/integration/ src/setupTests.ts
git commit -m "test: add comprehensive integration tests

- Setup MSW for API mocking with realistic handlers
- Create chapter data flow integration tests
- Add file upload integration testing with error scenarios
- Test React Query caching and state management
- Implement navigation flow testing between components
- Add API error handling integration tests

Ensures complete data flow works correctly across the application"
git push origin test/create-integration-tests
```

## Testing Commands
```bash
# Run integration tests only
npm test -- --testPathPattern=integration

# Run with coverage for integration
npm run test:coverage -- --testPathPattern=integration

# Debug MSW handlers
npm test -- --testPathPattern=integration --verbose
```

## Success Metrics
- [ ] API mocking works correctly with MSW
- [ ] Data flows from API to components properly
- [ ] Error scenarios are handled gracefully
- [ ] React Query caching behavior is verified
- [ ] Navigation between pages works correctly
- [ ] Loading states are tested
- [ ] Integration test coverage > 70%

## MSW Handler Patterns
1. **Success Scenarios**: Return realistic mock data
2. **Error Scenarios**: Return appropriate HTTP error codes
3. **Loading Delays**: Add delays to test loading states
4. **Dynamic Responses**: Use request parameters to customize responses
5. **State Management**: Track requests for complex flows

## Notes
- MSW handlers should mirror actual API responses
- Test both success and error scenarios for every API call
- Focus on user workflows rather than individual API calls
- Use realistic data that matches production scenarios
- Consider network delays and timeout scenarios