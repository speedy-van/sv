'use client';

import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import UnifiedOperationsDashboard from '@/components/admin/operations/UnifiedOperationsDashboard';

/**
 * Operations Page - Unified Operations Dashboard
 * 
 * Comprehensive operations management page with tabs for:
 * - Single Orders: Individual delivery management
 * - Multi-Drop Routes: Route creation and optimization (including economy services)
 * - Additional Journeys: Return journeys and additional trip segments
 * - Analytics: Operations metrics and insights
 * - Templates: Order templates management
 * - Activity Log: Audit trail
 * - Smart Suggestions: AI-powered recommendations
 * - Performance Monitor: System performance tracking
 * 
 * Architecture:
 * - Tabbed interface for easy navigation
 * - Unified dashboard for all operations
 * - Support for economy service multi-drop routes
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

