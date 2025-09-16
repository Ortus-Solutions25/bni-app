# BNI App Development Guide

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL (for production) or SQLite (for development)
- Redis (for Celery tasks)

### Environment Setup

1. **Clone and navigate to the project**:
   ```bash
   cd bni-app
   ```

2. **Frontend setup**:
   ```bash
   cd frontend
   npm install
   ```

3. **Backend setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Environment variables**:
   ```bash
   # Create .env file in backend/
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the Application

1. **Start the backend**:
   ```bash
   cd backend
   python manage.py migrate
   python manage.py runserver
   # Runs on http://localhost:8000
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm start
   # Runs on http://localhost:3000
   ```

## Development Workflow

### Adding a New Feature

1. **Create feature directory structure**:
   ```bash
   mkdir -p frontend/src/features/your-feature/{components,hooks,types}
   mkdir -p backend/features/your_feature/{migrations}
   ```

2. **Add feature to Django settings**:
   ```python
   # backend/config/settings.py
   INSTALLED_APPS = [
       # ... existing apps
       "features.your_feature",
   ]
   ```

3. **Create feature components**:
   ```bash
   # Follow kebab-case naming
   touch frontend/src/features/your-feature/components/your-component.tsx
   ```

4. **Create Django models/views**:
   ```bash
   # Follow standard Django structure
   touch backend/features/your_feature/models.py
   touch backend/features/your_feature/views.py
   ```

### Code Organization Patterns

#### Frontend Components
```typescript
// features/chapters/components/chapter-card.tsx
import React from 'react';
import { Card } from '../../../shared/components/ui/card';

export const ChapterCard: React.FC<ChapterCardProps> = ({ chapter }) => {
  return (
    <Card>
      {/* Component implementation */}
    </Card>
  );
};
```

#### Backend Models
```python
# features/chapters/models.py
from django.db import models
from shared.models import BaseModel

class Chapter(BaseModel):
    name = models.CharField(max_length=255)
    # Model implementation
```

### Import Conventions

#### Frontend Imports
```typescript
// Shared utilities
import { Button } from '../../../shared/components/ui/button';
import { useApi } from '../../../shared/hooks/use-api';

// Feature-specific
import { MemberCard } from '../../members/components/member-card';

// External libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';
```

#### Backend Imports
```python
# Django imports
from django.db import models
from rest_framework import serializers

# Shared utilities
from shared.models import BaseModel
from shared.utils import normalize_name

# Feature imports
from features.chapters.models import Chapter
```

## Testing

### Frontend Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test chapter-card.test.tsx
```

### Backend Testing
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test features.chapters

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Test Structure
```typescript
// frontend/src/features/chapters/components/chapter-card.test.tsx
import { render, screen } from '../../../testing/utils/test-utils';
import { ChapterCard } from './chapter-card';

describe('ChapterCard', () => {
  it('renders chapter information', () => {
    // Test implementation
  });
});
```

## Code Style Guidelines

### Naming Conventions
- **Directories**: kebab-case (`chapter-dashboard`, `member-details`)
- **Files**: kebab-case (`chapter-card.tsx`, `member-service.ts`)
- **Components**: PascalCase (`ChapterCard`, `MemberDetails`)
- **Functions/Variables**: camelCase (`loadChapterData`, `memberCount`)

### TypeScript Types
```typescript
// features/chapters/types/index.ts
export interface Chapter {
  id: number;
  name: string;
  memberCount: number;
}

export interface ChapterCardProps {
  chapter: Chapter;
  onSelect: (chapter: Chapter) => void;
}
```

### Django Models
```python
# features/chapters/models.py
class Chapter(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    location = models.CharField(max_length=255)

    class Meta:
        db_table = 'chapters_chapter'
        ordering = ['name']
```

## Common Tasks

### Adding a New API Endpoint
1. **Create serializer**:
   ```python
   # features/chapters/serializers.py
   class ChapterSerializer(serializers.ModelSerializer):
       class Meta:
           model = Chapter
           fields = '__all__'
   ```

2. **Create view**:
   ```python
   # features/chapters/views.py
   class ChapterViewSet(viewsets.ModelViewSet):
       queryset = Chapter.objects.all()
       serializer_class = ChapterSerializer
   ```

3. **Add to URLs**:
   ```python
   # features/chapters/urls.py
   from rest_framework.routers import DefaultRouter
   router = DefaultRouter()
   router.register('chapters', ChapterViewSet)
   ```

### Adding a New React Component
1. **Create component file**:
   ```typescript
   // features/chapters/components/chapter-list.tsx
   export const ChapterList: React.FC<ChapterListProps> = ({ chapters }) => {
     return (
       <div>
         {chapters.map(chapter =>
           <ChapterCard key={chapter.id} chapter={chapter} />
         )}
       </div>
     );
   };
   ```

2. **Add types**:
   ```typescript
   // features/chapters/types/index.ts
   export interface ChapterListProps {
     chapters: Chapter[];
   }
   ```

3. **Add tests**:
   ```typescript
   // features/chapters/components/chapter-list.test.tsx
   describe('ChapterList', () => {
     it('renders list of chapters', () => {
       // Test implementation
     });
   });
   ```

## Debugging Tips

### Frontend Debugging
- Use React DevTools for component inspection
- Check Network tab for API calls
- Use console.log for quick debugging
- Leverage TypeScript errors for type safety

### Backend Debugging
- Use Django Debug Toolbar for database queries
- Check Django logs for errors
- Use Python debugger (pdb) for complex issues
- Monitor API responses in browser DevTools

### Common Issues
1. **Import errors**: Check file paths and naming
2. **Module not found**: Ensure __init__.py files exist
3. **CORS issues**: Verify CORS settings in Django
4. **Database errors**: Run migrations after model changes

## Performance Considerations

### Frontend Optimization
- Use React.lazy() for code splitting
- Implement proper error boundaries
- Optimize bundle size with webpack analysis
- Use React Query for efficient data fetching

### Backend Optimization
- Add database indexes for frequently queried fields
- Use select_related() and prefetch_related() for queries
- Implement caching with Redis
- Monitor database query performance

This guide should help you navigate the feature-based architecture and maintain consistency across the codebase.