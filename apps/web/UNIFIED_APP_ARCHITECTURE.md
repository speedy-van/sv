# Unified App Architecture - Speedy Van

## Overview

This document describes the unified application architecture for Speedy Van, implementing a single application with role-based routing and shared components.

## Architecture Principles

### 1. Single Application, Multiple Roles
- **Unified Codebase**: All user roles (admin, driver, customer) exist within a single Next.js application
- **Role-based Routing**: Each role has dedicated routes (`/admin/*`, `/driver/*`, `/customer/*`)
- **Shared Components**: Common UI components and utilities are shared across all roles
- **Single Deployment**: One deployment serves all user types

### 2. Role-Based Access Control (RBAC)

#### User Roles
- **Admin**: Full system access, user management, analytics
- **Driver**: Job management, earnings tracking, profile management
- **Customer**: Booking management, payment tracking, support

#### Route Structure
```
/admin/*          - Admin portal routes
/driver/*         - Driver portal routes  
/customer/*       - Customer portal routes
/auth/*           - Authentication routes
/api/*            - API routes (role-protected)
```

## Implementation Details

### 1. Unified Routing System

**File**: `src/lib/routing.ts`

```typescript
export const ROUTES = {
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    BOOKINGS: '/admin/bookings',
    // ...
  },
  
  // Driver routes
  DRIVER: {
    DASHBOARD: '/driver',
    JOBS: '/driver/jobs',
    EARNINGS: '/driver/earnings',
    // ...
  },
  
  // Customer routes
  CUSTOMER: {
    DASHBOARD: '/customer',
    BOOKINGS: '/customer/bookings',
    PROFILE: '/customer/profile',
    // ...
  }
};
```

### 2. Middleware Implementation

**File**: `src/middleware.ts`

- **Route Protection**: Automatically protects routes based on user role
- **Authentication Check**: Verifies JWT tokens for protected routes
- **Role Validation**: Ensures users can only access their role-specific routes
- **Redirect Logic**: Redirects unauthorized users to appropriate login pages

### 3. Layout System

#### Unified Layouts
Each role has a dedicated layout file:
- `src/app/admin/layout.tsx` - Admin portal layout
- `src/app/driver/layout.tsx` - Driver portal layout  
- `src/app/customer/layout.tsx` - Customer portal layout

#### Shared Components
- `UnifiedNavigation` - Role-aware navigation component
- `UnifiedErrorBoundary` - Role-specific error handling
- `UnifiedShell` - Common layout wrapper

### 4. Component Architecture

#### Shared Components (`src/components/shared/`)
- **UnifiedNavigation**: Adapts navigation based on user role
- **UnifiedErrorBoundary**: Role-specific error handling
- **Common UI Components**: Buttons, cards, forms, etc.

#### Role-Specific Components
- **Admin Components**: `src/components/admin/`
- **Driver Components**: `src/components/driver/`
- **Customer Components**: `src/components/customer/`

### 5. Authentication Flow

```mermaid
graph TD
    A[User Login] --> B{Authentication}
    B -->|Success| C{Check Role}
    C -->|Admin| D[/admin]
    C -->|Driver| E[/driver]
    C -->|Customer| F[/customer]
    B -->|Failure| G[/auth/login]
    D --> H[Admin Dashboard]
    E --> I[Driver Dashboard]
    F --> J[Customer Dashboard]
```

## File Structure

```
src/
├── app/
│   ├── admin/                 # Admin portal routes
│   │   ├── layout.tsx        # Admin layout
│   │   ├── page.tsx          # Admin dashboard
│   │   ├── users/            # User management
│   │   └── settings/         # Admin settings
│   ├── driver/               # Driver portal routes
│   │   ├── layout.tsx        # Driver layout
│   │   ├── page.tsx          # Driver dashboard
│   │   ├── jobs/             # Job management
│   │   └── earnings/         # Earnings tracking
│   ├── customer/             # Customer portal routes
│   │   ├── layout.tsx        # Customer layout
│   │   ├── page.tsx          # Customer dashboard
│   │   ├── bookings/         # Booking management
│   │   └── profile/          # Customer profile
│   └── auth/                 # Authentication routes
├── components/
│   ├── shared/               # Shared components
│   │   ├── UnifiedNavigation.tsx
│   │   └── UnifiedErrorBoundary.tsx
│   ├── admin/                # Admin-specific components
│   ├── driver/               # Driver-specific components
│   └── customer/             # Customer-specific components
├── lib/
│   ├── routing.ts            # Unified routing system
│   └── auth.ts               # Authentication utilities
└── middleware.ts             # Route protection middleware
```

