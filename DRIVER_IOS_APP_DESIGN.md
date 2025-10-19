# Driver iOS App - Design Document

## Overview
This document outlines the design and architecture of the Speedy Van Driver iOS application built with Expo and React Native.

## Technology Stack
- **Framework**: Expo SDK 52
- **Language**: TypeScript
- **UI Library**: React Native with Expo components
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context + Hooks
- **API Communication**: Fetch API with Bearer Token Authentication
- **Real-time Updates**: Pusher.js
- **Maps**: React Native Maps (expo-location)
- **Location Tracking**: expo-location with background tracking
- **Push Notifications**: expo-notifications
- **Storage**: expo-secure-store for tokens

## App Architecture

### Directory Structure
```
mobile/
└── driver-app/
    ├── app/                    # Expo Router pages
    │   ├── (auth)/            # Authentication screens
    │   │   ├── login.tsx
    │   │   ├── forgot-password.tsx
    │   │   └── reset-password.tsx
    │   ├── (tabs)/            # Main app tabs
    │   │   ├── dashboard.tsx  # Main dashboard
    │   │   ├── jobs.tsx       # Jobs list
    │   │   ├── earnings.tsx   # Earnings
    │   │   ├── schedule.tsx   # Schedule
    │   │   └── profile.tsx    # Profile & settings
    │   ├── job/
    │   │   └── [id].tsx       # Job details
    │   ├── _layout.tsx        # Root layout
    │   └── index.tsx          # Entry point
    ├── components/            # Reusable components
    │   ├── JobCard.tsx
    │   ├── StatsCard.tsx
    │   ├── MapView.tsx
    │   └── LocationPermissionModal.tsx
    ├── services/              # API services
    │   ├── api.ts            # API client
    │   ├── auth.ts           # Authentication
    │   ├── location.ts       # Location tracking
    │   └── pusher.ts         # Real-time updates
    ├── contexts/              # React contexts
    │   ├── AuthContext.tsx
    │   ├── LocationContext.tsx
    │   └── JobsContext.tsx
    ├── hooks/                 # Custom hooks
    │   ├── useAuth.ts
    │   ├── useLocation.ts
    │   └── useJobs.ts
    ├── types/                 # TypeScript types
    │   └── index.ts
    ├── utils/                 # Utility functions
    │   └── helpers.ts
    ├── app.json              # Expo configuration
    ├── package.json
    └── tsconfig.json
```

## Core Features

### 1. Authentication
- **Login Screen**: Email/password authentication
- **Forgot Password**: Password reset flow
- **Token Management**: Secure storage of Bearer tokens
- **Auto-login**: Persistent authentication state

### 2. Dashboard
- **Statistics Cards**:
  - Assigned Jobs
  - Available Jobs
  - Completed Today
  - Total Earnings
  - Average Rating
- **Quick Actions**:
  - View assigned jobs
  - Browse available jobs
  - Check earnings
  - Update availability
- **Real-time Updates**: Pusher integration for live notifications

### 3. Jobs Management
- **Assigned Jobs**: Jobs assigned to the driver
- **Available Jobs**: Jobs available for claiming
- **Job Details**:
  - Customer information
  - Pickup/dropoff addresses
  - Estimated earnings
  - Distance and duration
  - Items to transport
  - Special instructions
- **Job Actions**:
  - Accept/Decline job
  - Start job
  - Update status
  - Complete job
  - Navigate to location

### 4. Location Tracking
- **Foreground Tracking**: Real-time location updates while app is active
- **Background Tracking**: Location updates when app is in background
- **Permission Handling**:
  - Request location permissions on first launch
  - Show permission modal with explanation
  - Handle permission denial gracefully
- **Live Demo**: Interactive map showing current location
- **Location Updates**: Send location updates to backend API

### 5. Map Integration
- **Interactive Map**: Display pickup and dropoff locations
- **Route Display**: Show route between locations
- **Current Location**: Display driver's current position
- **Navigation**: Open Apple Maps or Google Maps for turn-by-turn navigation

