'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  HStack,
  Icon,
  Box,
  useDisclosure,
} from '@chakra-ui/react';
import { usePathname, useRouter } from 'next/navigation';
import { FaShoppingCart, FaTimes, FaArrowRight } from 'react-icons/fa';
import { safeLocalStorageGetItem, safeLocalStorageRemoveItem } from '@/lib/safe-storage';

const STEP_KEY = 'sv_booking_luxury_last_step';
const REF_KEY = 'sv_booking_luxury_reference';
const DISMISSED_KEY = 'sv_booking_popup_dismissed';

export default function BookingInProgressPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [resumeStep, setResumeStep] = useState<number | null>(null);

  const checkBookingState = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const ref = safeLocalStorageGetItem(REF_KEY);
    const stepRaw = safeLocalStorageGetItem(STEP_KEY);
    const dismissed = safeLocalStorageGetItem(DISMISSED_KEY);
    
    // Don't show if already dismissed in this session
    if (dismissed === 'true') return;
    
    if (ref && stepRaw) {
      const step = parseInt(stepRaw, 10);
      if (!Number.isNaN(step)) {
        setBookingRef(ref);
        setResumeStep(step);
        onOpen();
      }
    }
  }, [onOpen]);

  // Check on mount and when pathname changes
  useEffect(() => {
    // Don't show on booking page itself
    if (pathname?.startsWith('/booking-luxury')) return;
    // Don't show on success page
    if (pathname?.includes('/success')) return;
    
    // Small delay to avoid flash on initial load
    const timer = setTimeout(checkBookingState, 500);
    return () => clearTimeout(timer);
  }, [pathname, checkBookingState]);

  const handleContinue = () => {
    onClose();
    const step = resumeStep || 1;
    router.push(`/booking-luxury?step=${step}`);
  };

  const handleClearBooking = () => {
    safeLocalStorageRemoveItem(STEP_KEY);
    safeLocalStorageRemoveItem(REF_KEY);
    setBookingRef(null);
    setResumeStep(null);
    onClose();
  };

  const handleDismiss = () => {
    // Mark as dismissed for this session only
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(DISMISSED_KEY, 'true');
    }
    onClose();
  };

  if (!bookingRef || resumeStep === null) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleDismiss}
      isCentered
      size={{ base: 'sm', md: 'md' }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay 
        bg="blackAlpha.700"
        backdropFilter="blur(8px)"
      />
      <ModalContent
        bg="gray.900"
        border="1px solid"
        borderColor="blue.500"
        borderRadius="xl"
        mx={{ base: 4, md: 0 }}
        overflow="hidden"
      >
        {/* Header with gradient */}
        <ModalHeader 
          bg="linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          py={4}
          px={{ base: 4, md: 6 }}
        >
          <HStack spacing={3}>
            <Box
              p={2}
              bg="blue.500"
              borderRadius="lg"
            >
              <Icon as={FaShoppingCart} color="white" boxSize={5} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text 
                fontSize={{ base: 'md', md: 'lg' }} 
                fontWeight="700" 
                color="white"
              >
                Booking In Progress
              </Text>
              <Text 
                fontSize={{ base: 'xs', md: 'sm' }} 
                color="whiteAlpha.700"
              >
                You have an unfinished booking
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>

        <ModalBody py={{ base: 4, md: 6 }} px={{ base: 4, md: 6 }}>
          <VStack spacing={4} align="stretch">
            {/* Booking Reference */}
            <Box
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.100"
              borderRadius="lg"
              p={4}
            >
              <Text fontSize="xs" color="whiteAlpha.600" mb={1}>
                Booking Reference
              </Text>
              <Text 
                fontSize={{ base: 'lg', md: 'xl' }}
                fontWeight="700" 
                fontFamily="mono"
                color="blue.300"
                letterSpacing="wide"
              >
                {bookingRef}
              </Text>
              <Text fontSize="xs" color="whiteAlpha.500" mt={2}>
                Step {resumeStep} of 3
              </Text>
            </Box>

            {/* Info text */}
            <Text 
              fontSize={{ base: 'sm', md: 'md' }} 
              color="whiteAlpha.800"
              lineHeight="1.6"
            >
              Would you like to continue where you left off, or start a new booking?
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter 
          bg="whiteAlpha.50"
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          py={4}
          px={{ base: 4, md: 6 }}
        >
          <VStack spacing={3} w="100%">
            {/* Primary action - Continue */}
            <Button
              w="100%"
              size="lg"
              colorScheme="blue"
              rightIcon={<FaArrowRight />}
              onClick={handleContinue}
              fontWeight="600"
            >
              Continue Booking
            </Button>
            
            {/* Secondary actions */}
            <HStack spacing={3} w="100%">
              <Button
                flex={1}
                size="md"
                variant="outline"
                colorScheme="red"
                leftIcon={<FaTimes />}
                onClick={handleClearBooking}
                borderColor="red.400"
                color="red.300"
                _hover={{ bg: 'red.900', borderColor: 'red.300' }}
              >
                Clear & Start New
              </Button>
              <Button
                flex={1}
                size="md"
                variant="ghost"
                color="whiteAlpha.600"
                onClick={handleDismiss}
                _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
              >
                Remind Later
              </Button>
            </HStack>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
