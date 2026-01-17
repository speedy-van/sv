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
  List,
  ListItem,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaArrowRight, FaCheckCircle, FaClock } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AddressSuggestion {
  formatted: string;
  postcode?: string;
  line_1?: string;
  line_2?: string;
  town_or_city?: string;
}

export default function QuickQuoteWidget() {
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [loading, setLoading] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<AddressSuggestion[]>([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState<AddressSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDeliverySuggestions, setShowDeliverySuggestions] = useState(false);
  const [loadingPickupSuggestions, setLoadingPickupSuggestions] = useState(false);
  const [loadingDeliverySuggestions, setLoadingDeliverySuggestions] = useState(false);
  const pickupRef = useRef<HTMLDivElement>(null);
  const deliveryRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(event.target as Node)) {
        setShowPickupSuggestions(false);
      }
      if (deliveryRef.current && !deliveryRef.current.contains(event.target as Node)) {
        setShowDeliverySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAddressSuggestions = async (query: string, type: 'pickup' | 'delivery') => {
    if (query.length < 3) {
      if (type === 'pickup') {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDeliverySuggestions([]);
        setShowDeliverySuggestions(false);
      }
      return;
    }

    const setLoading = type === 'pickup' ? setLoadingPickupSuggestions : setLoadingDeliverySuggestions;
    setLoading(true);

    try {
      const response = await fetch(`/api/address/autocomplete-uk?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.suggestions && Array.isArray(data.suggestions)) {
        if (type === 'pickup') {
          setPickupSuggestions(data.suggestions.slice(0, 5));
          setShowPickupSuggestions(true);
        } else {
          setDeliverySuggestions(data.suggestions.slice(0, 5));
          setShowDeliverySuggestions(true);
        }
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickupChange = (value: string) => {
    setPickup(value.toUpperCase());
    fetchAddressSuggestions(value, 'pickup');
  };

  const handleDeliveryChange = (value: string) => {
    setDelivery(value.toUpperCase());
    fetchAddressSuggestions(value, 'delivery');
  };

  const selectPickupSuggestion = (suggestion: AddressSuggestion) => {
    setPickup(suggestion.postcode || suggestion.formatted);
    setShowPickupSuggestions(false);
    setPickupSuggestions([]);
  };

  const selectDeliverySuggestion = (suggestion: AddressSuggestion) => {
    setDelivery(suggestion.postcode || suggestion.formatted);
    setShowDeliverySuggestions(false);
    setDeliverySuggestions([]);
  };

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
      display={{ base: 'none', md: 'block' }}
      position="relative"
      bg="white"
      borderRadius="3xl"
      p={{ base: 6, md: 7 }}
      boxShadow="0 20px 60px rgba(102, 126, 234, 0.4), 0 8px 16px rgba(118, 75, 162, 0.3)"
      border="3px solid"
      borderColor="whiteAlpha.200"
      bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
      maxW={{ base: '100%', md: '480px' }}
      mx="auto"
      id="booking-section"
      transform="translateZ(0)"
      willChange="transform"
      transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: 'translateY(-8px) translateZ(0)',
        boxShadow: '0 30px 80px rgba(102, 126, 234, 0.5), 0 12px 24px rgba(118, 75, 162, 0.4)',
        borderColor: 'whiteAlpha.400',
        _before: {
          opacity: 1,
        }
      }}
      _before={{
        content: '""',
        position: 'absolute',
        top: '-3px',
        left: '-3px',
        right: '-3px',
        bottom: '-3px',
        borderRadius: '3xl',
        padding: '3px',
        background: 'linear-gradient(135deg, #f093fb, #f5576c, #fda085, #f093fb)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        opacity: 0.8,
        transition: 'opacity 0.4s',
      }}
      sx={{
        '@keyframes gradient-rotate': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      }}
    >
      <VStack spacing={5} align="stretch">
        {/* Header with Icon */}
        <Box textAlign="center" position="relative">
          <Box
            position="absolute"
            top="-20px"
            left="50%"
            transform="translateX(-50%)"
            w="40px"
            h="40px"
            bg="white"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 4px 12px rgba(255, 255, 255, 0.4)"
          >
            <Icon as={FaArrowRight} color="#667eea" boxSize={4} />
          </Box>
          <Text 
            fontSize="2xl" 
            fontWeight="black" 
            color="white"
            mb={2}
            letterSpacing="tight"
            mt={3}
          >
            Get Instant Quote
          </Text>
          <Text 
            fontSize="sm" 
            color="whiteAlpha.900" 
            fontWeight="medium"
            letterSpacing="wide"
          >
            Enter postcodes for immediate pricing
          </Text>
        </Box>

        {/* Form Fields */}
        <VStack spacing={4} align="stretch">
          {/* Pickup Postcode */}
          <FormControl ref={pickupRef}>
            <FormLabel 
              fontSize="sm" 
              fontWeight="bold" 
              color="white" 
              mb={2}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Box
                w="24px"
                h="24px"
                borderRadius="md"
                bg="whiteAlpha.300"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 2px 8px rgba(255, 255, 255, 0.2)"
              >
                <Icon as={FaMapMarkerAlt} color="white" boxSize={3} />
              </Box>
              <Text>Pickup Location</Text>
            </FormLabel>
            <Box position="relative">
              <Input
                placeholder="e.g., SW1A 1AA"
                size="lg"
                value={pickup}
                onChange={(e) => handlePickupChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => pickup.length >= 3 && setShowPickupSuggestions(true)}
                bg="whiteAlpha.900"
                border="2px solid"
                borderColor="whiteAlpha.400"
                borderRadius="xl"
                pl={4}
                pr={loadingPickupSuggestions ? 12 : 4}
                _hover={{ 
                  borderColor: 'whiteAlpha.700',
                  boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.15)',
                  bg: 'white',
                }}
                _focus={{
                  borderColor: 'white',
                  boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.2)',
                  outline: 'none',
                  bg: 'white',
                }}
                fontSize="md"
                fontWeight="semibold"
                h="52px"
                transition="all 0.3s"
                color="gray.800"
                autoComplete="off"
              />
              {loadingPickupSuggestions && (
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)">
                  <Spinner size="sm" color="#667eea" />
                </Box>
              )}
              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                <List
                  position="absolute"
                  top="calc(100% + 4px)"
                  left="0"
                  right="0"
                  bg="white"
                  borderRadius="xl"
                  boxShadow="0 8px 24px rgba(0,0,0,0.15)"
                  zIndex={1000}
                  maxH="240px"
                  overflowY="auto"
                  border="2px solid"
                  borderColor="gray.200"
                >
                  {pickupSuggestions.map((suggestion, index) => (
                    <ListItem
                      key={index}
                      px={4}
                      py={3}
                      cursor="pointer"
                      _hover={{ bg: 'purple.50', color: '#667eea' }}
                      onClick={() => selectPickupSuggestion(suggestion)}
                      fontSize="sm"
                      color="gray.700"
                      fontWeight="medium"
                      borderBottom={index < pickupSuggestions.length - 1 ? '1px solid' : 'none'}
                      borderBottomColor="gray.100"
                      transition="all 0.2s"
                    >
                      <HStack spacing={2}>
                        <Icon as={FaMapMarkerAlt} color="#667eea" boxSize={3} />
                        <Text>{suggestion.formatted}</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </FormControl>

          {/* Delivery Postcode */}
          <FormControl ref={deliveryRef}>
            <FormLabel 
              fontSize="sm" 
              fontWeight="bold" 
              color="white" 
              mb={2}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Box
                w="24px"
                h="24px"
                borderRadius="md"
                bg="whiteAlpha.300"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 2px 8px rgba(255, 255, 255, 0.2)"
              >
                <Icon as={FaMapMarkerAlt} color="white" boxSize={3} />
              </Box>
              <Text>Delivery Location</Text>
            </FormLabel>
            <Box position="relative">
              <Input
                placeholder="e.g., E1 6AN"
                size="lg"
                value={delivery}
                onChange={(e) => handleDeliveryChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => delivery.length >= 3 && setShowDeliverySuggestions(true)}
                bg="whiteAlpha.900"
                border="2px solid"
                borderColor="whiteAlpha.400"
                borderRadius="xl"
                pl={4}
                pr={loadingDeliverySuggestions ? 12 : 4}
                _hover={{ 
                  borderColor: 'whiteAlpha.700',
                  boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.15)',
                  bg: 'white',
                }}
                _focus={{
                  borderColor: 'white',
                  boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.2)',
                  outline: 'none',
                  bg: 'white',
                }}
                fontSize="md"
                fontWeight="semibold"
                h="52px"
                transition="all 0.3s"
                color="gray.800"
                autoComplete="off"
              />
              {loadingDeliverySuggestions && (
                <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)">
                  <Spinner size="sm" color="#667eea" />
                </Box>
              )}
              {showDeliverySuggestions && deliverySuggestions.length > 0 && (
                <List
                  position="absolute"
                  top="calc(100% + 4px)"
                  left="0"
                  right="0"
                  bg="white"
                  borderRadius="xl"
                  boxShadow="0 8px 24px rgba(0,0,0,0.15)"
                  zIndex={1000}
                  maxH="240px"
                  overflowY="auto"
                  border="2px solid"
                  borderColor="gray.200"
                >
                  {deliverySuggestions.map((suggestion, index) => (
                    <ListItem
                      key={index}
                      px={4}
                      py={3}
                      cursor="pointer"
                      _hover={{ bg: 'purple.50', color: '#667eea' }}
                      onClick={() => selectDeliverySuggestion(suggestion)}
                      fontSize="sm"
                      color="gray.700"
                      fontWeight="medium"
                      borderBottom={index < deliverySuggestions.length - 1 ? '1px solid' : 'none'}
                      borderBottomColor="gray.100"
                      transition="all 0.2s"
                    >
                      <HStack spacing={2}>
                        <Icon as={FaMapMarkerAlt} color="#667eea" boxSize={3} />
                        <Text>{suggestion.formatted}</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </FormControl>
        </VStack>

        {/* CTA Button */}
        <Button
          size="lg"
          bg="white"
          color="#667eea"
          rightIcon={loading ? <Spinner size="md" color="#667eea" /> : <Icon as={FaArrowRight} />}
          onClick={handleGetQuote}
          isDisabled={loading}
          fontSize="lg"
          fontWeight="black"
          h="58px"
          borderRadius="xl"
          boxShadow="0 8px 24px rgba(255, 255, 255, 0.3)"
          position="relative"
          overflow="hidden"
          _hover={{
            transform: 'translateY(-3px) scale(1.02)',
            boxShadow: '0 12px 32px rgba(255, 255, 255, 0.5)',
            bg: 'whiteAlpha.900',
            _before: {
              left: '100%',
            },
          }}
          _active={{
            transform: 'translateY(0) scale(0.98)',
          }}
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.2), transparent)',
            transition: 'left 0.6s',
          }}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        >
          {loading ? 'Getting Quote...' : 'Get Instant Quote →'}
        </Button>

        {/* Trust Indicators - Enhanced */}
        <Box
          bg="whiteAlpha.200"
          borderRadius="xl"
          p={3}
          border="1px solid"
          borderColor="whiteAlpha.300"
        >
          <HStack justify="space-around" spacing={0}>
            <VStack spacing={1} flex={1}>
              <Box
                w="32px"
                h="32px"
                borderRadius="full"
                bg="whiteAlpha.300"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 2px 8px rgba(255, 255, 255, 0.2)"
              >
                <Icon as={FaCheckCircle} color="white" boxSize={4} />
              </Box>
              <Text fontSize="xs" color="white" fontWeight="bold" textAlign="center">
                No Hidden
                <br />
                Fees
              </Text>
            </VStack>
            
            <Box h="40px" w="1px" bg="whiteAlpha.300" />
            
            <VStack spacing={1} flex={1}>
              <Box
                w="32px"
                h="32px"
                borderRadius="full"
                bg="whiteAlpha.300"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 2px 8px rgba(255, 255, 255, 0.2)"
              >
                <Icon as={FaCheckCircle} color="white" boxSize={4} />
              </Box>
              <Text fontSize="xs" color="white" fontWeight="bold" textAlign="center">
                Instant
                <br />
                Response
              </Text>
            </VStack>
            
            <Box h="40px" w="1px" bg="whiteAlpha.300" />
            
            <VStack spacing={1} flex={1}>
              <Box
                w="32px"
                h="32px"
                borderRadius="full"
                bg="whiteAlpha.300"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 2px 8px rgba(255, 255, 255, 0.2)"
              >
                <Icon as={FaClock} color="white" boxSize={4} />
              </Box>
              <Text fontSize="xs" color="white" fontWeight="bold" textAlign="center">
                Quick
                <br />
                30 Sec
              </Text>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
}
