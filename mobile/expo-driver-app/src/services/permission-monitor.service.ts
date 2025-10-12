import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import apiService from './api.service';

// Check if running in development mode
const __DEV__ = process.env.NODE_ENV === 'development' || !Constants.expoConfig?.extra?.isProduction;

interface PermissionStatus {
  location: boolean;
  notifications: boolean;
  lastChecked: Date;
}

interface AssignedJob {
  id: string;
  reference: string;
  warningShown: boolean;
  warningTimestamp?: Date;
}

class PermissionMonitorService {
  private checkInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private permissionStatus: PermissionStatus = {
    location: false,
    notifications: false,
    lastChecked: new Date(),
  };
  private assignedJobs: AssignedJob[] = [];
  private onPermissionChangeCallback: ((status: PermissionStatus) => void) | null = null;
  private onWarningCallback: ((job: AssignedJob, remainingMinutes: number) => void) | null = null;

  /**
   * Start monitoring permissions
   */
  async startMonitoring() {
    console.log('🔐 Initializing Permission Monitor...');
    
    // In dev mode, only log that notifications are bypassed
    if (__DEV__) {
      console.log('🚧 DEVELOPMENT MODE: Notification permission bypassed');
      console.log('� GPS permission is still required and monitored');
      console.log('📱 In production, all permissions will be enforced');
    }

    console.log('🔍 Starting permission monitoring...');

    // Initial check
    await this.checkPermissions();

    // Check every 10 seconds
    this.checkInterval = setInterval(async () => {
      await this.checkPermissions();
    }, 10000);

    // Monitor app state changes (foreground/background)
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    console.log('✅ Permission monitoring started');
  }

  /**
   * Stop monitoring permissions
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    console.log('🛑 Permission monitoring stopped');
  }

  /**
   * Check current permission status
   */
  async checkPermissions(): Promise<PermissionStatus> {
    try {
      // ✅ ALWAYS check location permission (even in dev mode)
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const hasLocation = locationStatus.granted;

      // ⚠️ In dev mode, bypass notification permission check
      let hasNotifications = false;
      if (__DEV__) {
        hasNotifications = true; // Always true in dev mode
        console.log('🚧 DEV MODE: Notification permission bypassed (always true)');
      } else {
        const notificationStatus = await Notifications.getPermissionsAsync();
        hasNotifications = notificationStatus.granted;
      }

      const previousStatus = { ...this.permissionStatus };
      this.permissionStatus = {
        location: hasLocation,
        notifications: hasNotifications,
        lastChecked: new Date(),
      };

      // Detect permission changes
      const locationChanged = previousStatus.location !== hasLocation;
      const notificationChanged = previousStatus.notifications !== hasNotifications;

      if (locationChanged || notificationChanged) {
        console.log('⚠️ Permission status changed:', {
          location: hasLocation ? '✅' : '❌',
          notifications: hasNotifications ? '✅' : '❌',
        });

        // Notify callback
        if (this.onPermissionChangeCallback) {
          this.onPermissionChangeCallback(this.permissionStatus);
        }

        // Handle permission loss with assigned jobs
        if (!hasLocation || !hasNotifications) {
          await this.handlePermissionLoss();
        }

        // Update driver status in backend
        await this.updateDriverStatus();
      }

      return this.permissionStatus;
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return this.permissionStatus;
    }
  }

  /**
   * Handle permission loss when driver has assigned jobs
   */
  private async handlePermissionLoss() {
    // In dev mode, only handle GPS loss (notifications bypassed)
    if (__DEV__) {
      // Only trigger if GPS is lost (notifications are always bypassed in dev)
      if (!this.permissionStatus.location) {
        console.log('⚠️ DEV MODE: GPS permission lost - triggering warnings');
      } else {
        console.log('🚧 DEV MODE: Notification loss ignored (bypassed in dev)');
        return;
      }
    }
    
    if (this.assignedJobs.length === 0) {
      console.log('ℹ️ No assigned jobs - skipping warning');
      return;
    }

    const now = new Date();

    for (const job of this.assignedJobs) {
      // Show warning only once
      if (!job.warningShown) {
        job.warningShown = true;
        job.warningTimestamp = now;

        console.log(`⚠️ WARNING: Permission lost for assigned job ${job.reference}`);

        // Notify callback to show warning UI
        if (this.onWarningCallback) {
          this.onWarningCallback(job, 5);
        }

        // Start 5-minute countdown
        this.startUnassignmentCountdown(job);
      }
    }
  }

