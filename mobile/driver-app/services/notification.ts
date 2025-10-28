import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

class NotificationService {
  private sound: Audio.Sound | null = null;
  private soundInterval: NodeJS.Timeout | null = null;
  private isPlayingRepeat: boolean = false;

  async initialize(): Promise<void> {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Request permissions
    await this.requestPermissions();
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📱 Notification permission status:', existingStatus);
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('🔔 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📱 New permission status:', finalStatus);
      }

      const granted = finalStatus === 'granted';
      console.log('✅ Notifications enabled:', granted);
      return granted;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  async playNotificationSound(): Promise<void> {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Use custom notification sound (3+ seconds)
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/notification.mp3'),
        { shouldPlay: true, volume: 1.0 }
      );

      this.sound = sound;

      // Wait for sound to finish playing before unloading
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        // Unload after full duration + 500ms buffer
        setTimeout(async () => {
          try {
            await sound.unloadAsync();
          } catch (error) {
            // Ignore unload errors
          }
        }, status.durationMillis + 500);
      } else {
        // Fallback: unload after 5 seconds
        setTimeout(async () => {
          try {
            await sound.unloadAsync();
          } catch (error) {
            // Ignore unload errors
          }
        }, 5000);
      }
    } catch (error) {
      console.log('⚠️ Sound not available in Expo Go - will work in production build');
    }
  }

  async startRepeatSound(): Promise<void> {
    if (this.isPlayingRepeat) {
      console.log('⚠️ Repeat sound already playing');
      return;
    }

    console.log('🔊 Starting repeat notification sound');
    this.isPlayingRepeat = true;

    try {
      // Configure audio mode for repeat
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Play sound immediately
      await this.playRepeatSoundOnce();

      // Repeat every 5 seconds
      this.soundInterval = setInterval(async () => {
        await this.playRepeatSoundOnce();
      }, 5000);
    } catch (error) {
      console.log('⚠️ Repeat sound not available in Expo Go');
      this.isPlayingRepeat = false;
    }
  }

  private async playRepeatSoundOnce(): Promise<void> {
    try {
      // Use custom notification sound (3+ seconds)
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/notification.mp3'),
        { shouldPlay: true, volume: 1.0 }
      );

      // Get sound duration and wait for it to complete
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        // Unload after full duration + 500ms buffer
        setTimeout(async () => {
          try {
            await sound.unloadAsync();
          } catch (error) {
            // Ignore unload errors
          }
        }, status.durationMillis + 500);
      } else {
        // Fallback: unload after 5 seconds if duration unknown
        setTimeout(async () => {
          try {
            await sound.unloadAsync();
          } catch (error) {
            // Ignore unload errors
          }
        }, 5000);
      }
    } catch (error) {
      // Silent fail for Expo Go compatibility
    }
  }

  stopRepeatSound(): void {
    console.log('🔇 Stopping repeat notification sound');
    
    if (this.soundInterval) {
      clearInterval(this.soundInterval);
      this.soundInterval = null;
    }

    this.isPlayingRepeat = false;

    // Stop any currently playing sound
    if (this.sound) {
      this.sound.stopAsync().catch((error) => {
        console.error('Error stopping sound:', error);
      });
      this.sound.unloadAsync().catch((error) => {
        console.error('Error unloading sound:', error);
      });
      this.sound = null;
    }
  }

  async showNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      console.log('🔔 Attempting to show notification:', { title, body });
      
      // Check permissions first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ Notification permissions not granted:', status);
        console.log('💡 System notifications require a standalone build (not Expo Go)');
        return;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ Notification scheduled successfully:', notificationId);
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      console.log('💡 Note: System notifications work in standalone builds, not in Expo Go');
    }
  }

  async showJobAssignmentNotification(
    jobReference: string,
    jobType: 'route' | 'order',
    earnings: string
  ): Promise<void> {
    const title = jobType === 'route' ? '🚛 New Route Assigned!' : '📦 New Job Assigned!';
    const body = `${jobReference} - Earn ${earnings}. Respond within 30 minutes!`;

    await this.showNotification(title, body, {
      type: 'job-assignment',
      jobReference,
      jobType,
    });

    // Start repeat sound for job assignments
    await this.startRepeatSound();
  }

  async vibrate(pattern: number[] = [0, 400, 200, 400]): Promise<void> {
    try {
      // Use expo-haptics for better Expo Go compatibility
      const Haptics = await import('expo-haptics');
      
      // Trigger haptic feedback multiple times to simulate pattern
      for (let i = 0; i < 3; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.log('⚠️ Vibration not available in Expo Go - will work in production build');
    }
  }

  async vibratePattern(): Promise<void> {
    try {
      // Strong vibration pattern for urgent notifications
      const Haptics = await import('expo-haptics');
      
      // Triple heavy impact for urgency
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 200));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 200));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.log('⚠️ Haptics not available - continuing without vibration');
    }
  }

  cleanup(): void {
    this.stopRepeatSound();
  }
}

export const notificationService = new NotificationService();

