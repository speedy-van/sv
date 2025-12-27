'use client';

import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Box,
  Progress,
  Card,
  CardBody,
  SimpleGrid,
  Button,
  IconButton,
  Input,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiClock, FiDollarSign, FiTruck, FiEdit } from 'react-icons/fi';
import { OrderDetail } from '../OrderDetailDrawer';
import { OrderTimeline } from '../OrderTimeline';
import { JourneyRelationshipCard } from '../JourneyRelationshipCard';
import { OrderMapPreview } from '../OrderMapPreview';
import PaymentConfirmationButton from '../PaymentConfirmationButton';
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';

interface OrderOverviewTabProps {
  order: OrderDetail;
  bgColor: string;
  textColor: string;
  borderColor: string;
  cardBg: string;
  secondaryTextColor: string;
  completenessData?: any;
  showSummaryCards?: boolean;
  onRefresh?: () => void;
  onEdit?: () => void;
  isEditing?: boolean;
  editedOrder?: Partial<OrderDetail>;
  setEditedOrder?: React.Dispatch<React.SetStateAction<Partial<OrderDetail>>>;
  onRecalculatePrice?: () => Promise<number | null>;
  isRecalculatingPrice?: boolean;
  newCalculatedPrice?: number | null;
}

export function OrderOverviewTab({
  order,
  bgColor,
  textColor,
  borderColor,
  cardBg,
  secondaryTextColor,
  completenessData,
  showSummaryCards = true,
  onRefresh,
  onEdit,
  isEditing = false,
  editedOrder,
  setEditedOrder,
  onRecalculatePrice,
  isRecalculatingPrice = false,
  newCalculatedPrice,
}: OrderOverviewTabProps) {
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING_PAYMENT: 'orange',
      CONFIRMED: 'blue',
      IN_PROGRESS: 'purple',
      COMPLETED: 'green',
      CANCELLED: 'red',
      REFUNDED: 'gray',
    };
    return statusMap[status] || 'gray';
  };

  const getStatusIcon = (hasValue: boolean, isRequired: boolean) => {
    if (hasValue) {
      return <Text color="#10b981" fontSize="xs">✓</Text>;
    }
    if (isRequired) {
      return <Text color="#ef4444" fontSize="xs">✗</Text>;
    }
    return <Text color={secondaryTextColor} fontSize="xs">-</Text>;
  };

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

  return (
    <VStack spacing={6} align="stretch">
      {/* Data Completeness Summary */}
      {showSummaryCards && completenessData && (
        <Box mt={12} p={4} borderRadius="md" bg={cardBg} borderWidth={1} borderColor={borderColor}>
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontWeight="bold" fontSize="md" color={textColor}>
                Data Completeness
              </Text>
              <HStack spacing={2}>
                <Text fontSize="sm" fontWeight="bold" color={
                  completenessData.completenessScore >= 80 ? '#10b981' :
                  completenessData.completenessScore >= 60 ? '#f59e0b' : '#ef4444'
                }>
                  {completenessData.completenessScore}%
                </Text>
                <Progress
                  value={completenessData.completenessScore}
                  size="sm"
                  w="100px"
                  colorScheme={
                    completenessData.completenessScore >= 80 ? 'green' :
                    completenessData.completenessScore >= 60 ? 'orange' : 'red'
                  }
                />
              </HStack>
            </HStack>
            
            {completenessData && ((completenessData.critical && completenessData.critical.length > 0) || (completenessData.warning && completenessData.warning.length > 0)) && (
              <VStack spacing={1} align="stretch">
                {completenessData.critical && completenessData.critical.map((issue: any, index: number) => (
                  <HStack key={`critical-${index}`} spacing={2}>
                    <Text color="#ef4444" fontSize="xs">✗</Text>
                    <Text fontSize="xs" color="#ef4444">
                      {issue.message}
                    </Text>
                  </HStack>
                ))}
                {completenessData.warning && completenessData.warning.map((issue: any, index: number) => (
                  <HStack key={`warning-${index}`} spacing={2}>
                    <Text color="#f59e0b" fontSize="xs">⚠</Text>
                    <Text fontSize="xs" color="#f59e0b">
                      {issue.message}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            )}
            
            {completenessData && (!completenessData.critical || completenessData.critical.length === 0) && (!completenessData.warning || completenessData.warning.length === 0) && (
              <HStack spacing={2}>
                <Text color="#10b981" fontSize="xs">✓</Text>
                <Text fontSize="xs" color="#10b981">
                  All critical information provided
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>
      )}

      <Divider borderColor={borderColor} />

      {/* Order Status */}
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text fontWeight="bold" color={textColor}>Status</Text>
          <HStack spacing={2}>
            <Badge colorScheme={getStatusColor(order.status)} size="lg">
              {order.status.replace('_', ' ')}
            </Badge>
            {order.serviceType && (
              <Badge 
                colorScheme={
                  order.serviceType === 'economy' ? 'blue' :
                  order.serviceType === 'express' ? 'red' :
                  'green'
                }
                size="md"
              >
                {order.serviceType === 'economy' ? 'Economy' :
                 order.serviceType === 'express' ? 'Express' :
                 'Standard'}
              </Badge>
            )}
            {order.crewSize && (
              <Badge 
                colorScheme="orange" 
                size="md"
                title="Number of helpers"
              >
                👷 {order.crewSize === 'ONE' ? '1 Man' :
                   order.crewSize === 'TWO' ? '2 Men' :
                   order.crewSize === 'THREE' ? '3 Men' :
                   order.crewSize === 'FOUR' ? '4 Men' :
                   '2 Men'}
              </Badge>
            )}
            {order.isMultiDrop || order.orderType === 'multi-drop' ? (
              <Badge colorScheme="purple" size="md">
                Multi-Drop Route
              </Badge>
            ) : (
              <Badge colorScheme="gray" size="md">
                Single Order
              </Badge>
            )}
            {order.route && (
              <Badge colorScheme="purple" variant="outline" size="md">
                Route: {order.route.reference} ({order.route.totalDrops} drops)
              </Badge>
            )}
          </HStack>
        </HStack>

        {/* Payment Confirmation Button */}
        {order.status === 'PENDING_PAYMENT' && (
          <PaymentConfirmationButton
            booking={{
              id: order.id,
              reference: order.reference,
              status: order.status,
              totalGBP: order.totalGBP,
              customerName: order.customerName,
              paidAt: order.paidAt
            }}
            onSuccess={() => {
              if (onRefresh) onRefresh();
            }}
          />
        )}
      </VStack>

      <Divider borderColor={borderColor} />

      {/* Customer Information */}
      <VStack align="stretch" spacing={3}>
        <Text fontWeight="bold" fontSize="md" color={textColor}>
          Customer Information
        </Text>
        {isEditing && editedOrder && setEditedOrder ? (
          <>
            <FormControl>
              <FormLabel color={textColor} fontSize="sm">Customer Name</FormLabel>
              <Input
                value={editedOrder.customerName || ''}
                onChange={(e) => setEditedOrder({ ...editedOrder, customerName: e.target.value })}
                bg={cardBg}
                color={textColor}
                borderColor={borderColor}
                _hover={{ borderColor: '#2563eb' }}
                _focus={{ borderColor: '#2563eb', bg: cardBg }}
              />
            </FormControl>
            <FormControl>
              <FormLabel color={textColor} fontSize="sm">Email</FormLabel>
              <Input
                type="email"
                value={editedOrder.customerEmail || ''}
                onChange={(e) => setEditedOrder({ ...editedOrder, customerEmail: e.target.value })}
                bg={cardBg}
                color={textColor}
                borderColor={borderColor}
                _hover={{ borderColor: '#2563eb' }}
                _focus={{ borderColor: '#2563eb', bg: cardBg }}
              />
            </FormControl>
            <FormControl>
              <FormLabel color={textColor} fontSize="sm">Phone</FormLabel>
              <Input
                type="tel"
                value={editedOrder.customerPhone || ''}
                onChange={(e) => setEditedOrder({ ...editedOrder, customerPhone: e.target.value })}
                bg={cardBg}
                color={textColor}
                borderColor={borderColor}
                _hover={{ borderColor: '#2563eb' }}
                _focus={{ borderColor: '#2563eb', bg: cardBg }}
              />
            </FormControl>
          </>
        ) : (
          <>
            <HStack>
              <FiUser color={textColor} />
              <Text color={textColor}>{order.customerName}</Text>
            </HStack>
            <HStack>
              <FiMail color={secondaryTextColor} />
              <Text fontSize="sm" color={secondaryTextColor}>
                {order.customerEmail}
              </Text>
            </HStack>
            <HStack>
              <FiPhone color={secondaryTextColor} />
              {getStatusIcon(
                !!(order.customerPhone && order.customerPhone.length >= 10), 
                false
              )}
              <Text fontSize="sm" color={secondaryTextColor}>
                {order.customerPhone || 'NOT PROVIDED'}
              </Text>
            </HStack>
          </>
        )}
      </VStack>

      <Divider borderColor={borderColor} />

      {/* Addresses & Property Details */}
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="md" color={textColor}>
            Addresses & Property Details
          </Text>
          {onEdit && !isEditing && (
            <Button
              leftIcon={<FiEdit />}
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={onEdit}
              borderColor="#2563eb"
              color="#2563eb"
              _hover={{ bg: '#1a1a1a', borderColor: '#3b82f6' }}
            >
              Edit
            </Button>
          )}
        </HStack>
        <VStack align="stretch" spacing={4}>
          {/* Pickup */}
          <Box p={3} borderWidth={1} borderRadius="md" borderColor="#10b981" bg={cardBg}>
            <HStack align="start" spacing={3}>
              <FiMapPin color="#10b981" />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize="sm" fontWeight="bold" color="#10b981">
                  Pickup Location
                </Text>
                {isEditing && editedOrder && setEditedOrder ? (
                  <VStack align="stretch" spacing={2} w="full">
                    <Alert status="info" variant="subtle" bg="rgba(16, 185, 129, 0.1)" borderRadius="md" p={2}>
                      <AlertIcon color="#10b981" boxSize={3} />
                      <Text fontSize="xs" color={secondaryTextColor}>
                        Editing pickup - price will recalculate on save
                      </Text>
                    </Alert>
                    <FormControl>
                      <FormLabel color={textColor} fontSize="xs">Pickup Address</FormLabel>
                      <UKAddressAutocomplete
                        id="edit-pickup-address"
                        label=""
                        value={{
                          address: editedOrder.pickupAddress?.label || order?.pickupAddress?.label || '',
                          postcode: editedOrder.pickupAddress?.postcode || order?.pickupAddress?.postcode || '',
                          coordinates: {
                            lat: editedOrder.pickupAddress?.lat || order?.pickupAddress?.lat || 0,
                            lng: editedOrder.pickupAddress?.lng || order?.pickupAddress?.lng || 0,
                          },
                          houseNumber: '',
                          flatNumber: editedOrder.pickupAddress?.flatNumber || order?.pickupAddress?.flatNumber || '',
                          city: '',
                          formatted_address: editedOrder.pickupAddress?.label || order?.pickupAddress?.label || '',
                          place_name: editedOrder.pickupAddress?.label || order?.pickupAddress?.label || '',
                        } as any}
                        onChange={(address: any) => {
                          if (address) {
                            setEditedOrder({
                              ...editedOrder,
                              pickupAddress: {
                                label: address.formatted_address || address.address || address.place_name || '',
                                postcode: address.postcode || '',
                                flatNumber: address.flatNumber,
                                lat: address.coordinates?.lat || null,
                                lng: address.coordinates?.lng || null,
                              }
                            });
                          }
                        }}
                        placeholder="Enter pickup address..."
                        isRequired={false}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel color={textColor} fontSize="xs">Floor Number</FormLabel>
                      <NumberInput
                        value={editedOrder.pickupProperty?.floors || 0}
                        onChange={(valueString) => {
                          const value = parseInt(valueString) || 0;
                          setEditedOrder({
                            ...editedOrder,
                            pickupProperty: {
                              ...editedOrder.pickupProperty,
                              floors: value,
                              propertyType: editedOrder.pickupProperty?.propertyType || order?.pickupProperty?.propertyType || 'DETACHED',
                              accessType: editedOrder.pickupProperty?.accessType || order?.pickupProperty?.accessType || 'WITHOUT_LIFT',
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
                        value={editedOrder.pickupProperty?.accessType || order?.pickupProperty?.accessType || 'WITHOUT_LIFT'}
                        onChange={(e) => setEditedOrder({
                          ...editedOrder,
                          pickupProperty: {
                            ...editedOrder.pickupProperty,
                            accessType: e.target.value,
                            propertyType: editedOrder.pickupProperty?.propertyType || order?.pickupProperty?.propertyType || 'DETACHED',
                            floors: editedOrder.pickupProperty?.floors || order?.pickupProperty?.floors || 0,
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
                    {onRecalculatePrice && (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={onRecalculatePrice}
                        isLoading={isRecalculatingPrice}
                        loadingText="Calculating..."
                        borderColor="#2563eb"
                        color="#2563eb"
                        _hover={{ bg: '#1a1a1a' }}
                      >
                        Recalculate Price
                      </Button>
                    )}
                  </VStack>
                ) : (
                  <>
                    <Text fontSize="sm" color={textColor}>
                      {order.pickupAddress?.label || 'Not specified'}
                    </Text>
                    {order.pickupAddress?.postcode && (
                      <Text fontSize="xs" color={secondaryTextColor}>
                        Postcode: {order.pickupAddress.postcode}
                      </Text>
                    )}
                    {order.pickupProperty && (
                      <VStack align="start" spacing={0} mt={2}>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          Property: {order.pickupProperty.propertyType}
                        </Text>
                        <HStack spacing={1}>
                          {getStatusIcon(
                            order.pickupProperty.floors > 0, 
                            true
                          )}
                          <Text fontSize="xs" color={
                            order.pickupProperty.floors > 0 ? secondaryTextColor : "#ef4444"
                          }>
                            Floor: {order.pickupProperty.floors > 0 
                              ? order.pickupProperty.floors 
                              : 'NOT SPECIFIED'
                            }
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          Access: {order.pickupProperty.accessType.replace('_', ' ')}
                        </Text>
                      </VStack>
                    )}
                  </>
                )}
              </VStack>
            </HStack>
          </Box>

          {/* Dropoff */}
          <Box p={3} borderWidth={1} borderRadius="md" borderColor="#ef4444" bg={cardBg}>
            <HStack align="start" spacing={3}>
              <FiMapPin color="#ef4444" />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize="sm" fontWeight="bold" color="#ef4444">
                  Dropoff Location
                </Text>
                {isEditing && editedOrder && setEditedOrder ? (
                  <VStack align="stretch" spacing={2} w="full">
                    <Alert status="info" variant="subtle" bg="rgba(239, 68, 68, 0.1)" borderRadius="md" p={2}>
                      <AlertIcon color="#ef4444" boxSize={3} />
                      <Text fontSize="xs" color={secondaryTextColor}>
                        Editing delivery - price will recalculate on save
                      </Text>
                    </Alert>
                    <FormControl>
                      <FormLabel color={textColor} fontSize="xs">Delivery Address</FormLabel>
                      <UKAddressAutocomplete
                        id="edit-dropoff-address"
                        label=""
                        value={{
                          address: editedOrder.dropoffAddress?.label || order?.dropoffAddress?.label || '',
                          postcode: editedOrder.dropoffAddress?.postcode || order?.dropoffAddress?.postcode || '',
                          coordinates: {
                            lat: editedOrder.dropoffAddress?.lat || order?.dropoffAddress?.lat || 0,
                            lng: editedOrder.dropoffAddress?.lng || order?.dropoffAddress?.lng || 0,
                          },
                          houseNumber: '',
                          flatNumber: editedOrder.dropoffAddress?.flatNumber || order?.dropoffAddress?.flatNumber || '',
                          city: '',
                          formatted_address: editedOrder.dropoffAddress?.label || order?.dropoffAddress?.label || '',
                          place_name: editedOrder.dropoffAddress?.label || order?.dropoffAddress?.label || '',
                        } as any}
                        onChange={(address: any) => {
                          if (address) {
                            setEditedOrder({
                              ...editedOrder,
                              dropoffAddress: {
                                label: address.formatted_address || address.address || address.place_name || '',
                                postcode: address.postcode || '',
                                flatNumber: address.flatNumber,
                                lat: address.coordinates?.lat || null,
                                lng: address.coordinates?.lng || null,
                              }
                            });
                          }
                        }}
                        placeholder="Enter delivery address..."
                        isRequired={false}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel color={textColor} fontSize="xs">Floor Number</FormLabel>
                      <NumberInput
                        value={editedOrder.dropoffProperty?.floors || 0}
                        onChange={(valueString) => {
                          const value = parseInt(valueString) || 0;
                          setEditedOrder({
                            ...editedOrder,
                            dropoffProperty: {
                              ...editedOrder.dropoffProperty,
                              floors: value,
                              propertyType: editedOrder.dropoffProperty?.propertyType || order?.dropoffProperty?.propertyType || 'DETACHED',
                              accessType: editedOrder.dropoffProperty?.accessType || order?.dropoffProperty?.accessType || 'WITHOUT_LIFT',
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
                        value={editedOrder.dropoffProperty?.accessType || order?.dropoffProperty?.accessType || 'WITHOUT_LIFT'}
                        onChange={(e) => setEditedOrder({
                          ...editedOrder,
                          dropoffProperty: {
                            ...editedOrder.dropoffProperty,
                            accessType: e.target.value,
                            propertyType: editedOrder.dropoffProperty?.propertyType || order?.dropoffProperty?.propertyType || 'DETACHED',
                            floors: editedOrder.dropoffProperty?.floors || order?.dropoffProperty?.floors || 0,
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
                    {onRecalculatePrice && (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={onRecalculatePrice}
                        isLoading={isRecalculatingPrice}
                        loadingText="Calculating..."
                        borderColor="#2563eb"
                        color="#2563eb"
                        _hover={{ bg: '#1a1a1a' }}
                      >
                        Recalculate Price
                      </Button>
                    )}
                  </VStack>
                ) : (
                  <>
                    <Text fontSize="sm" color={textColor}>
                      {order.dropoffAddress?.label || 'Not specified'}
                    </Text>
                    {order.dropoffAddress?.postcode && (
                      <Text fontSize="xs" color={secondaryTextColor}>
                        Postcode: {order.dropoffAddress.postcode}
                      </Text>
                    )}
                    {order.dropoffProperty && (
                      <VStack align="start" spacing={0} mt={2}>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          Property: {order.dropoffProperty.propertyType}
                        </Text>
                        <HStack spacing={1}>
                          {getStatusIcon(
                            order.dropoffProperty.floors > 0, 
                            true
                          )}
                          <Text fontSize="xs" color={
                            order.dropoffProperty.floors > 0 ? secondaryTextColor : "#ef4444"
                          }>
                            Floor: {order.dropoffProperty.floors > 0 
                              ? order.dropoffProperty.floors 
                              : 'NOT SPECIFIED'
                            }
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          Access: {order.dropoffProperty.accessType.replace('_', ' ')}
                        </Text>
                      </VStack>
                    )}
                  </>
                )}
              </VStack>
            </HStack>
          </Box>
        </VStack>
      </VStack>

      {/* Route Map Preview */}
      {order.pickupAddress && order.dropoffAddress && (
        <>
          <VStack align="stretch" spacing={3}>
            <Text fontWeight="bold" fontSize="md" color={textColor}>
              Route Map
            </Text>
            <OrderMapPreview
              pickupLocation={
                order.pickupAddress.lat && order.pickupAddress.lng
                  ? {
                      lat: order.pickupAddress.lat,
                      lng: order.pickupAddress.lng,
                      label: order.pickupAddress.label,
                    }
                  : null
              }
              dropoffLocation={
                order.dropoffAddress.lat && order.dropoffAddress.lng
                  ? {
                      lat: order.dropoffAddress.lat,
                      lng: order.dropoffAddress.lng,
                      label: order.dropoffAddress.label,
                    }
                  : null
              }
              height="300px"
              bgColor={bgColor}
              borderColor={borderColor}
            />
          </VStack>
          <Divider borderColor={borderColor} />
        </>
      )}

      {/* Journey Relationship Card */}
      {order.segments && order.segments.length > 1 && (
        <>
          <JourneyRelationshipCard
            mainBooking={{
              reference: order.reference,
              totalGBP: order.totalGBP,
              scheduledAt: order.scheduledAt,
            }}
            segments={order.segments}
            bgColor={bgColor}
            textColor={textColor}
            borderColor={borderColor}
            cardBg={cardBg}
            secondaryTextColor={secondaryTextColor}
          />
          <Divider borderColor={borderColor} />
        </>
      )}

      {/* Driver Information */}
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="md" color={textColor}>
            Driver Information
          </Text>
        </HStack>
        {order.driver && order.driver.user ? (
          <VStack align="stretch" spacing={2}>
            <HStack>
              <FiTruck color={textColor} />
              <Text color={textColor}>{order.driver.user.name}</Text>
            </HStack>
            <HStack>
              <FiMail color={secondaryTextColor} />
              <Text fontSize="sm" color={secondaryTextColor}>
                {order.driver.user.email}
              </Text>
            </HStack>
            {order.driver.user.phone && (
              <HStack>
                <FiPhone color={secondaryTextColor} />
                <Text fontSize="sm" color={secondaryTextColor}>
                  {order.driver.user.phone}
                </Text>
              </HStack>
            )}
          </VStack>
        ) : (
          <Text fontSize="sm" color={secondaryTextColor}>
            No driver assigned
          </Text>
        )}
      </VStack>

      <Divider borderColor={borderColor} />

      {/* Pricing & Payment */}
      <VStack align="stretch" spacing={3}>
        <Text fontWeight="bold" fontSize="md" color={textColor}>
          Pricing & Payment
        </Text>
        <SimpleGrid columns={2} spacing={4}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color={secondaryTextColor}>Total Price</Text>
                <Text fontSize="lg" fontWeight="bold" color="#10b981">
                  {formatCurrency(order.totalGBP)}
                </Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color={secondaryTextColor}>Amount Paid</Text>
                <Text fontSize="lg" fontWeight="bold" color={order.paidAt ? '#10b981' : '#f59e0b'}>
                  {formatCurrency(order.amountPaidGBP || 0)}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
        {order.paidAt && (
          <HStack>
            <FiClock color={secondaryTextColor} />
            <Text fontSize="sm" color={secondaryTextColor}>
              Paid on: {formatDateTime(order.paidAt)}
            </Text>
          </HStack>
        )}
      </VStack>
    </VStack>
  );
}

