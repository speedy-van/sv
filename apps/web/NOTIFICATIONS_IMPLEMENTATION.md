# Notifications & Realtime Implementation

This document outlines the implementation of notifications and realtime features for the Driver Portal as specified in task 13 of the cursor_tasks.md.

## Overview

The notifications system provides drivers with real-time updates about:

- New job offers
- Job updates and changes
- Messages from customers
- Payout confirmations
- Document expiry alerts
- System alerts and maintenance notices

## Database Schema

### New Models Added

1. **PushSubscription**
   - Stores browser push notification subscriptions
   - Links to driver for targeted notifications
   - Includes VAPID keys for secure push delivery

2. **DriverNotification**
   - Stores all notifications for drivers
   - Includes type, title, message, and metadata
   - Tracks read/unread status with timestamps

3. **DriverNotificationPreferences**
   - Granular control over notification types
   - Separate preferences for push, email, and SMS
   - Defaults to sensible values for each channel

4. **NotificationType Enum**
   - job_offer, job_update, job_cancelled, job_completed
   - message_received, schedule_change
   - payout_processed, payout_failed
   - document_expiry, system_alert, performance_update, incident_reported

## API Endpoints

### `/api/driver/notifications`

- `GET` - Fetch notifications with pagination and filtering
- Supports filtering by type, read status, and pagination

### `/api/driver/notifications/read`

- `PUT` - Mark notifications as read
- Supports marking individual or all notifications as read

### `/api/driver/settings/notification-preferences`

- `GET` - Fetch current notification preferences
- `PUT` - Update notification preferences

### `/api/driver/push-subscription`

- `POST` - Save push notification subscription
- `DELETE` - Remove push notification subscription

## Components

### NotificationBell

- Real-time notification bell in the header
- Shows unread count badge
- Popover with recent notifications
- Click to mark as read and navigate

### NotificationsPage

- Full notifications page with filtering
- Bulk actions for marking as read
- Pagination for large notification lists
- Type-based filtering and search

### NotificationPreferences

- Settings component for notification preferences
- Toggle switches for each notification type
- Separate sections for push, email, and SMS
- Real-time preference updates

### PushNotificationSetup

- Setup component for browser push notifications
- Permission request handling
- Subscription management
- Status display and troubleshooting

## Realtime Features

### Pusher Integration

- Existing Pusher setup enhanced for notifications
- Driver-specific channels for targeted delivery
- Real-time notification delivery
- Fallback to database storage

### Service Worker

- Enhanced existing service worker
- Push notification handling
- Background sync for offline actions
- Notification click handling

## Utilities

### `/lib/notifications.ts`

- Server-side notification creation
- Preference-based filtering
- Helper functions for common notification types
- Integration with Pusher for real-time delivery

### `/lib/push-notifications.ts`

- Client-side push notification management
- Permission handling
- Subscription management
- VAPID key conversion utilities

### `/lib/realtime.ts`

- Enhanced with notification event handling
- Driver-specific channel subscriptions
- Real-time notification reception

## Features Implemented

### ✅ Core Requirements

- [x] New job invites via real-time notifications
- [x] Messages from customers and support
- [x] Schedule changes and updates
- [x] Payout events and confirmations
- [x] Notification center with read/unread status
- [x] Preference toggles for different notification types

### ✅ Real-time Features

- [x] Instant notification delivery via Pusher
- [x] Browser push notifications
- [x] Toast notifications for immediate feedback
- [x] Real-time unread count updates

### ✅ User Experience

- [x] Notification bell with unread count badge
- [x] Click to mark as read functionality
- [x] Navigation to relevant pages from notifications
- [x] Bulk actions for managing notifications
- [x] Filtering and search capabilities

### ✅ Settings & Preferences

- [x] Granular notification preferences
- [x] Push notification setup and management
- [x] Email notification preferences (ready for implementation)
- [x] SMS notification preferences (placeholder for future)

## Testing

### Test Data

- Created test script: `scripts/create-test-notifications.ts`
- Generates sample notifications of all types
- Mix of read and unread notifications
- Realistic timestamps and data

### Manual Testing

1. Navigate to `/driver/notifications` to view all notifications
2. Click notification bell to see recent notifications
3. Test marking notifications as read
4. Test filtering by type and read status
5. Test push notification setup in settings

## Environment Variables Required

```env
# Pusher Configuration (already configured)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster

# VAPID Keys for Push Notifications (new)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

## Future Enhancements

### Email Notifications

- Integrate with email service (SendGrid, AWS SES)
- Email templates for different notification types
- Batch email sending for efficiency

### SMS Notifications

- Integrate with SMS service (Twilio, AWS SNS)
- SMS templates and character limits
- Opt-in/opt-out management

### Advanced Features

- Notification scheduling
- Rich media in notifications
- Notification analytics and reporting
- Cross-platform push notifications (mobile apps)

## Integration Points

### Existing Systems

- Enhanced dispatch offer system to create notifications
- Integrated with existing Pusher realtime system
- Compatible with existing driver authentication
- Works with existing job and booking systems

### New Systems

- Notification preferences management
- Push subscription lifecycle management
- Real-time notification delivery
- Notification history and analytics

## Performance Considerations

- Database indexes on notification queries
- Pagination for large notification lists
- Efficient real-time delivery via Pusher
- Background processing for notification creation
- Caching of notification preferences

## Security

- Driver-specific notification isolation
- Secure push subscription management
- VAPID key authentication for push notifications
- Proper authorization checks on all endpoints
- Audit logging for notification actions
