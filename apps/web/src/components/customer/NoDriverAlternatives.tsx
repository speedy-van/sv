'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Button,
  Text,
  Box,
  Icon,
  Radio,
  RadioGroup,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { FaClock, FaMoneyBillWave, FaTimes, FaCheckCircle } from 'react-icons/fa';

interface NoDriverAlternativesProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingReference: string;
  originalScheduledAt: Date;
  currentTotal: number;
  onSuccess?: () => void;
}

export default function NoDriverAlternatives({
  isOpen,
  onClose,
  bookingId,
  bookingReference,
  originalScheduledAt,
  currentTotal,
  onSuccess,
}: NoDriverAlternativesProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  // Generate time shift options
  const generateTimeOptions = () => {
    const options = [];
    const now = new Date();
    const original = new Date(originalScheduledAt);

    // +2 hours
    const twoHoursLater = new Date(original);
    twoHoursLater.setHours(twoHoursLater.getHours() + 2);
    if (twoHoursLater > now) {
      options.push({
        id: 'shift_2h',
        label: `+2 hours (${twoHoursLater.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})`,
        value: twoHoursLater.toISOString(),
      });
    }

    // Later today
    const laterToday = new Date(original);
    laterToday.setHours(18, 0, 0, 0); // 6 PM
    if (laterToday > now && laterToday.getDate() === original.getDate()) {
      options.push({
        id: 'shift_today',
        label: `Later today (${laterToday.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})`,
        value: laterToday.toISOString(),
      });
    }

    // Tomorrow same time
    const tomorrow = new Date(original);
    tomorrow.setDate(tomorrow.getDate() + 1);
    options.push({
      id: 'shift_tomorrow',
      label: `Tomorrow (${tomorrow.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })} at ${tomorrow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})`,
      value: tomorrow.toISOString(),
    });

    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleSubmit = async () => {
    if (!selectedOption) {
      toast({
        title: 'Please select an option',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);

    try {
      let action: 'time_shift' | 'surge_pricing' | 'cancel';
      let body: any = {};

      if (selectedOption.startsWith('shift_')) {
        action = 'time_shift';
        const option = timeOptions.find(o => o.id === selectedOption);
        body = { action, newScheduledAt: option?.value };
      } else if (selectedOption === 'surge_15' || selectedOption === 'surge_25') {
        action = 'surge_pricing';
        const surgeAmount = selectedOption === 'surge_15' ? 15 : 25;
        body = { action, surgeAmount };
      } else {
        action = 'cancel';
        body = { action };
      }

      const response = await fetch(`/api/bookings/${bookingId}/alternatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process alternative');
      }

      toast({
        title: 'Success',
        description: result.message,
        status: 'success',
        duration: 5000,
      });

      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error('Alternative processing error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process request',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>No Driver Available</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Driver not found within 15 minutes</AlertTitle>
                <AlertDescription>
                  All drivers are currently busy. Choose an alternative below:
                </AlertDescription>
              </Box>
            </Alert>

            <Text fontSize="sm" color="gray.600">
              Booking: <strong>{bookingReference}</strong>
            </Text>

            <RadioGroup value={selectedOption} onChange={setSelectedOption}>
              <VStack spacing={3} align="stretch">
                
                {/* Time Shift Options */}
                <Box p={4} borderWidth="1px" borderRadius="md">
                  <HStack mb={2}>
                    <Icon as={FaClock} color="blue.500" />
                    <Text fontWeight="semibold">Reschedule</Text>
                  </HStack>
                  <VStack align="stretch" spacing={2} pl={6}>
                    {timeOptions.map(option => (
                      <Radio key={option.id} value={option.id}>
                        {option.label}
                      </Radio>
                    ))}
                  </VStack>
                </Box>

                {/* Surge Pricing Options */}
                <Box p={4} borderWidth="1px" borderRadius="md">
                  <HStack mb={2}>
                    <Icon as={FaMoneyBillWave} color="green.500" />
                    <Text fontWeight="semibold">Add Surge to Attract Drivers</Text>
                    <Badge colorScheme="green">Recommended</Badge>
                  </HStack>
                  <VStack align="stretch" spacing={2} pl={6}>
                    <Radio value="surge_15">
                      <HStack>
                        <Text>Add £15</Text>
                        <Text fontSize="sm" color="gray.600">
                          (New total: £{(currentTotal + 15).toFixed(2)})
                        </Text>
                      </HStack>
                    </Radio>
                    <Radio value="surge_25">
                      <HStack>
                        <Text>Add £25</Text>
                        <Text fontSize="sm" color="gray.600">
                          (New total: £{(currentTotal + 25).toFixed(2)})
                        </Text>
                      </HStack>
                    </Radio>
                  </VStack>
                  <Text fontSize="xs" color="gray.500" mt={2} pl={6}>
                    Higher pay attracts more drivers. No charge until driver confirms.
                  </Text>
                </Box>

                <Divider />

                {/* Cancel Option */}
                <Box p={4} borderWidth="1px" borderRadius="md" borderColor="red.200">
                  <HStack mb={2}>
                    <Icon as={FaTimes} color="red.500" />
                    <Text fontWeight="semibold">Cancel Booking</Text>
                  </HStack>
                  <VStack align="stretch" spacing={2} pl={6}>
                    <Radio value="cancel">
                      Cancel and release payment hold
                    </Radio>
                  </VStack>
                  <Text fontSize="xs" color="gray.500" mt={2} pl={6}>
                    No charge. Payment authorization will be released automatically.
                  </Text>
                </Box>

              </VStack>
            </RadioGroup>

            <HStack justify="flex-end" spacing={3} pt={4}>
              <Button variant="ghost" onClick={onClose} isDisabled={isProcessing}>
                Close
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isLoading={isProcessing}
                loadingText="Processing..."
                isDisabled={!selectedOption}
                leftIcon={<Icon as={FaCheckCircle} />}
              >
                Confirm Choice
              </Button>
            </HStack>

            <Text fontSize="xs" color="gray.500" textAlign="center">
              Need help? Call us at 01202 129746
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
