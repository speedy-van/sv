import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';

class SoundService {
  private isInitialized = false;
  private audioEnabled = true;
  private hapticEnabled = true;

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

  // ===== ADVANCED HAPTIC PATTERNS =====

  // Job assignment with celebratory feedback
  async playJobAssigned() {
    if (!this.hapticEnabled) return;

    try {
      // Multiple impacts for celebration
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
    } catch (error) {
      // Fallback to vibration
      Vibration.vibrate([0, 100, 50, 100]);
    }
  }

  // Earnings update with intensity based on amount
  async playEarningsUpdate(amount: number) {
    if (!this.hapticEnabled) return;

    try {
      const intensity = amount > 50 ? 'heavy' : amount > 25 ? 'medium' : 'light';

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const style = intensity === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : intensity === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;

      setTimeout(() => Haptics.impactAsync(style), 200);
    } catch (error) {
      // Fallback vibration pattern
      Vibration.vibrate([0, 50, 50, 100, 50, amount > 50 ? 150 : 50]);
    }
  }

  // Job completed with success celebration
  async playJobCompleted() {
    if (!this.hapticEnabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 350);
    } catch (error) {
      Vibration.vibrate([0, 150, 50, 150, 50, 100]);
    }
  }

  // Warning feedback for important actions
  async playWarning() {
    if (!this.hapticEnabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      Vibration.vibrate(200);
    }
  }

  // Long press feedback
  async playLongPress() {
    if (!this.hapticEnabled) return;

    try {
      Vibration.vibrate(50);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Vibration.vibrate(50);
    }
  }

  // Gesture feedback with intensity
  async playGesture(intensity: number = 0.5) {
    if (!this.hapticEnabled) return;

    try {
      const style = intensity > 0.7
        ? Haptics.ImpactFeedbackStyle.Heavy
        : intensity > 0.4
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;

      await Haptics.impactAsync(style);
    } catch (error) {
      // Fallback vibration based on intensity
      const duration = Math.round(intensity * 100);
      Vibration.vibrate(duration);
    }
  }

  // Contextual feedback based on action type
  async playContextualFeedback(type: 'accept' | 'decline' | 'navigate' | 'call' | 'refresh') {
    if (!this.hapticEnabled) return;

    try {
      switch (type) {
        case 'accept':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'decline':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'navigate':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'call':
          Vibration.vibrate([0, 50, 50, 50]);
          break;
        case 'refresh':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
          break;
      }
    } catch (error) {
      // Simple vibration fallback
      Vibration.vibrate(50);
    }
  }

  // ===== SETTINGS & PREFERENCES =====

  // Enable/disable audio feedback
  setAudioEnabled(enabled: boolean) {
    this.audioEnabled = enabled;
  }

  // Enable/disable haptic feedback
  setHapticEnabled(enabled: boolean) {
    this.hapticEnabled = enabled;
  }

  // Get current settings
  getSettings() {
    return {
      audioEnabled: this.audioEnabled,
      hapticEnabled: this.hapticEnabled,
    };
  }
}

export const soundService = new SoundService();

