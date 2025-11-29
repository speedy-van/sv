import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import { LocationProvider } from '../contexts/LocationContext';
import { JobAssignmentProvider } from '../contexts/JobAssignmentContext';
import { GlobalJobAssignmentModal } from '../components/GlobalJobAssignmentModal';
import { EmoteOverlay } from '../components/EmoteOverlay';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { useEffect } from 'react';
import { telemetryService } from '../src/lib/telemetry';
import { soundService } from '../services/soundService';
import { emoteManager } from '../services/emoteService';
import { apiService } from '../services/api';

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

// Define background location task BEFORE app renders
const BACKGROUND_LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    
    if (location) {
      try {
        // Send location update to backend
        await apiService.post('/api/driver/location', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy,
        });
      } catch (error) {
        console.error('Failed to send background location:', error);
      }
    }
  }
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

    // Initialize services
    const initializeServices = async () => {
      soundService.initialize();

      // Initialize emote service
      try {
        await emoteManager.loadEmoteConfig();
        await emoteManager.preloadAssets();
        console.log('✅ Emote service initialized');
      } catch (error) {
        console.warn('Failed to initialize emote service:', error);
      }
    };

    requestPermissions();
    initializeServices();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LocationProvider>
          <JobAssignmentProvider>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 300,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/forgot-password" />
              <Stack.Screen name="auth/reset-password" />
              <Stack.Screen name="tabs" />
              <Stack.Screen name="job/[id]" />
            </Stack>
            {/* Global Job Assignment Modal - appears on ALL screens */}
            <GlobalJobAssignmentModal />
            {/* Emote Overlay - appears on ALL screens */}
            <EmoteOverlay />
          </JobAssignmentProvider>
        </LocationProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

