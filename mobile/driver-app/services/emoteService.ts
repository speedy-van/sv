import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmoteConfig {
  id: string;
  name: string;
  triggerEvent: string;
  animationType: 'static' | 'fade_in' | 'slide_up' | 'bounce' | 'shake' | 'slide_down';
  asset: string;
  duration: number;
  description: string;
}

export interface EmoteDisplayData {
  id: string;
  asset: any; // Image source
  animationType: EmoteConfig['animationType'];
  duration: number;
}

// Emote Manager - handles emote loading, caching, and triggering
class EmoteManager {
  private static instance: EmoteManager;
  private emotes: Map<string, EmoteConfig> = new Map();
  private assetCache: Map<string, any> = new Map();
  private configLoaded = false;

  static getInstance(): EmoteManager {
    if (!EmoteManager.instance) {
      EmoteManager.instance = new EmoteManager();
    }
    return EmoteManager.instance;
  }

  // Load emote configuration (hardcoded for now - in production would be dynamic)
  async loadEmoteConfig(): Promise<void> {
    if (this.configLoaded) return;

    try {
      // Hardcoded emote configuration - in production this could be loaded dynamically
      const emoteConfigs: EmoteConfig[] = [
        {
          id: 'celebrate',
          name: 'Celebrate',
          triggerEvent: 'orderAccepted',
          animationType: 'bounce',
          asset: 'celebrate.png',
          duration: 2000,
          description: 'Shows when driver accepts an order'
        },
        {
          id: 'thumbs_up',
          name: 'Thumbs Up',
          triggerEvent: 'routeAccepted',
          animationType: 'slide_up',
          asset: 'thumbs_up.png',
          duration: 1800,
          description: 'Shows when driver accepts a route'
        },
        {
          id: 'facepalm',
          name: 'Facepalm',
          triggerEvent: 'orderDeclined',
          animationType: 'fade_in',
          asset: 'facepalm.png',
          duration: 1500,
          description: 'Shows when driver declines an order'
        },
        {
          id: 'confused',
          name: 'Confused',
          triggerEvent: 'routeDeclined',
          animationType: 'shake',
          asset: 'confused.png',
          duration: 1600,
          description: 'Shows when driver declines a route'
        },
        {
          id: 'victory',
          name: 'Victory',
          triggerEvent: 'jobCompleted',
          animationType: 'bounce',
          asset: 'victory.png',
          duration: 2200,
          description: 'Shows when driver completes a job'
        },
        {
          id: 'thinking',
          name: 'Thinking',
          triggerEvent: 'jobStarted',
          animationType: 'fade_in',
          asset: 'thinking.png',
          duration: 1200,
          description: 'Shows when driver starts a job'
        },
        {
          id: 'wave',
          name: 'Wave Goodbye',
          triggerEvent: 'jobCancelled',
          animationType: 'slide_down',
          asset: 'wave.png',
          duration: 1400,
          description: 'Shows when a job is cancelled'
        }
      ];

      // Build emote map by trigger event
      emoteConfigs.forEach(config => {
        this.emotes.set(config.triggerEvent, config);
      });

      this.configLoaded = true;
      console.log('✅ Emote config loaded:', emoteConfigs.length, 'emotes');
    } catch (error) {
      console.warn('Failed to load emote config:', error);
    }
  }

  // Preload emote assets for performance (simplified for now)
  async preloadAssets(): Promise<void> {
    if (!this.configLoaded) await this.loadEmoteConfig();

    // Create placeholder assets - in production these would be actual image files
    Array.from(this.emotes.values()).forEach(emote => {
      // Use emoji as placeholder - in production would load actual PNG files
      const emojiMap: { [key: string]: string } = {
        'celebrate.png': '🎉',
        'thumbs_up.png': '👍',
        'facepalm.png': '🤦',
        'confused.png': '😕',
        'victory.png': '🏆',
        'thinking.png': '🤔',
        'wave.png': '👋'
      };

      const emoji = emojiMap[emote.asset] || '🤖';
      this.assetCache.set(emote.asset, { emoji, isEmoji: true });
    });

    console.log('✅ Emote assets preloaded (emoji placeholders)');
  }

  // Get emote for a specific trigger event
  getEmoteForEvent(event: string): EmoteConfig | null {
    return this.emotes.get(event) || null;
  }

  // Get emote display data for triggering
  async getEmoteDisplayData(event: string): Promise<EmoteDisplayData | null> {
    const emote = this.getEmoteForEvent(event);
    if (!emote) return null;

    const cachedAsset = this.assetCache.get(emote.asset);
    if (!cachedAsset) {
      console.warn('Emote asset not cached:', emote.asset);
      return null;
    }

    return {
      id: emote.id,
      asset: cachedAsset,
      animationType: emote.animationType,
      duration: emote.duration
    };
  }

  // Check if emotes are enabled in settings
  async areEmotesEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('emotes_enabled');
      return enabled !== 'false'; // Default to true
    } catch {
      return true;
    }
  }

  // Enable/disable emotes
  async setEmotesEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('emotes_enabled', enabled.toString());
    } catch (error) {
      console.warn('Failed to save emote settings:', error);
    }
  }

  // Get all available emotes for settings display
  getAllEmotes(): EmoteConfig[] {
    return Array.from(this.emotes.values());
  }

  // Clear cache (useful for updates)
  clearCache(): void {
    this.assetCache.clear();
    this.configLoaded = false;
    this.emotes.clear();
  }
}

// Export singleton instance
export const emoteManager = EmoteManager.getInstance();

// React hook for using emote service
export const useEmoteService = () => {
  return {
    loadConfig: emoteManager.loadEmoteConfig.bind(emoteManager),
    preloadAssets: emoteManager.preloadAssets.bind(emoteManager),
    getEmoteForEvent: emoteManager.getEmoteForEvent.bind(emoteManager),
    getEmoteDisplayData: emoteManager.getEmoteDisplayData.bind(emoteManager),
    areEmotesEnabled: emoteManager.areEmotesEnabled.bind(emoteManager),
    setEmotesEnabled: emoteManager.setEmotesEnabled.bind(emoteManager),
    getAllEmotes: emoteManager.getAllEmotes.bind(emoteManager),
    clearCache: emoteManager.clearCache.bind(emoteManager),
  };
};
