import { useEffect, useRef, useState } from 'react';

export type NotificationSound = 'job-notification' | 'urgent' | 'success' | 'warning';

interface AudioNotificationProps {
  sound?: NotificationSound;
  volume?: number; // 0-1
  autoPlay?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface AudioNotificationHook {
  play: (sound?: NotificationSound) => Promise<void>;
  stop: () => void;
  prepareAudio: () => Promise<void>;
  isPlaying: boolean;
  isSupported: boolean;
  setVolume: (volume: number) => void;
}

// Audio file mappings
const AUDIO_FILES: Record<NotificationSound, string> = {
  'job-notification': '/audio/job-notification.m4a',
  'urgent': '/audio/job-notification.m4a', // Using same file for now
  'success': '/audio/job-notification.m4a', // Using same file for now
  'warning': '/audio/job-notification.m4a', // Using same file for now
};

// Hook for audio notifications
export function useAudioNotification(): AudioNotificationHook {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if audio is supported
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      setIsSupported(!!audio.canPlayType);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const play = async (sound: NotificationSound = 'job-notification'): Promise<void> => {
    if (!isSupported) {
      console.warn('❌ Audio not supported in this browser');
      throw new Error('Audio not supported in this browser');
    }

    try {
      console.log(`🔊 Attempting to play notification sound: ${sound}`);
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio instance with error handling
      const audioFile = AUDIO_FILES[sound];
      console.log(`📁 Loading audio file: ${audioFile}`);
      
      const audio = new Audio(audioFile);
      audioRef.current = audio;

      // Configure audio with better settings
      audio.volume = 0.9; // Increased volume
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous'; // For CORS issues

      // Promise-based approach for better error handling
      return new Promise((resolve, reject) => {
        const cleanup = () => {
          audio.removeEventListener('loadstart', handleLoadStart);
          audio.removeEventListener('canplaythrough', handleCanPlay);
          audio.removeEventListener('play', handlePlay);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
        };

        const handleLoadStart = () => {
          console.log('� Loading notification sound...');
        };

        const handleCanPlay = () => {
          console.log('✅ Notification sound ready to play');
        };

        const handlePlay = () => {
          setIsPlaying(true);
          console.log('🔊 Playing notification sound successfully');
          resolve();
        };

        const handleEnded = () => {
          setIsPlaying(false);
          console.log('✅ Notification sound finished');
          cleanup();
        };

        const handleError = (e: any) => {
          setIsPlaying(false);
          cleanup();
          const errorMsg = `Audio playback failed: ${e.target?.error?.message || 'Unknown error'}`;
          console.error('❌', errorMsg);
          reject(new Error(errorMsg));
        };

        // Set up event listeners
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplaythrough', handleCanPlay);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        // Attempt to play with fallback strategies
        audio.play().catch((playError) => {
          console.warn('⚠️ Direct play failed, trying fallback:', playError.message);
          
          // Fallback 1: Try with user interaction check
          if (playError.name === 'NotAllowedError') {
            console.error('❌ Audio blocked by browser - user interaction required');
            reject(new Error('Audio blocked - user interaction required. Please click on the page first.'));
          } else if (playError.name === 'NotSupportedError') {
            console.error('❌ Audio format not supported');
            reject(new Error('Audio format not supported by browser'));
          } else {
            console.error('❌ Unknown playback error:', playError);
            reject(playError);
          }
          
          cleanup();
        });

        // Timeout fallback
        setTimeout(() => {
          if (!isPlaying) {
            cleanup();
            reject(new Error('Audio playback timeout - took too long to start'));
          }
        }, 5000);
      });
      
    } catch (error) {
      setIsPlaying(false);
      console.error('❌ Failed to initialize audio:', error);
      throw error;
    }
  };

  const stop = (): void => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const setVolume = (volume: number): void => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  };

  // Function to prepare audio context (call this on user interaction)
  const prepareAudio = async (): Promise<void> => {
    try {
      console.log('🔧 Preparing audio context...');
      
      // Create a silent audio to unlock audio context
      const silentAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAQAAABcwCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAA');
      silentAudio.volume = 0.01; // Very low volume
      
      await silentAudio.play();
      silentAudio.pause();
      
      console.log('✅ Audio context prepared successfully');
    } catch (error) {
      console.warn('⚠️ Could not prepare audio context:', error);
    }
  };

  return {
    play,
    stop,
    prepareAudio,
    isPlaying,
    isSupported,
    setVolume,
  };
}

// Component for declarative audio notifications
export default function AudioNotification({
  sound = 'job-notification',
  volume = 0.8,
  autoPlay = false,
  loop = false,
  onPlay,
  onEnd,
  onError,
}: AudioNotificationProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = Math.max(0, Math.min(1, volume));
    audio.loop = loop;

    const handlePlay = () => {
      setHasPlayed(true);
      onPlay?.();
      console.log('🔊 Job notification sound started');
    };

    const handleEnded = () => {
      onEnd?.();
      console.log('✅ Job notification sound finished');
    };

    const handleError = () => {
      const errorMsg = 'Failed to load or play notification sound';
      onError?.(errorMsg);
      console.error('❌ Audio error:', errorMsg);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Auto-play if enabled and not played yet
    if (autoPlay && !hasPlayed) {
      audio.play().catch(error => {
        console.error('❌ Auto-play failed:', error);
        onError?.('Auto-play blocked by browser');
      });
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [sound, volume, loop, autoPlay, hasPlayed, onPlay, onEnd, onError]);

  return (
    <audio
      ref={audioRef}
      preload="auto"
      style={{ display: 'none' }}
    >
      <source src={AUDIO_FILES[sound]} type="audio/mp4" />
      <source src={AUDIO_FILES[sound]} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
}

// Utility functions for playing sounds directly
export const playJobNotificationSound = async (): Promise<void> => {
  try {
    const audio = new Audio('/audio/job-notification.m4a');
    audio.volume = 0.9;
    await audio.play();
    console.log('🔊 Job notification sound played');
  } catch (error) {
    console.error('❌ Failed to play job notification:', error);
  }
};

export const playUrgentNotificationSound = async (): Promise<void> => {
  try {
    const audio = new Audio('/audio/job-notification.m4a');
    audio.volume = 1.0; // Full volume for urgent
    // Play twice for urgency
    await audio.play();
    setTimeout(async () => {
      const audio2 = new Audio('/audio/job-notification.m4a');
      audio2.volume = 1.0;
      await audio2.play();
    }, 500);
    console.log('🚨 Urgent notification sound played');
  } catch (error) {
    console.error('❌ Failed to play urgent notification:', error);
  }
};

// Browser notification permission helper
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Combined audio + browser notification
export const showJobNotificationWithSound = async (
  title: string,
  message: string,
  options?: {
    urgent?: boolean;
    requireInteraction?: boolean;
  }
): Promise<void> => {
  const { urgent = false, requireInteraction = false } = options || {};

  try {
    // Play sound
    if (urgent) {
      await playUrgentNotificationSound();
    } else {
      await playJobNotificationSound();
    }

    // Show browser notification if permission granted
    if (await requestNotificationPermission()) {
      const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'job-notification',
        requireInteraction,
      };

      // Add vibrate if supported
      if ('vibrate' in navigator) {
        (notificationOptions as any).vibrate = urgent ? [200, 100, 200, 100, 200] : [200, 100, 200];
      }

      const notification = new Notification(title, notificationOptions);

      // Auto-close after 10 seconds if not urgent
      if (!urgent && !requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

  } catch (error) {
    console.error('❌ Failed to show notification with sound:', error);
  }
};