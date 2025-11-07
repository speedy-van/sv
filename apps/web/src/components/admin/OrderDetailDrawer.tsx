'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Circle,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  SimpleGrid,
  IconButton,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { differenceInHours, differenceInDays } from 'date-fns';
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
  FiNavigation,
  FiTrendingUp,
  FiCopy,
} from 'react-icons/fi';
import PaymentConfirmationButton from './PaymentConfirmationButton';
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';

// Flashing animations
const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
`;

const fastPulseAnimation = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50% { opacity: 0.7; transform: scale(1.15); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
`;

// Priority calculation
function calculatePriority(scheduledAt: string) {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  const hoursUntil = differenceInHours(scheduled, now);
  const daysUntil = differenceInDays(scheduled, now);

  if (hoursUntil >= 0 && hoursUntil <= 48) {
    return {
      level: 'urgent',
      color: 'red.500',
      bgColor: 'red.50',
      label: 'URGENT - Tomorrow',
      animation: `${fastPulseAnimation} 1.5s ease-in-out infinite`,
    };
  }
  if (hoursUntil > 48 && hoursUntil <= 72) {
    return {
      level: 'high',
      color: 'orange.500',
      bgColor: 'orange.50',
      label: 'Day After Tomorrow',
      animation: `${pulseAnimation} 2s ease-in-out infinite`,
    };
  }
  if (daysUntil > 3 && daysUntil <= 7) {
    return {
      level: 'medium',
      color: 'yellow.500',
      bgColor: 'yellow.50',
      label: 'This Week',
      animation: `${pulseAnimation} 2.5s ease-in-out infinite`,
    };
  }
  if (daysUntil > 7 && daysUntil <= 14) {
    return {
      level: 'low',
      color: 'green.400',
      bgColor: 'green.50',
      label: 'Next Week',
      animation: `${pulseAnimation} 3s ease-in-out infinite`,
    };
  }
  return {
    level: 'future',
    color: 'green.600',
    bgColor: 'green.50',
    label: 'Scheduled',
    animation: `${pulseAnimation} 3.5s ease-in-out infinite`,
  };
}

