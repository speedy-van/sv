import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import JobDetailScreen from '../screens/JobDetailScreen';
import JobProgressScreen from '../screens/JobProgressScreen';
import EarningsScreen from '../screens/EarningsScreen';
import { ActivityIndicator, View } from 'react-native';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  JobDetail: { jobId: string };
  JobProgress: { jobId: string };
  Earnings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen 
            name="JobDetail" 
            component={JobDetailScreen}
            options={{ headerShown: true, title: 'Job Details' }}
          />
          <Stack.Screen 
            name="JobProgress" 
            component={JobProgressScreen}
            options={{ headerShown: true, title: 'Job Progress' }}
          />
          <Stack.Screen 
            name="Earnings" 
            component={EarningsScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

