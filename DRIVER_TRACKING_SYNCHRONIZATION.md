# Driver Tracking Synchronization Guide

## Overview

This document ensures that driver tracking is properly synchronized with admin and customer tracking systems. All three interfaces must show consistent data and real-time updates.

## Tracking Data Flow

```
Driver App → Location Update → Tracking API → Database → Real-time Notifications → Admin/Customer
     ↓              ↓              ↓           ↓              ↓
GPS Coordinates → POST /api/driver/tracking → TrackingPing → Pusher → Live Updates
```

## Synchronized Data Points

### 1. **Location Tracking**
- **Driver**: Sends GPS coordinates via `/api/driver/tracking`
- **Database**: Stores in `TrackingPing` table
- **Real-time**: Broadcasts to `tracking-{bookingReference}` and `admin-tracking` channels
- **Admin**: Receives live location updates in tracking dashboard
- **Customer**: Receives live location updates in tracking page

### 2. **Job Events**
- **Driver**: Creates events when accepting, starting, completing jobs
- **Database**: Stores in `JobEvent` table with proper step enum values
- **Real-time**: Broadcasts job status changes
- **Admin**: Shows job timeline and progress
- **Customer**: Shows job status and milestones

### 3. **Status Updates**
- **Driver**: Updates assignment and booking status
- **Database**: Updates `Assignment` and `Booking` tables
- **Real-time**: Broadcasts status changes
- **Admin**: Shows current job status
- **Customer**: Shows delivery progress

## Implementation Details

### Driver Tracking API (`/api/driver/tracking`)

#### POST - Location Update
```typescript
{
  bookingId: string,
  latitude: number,
  longitude: number,
  accuracy?: number
}
```

#### Real-time Notifications Sent:
1. **Customer Channel**: `tracking-{bookingReference}`
   - Event: `location-update`
   - Data: `{ driverId, lat, lng, timestamp, accuracy, bookingId }`

2. **Admin Channel**: `admin-tracking`
   - Event: `location-update`
   - Data: `{ driverId, bookingId, bookingReference, lat, lng, timestamp, customerName }`

### Job Event Creation

#### Accept Job (`/api/driver/jobs/[id]/accept`)
- Creates `JobEvent` with step: `accepted`
- Updates `Assignment` status to `accepted`
- Sends real-time notifications

#### Start Job (`/api/driver/jobs/[id]/start`)
- Creates `JobEvent` with step: `navigate_to_pickup`
- Updates assignment status
- Sends real-time notifications

#### Complete Job (`/api/driver/jobs/[id]/complete`)
- Creates `JobEvent` with step: `job_completed`
- Updates `Assignment` status to `completed`
- Updates `Booking` status to `COMPLETED`
- Sends real-time notifications

## Database Schema Alignment

### TrackingPing Table
```sql
CREATE TABLE "TrackingPing" (
  id TEXT PRIMARY KEY,
  bookingId TEXT NOT NULL,
  driverId TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### JobEvent Table
```sql
CREATE TABLE "JobEvent" (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  step JobStep NOT NULL,
  payload JSON,
  mediaUrls TEXT[],
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  createdBy TEXT NOT NULL
);
```

### JobStep Enum Values
```typescript
enum JobStep {
  navigate_to_pickup = 'navigate_to_pickup',
  arrived_at_pickup = 'arrived_at_pickup',
  loading_started = 'loading_started',
  loading_completed = 'loading_completed',
  en_route_to_dropoff = 'en_route_to_dropoff',
  arrived_at_dropoff = 'arrived_at_dropoff',
  unloading_started = 'unloading_started',
  unloading_completed = 'unloading_completed',
  job_completed = 'job_completed',
  customer_signature = 'customer_signature',
  damage_notes = 'damage_notes',
  item_count_verification = 'item_count_verification'
}
```

## Real-time Channel Structure

### Customer Tracking Channels
- `tracking-{bookingReference}` - Live location updates
- `private-tracking-{bookingId}` - Secure customer tracking

### Admin Tracking Channels
- `admin-tracking` - All tracking updates
- `admin-notifications` - Job status changes

### Driver Channels
- `driver-{driverId}` - Individual driver notifications
- `driver-notifications` - General driver updates

## Verification Checklist

### ✅ Driver Actions Create Proper Events
- [ ] Accept job creates `accepted` event
- [ ] Start job creates `navigate_to_pickup` event
- [ ] Complete job creates `job_completed` event
- [ ] All events stored in `JobEvent` table

### ✅ Location Updates Synchronized
- [ ] Driver location updates stored in `TrackingPing`
- [ ] Real-time notifications sent to customer
- [ ] Real-time notifications sent to admin
- [ ] All systems receive same location data

### ✅ Status Updates Consistent
- [ ] Assignment status updates properly
- [ ] Booking status updates properly
- [ ] Real-time notifications sent
- [ ] Admin dashboard shows correct status
- [ ] Customer tracking shows correct status

### ✅ Real-time Notifications Working
- [ ] Pusher channels configured correctly
- [ ] Events broadcast to all relevant channels
- [ ] Admin dashboard receives updates
- [ ] Customer tracking receives updates
- [ ] Driver app receives notifications

## Testing Scenarios

### 1. **Complete Job Flow**
1. Driver accepts job → Check `JobEvent` created
2. Driver starts job → Check `JobEvent` created
3. Driver sends location updates → Check real-time notifications
4. Driver completes job → Check `JobEvent` created
5. Verify admin dashboard shows all events
6. Verify customer tracking shows all events

### 2. **Location Tracking Flow**
1. Driver sends location update → Check `TrackingPing` created
2. Verify real-time notification sent to customer
3. Verify real-time notification sent to admin
4. Check data consistency across all interfaces

### 3. **Status Synchronization**
1. Driver changes job status → Check database updates
2. Verify admin dashboard reflects change
3. Verify customer tracking reflects change
4. Check real-time notifications sent

## Troubleshooting

### Common Issues
1. **Missing Job Events**: Check if driver actions create proper `JobEvent` records
2. **No Real-time Updates**: Verify Pusher configuration and channel names
3. **Inconsistent Status**: Check if all status updates go through proper API endpoints
4. **Location Not Updating**: Verify driver tracking API and real-time notifications

### Debug Commands
```bash
# Check recent tracking pings
SELECT * FROM "TrackingPing" ORDER BY "createdAt" DESC LIMIT 10;

# Check recent job events
SELECT * FROM "JobEvent" ORDER BY "createdAt" DESC LIMIT 10;

# Check assignment statuses
SELECT id, status, "updatedAt" FROM "Assignment" ORDER BY "updatedAt" DESC LIMIT 10;
```

## Conclusion

This synchronization ensures that all three tracking systems (driver, admin, customer) show consistent, real-time data. The driver app is the source of truth for location updates and job progress, which is then synchronized across all interfaces through the database and real-time notifications.
