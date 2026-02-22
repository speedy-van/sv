'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Box, Button, HStack, Text } from '@chakra-ui/react';

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom={{ base: 4, md: 6 }}
      left="50%"
      transform="translateX(-50%)"
      zIndex={950}
      w={{ base: 'calc(100% - 24px)', md: 'auto' }}
      bg="bg.card"
      border="1px solid"
      borderColor="border.primary"
      borderRadius="xl"
      boxShadow="lg"
      px={{ base: 3, md: 4 }}
      py={3}
    >
      <HStack spacing={3} flexWrap="wrap" justify="center">
        <Text color="text.secondary" fontSize="sm" display={{ base: 'none', md: 'block' }}>
          Need a fast quote?
        </Text>
        <Button as="a" href="tel:01202129746" variant="outline" borderColor="border.neon" size="sm">
          01202 129746
        </Button>
        <Button as={NextLink} href="/booking-luxury" colorScheme="blue" size="sm">
          Start Booking
        </Button>
      </HStack>
    </Box>
  );
}

