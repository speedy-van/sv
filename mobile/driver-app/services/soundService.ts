import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

class SoundService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      this.isInitialized = true;
      console.log('✅ Sound service initialized');
    } catch (error) {
      console.log('⚠️ Sound service init failed, using haptics only');
    }
  }

  // Play button click sound with haptic feedback
  async playButtonClick() {
    try {
      // Use haptic feedback as it's more reliable on mobile
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently fail - feedback is not critical
    }
  }

  // Play success sound with haptic feedback
  async playSuccess() {
    try {
      // Use haptic feedback for success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Silently fail
    }
  }

  // Play error sound with haptic feedback
  async playError() {
    try {
      // Use haptic feedback for error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Silently fail
    }
  }

  // Clean up (no-op now, but kept for API compatibility)
  async cleanup() {
    // Nothing to clean up with haptics
  }
}

export const soundService = new SoundService();

