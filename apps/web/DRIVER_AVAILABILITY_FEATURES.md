# Driver Availability, Shifts & Location Features

This document describes the implementation of Task #5 from the cursor_tasks.md roadmap: **Availability, Shifts & Location**.

## Overview

The driver portal now includes comprehensive availability management, optional scheduled shifts, and background location tracking (with consent) while online.

## Features Implemented

### 1. Enhanced Availability Management

**API Endpoint:** `PUT /api/driver/availability`

**Features:**

- Toggle between `online`, `break`, and `offline` status
- Optional location coordinates with availability updates
- Location consent management
- Real-time status updates

**Request Body:**

```json
{
  "availability": "online|break|offline",
  "latitude": 51.5074, // Optional
  "longitude": -0.1278, // Optional
  "locationConsent": true // Optional
}
```

### 2. Shift Management

**API Endpoints:**

- `GET /api/driver/shifts` - List all active shifts
- `POST /api/driver/shifts` - Create new shift
- `PUT /api/driver/shifts/[id]` - Update existing shift
- `DELETE /api/driver/shifts/[id]` - Soft delete shift

**Shift Features:**

- One-time and recurring shifts
- Custom recurring days (Monday-Sunday)
- Start and end times
- Active/inactive status
- Soft deletion (sets isActive to false)

**Request Body for Creating/Updating Shifts:**

```json
{
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T17:00:00Z",
  "isRecurring": true,
  "recurringDays": ["monday", "wednesday", "friday"]
}
```

### 3. Background Location Tracking

**API Endpoint:** `POST /api/driver/location`

**Features:**

- Background location updates while online
- Consent-based tracking
- Automatic location updates every 30 seconds
- High-accuracy GPS with fallback options

**Location Tracker Component:**

- React component for background tracking
- Automatic start/stop based on online status and consent
- Error handling for location permission issues
- Rate limiting to prevent excessive API calls

### 4. Enhanced Dashboard

**New Dashboard Sections:**

- Location Status Card
  - Shows consent status
  - Displays last update time
  - Shows current coordinates
- Upcoming Shifts Card
  - Lists next 3 shifts
  - Shows recurring pattern
  - Active/inactive status

## Database Schema Changes

### New Tables

**DriverShift:**

```sql
CREATE TABLE "DriverShift" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  "recurringDays" TEXT[] NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);
```

### Updated Tables

**DriverAvailability:**

- Added `locationConsent` boolean field
- Enhanced location tracking capabilities

## UI Components

### 1. Schedule Page (`/driver/schedule`)

- Location consent toggle
- Shift management interface
- Add/edit/delete shifts
- Recurring shift configuration

### 2. Enhanced Dashboard (`/driver`)

- Location status display
- Upcoming shifts preview
- Real-time availability toggle with location

### 3. LocationTracker Component

- Background location tracking
- Automatic API updates
- Error handling and user feedback

## Security & Privacy

### Location Consent

- Explicit consent required before location tracking
- Consent can be revoked at any time
- Location only tracked when online and consent given
- Clear user feedback about location status

### Data Protection

- Location data stored securely in database
- API endpoints require driver authentication
- Rate limiting on location updates
- Soft deletion for shifts (data retention)

## Testing

### Test Account

Use the existing driver test account:

- Email: `driver@test.com`
- Password: `password123`

### Test Scenarios

1. **Availability Toggle:**
   - Go online/offline
   - Test with and without location consent
   - Verify status updates in real-time

2. **Shift Management:**
   - Create one-time shift
   - Create recurring shift
   - Edit existing shift
   - Delete shift (soft delete)

3. **Location Tracking:**
   - Enable location consent
   - Go online and verify location updates
   - Check location in dashboard
   - Disable location consent

## API Response Examples

### Dashboard Response

```json
{
  "driver": { ... },
  "kpis": { ... },
  "alerts": [ ... ],
  "shifts": [
    {
      "id": "shift_123",
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T17:00:00Z",
      "isRecurring": true,
      "recurringDays": ["monday", "wednesday", "friday"],
      "isActive": true
    }
  ],
  "locationStatus": {
    "hasConsent": true,
    "lastSeen": "2024-01-15T10:30:00Z",
    "coordinates": {
      "lat": 51.5074,
      "lng": -0.1278
    }
  },
  "availableJobs": [ ... ]
}
```

## Future Enhancements

1. **Geofencing:** Automatic availability based on location zones
2. **Shift Conflicts:** Warning for overlapping shifts
3. **Location History:** Track location over time for analytics
4. **Push Notifications:** Notify when approaching shift start time
5. **Integration:** Connect with external calendar systems

## Troubleshooting

### Common Issues

1. **Location Not Updating:**
   - Check browser location permissions
   - Verify consent is enabled
   - Ensure driver is online

2. **Shifts Not Saving:**
   - Validate start/end times
   - Check recurring days selection
   - Verify API authentication

3. **Dashboard Not Loading:**
   - Check driver authentication
   - Verify database connection
   - Review browser console for errors

### Debug Mode

Enable browser developer tools to see:

- Location tracking logs
- API request/response details
- Component state changes
