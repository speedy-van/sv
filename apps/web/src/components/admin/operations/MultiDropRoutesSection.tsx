'use client';

import React from 'react';
import { Box } from '@chakra-ui/react';
import EnhancedAdminRoutesDashboard from '@/components/admin/EnhancedAdminRoutesDashboard';

interface MultiDropRoutesSectionProps {
  onCountChange?: (count: number) => void;
}

/**
 * Multi-Drop Routes Section
 * 
 * Wraps the existing routes dashboard component for use in the unified operations dashboard.
 * Manages multi-drop delivery routes with full admin control:
 * - Create routes (manual, automatic, AI-powered)
 * - Assign/reassign drivers
 * - Add/remove drops
 * - Optimize routes
 * - Track progress
 * - Cancel/split routes
 */
export default function MultiDropRoutesSection({ onCountChange }: MultiDropRoutesSectionProps) {
  // Note: The count will be managed by the EnhancedAdminRoutesDashboard component internally
  // We can enhance this later to expose the count via props or context

  return (
    <Box>
      <EnhancedAdminRoutesDashboard />
    </Box>
  );
}

