# Implement User Authentication and Authorization System

## Objective
Build a complete user authentication and authorization system to replace the current public Streamlit application with secure, role-based access control for BNI chapter management.

## Context
The current BNI Palms Analysis application is a public Streamlit app without any authentication. This poses significant security risks for business-critical BNI data and limits the application's scalability for multiple chapters and users.

**Current State:** Public access, no user management
**Target:** Secure multi-user system with role-based permissions

**Critical Needs:**
- Chapter administrators need secure access to their chapter data
- Regional directors need oversight across multiple chapters
- Data privacy compliance for member information
- Audit trails for all data access and modifications

## Business Value
- **Security**: Protect sensitive BNI member and business data
- **Scalability**: Support multiple chapters and users simultaneously
- **Compliance**: Meet business data protection requirements
- **User Experience**: Personalized dashboards and preferences
- **Administration**: Granular access control and user management

## User Stories
1. **As a Chapter President**, I want to securely log in to view only my chapter's analytics
2. **As a Regional Director**, I want to access analytics across all chapters in my region
3. **As a BNI Member**, I want to view my personal networking metrics and goals
4. **As a System Administrator**, I want to manage user accounts and permissions
5. **As an Auditor**, I want to track who accessed what data and when

## Acceptance Criteria
- [ ] Secure user registration and login system
- [ ] Role-based access control (Admin, Regional Director, Chapter President, Member)
- [ ] Chapter-specific data isolation
- [ ] Password reset and account recovery
- [ ] Session management with secure timeouts
- [ ] Multi-factor authentication (optional)
- [ ] Audit logging for all authentication events
- [ ] Integration with existing BNI member databases (future)

## Technical Requirements

### Authentication Features
- Email/password authentication
- JWT token-based session management
- Password strength requirements
- Account lockout after failed attempts
- "Remember me" functionality
- Secure logout and session cleanup

### Authorization Features
- Role-based permissions system
- Chapter-level data isolation
- Feature-level access control
- API endpoint protection
- Frontend route protection

### User Roles and Permissions

#### 1. **System Administrator**
- Manage all user accounts
- Access all chapters and data
- Configure system settings
- View audit logs
- Manage regional assignments

#### 2. **Regional Director**
- Access multiple chapters in their region
- View cross-chapter analytics
- Manage chapter presidents
- Export regional reports

#### 3. **Chapter President**
- Full access to their chapter's data
- Manage chapter member accounts
- Upload chapter data files
- Export chapter reports
- View chapter analytics

#### 4. **Chapter Member**
- View personal networking metrics
- Access chapter member directory
- View chapter-level analytics (read-only)
- Update personal information

## Implementation Steps

### Phase 1: Backend Authentication (Django)
Create authentication models and API endpoints:

```python
# models.py
class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    chapters = models.ManyToManyField('Chapter', through='ChapterMembership')
    last_login_ip = models.GenericIPAddressField(null=True)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class ChapterMembership:
    user = models.ForeignKey(User)
    chapter = models.ForeignKey(Chapter)
    role = models.CharField(max_length=20)  # president, member, etc.
    joined_date = models.DateTimeField(auto_now_add=True)

class AuditLog:
    user = models.ForeignKey(User)
    action = models.CharField(max_length=100)
    resource = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
```

### Phase 2: JWT Authentication API
```python
# views.py
class LoginView(APIView):
    def post(self, request):
        # Authenticate user
        # Generate JWT tokens
        # Log authentication event
        # Return user data and tokens

class RefreshTokenView(APIView):
    def post(self, request):
        # Refresh access token
        # Validate refresh token
        # Return new access token

class LogoutView(APIView):
    def post(self, request):
        # Invalidate tokens
        # Log logout event
        # Clear session data
```

