# BNI Analytics Application - Architecture Documentation

## Purpose & Overview

This is a comprehensive Business Networking International (BNI) analytics platform designed to track and analyze chapter performance, member interactions, and business referrals. The application provides detailed insights into member networking activities through various matrices and dashboards.

## Architecture Principles

### 1. **Full-Stack Separation**
- **Frontend**: React with TypeScript for type safety and modern UI
- **Backend**: Django REST Framework for robust API development
- **Clear separation of concerns** between presentation and business logic

### 2. **Data-Driven Design**
The application centers around four core business metrics:
- **One-to-One Meetings**: Tracking member-to-member networking meetings
- **Referrals**: Managing business referral relationships between members
- **TYFCB (Thank You For Closed Business)**: Tracking actual business value generated
- **Member Performance**: Individual and chapter-level analytics

### 3. **Chapter-Centric Organization**
- All data is organized by chapters (business networking groups)
- Each chapter contains members who interact through various business activities
- Hierarchical structure: Chapters → Members → Interactions

## Technology Stack & Dependencies

### Backend Dependencies
- **Django 4.2.7**: Core web framework
- **Django REST Framework 3.14.0**: RESTful API development
- **PostgreSQL (psycopg2-binary 2.9.9)**: Production database
- **Redis 5.0.1 + Celery 5.3.4**: Asynchronous task processing and caching
- **pandas 2.1.3 + openpyxl 3.1.2**: Excel file processing and data manipulation
- **drf-spectacular 0.26.5**: OpenAPI schema generation for API documentation
- **django-cors-headers 4.3.0**: Cross-origin resource sharing
- **djangorestframework-simplejwt 5.3.0**: JWT authentication
- **Pillow 10.1.0**: Image processing capabilities
- **gunicorn 21.2.0 + whitenoise 6.6.0**: Production server and static file serving

### Frontend Dependencies
- **React 19.1.1**: Core UI framework
- **TypeScript 4.9.5**: Type safety and developer experience
- **Material-UI (@mui) 7.3.1**: Component library with dark theme
- **React Router DOM 7.8.2**: Client-side routing
- **Recharts 3.1.2**: Data visualization and charting
- **Axios 1.11.0**: HTTP client for API communication
- **@tanstack/react-query 5.85.5**: Server state management and caching
- **react-dropzone 14.3.8**: File upload functionality
- **xlsx 0.18.5**: Client-side Excel file processing

## Key Components & Relationships

### Backend Structure

#### Core Models (Django ORM)
1. **Chapter** (`chapters/models.py`):
   - Central entity representing a BNI chapter
   - Contains: name, location, meeting schedule
   - Relationships: Has many Members

2. **Member** (`chapters/models.py`):
   - Individual member within a chapter
   - Contains: personal info, business classification, contact details
   - Normalized name field for data consistency
   - Relationships: Belongs to Chapter, participates in interactions

3. **Referral** (`analytics/models.py`):
   - Tracks referral from giver to receiver
   - Contains: date, week tracking, notes
   - Validation: Same chapter only, no self-referrals

4. **OneToOne** (`analytics/models.py`):
   - Records one-to-one meetings between members
   - Contains: meeting date, location, duration, notes
   - Validation: Same chapter only, no self-meetings

5. **TYFCB** (`analytics/models.py`):
   - Thank You For Closed Business transactions
   - Tracks actual business value in AED
   - Can be from within chapter or external sources

6. **DataImportSession** (`analytics/models.py`):
   - Audit trail for Excel imports
   - Tracks success, errors, and records created

#### API Architecture (`api/`)
- **RESTful endpoints** organized by resource
- **File upload handling** for Excel imports
- **Matrix generation** for various analytics views
- **Report management** with monthly tracking
- **Member analytics** with detailed interaction data

### Frontend Structure

