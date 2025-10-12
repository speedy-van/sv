# Offline Functionality Documentation

## Overview

The Speedy Van Driver Portal includes comprehensive offline functionality that allows drivers to continue working even when they lose internet connectivity. This system queues actions locally and synchronizes them when the connection is restored.

## Features

### ✅ Implemented Features

1. **Local Action Queuing**
   - Job progress updates (arrived, loaded, completed, etc.)
   - Location updates
   - Availability status changes
   - Job claims and declines

2. **Automatic Synchronization**
   - Syncs when connection is restored
   - Background sync support
   - Configurable retry logic

3. **Conflict Resolution**
   - Handles duplicate actions gracefully
   - Maintains action order
   - Server-side conflict detection

4. **User Interface**
   - Real-time offline status indicator
   - Pending actions counter
   - Manual sync controls
   - Detailed offline settings page

5. **Error Handling**
   - Retry logic with exponential backoff
   - Maximum retry limits
   - Graceful failure handling

## Architecture

### Core Components

1. **OfflineManager** (`/src/lib/offline.ts`)
   - Singleton class managing offline state
   - IndexedDB storage for pending actions
   - Event-driven synchronization

2. **Service Worker** (`/public/sw.js`)
   - Background sync registration
   - Push notification handling
   - Cache management

3. **React Components**
   - `OfflineStatus` - Real-time status indicator
   - `ActiveJobHandler` - Offline-aware job progress
   - `JobFeed` - Offline job claiming
   - `LocationTracker` - Offline location updates

4. **Settings Page** (`/driver/settings/offline`)
   - Configuration management
   - Action monitoring
   - Manual controls

## Usage Examples

### Basic Offline Usage

```typescript
import {
  queueJobProgress,
  queueLocationUpdate,
  offlineManager,
} from '@/lib/offline';

// Queue a job progress update (works offline)
await queueJobProgress('job-123', 'arrived_pickup', {
  photos: ['photo1.jpg'],
  notes: 'Arrived at pickup location',
});

// Queue a location update (works offline)
await queueLocationUpdate(51.5074, -0.1278);

// Check offline state
const state = offlineManager.getState();
console.log('Is online:', state.isOnline);
console.log('Pending actions:', state.pendingActions.length);
```

### React Hook Usage

```typescript
import { useOfflineState } from '@/lib/offline';

function MyComponent() {
  const offlineState = useOfflineState();

  return (
    <div>
      {!offlineState.isOnline && (
        <Alert status="warning">
          You're offline. {offlineState.pendingActions.length} actions queued.
        </Alert>
      )}
    </div>
  );
}
```

### Enhanced Fetch Wrapper

```typescript
import { offlineFetch } from '@/lib/offline';

// Automatically queues if offline
const response = await offlineFetch(
  '/api/driver/jobs/123/progress',
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step: 'completed' }),
  },
  'job_progress'
);

if (response.status === 202) {
  // Action was queued for later
  console.log('Action queued for when connection is restored');
}
```

## API Reference

### OfflineManager

#### Methods

- `getState(): OfflineState` - Get current offline state
- `subscribe(listener): () => void` - Subscribe to state changes
- `queueAction(action): Promise<string>` - Queue an action
- `syncPendingActions(): Promise<void>` - Manually trigger sync
- `clearAllActions(): Promise<void>` - Clear all pending actions
- `getPendingActionsByType(type): OfflineAction[]` - Get actions by type
- `getPendingActionsCount(): number` - Get total pending actions

#### State Interface

```typescript
interface OfflineState {
  isOnline: boolean;
  lastOnline: number;
  pendingActions: OfflineAction[];
  syncInProgress: boolean;
}
```

### Action Types

- `job_progress` - Job step completion
- `location_update` - GPS location updates
- `availability_update` - Driver availability changes
- `job_claim` - Job claiming
- `job_decline` - Job declining

### Utility Functions

