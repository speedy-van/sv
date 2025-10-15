import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import RoutesScreen from '../screens/RoutesScreen';
import EarningsScreen from '../screens/EarningsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Routes: undefined;
  Earnings: undefined;
  Notifications: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Badge component for notifications
const NotificationBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

export default function MainTabNavigator() {
  // Unread notifications count - will be dynamic from context/store
  const unreadNotificationsCount = 0; // Changed from 3 to 0

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

                 if (route.name === 'Dashboard') {
                   iconName = focused ? 'home' : 'home-outline';
                 } else if (route.name === 'Routes') {
                   iconName = focused ? 'git-network' : 'git-network-outline';
                 } else if (route.name === 'Earnings') {
                   iconName = focused ? 'cash' : 'cash-outline';
                 } else if (route.name === 'Notifications') {
                   iconName = focused ? 'notifications' : 'notifications-outline';
                 } else if (route.name === 'Chat') {
                   iconName = focused ? 'chatbubble' : 'chatbubble-outline';
                 } else if (route.name === 'Profile') {
                   iconName = focused ? 'person' : 'person-outline';
                 }

          const icon = <Ionicons name={iconName} size={size} color={color} />;
          
          // Add badge for notifications
          if (route.name === 'Notifications') {
            return (
              <View style={styles.iconContainer}>
                {icon}
                <NotificationBadge count={unreadNotificationsCount} />
              </View>
            );
          }
          
          return icon;
        },
        tabBarActiveTintColor: '#1E40AF',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
          height: 60,
        },
        headerShown: true,
      })}
    >
             <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
             <Tab.Screen name="Routes" component={RoutesScreen} options={{ title: 'Routes' }} />
             <Tab.Screen name="Earnings" component={EarningsScreen} />
             <Tab.Screen name="Notifications" component={NotificationsScreen} />
             <Tab.Screen name="Chat" component={ChatScreen} />
             <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