### Phase 3: Frontend Authentication (React)
```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

// ProtectedRoute.tsx
const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { user, hasPermission } = useAuth();

  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <Unauthorized />;
  if (requiredPermission && !hasPermission(requiredPermission)) return <Unauthorized />;

  return children;
};

// Login.tsx
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      // Handle login error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Login form fields */}
    </form>
  );
};
```

### Phase 4: Permission System
```typescript
// permissions.ts
export const PERMISSIONS = {
  VIEW_ALL_CHAPTERS: 'view_all_chapters',
  MANAGE_USERS: 'manage_users',
  UPLOAD_DATA: 'upload_data',
  EXPORT_REPORTS: 'export_reports',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
} as const;

export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  regional_director: [
    PERMISSIONS.VIEW_ALL_CHAPTERS,
    PERMISSIONS.EXPORT_REPORTS,
  ],
  chapter_president: [
    PERMISSIONS.UPLOAD_DATA,
    PERMISSIONS.EXPORT_REPORTS,
  ],
  member: [],
};
```

## Files to Create/Modify

### Backend (Django)
- `accounts/models.py` (User, ChapterMembership, AuditLog)
- `accounts/serializers.py` (User, authentication serializers)
- `accounts/views.py` (Authentication views)
- `accounts/permissions.py` (Custom permission classes)
- `accounts/urls.py` (Authentication URLs)
- `core/middleware.py` (JWT middleware, audit logging)

### Frontend (React)
- `src/contexts/AuthContext.tsx` (Authentication context)
- `src/components/Login.tsx` (Login form)
- `src/components/Register.tsx` (Registration form)
- `src/components/ProtectedRoute.tsx` (Route protection)
- `src/hooks/useAuth.ts` (Authentication hook)
- `src/services/authService.ts` (API calls)
- `src/types/auth.ts` (TypeScript types)

## Security Considerations
- Store JWT tokens securely (httpOnly cookies for refresh tokens)
- Implement proper CORS configuration
- Use HTTPS in production
- Validate all inputs server-side
- Implement rate limiting for authentication endpoints
- Log all authentication attempts
- Use secure password hashing (Django default PBKDF2)
- Implement session timeout and cleanup

## Testing Strategy
- Unit tests for authentication functions
- Integration tests for login/logout flows
- E2E tests for user journeys
- Security testing for common vulnerabilities
- Load testing for authentication endpoints

## Git Workflow
```bash
git checkout -b feat/user-authentication-system
# Implement backend authentication
# Create React authentication components
# Add protected routes and permissions
# Test authentication flows
# Add comprehensive tests
npm test
npm run build
git add .
git commit -m "feat: implement comprehensive user authentication system

- Add Django JWT authentication with role-based permissions
- Create React authentication context and protected routes
- Implement user roles (Admin, Regional Director, Chapter President, Member)
- Add chapter-level data isolation and access control
- Include audit logging for security compliance
- Add password reset and account recovery features

Enables secure multi-user access to BNI analytics platform"
git push origin feat/user-authentication-system
```

## Success Metrics
- [ ] All authenticated users can access appropriate features
- [ ] Unauthorized access attempts are blocked
- [ ] Chapter data is properly isolated by permissions
- [ ] Authentication performance < 500ms
- [ ] Zero authentication-related security vulnerabilities
- [ ] 100% test coverage for authentication code
- [ ] Audit logs capture all required events

## Future Enhancements
- Single Sign-On (SSO) integration with BNI systems
- Multi-factor authentication (MFA)
- Social login options
- Advanced audit reporting
- IP-based access restrictions
- Device management and trusted devices

## Migration Strategy
1. **Phase 1**: Implement authentication in React/Django app
2. **Phase 2**: Migrate existing Streamlit data to secured system
3. **Phase 3**: Create user accounts for existing BNI chapter contacts
4. **Phase 4**: Train chapter presidents on new system
5. **Phase 5**: Deprecate public Streamlit application

## Notes
- This is the highest priority feature for production deployment
- Required for any business use of the application
- Enables all other advanced features that require user context
- Critical for GDPR and data privacy compliance