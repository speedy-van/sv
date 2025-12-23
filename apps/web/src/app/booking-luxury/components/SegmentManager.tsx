/**
 * Segment Manager Component
 * Manages multiple booking segments (outbound, return, additional)
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Stack,
  Button,
  Text,
  Badge,
  Icon,
  useToast,
  Collapse,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertDescription,
  FormControl,
  Divider,
  SimpleGrid,
  Card,
  CardBody,
  Heading,
} from '@chakra-ui/react';
import {
  FaPlus,
  FaUndo,
  FaTrash,
  FaMapMarkerAlt,
  FaClock,
  FaBox,
  FaChevronDown,
  FaChevronUp,
  FaRoute,
  FaTruck,
  FaRedo,
  FaCheck,
  FaArrowRight,
} from 'react-icons/fa';
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';
import type { BookingSegment } from '../types/segment';
import type { FormData } from '../hooks/useBookingForm';

interface SegmentManagerProps {
  formData: FormData;
  segments: BookingSegment[];
  onAddReturnSegment: (bufferMinutes?: number) => void;
  onAddAdditionalSegment: () => void;
  onUpdateSegment: (index: number, data: Partial<BookingSegment>) => void;
  onRemoveSegment: (index: number) => void;
  validateSegments: () => { valid: boolean; errors: string[] };
}

export default function SegmentManager({
  formData,
  segments,
  onAddReturnSegment,
  onAddAdditionalSegment,
  onUpdateSegment,
  onRemoveSegment,
  validateSegments,
}: SegmentManagerProps) {
  const toast = useToast();
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0);
  const { isOpen: showValidation, onToggle: toggleValidation } = useDisclosure({ defaultIsOpen: false });
  const prevSegmentsLength = useRef(segments.length);

  // Helper function to get full address display
  const getFullAddressDisplay = (address: any): string => {
    if (!address) return 'Not set';
    
    // Try full first (direct property)
    if (address.full) return address.full;
    
    // Try place_name (from Mapbox)
    if (address.place_name) return address.place_name;
    
    // Try formatted_address (from Google)
    if (address.formatted_address) return address.formatted_address;
    
    // Build from components
    const parts: string[] = [];
    
    if (address.houseNumber) parts.push(address.houseNumber);
    if (address.flatNumber) parts.push(`Flat ${address.flatNumber}`);
    if (address.address) parts.push(address.address);
    if (address.city && !address.address?.includes(address.city)) parts.push(address.city);
    if (address.postcode) parts.push(address.postcode);
    
    if (parts.length > 0) return parts.join(', ');
    
    // Last resort - just postcode
    return address.postcode || 'Not set';
  };

  // Auto-switch to new segment when added
  useEffect(() => {
    if (segments.length > prevSegmentsLength.current) {
      // A new segment was added, switch to it
      setSelectedSegmentIndex(segments.length - 1);
    }
    prevSegmentsLength.current = segments.length;
  }, [segments.length]);

  const handleAddReturn = () => {
    // ✅ FIXED: Check if we have at least one segment with addresses OR if formData has addresses (first booking)
    if (segments.length === 0) {
      // No segments yet - check formData for the initial outbound journey
      // Check multiple address fields since address structure varies
      const pickupAddr = formData.step1.pickupAddress;
      const dropoffAddr = formData.step1.dropoffAddress;
      
      const hasPickupAddress = pickupAddr && (
        pickupAddr.postcode || 
        pickupAddr.full || 
        pickupAddr.address || 
        pickupAddr.place_name ||
        (pickupAddr.coordinates?.lat && pickupAddr.coordinates?.lng)
      );
      
      const hasDropoffAddress = dropoffAddr && (
        dropoffAddr.postcode || 
        dropoffAddr.full || 
        dropoffAddr.address || 
        dropoffAddr.place_name ||
        (dropoffAddr.coordinates?.lat && dropoffAddr.coordinates?.lng)
      );
      
      if (!hasPickupAddress || !hasDropoffAddress) {
        toast({
          title: 'Cannot add return journey',
          description: 'Please complete the outbound journey addresses first',
          status: 'warning',
          duration: 3000,
        });
        return;
      }
      
      // ✅ Items will be selected in Step 2 - no need to check here
      // The return journey will automatically get items when synced in WhereAndWhatStep
      
      // formData has valid addresses, proceed with adding return
      onAddReturnSegment(30);
      
      toast({
        title: '✅ Return journey added',
        description: 'Addresses have been mirrored from the outbound journey. Select items in the next step.',
        status: 'success',
        duration: 3000,
      });
      return;
    }

    // We have segments - check the last one
    const lastSegment = segments[segments.length - 1];
    const lastDropoff = lastSegment.dropoffAddress;
    const hasLastDropoff = lastDropoff && (
      lastDropoff.postcode || 
      lastDropoff.full || 
      lastDropoff.address || 
      lastDropoff.place_name ||
      (lastDropoff.coordinates?.lat && lastDropoff.coordinates?.lng)
    );
    
    if (!hasLastDropoff) {
      toast({
        title: 'Cannot add return journey',
        description: 'Please complete the current journey addresses first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // ✅ Items will be selected/synced in Step 2 - no need to check here

    onAddReturnSegment(30); // 30 minutes buffer
    
    toast({
      title: '✅ Return journey added',
      description: 'Addresses have been mirrored from the outbound journey. Select items in the next step.',
      status: 'success',
      duration: 3000,
    });
  };

  const handleAddAdditional = () => {
    // ✅ FIXED: Check if we have addresses either in segments or in formData
    if (segments.length === 0) {
      const pickupAddr = formData.step1.pickupAddress;
      const dropoffAddr = formData.step1.dropoffAddress;
      
      const hasPickupAddress = pickupAddr && (
        pickupAddr.postcode || 
        pickupAddr.full || 
        pickupAddr.address || 
        pickupAddr.place_name ||
        (pickupAddr.coordinates?.lat && pickupAddr.coordinates?.lng)
      );
      
      const hasDropoffAddress = dropoffAddr && (
        dropoffAddr.postcode || 
        dropoffAddr.full || 
        dropoffAddr.address || 
        dropoffAddr.place_name ||
        (dropoffAddr.coordinates?.lat && dropoffAddr.coordinates?.lng)
      );
      
      if (!hasPickupAddress || !hasDropoffAddress) {
        toast({
          title: 'Cannot add additional journey',
          description: 'Please complete the first journey addresses first',
          status: 'warning',
          duration: 3000,
        });
        return;
      }
      
      // ✅ Items will be selected in Step 2 - no need to check here
    } else {
      // Segments exist - no additional items check needed
      // Items will be synced when selected in Step 2
    }
    
    onAddAdditionalSegment();
    
    toast({
      title: '✅ New journey added',
      description: 'Please fill in the journey details. Select items in the next step.',
      status: 'info',
      duration: 3000,
    });
  };

  const handleRemoveSegment = (index: number) => {
    if (segments.length <= 1) {
      toast({
        title: 'Cannot remove segment',
        description: 'You must have at least one journey segment',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    onRemoveSegment(index);
    toast({
      title: 'Segment removed',
      status: 'info',
      duration: 2000,
    });
  };

  const validation = validateSegments();

  const getSegmentTypeLabel = (type: string) => {
    switch (type) {
      case 'outbound':
        return 'Outbound';
      case 'return':
        return 'Return';
      case 'additional':
        return 'Additional';
      default:
        return type;
    }
  };

  const getSegmentTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'outbound':
        return 'green';
      case 'return':
        return 'blue';
      case 'additional':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // If no segments or only one segment, show simple view
  if (segments.length <= 1) {
    return (
      <Box w="full" mt={6}>
        <Card
          bg="linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(17, 24, 39, 0.92))"
          border="1px solid"
          borderColor="rgba(59, 130, 246, 0.35)"
          borderRadius="2xl"
          boxShadow="0 20px 50px rgba(59,130,246,0.25)"
        >
          <CardBody>
            <VStack spacing={4} align="stretch">
              {/* Header */}
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="700" color="white">
                  Add a return or new journey
                </Text>
                <Badge colorScheme="blue" variant="subtle" borderRadius="full">
                  Multi-leg ready
                </Badge>
              </HStack>

              {/* Action Buttons */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <Button
                  onClick={handleAddReturn}
                  leftIcon={<Icon as={FaUndo} />}
                  bgGradient="linear(to-r, blue.500, cyan.500)"
                  color="white"
                  _hover={{ bgGradient: 'linear(to-r, blue.600, cyan.600)' }}
                  size="md"
                  h="auto"
                  py={3}
                  whiteSpace="normal"
                  textAlign="center"
                  flexDirection={{ base: 'row', md: 'row' }}
                  justifyContent="center"
                  alignItems="center"
                  minH="48px"
                >
                  <Text as="span">Add Return Journey</Text>
                </Button>
                <Button
                  onClick={handleAddAdditional}
                  leftIcon={<Icon as={FaPlus} />}
                  bgGradient="linear(to-r, purple.500, pink.500)"
                  color="white"
                  _hover={{ bgGradient: 'linear(to-r, purple.600, pink.600)' }}
                  size="md"
                  h="auto"
                  py={3}
                  whiteSpace="normal"
                  textAlign="center"
                  flexDirection={{ base: 'row', md: 'row' }}
                  justifyContent="center"
                  alignItems="center"
                  minH="48px"
                >
                  <Text as="span">Add New Journey</Text>
                </Button>
              </SimpleGrid>

              {/* Info Text */}
              <Text fontSize="sm" color="gray.200" textAlign="center">
                Use one-click return to mirror drop-off → pickup, or add a fresh route.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    );
  }

  // Multi-segment view with button selector
  return (
    <Box w="full" mt={6}>
      <Card
        bg="linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)"
        border="2px solid"
        borderColor="rgba(147, 51, 234, 0.4)"
        borderRadius="3xl"
        boxShadow="0 25px 60px rgba(147,51,234,0.2), 0 0 0 1px rgba(147, 51, 234, 0.1)"
        overflow="hidden"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          bgGradient: 'linear(to-r, purple.400, pink.400, blue.400)',
        }}
      >
        <CardBody p={{ base: 5, md: 8 }}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <HStack spacing={4}>
            <Box
              p={3}
              borderRadius="xl"
              bg="linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.2))"
              border="1px solid"
              borderColor="rgba(147, 51, 234, 0.3)"
            >
              <Icon as={FaRoute} boxSize={6} color="purple.300" />
            </Box>
            <VStack spacing={0} align="flex-start">
              <Heading 
                size="md" 
                bgGradient="linear(to-r, purple.300, pink.300)"
                bgClip="text"
                fontWeight="bold"
              >
                Journey Segments
              </Heading>
              <HStack spacing={2}>
                <Badge 
                  bg="linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.2))"
                  color="purple.200"
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="full"
                  border="1px solid"
                  borderColor="rgba(147, 51, 234, 0.3)"
                >
                  {segments.length} {segments.length === 1 ? 'segment' : 'segments'}
                </Badge>
              </HStack>
            </VStack>
          </HStack>

          {/* Validation Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleValidation}
            rightIcon={<Icon as={showValidation ? FaChevronUp : FaChevronDown} />}
            borderColor={validation.valid ? 'green.400' : 'red.400'}
            color={validation.valid ? 'green.300' : 'red.300'}
            bg={validation.valid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
            _hover={{
              bg: validation.valid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            }}
            borderRadius="full"
            px={4}
          >
            {validation.valid ? '✓ Valid' : `⚠ ${validation.errors.length} issues`}
          </Button>
        </HStack>

        {/* Validation Errors */}
        <Collapse in={showValidation && !validation.valid} animateOpacity>
          <Alert 
            status="error" 
            borderRadius="xl"
            bg="rgba(239, 68, 68, 0.15)"
            border="1px solid"
            borderColor="rgba(239, 68, 68, 0.3)"
          >
            <AlertIcon color="red.400" />
            <Box flex="1">
              <AlertDescription>
                <VStack align="stretch" spacing={1}>
                  {validation.errors.map((error, idx) => (
                    <Text key={idx} fontSize="sm" color="red.200">
                      • {error}
                    </Text>
                  ))}
                </VStack>
              </AlertDescription>
            </Box>
          </Alert>
        </Collapse>

        {/* Journey Selector - Stacked Cards */}
        <VStack spacing={3} w="full">
          {segments.map((segment, index) => {
            const isActive = selectedSegmentIndex === index;
            const segmentType = segment.segmentType;
            
            // Color schemes based on segment type
            const colorSchemes: Record<string, { gradient: string; border: string; glow: string; icon: string }> = {
              outbound: {
                gradient: isActive 
                  ? 'linear(to-r, blue.500, cyan.500)' 
                  : 'linear(to-r, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.1))',
                border: isActive ? 'blue.400' : 'rgba(59, 130, 246, 0.3)',
                glow: isActive ? '0 0 20px rgba(59, 130, 246, 0.4)' : 'none',
                icon: isActive ? 'white' : 'blue.400',
              },
              return: {
                gradient: isActive 
                  ? 'linear(to-r, green.500, emerald.500)' 
                  : 'linear(to-r, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))',
                border: isActive ? 'green.400' : 'rgba(34, 197, 94, 0.3)',
                glow: isActive ? '0 0 20px rgba(34, 197, 94, 0.4)' : 'none',
                icon: isActive ? 'white' : 'green.400',
              },
              additional: {
                gradient: isActive 
                  ? 'linear(to-r, purple.500, pink.500)' 
                  : 'linear(to-r, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1))',
                border: isActive ? 'purple.400' : 'rgba(139, 92, 246, 0.3)',
                glow: isActive ? '0 0 20px rgba(139, 92, 246, 0.4)' : 'none',
                icon: isActive ? 'white' : 'purple.400',
              },
            };
            
            const colors = colorSchemes[segmentType] || colorSchemes.additional;
            
            return (
              <Box
                key={segment.id}
                as="button"
                onClick={() => setSelectedSegmentIndex(index)}
                w="full"
                bgGradient={colors.gradient}
                borderWidth="2px"
                borderColor={colors.border}
                borderRadius="xl"
                boxShadow={colors.glow}
                transform={isActive ? 'scale(1.01)' : 'scale(1)'}
                transition="all 0.2s ease"
                _hover={{
                  transform: 'scale(1.02)',
                }}
                _active={{
                  transform: 'scale(0.99)',
                }}
                position="relative"
                overflow="hidden"
              >
                {/* Active indicator */}
                {isActive && (
                  <Box
                    position="absolute"
                    top={2}
                    right={2}
                    bg="white"
                    borderRadius="full"
                    p={1}
                  >
                    <Icon as={FaCheck} boxSize={3} color={segmentType === 'outbound' ? 'blue.500' : segmentType === 'return' ? 'green.500' : 'purple.500'} />
                  </Box>
                )}
                
                {/* Horizontal Card Layout */}
                <HStack spacing={4} p={4} w="full" align="center">
                  {/* Icon */}
                  <Box
                    p={2}
                    borderRadius="lg"
                    bg={isActive ? 'whiteAlpha.200' : 'whiteAlpha.100'}
                    flexShrink={0}
                  >
                    <Icon 
                      as={segmentType === 'outbound' ? FaTruck : segmentType === 'return' ? FaRedo : FaPlus} 
                      boxSize={5} 
                      color={colors.icon} 
                    />
                  </Box>
                  
                  {/* Journey Info */}
                  <VStack spacing={0} align="flex-start" flex={1}>
                    <HStack spacing={2}>
                      <Text 
                        fontSize="sm" 
                        fontWeight="bold"
                        color={isActive ? 'white' : 'whiteAlpha.900'}
                      >
                        {getSegmentTypeLabel(segment.segmentType)} Journey
                      </Text>
                      <Badge 
                        bg={isActive ? 'whiteAlpha.300' : 'whiteAlpha.200'}
                        color={isActive ? 'white' : 'whiteAlpha.900'}
                        fontSize="2xs"
                        px={2}
                        borderRadius="full"
                      >
                        {segment.items?.length || 0} items
                      </Badge>
                    </HStack>
                    <Text 
                      fontSize="xs" 
                      color={isActive ? 'whiteAlpha.800' : 'whiteAlpha.600'}
                    >
                      {segment.pickupAddress?.postcode || '?'} → {segment.dropoffAddress?.postcode || '?'}
                    </Text>
                  </VStack>
                  
                  {/* Arrow indicator */}
                  <Icon 
                    as={FaArrowRight} 
                    color={isActive ? 'white' : 'whiteAlpha.500'} 
                    boxSize={4}
                    flexShrink={0}
                  />
                </HStack>
              </Box>
            );
          })}
        </VStack>

        {/* Selected Segment Content */}
        <Box>
          {segments.map((segment, index) => (
            selectedSegmentIndex === index && (
              <VStack key={segment.id} spacing={6} align="stretch">
                {/* Delete Button for segments (except first one) */}
                  {index > 0 && (
                    <HStack justify="flex-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        leftIcon={<Icon as={FaTrash} />}
                        onClick={() => handleRemoveSegment(index)}
                      >
                        Remove this journey
                      </Button>
                    </HStack>
                  )}

                  {/* Address Form for Additional Segments */}
                  {segment.segmentType === 'additional' && (
                    <>
                      {/* Stacked on mobile, side-by-side on desktop */}
                      <Stack direction={{ base: 'column', lg: 'row' }} spacing={{ base: 4, md: 6 }} w="full">
                        {/* Pickup Address Card */}
                        <Card
                          flex={1}
                          bg="linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)"
                          border="2px solid"
                          borderColor="rgba(34, 197, 94, 0.4)"
                          borderRadius="2xl"
                          boxShadow="0 15px 40px rgba(0,0,0,0.4), 0 0 40px rgba(34, 197, 94, 0.1)"
                          position="relative"
                          overflow="hidden"
                          transition="all 0.3s ease"
                          _hover={{
                            borderColor: "rgba(34, 197, 94, 0.6)",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 60px rgba(34, 197, 94, 0.2)",
                          }}
                          _before={{
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            bgGradient: 'linear(to-r, green.400, emerald.500)',
                          }}
                        >
                          <CardBody p={{ base: 4, md: 6 }}>
                            <VStack spacing={4} align="stretch">
                              {/* Compact Header */}
                              <HStack spacing={3}>
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg="linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.15))"
                                  border="1px solid"
                                  borderColor="rgba(34, 197, 94, 0.3)"
                                >
                                  <Icon as={FaMapMarkerAlt} color="green.400" boxSize={5} />
                                </Box>
                                <VStack spacing={0} align="flex-start">
                                  <Text 
                                    color="green.300" 
                                    fontWeight="bold" 
                                    fontSize="md"
                                  >
                                    Pickup
                                  </Text>
                                  <Text color="whiteAlpha.600" fontSize="xs">
                                    Journey {index + 1}
                                  </Text>
                                </VStack>
                              </HStack>

                              {/* Address Input */}
                              <FormControl>
                                <UKAddressAutocomplete
                                  id={`segment-${index}-pickup`}
                                  label=""
                                  value={segment.pickupAddress as any}
                                  onChange={(address) => {
                                    if (address) {
                                      onUpdateSegment(index, {
                                        pickupAddress: address as any,
                                      });
                                    }
                                  }}
                                  placeholder="Enter pickup address..."
                                />
                              </FormControl>
                            </VStack>
                          </CardBody>
                        </Card>

                        {/* Dropoff Address Card */}
                        <Card
                          flex={1}
                          bg="linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)"
                          border="2px solid"
                          borderColor="rgba(236, 72, 153, 0.4)"
                          borderRadius="2xl"
                          boxShadow="0 15px 40px rgba(0,0,0,0.4), 0 0 40px rgba(236, 72, 153, 0.1)"
                          position="relative"
                          overflow="hidden"
                          transition="all 0.3s ease"
                          _hover={{
                            borderColor: "rgba(236, 72, 153, 0.6)",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 60px rgba(236, 72, 153, 0.2)",
                          }}
                          _before={{
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            bgGradient: 'linear(to-r, pink.400, rose.500)',
                          }}
                        >
                          <CardBody p={{ base: 4, md: 6 }}>
                            <VStack spacing={4} align="stretch">
                              {/* Compact Header */}
                              <HStack spacing={3}>
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg="linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(244, 63, 94, 0.15))"
                                  border="1px solid"
                                  borderColor="rgba(236, 72, 153, 0.3)"
                                >
                                  <Icon as={FaMapMarkerAlt} color="pink.400" boxSize={5} />
                                </Box>
                                <VStack spacing={0} align="flex-start">
                                  <Text 
                                    color="pink.300" 
                                    fontWeight="bold" 
                                    fontSize="md"
                                  >
                                    Drop-off
                                  </Text>
                                  <Text color="whiteAlpha.600" fontSize="xs">
                                    Journey {index + 1}
                                  </Text>
                                </VStack>
                              </HStack>

                              {/* Address Input */}
                              <FormControl>
                                <UKAddressAutocomplete
                                  id={`segment-${index}-dropoff`}
                                  label=""
                                  value={segment.dropoffAddress as any}
                                  onChange={(address) => {
                                    if (address) {
                                      onUpdateSegment(index, {
                                        dropoffAddress: address as any,
                                      });
                                    }
                                  }}
                                  placeholder="Enter drop-off address..."
                                />
                              </FormControl>
                            </VStack>
                          </CardBody>
                        </Card>
                      </Stack>
                    </>
                  )}

                  {/* Return Journey - Editable with Quick Select */}
                  {segment.segmentType === 'return' && (
                    <>
                      <Stack direction={{ base: 'column', lg: 'row' }} spacing={{ base: 4, md: 6 }} w="full">
                        {/* Pickup Card */}
                        <Card
                          flex={1}
                          bg="linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)"
                          border="2px solid"
                          borderColor="rgba(34, 197, 94, 0.4)"
                          borderRadius="2xl"
                          boxShadow="0 15px 40px rgba(0,0,0,0.4), 0 0 40px rgba(34, 197, 94, 0.1)"
                          position="relative"
                          overflow="hidden"
                          _before={{
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            bgGradient: 'linear(to-r, green.400, emerald.500)',
                          }}
                        >
                          <CardBody p={{ base: 4, md: 6 }}>
                            <VStack spacing={4} align="stretch">
                              <HStack spacing={3}>
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg="linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.15))"
                                  border="1px solid"
                                  borderColor="rgba(34, 197, 94, 0.3)"
                                >
                                  <Icon as={FaMapMarkerAlt} color="green.400" boxSize={5} />
                                </Box>
                                <VStack spacing={0} align="flex-start">
                                  <Text 
                                    color="green.300" 
                                    fontWeight="bold" 
                                    fontSize="md"
                                  >
                                    Pickup (Return)
                                  </Text>
                                  <Text color="whiteAlpha.600" fontSize="xs">
                                    Where to collect?
                                  </Text>
                                </VStack>
                              </HStack>

                              {/* Address Input */}
                              <FormControl>
                                <UKAddressAutocomplete
                                  id={`segment-${index}-pickup`}
                                  label=""
                                  value={segment.pickupAddress as any}
                                  onChange={(address) => {
                                    if (address) {
                                      onUpdateSegment(index, {
                                        pickupAddress: address as any,
                                      });
                                    }
                                  }}
                                  placeholder="Enter pickup address..."
                                />
                              </FormControl>

                              {/* Quick Select - Original Addresses */}
                              <VStack spacing={2} align="stretch">
                                <Text fontSize="xs" fontWeight="600" color="whiteAlpha.600" textTransform="uppercase">
                                  Quick Select from Main Booking
                                </Text>
                                
                                {/* Original Dropoff as suggestion (most likely for return pickup) */}
                                {formData.step1.dropoffAddress?.postcode && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="green"
                                    justifyContent="flex-start"
                                    h="auto"
                                    py={2}
                                    px={3}
                                    borderRadius="lg"
                                    borderColor="rgba(34, 197, 94, 0.4)"
                                    bg="rgba(34, 197, 94, 0.1)"
                                    _hover={{ bg: 'rgba(34, 197, 94, 0.2)', borderColor: 'green.400' }}
                                    onClick={() => {
                                      onUpdateSegment(index, {
                                        pickupAddress: formData.step1.dropoffAddress as any,
                                      });
                                    }}
                                  >
                                    <HStack spacing={2} w="full">
                                      <Icon as={FaMapMarkerAlt} color="green.400" boxSize={3} />
                                      <VStack spacing={0} align="flex-start" flex={1}>
                                        <Text fontSize="2xs" color="green.300" fontWeight="600">
                                          Original Drop-off ↩
                                        </Text>
                                        <Text fontSize="xs" color="white" noOfLines={1}>
                                          {getFullAddressDisplay(formData.step1.dropoffAddress)}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                  </Button>
                                )}

                                {/* Original Pickup as alternative */}
                                {formData.step1.pickupAddress?.postcode && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="gray"
                                    justifyContent="flex-start"
                                    h="auto"
                                    py={2}
                                    px={3}
                                    borderRadius="lg"
                                    borderColor="rgba(255, 255, 255, 0.2)"
                                    bg="rgba(255, 255, 255, 0.05)"
                                    _hover={{ bg: 'rgba(255, 255, 255, 0.1)', borderColor: 'whiteAlpha.400' }}
                                    onClick={() => {
                                      onUpdateSegment(index, {
                                        pickupAddress: formData.step1.pickupAddress as any,
                                      });
                                    }}
                                  >
                                    <HStack spacing={2} w="full">
                                      <Icon as={FaMapMarkerAlt} color="whiteAlpha.600" boxSize={3} />
                                      <VStack spacing={0} align="flex-start" flex={1}>
                                        <Text fontSize="2xs" color="whiteAlpha.600" fontWeight="600">
                                          Original Pickup
                                        </Text>
                                        <Text fontSize="xs" color="whiteAlpha.800" noOfLines={1}>
                                          {getFullAddressDisplay(formData.step1.pickupAddress)}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                  </Button>
                                )}
                              </VStack>
                            </VStack>
                          </CardBody>
                        </Card>

                        {/* Dropoff Card */}
                        <Card
                          flex={1}
                          bg="linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)"
                          border="2px solid"
                          borderColor="rgba(236, 72, 153, 0.4)"
                          borderRadius="2xl"
                          boxShadow="0 15px 40px rgba(0,0,0,0.4), 0 0 40px rgba(236, 72, 153, 0.1)"
                          position="relative"
                          overflow="hidden"
                          _before={{
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            bgGradient: 'linear(to-r, pink.400, rose.500)',
                          }}
                        >
                          <CardBody p={{ base: 4, md: 6 }}>
                            <VStack spacing={4} align="stretch">
                              <HStack spacing={3}>
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg="linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(244, 63, 94, 0.15))"
                                  border="1px solid"
                                  borderColor="rgba(236, 72, 153, 0.3)"
                                >
                                  <Icon as={FaMapMarkerAlt} color="pink.400" boxSize={5} />
                                </Box>
                                <VStack spacing={0} align="flex-start">
                                  <Text 
                                    color="pink.300" 
                                    fontWeight="bold" 
                                    fontSize="md"
                                  >
                                    Drop-off (Return)
                                  </Text>
                                  <Text color="whiteAlpha.600" fontSize="sm">
                                    Where to deliver for return?
                                  </Text>
                                </VStack>
                              </HStack>

                              {/* Address Input */}
                              <FormControl>
                                <UKAddressAutocomplete
                                  id={`segment-${index}-dropoff`}
                                  label="Drop-off Address"
                                  value={segment.dropoffAddress as any}
                                  onChange={(address) => {
                                    if (address) {
                                      onUpdateSegment(index, {
                                        dropoffAddress: address as any,
                                      });
                                    }
                                  }}
                                  placeholder="Enter drop-off address or select below"
                                />
                              </FormControl>

                              {/* Quick Select - Original Addresses */}
                              <VStack spacing={2} align="stretch">
                                <Text fontSize="2xs" fontWeight="600" color="whiteAlpha.500" textTransform="uppercase">
                                  Quick Select
                                </Text>
                                
                                {/* Original Pickup as suggestion (most likely for return dropoff) */}
                                {formData.step1.pickupAddress?.postcode && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="pink"
                                    justifyContent="flex-start"
                                    h="auto"
                                    py={2}
                                    px={3}
                                    borderRadius="lg"
                                    borderColor="rgba(236, 72, 153, 0.4)"
                                    bg="rgba(236, 72, 153, 0.1)"
                                    _hover={{ bg: 'rgba(236, 72, 153, 0.2)', borderColor: 'pink.400' }}
                                    onClick={() => {
                                      onUpdateSegment(index, {
                                        dropoffAddress: formData.step1.pickupAddress as any,
                                      });
                                    }}
                                  >
                                    <HStack spacing={2} w="full">
                                      <Icon as={FaMapMarkerAlt} color="pink.400" boxSize={3} />
                                      <VStack spacing={0} align="flex-start" flex={1}>
                                        <Text fontSize="2xs" color="pink.300" fontWeight="600">
                                          Original Pickup ↩
                                        </Text>
                                        <Text fontSize="xs" color="white" noOfLines={1}>
                                          {getFullAddressDisplay(formData.step1.pickupAddress)}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                  </Button>
                                )}

                                {/* Original Dropoff as alternative */}
                                {formData.step1.dropoffAddress?.postcode && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="gray"
                                    justifyContent="flex-start"
                                    h="auto"
                                    py={2}
                                    px={3}
                                    borderRadius="lg"
                                    borderColor="rgba(255, 255, 255, 0.2)"
                                    bg="rgba(255, 255, 255, 0.05)"
                                    _hover={{ bg: 'rgba(255, 255, 255, 0.1)', borderColor: 'whiteAlpha.400' }}
                                    onClick={() => {
                                      onUpdateSegment(index, {
                                        dropoffAddress: formData.step1.dropoffAddress as any,
                                      });
                                    }}
                                  >
                                    <HStack spacing={2} w="full">
                                      <Icon as={FaMapMarkerAlt} color="whiteAlpha.600" boxSize={3} />
                                      <VStack spacing={0} align="flex-start" flex={1}>
                                        <Text fontSize="2xs" color="whiteAlpha.600" fontWeight="600">
                                          Original Drop-off
                                        </Text>
                                        <Text fontSize="xs" color="whiteAlpha.800" noOfLines={1}>
                                          {getFullAddressDisplay(formData.step1.dropoffAddress)}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                  </Button>
                                )}
                              </VStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      </Stack>
                    </>
                  )}

                  {/* Date & Time Selection for non-outbound segments */}
                  {index > 0 && (
                    <Card
                      bg="linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.1))"
                      border="2px solid"
                      borderColor="rgba(139, 92, 246, 0.4)"
                      borderRadius="2xl"
                      boxShadow="0 15px 40px rgba(0,0,0,0.4), 0 0 40px rgba(139, 92, 246, 0.1)"
                      position="relative"
                      overflow="hidden"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        bgGradient: 'linear(to-r, purple.400, pink.500)',
                      }}
                    >
                      <CardBody p={{ base: 4, md: 6 }}>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={3}>
                            <Box
                              p={2}
                              borderRadius="lg"
                              bg="linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.15))"
                              border="1px solid"
                              borderColor="rgba(139, 92, 246, 0.3)"
                            >
                              <Icon as={FaClock} color="purple.400" boxSize={5} />
                            </Box>
                            <VStack spacing={0} align="flex-start">
                              <Text color="purple.300" fontWeight="bold" fontSize="md">
                                📅 Date & Time
                              </Text>
                              <Text color="whiteAlpha.600" fontSize="xs">
                                When should this {segment.segmentType === 'return' ? 'return' : 'journey'} happen?
                              </Text>
                            </VStack>
                          </HStack>

                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            {/* Date Input */}
                            <Box>
                              <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="semibold">
                                📅 Select Date
                              </Text>
                              <input
                                type="date"
                                value={segment.datetime ? new Date(segment.datetime).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  const selectedDate = e.target.value;
                                  // Combine date with existing time or default to 9:00
                                  const existingTime = segment.datetime 
                                    ? new Date(segment.datetime).toTimeString().slice(0, 5)
                                    : '09:00';
                                  // Create proper ISO datetime with timezone
                                  const newDatetime = new Date(`${selectedDate}T${existingTime}:00`).toISOString();
                                  onUpdateSegment(index, { datetime: newDatetime });
                                }}
                                min={(() => {
                                  // Minimum date should be after main booking date
                                  const mainDate = formData.step1.pickupDate;
                                  if (mainDate) {
                                    return mainDate;
                                  }
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  return tomorrow.toISOString().split('T')[0];
                                })()}
                                style={{
                                  width: '100%',
                                  padding: '12px 14px',
                                  fontSize: '15px',
                                  borderRadius: '12px',
                                  border: '2px solid rgba(139, 92, 246, 0.4)',
                                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                  color: '#e2e8f0',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  colorScheme: 'dark',
                                }}
                              />
                            </Box>

                            {/* Time Input */}
                            <Box>
                              <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="semibold">
                                ⏰ Select Time
                              </Text>
                              <select
                                value={segment.datetime 
                                  ? (() => {
                                      const hour = new Date(segment.datetime).getHours();
                                      if (hour >= 8 && hour < 12) return 'morning';
                                      if (hour >= 12 && hour < 16) return 'afternoon';
                                      if (hour >= 16 && hour < 18) return 'evening';
                                      return 'flexible';
                                    })()
                                  : ''
                                }
                                onChange={(e) => {
                                  const timeSlot = e.target.value;
                                  // Get the date part or use tomorrow
                                  const datePart = segment.datetime 
                                    ? new Date(segment.datetime).toISOString().split('T')[0]
                                    : (() => {
                                        const mainDate = formData.step1.pickupDate;
                                        if (mainDate) return mainDate;
                                        const tomorrow = new Date();
                                        tomorrow.setDate(tomorrow.getDate() + 1);
                                        return tomorrow.toISOString().split('T')[0];
                                      })();
                                  
                                  // Map time slot to actual time
                                  let hour = '09:00';
                                  if (timeSlot === 'morning') hour = '09:00';
                                  else if (timeSlot === 'afternoon') hour = '13:00';
                                  else if (timeSlot === 'evening') hour = '17:00';
                                  else if (timeSlot === 'flexible') hour = '10:00';
                                  
                                  // Create proper ISO datetime with timezone
                                  const newDatetime = new Date(`${datePart}T${hour}:00`).toISOString();
                                  onUpdateSegment(index, { datetime: newDatetime });
                                }}
                                style={{
                                  width: '100%',
                                  padding: '12px 14px',
                                  fontSize: '15px',
                                  borderRadius: '12px',
                                  border: '2px solid rgba(139, 92, 246, 0.4)',
                                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                  color: '#e2e8f0',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  appearance: 'none',
                                }}
                              >
                                <option value="" style={{ background: '#1e293b', color: '#e2e8f0' }}>Choose a time</option>
                                <option value="morning" style={{ background: '#1e293b', color: '#e2e8f0' }}>8 AM - 12 PM 🌅 (Morning)</option>
                                <option value="afternoon" style={{ background: '#1e293b', color: '#e2e8f0' }}>12 PM - 4 PM ☀️ (Afternoon)</option>
                                <option value="evening" style={{ background: '#1e293b', color: '#e2e8f0' }}>4 PM - 6 PM 🌆 (Evening)</option>
                                <option value="flexible" style={{ background: '#1e293b', color: '#e2e8f0' }}>Flexible ⏰ (Best Price)</option>
                              </select>
                            </Box>
                          </SimpleGrid>

                          {/* Show selected datetime */}
                          {segment.datetime && (
                            <HStack 
                              bg="rgba(34, 197, 94, 0.1)" 
                              border="1px solid rgba(34, 197, 94, 0.3)"
                              borderRadius="lg"
                              p={3}
                              spacing={2}
                            >
                              <Icon as={FaCheck} color="green.400" boxSize={4} />
                              <Text color="green.300" fontSize="sm" fontWeight="semibold">
                                Scheduled: {new Date(segment.datetime).toLocaleString('en-GB', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* Segment Summary */}
                  <Card
                    bg="linear-gradient(135deg, rgba(59,130,246,0.12), rgba(124,58,237,0.15))"
                    border="1px solid"
                    borderColor="rgba(59,130,246,0.25)"
                    borderRadius="xl"
                    boxShadow="0 14px 40px rgba(15,23,42,0.35)"
                  >
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        {/* Route */}
                        <HStack>
                          <Icon as={FaMapMarkerAlt} color="green.300" />
                          <Text fontSize="sm" fontWeight="semibold" color="white">
                            {segment.pickupAddress?.postcode || 'Not set'} →{' '}
                            {segment.dropoffAddress?.postcode || 'Not set'}
                          </Text>
                        </HStack>

                        {/* Date/Time */}
                        {segment.datetime && (
                          <HStack>
                            <Icon as={FaClock} color="blue.300" />
                            <Text fontSize="sm" color="whiteAlpha.900">
                              {new Date(segment.datetime).toLocaleString('en-GB', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </Text>
                          </HStack>
                        )}

                        {/* Items */}
                        <HStack>
                          <Icon as={FaBox} color="purple.300" />
                          <Text fontSize="sm" color="whiteAlpha.900">
                            {segment.items?.length || 0} items (shared from main form)
                          </Text>
                        </HStack>

                        {/* Price */}
                        {segment.pricing && segment.pricing.total > 0 && (
                          <HStack justify="space-between">
                            <Text fontSize="sm" fontWeight="medium" color="whiteAlpha.900">
                              Segment Price:
                            </Text>
                            <Text fontSize="lg" fontWeight="bold" color="green.300">
                              £{segment.pricing.total.toFixed(2)}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Info Text for Outbound only */}
                  {segment.segmentType === 'outbound' && (
                    <Text fontSize="sm" color="gray.400" textAlign="center">
                      Edit addresses in the main form above
                    </Text>
                  )}
                </VStack>
            )
          ))}
        </Box>

        {/* Action Buttons */}
        <HStack spacing={3}>
          <Button
            onClick={handleAddReturn}
            leftIcon={<Icon as={FaUndo} />}
            bgGradient="linear(to-r, blue.500, cyan.500)"
            color="white"
            _hover={{ bgGradient: 'linear(to-r, blue.600, cyan.600)' }}
            size="sm"
            flex={1}
          >
            Add Return
          </Button>
          <Button
            onClick={handleAddAdditional}
            leftIcon={<Icon as={FaPlus} />}
            bgGradient="linear(to-r, purple.500, pink.500)"
            color="white"
            _hover={{ bgGradient: 'linear(to-r, purple.600, pink.600)' }}
            size="sm"
            flex={1}
          >
            Add Journey
          </Button>
        </HStack>
      </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}
