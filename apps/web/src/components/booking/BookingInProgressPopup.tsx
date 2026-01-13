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
  Progress,
  Circle,
  Flex,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { usePathname, useRouter } from 'next/navigation';
import { FaShoppingCart, FaTimes, FaArrowRight, FaClock, FaCheck } from 'react-icons/fa';
import { 
  safeLocalStorageGetItem, 
  safeLocalStorageRemoveItem,
  safeSessionStorageGetItem,
  safeSessionStorageSetItem,
  safeSessionStorageRemoveItem
} from '@/lib/safe-storage';

const STEP_KEY = 'sv_booking_luxury_last_step';
const REF_KEY = 'sv_booking_luxury_reference';
const REMIND_LATER_KEY = 'sv_booking_popup_remind_at';
const REMIND_DELAY_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function BookingInProgressPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [resumeStep, setResumeStep] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkBookingState = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (isChecking) return; // Prevent duplicate checks
    
    const ref = safeLocalStorageGetItem(REF_KEY);
    const stepRaw = safeLocalStorageGetItem(STEP_KEY);
    const remindAtStr = safeSessionStorageGetItem(REMIND_LATER_KEY);
    
    // Check if "Remind Later" was clicked and 5 minutes haven't passed yet
    if (remindAtStr) {
      const remindAt = parseInt(remindAtStr, 10);
      if (!isNaN(remindAt) && Date.now() < remindAt) {
        // Schedule to check again when the remind time is reached
        const timeUntilRemind = remindAt - Date.now();
        setTimeout(() => checkBookingState(), timeUntilRemind + 100);
        return;
      } else {
        // Time has passed, clear the reminder
        safeSessionStorageRemoveItem(REMIND_LATER_KEY);
      }
    }
    
    if (ref && stepRaw) {
      const step = parseInt(stepRaw, 10);
      if (!Number.isNaN(step)) {
        setIsChecking(true);
        
        try {
          // Check if booking is already completed/confirmed
          const response = await fetch(`/api/booking/status?reference=${encodeURIComponent(ref)}`);
          
          if (response.ok) {
            const data = await response.json();
            
            // If booking is completed/confirmed, clear the storage and don't show popup
            if (data.isComplete || data.status === 'CONFIRMED' || data.status === 'COMPLETED') {
              // Clear storage since booking is complete
              safeLocalStorageRemoveItem(STEP_KEY);
              safeLocalStorageRemoveItem(REF_KEY);
              setIsChecking(false);
              return;
            }
          }
          
          // Booking is still pending/incomplete - show the popup
          setBookingRef(ref);
          setResumeStep(step);
          onOpen();
        } catch (error) {
          // On error, still show popup (fail-safe)
          console.warn('Could not verify booking status:', error);
          setBookingRef(ref);
          setResumeStep(step);
          onOpen();
        } finally {
          setIsChecking(false);
        }
      }
    }
  }, [onOpen, isChecking]);

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

  const handleRemindLater = () => {
    // Set a timestamp for when to remind (5 minutes from now)
    if (typeof window !== 'undefined') {
      const remindAt = Date.now() + REMIND_DELAY_MS;
      safeSessionStorageSetItem(REMIND_LATER_KEY, remindAt.toString());
      
      // Schedule the popup to reappear after 5 minutes
      setTimeout(() => {
        safeSessionStorageRemoveItem(REMIND_LATER_KEY);
        checkBookingState();
      }, REMIND_DELAY_MS);
    }
    onClose();
  };

  if (!bookingRef || resumeStep === null) return null;

  // Keyframes for animations
  const pulseGlow = keyframes`
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1); }
    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.2); }
  `;

  const floatAnimation = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
  `;

  const progressPercent = resumeStep ? Math.round((resumeStep / 3) * 100) : 33;

  const stepLabels = ['Addresses', 'Items & Time', 'Payment'];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleRemindLater}
      isCentered
      size={{ base: 'sm', md: 'md' }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay 
        bg="blackAlpha.800"
        backdropFilter="blur(12px)"
      />
      <ModalContent
        bg="linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)"
        border="1px solid"
        borderColor="blue.400"
        borderRadius="2xl"
        mx={{ base: 3, md: 0 }}
        overflow="hidden"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.15)"
        animation={`${pulseGlow} 3s ease-in-out infinite`}
      >
        {/* Decorative top gradient line */}
        <Box 
          h="3px" 
          bgGradient="linear(to-r, blue.400, purple.500, pink.400)" 
        />

        {/* Header */}
        <ModalHeader 
          bg="transparent"
          pt={6}
          pb={4}
          px={{ base: 5, md: 6 }}
        >
          <VStack spacing={4} align="center">
            {/* Animated Icon */}
            <Box
              p={4}
              bg="linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)"
              borderRadius="full"
              border="2px solid"
              borderColor="blue.400"
              animation={`${floatAnimation} 3s ease-in-out infinite`}
            >
              <Icon as={FaShoppingCart} color="blue.300" boxSize={7} />
            </Box>
            
            <VStack spacing={1}>
              <Text 
                fontSize={{ base: 'lg', md: 'xl' }} 
                fontWeight="800" 
                bgGradient="linear(to-r, blue.300, purple.300)"
                bgClip="text"
                textAlign="center"
              >
                Continue Your Booking?
              </Text>
              <Text 
                fontSize={{ base: 'xs', md: 'sm' }} 
                color="whiteAlpha.600"
                textAlign="center"
              >
                You&apos;re almost there! Don&apos;t lose your progress.
              </Text>
            </VStack>
          </VStack>
        </ModalHeader>

        <ModalBody py={4} px={{ base: 5, md: 6 }}>
          <VStack spacing={5} align="stretch">
            {/* Booking Reference Card */}
            <Box
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.100"
              borderRadius="xl"
              p={4}
              position="relative"
              overflow="hidden"
            >
              {/* Subtle shimmer effect */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bgGradient="linear(135deg, transparent 0%, whiteAlpha.50 50%, transparent 100%)"
                opacity={0.5}
              />
              
              <HStack justify="space-between" align="start">
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider">
                    Booking Reference
                  </Text>
                  <Text 
                    fontSize={{ base: 'xl', md: '2xl' }}
                    fontWeight="800" 
                    fontFamily="mono"
                    bgGradient="linear(to-r, blue.300, cyan.300)"
                    bgClip="text"
                    letterSpacing="wider"
                  >
                    {bookingRef}
                  </Text>
                </VStack>
                <Box
                  px={3}
                  py={1}
                  bg="blue.500"
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="600"
                  color="white"
                >
                  Step {resumeStep}/3
                </Box>
              </HStack>
            </Box>

            {/* Progress Indicator */}
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between" px={1}>
                <Text fontSize="xs" color="whiteAlpha.600">Progress</Text>
                <Text fontSize="xs" color="blue.300" fontWeight="600">{progressPercent}% Complete</Text>
              </HStack>
              
              <Progress 
                value={progressPercent} 
                size="sm" 
                borderRadius="full"
                bg="whiteAlpha.100"
                sx={{
                  '& > div': {
                    bgGradient: 'linear(to-r, blue.400, purple.500)',
                  }
                }}
              />

              {/* Step indicators */}
              <Flex justify="space-between" mt={2}>
                {stepLabels.map((label, index) => {
                  const stepNum = index + 1;
                  const isCompleted = resumeStep ? stepNum < resumeStep : false;
                  const isCurrent = stepNum === resumeStep;
                  
                  return (
                    <VStack key={label} spacing={1} flex={1}>
                      <Circle
                        size="28px"
                        bg={isCompleted ? 'green.500' : isCurrent ? 'blue.500' : 'whiteAlpha.200'}
                        border="2px solid"
                        borderColor={isCompleted ? 'green.400' : isCurrent ? 'blue.400' : 'whiteAlpha.300'}
                      >
                        {isCompleted ? (
                          <Icon as={FaCheck} boxSize={3} color="white" />
                        ) : (
                          <Text fontSize="xs" fontWeight="700" color="white">{stepNum}</Text>
                        )}
                      </Circle>
                      <Text 
                        fontSize="2xs" 
                        color={isCurrent ? 'blue.300' : isCompleted ? 'green.300' : 'whiteAlpha.500'}
                        fontWeight={isCurrent ? '600' : '400'}
                        textAlign="center"
                      >
                        {label}
                      </Text>
                    </VStack>
                  );
                })}
              </Flex>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter 
          bg="whiteAlpha.30"
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          py={5}
          px={{ base: 5, md: 6 }}
        >
          <VStack spacing={3} w="100%">
            {/* Primary action - Continue */}
            <Button
              w="100%"
              size="lg"
              bgGradient="linear(to-r, blue.500, purple.500)"
              color="white"
              rightIcon={<FaArrowRight />}
              onClick={handleContinue}
              fontWeight="700"
              borderRadius="xl"
              py={7}
              _hover={{
                bgGradient: 'linear(to-r, blue.400, purple.400)',
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
              }}
              _active={{
                transform: 'translateY(0)',
              }}
              transition="all 0.2s"
            >
              Continue Booking
            </Button>
            
            {/* Secondary actions */}
            <HStack spacing={3} w="100%">
              <Button
                flex={1}
                size="md"
                variant="outline"
                leftIcon={<FaTimes />}
                onClick={handleClearBooking}
                borderColor="red.400"
                color="red.300"
                borderRadius="lg"
                _hover={{ bg: 'red.900', borderColor: 'red.300', transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                Start New
              </Button>
              <Button
                flex={1}
                size="md"
                variant="outline"
                leftIcon={<FaClock />}
                color="whiteAlpha.700"
                borderColor="whiteAlpha.300"
                borderRadius="lg"
                onClick={handleRemindLater}
                _hover={{ bg: 'whiteAlpha.100', color: 'white', borderColor: 'whiteAlpha.500' }}
                transition="all 0.2s"
              >
                In 5 mins
              </Button>
            </HStack>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
