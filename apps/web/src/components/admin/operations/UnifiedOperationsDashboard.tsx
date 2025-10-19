'use client';

import React, { useState } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  HStack,
  Badge,
  Icon,
  VStack,
  Text,
} from '@chakra-ui/react';
import { FaClipboardList, FaRoute, FaTruck } from 'react-icons/fa';
import SingleOrdersSection from './SingleOrdersSection';
import MultiDropRoutesSection from './MultiDropRoutesSection';

/**
 * Unified Operations Dashboard
 * 
 * Combines Orders and Routes management into a single interface
 * with tabbed navigation for easy switching between:
 * - Single Orders: Individual delivery management
 * - Multi-Drop Routes: Route creation and optimization
 */
export default function UnifiedOperationsDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [routesCount, setRoutesCount] = useState(0);

  return (
    <Box>
      {/* Header */}
      <VStack align="start" spacing={2} mb={6}>
        <Heading size="lg" color="white">
          Operations Management
        </Heading>
        <Text color="gray.400" fontSize="sm">
          Manage single orders and multi-drop routes with full control
        </Text>
      </VStack>

      {/* Tabbed Interface */}
      <Tabs
        index={activeTab}
        onChange={setActiveTab}
        variant="enclosed"
        colorScheme="blue"
        isLazy
      >
        <TabList bg="gray.800" borderColor="gray.700" borderRadius="md" p={2}>
          <Tab
            _selected={{
              bg: 'blue.600',
              color: 'white',
              borderColor: 'blue.600',
            }}
            _hover={{ bg: 'gray.700' }}
            color="gray.300"
            fontWeight="medium"
          >
            <HStack spacing={2}>
              <Icon as={FaClipboardList} />
              <Text>Single Orders</Text>
              {ordersCount > 0 && (
                <Badge colorScheme="blue" borderRadius="full">
                  {ordersCount}
                </Badge>
              )}
            </HStack>
          </Tab>

          <Tab
            _selected={{
              bg: 'blue.600',
              color: 'white',
              borderColor: 'blue.600',
            }}
            _hover={{ bg: 'gray.700' }}
            color="gray.300"
            fontWeight="medium"
          >
            <HStack spacing={2}>
              <Icon as={FaRoute} />
              <Text>Multi-Drop Routes</Text>
              {routesCount > 0 && (
                <Badge colorScheme="green" borderRadius="full">
                  {routesCount}
                </Badge>
              )}
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Single Orders Tab */}
          <TabPanel p={0} pt={6}>
            <SingleOrdersSection onCountChange={setOrdersCount} />
          </TabPanel>

          {/* Multi-Drop Routes Tab */}
          <TabPanel p={0} pt={6}>
            <MultiDropRoutesSection onCountChange={setRoutesCount} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

