/**
 * Screen Configuration for iOS-Android Alignment
 * Ensures identical UI/UX across platforms
 */

export const ScreenConfig = {
  // Header Configuration (Matching iOS exactly)
  header: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
    borderBottomWidth: 1,
    height: 60,
    titleStyle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600' as const,
    },
    headerTintColor: '#FFFFFF',
  },

  // Tab Bar Configuration (Matching iOS exactly)
  tabBar: {
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
    height: 60,
    activeTintColor: '#1E40AF',
    inactiveTintColor: '#6B7280',
    labelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
  },

  // Screen Container (Matching iOS exactly)
  screen: {
    backgroundColor: '#111827',
    flex: 1,
  },

  // Card Configuration (Matching iOS exactly)
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Button Configuration (Matching iOS exactly)
  button: {
    primary: {
      backgroundColor: '#1E40AF',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    secondary: {
      backgroundColor: '#374151',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: '#4B5563',
    },
  },

  // Input Configuration (Matching iOS exactly)
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
    fontSize: 16,
    color: '#FFFFFF',
    placeholderTextColor: '#9CA3AF',
  },

  // Text Configuration (Matching iOS exactly)
  text: {
    primary: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '400' as const,
    },
    secondary: {
      color: '#E5E5E5',
      fontSize: 14,
      fontWeight: '400' as const,
    },
    heading: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '600' as const,
    },
    caption: {
      color: '#9CA3AF',
      fontSize: 12,
      fontWeight: '400' as const,
    },
  },

  // Status Bar Configuration (Matching iOS exactly)
  statusBar: {
    backgroundColor: '#1F2937',
    barStyle: 'light-content' as const,
  },
};

export default ScreenConfig;
