# Setup Comprehensive Testing Infrastructure

## Objective
Establish a robust testing foundation for the BNI Analytics application with unit tests, integration tests, and proper test configuration.

## Context
The application currently has minimal testing coverage with only a basic `App.test.tsx` boilerplate. For a business-critical application handling financial data and member analytics, comprehensive testing is essential for:
- Data integrity assurance
- Regression prevention
- Confidence in deployments
- Code quality maintenance

**Current State:** ~0% test coverage
**Target:** 80%+ test coverage with quality tests

## Tasks
- [ ] Enhance Jest configuration for React Testing Library
- [ ] Create test utilities and helpers
- [ ] Setup mock data generators for BNI entities
- [ ] Configure testing for TypeScript paths (@/ imports)
- [ ] Add coverage reporting and thresholds
- [ ] Create testing documentation and guidelines
- [ ] Setup test watch mode for development

## Acceptance Criteria
- [ ] Jest and React Testing Library properly configured
- [ ] Test utilities available for common operations
- [ ] Mock data generators for Chapter, Member, Referral entities
- [ ] Coverage reports generated and viewable
- [ ] Tests run successfully in CI/CD pipeline
- [ ] Clear testing guidelines documented
- [ ] TypeScript path mapping works in tests

## Implementation Steps

### 1. Enhance Jest Configuration
Update `package.json` or create `jest.config.js`:
```javascript
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/src/setupTests.ts"],
    "moduleNameMapping": {
      "^@/(.*)$": "<rootDir>/src/$1"
    },
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/index.tsx",
      "!src/reportWebVitals.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

### 2. Create Test Utilities
Create `src/test-utils/index.tsx`:
```typescript
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 3. Create Mock Data Generators
Create `src/test-utils/mockData.ts`:
```typescript
import { Chapter, Member, Referral, OneToOne, TYFCB } from '@/types';

export const mockChapter = (overrides?: Partial<Chapter>): Chapter => ({
  id: 1,
  name: 'Test Chapter',
  location: 'Test City',
  memberCount: 25,
  ...overrides,
});

export const mockMember = (overrides?: Partial<Member>): Member => ({
  id: 1,
  name: 'John Doe',
  normalizedName: 'john doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Test Company',
  classification: 'Technology',
  chapterId: 1,
  ...overrides,
});

// Add generators for Referral, OneToOne, TYFCB
```

### 4. Setup Coverage Reporting
```bash
npm install --save-dev @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
```

### 5. Create Testing Scripts
Update `package.json` scripts:
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --silent",
    "test:ci": "react-scripts test --coverage --silent --run",
    "test:watch": "react-scripts test --watch"
  }
}
```

## Files to Create/Modify
- `src/setupTests.ts` (enhance existing)
- `src/test-utils/index.tsx` (new)
- `src/test-utils/mockData.ts` (new)
- `src/test-utils/server.ts` (MSW setup)
- `package.json` (update scripts and config)
- `jest.config.js` (optional, for complex config)

## Git Workflow
```bash
git checkout -b test/setup-testing-infrastructure
# Create test utilities and configuration
# Install necessary dependencies
npm install --save-dev @testing-library/jest-dom @testing-library/user-event
# Update configuration files
# Create initial test files
# Verify tests run correctly
npm run test:ci
npm run test:coverage
git add src/test-utils/ src/setupTests.ts package.json
git commit -m "test: setup comprehensive testing infrastructure

- Configure Jest with TypeScript path mapping and coverage thresholds
- Create test utilities with React Query and Router providers
- Add mock data generators for BNI entities (Chapter, Member, etc.)
- Setup coverage reporting with 70% minimum thresholds
- Add MSW for API mocking in tests
- Create testing scripts for development and CI

Establishes foundation for comprehensive test coverage"
git push origin test/setup-testing-infrastructure
```

## Testing Commands
```bash
# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI mode (single run)
npm run test:ci

# Check coverage report
open coverage/lcov-report/index.html
```

## Success Metrics
- [ ] Jest configuration working with TypeScript paths
- [ ] Test utilities provide clean testing environment
- [ ] Mock data generators create realistic test data
- [ ] Coverage reports show detailed metrics
- [ ] Tests run in under 10 seconds for quick feedback
- [ ] All existing tests pass with new configuration

## Testing Guidelines to Document
1. **File Naming**: `*.test.tsx` for component tests, `*.test.ts` for utility tests
2. **Test Structure**: Arrange-Act-Assert pattern
3. **Mock Strategy**: Use MSW for API calls, mock external dependencies
4. **Coverage Goals**: 80% overall, 90% for critical business logic
5. **Test Categories**: Unit, Integration, Component, End-to-End

## Notes
- Focus on testing business logic and user interactions
- Mock external API calls to ensure test reliability
- Use descriptive test names that explain the expected behavior
- Consider snapshot testing for complex UI components
- Setup CI/CD integration to run tests on every pull request