'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Tooltip,
  useColorModeValue,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiPackage,
  FiTruck,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';

interface QuickStatsWidgetProps {
  period?: 'today' | 'week' | 'month';
  compact?: boolean;
}

interface QuickStats {
  totalRevenue: number;
  totalOrders: number;
  activeRoutes: number;
  pendingOrders: number;
  revenueChange: number;
  ordersChange: number;
  loading?: boolean;
}

export function QuickStatsWidget({ period = 'today', compact = false }: QuickStatsWidgetProps) {
  const [stats, setStats] = useState<QuickStats>({
    totalRevenue: 0,
    totalOrders: 0,
    activeRoutes: 0,
    pendingOrders: 0,
    revenueChange: 0,
    ordersChange: 0,
    loading: true,
  });

  const cardBg = useColorModeValue('#111111', '#111111');
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [period]);

  const loadStats = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const [operationalRes, routesRes] = await Promise.all([
        fetch(`/api/analytics/operational?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`/api/admin/routes?status=in_progress`),
      ]);

      let totalRevenue = 0;
      let totalOrders = 0;
      let revenueChange = 0;
      let ordersChange = 0;

      if (operationalRes.ok) {
        const data = await operationalRes.json();
        if (data.success) {
          totalRevenue = data.data.totalRevenue || 0;
          totalOrders = data.data.totalBookings || 0;
          
          // Calculate change (mock for now, should compare with previous period)
          revenueChange = Math.random() * 20 - 10; // -10% to +10%
          ordersChange = Math.random() * 15 - 7.5; // -7.5% to +7.5%
        }
      }

      let activeRoutes = 0;
      if (routesRes.ok) {
        const routesData = await routesRes.json();
        activeRoutes = routesData.routes?.length || 0;
      }

      // Get pending orders count
      const ordersRes = await fetch('/api/admin/orders?status=pending&limit=1');
      let pendingOrders = 0;
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        pendingOrders = ordersData.total || 0;
      }

      setStats({
        totalRevenue,
        totalOrders,
        activeRoutes,
        pendingOrders,
        revenueChange,
        ordersChange,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  if (compact) {
    return (
      <HStack spacing={4} p={3} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
        {stats.loading ? (
          <>
            <Skeleton height="20px" width="80px" />
            <Skeleton height="20px" width="80px" />
            <Skeleton height="20px" width="80px" />
            <Skeleton height="20px" width="80px" />
          </>
        ) : (
          <>
            <Tooltip label={`Revenue (${period})`}>
              <HStack spacing={1}>
                <Icon as={FiDollarSign} color="#10b981" boxSize={4} />
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  {formatCurrency(stats.totalRevenue)}
                </Text>
                {stats.revenueChange !== 0 && (
                  <Icon
                    as={stats.revenueChange > 0 ? FiTrendingUp : FiTrendingDown}
                    color={stats.revenueChange > 0 ? '#10b981' : '#ef4444'}
                    boxSize={3}
                  />
                )}
              </HStack>
            </Tooltip>
            <Tooltip label={`Orders (${period})`}>
              <HStack spacing={1}>
                <Icon as={FiPackage} color="#2563eb" boxSize={4} />
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  {stats.totalOrders}
                </Text>
                {stats.ordersChange !== 0 && (
                  <Icon
                    as={stats.ordersChange > 0 ? FiTrendingUp : FiTrendingDown}
                    color={stats.ordersChange > 0 ? '#10b981' : '#ef4444'}
                    boxSize={3}
                  />
                )}
              </HStack>
            </Tooltip>
            <Tooltip label="Active Routes">
              <HStack spacing={1}>
                <Icon as={FiTruck} color="#9333ea" boxSize={4} />
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  {stats.activeRoutes}
                </Text>
              </HStack>
            </Tooltip>
            <Tooltip label="Pending Orders">
              <HStack spacing={1}>
                <Icon as={FiClock} color="#f59e0b" boxSize={4} />
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  {stats.pendingOrders}
                </Text>
              </HStack>
            </Tooltip>
          </>
        )}
      </HStack>
    );
  }

  return (
    <HStack spacing={4} align="stretch">
      {stats.loading ? (
        <>
          <Box flex={1} p={4} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <SkeletonText noOfLines={2} />
          </Box>
          <Box flex={1} p={4} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <SkeletonText noOfLines={2} />
          </Box>
          <Box flex={1} p={4} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <SkeletonText noOfLines={2} />
          </Box>
          <Box flex={1} p={4} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <SkeletonText noOfLines={2} />
          </Box>
        </>
      ) : (
        <>
          <Box flex={1} p={4} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <VStack align="start" spacing={1}>
              <HStack spacing={2}>
                <Icon as={FiDollarSign} color="#10b981" boxSize={5} />
                <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase">
                  Revenue ({period})
                </Text>
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {formatCurrency(stats.totalRevenue)}
              </Text>
              {stats.revenueChange !== 0 && (
                <HStack spacing={1}>
                  <Icon
                    as={stats.revenueChange > 0 ? FiTrendingUp : FiTrendingDown}
                    color={stats.revenueChange > 0 ? '#10b981' : '#ef4444'}
                    boxSize={3}
                  />
                  <Text fontSize="xs" color={stats.revenueChange > 0 ? '#10b981' : '#ef4444'}>
                    {Math.abs(stats.revenueChange).toFixed(1)}%
                  </Text>
                </HStack>
              )}
            </VStack>
          </Box>

          <Box flex={1} p={4} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <VStack align="start" spacing={1}>
              <HStack spacing={2}>
                <Icon as={FiPackage} color="#2563eb" boxSize={5} />
                <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase">
                  Orders ({period})
                </Text>
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {stats.totalOrders}
              </Text>
              {stats.ordersChange !== 0 && (
                <HStack spacing={1}>
                  <Icon
                    as={stats.ordersChange > 0 ? FiTrendingUp : FiTrendingDown}
                    color={stats.ordersChange > 0 ? '#10b981' : '#ef4444'}
                    boxSize={3}
                  />
                  <Text fontSize="xs" color={stats.ordersChange > 0 ? '#10b981' : '#ef4444'}>
                    {Math.abs(stats.ordersChange).toFixed(1)}%
                  </Text>
                </HStack>
              )}
            </VStack>
          </Box>

          <Box flex={1} p={4} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <VStack align="start" spacing={1}>
              <HStack spacing={2}>
                <Icon as={FiTruck} color="#9333ea" boxSize={5} />
                <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase">
                  Active Routes
                </Text>
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {stats.activeRoutes}
              </Text>
            </VStack>
          </Box>

          <Box flex={1} p={4} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <VStack align="start" spacing={1}>
              <HStack spacing={2}>
                <Icon as={FiClock} color="#f59e0b" boxSize={5} />
                <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase">
                  Pending Orders
                </Text>
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {stats.pendingOrders}
              </Text>
            </VStack>
          </Box>
        </>
      )}
    </HStack>
  );
}

