# Backend Refactoring Task - Detailed Instructions

## Context
You are working on a BNI (Business Networking International) analytics application. The backend is a Django REST Framework API that processes Excel files from the PALMS system, generates networking matrices, and provides analytics. The codebase has grown organically and now needs professional refactoring before migrating to PostgreSQL and implementing Celery task queuing.

## Your Branch
Create and work on branch: `refactor/backend-restructure`

## Current Problems
1. **views.py is 1,701 lines** with 28 function-based views mixed with class-based views
2. **excel_processor.py is 1,191 lines** - single class doing too much
3. **49 instances of broad `except Exception`** handlers
4. **All code in single `bni` Django app** - no feature separation
5. **Inconsistent error handling and logging**

## Your Mission: Backend Refactoring

### Phase 1: Split Django Apps by Feature (Day 1-2)

**Goal**: Convert monolithic `bni` app into feature-based Django apps

**Current Structure**:
```
backend/
└── bni/
    ├── models.py (all models)
    ├── views.py (1,701 lines)
    ├── serializers.py (all serializers)
    ├── urls.py
    └── services/
```

**Target Structure**:
```
backend/
├── chapters/
│   ├── models.py (Chapter)
│   ├── views.py (ChapterViewSet)
│   ├── serializers.py (ChapterSerializer)
│   ├── urls.py
│   └── services/
│       └── chapter_service.py
├── members/
│   ├── models.py (Member)
│   ├── views.py (MemberViewSet)
│   ├── serializers.py (MemberSerializer)
│   ├── urls.py
│   └── services/
│       └── member_service.py
├── reports/
│   ├── models.py (MonthlyReport, MemberMonthlyStats)
│   ├── views.py (ReportViewSet)
│   ├── serializers.py
│   ├── urls.py
│   └── services/
│       └── report_service.py
├── analytics/
│   ├── models.py (Referral, OneToOne, TYFCB, DataImportSession)
│   ├── views.py (MatrixViewSet, ComparisonViewSet)
│   ├── serializers.py
│   ├── urls.py
│   └── services/
│       ├── matrix_generator.py
│       └── comparison_service.py
└── uploads/
    ├── views.py (FileUploadViewSet, BulkUploadViewSet)
    ├── serializers.py
    ├── urls.py
    └── services/
        ├── excel_parser.py
        ├── data_validator.py
        ├── data_transformer.py
        └── database_writer.py
```

**Step-by-Step Instructions**:

1. **Create new Django apps**:
```bash
cd backend
python manage.py startapp chapters
python manage.py startapp members
python manage.py startapp reports
python manage.py startapp analytics
python manage.py startapp uploads
```

2. **Move models** from `bni/models.py`:
   - Chapter → `chapters/models.py`
   - Member → `members/models.py`
   - MonthlyReport, MemberMonthlyStats → `reports/models.py`
   - Referral, OneToOne, TYFCB, DataImportSession → `analytics/models.py`

3. **Update imports** throughout codebase:
   - Find: `from bni.models import Chapter`
   - Replace: `from chapters.models import Chapter`
   - Use find-replace carefully

4. **Add apps to INSTALLED_APPS** in `config/settings.py`:
```python
INSTALLED_APPS = [
    # ... django apps
    'chapters',
    'members',
    'reports',
    'analytics',
    'uploads',
    # Remove 'bni' once migration complete
]
```

5. **Create and run migrations**:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Phase 2: Convert Function-Based Views to ViewSets (Day 2-3)

**Goal**: Replace 28 function-based views with organized ViewSets

**Current** (in bni/views.py):
```python
@api_view(['GET'])
def chapter_dashboard(request):
    # 50 lines of logic
    pass

@api_view(['GET'])
def chapter_detail(request, chapter_id):
    # 40 lines of logic
    pass

@api_view(['POST'])
def create_chapter(request):
    # 30 lines of logic
    pass
```

**Target** (in chapters/views.py):
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class ChapterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Chapter CRUD operations and dashboard.
    """
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    permission_classes = [AllowAny]  # TODO: Add proper permissions

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get overview of all chapters with statistics."""
        chapters = self.get_queryset()
        service = ChapterService()
        data = service.get_dashboard_data(chapters)
        return Response(data)

    @action(detail=True, methods=['get'])
    def reports(self, request, pk=None):
        """Get all monthly reports for a chapter."""
        chapter = self.get_object()
        reports = chapter.monthly_reports.all().order_by('-month_year')
        serializer = MonthlyReportSerializer(reports, many=True)
        return Response(serializer.data)
