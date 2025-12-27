'use client';

import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Box,
  Card,
  CardBody,
  Input,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  Alert,
  AlertIcon,
  Button,
} from '@chakra-ui/react';
import { FiMapPin, FiClock, FiNavigation, FiMessageSquare, FiEdit, FiSave, FiX } from 'react-icons/fi';
import { OrderDetail } from '../OrderDetailDrawer';
import { JourneyRelationshipVisualization } from '../journeys/JourneyRelationshipVisualization';
import { CombinedPricingView } from '../journeys/CombinedPricingView';
import { JourneyTimelineAnalytics } from '../journeys/JourneyTimelineAnalytics';
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';

interface OrderJourneysTabProps {
  order: OrderDetail;
  bgColor: string;
  textColor: string;
  borderColor: string;
  cardBg: string;
  secondaryTextColor: string;
  isEditing?: boolean;
  editedOrder?: Partial<OrderDetail>;
  setEditedOrder?: React.Dispatch<React.SetStateAction<Partial<OrderDetail>>>;
}

export function OrderJourneysTab({
  order,
  bgColor,
  textColor,
  borderColor,
  cardBg,
  secondaryTextColor,
  isEditing = false,
  editedOrder,
  setEditedOrder,
}: OrderJourneysTabProps) {
  const formatCurrency = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  const formatDateTime = (value: string) => {
    try {
      return new Date(value).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!order.segments || order.segments.length === 0) {
    return (
      <VStack spacing={4} py={8}>
        <Text color={secondaryTextColor}>No journey segments found</Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Journey Timeline & Analytics */}
      <JourneyTimelineAnalytics
        mainBooking={{
          id: order.id,
          reference: order.reference,
          createdAt: order.createdAt || order.scheduledAt,
          scheduledAt: order.scheduledAt,
          status: order.status,
        }}
        segments={order.segments.map(seg => ({
          id: seg.id,
          segmentType: seg.segmentType,
          sequenceNumber: seg.sequenceNumber,
          scheduledAt: seg.scheduledAt,
          estimatedArrival: seg.estimatedArrival,
          actualStartTime: (seg as any).actualStartTime,
          actualCompletionTime: (seg as any).actualCompletionTime,
          status: (seg as any).status || 'pending',
          priceGBP: seg.priceGBP,
          distanceMeters: seg.distanceMeters,
          durationSeconds: seg.durationSeconds,
          items: seg.items,
        }))}
      />

      <Divider borderColor={borderColor} />

      {/* Journey Relationship Visualization */}
      <JourneyRelationshipVisualization
        mainBooking={{
          id: order.id,
          reference: order.reference,
          totalGBP: order.totalGBP,
          scheduledAt: order.scheduledAt,
          status: order.status,
        }}
        segments={order.segments}
        onSegmentClick={(segmentId) => {
          // Scroll to segment details
          const element = document.getElementById(`segment-${segmentId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      />

      <Divider borderColor={borderColor} />

      {/* Combined Pricing View */}
      <CombinedPricingView
        mainBooking={{
          reference: order.reference,
          totalGBP: order.totalGBP,
          scheduledAt: order.scheduledAt,
        }}
        segments={order.segments.map(seg => ({
          id: seg.id,
          segmentType: seg.segmentType,
          sequenceNumber: seg.sequenceNumber,
          priceGBP: seg.priceGBP,
          distanceMeters: seg.distanceMeters,
          durationSeconds: seg.durationSeconds,
          items: seg.items,
        }))}
        showBreakdown={true}
        showSavings={true}
        showComparison={true}
      />

      <Divider borderColor={borderColor} />

      <HStack justify="space-between">
        <Text fontWeight="bold" fontSize="lg" color={textColor}>
          Detailed Journey Breakdown ({order.segments.length})
        </Text>
        <HStack spacing={2}>
          {order.hasReturnJourney && (
            <Badge colorScheme="green" size="md">
              🔄 Return Journey
            </Badge>
          )}
          {order.hasAdditionalJourney && (
            <Badge colorScheme="cyan" size="md">
              ➕ Additional Journey
            </Badge>
          )}
        </HStack>
      </HStack>

      <Divider borderColor={borderColor} />

      {order.segments
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
        .map((segment, index) => {
          // Check if this segment is being edited
          const editedSegments = editedOrder?.segments || [];
          const editedSegment = editedSegments.find((s: any) => s.id === segment.id) || segment;
          const isSegmentEditable = isEditing && (segment.segmentType === 'additional' || segment.segmentType === 'return');
          
          // Helper function to update segment in editedOrder
          const updateSegment = (updates: any) => {
            if (!setEditedOrder || !editedOrder) return;
            
            const currentSegments = editedOrder.segments || order.segments || [];
            const updatedSegments = currentSegments.map((s: any) => 
              s.id === segment.id ? { ...s, ...updates } : s
            );
            
            setEditedOrder({
              ...editedOrder,
              segments: updatedSegments,
            });
          };

          return (
            <Card
              key={segment.id}
              id={`segment-${segment.id}`}
              bg={cardBg}
              borderColor={
                segment.segmentType === 'outbound' ? '#3b82f6' :
                segment.segmentType === 'return' ? '#10b981' : '#06b6d4'
              }
              borderWidth={2}
            >
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Badge
                        colorScheme={
                          segment.segmentType === 'outbound' ? 'blue' :
                          segment.segmentType === 'return' ? 'green' : 'cyan'
                        }
                        size="lg"
                      >
                        {segment.segmentType === 'outbound' ? '📦 Outbound Journey' :
                         segment.segmentType === 'return' ? '🔄 Return Journey' :
                         '➕ Additional Journey'}
                      </Badge>
                      <Badge colorScheme="gray" size="sm">
                        Sequence #{segment.sequenceNumber + 1}
                      </Badge>
                      {isSegmentEditable && (
                        <Badge colorScheme="orange" size="sm">
                          Editable
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold" color={
                      segment.segmentType === 'outbound' ? '#3b82f6' :
                      segment.segmentType === 'return' ? '#10b981' : '#06b6d4'
                    }>
                      {formatCurrency(editedSegment.priceGBP || segment.priceGBP)}
                    </Text>
                  </HStack>

                  <Divider borderColor={borderColor} />

                  {/* Pickup Address */}
                  <Box p={2} bg="rgba(16, 185, 129, 0.1)" borderRadius="md" borderWidth={1} borderColor="#10b981">
                    <HStack align="start" spacing={2}>
                      <FiMapPin color="#10b981" />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="xs" fontWeight="bold" color="#10b981">
                          Pickup Location
                        </Text>
                        {isSegmentEditable ? (
                          <VStack align="stretch" spacing={2} w="full">
                            <UKAddressAutocomplete
                              id={`segment-${segment.id}-pickup`}
                              label=""
                              value={{
                                address: editedSegment.pickupAddress?.label || segment.pickupAddress?.label || '',
                                postcode: editedSegment.pickupAddress?.postcode || segment.pickupAddress?.postcode || '',
                                coordinates: {
                                  lat: editedSegment.pickupAddress?.lat || segment.pickupAddress?.lat || 0,
                                  lng: editedSegment.pickupAddress?.lng || segment.pickupAddress?.lng || 0,
                                },
                                houseNumber: '',
                                flatNumber: '',
                                city: '',
                                formatted_address: editedSegment.pickupAddress?.label || segment.pickupAddress?.label || '',
                                place_name: editedSegment.pickupAddress?.label || segment.pickupAddress?.label || '',
                              } as any}
                              onChange={(address: any) => {
                                if (address) {
                                  updateSegment({
                                    pickupAddress: {
                                      label: address.formatted_address || address.address || address.place_name || '',
                                      postcode: address.postcode || '',
                                      lat: address.coordinates?.lat || null,
                                      lng: address.coordinates?.lng || null,
                                    }
                                  });
                                }
                              }}
                              placeholder="Enter pickup address..."
                              isRequired={false}
                            />
                            <FormControl>
                              <FormLabel color={textColor} fontSize="xs">Floor Number</FormLabel>
                              <NumberInput
                                value={editedSegment.pickupProperty?.floors || segment.pickupProperty?.floors || 0}
                                onChange={(valueString) => {
                                  const value = parseInt(valueString) || 0;
                                  updateSegment({
                                    pickupProperty: {
                                      ...(editedSegment.pickupProperty || segment.pickupProperty || {}),
                                      floors: value,
                                      propertyType: editedSegment.pickupProperty?.propertyType || segment.pickupProperty?.propertyType || 'DETACHED',
                                      accessType: editedSegment.pickupProperty?.accessType || segment.pickupProperty?.accessType || 'WITHOUT_LIFT',
                                    }
                                  });
                                }}
                                min={0}
                                max={50}
                              >
                                <NumberInputField
                                  bg={cardBg}
                                  color={textColor}
                                  borderColor={borderColor}
                                  _hover={{ borderColor: '#2563eb' }}
                                  _focus={{ borderColor: '#2563eb', bg: cardBg }}
                                />
                              </NumberInput>
                            </FormControl>
                            <FormControl>
                              <FormLabel color={textColor} fontSize="xs">Access Type</FormLabel>
                              <Select
                                value={editedSegment.pickupProperty?.accessType || segment.pickupProperty?.accessType || 'WITHOUT_LIFT'}
                                onChange={(e) => updateSegment({
                                  pickupProperty: {
                                    ...(editedSegment.pickupProperty || segment.pickupProperty || {}),
                                    accessType: e.target.value,
                                    propertyType: editedSegment.pickupProperty?.propertyType || segment.pickupProperty?.propertyType || 'DETACHED',
                                    floors: editedSegment.pickupProperty?.floors || segment.pickupProperty?.floors || 0,
                                  }
                                })}
                                bg={cardBg}
                                color={textColor}
                                borderColor={borderColor}
                                _hover={{ borderColor: '#2563eb' }}
                                _focus={{ borderColor: '#2563eb', bg: cardBg }}
                              >
                                <option value="WITH_LIFT">With Lift</option>
                                <option value="WITHOUT_LIFT">Without Lift (Stairs)</option>
                              </Select>
                            </FormControl>
                          </VStack>
                        ) : (
                          <>
                            <Text fontSize="sm" color={textColor}>
                              {segment.pickupAddress?.label || 'N/A'}
                            </Text>
                            <Text fontSize="xs" color={secondaryTextColor}>
                              {segment.pickupAddress?.postcode || ''}
                            </Text>
                            {segment.pickupProperty && (
                              <HStack spacing={2} mt={1}>
                                <Badge size="xs" colorScheme="gray">
                                  {segment.pickupProperty.propertyType}
                                </Badge>
                                <Badge size="xs" colorScheme="gray">
                                  Floor: {segment.pickupProperty.floors}
                                </Badge>
                                <Badge size="xs" colorScheme="gray">
                                  {segment.pickupProperty.accessType.replace('_', ' ')}
                                </Badge>
                              </HStack>
                            )}
                          </>
                        )}
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Dropoff Address */}
                  <Box p={2} bg="rgba(239, 68, 68, 0.1)" borderRadius="md" borderWidth={1} borderColor="#ef4444">
                    <HStack align="start" spacing={2}>
                      <FiMapPin color="#ef4444" />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="xs" fontWeight="bold" color="#ef4444">
                          Dropoff Location
                        </Text>
                        {isSegmentEditable ? (
                          <VStack align="stretch" spacing={2} w="full">
                            <UKAddressAutocomplete
                              id={`segment-${segment.id}-dropoff`}
                              label=""
                              value={{
                                address: editedSegment.dropoffAddress?.label || segment.dropoffAddress?.label || '',
                                postcode: editedSegment.dropoffAddress?.postcode || segment.dropoffAddress?.postcode || '',
                                coordinates: {
                                  lat: editedSegment.dropoffAddress?.lat || segment.dropoffAddress?.lat || 0,
                                  lng: editedSegment.dropoffAddress?.lng || segment.dropoffAddress?.lng || 0,
                                },
                                houseNumber: '',
                                flatNumber: '',
                                city: '',
                                formatted_address: editedSegment.dropoffAddress?.label || segment.dropoffAddress?.label || '',
                                place_name: editedSegment.dropoffAddress?.label || segment.dropoffAddress?.label || '',
                              } as any}
                              onChange={(address: any) => {
                                if (address) {
                                  updateSegment({
                                    dropoffAddress: {
                                      label: address.formatted_address || address.address || address.place_name || '',
                                      postcode: address.postcode || '',
                                      lat: address.coordinates?.lat || null,
                                      lng: address.coordinates?.lng || null,
                                    }
                                  });
                                }
                              }}
                              placeholder="Enter dropoff address..."
                              isRequired={false}
                            />
                            <FormControl>
                              <FormLabel color={textColor} fontSize="xs">Floor Number</FormLabel>
                              <NumberInput
                                value={editedSegment.dropoffProperty?.floors || segment.dropoffProperty?.floors || 0}
                                onChange={(valueString) => {
                                  const value = parseInt(valueString) || 0;
                                  updateSegment({
                                    dropoffProperty: {
                                      ...(editedSegment.dropoffProperty || segment.dropoffProperty || {}),
                                      floors: value,
                                      propertyType: editedSegment.dropoffProperty?.propertyType || segment.dropoffProperty?.propertyType || 'DETACHED',
                                      accessType: editedSegment.dropoffProperty?.accessType || segment.dropoffProperty?.accessType || 'WITHOUT_LIFT',
                                    }
                                  });
                                }}
                                min={0}
                                max={50}
                              >
                                <NumberInputField
                                  bg={cardBg}
                                  color={textColor}
                                  borderColor={borderColor}
                                  _hover={{ borderColor: '#2563eb' }}
                                  _focus={{ borderColor: '#2563eb', bg: cardBg }}
                                />
                              </NumberInput>
                            </FormControl>
                            <FormControl>
                              <FormLabel color={textColor} fontSize="xs">Access Type</FormLabel>
                              <Select
                                value={editedSegment.dropoffProperty?.accessType || segment.dropoffProperty?.accessType || 'WITHOUT_LIFT'}
                                onChange={(e) => updateSegment({
                                  dropoffProperty: {
                                    ...(editedSegment.dropoffProperty || segment.dropoffProperty || {}),
                                    accessType: e.target.value,
                                    propertyType: editedSegment.dropoffProperty?.propertyType || segment.dropoffProperty?.propertyType || 'DETACHED',
                                    floors: editedSegment.dropoffProperty?.floors || segment.dropoffProperty?.floors || 0,
                                  }
                                })}
                                bg={cardBg}
                                color={textColor}
                                borderColor={borderColor}
                                _hover={{ borderColor: '#2563eb' }}
                                _focus={{ borderColor: '#2563eb', bg: cardBg }}
                              >
                                <option value="WITH_LIFT">With Lift</option>
                                <option value="WITHOUT_LIFT">Without Lift (Stairs)</option>
                              </Select>
                            </FormControl>
                          </VStack>
                        ) : (
                          <>
                            <Text fontSize="sm" color={textColor}>
                              {segment.dropoffAddress?.label || 'N/A'}
                            </Text>
                            <Text fontSize="xs" color={secondaryTextColor}>
                              {segment.dropoffAddress?.postcode || ''}
                            </Text>
                            {segment.dropoffProperty && (
                              <HStack spacing={2} mt={1}>
                                <Badge size="xs" colorScheme="gray">
                                  {segment.dropoffProperty.propertyType}
                                </Badge>
                                <Badge size="xs" colorScheme="gray">
                                  Floor: {segment.dropoffProperty.floors}
                                </Badge>
                                <Badge size="xs" colorScheme="gray">
                                  {segment.dropoffProperty.accessType.replace('_', ' ')}
                                </Badge>
                              </HStack>
                            )}
                          </>
                        )}
                      </VStack>
                    </HStack>
                  </Box>

                {/* Schedule & Timing */}
                <VStack align="stretch" spacing={2}>
                  {isSegmentEditable ? (
                    <FormControl>
                      <FormLabel color={textColor} fontSize="xs">Scheduled Date & Time</FormLabel>
                      <Input
                        type="datetime-local"
                        value={editedSegment.scheduledAt ? new Date(editedSegment.scheduledAt).toISOString().slice(0, 16) : segment.scheduledAt ? new Date(segment.scheduledAt).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const dateValue = e.target.value ? new Date(e.target.value).toISOString() : segment.scheduledAt;
                          updateSegment({ scheduledAt: dateValue });
                        }}
                        bg={cardBg}
                        color={textColor}
                        borderColor={borderColor}
                        _hover={{ borderColor: '#2563eb' }}
                        _focus={{ borderColor: '#2563eb', bg: cardBg }}
                      />
                    </FormControl>
                  ) : (
                    <>
                      <HStack>
                        <FiClock color={secondaryTextColor} />
                        <Text fontSize="xs" color={secondaryTextColor}>
                          Scheduled: {formatDateTime(segment.scheduledAt)}
                        </Text>
                      </HStack>
                      {segment.estimatedArrival && (
                        <HStack>
                          <FiClock color={secondaryTextColor} />
                          <Text fontSize="xs" color={secondaryTextColor}>
                            Estimated Arrival: {formatDateTime(segment.estimatedArrival)}
                          </Text>
                        </HStack>
                      )}
                    </>
                  )}
                  {!isSegmentEditable && segment.distanceMeters && (
                    <HStack>
                      <FiNavigation color={secondaryTextColor} />
                      <Text fontSize="xs" color={secondaryTextColor}>
                        Distance: {formatDistance(segment.distanceMeters)}
                      </Text>
                    </HStack>
                  )}
                  {!isSegmentEditable && segment.durationSeconds && (
                    <HStack>
                      <FiClock color={secondaryTextColor} />
                      <Text fontSize="xs" color={secondaryTextColor}>
                        Duration: {formatDuration(segment.durationSeconds)}
                      </Text>
                    </HStack>
                  )}
                </VStack>

                {/* Items */}
                {segment.items && Array.isArray(segment.items) && segment.items.length > 0 && !isSegmentEditable && (
                  <Box p={2} bg="rgba(59, 130, 246, 0.1)" borderRadius="md" borderWidth={1} borderColor="#3b82f6">
                    <Text fontSize="xs" fontWeight="bold" color="#3b82f6" mb={1}>
                      Items for this journey ({segment.items.length})
                    </Text>
                    <VStack align="start" spacing={1}>
                      {segment.items.map((item: any, itemIdx: number) => (
                        <Text key={itemIdx} fontSize="xs" color={secondaryTextColor}>
                          - {item.name} (Qty: {item.quantity})
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Notes */}
                {isSegmentEditable ? (
                  <FormControl>
                    <FormLabel color={textColor} fontSize="xs">Notes</FormLabel>
                    <Textarea
                      value={editedSegment.notes || segment.notes || ''}
                      onChange={(e) => updateSegment({ notes: e.target.value })}
                      placeholder="Add notes for this journey..."
                      bg={cardBg}
                      color={textColor}
                      borderColor={borderColor}
                      _hover={{ borderColor: '#2563eb' }}
                      _focus={{ borderColor: '#2563eb', bg: cardBg }}
                      rows={3}
                    />
                  </FormControl>
                ) : segment.notes ? (
                  <Box p={2} bg="rgba(0, 0, 0, 0.3)" borderRadius="md">
                    <HStack align="start" spacing={2}>
                      <FiMessageSquare color={secondaryTextColor} />
                      <Text fontSize="xs" color={secondaryTextColor}>
                        Notes: {segment.notes}
                      </Text>
                    </HStack>
                  </Box>
                ) : null}
              </VStack>
            </CardBody>
          </Card>
          );
        })}
    </VStack>
  );
}

