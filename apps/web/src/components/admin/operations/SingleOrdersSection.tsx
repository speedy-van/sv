'use client';

import React, { useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';

interface SingleOrdersSectionProps {
  onCountChange?: (count: number) => void;
  declinedNotifications?: string[];
  acceptedNotifications?: string[];
  inProgressNotifications?: string[];
}

/**
 * Single Orders Section
 * 
 * Wraps the existing orders table component for use in the unified operations dashboard.
 * Manages individual orders with full admin control:
 * - View order details
 * - Assign/reassign drivers
 * - Update status
 * - Cancel orders
 * - Create routes from selected orders
 */
export default function SingleOrdersSection({ 
  onCountChange, 
  declinedNotifications,
  acceptedNotifications,
  inProgressNotifications 
}: SingleOrdersSectionProps) {
  // Note: The count will be managed internally by the OrdersTable component
  // We can enhance this later to expose the count via props or context

  return (
    <Box>
      <OrdersTable 
        embedded
        declinedNotifications={declinedNotifications}
        acceptedNotifications={acceptedNotifications}
        inProgressNotifications={inProgressNotifications}
      />
    </Box>
  );
}

