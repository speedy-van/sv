/**
 * Customer portal layout component
 */

import { ReactNode } from 'react';
import { Box, VStack } from '@chakra-ui/react';
import { UnifiedNavigation } from '@/components/shared/UnifiedNavigation';
import UnifiedErrorBoundary from '@/components/shared/UnifiedErrorBoundary';

interface CustomerPortalLayoutProps {
  children: ReactNode;
}

export default function CustomerPortalLayout({ children }: CustomerPortalLayoutProps) {
  return (
    <UnifiedErrorBoundary>
      <VStack spacing={0} minH="100vh">
        <UnifiedNavigation userRole="customer" isAuthenticated />
        
        <Box flex={1} width="100%" maxW="1200px" mx="auto" p={6}>
          {children}
        </Box>
      </VStack>
    </UnifiedErrorBoundary>
  );
}