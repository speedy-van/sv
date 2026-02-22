'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Icon,
  Button,
  useColorModeValue,
  Progress,
  Alert,
  AlertIcon,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiInfo,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiArrowRight,
  FiDollarSign,
  FiClock,
  FiUsers,
} from 'react-icons/fi';

interface Suggestion {
  id: string;
  type: 'optimization' | 'warning' | 'opportunity' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact?: string;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  estimatedSavings?: number;
  estimatedTime?: number;
}

interface SmartSuggestionsPanelProps {
  onDismiss?: (suggestionId: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function SmartSuggestionsPanel({
  onDismiss,
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
}: SmartSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const cardBg = useColorModeValue('#121A2B', '#121A2B');
  const textColor = useColorModeValue('#F5F8FF', '#F5F8FF');
  const borderColor = useColorModeValue('#2A3A5E', '#2A3A5E');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  useEffect(() => {
    loadSuggestions();
    if (autoRefresh) {
      const interval = setInterval(loadSuggestions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadSuggestions = async () => {
    try {
      // Fetch analytics data to generate suggestions
      const [ordersRes, routesRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/orders?status=pending&limit=100'),
        fetch('/api/admin/routes?status=in_progress'),
        fetch('/api/admin/analytics/performance?period=7'),
      ]);

      const newSuggestions: Suggestion[] = [];

      // Analyze pending orders
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const pendingCount = ordersData.orders?.filter((o: any) => o.status === 'pending').length || 0;
        
        if (pendingCount > 10) {
          newSuggestions.push({
            id: 'high_pending_orders',
            type: 'warning',
            priority: 'high',
            title: 'High Number of Pending Orders',
            description: `You have ${pendingCount} pending orders. Consider assigning drivers or optimizing routes.`,
            impact: 'Customer satisfaction may be affected',
            actionLabel: 'View Pending Orders',
            actionUrl: '/admin/operations?tab=orders&filter=pending',
            estimatedTime: 15,
          });
        }
      }

      // Analyze route efficiency
      if (routesRes.ok) {
        const routesData = await routesRes.json();
        const routes = routesData.routes || [];
        
        const inefficientRoutes = routes.filter((r: any) => {
          const efficiency = r.optimizedDistanceKm && r.actualDistanceKm
            ? (r.optimizedDistanceKm / r.actualDistanceKm) * 100
            : 100;
          return efficiency < 85;
        });

        if (inefficientRoutes.length > 0) {
          newSuggestions.push({
            id: 'inefficient_routes',
            type: 'optimization',
            priority: 'medium',
            title: 'Route Optimization Opportunity',
            description: `${inefficientRoutes.length} route(s) could be optimized for better efficiency.`,
            impact: `Potential savings: £${(inefficientRoutes.length * 15).toFixed(2)} per day`,
            actionLabel: 'Optimize Routes',
            actionUrl: '/admin/operations?tab=routes',
            estimatedSavings: inefficientRoutes.length * 15,
          });
        }
      }

      // Analyze revenue opportunities
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData.success) {
          const avgOrderValue = analyticsData.data?.averageOrderValue || 0;
          
          if (avgOrderValue < 50) {
            newSuggestions.push({
              id: 'low_avg_order_value',
              type: 'opportunity',
              priority: 'medium',
              title: 'Low Average Order Value',
              description: `Current average order value is £${avgOrderValue.toFixed(2)}. Consider upselling or bundle offers.`,
              impact: 'Potential revenue increase: 15-25%',
              actionLabel: 'View Pricing Strategy',
              estimatedSavings: avgOrderValue * 0.2,
            });
          }
        }
      }

      // Add general suggestions
      newSuggestions.push({
        id: 'bulk_assign_drivers',
        type: 'optimization',
        priority: 'low',
        title: 'Bulk Driver Assignment',
        description: 'Use bulk operations to assign multiple drivers at once and save time.',
        impact: 'Time savings: ~5 minutes per batch',
        actionLabel: 'Try Bulk Operations',
        actionUrl: '/admin/operations?tab=orders',
        estimatedTime: 5,
      });

      setSuggestions(newSuggestions.filter(s => !dismissed.has(s.id)));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleDismiss = (suggestionId: string) => {
    setDismissed(prev => new Set([...prev, suggestionId]));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    if (onDismiss) {
      onDismiss(suggestionId);
    }
  };

  const getTypeIcon = (type: Suggestion['type']) => {
    const icons = {
      optimization: FiTrendingUp,
      warning: FiAlertCircle,
      opportunity: FiDollarSign,
      info: FiInfo,
    };
    return icons[type] || FiInfo;
  };

  const getTypeColor = (type: Suggestion['type']) => {
    const colors = {
      optimization: '#2563eb',
      warning: '#f59e0b',
      opportunity: '#10b981',
      info: '#06b6d4',
    };
    return colors[type] || secondaryTextColor;
  };

  const getPriorityColor = (priority: Suggestion['priority']) => {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#2563eb',
      low: secondaryTextColor,
    };
    return colors[priority] || secondaryTextColor;
  };

  const visibleSuggestions = suggestions
    .filter(s => !dismissed.has(s.id))
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  if (visibleSuggestions.length === 0) {
    return (
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <VStack spacing={2} py={4}>
            <Icon as={FiCheckCircle} color="#10b981" boxSize={8} />
            <Text color={textColor} fontWeight="bold">
              All Good!
            </Text>
            <Text fontSize="sm" color={secondaryTextColor} textAlign="center">
              No suggestions at this time. Your operations are running smoothly.
            </Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack align="stretch" spacing={3}>
      <HStack justify="space-between">
        <HStack spacing={2}>
          <Icon as={FiInfo} color="#f59e0b" boxSize={5} />
          <Text fontWeight="bold" fontSize="lg" color={textColor}>
            Smart Suggestions
          </Text>
          <Badge colorScheme="blue" size="sm">
            {visibleSuggestions.length}
          </Badge>
        </HStack>
      </HStack>

      {visibleSuggestions.map((suggestion) => (
        <Card
          key={suggestion.id}
          bg={cardBg}
          borderColor={getTypeColor(suggestion.type)}
          borderWidth={2}
          position="relative"
        >
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between" align="start">
                <HStack spacing={3} flex={1}>
                  <Icon
                    as={getTypeIcon(suggestion.type)}
                    color={getTypeColor(suggestion.type)}
                    boxSize={5}
                    mt={0.5}
                  />
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack spacing={2}>
                      <Text fontWeight="bold" color={textColor} fontSize="sm">
                        {suggestion.title}
                      </Text>
                      <Badge
                        colorScheme={
                          suggestion.priority === 'critical' ? 'red' :
                          suggestion.priority === 'high' ? 'orange' :
                          suggestion.priority === 'medium' ? 'blue' : 'gray'
                        }
                        size="sm"
                      >
                        {suggestion.priority}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color={secondaryTextColor}>
                      {suggestion.description}
                    </Text>
                    {suggestion.impact && (
                      <Text fontSize="xs" color={getTypeColor(suggestion.type)} fontWeight="medium">
                        💡 {suggestion.impact}
                      </Text>
                    )}
                  </VStack>
                </HStack>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleDismiss(suggestion.id)}
                  color={secondaryTextColor}
                  _hover={{ color: '#ef4444' }}
                >
                  <FiX />
                </Button>
              </HStack>

              {(suggestion.estimatedSavings || suggestion.estimatedTime) && (
                <HStack spacing={4} fontSize="xs" color={secondaryTextColor}>
                  {suggestion.estimatedSavings && (
                    <HStack spacing={1}>
                      <Icon as={FiDollarSign} boxSize={3} />
                      <Text>Save: £{suggestion.estimatedSavings.toFixed(2)}</Text>
                    </HStack>
                  )}
                  {suggestion.estimatedTime && (
                    <HStack spacing={1}>
                      <Icon as={FiClock} boxSize={3} />
                      <Text>Time: {suggestion.estimatedTime} min</Text>
                    </HStack>
                  )}
                </HStack>
              )}

              {suggestion.actionLabel && (
                <HStack justify="flex-end">
                  <Button
                    size="sm"
                    rightIcon={<FiArrowRight />}
                    onClick={() => {
                      if (suggestion.onAction) {
                        suggestion.onAction();
                      } else if (suggestion.actionUrl) {
                        window.location.href = suggestion.actionUrl;
                      }
                    }}
                    bg={getTypeColor(suggestion.type)}
                    color="#F5F8FF"
                    _hover={{ bg: getTypeColor(suggestion.type), opacity: 0.9 }}
                  >
                    {suggestion.actionLabel}
                  </Button>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );
}

