# Job Feed & Claiming Feature

This document outlines the implementation of the Job Feed & Claiming feature for the Driver Portal, following the requirements from `cursor_tasks.md` section 6.

## Overview

The Job Feed & Claiming feature allows drivers to:

- View available jobs in their area
- Filter jobs by various criteria
- Claim jobs with race-condition handling
- Accept or decline claimed jobs within a time limit

## Features Implemented

### 1. Job Feed Display

- **Location-based filtering**: Jobs are filtered by distance from driver's location
- **Real-time updates**: Job feed refreshes automatically and shows claimed jobs
- **Rich job information**: Shows pickup/dropoff addresses, payment, schedule, vehicle requirements
- **Visual indicators**: Distance badges, payment amounts, and job extras

### 2. Advanced Filtering

- **Radius filter**: 10km, 25km, 50km, 100km options
- **Vehicle type filter**: Small van, Luton van, Large van
- **Date filter**: Specific date selection
- **Time slot filter**: Morning, Afternoon, Evening
- **Real-time filtering**: Filters apply immediately without page refresh

### 3. Job Claiming System

- **One-click claiming**: Drivers can claim jobs with a single click
- **Race condition handling**: Uses database transactions to prevent double-claiming
- **Automatic expiry**: Claimed jobs expire after 5 minutes if not accepted
- **Status feedback**: Clear feedback for successful/failed claims

### 4. Claimed Job Management

- **Timer display**: Shows countdown timer for claimed jobs
- **Accept/Decline actions**: Clear buttons for accepting or declining
- **Visual progress**: Progress bar showing time remaining
- **Auto-refresh**: Automatically checks for claimed job status

### 5. Compliance Checks

- **Document validation**: Blocks claiming if documents are expired
- **License validation**: Checks driver license expiry
- **Insurance validation**: Verifies insurance policy expiry
- **Online status**: Requires driver to be online to claim jobs

## API Endpoints

### GET `/api/driver/jobs/available`

Returns available jobs with filtering options.

**Query Parameters:**

- `radius` (number): Search radius in kilometers
- `vehicleType` (string): Filter by vehicle type
- `date` (string): Filter by specific date (YYYY-MM-DD)
- `timeSlot` (string): Filter by time slot (am/pm/evening)

**Response:**

```json
{
  "jobs": [
    {
      "id": "job_id",
      "code": "JOB001",
      "pickupAddress": "123 Main St",
      "dropoffAddress": "456 Oak Ave",
      "preferredDate": "2024-01-15T10:00:00Z",
      "timeSlot": "am",
      "vanSize": "small",
      "amountPence": 4500,
      "distance": 2.5,
      "distanceMeters": 2500,
      "durationSeconds": 1800
    }
  ],
  "filters": { ... },
  "driverLocation": { "lat": 51.5074, "lng": -0.1278 }
}
```

### POST `/api/driver/jobs/:id/claim`

Claims a specific job for the driver.

**Response:**

```json
{
  "success": true,
  "assignment": {
    "id": "assignment_id",
    "status": "claimed",
    "expiresAt": "2024-01-15T10:05:00Z"
  },
  "message": "Job claimed successfully. You have 5 minutes to accept or decline."
}
```

### POST `/api/driver/jobs/:id/accept`

Accepts a claimed job.

### POST `/api/driver/jobs/:id/decline`

Declines a claimed job.

### POST `/api/driver/jobs/expire-claimed`

Background endpoint to expire timed-out claimed jobs.

## Components

### JobFeed Component

- Main job feed display with filtering
- Job cards with detailed information
- Claim buttons with loading states
- Error handling and blocking reasons

### ClaimedJobHandler Component

- Displays claimed job with countdown timer
- Accept/Decline buttons
- Progress bar for time remaining
- Auto-refresh functionality

## Database Schema

The feature uses the existing `Booking` and `Assignment` tables:

