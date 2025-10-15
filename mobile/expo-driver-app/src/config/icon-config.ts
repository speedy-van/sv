/**
 * Icon Configuration for iOS-Android Alignment
 * Ensures identical icons across platforms
 */

export const IconConfig = {
  // Navigation Icons (Matching iOS exactly)
  navigation: {
    home: {
      active: 'home' as const,
      inactive: 'home-outline' as const,
    },
    routes: {
      active: 'git-network' as const,
      inactive: 'git-network-outline' as const,
    },
    earnings: {
      active: 'cash' as const,
      inactive: 'cash-outline' as const,
    },
    notifications: {
      active: 'notifications' as const,
      inactive: 'notifications-outline' as const,
    },
    chat: {
      active: 'chatbubble' as const,
      inactive: 'chatbubble-outline' as const,
    },
    profile: {
      active: 'person' as const,
      inactive: 'person-outline' as const,
    },
  },

  // Action Icons (Matching iOS exactly)
  actions: {
    accept: 'checkmark-circle' as const,
    decline: 'close-circle' as const,
    start: 'play-circle' as const,
    complete: 'checkmark-circle' as const,
    cancel: 'close-circle' as const,
    edit: 'create' as const,
    delete: 'trash' as const,
    save: 'save' as const,
    refresh: 'refresh' as const,
    search: 'search' as const,
    filter: 'filter' as const,
    sort: 'swap-vertical' as const,
    more: 'ellipsis-horizontal' as const,
    back: 'arrow-back' as const,
    forward: 'arrow-forward' as const,
    up: 'arrow-up' as const,
    down: 'arrow-down' as const,
    left: 'arrow-back' as const,
    right: 'arrow-forward' as const,
  },

  // Status Icons (Matching iOS exactly)
  status: {
    pending: 'time' as const,
    active: 'radio-button-on' as const,
    completed: 'checkmark-circle' as const,
    cancelled: 'close-circle' as const,
    inProgress: 'sync' as const,
    approved: 'checkmark-circle' as const,
    rejected: 'close-circle' as const,
    online: 'radio-button-on' as const,
    offline: 'radio-button-off' as const,
    available: 'checkmark-circle' as const,
    unavailable: 'close-circle' as const,
  },

  // Feature Icons (Matching iOS exactly)
  features: {
    location: 'location' as const,
    navigation: 'navigate' as const,
    map: 'map' as const,
    camera: 'camera' as const,
    photo: 'image' as const,
    video: 'videocam' as const,
    audio: 'mic' as const,
    phone: 'call' as const,
    message: 'chatbubble' as const,
    email: 'mail' as const,
    calendar: 'calendar' as const,
    clock: 'time' as const,
    settings: 'settings' as const,
    help: 'help-circle' as const,
    info: 'information-circle' as const,
    warning: 'warning' as const,
    error: 'alert-circle' as const,
    success: 'checkmark-circle' as const,
  },

  // Size Configuration (Matching iOS exactly)
  sizes: {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 32,
  },

  // Color Configuration (Matching iOS exactly)
  colors: {
    primary: '#1E40AF',
    secondary: '#10B981',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    text: '#FFFFFF',
    textSecondary: '#E5E5E5',
    textTertiary: '#9CA3AF',
  },
};

export default IconConfig;