```

**ViewSets to Create**:

1. **ChapterViewSet** (chapters/views.py):
   - Actions: list, retrieve, create, update, destroy
   - Custom actions: dashboard, reports

2. **MemberViewSet** (members/views.py):
   - Actions: list, retrieve, create, update, destroy
   - Custom actions: analytics, summary

3. **ReportViewSet** (reports/views.py):
   - Actions: list, retrieve, create, destroy
   - Custom actions: member_detail, tyfcb_data, download_matrices

4. **MatrixViewSet** (analytics/views.py):
   - Custom actions: referral_matrix, oto_matrix, combination_matrix
   - Custom actions: member_summary, tyfcb_summary, data_quality

5. **ComparisonViewSet** (analytics/views.py):
   - Custom actions: compare_reports, compare_referrals, compare_otos, compare_combination

6. **FileUploadViewSet** (uploads/views.py):
   - Actions: create (for single file upload)
   - Custom actions: bulk_upload

**URL Routing** (use routers):
```python
# chapters/urls.py
from rest_framework.routers import DefaultRouter
from .views import ChapterViewSet

router = DefaultRouter()
router.register(r'chapters', ChapterViewSet, basename='chapter')

urlpatterns = router.urls
```

### Phase 3: Refactor ExcelProcessor (Day 3-4)

**Goal**: Split 1,191-line ExcelProcessorService into focused classes

**Current** (bni/services/excel_processor.py):
```python
class ExcelProcessorService:
    def process_excel_file(self, file_path):
        # Parsing logic
        # Validation logic
        # Transformation logic
        # Database operations
        # Matrix generation
        pass
```

**Target** (uploads/services/):

1. **excel_parser.py**:
```python
class ExcelParser:
    """Parse Excel files from PALMS system."""

    def parse_slip_audit_file(self, file_path: Path) -> pd.DataFrame:
        """Parse slip audit Excel file into DataFrame."""
        pass

    def parse_member_names_file(self, file_path: Path) -> List[Dict]:
        """Parse member names Excel file."""
        pass

    def extract_slip_data(self, df: pd.DataFrame) -> List[Dict]:
        """Extract individual slips from DataFrame."""
        pass
```

2. **data_validator.py**:
```python
class SlipDataValidator:
    """Validate slip data from Excel files."""

    def validate_member_names(self, names: List[str], chapter: Chapter) -> Dict:
        """Validate member names exist in chapter."""
        pass

    def validate_slip_type(self, slip_type: str) -> str:
        """Validate and normalize slip type."""
        pass

    def validate_tyfcb_amount(self, amount: Any) -> Decimal:
        """Validate and convert TYFCB amount."""
        pass
```

3. **data_transformer.py**:
```python
class SlipDataTransformer:
    """Transform parsed Excel data into model instances."""

    def transform_to_referral(self, slip_data: Dict, chapter: Chapter) -> Referral:
        """Transform slip data to Referral instance."""
        pass

    def transform_to_one_to_one(self, slip_data: Dict, chapter: Chapter) -> OneToOne:
        """Transform slip data to OneToOne instance."""
        pass
```

4. **database_writer.py**:
```python
class DatabaseWriter:
    """Write transformed data to database."""

    @transaction.atomic
    def save_monthly_report(self, report_data: Dict, chapter: Chapter) -> MonthlyReport:
        """Save monthly report with all related data."""
        pass

    def bulk_create_referrals(self, referrals: List[Referral]) -> int:
        """Bulk create referral records."""
        pass
```

**Usage Pattern**:
```python
# uploads/services/excel_processor.py (orchestrator)
class ExcelProcessorService:
    """Orchestrate Excel file processing."""

    def __init__(self, chapter: Chapter):
        self.chapter = chapter
        self.parser = ExcelParser()
        self.validator = SlipDataValidator()
        self.transformer = SlipDataTransformer()
        self.writer = DatabaseWriter()

    def process_monthly_report(self, slip_audit_file, member_names_file, month_year):
        """Process monthly report files."""
        # 1. Parse
        df = self.parser.parse_slip_audit_file(slip_audit_file)
        slips = self.parser.extract_slip_data(df)

        # 2. Validate
        validation_result = self.validator.validate_slip_batch(slips, self.chapter)
        if not validation_result['is_valid']:
            raise ValidationError(validation_result['errors'])

        # 3. Transform
        referrals = [self.transformer.transform_to_referral(s, self.chapter)
                     for s in slips if s['type'] == 'referral']

        # 4. Write
        report = self.writer.save_monthly_report({
            'chapter': self.chapter,
            'month_year': month_year,
            'referrals': referrals,
            # ... other data
        }, self.chapter)

        return report
```

### Phase 4: Improve Error Handling (Day 4-5)

**Goal**: Replace 49 broad `except Exception` with specific error handling

**Create Custom Exceptions** (shared/exceptions.py):
```python
class BNIException(Exception):
    """Base exception for BNI application."""
    pass

