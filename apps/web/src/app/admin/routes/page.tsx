'use client';

import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import EnhancedAdminRoutesDashboard from '@/components/admin/EnhancedAdminRoutesDashboard';

/**
 * Multi-Drop Routes Management Page
 * 
 * Enhanced admin interface for managing multi-drop delivery routes:
 * - Live route monitoring with real-time data
 * - Full CRUD operations (Create, Edit, Delete, Reassign)
 * - Automatic route creation from pending drops
 * - Driver management and reassignment
 * - Route progress tracking with live updates
 * - Dark theme for better visibility
 */
export default function RoutesPage() {
  return (
    <Box bg="gray.900" minH="100vh" py={8}>
      <Container maxW="container.2xl">
        <EnhancedAdminRoutesDashboard />
      </Container>
    </Box>
  );
}

