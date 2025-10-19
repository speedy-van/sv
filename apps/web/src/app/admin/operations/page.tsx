'use client';

import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import UnifiedOperationsDashboard from '@/components/admin/operations/UnifiedOperationsDashboard';

/**
 * Unified Operations Management Page
 * 
 * Combines Orders and Routes management into a single interface:
 * - Single Orders: Individual delivery management
 * - Multi-Drop Routes: Route creation and optimization
 * - Unified driver assignment and control
 * - Full admin control over all operations
 */
export default function OperationsPage() {
  return (
    <Box bg="gray.900" minH="100vh" py={8}>
      <Container maxW="container.2xl">
        <UnifiedOperationsDashboard />
      </Container>
    </Box>
  );
}

