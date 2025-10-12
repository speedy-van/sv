# Sign-in/Sign-up Flow Implementation

This document outlines the implementation of the sign-in/sign-up flow from Home to Portal as specified in the cursor tasks.

## Overview

The sign-in/sign-up flow has been implemented with the following key features:

1. **Role-based redirects** - Users are automatically redirected to their appropriate portal based on their role
2. **Deep link support** - Users can be redirected to specific pages after authentication using the `returnTo` parameter
3. **Auth Modal** - A centralized authentication modal accessible from the header
4. **Protected routes** - Middleware ensures proper access control
5. **Error handling** - Proper error messages and rate limiting

## Implementation Details

### 1. Auth Modal (`/src/components/auth/AuthModal.tsx`)

**Features:**

- Sign-in and sign-up tabs
- Email/password authentication
- OAuth support (Google, Apple)
- Role-based redirects after successful authentication
- Form validation with Zod
- Error handling and user feedback
- Password visibility toggle
- Remember me functionality

**Role-based Redirects:**

- **Customers** → `/customer-portal`
- **Drivers** → `/driver/dashboard`
- **Admins** → `/admin`

### 2. Header Integration (`/src/components/site/Header.tsx`)

**Features:**

- "Sign in" button in header for unauthenticated users
- Auto-opens auth modal when redirected from protected routes
- Role-aware welcome messages with quick action links
- Automatic role-based redirects after OAuth authentication

### 3. Middleware (`/src/middleware.ts`)

**Features:**

- Protects all portal routes (`/customer-portal/*`, `/driver/*`, `/admin/*`)
- Redirects unauthenticated users to home page with auth modal trigger
- Preserves `returnTo` parameter for deep link support
- Role-based access control

### 4. NextAuth Configuration (`/src/lib/auth.ts`)

**Features:**

- Credentials provider for email/password authentication
- OAuth providers (Google, Apple)
- Role-based redirect callback
- Session management with JWT strategy
- Audit logging for authentication events

### 5. Customer Portal Layout (`/src/app/(customer-portal)/customer-portal/layout.tsx`)

**Features:**

- Requires customer role for access
- Redirects to home page with auth modal if not authenticated
- Preserves intended destination with `returnTo` parameter

## User Flow

### Entry Points

1. **Home header "Sign in" button** → Opens Auth Modal
2. **Deep links to protected routes** → Redirects to home with auth modal and `returnTo` parameter
3. **Direct portal access** → Redirects to home with auth modal

### Sign-in Process

1. User clicks "Sign in" or is redirected from protected route
2. Auth Modal opens with sign-in tab active
3. User enters email and password
4. System validates credentials and determines user role
5. User is redirected to appropriate portal based on role
6. If `returnTo` parameter exists, user is redirected there instead

### Sign-up Process

1. User switches to "Create Account" tab in Auth Modal
2. User fills in name, email, password, and confirms password
3. System creates account with default "customer" role
4. User is automatically signed in and redirected to customer portal

### OAuth Flow

1. User clicks "Continue with Google/Apple"
2. OAuth provider handles authentication
3. System creates or updates user account
4. User is redirected to appropriate portal based on role

## Error Handling

- **Invalid credentials** → "Invalid email or password" message
- **Network errors** → "An unexpected error occurred" message
- **Rate limiting** → Implemented at the API level
- **Non-leaky error messages** → Generic messages that don't reveal user existence

## Security Features

- **Password hashing** → bcrypt for secure password storage
- **JWT sessions** → Secure session management
- **Role-based access control** → Middleware enforces role requirements
- **Audit logging** → All authentication events are logged
- **CSRF protection** → NextAuth provides built-in CSRF protection

## Testing

A comprehensive test suite has been created (`/src/components/__tests__/SignInFlow.test.tsx`) that covers:

- Role-based redirects for all user types
- Error handling for invalid credentials
- `returnTo` parameter functionality
- OAuth flow integration

## Usage Examples

### Test Accounts

Use the following test accounts to verify the implementation:

| Role     | Email                             | Password      |
| -------- | --------------------------------- | ------------- |
| Customer | ahmadalwakai76+customer@gmail.com | Aa234311Aa@@@ |
| Driver   | driver@test.com                   | password123   |
| Admin    | ahmadalwakai76+admin@gmail.com    | Aa234311Aa@@@ |

### Deep Link Testing

1. Visit `/customer-portal/orders/123` while not authenticated
2. Should redirect to `/?returnTo=/customer-portal/orders/123&showAuth=true`
3. Auth modal should open automatically
4. After sign-in, should redirect to `/customer-portal/orders/123`

## Future Enhancements

1. **Email verification** → Implement email verification for new accounts
2. **Password reset** → Complete password reset flow
3. **Two-factor authentication** → Add 2FA support
4. **Social login improvements** → Better OAuth user data handling
5. **Rate limiting UI** → Show rate limit messages to users

## Files Modified

- `/src/components/auth/AuthModal.tsx` - Enhanced with role-based redirects
- `/src/components/site/Header.tsx` - Added role-aware redirects and welcome messages
- `/src/lib/auth.ts` - Added redirect callback for role-based redirects
- `/src/middleware.ts` - Enhanced with better deep link support
- `/src/app/(customer-portal)/customer-portal/layout.tsx` - Updated redirect logic
- `/src/app/(customer-portal)/customer-portal/login/page.tsx` - Enhanced with better UX
- `/src/components/__tests__/SignInFlow.test.tsx` - Added comprehensive tests
