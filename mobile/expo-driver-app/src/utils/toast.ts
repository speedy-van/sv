import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

export const showToast = {
  success: (title: string, message?: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  error: (title: string, message?: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      topOffset: 60,
    });
  },

  info: (title: string, message?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  warning: (title: string, message?: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3500,
      topOffset: 60,
    });
  },

  neon: (title: string, message?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Toast.show({
      type: 'neon',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      topOffset: 60,
    });
  },
};

export default showToast;

