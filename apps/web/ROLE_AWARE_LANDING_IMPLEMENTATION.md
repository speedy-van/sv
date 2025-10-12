# Role-Aware Landing Implementation

This document outlines the implementation of **Section 8: Role-aware landing from Home** from the cursor_tasks.

## Overview

The role-aware landing system provides personalized experiences for users based on their role (customer, driver, admin) when they visit the home page after authentication. The implementation ensures users stay on the home page by default but provides quick access to role-specific features.

## Key Features Implemented

### 1. Default Landing Behavior

- **No auto-redirect**: Users stay on the home page (`/`) after login unless they came from a protected page
- **Clean URL**: Auth parameters are removed after successful authentication
- **Smooth UX**: No jarring redirects away from the home page

### 2. Role-Aware Welcome Messages

- **Personalized greetings**: "Welcome back, {name}!" with role-specific messaging
- **Quick access hints**: Toast notifications show relevant quick links for each role
- **Positioned notifications**: Welcome messages appear in top-right corner

### 3. Role-Aware Navigation Components

#### Header Avatar Menu

- **Enhanced menu items**: Role-specific navigation with icons and clear labels
- **Quick access**: Common actions like "Book a Van" and "Track Orders" always available
- **Visual hierarchy**: Primary actions highlighted with teal color and emojis

#### Home Page Components

- **RoleAwareHero**: Shows different CTAs based on user role in the main hero section
- **RoleAwareBookSection**: Personalized "Book Now" section with role-appropriate actions
- **WelcomeBanner**: Contextual banner for signed-in users with quick action buttons

### 4. Role-Specific Experiences

#### Customer Experience

- **Primary actions**: "My Orders", "Book Another"
- **Quick access**: Order history, settings, support
- **Welcome message**: "How can we help you today?"

#### Driver Experience

- **Primary actions**: "Driver Dashboard", "View Jobs"
- **Quick access**: Earnings, schedule, performance, payouts
- **Welcome message**: "Ready to find your next job?"

#### Admin Experience

- **Primary actions**: "Admin Dashboard", "Manage Orders"
- **Quick access**: Analytics, drivers, payouts, settings
- **Welcome message**: "Manage your operations efficiently"

## Components Created/Modified

### New Components

1. **`RoleAwareHero.tsx`** - Client component for role-aware hero section
2. **`RoleAwareBookSection.tsx`** - Client component for role-aware book section
3. **`WelcomeBanner.tsx`** - Client component for personalized welcome banner

### Modified Components

1. **`Header.tsx`** - Added role-aware welcome toast notifications
2. **`UserAvatarMenu.tsx`** - Enhanced with role-specific menu items and quick access
3. **`AuthModal.tsx`** - Improved success messaging
4. **`useAuthRedirect.ts`** - Updated to keep users on home page by default
5. **`page.tsx`** - Integrated role-aware components

## Technical Implementation

### Session Management

- Uses NextAuth session data to determine user role
- Role information available via `session.user.role`
- Graceful fallbacks for missing user data

### Client-Side Rendering

- Role-aware components are client components to access session data
- Server-side metadata preserved for SEO
- Hydration-safe implementation

### Navigation Patterns

- **Fast paths**: Direct links to role-specific dashboards
- **Quick actions**: Common tasks easily accessible
- **Consistent UX**: Similar patterns across all roles

## User Flow Examples

### Customer Flow

1. User signs in from home page
2. Welcome toast appears: "Welcome back, John! Quick access: My Orders, Book a van, Track orders"
3. Home page shows customer-specific CTAs: "My Orders", "Book Another"
4. Welcome banner displays: "Welcome back, John! How can we help you today?"
5. Avatar menu shows: My Orders, Order History, Settings, Support, Book a Van, Track Orders

### Driver Flow

1. Driver signs in from home page
2. Welcome toast appears: "Welcome back, Sarah! Quick access: Driver Dashboard, Available Jobs, Earnings"
3. Home page shows driver-specific CTAs: "Driver Dashboard", "View Jobs"
4. Welcome banner displays: "Welcome back, Sarah! Ready to find your next job?"
5. Avatar menu shows: Driver Dashboard, Available Jobs, Earnings, Schedule, Performance, Payouts

### Admin Flow

1. Admin signs in from home page
2. Welcome toast appears: "Welcome back, Admin! Quick access: Admin Dashboard, Orders, Analytics"
3. Home page shows admin-specific CTAs: "Admin Dashboard", "Manage Orders"
4. Welcome banner displays: "Welcome back, Admin! Manage your operations efficiently."
5. Avatar menu shows: Admin Dashboard, Orders, Drivers, Analytics, Payouts, Settings

## Testing

A comprehensive test suite has been created (`RoleAwareLanding.test.tsx`) that covers:

- Default behavior for unauthenticated users
- Role-specific content for each user type
- Welcome banner visibility and content
- Navigation menu items for each role

## Acceptance Criteria Met

✅ **Default post-login landing = Home (`/`)**
✅ **No auto-redirect away from Home unless user came from a protected page**
✅ **Avatar menu exposes fast paths for each role**
✅ **Role-aware welcome messages with quick links**
✅ **Personalized CTAs based on user role**
✅ **Consistent navigation patterns**

## Future Enhancements

1. **Analytics tracking**: Monitor which role-specific actions users take most
2. **A/B testing**: Test different welcome messages and CTAs
3. **Progressive disclosure**: Show more options as users become more familiar
4. **Contextual suggestions**: Recommend actions based on user history
5. **Mobile optimization**: Ensure role-aware components work well on mobile devices

## Files Modified

- `apps/web/src/components/RoleAwareHero.tsx` (new)
- `apps/web/src/components/RoleAwareBookSection.tsx` (new)
- `apps/web/src/components/WelcomeBanner.tsx` (new)
- `apps/web/src/components/site/Header.tsx`
- `apps/web/src/components/UserAvatarMenu.tsx`
- `apps/web/src/components/auth/AuthModal.tsx`
- `apps/web/src/hooks/useAuthRedirect.ts`
- `apps/web/src/app/(public)/page.tsx`
- `apps/web/src/components/__tests__/RoleAwareLanding.test.tsx` (new)
