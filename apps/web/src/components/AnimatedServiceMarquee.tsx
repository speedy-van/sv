'use client';

import { Box, Text, HStack, Icon } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaFacebook } from 'react-icons/fa';
import { SiGumtree } from 'react-icons/si';
import { FaCouch, FaTruck } from 'react-icons/fa';

const slideLeft = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
`;

const services = [
  { icon: FaFacebook, label: 'Facebook Marketplace', color: '#1877F2' },
  { icon: SiGumtree, label: 'Gumtree', color: '#72ef36' },
  { icon: FaCouch, label: 'Sofa Delivery', color: '#9333EA' },
  { icon: FaTruck, label: 'House Removals', color: '#00C2FF' },
];

export default function AnimatedServiceMarquee() {
  return (
    <Box
      position="relative"
      overflow="hidden"
      py={2}
      bg="rgba(0,0,0,0.3)"
      borderRadius="md"
      backdropFilter="blur(10px)"
    >
      <HStack
        spacing={8}
        animation={`${slideLeft} 20s linear infinite`}
        whiteSpace="nowrap"
      >
        {/* Duplicate for seamless loop */}
        {[...services, ...services, ...services].map((service, index) => (
          <HStack
            key={index}
            spacing={2}
            px={4}
            py={2}
            bg="rgba(255,255,255,0.05)"
            borderRadius="full"
            border="1px solid"
            borderColor="rgba(255,255,255,0.1)"
            flexShrink={0}
          >
            <Icon as={service.icon} color={service.color} boxSize={4} />
            <Text fontSize="sm" fontWeight="medium" color="white">
              {service.label}
            </Text>
          </HStack>
        ))}
      </HStack>
    </Box>
  );
}
