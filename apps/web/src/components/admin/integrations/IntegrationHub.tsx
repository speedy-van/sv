'use client';

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Icon,
  Button,
  Switch,
  useColorModeValue,
  SimpleGrid,
  Alert,
  AlertIcon,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiLink,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiMail,
  FiMessageSquare,
  FiCreditCard,
  FiMap,
  FiBarChart2,
} from 'react-icons/fi';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'payment' | 'mapping' | 'analytics' | 'other';
  icon: any;
  enabled: boolean;
  configured: boolean;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  settingsUrl?: string;
}

export function IntegrationHub() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'email',
      name: 'Email Service',
      description: 'Send automated emails to customers and drivers',
      category: 'communication',
      icon: FiMail,
      enabled: true,
      configured: true,
      status: 'connected',
      lastSync: new Date().toISOString(),
    },
    {
      id: 'sms',
      name: 'SMS Gateway',
      description: 'Send SMS notifications via Twilio or similar',
      category: 'communication',
      icon: FiMessageSquare,
      enabled: false,
      configured: false,
      status: 'disconnected',
    },
    {
      id: 'stripe',
      name: 'Stripe Payments',
      description: 'Process payments and manage subscriptions',
      category: 'payment',
      icon: FiCreditCard,
      enabled: true,
      configured: true,
      status: 'connected',
      lastSync: new Date().toISOString(),
    },
    {
      id: 'mapbox',
      name: 'Mapbox',
      description: 'Maps, geocoding, and route optimization',
      category: 'mapping',
      icon: FiMap,
      enabled: true,
      configured: true,
      status: 'connected',
      lastSync: new Date().toISOString(),
    },
    {
      id: 'analytics',
      name: 'Google Analytics',
      description: 'Track user behavior and conversion metrics',
      category: 'analytics',
      icon: FiBarChart2,
      enabled: false,
      configured: false,
      status: 'disconnected',
    },
  ]);

  const cardBg = useColorModeValue('#121A2B', '#121A2B');
  const textColor = useColorModeValue('#F5F8FF', '#F5F8FF');
  const borderColor = useColorModeValue('#2A3A5E', '#2A3A5E');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  const handleToggle = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    );
  };

  const getCategoryColor = (category: Integration['category']) => {
    const colors = {
      communication: '#2563eb',
      payment: '#10b981',
      mapping: '#9333ea',
      analytics: '#f59e0b',
      other: secondaryTextColor,
    };
    return colors[category] || secondaryTextColor;
  };

  const getStatusColor = (status: Integration['status']) => {
    const colors = {
      connected: '#10b981',
      disconnected: secondaryTextColor,
      error: '#ef4444',
    };
    return colors[status] || secondaryTextColor;
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <VStack align="stretch" spacing={6}>
      <VStack align="start" spacing={1}>
        <Text fontWeight="bold" fontSize="lg" color={textColor}>
          Integration Hub
        </Text>
        <Text fontSize="sm" color={secondaryTextColor}>
          Connect and manage third-party services
        </Text>
      </VStack>

      {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
        <Box key={category}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={secondaryTextColor}
            textTransform="uppercase"
            letterSpacing="wide"
            mb={3}
          >
            {category}
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {categoryIntegrations.map((integration) => (
              <Card
                key={integration.id}
                bg={cardBg}
                borderColor={integration.enabled ? getCategoryColor(integration.category) : borderColor}
                borderWidth={integration.enabled ? 2 : 1}
              >
                <CardHeader>
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Icon
                        as={integration.icon}
                        color={integration.enabled ? getCategoryColor(integration.category) : secondaryTextColor}
                        boxSize={6}
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" color={textColor} fontSize="sm">
                          {integration.name}
                        </Text>
                        <HStack spacing={2}>
                          <Badge
                            colorScheme={
                              integration.status === 'connected' ? 'green' :
                              integration.status === 'error' ? 'red' : 'gray'
                            }
                            size="sm"
                          >
                            {integration.status}
                          </Badge>
                          {integration.configured && (
                            <Badge colorScheme="blue" size="sm">
                              Configured
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                    <Switch
                      isChecked={integration.enabled}
                      onChange={() => handleToggle(integration.id)}
                      colorScheme="green"
                      isDisabled={!integration.configured}
                    />
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="xs" color={secondaryTextColor}>
                      {integration.description}
                    </Text>
                    {integration.lastSync && (
                      <Text fontSize="xs" color={secondaryTextColor}>
                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                      </Text>
                    )}
                    <HStack spacing={2}>
                      {integration.configured ? (
                        <Button
                          size="sm"
                          leftIcon={<FiSettings />}
                          variant="outline"
                          borderColor={borderColor}
                          color={textColor}
                          _hover={{ bg: '#18233A' }}
                          flex={1}
                        >
                          Settings
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          leftIcon={<FiLink />}
                          bg={getCategoryColor(integration.category)}
                          color="#F5F8FF"
                          _hover={{ opacity: 0.9 }}
                          flex={1}
                        >
                          Configure
                        </Button>
                      )}
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      ))}

      <Alert status="info" bg="rgba(37, 99, 235, 0.1)" borderColor="#2563eb" borderWidth={1}>
        <AlertIcon color="#2563eb" />
        <VStack align="start" spacing={1} flex={1}>
          <Text fontSize="sm" fontWeight="bold" color="#F5F8FF">
            Need More Integrations?
          </Text>
          <Text fontSize="xs" color={secondaryTextColor}>
            Contact support to request additional integrations or custom API connections.
          </Text>
        </VStack>
      </Alert>
    </VStack>
  );
}