## Benefits

### 1. Development Efficiency
- **Single Codebase**: Easier maintenance and updates
- **Shared Components**: Reduced code duplication
- **Unified Deployment**: Single build and deployment process

### 2. User Experience
- **Consistent UI**: Shared design system across all roles
- **Role-based Navigation**: Intuitive navigation for each user type
- **Unified Authentication**: Single sign-on experience

### 3. Security
- **Centralized Access Control**: All security logic in one place
- **Role-based Permissions**: Granular access control
- **Middleware Protection**: Automatic route protection

### 4. Scalability
- **Modular Architecture**: Easy to add new roles or features
- **Shared Utilities**: Common functionality across roles
- **Type Safety**: TypeScript ensures consistency

## Deployment

### Single Deployment Process
```bash
# Build the unified application
pnpm run build

# Deploy to production
pnpm run deploy
```

### Environment Configuration
- **Single Environment**: All roles served from same deployment
- **Role-based Features**: Features enabled/disabled based on configuration
- **Unified Monitoring**: Single monitoring and logging system

## Migration from Separate Apps

### Phase 1: Unified Routing ✅
- [x] Create unified routing system
- [x] Implement role-based middleware
- [x] Update authentication flow

### Phase 2: Shared Components ✅
- [x] Create unified navigation component
- [x] Implement shared error boundaries
- [x] Consolidate common UI components

### Phase 3: Layout Unification ✅
- [x] Create role-specific layouts
- [x] Implement unified shell components
- [x] Update page components

### Phase 4: Testing & Validation 🔄
- [ ] Test all role-based routes
- [ ] Validate authentication flow
- [ ] Performance testing
- [ ] User acceptance testing

## Security Considerations

### 1. Route Protection
- All role-specific routes are protected by middleware
- JWT tokens are validated on every request
- Role-based access control enforced at the route level

### 2. Data Isolation
- Database queries filtered by user role
- API endpoints protected by role-based permissions
- Sensitive data access logged and monitored

### 3. Session Management
- Secure session handling with NextAuth.js
- Automatic session refresh
- Secure logout and session cleanup

## Performance Optimizations

### 1. Code Splitting
- Role-specific components loaded on demand
- Shared components cached across roles
- Lazy loading for non-critical features

### 2. Caching Strategy
- Route-level caching for static content
- API response caching based on user role
- Shared component caching

### 3. Bundle Optimization
- Tree shaking removes unused code
- Role-based bundle splitting
- Optimized asset loading

## Monitoring & Analytics

### 1. Unified Logging
- Single logging system for all roles
- Role-based log filtering
- Performance monitoring across all user types

### 2. Analytics
- User behavior tracking by role
- Feature usage analytics
- Performance metrics per role

### 3. Error Tracking
- Centralized error reporting
- Role-specific error handling
- Automated error notifications

## Future Enhancements

### 1. Role Expansion
- Easy addition of new user roles
- Flexible permission system
- Role inheritance capabilities

### 2. Feature Flags
- Role-based feature toggles
- A/B testing capabilities
- Gradual feature rollouts

### 3. Multi-tenant Support
- Organization-based access control
- Tenant-specific customizations
- Scalable multi-tenant architecture

## Conclusion

The unified application architecture provides a robust, scalable, and maintainable solution for Speedy Van's multi-role platform. By consolidating all user roles into a single application with shared components and role-based routing, we achieve better development efficiency, improved user experience, and enhanced security while maintaining the flexibility to scale and add new features.
