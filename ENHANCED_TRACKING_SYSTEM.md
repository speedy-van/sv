# Enhanced Real-Time Tracking System

## Overview

The Enhanced Real-Time Tracking System provides comprehensive, real-time tracking capabilities for both customers and administrators. It supports tracking by both traditional reference codes and the new unified booking IDs (SV12345 format), with automatic real-time updates via WebSocket connections.

## Key Features

### 1. **Dual Booking ID Support**

- **Reference Codes**: Traditional booking references (e.g., "ABC123")
- **Unified Booking IDs**: New SV-prefixed IDs (e.g., "SV2025011500001")
- **Smart Lookup**: Automatically detects and searches both formats

### 2. **Real-Time Updates**

- **Live Location Tracking**: Driver location updates in real-time
- **Status Updates**: Instant booking status changes
- **Progress Updates**: Route completion percentage updates
- **ETA Updates**: Real-time estimated arrival time adjustments

### 3. **Comprehensive Tracking Data**

- **Route Progress**: Visual progress bars with percentage completion
- **Job Timeline**: Complete history of job events and milestones
- **Live Location**: Real-time driver coordinates with timestamps
- **ETA Calculation**: Intelligent arrival time estimation
- **Address Information**: Detailed pickup and delivery addresses

### 4. **Enhanced User Experience**

- **Connection Status**: Real-time connection monitoring
- **Auto-refresh**: Automatic data updates every 30 seconds
- **Search & Filtering**: Advanced search capabilities
- **Responsive Design**: Works on all device sizes
- **Interactive Maps**: Live map integration with driver locations

## System Architecture

### 1. **Core Components**

#### Tracking Service (`/lib/tracking-service.ts`)

- **Singleton Service**: Centralized tracking management
- **WebSocket Integration**: Pusher-based real-time communication
- **Connection Management**: Automatic reconnection and error handling
- **Channel Management**: Efficient subscription and unsubscription

#### React Hooks (`/hooks/useRealTimeTracking.ts`)

- **useRealTimeTracking**: Customer tracking hook
- **useAdminRealTimeTracking**: Admin dashboard hook
- **Automatic Cleanup**: Proper resource management
- **State Management**: Real-time data synchronization

#### API Endpoints

- **`/api/track/[code]`**: Enhanced tracking lookup with real-time data
- **`/api/admin/tracking`**: Admin tracking dashboard data
- **`/api/driver/tracking`**: Driver location updates

### 2. **Data Flow**

```
Driver App → Location Update → Tracking API → Database → WebSocket → Customer/Admin
     ↓              ↓              ↓           ↓         ↓
GPS Coordinates → POST /api/driver/tracking → TrackingPing → Pusher → Real-time Updates
```

### 3. **Real-Time Communication**

#### WebSocket Channels

- **`tracking-{bookingId}`**: Individual booking tracking
- **`admin-tracking`**: Admin dashboard updates
- **`private-tracking-{bookingId}`**: Secure customer tracking

#### Event Types

- **`location-update`**: Driver location changes
- **`status-update`**: Booking status changes
- **`progress-update`**: Route progress updates
- **`eta-update`**: Estimated arrival time changes

## Implementation Details

### 1. **Enhanced Tracking API**

#### Features

- **Dual ID Support**: Searches both reference and unified booking IDs
- **Comprehensive Data**: Includes addresses, driver info, progress, and timeline
- **Real-time Integration**: Provides tracking channel information
- **Progress Calculation**: Intelligent route progress based on job events

#### Response Structure

```typescript
{
  id: string;
  reference: string;
  unifiedBookingId?: string;
  status: string;
  pickupAddress: { label: string; postcode: string; coordinates: { lat: number; lng: number } };
  dropoffAddress: { label: string; postcode: string; coordinates: { lat: number; lng: number } };
  scheduledAt: string;
  driver?: { name: string; email: string };
  routeProgress: number;
  currentLocation?: { lat: number; lng: number; timestamp: string };
  eta?: { estimatedArrival: string; minutesRemaining: number; isOnTime: boolean };
  jobTimeline: Array<{ step: string; label: string; timestamp: string; notes?: string }>;
  trackingChannel: string;
  lastUpdated: string;
}
```

### 2. **Real-Time Tracking Service**

#### Connection Management

- **Automatic Reconnection**: Attempts reconnection with exponential backoff
- **Connection Monitoring**: Real-time connection status updates
- **Error Handling**: Graceful degradation when WebSocket unavailable
- **Resource Cleanup**: Proper cleanup of subscriptions and connections

#### Channel Management

- **Efficient Subscriptions**: Single subscription per booking
- **Automatic Cleanup**: Unsubscribes from previous bookings
- **Event Binding**: Binds to all relevant tracking events
- **Memory Management**: Prevents memory leaks

### 3. **React Integration**

#### Hook Features