  /**
   * Start 5-minute countdown before auto-unassignment
   */
  private startUnassignmentCountdown(job: AssignedJob) {
    const countdownInterval = setInterval(async () => {
      if (!job.warningTimestamp) {
        clearInterval(countdownInterval);
        return;
      }

      const elapsedMinutes = (Date.now() - job.warningTimestamp.getTime()) / 60000;
      const remainingMinutes = Math.max(0, 5 - elapsedMinutes);

      console.log(`⏰ ${job.reference}: ${remainingMinutes.toFixed(1)} minutes remaining`);

      // Update UI with remaining time
      if (this.onWarningCallback) {
        this.onWarningCallback(job, remainingMinutes);
      }

      // Check if permissions are restored
      const status = await this.checkPermissions();
      if (status.location && status.notifications) {
        console.log(`✅ Permissions restored for ${job.reference} - cancelling countdown`);
        job.warningShown = false;
        job.warningTimestamp = undefined;
        clearInterval(countdownInterval);
        return;
      }

      // Time's up - unassign job
      if (remainingMinutes <= 0) {
        console.log(`🚨 AUTO-UNASSIGNING ${job.reference} due to permission timeout`);
        await this.unassignJob(job);
        clearInterval(countdownInterval);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Unassign job from driver
   */
  private async unassignJob(job: AssignedJob) {
    try {
      console.log(`📤 Sending unassignment request for ${job.reference}`);
      
      await apiService.post(`/api/driver/jobs/${job.id}/unassign`, {
        reason: 'GPS or notifications disabled',
      });

      // Remove from assigned jobs
      this.assignedJobs = this.assignedJobs.filter(j => j.id !== job.id);

      console.log(`✅ Job ${job.reference} unassigned successfully`);
    } catch (error) {
      console.error(`❌ Failed to unassign job ${job.reference}:`, error);
    }
  }

  /**
   * Update driver online/offline status in backend
   */
  private async updateDriverStatus() {
    try {
      // In dev mode, consider only location (notifications always true)
      const isFullyEnabled = __DEV__ 
        ? this.permissionStatus.location 
        : (this.permissionStatus.location && this.permissionStatus.notifications);

      await apiService.post('/api/driver/status', {
        isOnline: isFullyEnabled,
        reason: isFullyEnabled ? 'auto_online' : 'permissions_disabled',
      });

      if (__DEV__) {
        console.log(`✅ Driver status updated (dev mode - GPS only): ${isFullyEnabled ? 'Online' : 'Offline (GPS disabled)'}`);
      } else {
        console.log(`✅ Driver status updated: ${isFullyEnabled ? 'Online' : 'Offline (Auto)'}`);
      }
    } catch (error) {
      console.error('❌ Failed to update driver status:', error);
    }
  }

  /**
   * Handle app state changes (foreground/background)
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      if (__DEV__) {
        console.log('� App became active - checking GPS only (notifications bypassed in dev)');
      } else {
        console.log('📱 App became active - checking permissions');
      }
      await this.checkPermissions();
    }
  };

  /**
   * Register callback for permission changes
   */
  onPermissionChange(callback: (status: PermissionStatus) => void) {
    this.onPermissionChangeCallback = callback;
  }

  /**
   * Register callback for warning notifications
   */
  onWarning(callback: (job: AssignedJob, remainingMinutes: number) => void) {
    this.onWarningCallback = callback;
  }

  /**
   * Add assigned job to monitor
   */
  addAssignedJob(jobId: string, reference: string) {
    if (!this.assignedJobs.find(j => j.id === jobId)) {
      this.assignedJobs.push({
        id: jobId,
        reference,
        warningShown: false,
      });
      console.log(`➕ Added job ${reference} to monitoring`);
    }
  }

  /**
   * Remove assigned job from monitoring
   */
  removeAssignedJob(jobId: string) {
    this.assignedJobs = this.assignedJobs.filter(j => j.id !== jobId);
    console.log(`➖ Removed job from monitoring`);
  }

  /**
   * Get current permission status
   */
  getStatus(): PermissionStatus {
    // In dev mode, return actual location status but force notifications to true
    if (__DEV__) {
      return {
        location: this.permissionStatus.location,
        notifications: true, // Always true in dev
        lastChecked: new Date(),
      };
    }
    
    return { ...this.permissionStatus };
  }

  /**
   * Check if driver can be online
   */
  canBeOnline(): boolean {
    // In dev mode, only check location (notifications bypassed)
    if (__DEV__) {
      return this.permissionStatus.location;
    }
    
    // In production, check both
    return this.permissionStatus.location && this.permissionStatus.notifications;
  }
}

export default new PermissionMonitorService();
