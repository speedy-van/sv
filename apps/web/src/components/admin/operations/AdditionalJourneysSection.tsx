'use client';

import React, { useEffect } from 'react';
import { Box, VStack, Text, HStack, Badge, Alert, AlertIcon } from '@chakra-ui/react';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';

interface AdditionalJourneysSectionProps {
  onCountChange?: (count: number) => void;
  declinedNotifications?: string[];
  acceptedNotifications?: string[];
  inProgressNotifications?: string[];
}

/**
 * Additional Journeys Section
 * 
 * Displays bookings that have return journeys or additional journeys.
 * This section automatically filters to show only bookings with:
 * - Return journeys (segmentType: 'return')
 * - Additional journeys (segmentType: 'additional')
 * - Main booking with its additional journeys grouped together
 */
export default function AdditionalJourneysSection({ 
  onCountChange, 
  declinedNotifications,
  acceptedNotifications,
  inProgressNotifications 
}: AdditionalJourneysSectionProps) {
  return (
    <Box>
      <VStack align="stretch" spacing={4} mb={4}>
        <Alert status="info" variant="subtle" colorScheme="cyan" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1} flex={1}>
            <Text fontSize="sm" fontWeight="bold">
              Additional Journeys Section
            </Text>
            <Text fontSize="xs" opacity={0.9}>
              This section shows all bookings that include return journeys or additional journeys. 
              Each booking displays the main journey along with all additional journey segments.
            </Text>
          </VStack>
        </Alert>
      </VStack>
      
      <OrdersTable 
        embedded
        filterAdditionalJourneys={true}
        declinedNotifications={declinedNotifications}
        acceptedNotifications={acceptedNotifications}
        inProgressNotifications={inProgressNotifications}
      />
    </Box>
  );
}

