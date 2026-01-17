'use client';

import { useState, useEffect } from 'react';
import { Box, HStack, Text, Icon } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaStar } from 'react-icons/fa';

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const reviews = [
  { name: 'John M', location: 'London', text: 'Excellent service! Very professional' },
  { name: 'Sarah K', location: 'Manchester', text: 'Best price I found. Highly recommend!' },
  { name: 'David P', location: 'Birmingham', text: 'Punctual and careful with my furniture' },
  { name: 'Emma W', location: 'Leeds', text: 'Made my move stress-free!' },
  { name: 'Michael R', location: 'Glasgow', text: 'Outstanding service from start to finish' },
];

export default function LiveTrustpilotTicker() {
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const review = reviews[currentReview];

  return (
    <Box
      px={4}
      py={2}
      bg="rgba(0, 0, 0, 0.4)"
      backdropFilter="blur(16px)"
      borderRadius="xl"
      border="1px solid rgba(0, 209, 143, 0.2)"
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
      maxW={{ base: '100%', md: '500px' }}
      mx="auto"
    >
      <HStack
        spacing={3}
        key={currentReview}
        animation={`${slideIn} 0.5s ease-out`}
        justify="center"
        flexWrap="wrap"
      >
        <HStack spacing={0.5}>
          {[...Array(5)].map((_, i) => (
            <Icon key={i} as={FaStar} color="green.400" boxSize={3} />
          ))}
        </HStack>
        <Text fontSize="xs" color="white" fontWeight="semibold">
          {review.name}
        </Text>
        <Text fontSize="xs" color="whiteAlpha.700">
          from {review.location}:
        </Text>
        <Text fontSize="xs" color="whiteAlpha.900" fontStyle="italic">
          "{review.text}"
        </Text>
        <Text fontSize="2xs" color="green.300" fontWeight="bold">
          • Just now
        </Text>
      </HStack>
    </Box>
  );
}
