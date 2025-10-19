'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

/**
 * Routes Page - Redirects to Unified Operations
 * 
 * This page now redirects to the unified operations dashboard
 * where orders and routes are managed together.
 */
export default function RoutesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified operations dashboard (routes tab)
    router.push('/admin/operations');
  }, [router]);

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.900"
    >
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" />
        <Text color="white">Redirecting to Operations Dashboard...</Text>
      </VStack>
    </Box>
  );
}

