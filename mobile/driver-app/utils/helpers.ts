import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

export const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `£${numAmount.toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }
};

export const formatTime = (timeString: string): string => {
  return timeString;
};

export const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return `${formatDate(dateTimeString)} at ${date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return '#10B981'; // green
    case 'accepted':
      return '#3B82F6'; // blue
    case 'invited':
      return '#F59E0B'; // amber
    case 'available':
      return '#10B981'; // green
    case 'cancelled':
      return '#EF4444'; // red
    default:
      return '#6B7280'; // gray
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'invited':
      return 'New';
    case 'accepted':
      return 'Accepted';
    case 'completed':
      return 'Completed';
    case 'available':
      return 'Available';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export const playNotificationSound = async (): Promise<void> => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/notification.mp3')
    );
    await sound.playAsync();
    
    // Unload sound after playing
    setTimeout(async () => {
      await sound.unloadAsync();
    }, 3000);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export const showNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const openMapsApp = (
  latitude: number,
  longitude: number,
  label?: string
): void => {
  const scheme = Platform.select({
    ios: 'maps:0,0?q=',
    android: 'geo:0,0?q=',
  });
  const latLng = `${latitude},${longitude}`;
  const url = Platform.select({
    ios: `${scheme}${label || 'Location'}@${latLng}`,
    android: `${scheme}${latLng}(${label || 'Location'})`,
  });

  if (url) {
    Linking.openURL(url);
  }
};

import { Platform, Linking } from 'react-native';

