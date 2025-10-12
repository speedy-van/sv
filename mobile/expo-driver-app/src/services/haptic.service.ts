/**
 * Haptic Feedback Service
 * 
 * Provides consistent haptic feedback across the app
 * Leverages iOS Haptic Engine for premium tactile experience
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'soft'
  | 'rigid';

class HapticService {
  private isEnabled = true;

  /**
   * Enable or disable haptic feedback globally
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Check if haptic feedback is supported
   */
  isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Trigger haptic feedback
   */
  async trigger(type: HapticType = 'medium'): Promise<void> {
    if (!this.isEnabled || !this.isSupported()) {
      return;
    }

    try {
      switch (type) {
        // Impact Feedback (physical button press)
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        
        case 'rigid':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
          break;
        
        case 'soft':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          break;

        // Notification Feedback (success/warning/error states)
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;

        // Selection Feedback (picker/slider changes)
        case 'selection':
          await Haptics.selectionAsync();
          break;

        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }

  /**
   * Button Press - Light feedback for standard buttons
   */
  async buttonPress(): Promise<void> {
    await this.trigger('light');
  }

  /**
   * Button Press Heavy - Heavy feedback for primary actions
   */
  async buttonPressHeavy(): Promise<void> {
    await this.trigger('heavy');
  }

  /**
   * Switch Toggle - Soft feedback for switches and toggles
   */
  async switchToggle(): Promise<void> {
    await this.trigger('soft');
  }

  /**
   * Selection Changed - Feedback for picker/dropdown changes
   */
  async selectionChanged(): Promise<void> {
    await this.trigger('selection');
  }

  /**
   * Success Action - Feedback for successful operations
   */
  async success(): Promise<void> {
    await this.trigger('success');
  }

  /**
   * Warning Action - Feedback for warnings
   */
  async warning(): Promise<void> {
    await this.trigger('warning');
  }

  /**
   * Error Action - Feedback for errors
   */
  async error(): Promise<void> {
    await this.trigger('error');
  }

  /**
   * Modal Open - Medium feedback for modal appearance
   */
  async modalOpen(): Promise<void> {
    await this.trigger('medium');
  }

  /**
   * Modal Close - Light feedback for modal dismissal
   */
  async modalClose(): Promise<void> {
    await this.trigger('light');
  }

  /**
   * Route Accepted - Success feedback with double pulse
   */
  async routeAccepted(): Promise<void> {
    await this.trigger('success');
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.trigger('light');
  }

  /**
   * Route Declined - Error feedback
   */
  async routeDeclined(): Promise<void> {
    await this.trigger('error');
  }

  /**
   * Message Sent - Light feedback for chat messages
   */
  async messageSent(): Promise<void> {
    await this.trigger('soft');
  }

  /**
   * Message Received - Medium feedback for incoming messages
   */
  async messageReceived(): Promise<void> {
    await this.trigger('medium');
  }

  /**
   * Job Started - Heavy feedback for starting a job
   */
  async jobStarted(): Promise<void> {
    await this.trigger('heavy');
  }

  /**
   * Job Completed - Success feedback with triple pulse
   */
  async jobCompleted(): Promise<void> {
    await this.trigger('success');
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.trigger('medium');
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.trigger('light');
  }

  /**
   * Location Update - Soft feedback (very subtle)
   */
  async locationUpdate(): Promise<void> {
    await this.trigger('soft');
  }

  /**
   * Pull to Refresh - Light feedback
   */
  async pullToRefresh(): Promise<void> {
    await this.trigger('light');
  }

  /**
   * Swipe Action - Rigid feedback for swipe gestures
   */
  async swipeAction(): Promise<void> {
    await this.trigger('rigid');
  }

  /**
   * Tab Switch - Selection feedback
   */
  async tabSwitch(): Promise<void> {
    await this.trigger('selection');
  }

  /**
   * Custom Pattern - Play a sequence of haptic feedback
   */
  async playPattern(pattern: HapticType[], delays: number[]): Promise<void> {
    if (!this.isEnabled || !this.isSupported()) {
      return;
    }

    for (let i = 0; i < pattern.length; i++) {
      await this.trigger(pattern[i]);
      if (i < pattern.length - 1 && delays[i]) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }
  }

  /**
   * Urgent Alert Pattern - Multiple heavy impacts
   */
  async urgentAlert(): Promise<void> {
    await this.playPattern(
      ['heavy', 'heavy', 'heavy'],
      [150, 150]
    );
  }

  /**
   * Celebration Pattern - Success with multiple light impacts
   */
  async celebration(): Promise<void> {
    await this.playPattern(
      ['success', 'light', 'light', 'light'],
      [100, 100, 100]
    );
  }
}

// Export singleton instance
export const hapticService = new HapticService();

export default hapticService;