#### Component Hierarchy
```
App.tsx (Theme Provider, Dark Mode)
└── ChapterRoutes.tsx (Main Router)
    ├── ChapterDashboard.tsx (All Chapters View)
    │   └── ChapterCard.tsx (Individual Chapter Card)
    ├── ChapterDetailPage.tsx (Single Chapter View)
    │   ├── MembersTab.tsx (Member List & Management)
    │   ├── MatrixTab.tsx (Analytics Matrices)
    │   ├── PreviousDataTab.tsx (Historical Reports)
    │   └── FileUploadComponent.tsx (Excel Import)
    └── MemberDetails.tsx (Individual Member Analytics)
```

#### Service Layer
- **ChapterDataLoader.ts**: Centralized data fetching and caching
- **Axios configuration**: API communication with backend proxy

## Design Patterns & Best Practices

### Backend Patterns
1. **Model-View-Serializer (MVS)**: Django REST Framework pattern
2. **Fat Models**: Business logic in model methods
3. **Validation at Model Level**: Using clean() methods
4. **Unique Constraints**: Preventing duplicate data
5. **Related Names**: Explicit reverse relationships

### Frontend Patterns
1. **Component Composition**: Reusable UI components
2. **Route-Based Code Splitting**: Lazy loading for performance
3. **Centralized State Management**: Through routing and props
4. **TypeScript Interfaces**: Type safety throughout
5. **Material-UI Theming**: Consistent dark theme design

### Data Flow
1. **Upload**: Excel files → Backend processing → Database storage
2. **Read**: Database → Django ORM → Serializers → JSON API → React components
3. **Analytics**: Raw data → Aggregation in backend → Matrix generation → Visualization

## Common Operations

### Data Import Flow
1. User uploads Excel file through FileUploadComponent
2. Backend parses Excel using pandas
3. Data validation and normalization
4. Creation of Member, Referral, OneToOne, and TYFCB records
5. Import session tracking for audit

### Matrix Generation
1. Query relevant interactions from database
2. Build member-to-member relationship matrices
3. Calculate aggregations and summaries
4. Return JSON structure for frontend visualization

### Report Management
1. Monthly reports stored with timestamps
2. Version control for historical data
3. Comparison capabilities between periods

## Development Workflow

### Local Development
- Frontend runs on port 3000 (Create React App dev server)
- Backend runs on port 8000 (Django dev server)
- Proxy configuration for API calls
- Hot reloading for both frontend and backend

### Docker Development
- Orchestrated multi-container setup
- PostgreSQL for data persistence
- Redis for caching and Celery tasks
- Service health checks and dependencies

## Important Considerations

### Data Integrity
- **Name normalization**: Consistent member identification
- **Chapter isolation**: Data segregated by chapter
- **Validation rules**: Preventing invalid relationships
- **Audit trails**: Tracking all data imports

### Performance Optimization
- **Database indexing** on frequently queried fields
- **Lazy loading** of frontend routes
- **Caching** with Redis for expensive operations
- **Pagination** for large datasets

### Security
- **CORS configuration** for API access control
- **JWT authentication** ready for implementation
- **Input validation** at multiple levels
- **SQL injection prevention** through ORM

## Non-Obvious Behaviors

1. **Member Name Normalization**: The system automatically normalizes member names for matching, important for Excel imports where names might have inconsistent formatting

2. **Week Tracking**: Interactions can be tracked by "week_of" for period-based reporting, separate from actual transaction dates

3. **Bidirectional Relationships**: One-to-one meetings and referrals are stored once but queried bidirectionally

4. **TYFCB External Sources**: TYFCB can have null giver for external business, affecting sum calculations

5. **Import Session Atomicity**: Failed imports roll back completely to maintain data consistency

## Future Considerations

- **Real-time updates**: WebSocket integration for live dashboards
- **Advanced analytics**: ML-based member recommendations
- **Mobile responsiveness**: Enhanced mobile experience
- **Bulk operations**: Batch editing capabilities
- **Export functionality**: Generate reports in various formats