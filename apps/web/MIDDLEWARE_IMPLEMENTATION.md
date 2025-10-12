# Middleware & Route Protection Implementation

This document outlines the implementation of middleware and route protection as specified in the cursor_tasks requirements (Section 9).

## Overview

The middleware implementation provides comprehensive route protection with role-based access control, automatic authentication redirects, and proper handling of return URLs.

## Key Features Implemented

### 1. Public Route Allowlist

The following routes are publicly accessible without authentication:

- `/` - Home page
- `/book` - Booking page
- `/pricing` - Pricing page
- `/how-it-works` - How it works page
- `/about` - About page
- `/track` - Order tracking
- `/checkout/*` - Checkout flow
- `/api/health` - Health check endpoint
- `/api/webhooks/stripe` - Stripe webhooks
- `/api/places/suggest` - Places API
- `/api/auth/*` - Authentication endpoints
- `/auth/forgot`, `/auth/reset`, `/auth/verify` - Auth pages
- Static assets and system files

### 2. Protected Routes with Role-Based Access

#### Admin Routes (`/admin/*`, `/api/admin/*`)

- **Required Role**: `admin`
- **Access**: Only users with admin role
- **Examples**: `/admin/orders`, `/admin/drivers`, `/admin/analytics`

#### Driver Routes (`/driver/*`, `/api/driver/*`)

- **Required Role**: `driver` or `admin`
- **Access**: Drivers and admins (admin override)
- **Examples**: `/driver/dashboard`, `/driver/jobs`, `/driver/earnings`

#### Customer Portal Routes (`/customer-portal/*`, `/portal/*`, `/api/customer/*`)

- **Required Role**: `customer` or `admin`
- **Access**: Customers and admins (admin override)
- **Examples**: `/customer-portal`, `/portal`, `/customer-portal/orders`

### 3. Authentication Redirect Logic

When an unauthenticated user tries to access a protected route:

1. **Capture the intended destination**: The middleware captures the full path including query parameters
2. **Redirect to home with auth parameters**: Redirects to `/?returnTo=<encoded-path>&showAuth=true`
3. **Auto-open auth modal**: The `showAuth=true` parameter triggers the auth modal to open automatically
4. **Return to intended page**: After successful authentication, the user is redirected to their original destination

### 4. Role-Based Access Control

The middleware implements strict role-based access control:

```typescript
// Admin routes - only admin role
if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
  if (userRole === 'admin') {
    hasAccess = true;
  } else {
    // Redirect to auth
  }
}

// Driver routes - driver or admin
if (pathname.startsWith('/driver') || pathname.startsWith('/api/driver')) {
  if (userRole === 'driver' || userRole === 'admin') {
    hasAccess = true;
  } else {
    // Redirect to auth
  }
}

// Customer routes - customer or admin
if (pathname.startsWith('/customer-portal') || pathname.startsWith('/portal')) {
  if (userRole === 'customer' || userRole === 'admin') {
    hasAccess = true;
  } else {
    // Redirect to auth
  }
}
```

### 5. Logging and Monitoring

The middleware includes comprehensive logging for security monitoring:

```typescript
function logMiddlewareAction(
  action: string,
  pathname: string,
  userRole?: string,
  userId?: string
) {
  console.log(
    `[Middleware] ${action}: ${pathname}${userRole ? ` (Role: ${userRole})` : ''}${userId ? ` (User: ${userId})` : ''}`
  );
}
```

Logged actions include:

- `UNAUTHORIZED_ACCESS` - Unauthenticated access attempts
- `ADMIN_ACCESS_GRANTED/DENIED` - Admin route access
- `DRIVER_ACCESS_GRANTED/DENIED` - Driver route access
- `CUSTOMER_ACCESS_GRANTED/DENIED` - Customer route access
- `AUTHENTICATED_ACCESS` - General authenticated access

### 6. Security Features

#### CSRF Protection

- NextAuth.js handles CSRF protection automatically
- Form-based authentication includes CSRF tokens

#### Rate Limiting

- Implemented at the API route level
- Credential attempts are rate-limited by IP and email

#### Session Management

- JWT-based sessions with 30-day max age
- Rolling sessions with 24-hour update age
- Secure session storage

#### Password Security

- bcrypt hashing with 12+ rounds
- Secure password validation

## Implementation Files

### Core Middleware

- **File**: `src/middleware.ts`
- **Purpose**: Main middleware implementation with route protection logic

### Authentication Configuration

- **File**: `src/lib/auth.ts`
- **Purpose**: NextAuth configuration with role-based callbacks

### Auth Modal

- **File**: `src/components/auth/AuthModal.tsx`
- **Purpose**: Authentication UI with support for returnTo URLs

### Header Component

- **File**: `src/components/site/Header.tsx`
- **Purpose**: Auto-opens auth modal when `showAuth=true` parameter is present

### Auth Redirect Hook

- **File**: `src/hooks/useAuthRedirect.ts`
- **Purpose**: Handles redirect logic after successful authentication

## Usage Examples

### 1. Direct URL Access to Protected Route

```
User visits: /driver/dashboard (unauthenticated)
↓
Middleware redirects to: /?returnTo=%2Fdriver%2Fdashboard&showAuth=true
↓
Auth modal opens automatically
↓
User signs in successfully
↓
Redirected to: /driver/dashboard
```

### 2. Role-Based Access Denial

```
Customer visits: /admin/orders
↓
Middleware checks role: customer ≠ admin
↓
Redirects to: /?returnTo=%2Fadmin%2Forders&showAuth=true
↓
Shows access denied message
```

### 3. Successful Role-Based Access

```
Admin visits: /driver/dashboard
↓
Middleware checks role: admin (has override access)
↓
Access granted
```

## Testing Scenarios

The implementation handles the following test scenarios:

1. **Public routes** - Accessible without authentication
2. **Protected routes** - Require authentication
3. **Role-based access** - Correct roles can access their routes
4. **Admin override** - Admins can access all routes
5. **ReturnTo functionality** - Users return to intended page after auth
6. **Query parameter preservation** - URL parameters are maintained
7. **Auto-modal opening** - Auth modal opens automatically when needed

## Security Considerations

1. **Open Redirect Prevention**: ReturnTo URLs are validated to prevent open redirects
2. **Same-Origin Policy**: Only same-origin redirects are allowed
3. **Role Validation**: Server-side role validation in addition to client-side
4. **Session Security**: Secure session handling with proper expiration
5. **Audit Logging**: All access attempts are logged for monitoring

## Compliance with cursor_tasks Requirements

✅ **Allow public routes**: `/`, `/book`, `/pricing`, `/api/health`, `/api/auth/*`, static assets
✅ **Protect role-based routes**: `/admin/*` (admin), `/driver/*` (driver), `/portal/*` (customer)
✅ **Unauthorized redirect**: Redirect to `/?returnTo=<path>&showAuth=true`
✅ **Auto-open modal**: `showAuth=true` parameter triggers modal
✅ **Return to intended page**: After login, user lands on original destination
✅ **Role-based access control**: Strict role validation
✅ **Security logging**: Comprehensive access logging
✅ **CSRF protection**: NextAuth handles automatically
✅ **Session management**: JWT with rolling sessions

## Future Enhancements

1. **Rate limiting middleware**: Add IP-based rate limiting
2. **Advanced logging**: Integration with external logging services
3. **Audit trails**: Detailed audit logging for compliance
4. **Multi-factor authentication**: Support for MFA on sensitive routes
5. **Session analytics**: Track session patterns and anomalies
