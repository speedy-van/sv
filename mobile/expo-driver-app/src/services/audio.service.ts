import { Audio, AVPlaybackStatus } from 'expo-av';

class AudioService {
  private sound: Audio.Sound | null = null;
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;
  private loopIntervalId: NodeJS.Timeout | null = null;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,  // CRITICAL: Play even in silent mode
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      this.isInitialized = true;
      console.log('🎵 Audio Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize audio service:', error);
    }
  }

  async stopSound() {
    try {
      // Clear loop interval
      if (this.loopIntervalId) {
        clearInterval(this.loopIntervalId);
        this.loopIntervalId = null;
      }

      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
        console.log('🛑 Sound stopped and cleaned up');
      }
    } catch (error) {
      console.error('❌ Error stopping sound:', error);
    }
  }

  private async playSoundOnce() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3' },
        { 
          shouldPlay: true,
          isLooping: false,  // Single playback
          volume: 1.0,
        }
      );

      this.sound = sound;
    } catch (error) {
      console.error('❌ Error playing sound once:', error);
    }
  }

  async playRouteMatchSound() {
    try {
      // Stop any currently playing sound first
      await this.stopSound();

      console.log('🔊 Starting notification sound with 2-second interval loop...');

      this.isPlaying = true;

      // Play immediately
      await this.playSoundOnce();

      // Then loop with 2-second delay
      this.loopIntervalId = setInterval(async () => {
        if (this.isPlaying) {
          await this.playSoundOnce();
        }
      }, 2000); // 2 seconds between replays

      console.log('✅ Sound playing with 2-second interval - will continue until stopped');

    } catch (error) {
      console.error('❌ Error playing notification sound:', error);
      this.isPlaying = false;
    }
  }

  async playNotificationSound() {
    return this.playRouteMatchSound();
  }

  async cleanup() {
    try {
      await this.stopSound();
      console.log('🧹 Audio Service cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up audio service:', error);
    }
  }
}

export default new AudioService();