- **Automatic Subscription**: Auto-subscribes to real-time updates
- **State Synchronization**: Keeps local state in sync with real-time data
- **Error Handling**: Provides error states and connection status
- **Cleanup**: Automatic cleanup on component unmount

#### Usage Example

```typescript
const {
  trackingData,
  isConnected,
  isLoading,
  error,
  lookupBooking,
  refreshData,
} = useRealTimeTracking({
  autoSubscribe: true,
  refreshInterval: 30000,
  onUpdate: update => {
    // Handle real-time updates
  },
});
```

## User Interfaces

### 1. **Public Tracking Page**

#### Features

- **Smart Search**: Accepts both reference codes and unified IDs
- **Real-time Updates**: Live tracking information
- **Connection Status**: Shows real-time connection status
- **Progress Visualization**: Visual route progress indicators
- **Interactive Timeline**: Job event history
- **Live Map**: Real-time driver location on map

#### Search Capabilities

- **Reference Code**: "ABC123"
- **Unified ID**: "SV2025011500001"
- **Auto-formatting**: Automatically converts to uppercase
- **Error Handling**: Clear error messages for invalid codes

### 2. **Admin Tracking Dashboard**

#### Features

- **Comprehensive Overview**: All active bookings with tracking data
- **Real-time Updates**: Live status and location updates
- **Advanced Filtering**: By status, search query, and more
- **Dual View Modes**: List view and map view
- **Detailed Modals**: Comprehensive booking information
- **Statistics Dashboard**: Real-time metrics and KPIs

#### Dashboard Components

- **Stats Cards**: Total bookings, progress, live tracking count
- **Search & Filters**: Advanced filtering capabilities
- **Booking List**: Detailed booking information with progress
- **Map View**: Live map with all active deliveries
- **Detail Modals**: Comprehensive booking information

### 3. **Enhanced Admin Tracking API**

#### Features

- **Comprehensive Data**: Full booking information with tracking
- **Progress Calculation**: Intelligent route progress based on job events
- **Real-time Integration**: Includes tracking ping data
- **Summary Statistics**: Aggregated metrics for dashboard
- **Efficient Queries**: Optimized database queries with proper indexing

## Configuration

### 1. **Environment Variables**

```env
# Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster

# Database
DATABASE_URL=your_database_url

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_nextauth_url
```

### 2. **Pusher Setup**

#### Channel Configuration

- **Public Channels**: `tracking-{bookingId}`
- **Private Channels**: `private-tracking-{bookingId}`
- **Admin Channels**: `admin-tracking`

#### Event Types

- **Location Updates**: `location-update`
- **Status Changes**: `status-update`
- **Progress Updates**: `progress-update`
- **ETA Changes**: `eta-update`

### 3. **Database Schema**

#### Required Models

- **Booking**: Main booking information
- **TrackingPing**: Driver location updates
- **JobEvent**: Job milestone tracking
- **Assignment**: Driver assignments
- **Driver**: Driver information

#### Indexes

```sql
-- Optimize tracking queries
CREATE INDEX idx_tracking_ping_booking_driver ON "TrackingPing"("bookingId", "driverId");
CREATE INDEX idx_tracking_ping_created_at ON "TrackingPing"("createdAt");

-- Optimize job event queries
CREATE INDEX idx_job_event_assignment_step ON "JobEvent"("assignmentId", "step");
CREATE INDEX idx_job_event_created_at ON "JobEvent"("createdAt");
```

## Usage Instructions

### 1. **For Customers**

#### Basic Tracking

1. Navigate to the tracking page
2. Enter your booking code or unified ID
3. Click "Track" to view delivery information
4. Real-time updates will automatically appear

#### Supported ID Formats

- **Reference Code**: "ABC123", "XYZ789"
- **Unified ID**: "SV2025011500001", "SV2025011500002"

#### Real-time Features

- **Live Location**: Driver location updates every few seconds
- **Status Updates**: Automatic status change notifications
- **Progress Tracking**: Visual route completion progress
- **ETA Updates**: Real-time arrival time adjustments

### 2. **For Administrators**

#### Dashboard Access

1. Navigate to Admin → Tracking → Enhanced
2. View all active bookings with real-time data
3. Use filters to find specific bookings
4. Click on bookings for detailed information

#### Search Capabilities

- **Booking ID**: Search by reference or unified ID
- **Customer**: Search by name or email
- **Driver**: Search by driver name
- **Status**: Filter by booking status

#### Real-time Monitoring

- **Live Updates**: Automatic data refresh every 30 seconds
- **Connection Status**: Monitor real-time connection health
- **Progress Tracking**: View route completion for all deliveries
- **Location Monitoring**: Track driver locations in real-time

### 3. **For Developers**

#### Integration

```typescript
import { useRealTimeTracking } from '@/hooks/useRealTimeTracking';

function MyTrackingComponent() {
  const { trackingData, lookupBooking } = useRealTimeTracking();

  // Use tracking data and functions
}
```