```sql
-- Bookings table (existing)
CREATE TABLE "Booking" (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  status TEXT DEFAULT 'confirmed',
  driverId TEXT,
  pickupAddress TEXT,
  dropoffAddress TEXT,
  pickupLat REAL,
  pickupLng REAL,
  dropoffLat REAL,
  dropoffLng REAL,
  preferredDate TIMESTAMP,
  timeSlot TEXT,
  vanSize TEXT,
  amountPence INTEGER DEFAULT 0,
  -- ... other fields
);

-- Assignments table (existing)
CREATE TABLE "Assignment" (
  id TEXT PRIMARY KEY,
  bookingId TEXT UNIQUE,
  driverId TEXT,
  status TEXT DEFAULT 'claimed',
  expiresAt TIMESTAMP,
  score INTEGER,
  -- ... other fields
);
```

## Race Condition Handling

The claiming system uses database transactions to prevent race conditions:

1. **Atomic Check**: Verifies job is still available
2. **Assignment Creation**: Creates assignment record atomically
3. **Booking Update**: Updates booking status in same transaction
4. **Conflict Resolution**: Returns appropriate error if job already claimed

## Security & Validation

### Driver Status Checks

- Must be approved (`onboardingStatus === 'approved'`)
- Must be online (`availability.status === 'online'`)
- No active jobs (prevents claiming multiple jobs)

### Document Validation

- No expired documents
- Valid driver license
- Valid insurance policy
- All required documents uploaded

### Location Validation

- Driver must have location consent enabled
- Location must be within service area
- Distance calculations use Haversine formula

## Testing

### Test Data

Use the provided test script to create sample jobs:

```bash
cd apps/web
npx tsx scripts/create-test-jobs.ts
```

### Manual Testing

1. **Job Feed**: Visit `/driver/jobs` to see available jobs
2. **Filtering**: Test different filter combinations
3. **Claiming**: Claim a job and verify timer appears
4. **Accept/Decline**: Test both accept and decline flows
5. **Expiry**: Wait for job to expire and verify it becomes available again

## Future Enhancements

### Planned Features

- **Push notifications**: Real-time job alerts
- **Job matching**: AI-powered job recommendations
- **Batch operations**: Claim multiple similar jobs
- **Advanced routing**: Optimized pickup/dropoff routes
- **Performance metrics**: Track claim success rates

### Technical Improvements

- **Caching**: Redis cache for job listings
- **WebSockets**: Real-time job updates
- **Background jobs**: Automated job expiry processing
- **Analytics**: Detailed job claiming analytics

## Error Handling

### Common Error Scenarios

- **Job already claimed**: Another driver claimed the job
- **Driver offline**: Must be online to claim jobs
- **Documents expired**: Renew documents to continue
- **Network errors**: Retry mechanism for failed requests
- **Expired assignment**: Job expired before action taken

### User Feedback

- **Toast notifications**: Success/error messages
- **Loading states**: Visual feedback during operations
- **Error alerts**: Clear error messages with resolution steps
- **Status indicators**: Real-time status updates

## Performance Considerations

### Optimization Strategies

- **Pagination**: Limit job results to 50 per request
- **Distance calculation**: Efficient Haversine implementation
- **Database indexing**: Optimized queries for job filtering
- **Caching**: Cache frequently accessed data
- **Lazy loading**: Load job details on demand

### Monitoring

- **Response times**: Track API performance
- **Error rates**: Monitor claim success/failure rates
- **User engagement**: Track job claiming patterns
- **System health**: Monitor database and API health

## Deployment Notes

### Environment Variables

Ensure these are configured:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Authentication secret
- `NEXTAUTH_URL`: Application URL

### Database Migrations

The feature uses existing database schema, no new migrations required.

### Background Jobs

Set up a cron job to call `/api/driver/jobs/expire-claimed` every minute:

```bash
# Example cron job
* * * * * curl -X POST https://your-app.com/api/driver/jobs/expire-claimed
```

## Support & Troubleshooting

### Common Issues

1. **Jobs not showing**: Check driver location and online status
2. **Claiming fails**: Verify documents and approval status
3. **Timer not working**: Check browser JavaScript console
4. **Filters not applying**: Verify API endpoint responses

### Debug Information

- Check browser network tab for API calls
- Review server logs for error messages
- Verify database state for assignments
- Test with different driver accounts

---

This implementation provides a robust, scalable job feed and claiming system that meets all requirements from the cursor_tasks specification while maintaining security, performance, and user experience standards.