### 6. Real-time Notifications
- **Pusher Events**:
  - `route-matched`: New route assigned
  - `job-assigned`: New job assigned
  - `route-removed`: Route removed
  - `route-cancelled`: Route cancelled by admin
  - `drop-removed`: Drop removed from route
  - `notification`: General notifications
- **Push Notifications**: Local and remote notifications
- **Sound Alerts**: Audio notifications for important events

### 7. Earnings
- **Today's Earnings**: Earnings for current day
- **Total Earnings**: Lifetime earnings
- **Earnings Breakdown**: Detailed earnings by job
- **Payment History**: Past payments and invoices

### 8. Schedule
- **Availability Management**: Set available/unavailable times
- **Upcoming Jobs**: View scheduled jobs
- **Calendar View**: Visual representation of schedule

### 9. Profile & Settings
- **Profile Information**: Name, email, phone, photo
- **Vehicle Information**: Van details, license plate
- **Documents**: License, insurance, vehicle registration
- **Settings**:
  - Notifications preferences
  - Location tracking settings
  - Language preferences
  - Logout

## API Integration

### Authentication
- **Endpoint**: `/api/driver/auth/login`
- **Method**: POST
- **Body**: `{ email, password }`
- **Response**: `{ success, token, user }`

### Dashboard
- **Endpoint**: `/api/driver/dashboard`
- **Method**: GET
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ driver, jobs, statistics }`

### Jobs
- **List Jobs**: `GET /api/driver/jobs`
- **Job Details**: `GET /api/driver/jobs/:id`
- **Accept Job**: `POST /api/driver/jobs/:id/accept`
- **Decline Job**: `POST /api/driver/jobs/:id/decline`
- **Start Job**: `POST /api/driver/jobs/:id/start`
- **Complete Job**: `POST /api/driver/jobs/:id/complete`
- **Update Location**: `POST /api/driver/jobs/:id/location`

### Location Tracking
- **Endpoint**: `/api/driver/location`
- **Method**: POST
- **Body**: `{ latitude, longitude, timestamp, accuracy }`
- **Headers**: `Authorization: Bearer {token}`

## Design System

### Colors
```typescript
const colors = {
  primary: '#3B82F6',      // Blue
  secondary: '#10B981',    // Green
  accent: '#F59E0B',       // Amber
  danger: '#EF4444',       // Red
  warning: '#F59E0B',      // Amber
  success: '#10B981',      // Green
  background: '#F9FAFB',   // Light gray
  surface: '#FFFFFF',      // White
  text: {
    primary: '#111827',    // Dark gray
    secondary: '#6B7280',  // Medium gray
    disabled: '#9CA3AF',   // Light gray
  },
  border: '#E5E7EB',       // Very light gray
};
```

### Typography
```typescript
const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 20, fontWeight: '600' },
  h4: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: 'normal' },
  caption: { fontSize: 14, fontWeight: 'normal' },
  small: { fontSize: 12, fontWeight: 'normal' },
};
```

### Spacing
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### Components
- **JobCard**: Card displaying job information
- **StatsCard**: Card displaying statistics
- **Button**: Primary, secondary, outline, danger variants
- **Input**: Text input with validation
- **Modal**: Bottom sheet and center modal
- **Badge**: Status badges (assigned, available, completed)
- **Avatar**: User avatar with fallback
- **LoadingSpinner**: Loading indicator
- **EmptyState**: Empty state with icon and message

## Location Permissions

### iOS Requirements (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show nearby jobs and help customers track their delivery in real-time.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location even when the app is in the background to provide accurate delivery tracking to customers.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>We need your location in the background to track your delivery progress and provide real-time updates to customers.</string>

<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>fetch</string>
</array>
```

### Permission Flow
1. **First Launch**: Show permission explanation modal
2. **Request Permission**: Request "When In Use" permission
3. **Upgrade to Always**: After user accepts first job, request "Always" permission
4. **Background Tracking**: Enable background location tracking
5. **Permission Denied**: Show modal explaining why permission is needed