#### Customization

```typescript
const { trackingData } = useRealTimeTracking({
  autoSubscribe: true,
  refreshInterval: 15000, // 15 seconds
  onUpdate: update => {
    // Custom update handling
  },
});
```

## Performance Considerations

### 1. **Database Optimization**

- **Efficient Queries**: Optimized database queries with proper joins
- **Indexing**: Strategic database indexes for fast lookups
- **Pagination**: Large result sets are properly paginated
- **Caching**: Future enhancement for frequently accessed data

### 2. **Real-time Performance**

- **Connection Pooling**: Efficient WebSocket connection management
- **Event Batching**: Batched updates to reduce overhead
- **Memory Management**: Proper cleanup to prevent memory leaks
- **Error Recovery**: Graceful degradation when real-time unavailable

### 3. **Frontend Optimization**

- **Component Memoization**: Prevents unnecessary re-renders
- **State Management**: Efficient state updates and synchronization
- **Resource Cleanup**: Automatic cleanup of subscriptions and intervals
- **Lazy Loading**: Dynamic imports for heavy components

## Security Features

### 1. **Authentication & Authorization**

- **Customer Access**: Can only track their own bookings
- **Admin Access**: Full access to all tracking data
- **Driver Access**: Can only update their own location data
- **Session Validation**: Proper session management and validation

### 2. **Data Privacy**

- **Customer Isolation**: Customers cannot see other customer data
- **Driver Privacy**: Driver personal information is protected
- **Secure Channels**: Private WebSocket channels for sensitive data
- **Data Validation**: Input validation and sanitization

### 3. **API Security**

- **Rate Limiting**: Prevents abuse of tracking APIs
- **Input Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Secure error messages without information leakage
- **CORS Configuration**: Proper cross-origin resource sharing setup

## Monitoring & Maintenance

### 1. **Health Checks**

- **Connection Monitoring**: Real-time connection status
- **Performance Metrics**: Response times and error rates
- **Database Performance**: Query performance monitoring
- **WebSocket Health**: Connection stability and reconnection rates

### 2. **Error Handling**

- **Graceful Degradation**: System continues to function without real-time
- **Comprehensive Logging**: Detailed error logging for debugging
- **User Feedback**: Clear error messages for users
- **Automatic Recovery**: Automatic reconnection and error recovery

### 3. **Maintenance Tasks**

- **Connection Cleanup**: Regular cleanup of stale connections
- **Database Maintenance**: Regular database optimization
- **Performance Tuning**: Continuous performance monitoring and optimization
- **Security Updates**: Regular security patches and updates

## Future Enhancements

### 1. **Advanced Features**

- **Predictive Analytics**: Machine learning for ETA prediction
- **Route Optimization**: Intelligent route planning and optimization
- **Multi-language Support**: Internationalization for global users
- **Advanced Notifications**: Push notifications and SMS alerts

### 2. **Integration Capabilities**

- **Third-party Maps**: Integration with Google Maps, Mapbox, etc.
- **Fleet Management**: Integration with fleet management systems
- **Customer Apps**: Mobile app integration
- **API Extensions**: RESTful API for third-party integrations

### 3. **Analytics & Reporting**

- **Performance Metrics**: Detailed performance analytics
- **Customer Insights**: Usage patterns and preferences
- **Operational Analytics**: Delivery efficiency and optimization
- **Business Intelligence**: Advanced reporting and dashboards

## Troubleshooting

### 1. **Common Issues**

#### Real-time Not Working

- Check Pusher configuration
- Verify environment variables
- Check browser console for errors
- Ensure proper authentication

#### Tracking Data Not Loading

- Verify database connection
- Check API endpoint availability
- Review authentication setup
- Check for database schema issues

#### Performance Issues

- Monitor database query performance
- Check WebSocket connection stability
- Review frontend component optimization
- Monitor memory usage

### 2. **Debug Information**

#### Connection Status

```typescript
const { connectionStatus } = useRealTimeTracking();
console.log('Connection Status:', connectionStatus);
```

#### Real-time Updates

```typescript
const { lastUpdate } = useRealTimeTracking();
console.log('Last Update:', lastUpdate);
```

#### Error Handling

```typescript
const { error } = useRealTimeTracking();
if (error) {
  console.error('Tracking Error:', error);
}
```

## Conclusion

The Enhanced Real-Time Tracking System provides a comprehensive, scalable solution for tracking deliveries in real-time. With support for both traditional and unified booking IDs, automatic real-time updates, and comprehensive admin capabilities, it delivers an exceptional user experience for customers, drivers, and administrators alike.

The system is designed with performance, security, and scalability in mind, providing a solid foundation for future enhancements and integrations. Whether tracking a single delivery or monitoring an entire fleet, the system provides the tools and information needed for efficient delivery management.
