import { useEffect, useState, useMemo } from 'react';
import { Appearance, Platform, Dimensions } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from './theme';

// Dynamic theming system that adapts to user preferences and environment

export type ThemeMode = 'light' | 'dark' | 'auto';
export type HighContrastMode = 'normal' | 'high' | 'auto';

export interface AdaptiveTheme {
  colors: typeof colors & {
    adaptive: {
      background: string;
      surface: string;
      text: string;
      border: string;
    };
    timeBased: {
      primary: string;
      accent: string;
    };
  };
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isHighContrast: boolean;
  isOLED: boolean;
}

// Time-based color adaptation
const getTimeBasedColors = (hour: number) => {
  // Dawn (5-7 AM)
  if (hour >= 5 && hour < 7) {
    return {
      primary: '#FF6B35', // Warm orange
      accent: '#F7931E',  // Golden
    };
  }

  // Morning (7 AM - 12 PM)
  if (hour >= 7 && hour < 12) {
    return {
      primary: '#007AFF', // iOS Blue
      accent: '#34C759',  // Green
    };
  }

  // Afternoon (12-5 PM)
  if (hour >= 12 && hour < 17) {
    return {
      primary: '#5856D6', // Purple
      accent: '#FF9500',  // Orange
    };
  }

  // Evening (5-9 PM)
  if (hour >= 17 && hour < 21) {
    return {
      primary: '#AF52DE', // Purple
      accent: '#FF2D55',  // Pink
    };
  }

  // Night (9 PM - 5 AM)
  return {
    primary: '#007AFF', // Blue
    accent: '#5AC8FA',  // Light blue
  };
};

// OLED display detection and optimization
const isOLEDDisplay = (): boolean => {
  const { height } = Dimensions.get('window');
  // iPhone X and newer with OLED displays
  return Platform.OS === 'ios' && height >= 812;
};

// High contrast color adjustments
const getHighContrastColors = (baseColors: typeof colors, highContrast: boolean) => {
  if (!highContrast) return baseColors;

  return {
    ...baseColors,
    text: {
      ...baseColors.text,
      secondary: '#FFFFFF', // Full white for better contrast
      tertiary: '#CCCCCC',   // Lighter gray
    },
    border: {
      ...baseColors.border,
      light: 'rgba(255, 255, 255, 0.3)',
      medium: 'rgba(255, 255, 255, 0.5)',
    },
    glass: {
      light: 'rgba(255, 255, 255, 0.15)',
      medium: 'rgba(255, 255, 255, 0.25)',
      strong: 'rgba(255, 255, 255, 0.35)',
      dark: 'rgba(0, 0, 0, 0.5)',
    }
  };
};

// Main dynamic theme hook
export const useAdaptiveTheme = (
  mode: ThemeMode = 'auto',
  highContrast: HighContrastMode = 'auto'
): AdaptiveTheme => {
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme());
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Update system theme when it changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Determine effective theme mode
  const effectiveTheme = useMemo(() => {
    if (mode === 'auto') {
      return systemTheme || 'dark'; // Default to dark if system theme unavailable
    }
    return mode;
  }, [mode, systemTheme]);

  // Determine high contrast mode
  const effectiveHighContrast = useMemo(() => {
    if (highContrast === 'auto') {
      // Auto-enable high contrast in bright environments or for accessibility
      return false; // For now, keep it false unless user explicitly enables
    }
    return highContrast === 'high';
  }, [highContrast]);

  // Generate adaptive colors
  const adaptiveColors = useMemo(() => {
    const timeColors = getTimeBasedColors(currentHour);
    const baseColors = getHighContrastColors(colors, effectiveHighContrast);
    const oled = isOLEDDisplay();

    // Adaptive background colors based on theme and display
    const adaptiveBackground = effectiveTheme === 'dark' ? {
      primary: oled ? '#000000' : baseColors.background.primary,
      secondary: oled ? '#000000' : baseColors.background.secondary,
      tertiary: oled ? '#0A0A0A' : baseColors.background.tertiary,
      elevated: oled ? '#1A1A1A' : baseColors.background.elevated,
    } : {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      tertiary: '#F1F3F4',
      elevated: '#FFFFFF',
    };

    return {
      ...baseColors,
      adaptive: {
        background: adaptiveBackground.primary,
        surface: adaptiveBackground.secondary,
        text: effectiveTheme === 'dark' ? '#FFFFFF' : '#000000',
        border: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      timeBased: timeColors,
    };
  }, [effectiveTheme, effectiveHighContrast, currentHour]);

  return {
    colors: adaptiveColors,
    typography,
    spacing,
    borderRadius,
    shadows,
    isHighContrast: effectiveHighContrast,
    isOLED: isOLEDDisplay(),
  };
};

