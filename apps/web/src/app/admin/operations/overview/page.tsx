'use client';

import React from 'react';
import { Box, Container, Heading, Text, VStack, SimpleGrid, Card, CardBody, CardHeader, Icon, HStack, Badge } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import {
  FaClipboardList,
  FaRoute,
  FaExchangeAlt,
  FaChartBar,
  FaFileAlt,
  FaHistory,
  FaLightbulb,
  FaTachometerAlt,
  FaCog,
  FaPlug,
} from 'react-icons/fa';

/**
 * Operations Overview / Landing Page
 * 
 * This is the navigation hub for all operations modules.
 * Users can access different operations features from here:
 * - Single Orders
 * - Multi-Drop Routes
 * - Additional Journeys
 * - Analytics
 * - Templates
 * - Activity Log
 * - Suggestions
 * - Performance
 * - Automation
 * - Integrations
 */
export default function OperationsOverviewPage() {
  const router = useRouter();

  const operationsModules = [
    {
      id: 'orders',
      title: 'Single Orders',
      description: 'Manage individual customer orders, assignments, and status',
      icon: FaClipboardList,
      href: '/admin/operations',
      color: 'blue',
      badge: null,
    },
    {
      id: 'routes',
      title: 'Multi-Drop Routes',
      description: 'Create and optimize multi-stop delivery routes',
      icon: FaRoute,
      href: '/admin/routes',
      color: 'green',
      badge: null,
    },
    {
      id: 'additional-journeys',
      title: 'Additional Journeys',
      description: 'Manage return journeys and additional trip segments',
      icon: FaExchangeAlt,
      href: '/admin/operations/additional-journeys',
      color: 'cyan',
      badge: null,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View operations metrics, performance, and insights',
      icon: FaChartBar,
      href: '/admin/analytics',
      color: 'purple',
      badge: null,
    },
    {
      id: 'templates',
      title: 'Templates',
      description: 'Create and manage order templates for quick booking',
      icon: FaFileAlt,
      href: '/admin/operations/templates',
      color: 'orange',
      badge: null,
    },
    {
      id: 'activity-log',
      title: 'Activity Log',
      description: 'View complete audit trail of all operations activities',
      icon: FaHistory,
      href: '/admin/operations/activity-log',
      color: 'cyan',
      badge: null,
    },
    {
      id: 'suggestions',
      title: 'Smart Suggestions',
      description: 'AI-powered recommendations for route optimization',
      icon: FaLightbulb,
      href: '/admin/operations/suggestions',
      color: 'orange',
      badge: null,
    },
    {
      id: 'performance',
      title: 'Performance Monitor',
      description: 'Real-time system performance and health monitoring',
      icon: FaTachometerAlt,
      href: '/admin/operations/performance',
      color: 'cyan',
      badge: null,
    },
    {
      id: 'automation',
      title: 'Workflow Automation',
      description: 'Configure automated workflows and triggers',
      icon: FaCog,
      href: '/admin/operations/automation',
      color: 'purple',
      badge: null,
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connect with external services and APIs',
      icon: FaPlug,
      href: '/admin/operations/integrations',
      color: 'green',
      badge: null,
    },
  ];

  return (
    <Box bg="gray.900" minH="100vh" py={8}>
      <Container maxW="container.2xl">
        <VStack align="stretch" spacing={8}>
          {/* Page Header */}
          <VStack align="start" spacing={2}>
            <Heading size="lg" color="white">
              Operations Management
            </Heading>
            <Text color="gray.400" fontSize="md">
              Choose an operations module to manage orders, routes, analytics, and more
            </Text>
          </VStack>

          {/* Operations Modules Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {operationsModules.map((module) => (
              <Card
                key={module.id}
                bg="gray.800"
                borderColor="gray.700"
                borderWidth="1px"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: 'lg',
                  borderColor: `${module.color}.500`,
                }}
                onClick={() => router.push(module.href)}
              >
                <CardHeader>
                  <HStack justify="space-between" align="start">
                    <HStack spacing={4}>
                      <Box
                        p={3}
                        borderRadius="lg"
                        bg={`${module.color}.500`}
                        color="white"
                      >
                        <Icon as={module.icon} boxSize={6} />
                      </Box>
                      <VStack align="start" spacing={1}>
                        <Heading 
                          size="md" 
                          color="white"
                          fontWeight="semibold"
                          letterSpacing="0.3px"
                        >
                          {module.title}
                        </Heading>
                        {module.badge && (
                          <Badge colorScheme={module.color} variant="solid">
                            {module.badge}
                          </Badge>
                        )}
                      </VStack>
                    </HStack>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <Text color="gray.400" fontSize="sm">
                    {module.description}
                  </Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}

