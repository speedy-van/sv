# Speedy Van - iOS Driver App

Professional iOS driver application built with Swift and SwiftUI for the Speedy Van delivery platform.

## Features

✅ **Authentication**
- Secure driver login with email/password
- Session management with JWT tokens
- Automatic token refresh

✅ **Real-time Job Management**
- View available and assigned jobs
- Accept/Decline job invitations
- Update job progress (En Route → Arrived → Loading → In Transit → Unloading → Completed)
- Track earnings per job

✅ **GPS Tracking**
- Real-time location tracking during active jobs
- Background location updates
- Automatic location sharing to customers and admin
- Privacy-first: location only shared when on active jobs

✅ **Driver Availability**
- Toggle online/offline status
- Automatic location consent management
- Cannot go offline with active jobs

✅ **Push Notifications**
- New job notifications
- Job status updates
- Real-time communication

✅ **Beautiful UI**
- Modern iOS design with SwiftUI
- Dark mode support
- Smooth animations
- Professional color scheme matching web app

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+
- CocoaPods or Swift Package Manager

## Installation

### 1. Open in Xcode

```bash
cd mobile/ios-driver-app
open SpeedyVanDriver.xcodeproj
```

### 2. Configure API Endpoint

Edit `Config/AppConfig.swift`:

```swift
static let apiBaseURL = "https://api.speedy-van.co.uk" // Production
// static let apiBaseURL = "http://localhost:3000" // Development
```

### 3. Add Required Capabilities

In Xcode:
- Go to Signing & Capabilities
- Add "Background Modes":
  - Location updates
  - Background fetch
  - Remote notifications
- Add "Push Notifications"

### 4. Configure Info.plist

The following permissions are pre-configured:
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `NSLocationAlwaysUsageDescription`

### 5. Build and Run

Select your target device/simulator and press `Cmd + R`

## Project Structure

```
SpeedyVanDriver/
├── App/
│   ├── SpeedyVanDriverApp.swift      # App entry point
│   └── AppDelegate.swift              # Push notifications & background tasks
├── Config/
│   └── AppConfig.swift                # API & app configuration
├── Models/
│   ├── User.swift                     # User & authentication models
│   ├── Job.swift                      # Job & booking models
│   ├── Location.swift                 # Location & tracking models
│   └── Availability.swift             # Driver availability models
├── Services/
│   ├── NetworkService.swift           # Core networking layer
│   ├── AuthService.swift              # Authentication service
│   ├── JobService.swift               # Job management service
│   ├── LocationService.swift          # GPS & location tracking
│   └── NotificationService.swift      # Push notifications
├── ViewModels/
│   ├── AuthViewModel.swift            # Login/logout logic
│   ├── DashboardViewModel.swift       # Dashboard state
│   ├── JobsViewModel.swift            # Jobs list logic
│   └── TrackingViewModel.swift        # Location tracking logic
├── Views/
│   ├── Auth/
│   │   ├── LoginView.swift            # Login screen
│   │   └── SplashView.swift           # Splash/loading screen
│   ├── Dashboard/
│   │   ├── DashboardView.swift        # Main dashboard
│   │   ├── AvailabilityToggleView.swift # Online/offline toggle
│   │   └── StatsCardView.swift        # Earnings/stats cards
│   ├── Jobs/
│   │   ├── JobsListView.swift         # Available & assigned jobs list
│   │   ├── JobCardView.swift          # Job card component
│   │   ├── JobDetailView.swift        # Job details screen
│   │   └── JobProgressView.swift      # Job progress tracker
│   └── Components/
│       ├── LoadingView.swift          # Loading spinner
│       ├── ErrorView.swift            # Error messages
│       └── CustomButton.swift         # Reusable button
├── Extensions/
│   ├── Color+Extensions.swift         # Brand colors
│   ├── View+Extensions.swift          # View helpers
│   └── Date+Extensions.swift          # Date formatting
└── Info.plist                         # App permissions & config
```

## API Integration

The app integrates with the following backend APIs:

### Authentication
- `POST /api/driver/auth/login` - Driver login
- `GET /api/driver/session` - Session validation

### Jobs Management
- `GET /api/driver/jobs` - Get available and assigned jobs
- `GET /api/driver/jobs/:id` - Get job details
- `POST /api/driver/jobs/:id/accept` - Accept job
- `POST /api/driver/jobs/:id/decline` - Decline job
- `PUT /api/driver/jobs/:id/progress` - Update job progress

### Location Tracking
- `POST /api/driver/tracking` - Send location update
- `GET /api/driver/tracking` - Get tracking history

### Availability
- `GET /api/driver/availability` - Get availability status
- `PUT /api/driver/availability` - Update availability

### Profile
- `GET /api/driver/profile` - Get driver profile
- `PUT /api/driver/profile` - Update profile

## Testing

### Test Credentials

```
Email: driver@test.com
Password: password123
```

### Test Flow

1. **Login**
   - Open app → Enter credentials → Tap "Sign In"
   
2. **View Jobs**
   - Dashboard → Jobs tab → See available jobs
   
3. **Accept Job**
   - Tap job card → View details → Tap "Accept Job"
   
4. **Start Job**
   - Dashboard → "Active Jobs" section → Tap job
   - Tap "Start Job" → Enable location sharing
   
5. **Update Progress**
   - Job detail screen → Progress buttons
   - En Route → Arrived → Loading → In Transit → Unloading → Complete
   
6. **Complete Job**
   - Final step → Job marked as completed
   - Earnings added to dashboard

## Deployment

### TestFlight (Beta)

1. Archive the app in Xcode
2. Upload to App Store Connect
3. Create TestFlight build
4. Add internal/external testers

### App Store

1. Complete TestFlight testing
2. Submit for App Store review
3. Add app metadata, screenshots, description
4. Wait for approval (1-2 days typically)

## Architecture

### MVVM Pattern
- **Models**: Data structures matching backend API
- **Views**: SwiftUI views (UI only)
- **ViewModels**: Business logic, API calls, state management

### Networking Layer
- Custom `NetworkService` with error handling
- Automatic token refresh
- Request/response logging

### Location Tracking
- Background location updates every 30 seconds
- Only active when driver has jobs
- Battery-efficient with significant location changes

### State Management
- `@StateObject` for view model lifecycle
- `@Published` for reactive updates
- Combine framework for async operations

## Contact Information

- **Support**: support@speedy-van.co.uk
- **Phone**: 07901846297
- **Company**: Speedy Van
- **Address**: Office 2.18, 1 Barrack Street, Hamilton, ML3 0DG, Scotland

## License

Proprietary - Speedy Van Ltd. All rights reserved.

