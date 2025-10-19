import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDriverStore } from '../store/driver.store';
import apiService from '../services/api.service';
import pusherService from '../services/pusher.service';
import RouteProgressView from '../components/RouteProgressView';
import RouteSearchingIndicator from '../components/RouteSearchingIndicator';
import { openMapsNavigation } from '../utils/navigation.utils';
import { formatEarnings } from '../utils/earnings.utils';
import { DeclineRouteResponse } from '../types';
import { saveRoutes, getRoutes, saveJobState, getJobState } from '../services/storage.service';

interface Drop {
  id: string;
  deliveryAddress: string;
  pickupAddress?: string;
  customerName: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  serviceTier: 'economy' | 'standard' | 'premium';
  specialInstructions?: string;
}

interface Route {
  id: string;
  reference?: string; // Unified SV reference number
  status: 'planned' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  drops: Drop[];
  estimatedDuration: number; // minutes
  estimatedDistance: number; // miles
  estimatedEarnings: number; // GBP
  startTime: string;
  totalDistance?: number;
  totalWorkers?: number;
  hasCameras?: boolean;
}

export default function RoutesScreen() {
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState(true);
  const [routes, setRoutes] = useState<Route[]>([
    {
      id: 'route_001',
      status: 'planned',
      drops: [
        {
          id: 'drop_001_1',
          customerName: 'John Smith',
          deliveryAddress: '123 High Street, Glasgow, G1 1AA',
          pickupAddress: 'Warehouse A, London, E1 6AN',
          timeWindowStart: '2024-01-15T09:00:00Z',
          timeWindowEnd: '2024-01-15T10:00:00Z',
          status: 'pending',
          serviceTier: 'standard',
          specialInstructions: 'Call customer 15 mins before arrival.',
        },
        {
          id: 'drop_001_2',
          customerName: 'Sarah Johnson',
          deliveryAddress: '789 Park Avenue, Glasgow, G2 2BB',
          pickupAddress: 'Warehouse A, London, E1 6AN',
          timeWindowStart: '2024-01-15T10:30:00Z',
          timeWindowEnd: '2024-01-15T11:30:00Z',
          status: 'pending',
          serviceTier: 'premium',
          specialInstructions: 'Fragile items, handle with care.',
        },
        {
          id: 'drop_001_3',
          customerName: 'Mike Brown',
          deliveryAddress: '321 Queen Street, Glasgow, G3 3CC',
          pickupAddress: 'Warehouse A, London, E1 6AN',
          timeWindowStart: '2024-01-15T12:00:00Z',
          timeWindowEnd: '2024-01-15T13:00:00Z',
          status: 'pending',
          serviceTier: 'economy',
        },
        {
          id: 'drop_001_4',
          customerName: 'Emma Wilson',
          deliveryAddress: '654 King Road, Glasgow, G4 4DD',
          pickupAddress: 'Warehouse A, London, E1 6AN',
          timeWindowStart: '2024-01-15T13:30:00Z',
          timeWindowEnd: '2024-01-15T14:30:00Z',
          status: 'pending',
          serviceTier: 'standard',
        },
        {
          id: 'drop_001_5',
          customerName: 'David Lee',
          deliveryAddress: '987 Victoria Street, Glasgow, G5 5EE',
          pickupAddress: 'Warehouse A, London, E1 6AN',
          timeWindowStart: '2024-01-15T15:00:00Z',
          timeWindowEnd: '2024-01-15T16:00:00Z',
          status: 'pending',
          serviceTier: 'premium',
          specialInstructions: 'Large items, bring trolley.',
        },
      ],
      estimatedDuration: 180,
      estimatedDistance: 25.5,
      estimatedEarnings: 125.50,
      startTime: '2024-01-15T08:30:00Z',
      totalWorkers: 1,
      hasCameras: false,
    },
    {
      id: 'route_002',
      status: 'planned',
      drops: [
        {
          id: 'drop_002_1',
          customerName: 'Lisa Anderson',
          deliveryAddress: '456 Princes Street, Edinburgh, EH2 2AN',
          pickupAddress: 'Warehouse B, London, E1 6AN',
          timeWindowStart: '2024-01-15T10:00:00Z',
          timeWindowEnd: '2024-01-15T11:00:00Z',
          status: 'pending',
          serviceTier: 'standard',
        },
        {
          id: 'drop_002_2',
          customerName: 'Robert Taylor',
          deliveryAddress: '789 Royal Mile, Edinburgh, EH1 1RE',
          pickupAddress: 'Warehouse B, London, E1 6AN',
          timeWindowStart: '2024-01-15T11:30:00Z',
          timeWindowEnd: '2024-01-15T12:30:00Z',
          status: 'pending',
          serviceTier: 'economy',
        },
        {
          id: 'drop_002_3',
          customerName: 'Jennifer White',
          deliveryAddress: '321 George Street, Edinburgh, EH2 2PF',
          pickupAddress: 'Warehouse B, London, E1 6AN',
          timeWindowStart: '2024-01-15T13:00:00Z',
          timeWindowEnd: '2024-01-15T14:00:00Z',
          status: 'pending',
          serviceTier: 'premium',
          specialInstructions: 'White glove service required.',
        },
      ],
      estimatedDuration: 150,
      estimatedDistance: 18.2,
      estimatedEarnings: 85.75,
      startTime: '2024-01-15T09:30:00Z',
      totalWorkers: 1,
      hasCameras: true,
    },
    {
      id: 'route_003',
      status: 'assigned',
      drops: [
        {
          id: 'drop_003_1',
          customerName: 'Michael Brown',
          deliveryAddress: '123 Sauchiehall Street, Glasgow, G2 3EW',
          pickupAddress: 'Warehouse C, London, E1 6AN',
          timeWindowStart: '2024-01-15T14:00:00Z',
          timeWindowEnd: '2024-01-15T15:00:00Z',
          status: 'assigned',
          serviceTier: 'standard',
        },
        {
          id: 'drop_003_2',
          customerName: 'Sarah Davis',
          deliveryAddress: '456 Buchanan Street, Glasgow, G1 3HL',
          pickupAddress: 'Warehouse C, London, E1 6AN',
          timeWindowStart: '2024-01-15T15:30:00Z',
          timeWindowEnd: '2024-01-15T16:30:00Z',
          status: 'assigned',
          serviceTier: 'premium',
          specialInstructions: 'Customer prefers morning delivery.',
        },
        {
          id: 'drop_003_3',
          customerName: 'James Wilson',
          deliveryAddress: '789 Argyle Street, Glasgow, G3 8AG',
          pickupAddress: 'Warehouse C, London, E1 6AN',
          timeWindowStart: '2024-01-15T17:00:00Z',
          timeWindowEnd: '2024-01-15T18:00:00Z',
          status: 'assigned',
          serviceTier: 'economy',
        },
        {
          id: 'drop_003_4',
          customerName: 'Emma Thompson',
          deliveryAddress: '321 Byres Road, Glasgow, G12 8AH',
          pickupAddress: 'Warehouse C, London, E1 6AN',
          timeWindowStart: '2024-01-15T18:30:00Z',
          timeWindowEnd: '2024-01-15T19:30:00Z',
          status: 'assigned',
          serviceTier: 'standard',
        },
      ],
      estimatedDuration: 165,
      estimatedDistance: 22.1,
      estimatedEarnings: 95.25,
      startTime: '2024-01-15T13:30:00Z',
      totalWorkers: 1,
      hasCameras: false,
    },
    {
      id: 'route_004',
      status: 'in_progress',
      drops: [
        {
          id: 'drop_004_1',
          customerName: 'Alex Johnson',
          deliveryAddress: '123 Union Street, Aberdeen, AB10 1GE',
          pickupAddress: 'Warehouse D, London, E1 6AN',
          timeWindowStart: '2024-01-15T08:00:00Z',
          timeWindowEnd: '2024-01-15T09:00:00Z',
          status: 'completed',
          serviceTier: 'standard',
        },
        {
          id: 'drop_004_2',
          customerName: 'Maria Garcia',
          deliveryAddress: '456 King Street, Aberdeen, AB24 5BD',
          pickupAddress: 'Warehouse D, London, E1 6AN',
          timeWindowStart: '2024-01-15T09:30:00Z',
          timeWindowEnd: '2024-01-15T10:30:00Z',
          status: 'in_progress',
          serviceTier: 'premium',
          specialInstructions: 'Customer waiting at reception.',
        },
        {
          id: 'drop_004_3',
          customerName: 'Thomas Miller',
          deliveryAddress: '789 George Street, Aberdeen, AB25 1HZ',
          pickupAddress: 'Warehouse D, London, E1 6AN',
          timeWindowStart: '2024-01-15T11:00:00Z',
          timeWindowEnd: '2024-01-15T12:00:00Z',
          status: 'pending',
          serviceTier: 'economy',
        },
        {
          id: 'drop_004_4',
          customerName: 'Sophie Clark',
          deliveryAddress: '321 Union Terrace, Aberdeen, AB10 1NJ',
          pickupAddress: 'Warehouse D, London, E1 6AN',
          timeWindowStart: '2024-01-15T12:30:00Z',
          timeWindowEnd: '2024-01-15T13:30:00Z',
          status: 'pending',
          serviceTier: 'standard',
        },
        {
          id: 'drop_004_5',
          customerName: 'Daniel Lewis',
          deliveryAddress: '654 Crown Street, Aberdeen, AB11 6EX',
          pickupAddress: 'Warehouse D, London, E1 6AN',
          timeWindowStart: '2024-01-15T14:00:00Z',
          timeWindowEnd: '2024-01-15T15:00:00Z',
          status: 'pending',
          serviceTier: 'premium',
          specialInstructions: 'Fragile electronics, handle carefully.',
        },
        {
          id: 'drop_004_6',
          customerName: 'Rachel Green',
          deliveryAddress: '987 Great Western Road, Aberdeen, AB10 6PY',
          pickupAddress: 'Warehouse D, London, E1 6AN',
          timeWindowStart: '2024-01-15T15:30:00Z',
          timeWindowEnd: '2024-01-15T16:30:00Z',
          status: 'pending',
          serviceTier: 'standard',
        },
      ],
      estimatedDuration: 210,
      estimatedDistance: 28.7,
      estimatedEarnings: 110.00,
      startTime: '2024-01-15T07:30:00Z',
      totalWorkers: 1,
      hasCameras: true,
    },
    {
      id: 'route_005',
      status: 'completed',
      drops: [
        {
          id: 'drop_005_1',
          customerName: 'Kevin Murphy',
          deliveryAddress: '123 High Street, Dundee, DD1 1TD',
          pickupAddress: 'Warehouse E, London, E1 6AN',
          timeWindowStart: '2024-01-14T10:00:00Z',
          timeWindowEnd: '2024-01-14T11:00:00Z',
          status: 'completed',
          serviceTier: 'standard',
        },
        {
          id: 'drop_005_2',
          customerName: 'Amanda Scott',
          deliveryAddress: '456 Nethergate, Dundee, DD1 4DH',
          pickupAddress: 'Warehouse E, London, E1 6AN',
          timeWindowStart: '2024-01-14T11:30:00Z',
          timeWindowEnd: '2024-01-14T12:30:00Z',
          status: 'completed',
          serviceTier: 'economy',
        },
      ],
      estimatedDuration: 120,
      estimatedDistance: 15.3,
      estimatedEarnings: 75.00,
      startTime: '2024-01-14T09:30:00Z',
      totalWorkers: 1,
      hasCameras: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'planned' | 'assigned' | 'in_progress'>('all');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'planned', label: 'New' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'Active' },
  ];

  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      
      // 1. Load from cache first (instant UI)
      const cachedRoutes = await getRoutes();
      if (cachedRoutes && cachedRoutes.length > 0) {
        console.log(`📦 Loaded ${cachedRoutes.length} routes from cache`);
        setRoutes(cachedRoutes);
      }
      
      // 2. Fetch real routes from API
      try {
        const response = await apiService.get<{ success: boolean; routes: Route[]; totalRoutes: number }>('/api/driver/routes');
        
        if (response.success && response.routes) {
          console.log(`✅ Fetched ${response.routes.length} routes from server`);
          
          // 3. Save to cache
          await saveRoutes(response.routes);
          
          // 4. Update UI
          setRoutes(response.routes);
          setIsLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('Failed to fetch routes from API, using cached/fallback data:', apiError);
        // If we have cache, keep it; otherwise use fallback
        if (cachedRoutes && cachedRoutes.length > 0) {
          console.log('⚠️ Using cached routes due to API failure');
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to mock data if API fails or returns no data
      setRoutes([
        {
          id: 'route_001',
          status: 'planned',
          estimatedDuration: 180,
          estimatedDistance: 25.5,
          estimatedEarnings: 125.50,
          startTime: new Date().toISOString(),
          totalDistance: 25.5,
          totalWorkers: 1,
          hasCameras: false,
          drops: [
            {
              id: 'drop_001',
              deliveryAddress: '123 High Street, Glasgow, G1 1AB',
              pickupAddress: '456 Main Road, Glasgow, G2 2CD',
              customerName: 'John Smith',
              timeWindowStart: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
              timeWindowEnd: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
              serviceTier: 'standard',
              specialInstructions: 'Ring doorbell twice',
            },
            {
              id: 'drop_002',
              deliveryAddress: '789 Park Avenue, Glasgow, G3 3EF',
              pickupAddress: '456 Main Road, Glasgow, G2 2CD',
              customerName: 'Sarah Johnson',
              timeWindowStart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              timeWindowEnd: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
              serviceTier: 'premium',
            },
            {
              id: 'drop_003',
              deliveryAddress: '321 Queen Street, Glasgow, G4 4GH',
              pickupAddress: '456 Main Road, Glasgow, G2 2CD',
              customerName: 'Mike Brown',
              timeWindowStart: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
              timeWindowEnd: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
              serviceTier: 'standard',
              specialInstructions: 'Leave at reception',
            },
            {
              id: 'drop_004',
              deliveryAddress: '654 King Road, Glasgow, G5 5IJ',
              pickupAddress: '456 Main Road, Glasgow, G2 2CD',
              customerName: 'Emma Wilson',
              timeWindowStart: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
              timeWindowEnd: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
              serviceTier: 'standard',
            },
            {
              id: 'drop_005',
              deliveryAddress: '987 Victoria Street, Glasgow, G6 6KL',
              pickupAddress: '456 Main Road, Glasgow, G2 2CD',
              customerName: 'David Lee',
              timeWindowStart: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
              timeWindowEnd: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
              serviceTier: 'economy',
            },
          ],
        },
        {
          id: 'route_002',
          status: 'assigned',
          estimatedDuration: 240,
          estimatedDistance: 35.2,
          estimatedEarnings: 185.75,
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          totalDistance: 35.2,
          totalWorkers: 2,
          hasCameras: true,
          drops: [
            {
              id: 'drop_006',
              deliveryAddress: '111 Commerce Street, Edinburgh, EH1 1MN',
              pickupAddress: '222 Trade Road, Edinburgh, EH2 2OP',
              customerName: 'Robert Taylor',
              timeWindowStart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              timeWindowEnd: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
              status: 'assigned',
              serviceTier: 'premium',
              specialInstructions: 'Fragile items - handle with care',
            },
            {
              id: 'drop_007',
              deliveryAddress: '333 Business Park, Edinburgh, EH3 3QR',
              pickupAddress: '222 Trade Road, Edinburgh, EH2 2OP',
              customerName: 'Lisa Anderson',
              timeWindowStart: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
              timeWindowEnd: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
              status: 'assigned',
              serviceTier: 'premium',
            },
            {
              id: 'drop_008',
              deliveryAddress: '444 Industrial Estate, Edinburgh, EH4 4ST',
              pickupAddress: '222 Trade Road, Edinburgh, EH2 2OP',
              customerName: 'James Martin',
              timeWindowStart: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
              timeWindowEnd: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
              status: 'assigned',
              serviceTier: 'standard',
            },
          ],
        },
      ]);
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to load routes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Refresh routes when screen comes into focus (e.g., when navigating from Dashboard after route match)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 RoutesScreen focused - refreshing data');
      fetchRoutes();
    }, [])
  );

  // ✅ Listen to Pusher events for real-time route updates
  useEffect(() => {
    console.log('👂 Setting up Pusher listeners for routes...');
    
    // Event 1: Route removed (with earnings data)
    pusherService.addEventListener('route-removed', (data: any) => {
      console.log('🚫 Route removed event:', data);
      
      // Show earnings info if available
      if (data.earningsData) {
        const earned = data.earningsData.adjustedAmountPence / 100;
        Alert.alert(
          'Route Cancelled',
          `You earned £${earned.toFixed(2)} for ${data.completedDrops} completed drops out of ${data.totalDrops} total drops.`
        );
      }
      
      // Remove route from list
      setRoutes(prevRoutes => prevRoutes.filter(r => r.id !== data.routeId));
    });
    
    // Event 2: Route offer (new route assigned)
    pusherService.addEventListener('route-offer', (data: any) => {
      console.log('🛣️ Route offer event:', data);
      // Refresh routes list
      fetchRoutes();
    });
    
    // Event 3: Acceptance rate updated
    pusherService.addEventListener('acceptance-rate-updated', (data: any) => {
      console.log('📉 Acceptance rate updated:', data);
      // Will be handled by store
    });
    
    // Event 4: Schedule updated
    pusherService.addEventListener('schedule-updated', (data: any) => {
      console.log('📅 Schedule updated:', data);
      if (data.type === 'route_removed') {
        setRoutes(prevRoutes => prevRoutes.filter(r => r.id !== data.routeId));
      }
    });
    
    // Cleanup
    return () => {
      console.log('🧹 Cleaning up Pusher listeners for routes');
      pusherService.removeEventListener('route-removed');
      pusherService.removeEventListener('route-offer');
      pusherService.removeEventListener('acceptance-rate-updated');
      pusherService.removeEventListener('schedule-updated');
    };
  }, []);

  const handleAcceptRoute = async (routeId: string) => {
    Alert.alert(
      'Accept Route',
      'Are you sure you want to accept this full route? All stops will be assigned to you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setIsLoading(true);
              console.log(`✅ Accepting route ${routeId}...`);
              
              // Call backend API
              const response = await apiService.post(`/api/driver/routes/${routeId}/accept`, {}) as any;
              
              if (response?.success || response?.data?.success) {
                // ✅ Save job state
                await saveJobState(routeId, 'accepted');
                
                // Update local state
                const updatedRoutes = routes.map(route =>
                  route.id === routeId
                    ? { ...route, status: 'assigned' as const }
                    : route
                );
                setRoutes(updatedRoutes);
                
                // ✅ Save to cache
                await saveRoutes(updatedRoutes);
                
                console.log('✅ Route accepted and saved to cache');
                Alert.alert('Success', 'Route accepted! You can start when ready.');
              } else {
                throw new Error(response?.error || response?.data?.error || 'Failed to accept route');
              }
            } catch (error: any) {
              console.error('❌ Error accepting route:', error);
              Alert.alert('Error', error.message || 'Could not accept route. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // ✅ Real decline route handler - WITH ACCEPTANCE RATE & EARNINGS
  const handleDeclineRoute = (routeId: string) => {
    Alert.alert(
      'Decline Route',
      '⚠️ Declining will reduce your acceptance rate by 5%. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              console.log(`🚫 Declining route ${routeId}...`);
              
              const response = await apiService.post(
                `/api/driver/routes/${routeId}/decline`, 
                { reason: 'Driver declined' }
              ) as any;
              
              if (response?.data?.success) {
                // ✅ Save job state
                await saveJobState(routeId, 'declined');
                
                // ✅ INSTANT REMOVAL from UI
                const updatedRoutes = routes.filter(route => route.id !== routeId);
                setRoutes(updatedRoutes);
                
                // ✅ Save to cache
                await saveRoutes(updatedRoutes);
                
                // ✅ Update acceptance rate via store
                const { setAcceptanceRate } = useDriverStore.getState();
                const newRate = response.data.acceptanceRate || response.data.data?.acceptanceRate;
                const change = response.data.change || response.data.data?.change;
                
                if (newRate !== undefined) {
                  setAcceptanceRate(newRate);
                  console.log(`✅ Route declined and removed from cache. Acceptance rate: ${newRate}%`);
                  
                  Alert.alert(
                    'Route Declined',
                    `The route has been removed and will be reassigned to other drivers.\n\nAcceptance Rate: ${newRate}% (${change || -5}%)`
                  );
                } else {
                  Alert.alert('Route Declined', 'The route has been removed from your list.');
                }
              } else {
                throw new Error(response?.data?.message || 'Failed to decline route');
              }
            } catch (error: any) {
              console.error('❌ Error declining route:', error);
              Alert.alert('Error', error.message || 'Could not decline route. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleStartRoute = (routeId: string) => {
    Alert.alert(
      'Start Route',
      'Ready to start this route? Make sure you have loaded all items.',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Start Now',
          onPress: () => {
            setRoutes(prevRoutes =>
              prevRoutes.map(route =>
                route.id === routeId
                  ? { 
                      ...route, 
                      status: 'in_progress' as const,
                      drops: route.drops.map((drop, index) => 
                        index === 0 ? { ...drop, status: 'in_progress' as const } : drop
                      )
                    }
                  : route
              )
            );
            Alert.alert('Route Started', 'Good luck! Navigate to your first stop.');
          },
        },
      ]
    );
  };

  const handleCompleteDrop = (dropId: string) => {
    setRoutes(prevRoutes =>
      prevRoutes.map(route => ({
        ...route,
        drops: route.drops.map(drop =>
          drop.id === dropId
            ? { ...drop, status: 'completed' as const }
            : drop.status === 'in_progress' && route.drops.findIndex(d => d.id === dropId) < route.drops.findIndex(d => d.id === drop.id)
            ? { ...drop, status: 'in_progress' as const }
            : drop
        )
      }))
    );
    
    Alert.alert('Drop Completed', 'Great job! Moving to next stop.');
  };

  const handleFailDrop = (dropId: string, reason: string) => {
    setRoutes(prevRoutes =>
      prevRoutes.map(route => ({
        ...route,
        drops: route.drops.map(drop =>
          drop.id === dropId
            ? { ...drop, status: 'failed' as const }
            : drop
        )
      }))
    );
    
    Alert.alert('Drop Failed', `Issue reported: ${reason}`);
  };

  const handleCompleteRoute = () => {
    Alert.alert(
      'Complete Route',
      'Mark this entire route as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Route',
          onPress: () => {
            setRoutes(prevRoutes =>
              prevRoutes.map(route => ({ ...route, status: 'completed' as const }))
            );
            Alert.alert('Route Completed', 'Excellent work! Route completed successfully.');
          },
        },
      ]
    );
  };

  const handleNavigateToDrop = async (drop: Drop) => {
    // Update the drop status to in_progress
    setRoutes(prevRoutes =>
      prevRoutes.map(route => ({
        ...route,
        drops: route.drops.map(d =>
          d.id === drop.id ? { ...d, status: 'in_progress' as const } : d
        )
      }))
    );
    
    // Open real navigation in Google Maps / Apple Maps
    const navigationOpened = await openMapsNavigation(
      drop.deliveryAddress,
      drop.customerName
    );
    
    if (navigationOpened) {
      // Show a quick confirmation that navigation started
      Alert.alert(
        'Navigation Started',
        `Opening maps to navigate to ${drop.customerName}`,
        [{ text: 'OK' }],
        { cancelable: true }
      );
    }
  };

  const handleBackToRoutes = () => {
    // This will automatically return to the routes list view
    // The activeRoute check will return false, showing the list again
  };

  const handleViewDetails = (route: Route) => {
    const dropsList = route.drops.map((drop, index) => 
      `${index + 1}. ${drop.customerName}\n   ${drop.deliveryAddress.split(',')[0]}`
    ).join('\n\n');

    Alert.alert(
      `Route ${route.reference || '#' + route.id.slice(-3)} - ${route.drops.length} Stops`,
      `Total: £${route.estimatedEarnings.toFixed(2)}\nDistance: ${route.totalDistance || route.estimatedDistance} miles\nTime: ${Math.floor(route.estimatedDuration / 60)}h ${route.estimatedDuration % 60}m\nWorkers: ${route.totalWorkers || 1}\n${route.hasCameras ? '📹 Cameras Required\n' : ''}\n\nStops:\n${dropsList}`,
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (status: Route['status']) => {
    switch (status) {
      case 'planned': return '#3B82F6';
      case 'assigned': return '#F59E0B';
      case 'in_progress': return '#10B981';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: Route['status']) => {
    switch (status) {
      case 'planned': return 'NEW';
      case 'assigned': return 'ASSIGNED';
      case 'in_progress': return 'ACTIVE';
      case 'completed': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      default: return String(status).toUpperCase();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filteredRoutes = routes.filter(route => 
    activeFilter === 'all' || route.status === activeFilter
  );

  // Find active route (in_progress)
  const activeRoute = routes.find(route => route.status === 'in_progress');

  // If there's an active route, show the progress view
  if (activeRoute) {
    return (
      <RouteProgressView
        route={activeRoute}
        onCompleteDrop={handleCompleteDrop}
        onFailDrop={handleFailDrop}
        onCompleteRoute={handleCompleteRoute}
        onNavigateToDrop={handleNavigateToDrop}
        onBackToRoutes={handleBackToRoutes}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter(filter.key as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Routes List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchRoutes} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
          </View>
        ) : filteredRoutes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="git-network" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No routes available</Text>
            <Text style={styles.emptySubtext}>
              New routes will appear here when available
            </Text>
          </View>
        ) : (
          filteredRoutes.map(route => (
            <View key={route.id} style={styles.routeCard}>
              {/* Header */}
              <View style={styles.routeHeader}>
                <View style={styles.routeHeaderLeft}>
                  <Ionicons name="git-network" size={24} color="#3B82F6" />
                  <View style={styles.routeHeaderText}>
                    <Text style={styles.routeTitle}>
                      {route.drops.length} Stops Route
                    </Text>
                    <Text style={styles.routeId}>{route.reference || '#' + route.id.slice(-8)}</Text>
                  </View>
                </View>
                <View style={styles.routeHeaderRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(route.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusLabel(route.status).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.earnings}>
                    £{route.estimatedEarnings.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Route Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.statLabel}>Distance:</Text>
                  <Text style={styles.statValue}>
                    {(route.totalDistance || route.estimatedDistance).toFixed(1)} miles
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.statLabel}>Time:</Text>
                  <Text style={styles.statValue}>
                    {formatDuration(route.estimatedDuration)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color="#6B7280" />
                  <Text style={styles.statLabel}>Workers:</Text>
                  <Text style={styles.statValue}>{route.totalWorkers || 1}</Text>
                </View>

                {route.hasCameras && (
                  <View style={styles.camerasBadge}>
                    <Text style={styles.camerasText}>📹 Cameras Required</Text>
                  </View>
                )}
              </View>

              {/* Preview Drops */}
              <View style={styles.dropsPreview}>
                <Text style={styles.dropsTitle}>Stops Preview:</Text>
                {route.drops.slice(0, 3).map((drop, index) => (
                  <View key={drop.id} style={styles.dropItem}>
                    <View style={styles.dropNumber}>
                      <Text style={styles.dropNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.dropInfo}>
                      <Text style={styles.dropAddress}>
                        {drop.deliveryAddress.split(',')[0]}
                      </Text>
                      <Text style={styles.dropTime}>
                        {formatTime(drop.timeWindowStart)} - {formatTime(drop.timeWindowEnd)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.tierBadge,
                        drop.serviceTier === 'premium' && styles.tierBadgePremium,
                      ]}
                    >
                      <Text style={styles.tierText}>{drop.serviceTier}</Text>
                    </View>
                  </View>
                ))}
                {route.drops.length > 3 && (
                  <Text style={styles.moreDrops}>
                    +{route.drops.length - 3} more stops...
                  </Text>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {route.status === 'planned' && (
                  <>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptRoute(route.id)}
                    >
                      <Text style={styles.acceptButtonText}>✅ Accept Route</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => handleDeclineRoute(route.id)}
                    >
                      <Text style={styles.declineButtonText}>❌ Decline</Text>
                    </TouchableOpacity>
                    <Text style={styles.warningText}>
                      ⚠️ Declining will affect your acceptance rate
                    </Text>
                  </>
                )}

                {route.status === 'assigned' && (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartRoute(route.id)}
                  >
                    <Ionicons name="play" size={20} color="#FFFFFF" />
                    <Text style={styles.startButtonText}>Start Route</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => handleViewDetails(route)}
                >
                  <Text style={styles.detailsButtonText}>👁️ View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1E40AF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeHeaderText: {
    marginLeft: 12,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  routeId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  routeHeaderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  earnings: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 4,
  },
  camerasBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  camerasText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  dropsPreview: {
    marginBottom: 16,
  },
  dropsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  dropInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dropAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  dropTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#DBEAFE',
  },
  tierBadgePremium: {
    backgroundColor: '#F3E8FF',
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E40AF',
  },
  moreDrops: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  actions: {
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  declineButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailsButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

