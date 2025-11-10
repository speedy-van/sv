'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  Icon,
  Progress,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiTruck,
  FiPackage,
  FiDollarSign,
  FiAlertCircle,
  FiTrendingUp,
  FiClock,
  FiMapPin,
} from 'react-icons/fi';

interface SystemStats {
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  completedToday: number;
  activeDrivers: number;
  totalDrivers: number;
  todayRevenue: number;
  utilizationRate: number;
  alerts: Alert[];
  recentActivity: Activity[];
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

interface Activity {
  id: string;
  type: 'booking' | 'driver' | 'payment';
  description: string;
  timestamp: Date;
}

export const LiveStatusDashboard: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch live stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/ai/live-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch live stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (isOpen) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <Box
        position="fixed"
        right={0}
        top="60px"
        bottom={0}
        width="320px"
        bg="#1a1a1a"
        borderLeft="1px solid #333"
        p={4}
        overflowY="auto"
        zIndex={1000}
      >
        <VStack spacing={4} align="center" justify="center" height="100%">
          <Spinner size="lg" color="#10b981" />
          <Text color="#9ca3af">Loading live stats...</Text>
        </VStack>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box
        position="fixed"
        right={0}
        top="60px"
        bottom={0}
        width="320px"
        bg="#1a1a1a"
        borderLeft="1px solid #333"
        p={4}
        zIndex={1000}
      >
        <Text color="#ef4444">Failed to load stats</Text>
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      right={0}
      top="60px"
      bottom={0}
      width="320px"
      bg="#1a1a1a"
      borderLeft="1px solid #333"
      overflowY="auto"
      zIndex={1000}
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#0a0a0a',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#333',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#444',
        },
      }}
    >
      <VStack spacing={4} p={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold" color="#ECECF1">
            Live Status
          </Text>
          <Tooltip label={`Last updated: ${lastUpdate.toLocaleTimeString()}`}>
            <Badge colorScheme="green" fontSize="xs">
              LIVE
            </Badge>
          </Tooltip>
        </HStack>

        <Divider borderColor="#333" />

        {/* Bookings Overview */}
        <Box bg="#0a0a0a" p={3} borderRadius="md" border="1px solid #333">
          <HStack mb={2}>
            <Icon as={FiPackage} color="#10b981" />
            <Text fontSize="sm" fontWeight="bold" color="#ECECF1">
              Bookings
            </Text>
          </HStack>
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="xs" color="#9ca3af">
                Total Today
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="#ECECF1">
                {stats.totalBookings}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color="#9ca3af">
                Pending
              </Text>
              <Badge colorScheme="yellow" fontSize="xs">
                {stats.pendingBookings}
              </Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color="#9ca3af">
                Active
              </Text>
              <Badge colorScheme="blue" fontSize="xs">
                {stats.activeBookings}
              </Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color="#9ca3af">
                Completed
              </Text>
              <Badge colorScheme="green" fontSize="xs">
                {stats.completedToday}
              </Badge>
            </HStack>
          </VStack>
        </Box>

        {/* Drivers Overview */}
        <Box bg="#0a0a0a" p={3} borderRadius="md" border="1px solid #333">
          <HStack mb={2}>
            <Icon as={FiTruck} color="#3b82f6" />
            <Text fontSize="sm" fontWeight="bold" color="#ECECF1">
              Drivers
            </Text>
          </HStack>
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="xs" color="#9ca3af">
                Active / Total
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="#ECECF1">
                {stats.activeDrivers} / {stats.totalDrivers}
              </Text>
            </HStack>
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="#9ca3af">
                  Utilization
                </Text>
                <Text fontSize="xs" fontWeight="bold" color="#ECECF1">
                  {stats.utilizationRate.toFixed(0)}%
                </Text>
              </HStack>
              <Progress
                value={stats.utilizationRate}
                size="sm"
                colorScheme={stats.utilizationRate > 70 ? 'green' : stats.utilizationRate > 40 ? 'yellow' : 'red'}
                borderRadius="full"
              />
            </Box>
          </VStack>
        </Box>

        {/* Revenue Overview */}
        <Box bg="#0a0a0a" p={3} borderRadius="md" border="1px solid #333">
          <HStack mb={2}>
            <Icon as={FiDollarSign} color="#10b981" />
            <Text fontSize="sm" fontWeight="bold" color="#ECECF1">
              Revenue
            </Text>
          </HStack>
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="xs" color="#9ca3af">
                Today
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="#10b981">
                £{stats.todayRevenue.toFixed(2)}
              </Text>
            </HStack>
            <HStack>
              <Icon as={FiTrendingUp} color="#10b981" boxSize={3} />
              <Text fontSize="xs" color="#10b981">
                +12% vs yesterday
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Alerts */}
        {stats.alerts.length > 0 && (
          <>
            <Divider borderColor="#333" />
            <Box>
              <HStack mb={2}>
                <Icon as={FiAlertCircle} color="#ef4444" />
                <Text fontSize="sm" fontWeight="bold" color="#ECECF1">
                  Alerts
                </Text>
                <Badge colorScheme="red" fontSize="xs">
                  {stats.alerts.length}
                </Badge>
              </HStack>
              <VStack spacing={2} align="stretch">
                {stats.alerts.map((alert) => (
                  <Box
                    key={alert.id}
                    bg={
                      alert.type === 'error'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : alert.type === 'warning'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(59, 130, 246, 0.1)'
                    }
                    p={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={
                      alert.type === 'error'
                        ? '#ef4444'
                        : alert.type === 'warning'
                        ? '#f59e0b'
                        : '#3b82f6'
                    }
                  >
                    <Text fontSize="xs" color="#ECECF1">
                      {alert.message}
                    </Text>
                    <Text fontSize="xs" color="#6b7280" mt={1}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          </>
        )}

        {/* Recent Activity */}
        <Divider borderColor="#333" />
        <Box>
          <HStack mb={2}>
            <Icon as={FiClock} color="#9ca3af" />
            <Text fontSize="sm" fontWeight="bold" color="#ECECF1">
              Recent Activity
            </Text>
          </HStack>
          <VStack spacing={2} align="stretch">
            {stats.recentActivity.slice(0, 5).map((activity) => (
              <HStack key={activity.id} spacing={2}>
                <Icon
                  as={
                    activity.type === 'booking'
                      ? FiPackage
                      : activity.type === 'driver'
                      ? FiTruck
                      : FiDollarSign
                  }
                  color="#6b7280"
                  boxSize={3}
                />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="xs" color="#ECECF1" noOfLines={2}>
                    {activity.description}
                  </Text>
                  <Text fontSize="xs" color="#6b7280">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* Footer */}
        <Divider borderColor="#333" />
        <Text fontSize="xs" color="#6b7280" textAlign="center">
          Auto-refreshes every 30 seconds
        </Text>
      </VStack>
    </Box>
  );
};
