# Dispatch & Live Ops Implementation

## Overview

The Dispatch & Live Ops system provides real-time management of drivers, jobs, and incidents for the Speedy Van platform. It features a comprehensive dashboard with Kanban-style job boards, live mapping, smart auto-assignment, and incident management.

## Features Implemented

### 1. Real-Time Dashboard

- **Live Status Indicators**: Real-time connection status and last update timestamps
- **Quick Stats**: Available drivers, open incidents, and active jobs at a glance
- **Auto-Assign Toggle**: Enable/disable automatic job assignment
- **Real-time Updates**: 30-second auto-refresh with configurable intervals

### 2. Kanban Board View

- **6 Status Columns**: Unassigned, Assigned, En Route, At Pickup, In Transit, Completed
- **Drag & Drop Ready**: Prepared for future drag-and-drop functionality
- **Job Cards**: Compact cards showing job details, customer info, and quick actions
- **Status Filtering**: Filter jobs by status, area, and driver
- **Quick Actions**: Auto-assign, manual assign, track, and contact buttons

### 3. Live Map View

- **Interactive Map**: Placeholder for Google Maps/Mapbox integration
- **Driver Markers**: Real-time driver locations with status indicators
- **Job Markers**: Pickup and dropoff locations with status colors
- **Map Controls**: Traffic overlay, heat map, draw radius, and fullscreen mode
- **Sidebar Panels**: Auto-assign rules, active drivers, jobs, and incidents
- **Legend**: Color-coded markers for different entity types

### 4. Smart Auto-Assignment

- **Sophisticated Algorithm**: Multi-factor scoring system
- **Configurable Rules**:
  - Search radius (1-50km)
  - Minimum driver rating (1-5 stars)
  - Maximum jobs per driver (1-10)
  - Vehicle type filtering
  - Load capacity requirements
- **Priority Weights**: Configurable importance of distance, rating, experience, and current load
- **Assignment Logging**: Detailed audit trail of why drivers were selected or skipped

### 5. Incident Management

- **Incident Categories**: Accident, breakdown, delay, damage, customer complaint, other
- **Severity Levels**: Low, medium, high, critical
- **Resolution Workflow**: Create, escalate, resolve, and archive incidents
- **Notes System**: Add notes with timestamps and author tracking
- **Audit Trail**: Complete history of incident actions

### 6. Driver Management

- **Real-time Status**: Online, offline, break status tracking
- **Driver Profiles**: Rating, experience, vehicle info, current jobs
- **Quick Actions**: Call, message, track, and view details
- **Performance Metrics**: Completion rates, ratings, and incident history

## API Endpoints

### Core Dispatch Endpoints

#### `GET /api/admin/dispatch/realtime`

- Returns real-time data for active jobs, available drivers, and incidents
- Includes driver locations and recent updates
- Used for live dashboard updates

#### `POST /api/admin/dispatch/realtime`

- Handles real-time actions: update job status, assign jobs, create incidents
- Supports atomic operations with audit logging

#### `POST /api/admin/dispatch/smart-assign`

- Implements sophisticated auto-assignment algorithm
- Returns detailed scoring and reasoning for assignments
- Supports custom assignment rules

#### `POST /api/admin/dispatch/assign`

- Basic job assignment endpoint
- Supports manual and auto-assignment modes
- Includes conflict prevention

### Incident Management

#### `GET /api/admin/dispatch/incidents`

- List incidents with filtering by status, driver, and date range
- Supports pagination and sorting

#### `POST /api/admin/dispatch/incidents`

- Create new incidents with category, severity, and description
- Links to drivers and jobs when applicable

#### `GET /api/admin/dispatch/incidents/[id]`

- Get detailed incident information
- Includes driver, job, and assignment details

#### `PUT /api/admin/dispatch/incidents/[id]`

- Update incident status (resolve, escalate, update)
- Add notes and modify incident details
- Complete audit trail

#### `DELETE /api/admin/dispatch/incidents/[id]`

- Archive incidents (soft delete)
- Maintains audit history

### Auto-Assign Configuration

#### `GET /api/admin/dispatch/auto-assign`

- Get current auto-assignment configuration
- Returns rules, weights, and settings

#### `POST /api/admin/dispatch/auto-assign`

- Update auto-assignment settings
- Toggle enable/disable status

## Data Models

### Job Status Flow

```
open → assigned → in_progress → picked_up → in_transit → completed
```

### Driver Status

- `online`: Available for assignments
- `offline`: Not available
- `break`: On break, temporarily unavailable

### Incident Status

- `open`: New incident requiring attention
- `escalated`: Incident escalated to higher level
- `resolved`: Incident resolved
- `archived`: Incident archived

## Smart Assignment Algorithm

The auto-assignment system uses a weighted scoring algorithm:

### Scoring Factors

1. **Distance (70% weight)**: Closer drivers score higher
2. **Rating (20% weight)**: Higher-rated drivers score higher
3. **Experience (10% weight)**: More experienced drivers score higher
4. **Current Load (50% weight)**: Drivers with fewer jobs score higher
5. **Availability (10% weight)**: Online drivers only

### Eligibility Checks

- Driver must be online and approved
- Driver must be within search radius
- Driver must meet minimum rating requirement
- Driver must not exceed maximum jobs limit
- Driver must have appropriate vehicle type (if specified)

### Assignment Logging

Every assignment includes:

- Selected driver and score
- All candidate drivers and their scores
- Reasons for selection/exclusion
- Assignment rules used
- Timestamp and admin user

## Real-Time Features

### Live Updates

- 30-second auto-refresh interval (configurable)
- Real-time connection status indicator
- Last update timestamp display
- Optimistic UI updates with server reconciliation

### WebSocket Ready

The system is prepared for WebSocket integration:

- Real-time driver location updates
- Live job status changes
- Instant incident notifications
- Push notifications for critical events

## Security & Audit

### Role-Based Access Control

- Admin-only access to dispatch features
- Granular permissions for different actions
- Session-based authentication

### Audit Trail

Every action is logged with:

- Actor (admin user)
- Action performed
- Entity and entity ID
- Before/after data (diff)
- IP address and user agent
- Timestamp

### Data Validation

- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- Rate limiting ready

## Performance Optimizations

### Database Queries

- Optimized queries with proper indexing
- Eager loading of related data
- Pagination for large datasets
- Caching ready for frequently accessed data

### Frontend Performance

- Lazy loading of components
- Optimistic updates
- Debounced search and filters
- Efficient re-rendering with React optimization

## Future Enhancements

### Planned Features

1. **Google Maps Integration**: Real map with driver tracking
2. **Push Notifications**: Real-time alerts for incidents and delays
3. **Mobile App**: Driver app for status updates and navigation
4. **Advanced Analytics**: Performance metrics and predictive analytics
5. **Route Optimization**: Multi-stop route planning
6. **Weather Integration**: Weather-based assignment adjustments

### Technical Improvements

1. **WebSocket Implementation**: Real-time bidirectional communication
2. **Redis Caching**: Improve response times for frequently accessed data
3. **Background Jobs**: Queue-based processing for heavy operations
4. **API Rate Limiting**: Protect against abuse
5. **Monitoring & Alerting**: System health monitoring

## Usage Examples

### Manual Job Assignment

```javascript
// Assign a job to a specific driver
const response = await fetch('/api/admin/dispatch/assign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobId: 'job_123',
    driverId: 'driver_456',
  }),
});
```

### Smart Auto-Assignment

```javascript
// Use smart assignment with custom rules
const response = await fetch('/api/admin/dispatch/smart-assign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobId: 'job_123',
    rules: {
      radius: 5000,
      rating: 4.0,
      maxJobs: 3,
      distanceWeight: 70,
      ratingWeight: 20,
      experienceWeight: 10,
    },
  }),
});
```

### Create Incident

```javascript
// Create a new incident
const response = await fetch('/api/admin/dispatch/incidents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'breakdown',
    description: 'Vehicle engine failure',
    severity: 'high',
    driverId: 'driver_456',
    jobId: 'job_123',
  }),
});
```

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...

# Maps (future)
GOOGLE_MAPS_API_KEY=...
MAPBOX_ACCESS_TOKEN=...

# Real-time (future)
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
```

### Auto-Assign Default Rules

```javascript
const defaultRules = {
  radius: 5000, // 5km
  vehicleType: 'any',
  capacity: 'any',
  loadLimit: 'any',
  rating: 4.0,
  maxJobs: 3,
  distanceWeight: 70,
  ratingWeight: 20,
  experienceWeight: 10,
  loadWeight: 50,
  timeWindowPriority: 'urgent',
  geographicPreference: 'nearest',
};
```

## Testing

### API Testing

- All endpoints include proper error handling
- Input validation testing
- Authentication and authorization testing
- Performance testing with large datasets

### Frontend Testing

- Component unit tests
- Integration tests for user flows
- Real-time update testing
- Responsive design testing

## Deployment

### Production Considerations

1. **Database**: Ensure proper indexing for dispatch queries
2. **Caching**: Implement Redis for frequently accessed data
3. **Monitoring**: Set up alerts for system health
4. **Backup**: Regular database backups
5. **SSL**: Secure all API endpoints

### Scaling

- Horizontal scaling ready
- Database connection pooling
- CDN for static assets
- Load balancing for API endpoints

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.

---

This implementation provides a solid foundation for real-time dispatch operations with room for future enhancements and integrations.
