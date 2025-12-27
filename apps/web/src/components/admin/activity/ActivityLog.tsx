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
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Input,
  Button,
  Divider,
} from '@chakra-ui/react';
import {
  FiClock,
  FiUser,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiTruck,
  FiFilter,
} from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityLogEntry {
  id: string;
  type: 'create' | 'update' | 'delete' | 'status_change' | 'payment' | 'assignment';
  entity: 'order' | 'route' | 'driver' | 'customer';
  entityId: string;
  entityName: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details?: Record<string, any>;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

interface ActivityLogProps {
  entityId?: string;
  entityType?: 'order' | 'route';
  limit?: number;
  showFilters?: boolean;
}

export function ActivityLog({
  entityId,
  entityType,
  limit = 50,
  showFilters = true,
}: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLogEntry[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const cardBg = useColorModeValue('#111111', '#111111');
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  useEffect(() => {
    loadActivities();
  }, [entityId, entityType]);

  useEffect(() => {
    filterActivities();
  }, [activities, typeFilter, dateFilter, searchQuery]);

  const loadActivities = async () => {
    try {
      // In a real app, this would fetch from an API
      // For now, we'll generate mock data
      const mockActivities: ActivityLogEntry[] = Array.from({ length: 20 }, (_, i) => ({
        id: `activity_${i}`,
        type: ['create', 'update', 'status_change', 'payment', 'assignment'][i % 5] as any,
        entity: entityType || (i % 2 === 0 ? 'order' : 'route'),
        entityId: entityId || `entity_${i}`,
        entityName: entityType === 'order' ? `Order SV-${String(i + 1).padStart(6, '0')}` : `Route R-${i + 1}`,
        action: getActionText(['create', 'update', 'status_change', 'payment', 'assignment'][i % 5] as any),
        userId: `user_${i}`,
        userName: `Admin User ${i + 1}`,
        timestamp: new Date(Date.now() - i * 3600000),
        changes: i % 3 === 0 ? [
          { field: 'status', oldValue: 'pending', newValue: 'confirmed' },
        ] : undefined,
      }));

      setActivities(mockActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const getActionText = (type: ActivityLogEntry['type']) => {
    const actions = {
      create: 'created',
      update: 'updated',
      delete: 'deleted',
      status_change: 'changed status',
      payment: 'processed payment',
      assignment: 'assigned driver',
    };
    return actions[type] || 'performed action';
  };

  const filterActivities = () => {
    let filtered = [...activities];

    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === typeFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(a => a.timestamp >= filterDate);
          break;
        case 'week':
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(a => a.timestamp >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(a => a.timestamp >= filterDate);
          break;
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.entityName.toLowerCase().includes(query) ||
        a.userName.toLowerCase().includes(query) ||
        a.action.toLowerCase().includes(query)
      );
    }

    setFilteredActivities(filtered.slice(0, limit));
  };

  const getTypeIcon = (type: ActivityLogEntry['type']) => {
    const icons = {
      create: FiCheckCircle,
      update: FiEdit,
      delete: FiTrash2,
      status_change: FiClock,
      payment: FiDollarSign,
      assignment: FiTruck,
    };
    return icons[type] || FiClock;
  };

  const getTypeColor = (type: ActivityLogEntry['type']) => {
    const colors = {
      create: '#10b981',
      update: '#2563eb',
      delete: '#ef4444',
      status_change: '#f59e0b',
      payment: '#9333ea',
      assignment: '#06b6d4',
    };
    return colors[type] || secondaryTextColor;
  };

  return (
    <VStack align="stretch" spacing={4}>
      {showFilters && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                bg="#1a1a1a"
                borderColor={borderColor}
                color={textColor}
                size="sm"
                w="150px"
              >
                <option value="all">All Types</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="status_change">Status Changed</option>
                <option value="payment">Payment</option>
                <option value="assignment">Assignment</option>
              </Select>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                bg="#1a1a1a"
                borderColor={borderColor}
                color={textColor}
                size="sm"
                w="150px"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </Select>
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="#1a1a1a"
                borderColor={borderColor}
                color={textColor}
                size="sm"
                flex={1}
                maxW="300px"
              />
            </HStack>
          </CardBody>
        </Card>
      )}

      <VStack align="stretch" spacing={3}>
        {filteredActivities.length === 0 ? (
          <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <Text color={secondaryTextColor} textAlign="center" py={4}>
                No activities found
              </Text>
            </CardBody>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} bg={cardBg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <HStack align="start" spacing={4}>
                  <Icon
                    as={getTypeIcon(activity.type)}
                    color={getTypeColor(activity.type)}
                    boxSize={5}
                    mt={0.5}
                  />
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack justify="space-between" w="100%">
                      <HStack spacing={2}>
                        <Text fontWeight="bold" color={textColor} fontSize="sm">
                          {activity.userName}
                        </Text>
                        <Text color={secondaryTextColor} fontSize="sm">
                          {activity.action}
                        </Text>
                        <Badge
                          colorScheme={activity.entity === 'order' ? 'blue' : 'purple'}
                          size="sm"
                        >
                          {activity.entity}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color={secondaryTextColor}>
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color={textColor} fontWeight="medium">
                      {activity.entityName}
                    </Text>
                    {activity.changes && activity.changes.length > 0 && (
                      <VStack align="start" spacing={1} mt={2} p={2} bg="#1a1a1a" borderRadius="md" w="100%">
                        {activity.changes.map((change, idx) => (
                          <HStack key={idx} fontSize="xs" spacing={2}>
                            <Text color={secondaryTextColor}>{change.field}:</Text>
                            <Badge colorScheme="red" size="sm">
                              {String(change.oldValue)}
                            </Badge>
                            <Text color={secondaryTextColor}>→</Text>
                            <Badge colorScheme="green" size="sm">
                              {String(change.newValue)}
                            </Badge>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                    <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                      {format(activity.timestamp, 'dd MMM yyyy, HH:mm:ss')}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          ))
        )}
      </VStack>
    </VStack>
  );
}

