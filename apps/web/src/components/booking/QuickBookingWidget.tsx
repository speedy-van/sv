/**
 * Quick Booking Widget
 * 
 * Reduces booking funnel to 2 clicks maximum
 * Always visible on every page for maximum conversion
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Input,
  Select,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaPhone, FaCalendar, FaBox } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface QuickBookingData {
  pickupPostcode: string;
  deliveryPostcode: string;
  serviceType: string;
  urgency: string;
  phone?: string;
}

export default function QuickBookingWidget({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<QuickBookingData>({
    pickupPostcode: '',
    deliveryPostcode: '',
    serviceType: 'standard',
    urgency: 'same-day',
  });
  const toast = useToast();
  const router = useRouter();

  const handleQuickQuote = async () => {
    if (!formData.pickupPostcode || !formData.deliveryPostcode) {
      toast({
        title: 'Missing Information',
        description: 'Please enter pickup and delivery postcodes',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      // Calculate instant quote
      const response = await fetch('/api/booking/quick-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store quote in session
        sessionStorage.setItem('quickQuote', JSON.stringify(data));
        
        // Redirect to booking page with pre-filled data
        router.push(`/booking?quote=${data.quoteId}`);
      } else {
        throw new Error('Failed to get quote');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get quote. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const FloatingButton = () => (
    <Box
      position="fixed"
      bottom={{ base: '20px', md: '40px' }}
      right={{ base: '20px', md: '40px' }}
      zIndex={1000}
    >
      <Button
        size="lg"
        colorScheme="green"
        onClick={onOpen}
        boxShadow="0 8px 24px rgba(0, 209, 143, 0.4)"
        _hover={{
          transform: 'scale(1.05)',
          boxShadow: '0 12px 32px rgba(0, 209, 143, 0.6)',
        }}
        transition="all 0.3s"
        borderRadius="full"
        px={8}
        py={7}
        fontSize="lg"
        fontWeight="bold"
      >
        📦 Book Now
      </Button>
    </Box>
  );

  const QuickBookingForm = () => (
    <VStack spacing={4} align="stretch">
      {/* Step 1: Postcodes */}
      {step === 1 && (
        <>
          <Text fontSize="lg" fontWeight="bold" textAlign="center">
            Get Instant Quote in 30 Seconds
          </Text>
          
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaMapMarkerAlt} color="green.500" />
            </InputLeftElement>
            <Input
              placeholder="Pickup Postcode (e.g., G1 1AA)"
              value={formData.pickupPostcode}
              onChange={(e) =>
                setFormData({ ...formData, pickupPostcode: e.target.value.toUpperCase() })
              }
              size="lg"
              autoFocus
            />
          </InputGroup>

          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaMapMarkerAlt} color="blue.500" />
            </InputLeftElement>
            <Input
              placeholder="Delivery Postcode (e.g., EH1 1AA)"
              value={formData.deliveryPostcode}
              onChange={(e) =>
                setFormData({ ...formData, deliveryPostcode: e.target.value.toUpperCase() })
              }
              size="lg"
            />
          </InputGroup>

          <Select
            value={formData.serviceType}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            size="lg"
            icon={<FaBox />}
          >
            <option value="parcel">Parcel/Small Items</option>
            <option value="furniture">Furniture</option>
            <option value="standard">Standard Delivery</option>
            <option value="multi-drop">Multiple Stops</option>
          </Select>

          <Select
            value={formData.urgency}
            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
            size="lg"
            icon={<FaCalendar />}
          >
            <option value="same-day">Same Day (2-4 hours)</option>
            <option value="express">Express (1-2 hours)</option>
            <option value="next-day">Next Day</option>
            <option value="scheduled">Schedule for Later</option>
          </Select>

          <Button
            colorScheme="green"
            size="lg"
            onClick={handleQuickQuote}
            isLoading={loading}
            loadingText="Getting Quote..."
            w="full"
            py={7}
            fontSize="lg"
          >
            Get Instant Quote →
          </Button>

          <Text fontSize="xs" color="gray.500" textAlign="center">
            No payment required • Free quote • Book in 2 clicks
          </Text>
        </>
      )}
    </VStack>
  );

  if (variant === 'floating') {
    return (
      <>
        <FloatingButton />
        
        <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent>
            <ModalHeader>Quick Booking</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <QuickBookingForm />
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  // Inline variant for homepage
  return (
    <Box
      bg="white"
      p={8}
      borderRadius="xl"
      boxShadow="2xl"
      maxW="500px"
      w="full"
    >
      <QuickBookingForm />
    </Box>
  );
}

