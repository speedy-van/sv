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
        <Alert status="info" borderRadius="md" bg="rgba(6, 182, 212, 0.1)" borderWidth={1} borderColor="#06b6d4">
          <AlertIcon color="#06b6d4" />
          <VStack align="start" spacing={1} flex={1}>
            <Text fontSize="sm" fontWeight="bold" color="#06b6d4">
              Additional Journeys Section
            </Text>
            <Text fontSize="xs" color="#9ca3af">
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

