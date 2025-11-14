'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Icon,
} from '@chakra-ui/react';
import { FaTimesCircle } from 'react-icons/fa';
import Link from 'next/link';

function BookingCancelledContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams?.get('booking_id');
  
  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} align="stretch" textAlign="center">
        {/* Error Icon */}
        <Box
          bg="red.50"
          borderRadius="full"
          p={6}
          border="4px solid"
          borderColor="red.400"
          mx="auto"
        >
          <Icon as={FaTimesCircle} color="red.500" boxSize={16} />
        </Box>
        
        <Heading size="2xl" color="red.600">
          Payment Cancelled
        </Heading>
        
        <Text fontSize="lg" color="gray.600">
          Your booking payment was cancelled. No charges have been made.
        </Text>
        
        {bookingId && (
          <Text fontSize="sm" color="gray.500">
            Booking ID: {bookingId}
          </Text>
        )}
        
        {/* Action Buttons */}
        <VStack spacing={4}>
          <Button
            as={Link}
            href="/"
            colorScheme="blue"
            size="lg"
            w="full"
            maxW="300px"
          >
            Try Again
          </Button>
          
          <Button
            as="a"
            href="tel:01202129764"
            variant="outline"
            colorScheme="blue"
            size="lg"
            w="full"
            maxW="300px"
          >
            Call Support: 01202129764
          </Button>
        </VStack>
      </VStack>
    </Container>
  );
}

export default function BookingCancelledPage() {
  return (
    <Suspense fallback={<Container maxW="container.md" py={20}><Text>Loading...</Text></Container>}>
      <BookingCancelledContent />
    </Suspense>
  );
}