- `queueJobProgress(jobId, step, payload)` - Queue job progress
- `queueLocationUpdate(lat, lng)` - Queue location update
- `queueAvailabilityUpdate(status)` - Queue availability change
- `queueJobClaim(jobId)` - Queue job claim
- `queueJobDecline(jobId, reason)` - Queue job decline
- `offlineFetch(url, options, actionType)` - Enhanced fetch wrapper

## Configuration

### Offline Settings

Drivers can configure offline behavior in `/driver/settings/offline`:

- **Auto-sync when online**: Automatically sync when connection restored
- **Background sync**: Allow background synchronization
- **Cache job data**: Store job details locally
- **Cache location data**: Store location data locally
- **Maximum retry attempts**: Number of retry attempts (1-10)
- **Sync interval**: How often to attempt syncing (10s-5m)

### Service Worker Configuration

The service worker handles:

- Background sync registration
- Push notifications
- Cache management
- Action synchronization

## Testing

### Manual Testing

1. **Simulate Offline Mode**
   - Use browser dev tools to simulate offline
   - Or disconnect from network
   - Perform actions (job progress, location updates)
   - Verify actions are queued

2. **Test Synchronization**
   - Restore connection
   - Verify actions sync automatically
   - Check for conflicts and resolution

3. **Test Error Handling**
   - Queue actions with invalid data
   - Verify retry logic works
   - Check maximum retry limits

### Automated Testing

Run the test suite:

```bash
cd apps/web
npm run test:offline
```

Or run individual tests:

```bash
npx tsx scripts/test-offline-functionality.ts
```

## Troubleshooting

### Common Issues

1. **Actions not syncing**
   - Check if service worker is registered
   - Verify IndexedDB permissions
   - Check browser console for errors

2. **Duplicate actions**
   - Verify action deduplication logic
   - Check server-side conflict resolution
   - Review action timestamps

3. **Performance issues**
   - Monitor IndexedDB size
   - Check for memory leaks
   - Review action cleanup

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('offline-debug', 'true');
```

### Monitoring

Check offline state in browser console:

```javascript
// Get offline manager state
import { offlineManager } from '@/lib/offline';
console.log(offlineManager.getState());

// Check IndexedDB contents
// Open DevTools > Application > IndexedDB > SpeedyVanOfflineDB
```

## Performance Considerations

### Memory Usage

- Actions are stored in IndexedDB (persistent)
- Automatic cleanup after successful sync
- Configurable maximum retry limits

### Network Efficiency

- Actions are batched when possible
- Retry logic prevents unnecessary requests
- Background sync reduces battery usage

### Storage Limits

- IndexedDB has browser-specific limits
- Actions are automatically cleaned up
- Manual clear option available

## Security

### Data Protection

- Actions stored locally on device
- No sensitive data in action payloads
- Automatic cleanup after sync

### Authentication

- Actions include authentication headers
- Server validates all actions
- No offline authentication bypass

## Browser Support

### Required Features

- Service Workers
- IndexedDB
- Background Sync API
- Push Notifications (optional)

### Supported Browsers

- Chrome 42+
- Firefox 44+
- Safari 11.1+
- Edge 17+

### Fallbacks

- Graceful degradation for unsupported features
- Manual sync options
- Clear error messages

## Future Enhancements

### Planned Features

1. **Offline Maps**
   - Cache map tiles
   - Offline navigation
   - Route planning

2. **Enhanced Caching**
   - Job details caching
   - Customer information
   - Document storage

3. **Smart Sync**
   - Priority-based syncing
   - Bandwidth optimization
   - Conflict prediction

4. **Analytics**
   - Offline usage metrics
   - Sync performance tracking
   - Error rate monitoring

## Contributing

### Development

1. Follow existing patterns in `/src/lib/offline.ts`
2. Add tests for new functionality
3. Update documentation
4. Test across different browsers

### Testing

1. Test offline scenarios thoroughly
2. Verify conflict resolution
3. Check performance impact
4. Validate error handling

### Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Add JSDoc comments
- Include error handling

## Support

For issues or questions:

1. Check this documentation
2. Review browser console logs
3. Test with different browsers
4. Contact development team

---

**Last Updated**: January 2025
**Version**: 1.0.0
