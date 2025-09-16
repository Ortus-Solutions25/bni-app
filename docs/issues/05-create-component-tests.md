# Create Component Tests for Core UI Components

## Objective
Write comprehensive unit and integration tests for critical UI components to ensure functionality, accessibility, and user interaction reliability.

## Context
The application has several complex components that handle business-critical functionality:
- Chapter dashboard and management
- Member analytics and details
- File upload and data import
- Matrix visualization components
- Navigation and routing

**Priority Components to Test:**
1. `ChapterDashboard.tsx` - Main chapter listing and filtering
2. `FileUploadComponent.tsx` - Excel import functionality
3. `MembersTab.tsx` - Member management interface
4. `MatrixTab.tsx` - Analytics visualization
5. `ChapterDetailPage.tsx` - Chapter detail views

## Tasks
- [ ] Test ChapterDashboard component (sorting, filtering, navigation)
- [ ] Test FileUploadComponent (file validation, upload flow, error handling)
- [ ] Test MembersTab component (member list, search, actions)
- [ ] Test MatrixTab component (data visualization, interactions)
- [ ] Test ChapterDetailPage routing and tab switching
- [ ] Test shared UI components (Select, Button, etc.)
- [ ] Add accessibility testing

## Acceptance Criteria
- [ ] All critical user flows are tested
- [ ] Components render without errors
- [ ] User interactions (clicks, form inputs) work correctly
- [ ] Error states are handled properly
- [ ] Accessibility requirements are met
- [ ] Tests are maintainable and readable
- [ ] Coverage includes happy path and edge cases

## Implementation Steps

### 1. Test ChapterDashboard Component
Create `src/components/ChapterDashboard.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import ChapterDashboard from './ChapterDashboard';
import { mockChapter } from '@/test-utils/mockData';

describe('ChapterDashboard', () => {
  const mockChapters = [
    mockChapter({ id: 1, name: 'Alpha Chapter', memberCount: 25 }),
    mockChapter({ id: 2, name: 'Beta Chapter', memberCount: 30 }),
  ];

  it('renders chapter list correctly', () => {
    render(<ChapterDashboard chapters={mockChapters} />);

    expect(screen.getByText('Alpha Chapter')).toBeInTheDocument();
    expect(screen.getByText('Beta Chapter')).toBeInTheDocument();
  });

  it('sorts chapters by member count', async () => {
    render(<ChapterDashboard chapters={mockChapters} />);

    const sortSelect = screen.getByRole('combobox');
    fireEvent.click(sortSelect);

    const memberCountOption = screen.getByText('Member Count');
    fireEvent.click(memberCountOption);

    await waitFor(() => {
      const chapterCards = screen.getAllByTestId('chapter-card');
      expect(chapterCards[0]).toHaveTextContent('Beta Chapter');
    });
  });

  it('navigates to chapter detail on card click', () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    render(<ChapterDashboard chapters={mockChapters} />);

    const firstChapterCard = screen.getByTestId('chapter-card-1');
    fireEvent.click(firstChapterCard);

    expect(mockNavigate).toHaveBeenCalledWith('/chapters/1');
  });
});
```

### 2. Test FileUploadComponent
Create `src/components/FileUploadComponent.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import FileUploadComponent from './FileUploadComponent';

describe('FileUploadComponent', () => {
  it('accepts Excel files', async () => {
    render(<FileUploadComponent onUpload={jest.fn()} />);

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const input = screen.getByLabelText(/upload excel file/i);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.xlsx')).toBeInTheDocument();
    });
  });

  it('rejects non-Excel files', async () => {
    render(<FileUploadComponent onUpload={jest.fn()} />);

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    const input = screen.getByLabelText(/upload excel file/i);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/only excel files are allowed/i)).toBeInTheDocument();
    });
  });

  it('shows upload progress', async () => {
    const mockUpload = jest.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<FileUploadComponent onUpload={mockUpload} />);

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const input = screen.getByLabelText(/upload excel file/i);
    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = screen.getByText(/upload/i);
    fireEvent.click(uploadButton);

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument();
    });
  });
});
```

### 3. Test MembersTab Component
Focus on member listing, search functionality, and actions.

### 4. Test MatrixTab Component
Test data visualization rendering and interactions.

### 5. Add Accessibility Tests
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(<ChapterDashboard chapters={mockChapters} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Files to Create
- `src/components/ChapterDashboard.test.tsx`
- `src/components/FileUploadComponent.test.tsx`
- `src/components/MembersTab.test.tsx`
- `src/components/MatrixTab.test.tsx`
- `src/components/ChapterDetailPage.test.tsx`
- `src/components/ui/Select.test.tsx`

## Git Workflow
```bash
git checkout -b test/create-component-tests
# Install additional testing dependencies
npm install --save-dev jest-axe @testing-library/user-event
# Create test files for each component
# Add test data attributes to components if needed
# Run tests to ensure they pass
npm run test:coverage
# Verify coverage improvements
git add src/components/*.test.tsx
git commit -m "test: add comprehensive component tests

- Add ChapterDashboard tests for sorting, filtering, and navigation
- Create FileUploadComponent tests for file validation and upload flow
- Implement MembersTab tests for member management functionality
- Add MatrixTab tests for data visualization interactions
- Include accessibility testing with jest-axe
- Test user interactions and error handling scenarios

Increases test coverage for critical UI components"
git push origin test/create-component-tests
```

## Testing Commands
```bash
# Run specific test file
npm test ChapterDashboard.test.tsx

# Run tests with coverage for components
npm run test:coverage -- --testPathPattern=components

# Watch mode for active development
npm run test:watch -- --testPathPattern=components
```

## Success Metrics
- [ ] All component tests pass
- [ ] Coverage increases significantly (target: 60%+ for components)
- [ ] No accessibility violations in tested components
- [ ] Tests cover both happy path and error scenarios
- [ ] User interactions (clicks, form inputs) are tested
- [ ] Tests run quickly (under 5 seconds)

## Testing Patterns to Follow
1. **Arrange-Act-Assert**: Clear test structure
2. **User-Centric Testing**: Test what users see and do
3. **Error Scenarios**: Test error states and edge cases
4. **Async Operations**: Proper testing of loading and API calls
5. **Accessibility**: Include a11y testing for all components

## Notes
- Add `data-testid` attributes to components for reliable testing
- Mock external dependencies and API calls
- Focus on testing behavior, not implementation details
- Use meaningful test descriptions that explain expected behavior
- Consider snapshot testing for components with complex rendering logic