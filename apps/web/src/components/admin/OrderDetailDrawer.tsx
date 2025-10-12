'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Divider,
  Box,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Progress,
  Tooltip,
  Input,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FiMapPin,
  FiClock,
  FiUser,
  FiTruck,
  FiDollarSign,
  FiEdit,
  FiMail,
  FiPhone,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiSave,
  FiTrash2,
} from 'react-icons/fi';
import PaymentConfirmationButton from './PaymentConfirmationButton';

interface OrderDetail {
  id: string;
  reference: string;
  status: string;
  scheduledAt: string;
  totalGBP: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupAddress?: {
    label: string;
    postcode: string;
    flatNumber?: string;
  };
  dropoffAddress?: {
    label: string;
    postcode: string;
    flatNumber?: string;
  };
  pickupProperty?: {
    propertyType: string;
    floors: number;
    accessType: string;
  };
  dropoffProperty?: {
    propertyType: string;
    floors: number;
    accessType: string;
  };
  driver?: {
    user: {
      name: string;
      email: string;
      phone: string;
    };
  };
  createdAt: string;
  paidAt?: string;
  durationSeconds?: number;
  distanceMeters?: number;
  baseDistanceMiles?: number;
  notes?: string;
  pickupTimeSlot?: string;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    volumeM3: number;
    image?: string;
  }>;
}

interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode?: string;
}

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  isOpen,
  onClose,
  orderCode,
}) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Partial<OrderDetail>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [assignmentReason, setAssignmentReason] = useState<string>('');
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [isRemovingDriver, setIsRemovingDriver] = useState(false);
  
  const toast = useToast();
  const { 
    isOpen: isCancelModalOpen, 
    onOpen: onCancelModalOpen, 
    onClose: onCancelModalClose 
  } = useDisclosure();
  const { 
    isOpen: isAssignModalOpen, 
    onOpen: onAssignModalOpen, 
    onClose: onAssignModalClose 
  } = useDisclosure();

  // Auto-load drivers when assign modal opens
  useEffect(() => {
    if (isAssignModalOpen && availableDrivers.length === 0) {
      loadAvailableDrivers();
    }
  }, [isAssignModalOpen]);

  // Auto-select driver if only one is available
  useEffect(() => {
    if (availableDrivers.length === 1 && !selectedDriverId && isAssignModalOpen) {
      const singleDriver = availableDrivers[0];
      if (singleDriver.isAvailable) {
        setSelectedDriverId(singleDriver.id);
        toast({
          title: 'Driver Auto-Selected',
          description: `Automatically selected ${singleDriver.name} as the only available driver`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [availableDrivers, selectedDriverId, isAssignModalOpen]);
  const { 
    isOpen: isRemoveModalOpen, 
    onOpen: onRemoveModalOpen, 
    onClose: onRemoveModalClose 
  } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isOpen && orderCode) {
      fetchOrderDetails();
    }
  }, [isOpen, orderCode]);

  const fetchOrderDetails = async () => {
    if (!orderCode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const orderData = await response.json();
      setOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      case 'in_progress':
        return 'blue';
      case 'CONFIRMED':
        return 'yellow';
      case 'DRAFT':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatCurrency = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return '-';
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Data completeness checks
  const getDataCompletenessStatus = (order: OrderDetail) => {
    const issues: Array<{ type: 'critical' | 'warning' | 'info'; message: string }> = [];
    
    // Critical missing data
    if (!order.pickupProperty?.floors || order.pickupProperty.floors === 0) {
      issues.push({ type: 'critical', message: 'Pickup floor number missing' });
    }
    if (!order.dropoffProperty?.floors || order.dropoffProperty.floors === 0) {
      issues.push({ type: 'critical', message: 'Dropoff floor number missing' });
    }
    if (!order.pickupAddress?.flatNumber && order.pickupProperty?.propertyType === 'FLAT') {
      issues.push({ type: 'critical', message: 'Pickup flat/unit number missing' });
    }
    if (!order.dropoffAddress?.flatNumber && order.dropoffProperty?.propertyType === 'FLAT') {
      issues.push({ type: 'critical', message: 'Dropoff flat/unit number missing' });
    }
    if (!order.baseDistanceMiles && !order.distanceMeters) {
      issues.push({ type: 'critical', message: 'Distance information missing' });
    }
    
    // Warning level missing data
    if (!order.pickupTimeSlot) {
      issues.push({ type: 'warning', message: 'Time slot preference not specified' });
    }
    if (!order.items || order.items.length === 0) {
      issues.push({ type: 'warning', message: 'No items listed' });
    }
    if (!order.customerPhone || order.customerPhone.length < 10) {
      issues.push({ type: 'warning', message: 'Customer phone number incomplete' });
    }
    
    // Info level
    if (!order.notes) {
      issues.push({ type: 'info', message: 'No customer notes provided' });
    }
    if (order.items?.some(item => !item.image)) {
      issues.push({ type: 'info', message: 'Some items missing images' });
    }

    return {
      critical: issues.filter(i => i.type === 'critical'),
      warning: issues.filter(i => i.type === 'warning'),
      info: issues.filter(i => i.type === 'info'),
      total: issues.length,
      completenessScore: Math.max(0, 100 - (issues.filter(i => i.type === 'critical').length * 20) - (issues.filter(i => i.type === 'warning').length * 10) - (issues.filter(i => i.type === 'info').length * 5))
    };
  };

  const getStatusIcon = (hasData: boolean, isRequired: boolean = false) => {
    if (hasData) {
      return <FiCheckCircle color="green" size={16} />;
    }
    if (isRequired) {
      return <FiXCircle color="red" size={16} />;
    }
    return <FiAlertTriangle color="orange" size={16} />;
  };

  // Memoize data completeness calculation to prevent setState during render
  const completenessData = useMemo(() => {
    if (!order) return null;
    return getDataCompletenessStatus(order);
  }, [order]);

  // Handle edit mode
  const handleEditStart = () => {
    setIsEditing(true);
    setEditedOrder({
      customerName: order?.customerName,
      customerEmail: order?.customerEmail,
      customerPhone: order?.customerPhone,
      scheduledAt: order?.scheduledAt,
      pickupTimeSlot: order?.pickupTimeSlot,
      notes: order?.notes,
      pickupProperty: order?.pickupProperty,
      dropoffProperty: order?.dropoffProperty,
    });
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedOrder({});
  };

  const handleEditSave = async () => {
    if (!order) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.reference}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedOrder),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      setIsEditing(false);
      setEditedOrder({});

      toast({
        title: 'Order Updated',
        description: 'Order details have been successfully updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh the order details
      fetchOrderDetails();

    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update order',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle sending confirmation email
  const handleSendConfirmationEmail = async () => {
    if (!order) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.reference}/send-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send confirmation email');
      }

      const result = await response.json();

      toast({
        title: 'Email Sent Successfully',
        description: result.hasFloorWarnings
          ? 'Confirmation email sent with floor number warnings.'
          : 'Confirmation email sent to customer.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      toast({
        title: 'Email Failed',
        description: error instanceof Error ? error.message : 'Failed to send confirmation email',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle sending floor warning email
  const handleSendFloorWarningEmail = async () => {
    if (!order) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.reference}/send-floor-warning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send floor warning email');
      }

      const result = await response.json();

      if (result.sent) {
        toast({
          title: 'Floor Warning Email Sent',
          description: 'Floor warning email sent to customer successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'No Floor Warning Needed',
          description: result.message || 'This order does not need floor warnings.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

    } catch (error) {
      toast({
        title: 'Floor Warning Email Failed',
        description: error instanceof Error ? error.message : 'Failed to send floor warning email',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle order cancellation with enhanced driver removal
  const handleCancelOrder = async () => {
    if (!order) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.reference}/cancel-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Cancelled by admin',
          notifyCustomer: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      const result = await response.json();

      toast({
        title: 'Order Cancelled',
        description: `Order ${order.reference} has been cancelled successfully. ${result.data.driverRemoved ? 'Driver removed and notified.' : ''}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onCancelModalClose();
      onClose(); // Close the drawer
      
      // Trigger a refresh of the orders list if needed
      window.location.reload();

    } catch (error) {
      toast({
        title: 'Cancellation Failed',
        description: error instanceof Error ? error.message : 'Failed to cancel order',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Load available drivers
  const loadAvailableDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      console.log('🚗 Loading available drivers...');
      const response = await fetch('/api/admin/drivers/available');
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Driver loading failed:', response.status, errorData);
        throw new Error(`Failed to load drivers: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Drivers loaded:', data);
      
      if (data.success && data.data && data.data.drivers) {
        setAvailableDrivers(data.data.drivers);
        console.log(`📋 Set ${data.data.drivers.length} drivers in state`);
        
        if (data.data.drivers.length === 0) {
          toast({
            title: 'No Drivers Available',
            description: `No active drivers found. Total in system: ${data.data.total || 0}`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('❌ Error loading drivers:', error);
      toast({
        title: 'Error Loading Drivers',
        description: error instanceof Error ? error.message : 'Failed to load available drivers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setAvailableDrivers([]); // Clear the list on error
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  // Handle driver assignment
  const handleAssignDriver = async () => {
    if (!order || !selectedDriverId) return;

    console.log('🚗 Assigning driver:', {
      orderReference: order.reference,
      selectedDriverId,
      assignmentReason: assignmentReason || 'Assigned by admin'
    });

    setIsAssigningDriver(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.reference}/assign-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId: selectedDriverId,
          reason: assignmentReason || 'Assigned by admin',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign driver');
      }

      const result = await response.json();

      toast({
        title: 'Driver Assigned',
        description: `Driver ${result.data.driver.name} has been assigned to order ${order.reference}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onAssignModalClose();
      setSelectedDriverId('');
      setAssignmentReason('');
      
      // Refresh order details
      fetchOrderDetails();

    } catch (error) {
      toast({
        title: 'Assignment Failed',
        description: error instanceof Error ? error.message : 'Failed to assign driver',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAssigningDriver(false);
    }
  };

  // Handle driver removal
  const handleRemoveDriver = async () => {
    if (!order) return;

    setIsRemovingDriver(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.reference}/remove-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Removed by admin',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove driver');
      }

      const result = await response.json();

      toast({
        title: 'Driver Removed',
        description: `Driver ${result.data.removedDriver.name} has been removed from order ${order.reference}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onRemoveModalClose();
      
      // Refresh order details
      fetchOrderDetails();

    } catch (error) {
      toast({
        title: 'Removal Failed',
        description: error instanceof Error ? error.message : 'Failed to remove driver',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRemovingDriver(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="lg">
      <DrawerOverlay />
      <DrawerContent bg={bgColor}>
        <DrawerCloseButton />
        <DrawerHeader borderBottom={`1px solid ${borderColor}`}>
          <VStack align="start" spacing={2}>
            <Text fontSize="lg" fontWeight="bold">
              Order Details
            </Text>
            {orderCode && (
              <Text fontSize="sm" color="gray.600">
                #{orderCode}
              </Text>
            )}
          </VStack>
        </DrawerHeader>

        <DrawerBody p={6}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <Spinner size="xl" />
            </Box>
          ) : error ? (
            <Alert status="error">
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          ) : order ? (
            <VStack spacing={6} align="stretch">
              {/* Data Completeness Summary */}
              {completenessData && (
                <Box p={4} borderRadius="md" bg="gray.50" borderWidth={1}>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="md">
                        Data Completeness
                      </Text>
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="bold" color={
                          completenessData.completenessScore >= 80 ? 'green.600' :
                          completenessData.completenessScore >= 60 ? 'orange.600' : 'red.600'
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
                    
                    {(completenessData.critical.length > 0 || completenessData.warning.length > 0) && (
                      <VStack spacing={1} align="stretch">
                        {completenessData.critical.map((issue, index) => (
                          <HStack key={`critical-${index}`} spacing={2}>
                            <FiXCircle color="red" size={14} />
                            <Text fontSize="xs" color="red.600">
                              {issue.message}
                            </Text>
                          </HStack>
                        ))}
                        {completenessData.warning.map((issue, index) => (
                          <HStack key={`warning-${index}`} spacing={2}>
                            <FiAlertTriangle color="orange" size={14} />
                            <Text fontSize="xs" color="orange.600">
                              {issue.message}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                    
                    {completenessData.critical.length === 0 && completenessData.warning.length === 0 && (
                      <HStack spacing={2}>
                        <FiCheckCircle color="green" size={14} />
                        <Text fontSize="xs" color="green.600">
                          All critical information provided
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              )}

              <Divider />

              {/* Order Status */}
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Status</Text>
                  <Badge colorScheme={getStatusColor(order.status)} size="lg">
                    {order.status.replace('_', ' ')}
                  </Badge>
                </HStack>

                {/* Payment Confirmation Button - Show if payment is pending */}
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
                      // Refresh order details after successful confirmation
                      fetchOrderDetails();
                    }}
                  />
                )}
              </VStack>

              <Divider />

              {/* Customer Information */}
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold" fontSize="md">
                  Customer Information
                </Text>
                <HStack>
                  <FiUser />
                  <Text>{order.customerName}</Text>
                </HStack>
                <HStack>
                  <FiMail />
                  <Text fontSize="sm" color="gray.600">
                    {order.customerEmail}
                  </Text>
                </HStack>
                <HStack>
                  <FiPhone />
                  {getStatusIcon(
                    !!(order.customerPhone && order.customerPhone.length >= 10), 
                    false
                  )}
                  <Text fontSize="sm" color={
                    order.customerPhone && order.customerPhone.length >= 10 
                      ? "gray.600" 
                      : "orange.600"
                  }>
                    {order.customerPhone || 'NOT PROVIDED'}
                  </Text>
                </HStack>
              </VStack>

              <Divider />

              {/* Addresses */}
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold" fontSize="md">
                  Addresses & Property Details
                </Text>
                <VStack align="stretch" spacing={4}>
                  <Box p={3} borderWidth={1} borderRadius="md" borderColor="green.200" bg="green.50">
                    <HStack align="start" spacing={3}>
                      <FiMapPin color="green" />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="sm" fontWeight="bold" color="green.700">
                          Pickup Location
                        </Text>
                        <Text fontSize="sm" color="gray.700">
                          {order.pickupAddress?.label || 'Not specified'}
                        </Text>
                        {order.pickupAddress?.postcode && (
                          <Text fontSize="xs" color="gray.600">
                            Postcode: {order.pickupAddress.postcode}
                          </Text>
                        )}
                        {order.pickupAddress?.flatNumber && (
                          <Text fontSize="xs" color="gray.600">
                            Flat/Unit: {order.pickupAddress.flatNumber}
                          </Text>
                        )}
                        {order.pickupProperty && (
                          <VStack align="start" spacing={0} mt={2}>
                            <Text fontSize="xs" color="gray.600">
                              Property: {order.pickupProperty.propertyType}
                            </Text>
                            <HStack spacing={1}>
                              {getStatusIcon(
                                order.pickupProperty.floors > 0, 
                                true
                              )}
                              <Text fontSize="xs" color={
                                order.pickupProperty.floors > 0 ? "gray.600" : "red.600"
                              }>
                                Floor: {order.pickupProperty.floors > 0 
                                  ? order.pickupProperty.floors 
                                  : 'NOT SPECIFIED'
                                }
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.600">
                              Access: {order.pickupProperty.accessType.replace('_', ' ')}
                            </Text>
                            {order.pickupProperty.propertyType === 'FLAT' && (
                              <HStack spacing={1}>
                                {getStatusIcon(
                                  !!order.pickupAddress?.flatNumber, 
                                  true
                                )}
                                <Text fontSize="xs" color={
                                  order.pickupAddress?.flatNumber ? "gray.600" : "red.600"
                                }>
                                  Flat/Unit: {order.pickupAddress?.flatNumber || 'NOT SPECIFIED'}
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                  
                  <Box p={3} borderWidth={1} borderRadius="md" borderColor="red.200" bg="red.50">
                    <HStack align="start" spacing={3}>
                      <FiMapPin color="red" />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="sm" fontWeight="bold" color="red.700">
                          Delivery Location
                        </Text>
                        <Text fontSize="sm" color="gray.700">
                          {order.dropoffAddress?.label || 'Not specified'}
                        </Text>
                        {order.dropoffAddress?.postcode && (
                          <Text fontSize="xs" color="gray.600">
                            Postcode: {order.dropoffAddress.postcode}
                          </Text>
                        )}
                        {order.dropoffAddress?.flatNumber && (
                          <Text fontSize="xs" color="gray.600">
                            Flat/Unit: {order.dropoffAddress.flatNumber}
                          </Text>
                        )}
                        {order.dropoffProperty && (
                          <VStack align="start" spacing={0} mt={2}>
                            <Text fontSize="xs" color="gray.600">
                              Property: {order.dropoffProperty.propertyType}
                            </Text>
                            <HStack spacing={1}>
                              {getStatusIcon(
                                order.dropoffProperty.floors > 0, 
                                true
                              )}
                              <Text fontSize="xs" color={
                                order.dropoffProperty.floors > 0 ? "gray.600" : "red.600"
                              }>
                                Floor: {order.dropoffProperty.floors > 0 
                                  ? order.dropoffProperty.floors 
                                  : 'NOT SPECIFIED'
                                }
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.600">
                              Access: {order.dropoffProperty.accessType.replace('_', ' ')}
                            </Text>
                            {order.dropoffProperty.propertyType === 'FLAT' && (
                              <HStack spacing={1}>
                                {getStatusIcon(
                                  !!order.dropoffAddress?.flatNumber, 
                                  true
                                )}
                                <Text fontSize="xs" color={
                                  order.dropoffAddress?.flatNumber ? "gray.600" : "red.600"
                                }>
                                  Flat/Unit: {order.dropoffAddress?.flatNumber || 'NOT SPECIFIED'}
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                </VStack>
              </VStack>

              <Divider />

              {/* Driver Information */}
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontWeight="bold" fontSize="md">
                    Driver Information
                  </Text>
                  {order.driver && (
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        colorScheme="blue"
                        variant="outline"
                        onClick={onAssignModalOpen}
                        leftIcon={<FiTruck />}
                      >
                        Change Driver
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="outline"
                        onClick={onRemoveModalOpen}
                        leftIcon={<FiX />}
                      >
                        Remove Driver
                      </Button>
                    </HStack>
                  )}
                </HStack>
                
                {order.driver ? (
                  <>
                    <HStack>
                      <FiTruck />
                      <Text>{order.driver.user.name}</Text>
                    </HStack>
                    <HStack>
                      <FiMail />
                      <Text fontSize="sm" color="gray.600">
                        {order.driver.user.email}
                      </Text>
                    </HStack>
                    <HStack>
                      <FiPhone />
                      <Text fontSize="sm" color="gray.600">
                        {order.driver.user.phone}
                      </Text>
                    </HStack>
                  </>
                ) : (
                  <Box p={3} bg="yellow.50" borderRadius="md" borderWidth={1} borderColor="yellow.200">
                    <HStack spacing={2}>
                      <FiAlertTriangle color="orange" />
                      <Text fontSize="sm" color="orange.700">
                        No driver assigned to this order
                      </Text>
                    </HStack>
                    <Button
                      size="sm"
                      colorScheme="green"
                      variant="outline"
                      mt={2}
                      onClick={onAssignModalOpen}
                      leftIcon={<FiTruck />}
                    >
                      Assign Driver
                    </Button>
                  </Box>
                )}
              </VStack>
              <Divider />

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" fontSize="md">
                      Items ({order.items.length})
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {order.items.map((item, index) => (
                        <Box key={item.id || index} p={3} borderWidth={1} borderRadius="md" bg="gray.50">
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontSize="sm" fontWeight="medium">
                                {item.name}
                              </Text>
                              <HStack spacing={4}>
                                <Text fontSize="xs" color="gray.600">
                                  Qty: {item.quantity}
                                </Text>
                                {item.volumeM3 > 0 && (
                                  <Text fontSize="xs" color="gray.600">
                                    Volume: {item.volumeM3.toFixed(2)}m³
                                  </Text>
                                )}
                              </HStack>
                            </VStack>
                            {item.image && (
                              <Box
                                w="40px"
                                h="40px"
                                borderRadius="md"
                                overflow="hidden"
                                bg="gray.200"
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </Box>
                            )}
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </VStack>
                  <Divider />
                </>
              )}

              {/* Order Details */}
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold" fontSize="md">
                  Booking Details
                </Text>
                <HStack justify="space-between">
                  <Text>Total Amount</Text>
                  <Text fontWeight="bold" fontSize="lg" color="green.600">
                    {formatCurrency(order.totalGBP)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <HStack spacing={1}>
                    {getStatusIcon(
                      !!(order.baseDistanceMiles || order.distanceMeters), 
                      true
                    )}
                    <Text>Distance</Text>
                  </HStack>
                  <Text color={
                    (order.baseDistanceMiles || order.distanceMeters) ? "gray.700" : "red.600"
                  }>
                    {order.baseDistanceMiles 
                      ? `${order.baseDistanceMiles.toFixed(1)} miles`
                      : order.distanceMeters
                        ? formatDistance(order.distanceMeters)
                        : 'NOT CALCULATED'
                    }
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Duration</Text>
                  <Text>{formatDuration(order.durationSeconds)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Scheduled Date</Text>
                  <Text>
                    {order.scheduledAt
                      ? new Date(order.scheduledAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : 'Not scheduled'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Scheduled Time</Text>
                  <Text>
                    {order.scheduledAt
                      ? new Date(order.scheduledAt).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Not scheduled'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <HStack spacing={1}>
                    {getStatusIcon(!!order.pickupTimeSlot, false)}
                    <Text>Time Slot</Text>
                  </HStack>
                  <Text color={order.pickupTimeSlot ? "gray.700" : "orange.600"}>
                    {order.pickupTimeSlot || 'NOT SPECIFIED'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Created</Text>
                  <Text>
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </HStack>
                {order.paidAt && (
                  <HStack justify="space-between">
                    <Text>Paid At</Text>
                    <Text>
                      {new Date(order.paidAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </HStack>
                )}
              </VStack>

              {/* Notes */}
              <Divider />
              <VStack align="stretch" spacing={2}>
                <HStack spacing={1}>
                  {getStatusIcon(!!order.notes, false)}
                  <Text fontWeight="bold" fontSize="md">
                    Customer Notes
                  </Text>
                </HStack>
                <Box 
                  p={3} 
                  borderRadius="md" 
                  bg={order.notes ? "blue.50" : "gray.50"}
                  borderWidth={1}
                  borderColor={order.notes ? "blue.200" : "gray.200"}
                >
                  <Text fontSize="sm" color={order.notes ? "gray.700" : "gray.500"} fontStyle={!order.notes ? "italic" : "normal"}>
                    {order.notes || 'No customer notes provided'}
                  </Text>
                </Box>
              </VStack>

              {/* Actions */}
              <Divider />
              {isEditing ? (
                <HStack spacing={3} pt={4}>
                  <Button
                    leftIcon={<FiSave />}
                    colorScheme="green"
                    size="sm"
                    flex={1}
                    onClick={handleEditSave}
                    isLoading={isSaving}
                    loadingText="Saving..."
                  >
                    Save Changes
                  </Button>
                  <Button
                    leftIcon={<FiX />}
                    variant="outline"
                    size="sm"
                    flex={1}
                    onClick={handleEditCancel}
                    isDisabled={isSaving}
                  >
                    Cancel Edit
                  </Button>
                </HStack>
              ) : (
                <VStack spacing={3} pt={4}>
                  <HStack spacing={3} w="full">
                    <Button
                      leftIcon={<FiEdit />}
                      colorScheme="blue"
                      size="sm"
                      flex={1}
                      onClick={handleEditStart}
                      isDisabled={order?.status === 'CANCELLED'}
                    >
                      Edit Order
                    </Button>
                    <Button
                      leftIcon={<FiMail />}
                      colorScheme="green"
                      variant="outline"
                      size="sm"
                      flex={1}
                      onClick={handleSendConfirmationEmail}
                      isLoading={isSendingEmail}
                      loadingText="Sending..."
                      isDisabled={order?.status === 'CANCELLED'}
                    >
                      Send Confirmation
                    </Button>
                  </HStack>
                  
                  <HStack spacing={3} w="full">
                    <Button
                      leftIcon={<FiMail />}
                      colorScheme="orange"
                      variant="outline"
                      size="sm"
                      flex={1}
                      onClick={handleSendFloorWarningEmail}
                      isLoading={isSendingEmail}
                      loadingText="Sending..."
                      isDisabled={order?.status === 'CANCELLED'}
                      title="Send floor warning email to customer if they didn't specify floor numbers"
                    >
                      Send Floor Warning
                    </Button>
                    <Button
                      leftIcon={<FiTruck />}
                      variant="outline"
                      size="sm"
                      flex={1}
                      onClick={onAssignModalOpen}
                      isDisabled={order?.status === 'CANCELLED'}
                    >
                      {order?.driver ? 'Change Driver' : 'Assign Driver'}
                    </Button>
                    {order?.driver && (
                      <Button
                        leftIcon={<FiTrash2 />}
                        colorScheme="orange"
                        variant="outline"
                        size="sm"
                        flex={1}
                        onClick={handleRemoveDriver}
                        isDisabled={order?.status === 'CANCELLED' || order?.status === 'COMPLETED'}
                      >
                        Remove Driver
                      </Button>
                    )}
                    <Button
                      leftIcon={<FiTrash2 />}
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      flex={1}
                      onClick={onCancelModalOpen}
                      isDisabled={order?.status === 'CANCELLED' || order?.status === 'COMPLETED'}
                    >
                      Cancel Order
                    </Button>
                  </HStack>
                </VStack>
              )}
            </VStack>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              No order selected
            </Text>
          )}
        </DrawerBody>
      </DrawerContent>

      {/* Cancel Order Confirmation Modal */}
      <Modal isOpen={isCancelModalOpen} onClose={onCancelModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="red.600">
            <HStack spacing={2}>
              <FiTrash2 />
              <Text>Cancel Order</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">This action cannot be undone!</Text>
                  <Text fontSize="sm">
                    Cancelling this order will:
                  </Text>
                </VStack>
              </Alert>
              
              <VStack align="start" spacing={2} pl={4}>
                <Text fontSize="sm">• Change order status to CANCELLED</Text>
                <Text fontSize="sm">• Send cancellation notification to customer</Text>
                <Text fontSize="sm">• Remove from active orders list</Text>
                <Text fontSize="sm">• Trigger refund process if payment was made</Text>
              </VStack>

              {order && (
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold" fontSize="sm" mb={1}>Order to Cancel:</Text>
                  <Text fontSize="sm">Reference: {order.reference}</Text>
                  <Text fontSize="sm">Customer: {order.customerName}</Text>
                  <Text fontSize="sm">Amount: {formatCurrency(order.totalGBP)}</Text>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button 
                variant="outline" 
                onClick={onCancelModalClose}
                isDisabled={isCancelling}
              >
                Keep Order
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleCancelOrder}
                isLoading={isCancelling}
                loadingText="Cancelling..."
              >
                Yes, Cancel Order
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign Driver Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={onAssignModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <HStack spacing={2}>
              <FiTruck />
              <Text>{order?.driver ? 'Change Driver' : 'Assign Driver'}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto" maxH="60vh">
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  {order?.driver 
                    ? 'Select a new driver to replace the current one. The current driver will be notified of the change.'
                    : 'Select a driver to assign to this order. The driver will be notified immediately.'
                  }
                </Text>
              </Alert>

              <FormControl>
                <FormLabel>Available Drivers</FormLabel>
                {isLoadingDrivers ? (
                  <HStack justify="center" py={4}>
                    <Spinner size="sm" />
                    <Text>Loading drivers...</Text>
                  </HStack>
                ) : availableDrivers.length === 0 ? (
                  <VStack spacing={3} align="stretch">
                    <Alert status="warning">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="bold">No drivers found</Text>
                        <Text fontSize="xs">
                          This could happen if no drivers are approved and active, or if all drivers are currently busy.
                        </Text>
                      </VStack>
                    </Alert>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={loadAvailableDrivers}
                        isLoading={isLoadingDrivers}
                      >
                        Refresh Driver List
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/admin/drivers/fix-availability', {
                              method: 'POST'
                            });
                            const result = await response.json();
                            
                            if (result.success) {
                              toast({
                                title: 'Availability Fixed',
                                description: `Created availability records for ${result.driversFixed} drivers`,
                                status: 'success',
                                duration: 3000,
                              });
                              // Reload drivers after fix
                              loadAvailableDrivers();
                            } else {
                              throw new Error(result.error || 'Fix failed');
                            }
                          } catch (error) {
                            toast({
                              title: 'Fix Failed',
                              description: error instanceof Error ? error.message : 'Failed to fix availability',
                              status: 'error',
                              duration: 5000,
                            });
                          }
                        }}
                      >
                        Fix Missing Records
                      </Button>
                    </HStack>
                  </VStack>
                ) : (
                  <VStack spacing={2} align="stretch">
                    <Select
                      placeholder="👤 Click here to select a driver"
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      bg={selectedDriverId ? 'green.50' : 'white'}
                      borderColor={selectedDriverId ? 'green.300' : 'gray.200'}
                      focusBorderColor="blue.500"
                      size="lg"
                    >
                      {availableDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.availabilityReason || 'Available'} 
                          {driver.availability?.status && ` (${driver.availability.status})`}
                        </option>
                      ))}
                    </Select>
                    
                    {!selectedDriverId && (
                      <Alert status="warning" size="sm">
                        <AlertIcon />
                        <Text fontSize="sm">
                          Please select a driver from the dropdown above to enable assignment
                        </Text>
                      </Alert>
                    )}
                    
                    {selectedDriverId && (
                      <Alert status="success" size="sm">
                        <AlertIcon />
                        <Text fontSize="sm">
                          Driver selected! Click "Assign Driver" to proceed
                        </Text>
                      </Alert>
                    )}
                    
                    {availableDrivers.length === 1 && !selectedDriverId && (
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="green"
                          variant="solid"
                          onClick={() => {
                            const driver = availableDrivers[0];
                            if (driver.isAvailable) {
                              setSelectedDriverId(driver.id);
                            }
                          }}
                          leftIcon={<FiTruck />}
                        >
                          Quick Select: {availableDrivers[0].name}
                        </Button>
                      </HStack>
                    )}
                    
                    <Text fontSize="xs" color="gray.600">
                      Found {availableDrivers.length} driver{availableDrivers.length !== 1 ? 's' : ''}
                      {availableDrivers.filter(d => d.isAvailable).length > 0 && 
                        ` (${availableDrivers.filter(d => d.isAvailable).length} available)`
                      }
                    </Text>
                  </VStack>
                )}
                <Button
                  size="xs"
                  variant="outline"
                  mt={2}
                  onClick={loadAvailableDrivers}
                  isLoading={isLoadingDrivers}
                >
                  Refresh Drivers
                </Button>
              </FormControl>

              <FormControl>
                <FormLabel>Reason (Optional)</FormLabel>
                <Textarea
                  placeholder="Enter reason for assignment/change..."
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  rows={3}
                />
              </FormControl>

              {order && (
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold" fontSize="sm" mb={1}>Order Details:</Text>
                  <Text fontSize="sm">Reference: {order.reference}</Text>
                  <Text fontSize="sm">Customer: {order.customerName}</Text>
                  <Text fontSize="sm">Pickup: {order.pickupAddress?.label}</Text>
                  <Text fontSize="sm">Dropoff: {order.dropoffAddress?.label}</Text>
                </Box>
              )}

              {/* Spacer to ensure footer is visible */}
              <Box h={4}></Box>
            </VStack>
          </ModalBody>

          <ModalFooter bg="white" borderTop="1px solid" borderColor="gray.200" position="sticky" bottom={0}>
            <HStack spacing={3} w="full" justify="space-between">
              <Button 
                variant="outline" 
                onClick={onAssignModalClose}
                isDisabled={isAssigningDriver}
                size="lg"
              >
                Cancel
              </Button>
              <Button 
                colorScheme={selectedDriverId ? "blue" : "gray"} 
                onClick={handleAssignDriver}
                isLoading={isAssigningDriver}
                loadingText="Assigning..."
                isDisabled={!selectedDriverId}
                size="lg"
                rightIcon={selectedDriverId ? <FiTruck /> : undefined}
                flex={1}
                maxW="300px"
              >
                {!selectedDriverId 
                  ? 'Select Driver First' 
                  : order?.driver 
                    ? 'Change Driver' 
                    : 'Assign Driver'
                }
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Remove Driver Modal */}
      <Modal isOpen={isRemoveModalOpen} onClose={onRemoveModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="red.600">
            <HStack spacing={2}>
              <FiX />
              <Text>Remove Driver</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">This action will remove the driver from this order!</Text>
                  <Text fontSize="sm">
                    The driver will be notified and the order will become available for other drivers.
                  </Text>
                </VStack>
              </Alert>
              
              {order?.driver && (
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold" fontSize="sm" mb={1}>Driver to Remove:</Text>
                  <Text fontSize="sm">Name: {order.driver.user.name}</Text>
                  <Text fontSize="sm">Email: {order.driver.user.email}</Text>
                  <Text fontSize="sm">Phone: {order.driver.user.phone}</Text>
                </Box>
              )}

              {order && (
                <Box p={3} bg="blue.50" borderRadius="md">
                  <Text fontWeight="bold" fontSize="sm" mb={1}>Order Details:</Text>
                  <Text fontSize="sm">Reference: {order.reference}</Text>
                  <Text fontSize="sm">Customer: {order.customerName}</Text>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button 
                variant="outline" 
                onClick={onRemoveModalClose}
                isDisabled={isRemovingDriver}
              >
                Keep Driver
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleRemoveDriver}
                isLoading={isRemovingDriver}
                loadingText="Removing..."
              >
                Yes, Remove Driver
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Drawer>
  );
};

export default OrderDetailDrawer;