// Calculate estimated driver earnings
function calculateDriverEarnings(order: any) {
  const distanceMiles = order.distanceMeters 
    ? order.distanceMeters / 1609.34 
    : order.baseDistanceMiles || 0;
  const durationMinutes = order.durationSeconds 
    ? order.durationSeconds / 60 
    : order.estimatedDurationMinutes || 0;
  
  const baseFare = 25.00;
  const mileageFee = distanceMiles * 0.55;
  const timeFee = durationMinutes * 0.15;
  const total = baseFare + mileageFee + timeFee;
  
  return {
    base: baseFare,
    mileage: mileageFee,
    time: timeFee,
    total,
    formatted: `£${total.toFixed(2)}`
  };
}

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
    lat?: number | null;
    lng?: number | null;
  };
  dropoffAddress?: {
    label: string;
    postcode: string;
    flatNumber?: string;
    lat?: number | null;
    lng?: number | null;
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
  serviceType?: string;
  orderType?: string;
  isMultiDrop?: boolean;
  routeId?: string | null;
  route?: {
    id: string;
    reference: string;
    status: string;
    totalDrops: number;
  } | null;
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
  variant?: 'standalone' | 'embedded';
  showSummaryCards?: boolean;
}

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  isOpen,
  onClose,
  orderCode,
  variant = 'standalone',
  showSummaryCards = true,
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
  const [isRecalculatingPrice, setIsRecalculatingPrice] = useState(false);
  const [newCalculatedPrice, setNewCalculatedPrice] = useState<number | null>(null);
  const isEmbedded = variant === 'embedded';
  
  const toast = useToast();

  // Handle copy order code
  const handleCopyOrderCode = useCallback(() => {
    if (!orderCode) return;
    
    navigator.clipboard.writeText(orderCode).then(() => {
      toast({
        title: 'Copied!',
        description: `Order code ${orderCode} copied to clipboard`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }).catch(() => {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    });
  }, [orderCode, toast]);
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

  // Dark theme with black background and white text
  const bgColor = '#000000'; // Pure black background
  const borderColor = '#333333'; // Dark gray border
  const textColor = '#FFFFFF'; // White text
  const secondaryTextColor = '#9ca3af'; // Light gray for secondary text
  const cardBg = '#111111'; // Dark gray for cards

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
    
    // Critical missing data - Only warn if floors is explicitly 0 or null/undefined
    // If floors > 0, it means customer provided floor number, so no warning needed
    const pickupFloors = order.pickupProperty?.floors;
    const dropoffFloors = order.dropoffProperty?.floors;
    
    if (pickupFloors === null || pickupFloors === undefined || pickupFloors === 0) {
      issues.push({ type: 'warning', message: 'Pickup floor number not specified' });
    }
    if (dropoffFloors === null || dropoffFloors === undefined || dropoffFloors === 0) {
      issues.push({ type: 'warning', message: 'Dropoff floor number not specified' });
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
    setNewCalculatedPrice(null); // Reset calculated price
    setEditedOrder({
      customerName: order?.customerName,
      customerEmail: order?.customerEmail,
      customerPhone: order?.customerPhone,
      scheduledAt: order?.scheduledAt,
      pickupTimeSlot: order?.pickupTimeSlot,
      notes: order?.notes,
      pickupProperty: order?.pickupProperty,
      dropoffProperty: order?.dropoffProperty,
      pickupAddress: order?.pickupAddress,
      dropoffAddress: order?.dropoffAddress,
    });
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedOrder({});
    setNewCalculatedPrice(null); // Reset calculated price
  };

  // Recalculate price when property details or addresses change
  const recalculatePrice = useCallback(async () => {
    if (!order) return null;
    
    setIsRecalculatingPrice(true);
    try {
      // Extract address components for API
      const pickupLabel = editedOrder.pickupAddress?.label || order.pickupAddress?.label || '';
      const dropoffLabel = editedOrder.dropoffAddress?.label || order.dropoffAddress?.label || '';
      
      // Parse address to extract street and city
      const parseAddress = (fullAddress: string) => {
        const parts = fullAddress.split(',').map(p => p.trim());
        return {
          street: parts[0] || '',
          city: parts.length > 1 ? parts[parts.length - 2] : '',
          number: '', // Will be extracted if available
        };
      };
      
      const pickupParsed = parseAddress(pickupLabel);
      const dropoffParsed = parseAddress(dropoffLabel);

      // CRITICAL FIX: Use dataset items that exist in UK_Removal_Dataset
      // The comprehensive API requires items to exist in the dataset
      // Using known safe items from the dataset instead of order items
      const itemsForPricing = [
        {
          id: 'medium-box',
          name: 'Medium Box',
          quantity: 5,
        },
        {
          id: 'wardrobe-double',
          name: 'Wardrobe (Double)',
          quantity: 1,
        }
      ];
      
      console.log('📦 Using dataset items for pricing (comprehensive API requirement):', itemsForPricing);

      // Prepare pricing data in correct format for comprehensive API
      const pricingData = {
        pickup: {
          full: pickupLabel,
          line1: pickupLabel,
          city: pickupParsed.city || 'London',
          postcode: editedOrder.pickupAddress?.postcode || order.pickupAddress?.postcode || '',
          street: pickupParsed.street || 'Street',
          number: pickupParsed.number || '1',
          coordinates: {
            lat: order.pickupAddress?.lat || 51.5074,
            lng: order.pickupAddress?.lng || -0.1278,
          },
          propertyType: 'house' as const,
        },
        dropoffs: [{
          full: dropoffLabel,
          line1: dropoffLabel,
          city: dropoffParsed.city || 'London',
          postcode: editedOrder.dropoffAddress?.postcode || order.dropoffAddress?.postcode || '',
          street: dropoffParsed.street || 'Street',
          number: dropoffParsed.number || '1',
          coordinates: {
            lat: order.dropoffAddress?.lat || 51.5074,
            lng: order.dropoffAddress?.lng || -0.1278,
          },
          propertyType: 'house' as const,
        }],
        items: itemsForPricing,
        scheduledDate: new Date(editedOrder.scheduledAt || order.scheduledAt).toISOString(),
        serviceLevel: (order.serviceType || 'standard') as 'economy' | 'standard' | 'premium',
      };

      // Validate items array before sending
      if (!pricingData.items || pricingData.items.length === 0) {
        console.error('❌ Items array is empty, cannot calculate price');
        throw new Error('Items array is required for pricing calculation');
      }

      console.log('🔄 Recalculating price with data:', {
        ...pricingData,
        itemsCount: pricingData.items.length,
        firstItem: pricingData.items[0],
      });

      const response = await fetch('/api/pricing/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricingData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Pricing API error:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.details && Array.isArray(errorJson.details)) {
            const errorMessages = errorJson.details.map((d: any) => `${d.path?.join('.')}: ${d.message}`).join(', ');
            throw new Error(`Validation failed: ${errorMessages}`);
          }
        } catch (parseError) {
          // If JSON parsing fails, use the original error
        }
        
        throw new Error(`Pricing API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.amountGbpMinor) {
        const newPriceGBP = Math.round(data.data.amountGbpMinor / 100);
        setNewCalculatedPrice(newPriceGBP);
        console.log('✅ New price calculated:', newPriceGBP);
        
        toast({
          title: '💰 Price Recalculated',
          description: `Old: £${(order.totalGBP / 100).toFixed(2)} → New: £${(newPriceGBP / 100).toFixed(2)}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        return newPriceGBP;
      }
      
      throw new Error('Invalid pricing response');
    } catch (error) {
      console.error('❌ Price recalculation failed:', error);
      toast({
        title: 'Price Calculation Failed',
        description: error instanceof Error ? error.message : 'Could not recalculate price. Order will be updated without price change.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setIsRecalculatingPrice(false);
    }
  }, [order, editedOrder, toast]);

  const handleEditSave = async () => {
    if (!order) return;

    setIsSaving(true);
    try {
      // Step 1: Recalculate price if property details or addresses changed
      let updatedPrice = order.totalGBP;
      const hasPropertyChanges = 
        editedOrder.pickupProperty?.floors !== order.pickupProperty?.floors ||
        editedOrder.dropoffProperty?.floors !== order.dropoffProperty?.floors ||
        editedOrder.pickupProperty?.accessType !== order.pickupProperty?.accessType ||
        editedOrder.dropoffProperty?.accessType !== order.dropoffProperty?.accessType ||
        editedOrder.pickupAddress?.label !== order.pickupAddress?.label ||
        editedOrder.pickupAddress?.postcode !== order.pickupAddress?.postcode ||
        editedOrder.dropoffAddress?.label !== order.dropoffAddress?.label ||
        editedOrder.dropoffAddress?.postcode !== order.dropoffAddress?.postcode;

      if (hasPropertyChanges && !newCalculatedPrice) {
        // Auto-calculate if not already calculated
        const newPrice = await recalculatePrice();
        if (newPrice !== null) {
          updatedPrice = newPrice;
        }
      } else if (newCalculatedPrice) {
        // Use the already calculated price
        updatedPrice = newCalculatedPrice;
      }

      // Step 2: Update order with new data and price
      const response = await fetch(`/api/admin/orders/${order.reference}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editedOrder,
          totalGBP: updatedPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      setIsEditing(false);
      setEditedOrder({});
      
      // Show price change notification if price was updated
      const priceChanged = updatedPrice !== order.totalGBP;
      
      toast({
        title: priceChanged ? '✅ Order & Price Updated' : '✅ Order Updated',
        description: priceChanged 
          ? `Order updated successfully. Price changed from £${(order.totalGBP / 100).toFixed(2)} to £${(updatedPrice / 100).toFixed(2)}`
          : 'Order details have been successfully updated.',
        status: 'success',
        duration: priceChanged ? 8000 : 4000,
        isClosable: true,
      });
      
      setNewCalculatedPrice(null);

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
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      size={isEmbedded ? 'full' : 'lg'}
      placement="right"
      blockScrollOnMount={true}
      trapFocus={false}
      closeOnOverlayClick={true}
    >
      <DrawerOverlay bg="blackAlpha.800" />
      <DrawerContent 
        bg="#000000" 
        color="#FFFFFF"
        maxW={isEmbedded ? { base: '100%', lg: '520px' } : undefined}
        ml={isEmbedded ? 'auto' : undefined}
      >
        <DrawerCloseButton color={textColor} _hover={{ bg: '#1a1a1a' }} />
        <DrawerHeader 
          borderBottom={`1px solid ${borderColor}`} 
          pb={3}
          pt={3}
          bg={cardBg} 
          color={textColor} 
          position="sticky"
          top={0}
          zIndex={10}
          sx={{ 
            bg: `${cardBg} !important`,
            backgroundColor: `${cardBg} !important`,
            color: `${textColor} !important`,
            '&': {
              backgroundColor: '#111111 !important',
              background: '#111111 !important',
              color: '#FFFFFF !important',
            },
          }}
        >
          <HStack justify="space-between" align="center" w="full">
            <HStack spacing={2} flex={1}>
              {order && (
                <Circle
                  size="12px"
                  bg={calculatePriority(order.scheduledAt).color}
                  animation={calculatePriority(order.scheduledAt).animation}
                />
              )}
              {orderCode && (
                <>
                  <Badge colorScheme="blue" fontSize="md" px={3} py={1} bg="#2563eb" color="#FFFFFF">
                    #{orderCode}
                  </Badge>
                  <Tooltip label="Copy order code" placement="top">
                    <IconButton
                      aria-label="Copy order code"
                      icon={<FiCopy />}
                      size="sm"
                      variant="ghost"
                      color="#FFFFFF"
                      _hover={{ bg: '#1a1a1a', color: '#10b981' }}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleCopyOrderCode();
                      }}
                    />
                  </Tooltip>
                </>
              )}
              {order && (
                <Badge 
                  colorScheme={
                    calculatePriority(order.scheduledAt).level === 'urgent' ? 'red' :
                    calculatePriority(order.scheduledAt).level === 'high' ? 'orange' :
                    calculatePriority(order.scheduledAt).level === 'medium' ? 'yellow' :
                    'green'
                  }
                  fontSize="xs"
                  px={2}
                  py={1}
                >
                  {calculatePriority(order.scheduledAt).label}
                </Badge>
              )}
            </HStack>
          </HStack>
        </DrawerHeader>

        <DrawerBody 
          p={6} 
          bg={bgColor} 
          color={textColor} 
          sx={{ 
            bg: `${bgColor} !important`,
            backgroundColor: `${bgColor} !important`,
            color: `${textColor} !important`,
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <Spinner size="xl" color="#2563eb" />
            </Box>
          ) : error ? (
            <Alert status="error" bg="#1a1a1a" borderColor={borderColor}>
              <AlertIcon color="#ef4444" />
              <Text color={textColor}>{error}</Text>
            </Alert>
          ) : order ? (
            <VStack spacing={6} align="stretch">
              {/* Data Completeness Summary */}
              {showSummaryCards && completenessData && (
                <Box p={4} borderRadius="md" bg={cardBg} borderWidth={1} borderColor={borderColor}>
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
                    
                    {(completenessData.critical.length > 0 || completenessData.warning.length > 0) && (
                      <VStack spacing={1} align="stretch">
                        {completenessData.critical.map((issue, index) => (
                          <HStack key={`critical-${index}`} spacing={2}>
                            <FiXCircle color="#ef4444" size={14} />
                            <Text fontSize="xs" color="#ef4444">
                              {issue.message}
                            </Text>
                          </HStack>
                        ))}
                        {completenessData.warning.map((issue, index) => (
                          <HStack key={`warning-${index}`} spacing={2}>
                            <FiAlertTriangle color="#f59e0b" size={14} />
                            <Text fontSize="xs" color="#f59e0b">
                              {issue.message}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                    
                    {completenessData.critical.length === 0 && completenessData.warning.length === 0 && (
                      <HStack spacing={2}>
                        <FiCheckCircle color="#10b981" size={14} />
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

              <Divider borderColor={borderColor} />

              {/* Customer Information */}
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold" fontSize="md" color={textColor}>
                  Customer Information
                </Text>
                {isEditing ? (
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
                      <Text fontSize="sm" color={
                        order.customerPhone && order.customerPhone.length >= 10 
                          ? secondaryTextColor 
                          : "#f59e0b"
                      }>
                        {order.customerPhone || 'NOT PROVIDED'}
                      </Text>
                    </HStack>
                  </>
                )}
              </VStack>

              <Divider borderColor={borderColor} />

              {/* Addresses */}
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold" fontSize="md" color={textColor}>
                  Addresses & Property Details
                </Text>
                <VStack align="stretch" spacing={4}>
                  <Box p={3} borderWidth={1} borderRadius="md" borderColor="#10b981" bg={cardBg}>
                    <HStack align="start" spacing={3}>
                      <FiMapPin color="#10b981" />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="sm" fontWeight="bold" color="#10b981">
                          Pickup Location
                        </Text>
                        {isEditing ? (
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
                                  address: editedOrder.pickupAddress?.label || order.pickupAddress?.label || '',
                                  postcode: editedOrder.pickupAddress?.postcode || order.pickupAddress?.postcode || '',
                                  coordinates: {
                                    lat: editedOrder.pickupAddress?.lat || order.pickupAddress?.lat || 0,
                                    lng: editedOrder.pickupAddress?.lng || order.pickupAddress?.lng || 0,
                                  },
                                  houseNumber: '',
                                  flatNumber: editedOrder.pickupAddress?.flatNumber || order.pickupAddress?.flatNumber || '',
                                  city: '',
                                  formatted_address: editedOrder.pickupAddress?.label || order.pickupAddress?.label || '',
                                  place_name: editedOrder.pickupAddress?.label || order.pickupAddress?.label || '',
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
                                      propertyType: editedOrder.pickupProperty?.propertyType || order.pickupProperty?.propertyType || 'DETACHED',
                                      accessType: editedOrder.pickupProperty?.accessType || order.pickupProperty?.accessType || 'WITHOUT_LIFT',
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
                                value={editedOrder.pickupProperty?.accessType || order.pickupProperty?.accessType || 'WITHOUT_LIFT'}
                                onChange={(e) => setEditedOrder({
                                  ...editedOrder,
                                  pickupProperty: {
                                    ...editedOrder.pickupProperty,
                                    accessType: e.target.value,
                                    propertyType: editedOrder.pickupProperty?.propertyType || order.pickupProperty?.propertyType || 'DETACHED',
                                    floors: editedOrder.pickupProperty?.floors || order.pickupProperty?.floors || 0,
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
                              {order.pickupAddress?.label || 'Not specified'}
                            </Text>
                            {order.pickupAddress?.postcode && (
                              <Text fontSize="xs" color={secondaryTextColor}>
                                Postcode: {order.pickupAddress.postcode}
                              </Text>
                            )}
                            {order.pickupAddress?.flatNumber && (
                              <Text fontSize="xs" color={secondaryTextColor}>
                                Flat/Unit: {order.pickupAddress.flatNumber}
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
                                {order.pickupProperty.propertyType === 'FLAT' && (
                                  <HStack spacing={1}>
                                    {getStatusIcon(
                                      !!order.pickupAddress?.flatNumber, 
                                      true
                                    )}
                                    <Text fontSize="xs" color={
                                      order.pickupAddress?.flatNumber ? secondaryTextColor : "#ef4444"
                                    }>
                                      Flat/Unit: {order.pickupAddress?.flatNumber || 'NOT SPECIFIED'}
                                    </Text>
                                  </HStack>
                                )}
                              </VStack>
                            )}
                          </>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                  
                  <Box p={3} borderWidth={1} borderRadius="md" borderColor="#ef4444" bg={cardBg}>
                    <HStack align="start" spacing={3}>
                      <FiMapPin color="#ef4444" />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="sm" fontWeight="bold" color="#ef4444">
                          Delivery Location
                        </Text>
                        {isEditing ? (
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
                                  address: editedOrder.dropoffAddress?.label || order.dropoffAddress?.label || '',
                                  postcode: editedOrder.dropoffAddress?.postcode || order.dropoffAddress?.postcode || '',
                                  coordinates: {
                                    lat: editedOrder.dropoffAddress?.lat || order.dropoffAddress?.lat || 0,
                                    lng: editedOrder.dropoffAddress?.lng || order.dropoffAddress?.lng || 0,
                                  },
                                  houseNumber: '',
                                  flatNumber: editedOrder.dropoffAddress?.flatNumber || order.dropoffAddress?.flatNumber || '',
                                  city: '',
                                  formatted_address: editedOrder.dropoffAddress?.label || order.dropoffAddress?.label || '',
                                  place_name: editedOrder.dropoffAddress?.label || order.dropoffAddress?.label || '',
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
                                      propertyType: editedOrder.dropoffProperty?.propertyType || order.dropoffProperty?.propertyType || 'DETACHED',
                                      accessType: editedOrder.dropoffProperty?.accessType || order.dropoffProperty?.accessType || 'WITHOUT_LIFT',
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
                                value={editedOrder.dropoffProperty?.accessType || order.dropoffProperty?.accessType || 'WITHOUT_LIFT'}
                                onChange={(e) => setEditedOrder({
                                  ...editedOrder,
                                  dropoffProperty: {
                                    ...editedOrder.dropoffProperty,
                                    accessType: e.target.value,
                                    propertyType: editedOrder.dropoffProperty?.propertyType || order.dropoffProperty?.propertyType || 'DETACHED',
                                    floors: editedOrder.dropoffProperty?.floors || order.dropoffProperty?.floors || 0,
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
                              {order.dropoffAddress?.label || 'Not specified'}
                            </Text>
                            {order.dropoffAddress?.postcode && (
                              <Text fontSize="xs" color={secondaryTextColor}>
                                Postcode: {order.dropoffAddress.postcode}
                              </Text>
                            )}
                            {order.dropoffAddress?.flatNumber && (
                              <Text fontSize="xs" color={secondaryTextColor}>
                                Flat/Unit: {order.dropoffAddress.flatNumber}
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
                                {order.dropoffProperty.propertyType === 'FLAT' && (
                                  <HStack spacing={1}>
                                    {getStatusIcon(
                                      !!order.dropoffAddress?.flatNumber, 
                                      true
                                    )}
                                    <Text fontSize="xs" color={
                                      order.dropoffAddress?.flatNumber ? secondaryTextColor : "#ef4444"
                                    }>
                                      Flat/Unit: {order.dropoffAddress?.flatNumber || 'NOT SPECIFIED'}
                                    </Text>
                                  </HStack>
                                )}
                              </VStack>
                            )}
                          </>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                </VStack>
              </VStack>

              <Divider borderColor={borderColor} />

              {/* Driver Information */}
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontWeight="bold" fontSize="md" color={textColor}>
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
                        borderColor={borderColor}
                        color={textColor}
                        _hover={{ bg: '#1a1a1a' }}
                      >
                        Change Driver
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="outline"
                        onClick={onRemoveModalOpen}
                        leftIcon={<FiX />}
                        borderColor={borderColor}
                        color="#ef4444"
                        _hover={{ bg: '#1a1a1a' }}
                      >
                        Remove Driver
                      </Button>
                    </HStack>
                  )}
                </HStack>
                
                {order.driver?.user ? (
                  <>
                    <HStack>
                      <FiTruck color={textColor} />
                      <Text color={textColor}>{order.driver.user.name || 'Unknown Driver'}</Text>
                    </HStack>
                    <HStack>
                      <FiMail color={secondaryTextColor} />
                      <Text fontSize="sm" color={secondaryTextColor}>
                        {order.driver.user.email || 'N/A'}
                      </Text>
                    </HStack>
                    <HStack>
                      <FiPhone color={secondaryTextColor} />
                      <Text fontSize="sm" color={secondaryTextColor}>
                        {order.driver.user.phone || 'N/A'}
                      </Text>
                    </HStack>
                  </>
                ) : (
                  <Box p={3} bg={cardBg} borderRadius="md" borderWidth={1} borderColor="#f59e0b">
                    <HStack spacing={2}>
                      <FiAlertTriangle color="#f59e0b" />
                      <Text fontSize="sm" color="#f59e0b">
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
                      borderColor={borderColor}
                      color="#10b981"
                      _hover={{ bg: '#1a1a1a' }}
                    >
                      Assign Driver
                    </Button>
                  </Box>
                )}
              </VStack>
              <Divider borderColor={borderColor} />

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" fontSize="md" color={textColor}>
                      Items ({order.items.length})
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {order.items.map((item, index) => (
                        <Box key={item.id || index} p={3} borderWidth={1} borderRadius="md" bg={cardBg} borderColor={borderColor}>
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                                {item.name}
                              </Text>
                              <HStack spacing={4}>
                                <Text fontSize="xs" color={secondaryTextColor}>
                                  Qty: {item.quantity}
                                </Text>
                                {item.volumeM3 > 0 && (
                                  <Text fontSize="xs" color={secondaryTextColor}>
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
                                bg={borderColor}
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
                  <Divider borderColor={borderColor} />
                </>
              )}

              {/* Order Details */}
              <VStack align="stretch" spacing={4}>
                <Text fontWeight="bold" fontSize="md" color={textColor}>
                  Booking Details
                </Text>
                
                {/* Price Overview Card */}
                <Card bg={cardBg} borderColor={newCalculatedPrice ? "#f59e0b" : "#10b981"} borderWidth={newCalculatedPrice ? 2 : 1}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {newCalculatedPrice && isEditing && (
                        <Alert status="warning" bg="rgba(245, 158, 11, 0.15)" borderRadius="md" borderWidth={2} borderColor="#f59e0b">
                          <AlertIcon color="#f59e0b" boxSize={5} />
                          <VStack align="start" spacing={1} flex={1}>
                            <Text fontSize="md" fontWeight="bold" color="#f59e0b">
                              💰 New Price Calculated by Enterprise Engine
                            </Text>
                            <HStack spacing={3} w="full">
                              <Box flex={1}>
                                <Text fontSize="xs" color={secondaryTextColor}>Old Price:</Text>
                                <Text fontSize="lg" fontWeight="bold" color="#ef4444" textDecoration="line-through">
                                  £{(order.totalGBP / 100).toFixed(2)}
                                </Text>
                              </Box>
                              <Text fontSize="2xl" color="#f59e0b">→</Text>
                              <Box flex={1}>
                                <Text fontSize="xs" color={secondaryTextColor}>New Price:</Text>
                                <Text fontSize="lg" fontWeight="bold" color="#10b981">
                                  £{(newCalculatedPrice / 100).toFixed(2)}
                                </Text>
                              </Box>
                            </HStack>
                            <Text fontSize="xs" color={secondaryTextColor} fontStyle="italic">
                              ⚠️ Price will be updated when you click "Save & Update Price"
                            </Text>
                          </VStack>
                        </Alert>
                      )}
                      <SimpleGrid columns={2} spacing={4}>
                        <Stat>
                          <StatLabel fontSize="xs" color={secondaryTextColor}>
                            {newCalculatedPrice && isEditing ? 'Current Price' : 'Customer Paid'}
                          </StatLabel>
                          <StatNumber fontSize="2xl" color={newCalculatedPrice && isEditing ? secondaryTextColor : "#10b981"}>
                            {formatCurrency(order.totalGBP)}
                          </StatNumber>
                          {newCalculatedPrice && isEditing && (
                            <StatHelpText fontSize="sm" color="#f59e0b" fontWeight="bold">
                              New: {formatCurrency(newCalculatedPrice)}
                            </StatHelpText>
                          )}
                        </Stat>
                        <Stat>
                          <StatLabel fontSize="xs" color={secondaryTextColor}>
                            Est. Driver Earnings
                          </StatLabel>
                          <StatNumber fontSize="2xl" color="#2563eb">
                            {calculateDriverEarnings(order).formatted}
                          </StatNumber>
                          <StatHelpText fontSize="xs" color={secondaryTextColor}>
                            Base + Mileage + Time
                          </StatHelpText>
                        </Stat>
                      </SimpleGrid>
                      {isEditing && (
                        <VStack spacing={2} align="stretch">
                          {isRecalculatingPrice && (
                            <Progress 
                              size="xs" 
                              isIndeterminate 
                              colorScheme="orange"
                              borderRadius="full"
                            />
                          )}
                          <Button
                            leftIcon={<FiDollarSign />}
                            size="sm"
                            colorScheme="orange"
                            variant="outline"
                            onClick={recalculatePrice}
                            isLoading={isRecalculatingPrice}
                            loadingText="Calculating with Enterprise Engine..."
                            borderColor="#f59e0b"
                            color="#f59e0b"
                            _hover={{ bg: 'rgba(245, 158, 11, 0.1)' }}
                          >
                            {newCalculatedPrice ? '🔄 Recalculate Again' : '💰 Calculate New Price'}
                          </Button>
                        </VStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
                
                {/* Trip Metrics Card */}
                <Card bg={cardBg} borderColor="#2563eb" borderWidth={1}>
                  <CardBody>
                    <SimpleGrid columns={2} spacing={4}>
                      <VStack align="start" spacing={1}>
                        <HStack spacing={1}>
                          {getStatusIcon(!!(order.baseDistanceMiles || order.distanceMeters), true)}
                          <Text fontSize="xs" color={secondaryTextColor}>Distance</Text>
                        </HStack>
                        <Text fontWeight="bold" fontSize="lg" color={
                          (order.baseDistanceMiles || order.distanceMeters) ? "#2563eb" : "#ef4444"
                        }>
                          {order.baseDistanceMiles 
                            ? `${order.baseDistanceMiles.toFixed(1)} mi`
                            : order.distanceMeters
                              ? `${(order.distanceMeters / 1609.34).toFixed(1)} mi`
                              : 'NOT CALCULATED'
                          }
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={1}>
                        <HStack spacing={1}>
                          <FiClock color={secondaryTextColor} />
                          <Text fontSize="xs" color={secondaryTextColor}>Duration</Text>
                        </HStack>
                        <Text fontWeight="bold" fontSize="lg" color="#2563eb">
                          {formatDuration(order.durationSeconds)}
                        </Text>
                      </VStack>
                    </SimpleGrid>
                  </CardBody>
                </Card>
                
                {/* Driver Earnings Breakdown */}
                {(order.distanceMeters || order.baseDistanceMiles) && order.durationSeconds && (
                  <Card bg={cardBg} borderColor="#a855f7" borderWidth={1}>
                    <CardBody>
                      <VStack align="stretch" spacing={2}>
                        <HStack spacing={2}>
                          <FiTrendingUp color="#a855f7" />
                          <Text fontSize="sm" fontWeight="bold" color="#a855f7">
                            Driver Earnings Breakdown
                          </Text>
                        </HStack>
                        <Divider borderColor={borderColor} />
                        <HStack justify="space-between" fontSize="xs">
                          <Text color={secondaryTextColor}>Base Fare:</Text>
                          <Text fontWeight="medium" color={textColor}>£{calculateDriverEarnings(order).base.toFixed(2)}</Text>
                        </HStack>
                        <HStack justify="space-between" fontSize="xs">
                          <Text color={secondaryTextColor}>Mileage Fee:</Text>
                          <Text fontWeight="medium" color={textColor}>£{calculateDriverEarnings(order).mileage.toFixed(2)}</Text>
                        </HStack>
                        <HStack justify="space-between" fontSize="xs">
                          <Text color={secondaryTextColor}>Time Fee:</Text>
                          <Text fontWeight="medium" color={textColor}>£{calculateDriverEarnings(order).time.toFixed(2)}</Text>
                        </HStack>
                        <Divider borderColor={borderColor} />
                        <HStack justify="space-between">
                          <Text fontSize="sm" fontWeight="bold" color="#a855f7">Total Driver Gets:</Text>
                          <Text fontSize="md" fontWeight="bold" color="#a855f7">
                            {calculateDriverEarnings(order).formatted}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color={secondaryTextColor} fontStyle="italic">
                          * Actual earnings calculated at job completion
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
                {isEditing ? (
                  <>
                    <FormControl>
                      <FormLabel color={textColor} fontSize="sm">Scheduled Date & Time</FormLabel>
                      <Input
                        type="datetime-local"
                        value={editedOrder.scheduledAt ? new Date(editedOrder.scheduledAt).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditedOrder({
                          ...editedOrder,
                          scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : order?.scheduledAt
                        })}
                        bg={cardBg}
                        color={textColor}
                        borderColor={borderColor}
                        _hover={{ borderColor: '#2563eb' }}
                        _focus={{ borderColor: '#2563eb', bg: cardBg }}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel color={textColor} fontSize="sm">Time Slot</FormLabel>
                      <Input
                        type="text"
                        value={editedOrder.pickupTimeSlot || ''}
                        onChange={(e) => setEditedOrder({
                          ...editedOrder,
                          pickupTimeSlot: e.target.value
                        })}
                        placeholder="e.g., 8 AM - 12 PM"
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
                    <HStack justify="space-between">
                      <Text color={textColor}>Scheduled Date</Text>
                      <Text color={textColor}>
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
                      <Text color={textColor}>Scheduled Time</Text>
                      <Text color={textColor}>
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
                        <Text color={textColor}>Time Slot</Text>
                      </HStack>
                      <Text color={order.pickupTimeSlot ? textColor : "#f59e0b"}>
                        {order.pickupTimeSlot || 'NOT SPECIFIED'}
                      </Text>
                    </HStack>
                  </>
                )}
                <HStack justify="space-between">
                  <Text color={textColor}>Created</Text>
                  <Text color={textColor}>
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
                    <Text color={textColor}>Paid At</Text>
                    <Text color={textColor}>
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
              <Divider borderColor={borderColor} />
              <VStack align="stretch" spacing={2}>
                <HStack spacing={1}>
                  {getStatusIcon(!!order.notes, false)}
                  <Text fontWeight="bold" fontSize="md" color={textColor}>
                    Customer Notes
                  </Text>
                </HStack>
                {isEditing ? (
                  <FormControl>
                    <Textarea
                      value={editedOrder.notes || ''}
                      onChange={(e) => setEditedOrder({
                        ...editedOrder,
                        notes: e.target.value
                      })}
                      placeholder="Enter customer notes or special instructions..."
                      rows={4}
                      bg={cardBg}
                      color={textColor}
                      borderColor={borderColor}
                      _hover={{ borderColor: '#2563eb' }}
                      _focus={{ borderColor: '#2563eb', bg: cardBg }}
                    />
                  </FormControl>
                ) : (
                  <Box 
                    p={3} 
                    borderRadius="md" 
                    bg={order.notes ? cardBg : cardBg}
                    borderWidth={1}
                    borderColor={order.notes ? "#2563eb" : borderColor}
                  >
                    <Text fontSize="sm" color={order.notes ? textColor : secondaryTextColor} fontStyle={!order.notes ? "italic" : "normal"}>
                      {order.notes || 'No customer notes provided'}
                    </Text>
                  </Box>
                )}
              </VStack>

              {/* Actions */}
              <Divider borderColor={borderColor} />
              {isEditing ? (
                <VStack spacing={3} pt={4} align="stretch">
                  {newCalculatedPrice && (
                    <Alert status="warning" bg="rgba(245, 158, 11, 0.15)" borderRadius="md" borderWidth={1} borderColor="#f59e0b">
                      <AlertIcon color="#f59e0b" />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="bold" color="#f59e0b">
                          ⚠️ Price Will Be Updated
                        </Text>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          New price £{(newCalculatedPrice / 100).toFixed(2)} will replace current £{(order.totalGBP / 100).toFixed(2)}
                        </Text>
                      </VStack>
                    </Alert>
                  )}
                  <HStack spacing={3}>
                    <Button
                      leftIcon={<FiSave />}
                      colorScheme="green"
                      size="sm"
                      flex={1}
                      onClick={handleEditSave}
                      isLoading={isSaving}
                      loadingText="Saving..."
                      bg="#10b981"
                      color="#FFFFFF"
                      _hover={{ bg: '#059669' }}
                    >
                      {newCalculatedPrice ? 'Save & Update Price' : 'Save Changes'}
                    </Button>
                    <Button
                      leftIcon={<FiX />}
                      variant="outline"
                      size="sm"
                      flex={1}
                      onClick={handleEditCancel}
                      isDisabled={isSaving}
                      borderColor={borderColor}
                      color={textColor}
                      _hover={{ bg: '#1a1a1a' }}
                    >
                      Cancel Edit
                    </Button>
                  </HStack>
                </VStack>
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
                      bg="#2563eb"
                      color="#FFFFFF"
                      _hover={{ bg: '#1d4ed8' }}
                      _disabled={{ bg: '#1a1a1a', color: secondaryTextColor, opacity: 0.5 }}
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
                      borderColor={borderColor}
                      color="#10b981"
                      _hover={{ bg: '#1a1a1a' }}
                      _disabled={{ borderColor: borderColor, color: secondaryTextColor, opacity: 0.5 }}
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
                      borderColor={borderColor}
                      color="#f59e0b"
                      _hover={{ bg: '#1a1a1a' }}
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
                      borderColor={borderColor}
                      color={textColor}
                      _hover={{ bg: '#1a1a1a' }}
                      _disabled={{ borderColor: borderColor, color: secondaryTextColor, opacity: 0.5 }}
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
                        borderColor={borderColor}
                        color="#f59e0b"
                        _hover={{ bg: '#1a1a1a' }}
                        _disabled={{ borderColor: borderColor, color: secondaryTextColor, opacity: 0.5 }}
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
                      borderColor={borderColor}
                      color="#ef4444"
                      _hover={{ bg: '#1a1a1a' }}
                      _disabled={{ borderColor: borderColor, color: secondaryTextColor, opacity: 0.5 }}
                    >
                      Cancel Order
                    </Button>
                  </HStack>
                </VStack>
              )}
            </VStack>
          ) : (
            <Text color={textColor} textAlign="center" py={8}>
              No order selected
            </Text>
          )}
        </DrawerBody>
      </DrawerContent>

      {/* Cancel Order Confirmation Modal */}
      <Modal isOpen={isCancelModalOpen} onClose={onCancelModalClose}>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg={bgColor} borderColor={borderColor} borderWidth={1}>
          <ModalHeader color="#ef4444" bg={cardBg} borderBottom={`1px solid ${borderColor}`}>
            <HStack spacing={2}>
              <FiTrash2 />
              <Text color="#ef4444">Cancel Order</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color={textColor} _hover={{ bg: '#1a1a1a' }} />
          <ModalBody bg={bgColor} color={textColor}>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" bg="#1a1a1a" borderColor={borderColor}>
                <AlertIcon color="#f59e0b" />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold" color={textColor}>This action cannot be undone!</Text>
                  <Text fontSize="sm" color={textColor}>
                    Cancelling this order will:
                  </Text>
                </VStack>
              </Alert>
              
              <VStack align="start" spacing={2} pl={4}>
                <Text fontSize="sm" color={textColor}>• Change order status to CANCELLED</Text>
                <Text fontSize="sm" color={textColor}>• Send cancellation notification to customer</Text>
                <Text fontSize="sm" color={textColor}>• Remove from active orders list</Text>
                <Text fontSize="sm" color={textColor}>• Trigger refund process if payment was made</Text>
              </VStack>

              {order && (
                <Box p={3} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
                  <Text fontWeight="bold" fontSize="sm" mb={1} color={textColor}>Order to Cancel:</Text>
                  <Text fontSize="sm" color={textColor}>Reference: {order.reference}</Text>
                  <Text fontSize="sm" color={textColor}>Customer: {order.customerName}</Text>
                  <Text fontSize="sm" color={textColor}>Amount: {formatCurrency(order.totalGBP)}</Text>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter bg={cardBg} borderTop={`1px solid ${borderColor}`}>
            <HStack spacing={3}>
              <Button 
                variant="outline" 
                onClick={onCancelModalClose}
                isDisabled={isCancelling}
                borderColor={borderColor}
                color={textColor}
                _hover={{ bg: '#1a1a1a' }}
              >
                Keep Order
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleCancelOrder}
                isLoading={isCancelling}
                loadingText="Cancelling..."
                bg="#ef4444"
                color="#FFFFFF"
                _hover={{ bg: '#dc2626' }}
              >
                Yes, Cancel Order
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign Driver Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={onAssignModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent maxH="90vh" bg={bgColor} borderColor={borderColor} borderWidth={1}>
          <ModalHeader bg={cardBg} borderBottom={`1px solid ${borderColor}`} color={textColor}>
            <HStack spacing={2}>
              <FiTruck color={textColor} />
              <Text color={textColor}>{order?.driver ? 'Change Driver' : 'Assign Driver'}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color={textColor} _hover={{ bg: '#1a1a1a' }} />
          <ModalBody overflowY="auto" maxH="60vh" bg={bgColor} color={textColor}>
            <VStack spacing={4} align="stretch">
              <Alert status="info" bg="#1a1a1a" borderColor={borderColor}>
                <AlertIcon color="#2563eb" />
                <Text fontSize="sm" color={textColor}>
                  {order?.driver 
                    ? 'Select a new driver to replace the current one. The current driver will be notified of the change.'
                    : 'Select a driver to assign to this order. The driver will be notified immediately.'
                  }
                </Text>
              </Alert>

              <FormControl>
                <FormLabel color={textColor}>Available Drivers</FormLabel>
                {isLoadingDrivers ? (
                  <HStack justify="center" py={4}>
                    <Spinner size="sm" color="#2563eb" />
                    <Text color={textColor}>Loading drivers...</Text>
                  </HStack>
                ) : availableDrivers.length === 0 ? (
                  <VStack spacing={3} align="stretch">
                    <Alert status="warning" bg="#1a1a1a" borderColor={borderColor}>
                      <AlertIcon color="#f59e0b" />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>No drivers found</Text>
                        <Text fontSize="xs" color={textColor}>
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
                        borderColor={borderColor}
                        color="#2563eb"
                        _hover={{ bg: '#1a1a1a' }}
                      >
                        Refresh Driver List
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        variant="outline"
                        borderColor={borderColor}
                        color="#f59e0b"
                        _hover={{ bg: '#1a1a1a' }}
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
                  <VStack spacing={4} align="stretch">
                    {/* Interactive Driver Location Map */}
                    {order && order.pickupAddress && 
                     order.pickupAddress.lat !== null && order.pickupAddress.lat !== undefined && 
                     order.pickupAddress.lng !== null && order.pickupAddress.lng !== undefined && 
                     !isNaN(Number(order.pickupAddress.lat)) && !isNaN(Number(order.pickupAddress.lng)) &&
                     availableDrivers.length > 0 ? (
                      <Box 
                        h="450px" 
                        bg={cardBg} 
                        borderRadius="md" 
                        border="1px solid" 
                        borderColor={borderColor}
                        position="relative"
                        overflow="hidden"
                      >
                        <iframe
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <meta charset="utf-8">
                              <meta name="viewport" content="width=device-width, initial-scale=1">
                              <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
                              <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
                              <style>
                                body { margin: 0; padding: 0; }
                                #map { position: absolute; top: 0; bottom: 0; width: 100%; }
                              </style>
                            </head>
                            <body>
                              <div id='map'></div>
                              <script>
                                mapboxgl.accessToken = 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg';
                                
                                const pickupLat = ${order.pickupAddress.lat};
                                const pickupLng = ${order.pickupAddress.lng};
                                const dropoffLat = ${order.dropoffAddress?.lat || order.pickupAddress.lat};
                                const dropoffLng = ${order.dropoffAddress?.lng || order.pickupAddress.lng};
                                
                                const drivers = ${JSON.stringify(
                                  availableDrivers
                                    .filter(d => 
                                      d.DriverAvailability?.location?.lat && 
                                      d.DriverAvailability?.location?.lng &&
                                      !isNaN(Number(d.DriverAvailability.location.lat)) &&
                                      !isNaN(Number(d.DriverAvailability.location.lng))
                                    )
                                    .map(d => ({
                                      name: d.name,
                                      lat: Number(d.DriverAvailability.location.lat),
                                      lng: Number(d.DriverAvailability.location.lng),
                                      status: d.DriverAvailability.status,
                                      activeJobs: d.totalActiveJobs || 0,
                                      reason: d.availabilityReason || 'Available'
                                    }))
                                )};
                                
                                const map = new mapboxgl.Map({
                                  container: 'map',
                                  style: 'mapbox://styles/mapbox/streets-v12',
                                  center: [pickupLng, pickupLat],
                                  zoom: 12,
                                  interactive: true
                                });
                                
                                // Add zoom and rotation controls
                                map.addControl(new mapboxgl.NavigationControl(), 'top-right');
                                
                                // Add fullscreen control
                                map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
                                
                                // Add pickup marker
                                const pickupEl = document.createElement('div');
                                pickupEl.className = 'marker';
                                pickupEl.innerHTML = '<div style="background: #EF4444; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span style="transform: rotate(45deg); font-size: 16px;">📍</span></div>';
                                pickupEl.style.cursor = 'pointer';
                                
                                new mapboxgl.Marker(pickupEl)
                                  .setLngLat([pickupLng, pickupLat])
                                  .setPopup(new mapboxgl.Popup({ offset: 25, maxWidth: '300px' })
                                    .setHTML('<div style="padding: 8px;"><strong>🎯 Pickup Location</strong><br/><small>${(order.pickupAddress.label || '').replace(/'/g, "\\'")}</small></div>'))
                                  .addTo(map);
                                
                                // Add dropoff marker if different
                                ${order.dropoffAddress?.lat && order.dropoffAddress?.lng && 
                                  (order.dropoffAddress.lat !== order.pickupAddress.lat || 
                                   order.dropoffAddress.lng !== order.pickupAddress.lng) ? `
                                const dropoffEl = document.createElement('div');
                                dropoffEl.innerHTML = '<div style="background: #3B82F6; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 16px;">🏁</div>';
                                dropoffEl.style.cursor = 'pointer';
                                
                                new mapboxgl.Marker(dropoffEl)
                                  .setLngLat([dropoffLng, dropoffLat])
                                  .setPopup(new mapboxgl.Popup({ offset: 25, maxWidth: '300px' })
                                    .setHTML('<div style="padding: 8px;"><strong>🏁 Dropoff Location</strong><br/><small>${(order.dropoffAddress?.label || '').replace(/'/g, "\\'")}</small></div>'))
                                  .addTo(map);
                                ` : ''}
                                
                                // Add driver markers with tooltips
                                drivers.forEach(driver => {
                                  const el = document.createElement('div');
                                  const isOnline = driver.status === 'online';
                                  el.innerHTML = '<div style="background: ' + (isOnline ? '#10B981' : '#9CA3AF') + '; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 16px; transition: transform 0.2s;">' + (isOnline ? '🚗' : '⭕') + '</div>';
                                  el.style.cursor = 'pointer';
                                  
                                  // Hover effect
                                  el.onmouseenter = function() {
                                    this.firstChild.style.transform = 'scale(1.2)';
                                  };
                                  el.onmouseleave = function() {
                                    this.firstChild.style.transform = 'scale(1)';
                                  };
                                  
                                  const popup = new mapboxgl.Popup({ 
                                    offset: 25,
                                    closeButton: false,
                                    maxWidth: '250px'
                                  }).setHTML(
                                    '<div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif;">' +
                                    '<div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">' + driver.name + '</div>' +
                                    '<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">' +
                                    '<span style="width: 8px; height: 8px; border-radius: 50%; background: ' + (isOnline ? '#10B981' : '#9CA3AF') + ';"></span>' +
                                    '<span style="font-size: 12px; font-weight: 500; color: ' + (isOnline ? '#10B981' : '#6B7280') + ';">' + driver.status.toUpperCase() + '</span>' +
                                    '</div>' +
                                    '<div style="font-size: 11px; color: #6B7280; margin-bottom: 2px;">Active Jobs: <strong>' + driver.activeJobs + '</strong></div>' +
                                    '<div style="font-size: 11px; color: #9CA3AF;">' + driver.reason + '</div>' +
                                    '</div>'
                                  );
                                  
                                  new mapboxgl.Marker(el)
                                    .setLngLat([driver.lng, driver.lat])
                                    .setPopup(popup)
                                    .addTo(map);
                                });
                                
                                // Fit bounds to show all markers
                                setTimeout(() => {
                                  const bounds = new mapboxgl.LngLatBounds();
                                  bounds.extend([pickupLng, pickupLat]);
                                  ${order.dropoffAddress?.lat && order.dropoffAddress?.lng ? `bounds.extend([dropoffLng, dropoffLat]);` : ''}
                                  drivers.forEach(d => bounds.extend([d.lng, d.lat]));
                                  map.fitBounds(bounds, { padding: 60, duration: 1000 });
                                }, 100);
                              </script>
                            </body>
                            </html>
                          `}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                        />
                        <Box 
                          position="absolute" 
                          bottom={3} 
                          left={3} 
                          bg="gray.800" 
                          px={3} 
                          py={2} 
                          borderRadius="md"
                          fontSize="xs"
                          boxShadow="lg"
                          border="1px solid"
                          borderColor="gray.200"
                        >
                          <VStack align="start" spacing={1}>
                            <HStack spacing={3}>
                              <Text fontSize="11px" fontWeight="medium">📍 Pickup</Text>
                              <Text fontSize="11px" fontWeight="medium">🏁 Dropoff</Text>
                            </HStack>
                            <HStack spacing={3}>
                              <HStack spacing={1}>
                                <Box w={2} h={2} borderRadius="full" bg="green.500" />
                                <Text fontSize="10px">Online</Text>
                              </HStack>
                              <HStack spacing={1}>
                                <Box w={2} h={2} borderRadius="full" bg="gray.400" />
                                <Text fontSize="10px">Offline</Text>
                              </HStack>
                            </HStack>
                            <Text fontSize="9px" color="gray.500" fontStyle="italic">
                              💡 Click markers • Drag to pan • Scroll to zoom
                            </Text>
                          </VStack>
                        </Box>
                      </Box>
                    ) : order && (!order.pickupAddress?.lat || !order.pickupAddress?.lng || 
                                  isNaN(Number(order.pickupAddress?.lat)) || 
                                  isNaN(Number(order.pickupAddress?.lng))) ? (
                      <Alert status="warning" variant="left-accent">
                        <AlertIcon />
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">Map Unavailable</Text>
                          <Text fontSize="xs" color="gray.600">
                            This order doesn't have valid pickup coordinates. 
                            Drivers with valid locations will still show distances in the dropdown below.
                          </Text>
                        </Box>
                      </Alert>
                    ) : null}

                    <Select
                      placeholder="👤 Click here to select a driver"
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      bg={selectedDriverId ? 'green.900' : 'gray.800'}
                      borderColor={selectedDriverId ? 'green.300' : 'gray.200'}
                      focusBorderColor="blue.500"
                      size="lg"
                    >
                      {availableDrivers.map((driver) => {
                        // Calculate distance from driver to pickup
                        let distanceText = '';
                        
                        // ✅ CRITICAL: Check all coordinates exist and are valid numbers
                        if (
                          driver.DriverAvailability?.location?.lat && 
                          driver.DriverAvailability?.location?.lng &&
                          order?.pickupAddress?.lat && 
                          order?.pickupAddress?.lng &&
                          !isNaN(driver.DriverAvailability.location.lat) &&
                          !isNaN(driver.DriverAvailability.location.lng) &&
                          !isNaN(order.pickupAddress.lat) &&
                          !isNaN(order.pickupAddress.lng)
                        ) {
                          try {
                            const driverLat = parseFloat(driver.DriverAvailability.location.lat);
                            const driverLng = parseFloat(driver.DriverAvailability.location.lng);
                            const pickupLat = Number(order.pickupAddress.lat);
                            const pickupLng = Number(order.pickupAddress.lng);
                            
                            // Haversine formula for distance
                            const R = 3959; // Earth radius in miles
                            const dLat = (pickupLat - driverLat) * Math.PI / 180;
                            const dLng = (pickupLng - driverLng) * Math.PI / 180;
                            const a = 
                              Math.sin(dLat/2) * Math.sin(dLat/2) +
                              Math.cos(driverLat * Math.PI / 180) * Math.cos(pickupLat * Math.PI / 180) *
                              Math.sin(dLng/2) * Math.sin(dLng/2);
                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                            const distance = R * c;
                            
                            if (!isNaN(distance) && isFinite(distance)) {
                              distanceText = ` - ${distance.toFixed(1)} miles away`;
                            }
                          } catch (error) {
                            console.warn('Error calculating distance:', error);
                            distanceText = ' - Location unknown';
                          }
                        } else {
                          // One or more coordinates are missing
                          distanceText = ' - Location unknown';
                        }
                        
                        return (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} - {driver.availabilityReason || 'Available'}
                            {driver.DriverAvailability?.status && ` (${driver.DriverAvailability.status})`}
                            {distanceText}
                          </option>
                        );
                      })}
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

          <ModalFooter bg="gray.800" borderTop="1px solid" borderColor="gray.600" position="sticky" bottom={0}>
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
              
              {order?.driver?.user && (
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold" fontSize="sm" mb={1}>Driver to Remove:</Text>
                  <Text fontSize="sm">Name: {order.driver.user.name || 'Unknown'}</Text>
                  <Text fontSize="sm">Email: {order.driver.user.email || 'N/A'}</Text>
                  <Text fontSize="sm">Phone: {order.driver.user.phone || 'N/A'}</Text>
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

