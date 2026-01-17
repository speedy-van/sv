'use client';

import { useState, useEffect } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
`;

export default function LiveAvailabilityPulse() {
  const [location, setLocation] = useState('your area');
  const [vansAvailable, setVansAvailable] = useState(12);

  useEffect(() => {
    // Fetch user's location via IP
    const fetchLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.city) {
          setLocation(data.city);
        } else if (data.region) {
          setLocation(data.region);
        }
      } catch (error) {
        // Keep default location
        console.log('Using default location');
      }
    };

    fetchLocation();
    
    // Randomize available vans between 8-15
    setVansAvailable(Math.floor(Math.random() * 8) + 8);
  }, []);

  return (
    <HStack
      spacing={2}
      px={4}
      py={2}
      bg="rgba(0, 209, 143, 0.15)"
      backdropFilter="blur(12px)"
      borderRadius="full"
      border="1px solid rgba(0, 209, 143, 0.3)"
      boxShadow="0 4px 15px rgba(0, 209, 143, 0.2)"
      display="inline-flex"
    >
      <Box
        w="8px"
        h="8px"
        borderRadius="full"
        bg="green.400"
        animation={`${pulse} 2s ease-in-out infinite`}
        boxShadow="0 0 10px rgba(34, 197, 94, 0.6)"
      />
      <Text
        fontSize={{ base: 'xs', md: 'sm' }}
        fontWeight="semibold"
        color="green.100"
        letterSpacing="wide"
      >
        {vansAvailable} Vans available in {location} today
      </Text>
    </HStack>
  );
}
