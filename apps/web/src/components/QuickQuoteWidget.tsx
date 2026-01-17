'use client';

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Icon,
  HStack,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickQuoteWidget() {
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleGetQuote = async () => {
    if (!pickup || !delivery) {
      toast({
        title: 'Missing information',
        description: 'Please enter both pickup and delivery postcodes',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Basic UK postcode validation
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(pickup) || !postcodeRegex.test(delivery)) {
      toast({
        title: 'Invalid postcode',
        description: 'Please enter valid UK postcodes (e.g., SW1A 1AA)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    
    // Navigate to booking page with prefilled data
    router.push(`/booking-luxury?pickup=${encodeURIComponent(pickup)}&delivery=${encodeURIComponent(delivery)}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGetQuote();
    }
  };

  return (
    <Box
      bg="rgba(255, 255, 255, 0.95)"
      backdropFilter="blur(20px)"
      borderRadius="2xl"
      p={{ base: 6, md: 8 }}
      boxShadow="0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.8)"
      maxW={{ base: '100%', md: '500px' }}
      mx="auto"
      id="booking-section"
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <Box textAlign="center" mb={2}>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800" mb={1}>
            Get Instant Quote
          </Text>
          <Text fontSize="sm" color="gray.600">
            Enter postcodes for immediate pricing
          </Text>
        </Box>

        {/* Pickup Postcode */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
            <HStack spacing={2}>
              <Icon as={FaMapMarkerAlt} color="green.500" />
              <Text>Pickup Postcode</Text>
            </HStack>
          </FormLabel>
          <Input
            placeholder="e.g., SW1A 1AA"
            size="lg"
            value={pickup}
            onChange={(e) => setPickup(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            bg="white"
            border="2px solid"
            borderColor="gray.200"
            _hover={{ borderColor: 'brand.400' }}
            _focus={{
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            }}
            fontSize="md"
            fontWeight="medium"
          />
        </FormControl>

        {/* Delivery Postcode */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
            <HStack spacing={2}>
              <Icon as={FaMapMarkerAlt} color="red.500" />
              <Text>Delivery Postcode</Text>
            </HStack>
          </FormLabel>
          <Input
            placeholder="e.g., E1 6AN"
            size="lg"
            value={delivery}
            onChange={(e) => setDelivery(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            bg="white"
            border="2px solid"
            borderColor="gray.200"
            _hover={{ borderColor: 'brand.400' }}
            _focus={{
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            }}
            fontSize="md"
            fontWeight="medium"
          />
        </FormControl>

        {/* CTA Button */}
        <Button
          size="lg"
          colorScheme="brand"
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="white"
          rightIcon={loading ? <Spinner size="sm" /> : <Icon as={FaArrowRight} />}
          onClick={handleGetQuote}
          isDisabled={loading}
          fontSize="lg"
          fontWeight="bold"
          h="60px"
          boxShadow="0 10px 30px rgba(102, 126, 234, 0.4)"
          _hover={{
            transform: 'scale(1.02)',
            boxShadow: '0 15px 40px rgba(102, 126, 234, 0.5)',
          }}
          _active={{
            transform: 'scale(0.98)',
          }}
          transition="all 0.2s"
        >
          {loading ? 'Loading...' : 'Get Instant Quote'}
        </Button>

        {/* Trust Indicators */}
        <HStack justify="center" spacing={4} pt={2}>
          <Text fontSize="xs" color="gray.600">
            ✓ No hidden fees
          </Text>
          <Text fontSize="xs" color="gray.600">
            ✓ Instant confirmation
          </Text>
          <Text fontSize="xs" color="gray.600">
            ✓ 30 sec quote
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}
