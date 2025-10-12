// Enhanced Driver Components
export { default as JobProgressTracker } from './JobProgressTracker';
export { default as MediaUploader } from './MediaUploader';
export { default as SmartNotifications } from './SmartNotifications';
export { EnhancedDriverHeader } from './EnhancedDriverHeader';
export { default as DriverShell } from './DriverShell';
export { EnhancedJobCard } from './EnhancedJobCard';
export { DriverStatsCard } from './DriverStatsCard';
export { NoJobsMessage } from './NoJobsMessage';

// Smart Notification utilities
export {
  createSmartAlert,
  createProximityAlert,
  createStatusUpdateAlert,
  createLocationAlert,
} from './SmartNotifications';

// Hooks
export { default as useAutoStatusUpdates } from '../../hooks/useAutoStatusUpdates';

// Services
export { smartNotificationService } from '../../lib/services/SmartNotificationService';

// Types
export type { SmartNotificationData, LocationBasedNotification, TimeBasedNotification } from '../../lib/services/SmartNotificationService';