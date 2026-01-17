'use client';

import { Box, HStack, Text, Icon } from '@chakra-ui/react';
import { FaShieldAlt } from 'react-icons/fa';

export default function PriceMatchBadge() {
  return (
    <HStack
      spacing={2}
      px={4}
      py={2}
      bg="linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.15))"
      backdropFilter="blur(12px)"
      borderRadius="full"
      border="2px solid rgba(255, 215, 0, 0.4)"
      boxShadow="0 4px 20px rgba(255, 215, 0, 0.3)"
      display="inline-flex"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '200%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        animation: 'shimmer 3s ease-in-out infinite',
      }}
    >
      <Icon as={FaShieldAlt} color="yellow.300" boxSize={4} filter="drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))" />
      <Text
        fontSize={{ base: 'xs', md: 'sm' }}
        fontWeight="bold"
        color="yellow.100"
        letterSpacing="wide"
        textTransform="uppercase"
      >
        Beat Any Price Guarantee
      </Text>
    </HStack>
  );
}