## Real-time Updates

### Pusher Configuration
```typescript
const pusher = new Pusher(PUSHER_KEY, {
  cluster: PUSHER_CLUSTER,
  forceTLS: true,
});

const channel = pusher.subscribe(`driver-${driverId}`);

channel.bind('route-matched', (data) => {
  // Handle new route assignment
  showNotification('New Route Assigned!');
  playSound();
  refreshDashboard();
});
```

## Apple Requirements Compliance

### App Store Requirements
1. **App Icon**: 1024x1024 PNG (no transparency)
2. **Launch Screen**: Splash screen with branding
3. **Privacy Policy**: Link to privacy policy
4. **Terms of Service**: Link to terms of service
5. **Support URL**: Link to support page
6. **App Description**: Clear description of app functionality
7. **Screenshots**: Required for all supported devices
8. **App Category**: Navigation or Business
9. **Content Rating**: Appropriate rating
10. **Test Account**: Provide test credentials for review

### Technical Requirements
1. **iOS Version**: Minimum iOS 13.4
2. **64-bit Support**: Required
3. **IPv6 Support**: Required
4. **HTTPS**: All network requests must use HTTPS
5. **Background Modes**: Declare background location usage
6. **Privacy Permissions**: Clear descriptions for all permissions
7. **Error Handling**: Graceful error handling
8. **Offline Support**: Handle network errors gracefully
9. **Performance**: Fast launch time, smooth scrolling
10. **Accessibility**: VoiceOver support, dynamic type

### Security Requirements
1. **Secure Storage**: Use expo-secure-store for tokens
2. **HTTPS Only**: No HTTP requests
3. **Certificate Pinning**: Optional but recommended
4. **Token Expiration**: Handle token refresh
5. **Logout**: Clear all stored data on logout

## Testing Strategy

### Unit Tests
- API service functions
- Utility functions
- Custom hooks
- Context providers

### Integration Tests
- Authentication flow
- Job acceptance flow
- Location tracking
- Real-time updates

### Manual Testing
- Test on real iOS device
- Test location permissions
- Test background location tracking
- Test push notifications
- Test real-time updates
- Test offline behavior
- Test error scenarios

## Build Configuration

### app.json
```json
{
  "expo": {
    "name": "Speedy Van Driver",
    "slug": "speedy-van-driver",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3B82F6"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.speedyvan.driver",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "...",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "...",
        "NSLocationAlwaysUsageDescription": "...",
        "UIBackgroundModes": ["location", "fetch"]
      }
    },
    "plugins": [
      "expo-router",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "...",
          "locationAlwaysPermission": "...",
          "locationWhenInUsePermission": "..."
        }
      ]
    ]
  }
}
```

## Environment Variables
```
API_BASE_URL=https://api.speedy-van.co.uk
PUSHER_KEY=your_pusher_key
PUSHER_CLUSTER=eu
```

## Deployment

### Development
```bash
npx expo start
```

### iOS Simulator
```bash
npx expo start --ios
```

### Production Build
```bash
eas build --platform ios --profile production
```

### App Store Submission
1. Build production app with EAS
2. Upload to App Store Connect
3. Fill in app metadata
4. Submit for review
5. Wait for approval

## Future Enhancements
1. **Offline Mode**: Cache jobs and sync when online
2. **Chat**: In-app chat with customers
3. **Photo Upload**: Upload photos of items/delivery
4. **Signature Capture**: Customer signature on delivery
5. **Route Optimization**: Suggest optimal route for multiple jobs
6. **Earnings Analytics**: Detailed earnings charts and reports
7. **Performance Metrics**: Track on-time delivery rate, customer ratings
8. **Multi-language Support**: Support for multiple languages
9. **Dark Mode**: Dark theme support
10. **Voice Navigation**: Voice-guided navigation