// Theme persistence utilities
export const ThemePersistence = {
  saveThemePreferences: async (preferences: {
    mode: ThemeMode;
    highContrast: HighContrastMode;
  }) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem('theme_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  },

  loadThemePreferences: async (): Promise<{
    mode: ThemeMode;
    highContrast: HighContrastMode;
  }> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const stored = await AsyncStorage.getItem('theme_preferences');
      return stored ? JSON.parse(stored) : { mode: 'auto', highContrast: 'auto' };
    } catch (error) {
      return { mode: 'auto', highContrast: 'auto' };
    }
  },

  resetThemePreferences: async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem('theme_preferences');
    } catch (error) {
      console.warn('Failed to reset theme preferences:', error);
    }
  }
};

// Theme transition utilities
export const ThemeTransitions = {
  // Smooth theme transitions
  createThemeTransition: (duration: number = 300) => ({
    transition: {
      duration,
      timing: 'ease-in-out' as const,
    }
  }),

  // Animated theme switching
  useThemeTransition: (theme: AdaptiveTheme) => {
    // This would integrate with React Native Reanimated for smooth transitions
    // For now, return theme as-is
    return theme;
  }
};

// Accessibility helpers
export const AccessibilityHelpers = {
  // Calculate contrast ratio for WCAG compliance
  calculateContrastRatio: (foreground: string, background: string): number => {
    // Simplified contrast calculation
    const fgBrightness = hexToBrightness(foreground);
    const bgBrightness = hexToBrightness(background);
    return (Math.max(fgBrightness, bgBrightness) + 0.05) /
           (Math.min(fgBrightness, bgBrightness) + 0.05);
  },

  // Ensure minimum contrast ratio (WCAG AA = 4.5:1)
  ensureMinimumContrast: (
    color: string,
    background: string,
    minRatio: number = 4.5
  ): string => {
    const currentRatio = AccessibilityHelpers.calculateContrastRatio(color, background);
    if (currentRatio >= minRatio) return color;

    // Adjust color brightness to meet contrast requirements
    return adjustBrightnessForContrast(color, background, minRatio);
  }
};

// Helper functions
function hexToBrightness(hex: string): number {
  // Convert hex to RGB and calculate brightness
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function adjustBrightnessForContrast(
  color: string,
  background: string,
  targetRatio: number
): string {
  // Simplified color adjustment - in practice, you'd use a more sophisticated algorithm
  const bgBrightness = hexToBrightness(background);
  const targetBrightness = bgBrightness > 128
    ? Math.max(0, bgBrightness - (targetRatio - 1) * 50)
    : Math.min(255, bgBrightness + (targetRatio - 1) * 50);

  return brightnessToHex(targetBrightness);
}

function brightnessToHex(brightness: number): string {
  const value = Math.round(Math.max(0, Math.min(255, brightness)));
  const hex = value.toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
}

// Export default theme for backward compatibility
export const defaultAdaptiveTheme: AdaptiveTheme = {
  colors: {
    ...colors,
    adaptive: {
      background: colors.background.primary,
      surface: colors.background.secondary,
      text: colors.text.primary,
      border: colors.border.light,
    },
    timeBased: {
      primary: '#007AFF',
      accent: '#34C759',
    }
  },
  typography,
  spacing,
  borderRadius,
  shadows,
  isHighContrast: false,
  isOLED: false,
};