class ValidationError(BNIException):
    """Raised when data validation fails."""
    def __init__(self, message: str, errors: Dict = None):
        super().__init__(message)
        self.errors = errors or {}

class ExcelParsingError(BNIException):
    """Raised when Excel file cannot be parsed."""
    pass

class DataImportError(BNIException):
    """Raised when data import fails."""
    pass

class MemberNotFoundError(BNIException):
    """Raised when member is not found in chapter."""
    pass

class ReportNotFoundError(BNIException):
    """Raised when monthly report is not found."""
    pass
```

**Usage**:
```python
# Before (bad):
try:
    member = Member.objects.get(name=name, chapter=chapter)
except Exception as e:
    return Response({'error': str(e)}, status=500)

# After (good):
from shared.exceptions import MemberNotFoundError

try:
    member = Member.objects.get(name=name, chapter=chapter)
except Member.DoesNotExist:
    raise MemberNotFoundError(f"Member '{name}' not found in chapter '{chapter.name}'")
```

**Create Exception Handler** (shared/exception_handlers.py):
```python
from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    """Custom exception handler for DRF."""

    # Call DRF's default handler first
    response = exception_handler(exc, context)

    # Handle custom exceptions
    if isinstance(exc, ValidationError):
        return Response({
            'error': str(exc),
            'details': exc.errors,
            'type': 'validation_error'
        }, status=400)

    if isinstance(exc, MemberNotFoundError):
        return Response({
            'error': str(exc),
            'type': 'not_found'
        }, status=404)

    # ... handle other custom exceptions

    return response
```

**Register Handler** (config/settings.py):
```python
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'shared.exception_handlers.custom_exception_handler',
    # ... other settings
}
```

### Phase 5: Add Proper Logging (Day 5)

**Goal**: Implement structured logging throughout the application

**Configure Logging** (config/settings.py):
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/bni_app.log',
            'maxBytes': 1024 * 1024 * 15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/errors.log',
            'maxBytes': 1024 * 1024 * 15,
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'chapters': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'uploads': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        # ... other apps
    },
}
```

**Usage in Code**:
```python
import logging

logger = logging.getLogger(__name__)

class ExcelParser:
    def parse_slip_audit_file(self, file_path: Path) -> pd.DataFrame:
        logger.info(f"Starting to parse slip audit file: {file_path}")

        try:
            df = pd.read_excel(file_path)
            logger.info(f"Successfully parsed {len(df)} rows from {file_path}")
            return df
        except Exception as e:
            logger.error(f"Failed to parse {file_path}: {str(e)}", exc_info=True)
            raise ExcelParsingError(f"Could not parse Excel file: {str(e)}")
```

**Add Request Logging Middleware** (shared/middleware.py):
```python
import logging
import time

logger = logging.getLogger('api')

class RequestLoggingMiddleware:
    """Middleware to log all API requests."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        # Log request
        logger.info(f"Request: {request.method} {request.path}")

        # Process request
        response = self.get_response(request)

        # Log response
        duration = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} {request.method} {request.path} "
            f"({duration:.2f}s)"
        )

        return response
```

## Testing Your Changes

**Run Tests**:
```bash
cd backend
python manage.py test
```

**Test API Endpoints**:
```bash
# Start server
python manage.py runserver

# Test chapters endpoint
curl http://localhost:8000/api/chapters/

# Test file upload
curl -X POST -F "slip_audit_file=@test.xlsx" \
     -F "chapter_id=1" -F "month_year=2024-08" \
     http://localhost:8000/api/upload/
```

**Check for Import Errors**:
```bash
python manage.py check
```

## Commit Strategy

Make atomic commits for each major change:

```bash
# After creating new apps
git add .
git commit -m "Create feature-based Django apps structure"

# After moving models
git add .
git commit -m "Move models to feature-specific apps"

# After creating ViewSets
git add .
git commit -m "Convert function-based views to ViewSets"

# After splitting ExcelProcessor
git add .
git commit -m "Refactor Excel processing into focused service classes"

# After error handling
git add .
git commit -m "Add custom exceptions and error handling"

# After logging
git add .
git commit -m "Implement structured logging system"
```

## Success Criteria

- [ ] All models moved to feature-specific apps
- [ ] All 28 function-based views converted to ViewSets
- [ ] ExcelProcessorService split into 4+ focused classes
- [ ] Custom exception classes created and used
- [ ] Broad `except Exception` replaced with specific handlers
- [ ] Structured logging implemented
- [ ] All tests passing
- [ ] No import errors
- [ ] API endpoints working correctly

## Notes

- **Don't delete old code immediately** - comment it out first to reference
- **Update tests** as you refactor
- **Keep the frontend running** - don't break the API contract
- **Document breaking changes** in commit messages
- **Ask for help** if you encounter Django migration issues

Good luck! Focus on clean, professional code. Take your time and test thoroughly.
