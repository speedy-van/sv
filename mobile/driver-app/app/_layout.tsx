import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { LocationProvider } from '../contexts/LocationContext';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions on app start
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    };

    requestPermissions();
  }, []);

  return (
    <AuthProvider>
      <LocationProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/forgot-password" />
          <Stack.Screen name="auth/reset-password" />
          <Stack.Screen name="tabs" />
          <Stack.Screen name="job/[id]" />
        </Stack>
      </LocationProvider>
    </AuthProvider>
  );
}

