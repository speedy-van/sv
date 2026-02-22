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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
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
  FiTrendingDown,
  FiArrowUpRight,
  FiArrowDownRight,
  FiCopy,
} from 'react-icons/fi';
import PaymentConfirmationButton from './PaymentConfirmationButton';
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';
import { OrderTimeline } from './OrderTimeline';
import { JourneyRelationshipCard } from './JourneyRelationshipCard';
import { OrderMapPreview } from './OrderMapPreview';
import { OrderOverviewTab } from './order-details/OrderOverviewTab';
import { OrderJourneysTab } from './order-details/OrderJourneysTab';
import { OrderPaymentTab } from './order-details/OrderPaymentTab';

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
  
  // Calculate realistic duration if not available
  let durationMinutes = 0;
  if (order.durationSeconds && order.durationSeconds > 3600) {
    durationMinutes = order.durationSeconds / 60;
  } else if (distanceMiles > 0) {
    // Estimate based on distance: 30mph average + 30min loading
    durationMinutes = (distanceMiles / 30) * 60 + 30;
  } else {
    durationMinutes = order.estimatedDurationMinutes || 0;
  }
  
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

export interface OrderDetail {
  id: string;
  reference: string;
  status: string;
  scheduledAt: string;
  totalGBP: number;
  stripePaymentIntentId?: string | null;
  paymentCaptured?: boolean;
  paymentCapturedAt?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amountPaidGBP?: number;
  additionalPaymentStatus?: 'NONE' | 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  additionalPaymentAmountGBP?: number;
  additionalPaymentRequestedAt?: string | null;
  additionalPaymentPaidAt?: string | null;
  additionalPaymentStripeIntent?: string | null;
  lastPaymentDate?: string | null;
  lastRefundDate?: string | null;
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
  crewSize?: string; // Number of helpers: ONE, TWO, THREE, FOUR
  collectionSource?: string; // Where items are collected from
  marketplacePickup?: {
    sellerHelpsLoading?: boolean;
    sellerContactName?: string;
    sellerPhone?: string;
    platformSource?: string;
  };
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
  capacityCheck?: {
    isValid: boolean;
    weightUtilization: number;
    volumeUtilization: number;
    itemUtilization: number;
    warnings: string[];
    recommendations: string[];
    vansRequired?: number;
  };
  segments?: Array<{
    id: string;
    segmentType: 'outbound' | 'return' | 'additional';
    sequenceNumber: number;
    scheduledAt: string;
    estimatedArrival?: string | null;
    priceGBP: number;
    distanceMeters?: number | null;
    durationSeconds?: number | null;
    notes?: string | null;
    items?: any;
    pickupAddress?: {
      label: string;
      postcode: string;
      lat?: number | null;
      lng?: number | null;
    } | null;
    dropoffAddress?: {
      label: string;
      postcode: string;
      lat?: number | null;
      lng?: number | null;
    } | null;
    pickupProperty?: {
      propertyType: string;
      floors: number;
      accessType: string;
    } | null;
    dropoffProperty?: {
      propertyType: string;
      floors: number;
      accessType: string;
    } | null;
  }>;
  hasReturnJourney?: boolean;
  hasAdditionalJourney?: boolean;
  totalSegments?: number;
}

interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode?: string;
  variant?: 'standalone' | 'embedded';
  showSummaryCards?: boolean;
  initialTab?: 'overview' | 'timeline' | 'journeys' | 'payment';
  initialMode?: 'view' | 'edit';
}

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  isOpen,
  onClose,
  orderCode,
  variant = 'standalone',
  showSummaryCards = true,
  initialTab,
  initialMode = 'view',
}) => {
  console.log('📋 OrderDetailDrawer rendered:', {
    isOpen,
    orderCode,
    initialTab,
    initialMode,
  });
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize isEditing based on initialMode to ensure edit mode is active when drawer opens
  const [isEditing, setIsEditing] = useState(initialMode === 'edit');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [editedOrder, setEditedOrder] = useState<Partial<OrderDetail>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [newCalculatedPrice, setNewCalculatedPrice] = useState<number | null>(null);
  const [adjustedTotalGBP, setAdjustedTotalGBP] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isRequestingAdditionalPayment, setIsRequestingAdditionalPayment] = useState(false);
  const [isIssuingRefund, setIsIssuingRefund] = useState(false);
  const [isRecalculatingPrice, setIsRecalculatingPrice] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRemovingDriver, setIsRemovingDriver] = useState(false);
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
  const bgColor = '#0B1020'; // Pure black background
  const borderColor = '#2A3A5E'; // Dark gray border
  const textColor = '#F5F8FF'; // White text
  const secondaryTextColor = '#9ca3af'; // Light gray for secondary text
  const cardBg = '#121A2B'; // Dark gray for cards

  useEffect(() => {
    if (isOpen && orderCode) {
      fetchOrderDetails();
    } else if (!isOpen) {
      // Reset editing state when drawer closes
      setIsEditing(false);
      setEditedOrder({});
      setNewCalculatedPrice(null);
    }
  }, [isOpen, orderCode]);

  // Update isEditing when initialMode changes
  useEffect(() => {
    if (isOpen && initialMode === 'edit' && order) {
      setIsEditing(true);
    } else if (isOpen && initialMode === 'view') {
      setIsEditing(false);
    }
  }, [isOpen, initialMode, order?.id]);

  // Handle initial tab when drawer opens (can set before order loads)
  useEffect(() => {
    if (isOpen && initialTab) {
      const tabMap: Record<string, number> = {
        'overview': 0,
        'timeline': 1,
        'journeys': 2,
        'payment': 3,
      };
      const tabIndex = tabMap[initialTab] ?? 0;
      setActiveTab(tabIndex);
    }
  }, [isOpen, initialTab]);

  // Handle initial mode (edit) - must wait for order to load
  useEffect(() => {
    console.log('🔍 Edit mode useEffect check:', {
      isOpen,
      hasOrder: !!order,
      initialMode,
      currentIsEditing: isEditing,
      orderReference: order?.reference,
      orderId: order?.id,
    });
    
    // Force edit mode if initialMode is 'edit' and order is loaded
    if (isOpen && order && initialMode === 'edit') {
      if (!isEditing) {
        console.log('✅ Setting edit mode from initialMode prop');
        setIsEditing(true);
        setEditedOrder({
          customerName: order?.customerName || '',
          customerEmail: order?.customerEmail || '',
          customerPhone: order?.customerPhone || '',
          scheduledAt: order?.scheduledAt || '',
          pickupTimeSlot: order?.pickupTimeSlot || '',
          notes: order?.notes || '',
          pickupProperty: order?.pickupProperty ? {
            ...order.pickupProperty,
            propertyType: order.pickupProperty.propertyType,
            floors: order.pickupProperty.floors,
            accessType: order.pickupProperty.accessType,
          } : undefined,
          dropoffProperty: order?.dropoffProperty ? {
            ...order.dropoffProperty,
            propertyType: order.dropoffProperty.propertyType,
            floors: order.dropoffProperty.floors,
            accessType: order.dropoffProperty.accessType,
          } : undefined,
          pickupAddress: order?.pickupAddress ? {
            label: order.pickupAddress.label || '',
            postcode: order.pickupAddress.postcode || '',
            flatNumber: order.pickupAddress.flatNumber || '',
            lat: order.pickupAddress.lat,
            lng: order.pickupAddress.lng,
          } : undefined,
          dropoffAddress: order?.dropoffAddress ? {
            label: order.dropoffAddress.label || '',
            postcode: order.dropoffAddress.postcode || '',
            flatNumber: order.dropoffAddress.flatNumber || '',
            lat: order.dropoffAddress.lat,
            lng: order.dropoffAddress.lng,
          } : undefined,
        });
        console.log('✅ Edit mode activated, isEditing set to true');
      } else {
        console.log('ℹ️ Already in edit mode');
      }
    } else if (isOpen && order && initialMode !== 'edit' && isEditing) {
      // If initialMode is not 'edit' but we're editing, keep editing state
      console.log('ℹ️ Keeping edit mode (initialMode is not edit but isEditing is true)');
    } else {
      console.log('❌ Conditions not met for edit mode:', {
        isOpen,
        hasOrder: !!order,
        initialMode,
        isEditing,
      });
    }
  }, [isOpen, order?.id, initialMode]); // Remove isEditing from dependencies to avoid infinite loop

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

  useEffect(() => {
    if (order) {
      setAdjustedTotalGBP(order.totalGBP);
    }
  }, [order?.id, order?.totalGBP]);

  useEffect(() => {
    if (order && (order.amountPaidGBP ?? 0) > 0 && newCalculatedPrice) {
      setAdjustedTotalGBP(newCalculatedPrice);
    }
  }, [order, newCalculatedPrice]);

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

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return value;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds === 0) return 'Not calculated';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0 && minutes === 0) return 'Not calculated';
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const calculateEstimatedDuration = (order: OrderDetail) => {
    // If we have actual duration, use it
    if (order.durationSeconds && order.durationSeconds > 3600) {
      return order.durationSeconds;
    }
    
    // Calculate based on distance (if available)
    const distanceMiles = order.baseDistanceMiles || (order.distanceMeters ? order.distanceMeters / 1609.34 : 0);
    
    if (distanceMiles > 0) {
      // Estimate: 30mph average speed in city + 30min loading/unloading
      const drivingMinutes = (distanceMiles / 30) * 60;
      const loadingMinutes = 30;
      const totalMinutes = drivingMinutes + loadingMinutes;
      return Math.round(totalMinutes * 60); // Convert to seconds
    }
    
    return 0; // Return 0 if no data available
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
      pickupProperty: order?.pickupProperty ? {
        ...order.pickupProperty,
        propertyType: order.pickupProperty.propertyType,
        floors: order.pickupProperty.floors,
        accessType: order.pickupProperty.accessType,
      } : undefined,
      dropoffProperty: order?.dropoffProperty ? {
        ...order.dropoffProperty,
        propertyType: order.dropoffProperty.propertyType,
        floors: order.dropoffProperty.floors,
        accessType: order.dropoffProperty.accessType,
      } : undefined,
      pickupAddress: order?.pickupAddress ? {
        label: order.pickupAddress.label || '',
        postcode: order.pickupAddress.postcode || '',
        flatNumber: order.pickupAddress.flatNumber || '',
        lat: order.pickupAddress.lat,
        lng: order.pickupAddress.lng,
      } : undefined,
      dropoffAddress: order?.dropoffAddress ? {
        label: order.dropoffAddress.label || '',
        postcode: order.dropoffAddress.postcode || '',
        flatNumber: order.dropoffAddress.flatNumber || '',
        lat: order.dropoffAddress.lat,
        lng: order.dropoffAddress.lng,
      } : undefined,
      segments: order?.segments ? order.segments.map(seg => ({
        ...seg,
        pickupAddress: seg.pickupAddress ? { ...seg.pickupAddress } : null,
        dropoffAddress: seg.dropoffAddress ? { ...seg.dropoffAddress } : null,
        pickupProperty: seg.pickupProperty ? { ...seg.pickupProperty } : null,
        dropoffProperty: seg.dropoffProperty ? { ...seg.dropoffProperty } : null,
      })) : undefined,
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
      // Extract address components for API (use edited values if available, otherwise use original)
      const pickupLabel = editedOrder.pickupAddress?.label || order.pickupAddress?.label || '';
      const dropoffLabel = editedOrder.dropoffAddress?.label || order.dropoffAddress?.label || '';
      
      // Use updated coordinates if available (editedOrder takes priority)
      const pickupLat = (editedOrder.pickupAddress?.lat !== undefined && editedOrder.pickupAddress?.lat !== null)
        ? editedOrder.pickupAddress.lat
        : (order.pickupAddress?.lat ?? 51.5074);
      const pickupLng = (editedOrder.pickupAddress?.lng !== undefined && editedOrder.pickupAddress?.lng !== null)
        ? editedOrder.pickupAddress.lng
        : (order.pickupAddress?.lng ?? -0.1278);
      const dropoffLat = (editedOrder.dropoffAddress?.lat !== undefined && editedOrder.dropoffAddress?.lat !== null)
        ? editedOrder.dropoffAddress.lat
        : (order.dropoffAddress?.lat ?? 51.5074);
      const dropoffLng = (editedOrder.dropoffAddress?.lng !== undefined && editedOrder.dropoffAddress?.lng !== null)
        ? editedOrder.dropoffAddress.lng
        : (order.dropoffAddress?.lng ?? -0.1278);
      
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

      // Use ACTUAL items from editedOrder if available, otherwise from order
      const itemsSource = editedOrder.items || order.items;
      const itemsForPricing = (itemsSource && itemsSource.length > 0) 
        ? itemsSource.map((item: any) => ({
            id: item.id || item.name.toLowerCase().replace(/\s+/g, '-'),
            name: item.name,
            quantity: item.quantity || 1,
          }))
        : [
            // Fallback only if no items exist
            {
              id: 'medium-box',
              name: 'Medium Box',
              quantity: 5,
            }
          ];

      // Convert crewSize from 'ONE', 'TWO', etc. to '1', '2', etc. for API
      // Use editedOrder.crewSize if available, otherwise use order.crewSize
      const crewSizeMap: Record<string, string> = {
        'ONE': '1',
        'TWO': '2',
        'THREE': '3',
        'FOUR': '4',
      };
      const crewSizeSource = editedOrder.crewSize || order.crewSize;
      const crewSize = crewSizeSource 
        ? (crewSizeMap[crewSizeSource] || '2')
        : '2';

      // Use updated property details if available
      const pickupPropertyType = (editedOrder.pickupProperty?.propertyType || order.pickupProperty?.propertyType || 'DETACHED').toLowerCase();
      const dropoffPropertyType = (editedOrder.dropoffProperty?.propertyType || order.dropoffProperty?.propertyType || 'DETACHED').toLowerCase();
      
      // Map property types to API format
      const propertyTypeMap: Record<string, 'house' | 'flat' | 'apartment'> = {
        'detached': 'house',
        'semi-detached': 'house',
        'terraced': 'house',
        'flat': 'flat',
        'apartment': 'apartment',
        'bungalow': 'house',
      };
      
      const apiPickupPropertyType = propertyTypeMap[pickupPropertyType] || 'house';
      const apiDropoffPropertyType = propertyTypeMap[dropoffPropertyType] || 'house';

      // Validate and clean postcodes with proper error handling
      const cleanPostcode = (postcode: string | undefined, addressType: string): string => {
        if (!postcode) {
          throw new Error(`${addressType} postcode is required for price calculation`);
        }
        // Remove extra spaces and ensure proper format
        const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, ' ');
        // Check if it matches UK postcode pattern
        const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
        if (!ukPostcodeRegex.test(cleaned)) {
          throw new Error(`Invalid ${addressType} postcode format: ${postcode}`);
        }
        return cleaned;
      };

      const pickupPostcode = cleanPostcode(editedOrder.pickupAddress?.postcode || order.pickupAddress?.postcode, 'Pickup');
      const dropoffPostcode = cleanPostcode(editedOrder.dropoffAddress?.postcode || order.dropoffAddress?.postcode, 'Dropoff');

      // Use updated scheduled date/time if available
      const scheduledDate = editedOrder.scheduledAt || order.scheduledAt;

      // Prepare pricing data in correct format for comprehensive API
      const pricingData = {
        pickup: {
          full: pickupLabel,
          line1: pickupLabel,
          city: pickupParsed.city || 'London',
          postcode: pickupPostcode,
          street: pickupParsed.street || 'Street',
          number: pickupParsed.number || '1',
          coordinates: {
            lat: pickupLat,
            lng: pickupLng,
          },
          propertyType: apiPickupPropertyType,
        },
        dropoffs: [{
          full: dropoffLabel,
          line1: dropoffLabel,
          city: dropoffParsed.city || 'London',
          postcode: dropoffPostcode,
          street: dropoffParsed.street || 'Street',
          number: dropoffParsed.number || '1',
          coordinates: {
            lat: dropoffLat,
            lng: dropoffLng,
          },
          propertyType: apiDropoffPropertyType,
        }],
        items: itemsForPricing,
        scheduledDate: new Date(scheduledDate).toISOString(),
        serviceLevel: ((editedOrder.serviceType || order.serviceType) || 'standard') as 'economy' | 'standard' | 'premium',
        // ✅ CRITICAL: Include crewSize for crew surcharge calculation
        crewSize: crewSize,
      };

      // Validate items array before sending
      if (!pricingData.items || pricingData.items.length === 0) {
        throw new Error('Items array is required for pricing calculation');
      }

      const response = await fetch('/api/pricing/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricingData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.details && Array.isArray(errorJson.details)) {
            const errorMessages = errorJson.details.map((d: any) => `${d.path?.join('.')}: ${d.message}`).join(', ');
            throw new Error(`Validation failed: ${errorMessages}`);
          }
          throw new Error(errorJson.error || `Pricing API error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Pricing API returned ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      
      if (data.success && data.data?.amountGbpMinor) {
        // CRITICAL FIX: amountGbpMinor is in pence, totalGBP schema field stores pence (Int)
        // Do NOT divide by 100 - store the raw pence value
        const newPricePence = Math.round(data.data.amountGbpMinor);
        setNewCalculatedPrice(newPricePence);
        
        toast({
          title: '💰 Price Recalculated',
          description: `Old: £${(order.totalGBP / 100).toFixed(2)} → New: £${(newPricePence / 100).toFixed(2)}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        return newPricePence;
      }
      
      throw new Error('Invalid pricing response - missing amountGbpMinor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not recalculate price';
      toast({
        title: 'Price Calculation Failed',
        description: errorMessage,
        status: 'error',
        duration: 7000,
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
      // Step 1: Detect property/address changes in MAIN booking that affect pricing
      // Helper function to safely compare values (handles null/undefined/empty string)
      const safeCompare = (val1: any, val2: any) => {
        const normalized1 = val1 === null || val1 === undefined || val1 === '' ? null : val1;
        const normalized2 = val2 === null || val2 === undefined || val2 === '' ? null : val2;
        return normalized1 !== normalized2;
      };

      // Check for ACTUAL changes in main booking properties/addresses
      // Only require price recalculation if main booking changed, not segments
      const hasMainPropertyChanges = 
        safeCompare(editedOrder.pickupProperty?.floors, order.pickupProperty?.floors) ||
        safeCompare(editedOrder.dropoffProperty?.floors, order.dropoffProperty?.floors) ||
        safeCompare(editedOrder.pickupProperty?.propertyType, order.pickupProperty?.propertyType) ||
        safeCompare(editedOrder.dropoffProperty?.propertyType, order.dropoffProperty?.propertyType) ||
        safeCompare(editedOrder.pickupProperty?.accessType, order.pickupProperty?.accessType) ||
        safeCompare(editedOrder.dropoffProperty?.accessType, order.dropoffProperty?.accessType) ||
        safeCompare(editedOrder.pickupAddress?.label, order.pickupAddress?.label) ||
        safeCompare(editedOrder.pickupAddress?.postcode, order.pickupAddress?.postcode) ||
        safeCompare(editedOrder.pickupAddress?.flatNumber, order.pickupAddress?.flatNumber) ||
        safeCompare(editedOrder.dropoffAddress?.label, order.dropoffAddress?.label) ||
        safeCompare(editedOrder.dropoffAddress?.postcode, order.dropoffAddress?.postcode) ||
        safeCompare(editedOrder.dropoffAddress?.flatNumber, order.dropoffAddress?.flatNumber) ||
        safeCompare(editedOrder.scheduledAt, order.scheduledAt) ||
        safeCompare(editedOrder.crewSize, order.crewSize) ||
        safeCompare(editedOrder.serviceType, order.serviceType) ||
        (editedOrder.items && order.items && 
          JSON.stringify(editedOrder.items.map((i: any) => ({ id: i.id, quantity: i.quantity }))) !== 
          JSON.stringify(order.items.map((i: any) => ({ id: i.id, quantity: i.quantity }))));

      // Step 1b: Check if segments changed (additional/return journeys)
      // Note: Segment changes don't require price recalculation as segments have their own prices
      const hasSegmentChanges = editedOrder.segments && order.segments && 
        JSON.stringify(editedOrder.segments.map((s: any) => ({
          id: s.id,
          pickupAddress: s.pickupAddress,
          dropoffAddress: s.dropoffAddress,
          pickupProperty: s.pickupProperty,
          dropoffProperty: s.dropoffProperty,
          scheduledAt: s.scheduledAt,
          notes: s.notes,
        }))) !== JSON.stringify(order.segments.map((s: any) => ({
          id: s.id,
          pickupAddress: s.pickupAddress,
          dropoffAddress: s.dropoffAddress,
          pickupProperty: s.pickupProperty,
          dropoffProperty: s.dropoffProperty,
          scheduledAt: s.scheduledAt,
          notes: s.notes,
        })));

      // Step 2: Validate price recalculation ONLY if MAIN booking property changes detected
      // Segment changes are allowed without price recalculation
      let updatedPrice = order.totalGBP;
      
      // Only require price recalculation for main booking changes, not segment changes
      if (hasMainPropertyChanges) {
        if (newCalculatedPrice) {
          // Use the already calculated price
          updatedPrice = newCalculatedPrice;
        } else {
          // CRITICAL: Block save if MAIN booking property changed but no valid price calculated
          toast({
            title: '⚠️ Price Recalculation Required',
            description: 'Main booking property details or addresses have changed. Please click "Recalculate Price" before saving.',
            status: 'warning',
            duration: 8000,
            isClosable: true,
          });
          setIsSaving(false);
          return;
        }
      }
      // If only segments changed (and no main property changes), allow save without price recalculation

      const priceChanged = updatedPrice !== order.totalGBP;
      const isPaidOrder = (order.amountPaidGBP ?? 0) > 0 || !!order.paidAt;

      if (priceChanged && isPaidOrder) {
        setAdjustedTotalGBP(updatedPrice);
        toast({
          title: 'Payment Adjustment Required',
          description: 'This booking already has a payment on record. Use the payment adjustment actions to request additional payment or issue a refund.',
          status: 'warning',
          duration: 9000,
          isClosable: true,
        });
        setIsSaving(false);
        return;
      }

      // Step 3: Update order with new data and validated price
      const response = await fetch(`/api/admin/orders/${order.reference}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editedOrder,
          ...(priceChanged && !isPaidOrder ? { totalGBP: updatedPrice } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      const result = await response.json();
      
      // Check for warnings (e.g., price change after payment)
      if (result.warning) {
        toast({
          title: '⚠️ Warning: Manual Action Required',
          description: result.warning.message || 'Price changed after payment - manual Stripe adjustment may be needed.',
          status: 'warning',
          duration: 10000,
          isClosable: true,
        });
      }
      
      setOrder(result);
      setIsEditing(false);
      setEditedOrder({});
      
      // Show price change notification if price was updated
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

  // Handle sending SMS confirmation
  const handleSendSMSConfirmation = async () => {
    if (!order) return;

    // Check if phone number exists
    const phoneToUse = editedOrder?.customerPhone || order.customerPhone;
    if (!phoneToUse || phoneToUse.length < 10) {
      toast({
        title: 'No Phone Number',
        description: 'Please provide a valid phone number before sending SMS confirmation.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSendingSMS(true);
    try {
      const smsMessage = `Your Speedy Van booking ${order.reference} has been confirmed. We'll notify you once your driver is assigned.\n\nTrack your booking: https://speedy-van.co.uk/track\n\nFor assistance, call 01202 129746 or email support@speedy-van.co.uk`;

      const response = await fetch('/api/notifications/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneToUse,
          message: smsMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send SMS confirmation');
      }

      toast({
        title: 'SMS Sent Successfully',
        description: 'SMS confirmation sent to customer.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      toast({
        title: 'SMS Failed',
        description: error instanceof Error ? error.message : 'Failed to send SMS confirmation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSendingSMS(false);
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

  const handleRequestAdditionalPayment = async () => {
    if (!order) return;

    const amountPaid = order.amountPaidGBP ?? 0;
    const difference = adjustedTotalGBP - amountPaid;

    if (difference <= 0) {
      toast({
        title: 'No Additional Payment Needed',
        description: 'The adjusted total is not greater than the amount already paid.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsRequestingAdditionalPayment(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.reference}/create-additional-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetTotalGBP: adjustedTotalGBP,
          reason: adjustmentReason ? adjustmentReason.trim() : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create additional payment request');
      }

      const data = await response.json();
      const checkoutUrl = data?.data?.checkoutUrl as string | undefined;

      toast({
        title: 'Additional Payment Requested',
        description: checkoutUrl
          ? `Customer notified. Payment link: ${checkoutUrl}`
          : 'Customer notified of the additional payment.',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });

      if (checkoutUrl) {
        try {
          window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        } catch (openError) {
          console.warn('Unable to open checkout link automatically:', openError);
        }
      }

      setAdjustmentReason('');
      setNewCalculatedPrice(null);
      fetchOrderDetails();
    } catch (error) {
      toast({
        title: 'Additional Payment Failed',
        description: error instanceof Error ? error.message : 'Could not create additional payment request',
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setIsRequestingAdditionalPayment(false);
    }
  };

  const handleIssueRefund = async () => {
    if (!order) return;

    const amountPaid = order.amountPaidGBP ?? 0;
    const refundAmount = amountPaid - adjustedTotalGBP;

    if (refundAmount <= 0) {
      toast({
        title: 'No Refund Needed',
        description: 'The adjusted total is not less than the amount already paid.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsIssuingRefund(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.reference}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetTotalGBP: adjustedTotalGBP,
          reason: adjustmentReason ? adjustmentReason.trim() : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to issue refund');
      }

      toast({
        title: 'Refund Initiated',
        description: `Refund of £${(refundAmount / 100).toFixed(2)} has been requested through Stripe.`,
        status: 'success',
        duration: 9000,
        isClosable: true,
      });

      setAdjustmentReason('');
      setNewCalculatedPrice(null);
      fetchOrderDetails();
    } catch (error) {
      toast({
        title: 'Refund Failed',
        description: error instanceof Error ? error.message : 'Could not issue refund',
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setIsIssuingRefund(false);
    }
  };

  const additionalPaymentStatusMeta = useMemo(() => {
    const status = order?.additionalPaymentStatus || 'NONE';
    switch (status) {
      case 'PENDING':
        return { label: 'Pending Additional Payment', color: 'orange', description: 'Awaiting customer payment for the outstanding balance.' };
      case 'PAID':
        return { label: 'Additional Payment Received', color: 'green', description: 'The requested additional payment was collected successfully.' };
      case 'REFUNDED':
        return { label: 'Adjustment Refunded', color: 'purple', description: 'A refund was issued after the customer had paid in full.' };
      case 'FAILED':
        return { label: 'Payment Failed', color: 'red', description: 'The additional payment attempt failed. Review Stripe logs.' };
      default:
        return { label: 'No Additional Payments', color: 'gray', description: 'No outstanding post-payment adjustments.' };
    }
  }, [order?.additionalPaymentStatus]);

  const amountPaid = order?.amountPaidGBP ?? 0;
  const outstandingAmount = order ? Math.max(order.totalGBP - amountPaid, 0) : 0;
  const adjustedDifference = adjustedTotalGBP - amountPaid;

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
        bg="#0B1020" 
        color="#F5F8FF"
        maxW={isEmbedded ? { base: '100%', lg: '520px' } : undefined}
        ml={isEmbedded ? 'auto' : undefined}
      >
        <DrawerCloseButton 
          color={textColor} 
          size="lg"
          borderRadius="md"
          _hover={{ bg: '#18233A', transform: 'scale(1.1)' }} 
          transition="all 0.2s"
          top={4}
          right={4}
        />
        <DrawerHeader 
          borderBottom={`1px solid ${borderColor}`} 
          pb={4}
          pt={4}
          px={6}
          bg="linear-gradient(180deg, #121A2B 0%, #121A2B 100%)" 
          color={textColor} 
          position="sticky"
          top={0}
          zIndex={10}
          sx={{ 
            bg: 'linear-gradient(180deg, #121A2B 0%, #121A2B 100%)',
            backgroundColor: 'linear-gradient(180deg, #121A2B 0%, #121A2B 100%)',
            color: '#F5F8FF',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          }}
        >
          <VStack align="stretch" spacing={3} w="full">
            <HStack justify="space-between" align="center" w="full">
              <HStack spacing={3} flex={1}>
                {order && (
                  <Circle
                    size="14px"
                    bg={calculatePriority(order.scheduledAt).color}
                    animation={calculatePriority(order.scheduledAt).animation}
                    boxShadow={`0 0 8px ${calculatePriority(order.scheduledAt).color}40`}
                  />
                )}
                {orderCode && (
                  <>
                    <Badge 
                      fontSize="lg" 
                      px={4} 
                      py={2} 
                      bg="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                      color="#F5F8FF"
                      borderRadius="md"
                      fontWeight="bold"
                      boxShadow="0 2px 4px rgba(37, 99, 235, 0.3)"
                    >
                      #{orderCode}
                    </Badge>
                    <Tooltip label="Copy order code" placement="top">
                      <IconButton
                        aria-label="Copy order code"
                        icon={<FiCopy />}
                        size="sm"
                        variant="ghost"
                        color="#F5F8FF"
                        borderRadius="md"
                        _hover={{ bg: '#18233A', color: '#10b981', transform: 'scale(1.1)' }}
                        transition="all 0.2s"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleCopyOrderCode();
                        }}
                      />
                    </Tooltip>
                  </>
                )}
              </HStack>
              {order && (
                <Badge 
                  colorScheme={
                    calculatePriority(order.scheduledAt).level === 'urgent' ? 'red' :
                    calculatePriority(order.scheduledAt).level === 'high' ? 'orange' :
                    calculatePriority(order.scheduledAt).level === 'medium' ? 'yellow' :
                    'green'
                  }
                  fontSize="xs"
                  px={3}
                  py={1.5}
                  borderRadius="md"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {calculatePriority(order.scheduledAt).label}
                </Badge>
              )}
            </HStack>
            {order && (
              <HStack spacing={4} fontSize="sm" color={secondaryTextColor}>
                <HStack spacing={1.5}>
                  <Icon as={FiClock} />
                  <Text>{new Date(order.scheduledAt).toLocaleDateString('en-GB', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short',
                    year: 'numeric'
                  })}</Text>
                </HStack>
                {order.status && (
                  <Badge 
                    colorScheme={
                      order.status === 'COMPLETED' ? 'green' :
                      order.status === 'CANCELLED' ? 'red' :
                      order.status === 'PENDING_PAYMENT' ? 'yellow' :
                      'blue'
                    }
                    fontSize="xs"
                    px={2}
                    py={1}
                  >
                    {order.status.replace('_', ' ')}
                  </Badge>
                )}
              </HStack>
            )}
          </VStack>
        </DrawerHeader>

        <DrawerBody 
          p={6} 
          bg={bgColor} 
          color={textColor}
          pt={4}
          sx={{ 
            bg: `${bgColor}`,
            backgroundColor: `${bgColor}`,
            color: `${textColor}`,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              bg: '#121A2B',
            },
            '&::-webkit-scrollbar-thumb': {
              bg: '#2A3A5E',
              borderRadius: '4px',
              '&:hover': {
                bg: '#404040',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: '#2A3A5E #121A2B',
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <Spinner size="xl" color="#2563eb" />
            </Box>
          ) : error ? (
            <Alert status="error" bg="#18233A" borderColor={borderColor}>
              <AlertIcon color="#ef4444" />
              <Text color={textColor}>{error}</Text>
            </Alert>
          ) : order ? (
            <Box mt={12}>
              <Tabs 
                colorScheme="blue" 
                variant="enclosed" 
                isLazy
                index={activeTab}
                onChange={setActiveTab}
              >
                <TabList 
                  borderColor={borderColor} 
                  mb={6}
                  borderBottom="2px solid"
                  gap={2}
                  sx={{
                  '& button': {
                    borderBottom: '2px solid transparent',
                    mb: '-2px',
                    borderRadius: 'md md 0 0',
                    fontWeight: 'medium',
                    transition: 'all 0.2s',
                    _hover: {
                      bg: '#18233A',
                      color: '#60a5fa',
                    },
                  },
                  '& button[aria-selected="true"]': {
                    borderBottomColor: '#2563eb',
                    color: '#2563eb',
                    bg: '#18233A',
                    borderTopColor: '#2563eb',
                    borderLeftColor: '#2563eb',
                    borderRightColor: '#2563eb',
                    borderTopWidth: '1px',
                    borderLeftWidth: '1px',
                    borderRightWidth: '1px',
                  },
                }}
              >
                <Tab
                  color={textColor}
                  _selected={{ color: '#2563eb', borderColor: '#2563eb' }}
                  borderColor={borderColor}
                >
                  <HStack spacing={2}>
                    <Icon as={FiUser} />
                    <Text>Overview</Text>
                  </HStack>
                </Tab>
                <Tab
                  color={textColor}
                  _selected={{ color: '#2563eb', borderColor: '#2563eb' }}
                  borderColor={borderColor}
                >
                  <HStack spacing={2}>
                    <Icon as={FiClock} />
                    <Text>Timeline</Text>
                  </HStack>
                </Tab>
                {order.segments && order.segments.length > 0 && (
                  <Tab
                    color={textColor}
                    _selected={{ color: '#2563eb', borderColor: '#2563eb' }}
                    borderColor={borderColor}
                  >
                    <HStack spacing={2}>
                      <Icon as={FiNavigation} />
                      <Text>Journeys</Text>
                      <Badge 
                        colorScheme="blue" 
                        fontSize="xs" 
                        borderRadius="full"
                        px={2}
                        minW="20px"
                      >
                        {order.segments.length}
                      </Badge>
                    </HStack>
                  </Tab>
                )}
                <Tab
                  color={textColor}
                  _selected={{ color: '#2563eb', borderColor: '#2563eb' }}
                  borderColor={borderColor}
                >
                  <HStack spacing={2}>
                    <Icon as={FiDollarSign} />
                    <Text>Payment</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel p={0}>
                  <OrderOverviewTab
                    order={order}
                    bgColor={bgColor}
                    textColor={textColor}
                    borderColor={borderColor}
                    cardBg={cardBg}
                    secondaryTextColor={secondaryTextColor}
                    completenessData={completenessData}
                    showSummaryCards={showSummaryCards}
                    onRefresh={fetchOrderDetails}
                    onEdit={handleEditStart}
                    isEditing={isEditing}
                    editedOrder={editedOrder}
                    setEditedOrder={setEditedOrder}
                    onRecalculatePrice={recalculatePrice}
                    isRecalculatingPrice={isRecalculatingPrice}
                    newCalculatedPrice={newCalculatedPrice}
                  />
                </TabPanel>

                {/* Timeline Tab */}
                <TabPanel p={0}>
                  <VStack spacing={4} align="stretch">
                    <Text fontWeight="bold" fontSize="lg" color={textColor}>
                      Order Timeline
                    </Text>
                    <Divider borderColor={borderColor} />
                    <OrderTimeline orderCode={order.reference} />
                  </VStack>
                </TabPanel>

                {/* Journeys Tab */}
                {order.segments && order.segments.length > 0 && (
                  <TabPanel p={0}>
                    <OrderJourneysTab
                      order={order}
                      bgColor={bgColor}
                      textColor={textColor}
                      borderColor={borderColor}
                      cardBg={cardBg}
                      secondaryTextColor={secondaryTextColor}
                      isEditing={isEditing}
                      editedOrder={editedOrder}
                      setEditedOrder={setEditedOrder}
                    />
                  </TabPanel>
                )}

                {/* Payment Tab */}
                <TabPanel p={0}>
                  <OrderPaymentTab
                    order={order}
                    bgColor={bgColor}
                    textColor={textColor}
                    borderColor={borderColor}
                    cardBg={cardBg}
                    secondaryTextColor={secondaryTextColor}
                    onRefresh={fetchOrderDetails}
                  />
                </TabPanel>
              </TabPanels>
              </Tabs>
              
              {/* Action Buttons - Save/Cancel when editing */}
              <Divider borderColor={borderColor} mt={6} />
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
                            New price £{(newCalculatedPrice! / 100).toFixed(2)} will replace current £{(order?.totalGBP ? (order!.totalGBP / 100).toFixed(2) : '0.00')}
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
                        color="#F5F8FF"
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
                        _hover={{ bg: '#18233A' }}
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
                        color="#F5F8FF"
                        _hover={{ bg: '#1d4ed8' }}
                        _disabled={{ bg: '#18233A', color: secondaryTextColor, opacity: 0.5 }}
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
                        _hover={{ bg: '#18233A' }}
                        _disabled={{ borderColor: borderColor, color: secondaryTextColor, opacity: 0.5 }}
                      >
                        Send Confirmation
                      </Button>
                    </HStack>
                  </VStack>
                )}
            </Box>
          ) : null}
          
          {/* Keep old content structure for reference - will be removed after testing */}
          {false && order ? (
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
                          (completenessData?.completenessScore ?? 0) >= 80 ? '#10b981' :
                          (completenessData?.completenessScore ?? 0) >= 60 ? '#f59e0b' : '#ef4444'
                        }>
                          {completenessData?.completenessScore}%
                        </Text>
                        <Progress
                          value={completenessData?.completenessScore ?? 0}
                          size="sm"
                          w="100px"
                          colorScheme={
                            (completenessData?.completenessScore ?? 0) >= 80 ? 'green' :
                            (completenessData?.completenessScore ?? 0) >= 60 ? 'orange' : 'red'
                          }
                        />
                      </HStack>
                    </HStack>
                    
                    {completenessData && ((completenessData?.critical?.length ?? 0) > 0 || (completenessData?.warning?.length ?? 0) > 0) && (
                      <VStack spacing={1} align="stretch">
                        {completenessData?.critical?.map((issue, index) => (
                          <HStack key={`critical-${index}`} spacing={2}>
                            <FiXCircle color="#ef4444" size={14} />
                            <Text fontSize="xs" color="#ef4444">
                              {issue.message}
                            </Text>
                          </HStack>
                        ))}
                        {completenessData?.warning?.map((issue, index) => (
                          <HStack key={`warning-${index}`} spacing={2}>
                            <FiAlertTriangle color="#f59e0b" size={14} />
                            <Text fontSize="xs" color="#f59e0b">
                              {issue.message}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                    
                    {completenessData && (!completenessData?.critical || completenessData?.critical?.length === 0) && (!completenessData?.warning || completenessData?.warning?.length === 0) && (
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
                    {order && (
                      <>
                        <Badge colorScheme={getStatusColor(order?.status ?? 'pending')} size="lg">
                          {order?.status?.replace('_', ' ') ?? 'pending'}
                        </Badge>
                        {order?.serviceType && (
                          <Badge 
                            colorScheme={
                              order?.serviceType === 'economy' ? 'blue' :
                              order?.serviceType === 'express' ? 'red' :
                              'green'
                            }
                            size="md"
                          >
                            {order?.serviceType === 'economy' ? 'Economy' :
                             order?.serviceType === 'express' ? 'Express' :
                             'Standard'}
                          </Badge>
                        )}
                      </>
                    )}
                    {order?.crewSize && (
                      <Badge 
                        colorScheme="orange" 
                        size="md"
                        title="Number of helpers"
                      >
                        👷 {order?.crewSize === 'ONE' ? '1 Man' :
                           order?.crewSize === 'TWO' ? '2 Men' :
                           order?.crewSize === 'THREE' ? '3 Men' :
                           order?.crewSize === 'FOUR' ? '4 Men' :
                           '2 Men'}
                      </Badge>
                    )}
                    {order?.collectionSource && order?.collectionSource !== 'private-address' && (
                      <Badge 
                        colorScheme={
                          order?.collectionSource === 'marketplace' ? 'blue' :
                          order?.collectionSource === 'retail-store' ? 'orange' :
                          order?.collectionSource === 'storage-unit' ? 'purple' :
                          order?.collectionSource === 'charity-shop' ? 'pink' :
                          order?.collectionSource === 'auction' ? 'yellow' :
                          order?.collectionSource === 'friend-family' ? 'green' :
                          'gray'
                        }
                        size="md"
                        title="Collection source"
                      >
                        📦 {order?.collectionSource === 'marketplace' ? 'Marketplace' :
                           order?.collectionSource === 'retail-store' ? 'Retail Store' :
                           order?.collectionSource === 'storage-unit' ? 'Storage Unit' :
                           order?.collectionSource === 'charity-shop' ? 'Charity Shop' :
                           order?.collectionSource === 'auction' ? 'Auction' :
                           order?.collectionSource === 'friend-family' ? 'Friend/Family' :
                           order?.collectionSource}
                      </Badge>
                    )}
                    {order?.isMultiDrop || order?.orderType === 'multi-drop' ? (
                      <Badge colorScheme="purple" size="md">
                        Multi-Drop Route
                      </Badge>
                    ) : (
                      <Badge colorScheme="gray" size="md">
                        Single Order
                      </Badge>
                    )}
                    {order?.route && (
                      <Badge colorScheme="purple" variant="outline" size="md">
                        Route: {order?.route?.reference} ({order?.route?.totalDrops} drops)
                      </Badge>
                    )}
                  </HStack>
                </HStack>

                {/* Payment Confirmation Button - Show if payment is pending */}
                {order?.status === 'PENDING_PAYMENT' && (
                  <PaymentConfirmationButton
                    booking={{
                      id: order?.id ?? '',
                      reference: order?.reference ?? '',
                      status: order?.status ?? 'pending',
                      totalGBP: order?.totalGBP ?? 0,
                      customerName: order?.customerName ?? '',
                      paidAt: order?.paidAt ?? undefined
                    }}
                    onSuccess={() => {
                      // Refresh order details after successful confirmation
                      fetchOrderDetails();
                    }}
                  />
                )}
              </VStack>

              <Divider borderColor={borderColor} />

              {/* Marketplace Pickup Details - Show only if marketplace source */}
              {order?.collectionSource === 'marketplace' && order?.marketplacePickup && (
                <>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" fontSize="md" color={textColor}>
                      📦 Marketplace Pickup Details
                    </Text>
                    <Box 
                      bg="blue.900" 
                      borderRadius="md" 
                      p={3}
                      borderWidth="1px"
                      borderColor="blue.700"
                    >
                      <VStack align="stretch" spacing={2}>
                        {order?.marketplacePickup?.platformSource && (
                          <HStack justify="space-between">
                            <Text color="gray.400" fontSize="sm">Platform</Text>
                            <Badge colorScheme="blue">
                              {order?.marketplacePickup?.platformSource === 'facebook' ? 'Facebook Marketplace' :
                               order?.marketplacePickup?.platformSource === 'gumtree' ? 'Gumtree' :
                               order?.marketplacePickup?.platformSource === 'ebay' ? 'eBay' :
                               'Other'}
                            </Badge>
                          </HStack>
                        )}
                        {order?.marketplacePickup?.sellerContactName && (
                          <HStack justify="space-between">
                            <Text color="gray.400" fontSize="sm">Seller Name</Text>
                            <Text color="white" fontWeight="medium">{order?.marketplacePickup?.sellerContactName}</Text>
                          </HStack>
                        )}
                        {order?.marketplacePickup?.sellerPhone && (
                          <HStack justify="space-between">
                            <Text color="gray.400" fontSize="sm">Seller Phone</Text>
                            <Text color="white" fontWeight="medium">{order?.marketplacePickup?.sellerPhone}</Text>
                          </HStack>
                        )}
                        <HStack justify="space-between">
                          <Text color="gray.400" fontSize="sm">Seller Helps Loading</Text>
                          <Badge colorScheme={order?.marketplacePickup?.sellerHelpsLoading ? 'green' : 'gray'}>
                            {order?.marketplacePickup?.sellerHelpsLoading ? 'Yes' : 'No'}
                          </Badge>
                        </HStack>
                      </VStack>
                    </Box>
                  </VStack>
                  <Divider borderColor={borderColor} />
                </>
              )}

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

                    {/* Confirmation Action Buttons */}
                    <HStack spacing={2} pt={2}>
                      <Button
                        leftIcon={<FiMail />}
                        colorScheme="green"
                        variant="outline"
                        size="sm"
                        flex={1}
                        onClick={handleSendConfirmationEmail}
                        isLoading={isSendingEmail}
                        loadingText="Sending..."
                        isDisabled={order?.status === 'CANCELLED' || isSaving}
                        borderColor="#10b981"
                        color="#10b981"
                        _hover={{ bg: '#18233A' }}
                        _disabled={{ borderColor: borderColor, color: secondaryTextColor, opacity: 0.5 }}
                      >
                        Send Email Confirmation
                      </Button>
                      <Button
                        leftIcon={<FiPhone />}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                        flex={1}
                        onClick={handleSendSMSConfirmation}
                        isLoading={isSendingSMS}
                        loadingText="Sending..."
                        isDisabled={order?.status === 'CANCELLED' || isSaving || (!editedOrder?.customerPhone && !order?.customerPhone)}
                        borderColor="#2563eb"
                        color="#2563eb"
                        _hover={{ bg: '#18233A' }}
                        _disabled={{ borderColor: borderColor, color: secondaryTextColor, opacity: 0.5 }}
                      >
                        Send SMS Confirmation
                      </Button>
                    </HStack>
                  </>
                ) : (
                  <>
                    <HStack>
                      <FiUser color={textColor} />
                      <Text color={textColor}>{order?.customerName ?? ''}</Text>
                    </HStack>
                    <HStack>
                      <FiMail color={secondaryTextColor} />
                      <Text fontSize="sm" color={secondaryTextColor}>
                        {order?.customerEmail ?? ''}
                      </Text>
                    </HStack>
                    <HStack>
                      <FiPhone color={secondaryTextColor} />
                      {getStatusIcon(
                        !!(order?.customerPhone && (order?.customerPhone?.length ?? 0) >= 10), 
                        false
                      )}
                      <Text fontSize="sm" color={
                        order?.customerPhone && (order?.customerPhone?.length ?? 0) >= 10 
                          ? secondaryTextColor 
                          : "#f59e0b"
                      }>
                        {order?.customerPhone || 'NOT PROVIDED'}
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
                          </VStack>
                        ) : (
                          <>
                            <Text fontSize="sm" color={textColor}>
                              {order?.pickupAddress?.label || 'Not specified'}
                            </Text>
                            {order?.pickupAddress?.postcode && (
                              <Text fontSize="xs" color={secondaryTextColor}>
                                Postcode: {order?.pickupAddress?.postcode}
                              </Text>
                            )}
                            {order?.pickupAddress?.flatNumber && (
                              <Text fontSize="xs" color={secondaryTextColor}>
                                Flat/Unit: {order?.pickupAddress?.flatNumber}
                              </Text>
                            )}
                            {order?.pickupProperty && (
                              <VStack align="start" spacing={0} mt={2}>
                                <Text fontSize="xs" color={secondaryTextColor}>
                                  Property: {order?.pickupProperty?.propertyType}
                                </Text>
                                <HStack spacing={1}>
                                  {getStatusIcon(
                                    (order?.pickupProperty?.floors ?? 0) > 0, 
                                    true
                                  )}
                                  <Text fontSize="xs" color={
                                    (order?.pickupProperty?.floors ?? 0) > 0 ? secondaryTextColor : "#ef4444"
                                  }>
                                    Floor: {(order?.pickupProperty?.floors ?? 0) > 0 
                                      ? order?.pickupProperty?.floors 
                                      : 'NOT SPECIFIED'
                                    }
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" color={secondaryTextColor}>
                                  Access: {order?.pickupProperty?.accessType?.replace('_', ' ') ?? ''}
                                </Text>
                                {order?.pickupProperty?.propertyType === 'FLAT' && (
                                  <HStack spacing={1}>
                                    {getStatusIcon(
                                      !!order?.pickupAddress?.flatNumber, 
                                      true
                                    )}
                                    <Text fontSize="xs" color={
                                      order?.pickupAddress?.flatNumber ? secondaryTextColor : "#ef4444"
                                    }>
                                      Flat/Unit: {order?.pickupAddress?.flatNumber || 'NOT SPECIFIED'}
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
                          </VStack>
                        ) : (
                          <>
                            <Text fontSize="sm" color={textColor}>
                              {order?.dropoffAddress?.label || 'Not specified'}
                            </Text>
                            {order?.dropoffAddress?.postcode && (
                              <Text fontSize="xs" color={secondaryTextColor}>
                                Postcode: {order?.dropoffAddress?.postcode}
                              </Text>
                            )}
                            {order?.dropoffAddress?.flatNumber && (
                              <Text fontSize="xs" color={secondaryTextColor}>
                                Flat/Unit: {order?.dropoffAddress?.flatNumber}
                              </Text>
                            )}
                            {order?.dropoffProperty && (
                              <VStack align="start" spacing={0} mt={2}>
                                <Text fontSize="xs" color={secondaryTextColor}>
                                  Property: {order?.dropoffProperty?.propertyType}
                                </Text>
                                <HStack spacing={1}>
                                  {getStatusIcon(
                                    (order?.dropoffProperty?.floors ?? 0) > 0, 
                                    true
                                  )}
                                  <Text fontSize="xs" color={
                                    (order?.dropoffProperty?.floors ?? 0) > 0 ? secondaryTextColor : "#ef4444"
                                  }>
                                    Floor: {(order?.dropoffProperty?.floors ?? 0) > 0 
                                      ? order?.dropoffProperty?.floors 
                                      : 'NOT SPECIFIED'
                                    }
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" color={secondaryTextColor}>
                                  Access: {order?.dropoffProperty?.accessType?.replace('_', ' ') ?? ''}
                                </Text>
                                {order?.dropoffProperty?.propertyType === 'FLAT' && (
                                  <HStack spacing={1}>
                                    {getStatusIcon(
                                      !!order?.dropoffAddress?.flatNumber, 
                                      true
                                    )}
                                    <Text fontSize="xs" color={
                                      order?.dropoffAddress?.flatNumber ? secondaryTextColor : "#ef4444"
                                    }>
                                      Flat/Unit: {order?.dropoffAddress?.flatNumber || 'NOT SPECIFIED'}
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

              {/* Route Map Preview */}
              {order?.pickupAddress && order?.dropoffAddress && (
                <>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" fontSize="md" color={textColor}>
                      Route Map
                    </Text>
                    <OrderMapPreview
                      pickupLocation={
                        order?.pickupAddress?.lat && order?.pickupAddress?.lng
                          ? {
                              lat: order?.pickupAddress?.lat ?? 0,
                              lng: order?.pickupAddress?.lng ?? 0,
                              label: order?.pickupAddress?.label ?? '',
                            }
                          : null
                      }
                      dropoffLocation={
                        order?.dropoffAddress?.lat && order?.dropoffAddress?.lng
                          ? {
                              lat: order?.dropoffAddress?.lat ?? 0,
                              lng: order?.dropoffAddress?.lng ?? 0,
                              label: order?.dropoffAddress?.label ?? '',
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

              {/* Driver Information */}
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontWeight="bold" fontSize="md" color={textColor}>
                    Driver Information
                  </Text>
                  {order?.driver && (
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        colorScheme="blue"
                        variant="outline"
                        onClick={onAssignModalOpen}
                        leftIcon={<FiTruck />}
                        borderColor={borderColor}
                        color={textColor}
                        _hover={{ bg: '#18233A' }}
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
                        _hover={{ bg: '#18233A' }}
                      >
                        Remove Driver
                      </Button>
                    </HStack>
                  )}
                </HStack>
                
                {order?.driver?.user ? (
                  <>
                    <HStack>
                      <FiTruck color={textColor} />
                      <Text color={textColor}>{order?.driver?.user?.name || 'Unknown Driver'}</Text>
                    </HStack>
                    <HStack>
                      <FiMail color={secondaryTextColor} />
                      <Text fontSize="sm" color={secondaryTextColor}>
                        {order?.driver?.user?.email || 'N/A'}
                      </Text>
                    </HStack>
                    <HStack>
                      <FiPhone color={secondaryTextColor} />
                      <Text fontSize="sm" color={secondaryTextColor}>
                        {order?.driver?.user?.phone || 'N/A'}
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
                      _hover={{ bg: '#18233A' }}
                    >
                      Assign Driver
                    </Button>
                  </Box>
                )}
              </VStack>
              <Divider borderColor={borderColor} />

              {/* Items */}
              {order?.items && (order?.items?.length ?? 0) > 0 && (
                <>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" fontSize="md" color={textColor}>
                      Items ({order?.items?.length ?? 0})
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {order?.items?.map((item, index) => (
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

              {/* Journey Relationship Card */}
              {order?.segments && (order?.segments?.length ?? 0) > 1 && (
                <VStack align="stretch" spacing={3}>
                  <JourneyRelationshipCard
                    mainBooking={{
                      reference: order?.reference ?? '',
                      totalGBP: order?.totalGBP ?? 0,
                      scheduledAt: order?.scheduledAt ?? '',
                    }}
                    segments={order?.segments ?? []}
                    bgColor={bgColor}
                    textColor={textColor}
                    borderColor={borderColor}
                    cardBg={cardBg}
                    secondaryTextColor={secondaryTextColor}
                  />
                </VStack>
              )}

              {/* Additional Journeys Section */}
              {order?.segments && (order?.segments?.length ?? 0) > 1 && (
                <>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between" align="center">
                      <Text fontWeight="bold" fontSize="md" color={textColor}>
                        Additional Journeys Details ({(order?.segments?.length ?? 0) - 1})
                      </Text>
                      <HStack spacing={2}>
                        {order?.hasReturnJourney && (
                          <Badge colorScheme="green" size="md">
                            🔄 Return Journey
                          </Badge>
                        )}
                        {order?.hasAdditionalJourney && (
                          <Badge colorScheme="cyan" size="md">
                            ➕ Additional Journey
                          </Badge>
                        )}
                      </HStack>
                    </HStack>
                    
                    <VStack align="stretch" spacing={3}>
                      {order?.segments
                        ?.filter(segment => segment.segmentType !== 'outbound')
                        .map((segment, index) => (
                          <Card 
                            key={segment.id} 
                            bg={cardBg} 
                            borderColor={
                              segment.segmentType === 'return' ? '#10b981' : '#06b6d4'
                            }
                            borderWidth={2}
                          >
                            <CardBody>
                              <VStack align="stretch" spacing={3}>
                                <HStack justify="space-between" align="start">
                                  <HStack spacing={2}>
                                    <Badge 
                                      colorScheme={
                                        segment.segmentType === 'return' ? 'green' : 'cyan'
                                      }
                                      size="lg"
                                    >
                                      {segment.segmentType === 'return' 
                                        ? '🔄 Return Journey' 
                                        : '➕ Additional Journey'}
                                    </Badge>
                                    <Badge colorScheme="gray" size="sm">
                                      Sequence #{segment.sequenceNumber + 1}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="lg" fontWeight="bold" color={
                                    segment.segmentType === 'return' ? '#10b981' : '#06b6d4'
                                  }>
                                    {formatCurrency(segment.priceGBP)}
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
                                            {segment.pickupProperty.accessType}
                                          </Badge>
                                        </HStack>
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
                                            {segment.dropoffProperty.accessType}
                                          </Badge>
                                        </HStack>
                                      )}
                                    </VStack>
                                  </HStack>
                                </Box>

                                {/* Journey Details */}
                                <SimpleGrid columns={3} spacing={2}>
                                  <Box>
                                    <Text fontSize="xs" color={secondaryTextColor}>Scheduled</Text>
                                    <Text fontSize="sm" color={textColor} fontWeight="medium">
                                      {formatDateTime(segment.scheduledAt)}
                                    </Text>
                                  </Box>
                                  {segment.estimatedArrival && (
                                    <Box>
                                      <Text fontSize="xs" color={secondaryTextColor}>Est. Arrival</Text>
                                      <Text fontSize="sm" color={textColor} fontWeight="medium">
                                        {formatDateTime(segment.estimatedArrival)}
                                      </Text>
                                    </Box>
                                  )}
                                  {segment.distanceMeters && (
                                    <Box>
                                      <Text fontSize="xs" color={secondaryTextColor}>Distance</Text>
                                      <Text fontSize="sm" color={textColor} fontWeight="medium">
                                        {formatDistance(segment.distanceMeters)}
                                      </Text>
                                    </Box>
                                  )}
                                </SimpleGrid>

                                {/* Items in this segment */}
                                {segment.items && Array.isArray(segment.items) && segment.items.length > 0 && (
                                  <Box p={2} bg="rgba(59, 130, 246, 0.1)" borderRadius="md" borderWidth={1} borderColor="#3b82f6">
                                    <Text fontSize="xs" fontWeight="bold" color="#3b82f6" mb={1}>
                                      Items in this journey ({segment.items.length})
                                    </Text>
                                    <VStack align="start" spacing={1}>
                                      {segment.items.map((item: any, itemIndex: number) => (
                                        <Text key={itemIndex} fontSize="xs" color={textColor}>
                                          • {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                                        </Text>
                                      ))}
                                    </VStack>
                                  </Box>
                                )}

                                {/* Notes */}
                                {segment.notes && (
                                  <Box p={2} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
                                    <Text fontSize="xs" color={secondaryTextColor} mb={1}>
                                      Notes:
                                    </Text>
                                    <Text fontSize="sm" color={textColor}>
                                      {segment.notes}
                                    </Text>
                                  </Box>
                                )}
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                    </VStack>
                  </VStack>
                  <Divider borderColor={borderColor} />
                </>
              )}

              {/* Timeline Section */}
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold" fontSize="md" color={textColor}>
                  Order Timeline
                </Text>
                <Box p={4} bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
                  <OrderTimeline
                    orderCode={order?.reference ?? ''}
                    bgColor={bgColor}
                    textColor={textColor}
                    borderColor={borderColor}
                    cardBg={cardBg}
                  />
                </Box>
              </VStack>
              <Divider borderColor={borderColor} />

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
                                  £{((order?.totalGBP ?? 0) / 100).toFixed(2)}
                                </Text>
                              </Box>
                              <Text fontSize="2xl" color="#f59e0b">→</Text>
                              <Box flex={1}>
                                <Text fontSize="xs" color={secondaryTextColor}>New Price:</Text>
                                <Text fontSize="lg" fontWeight="bold" color="#10b981">
                                  £{((newCalculatedPrice ?? 0) / 100).toFixed(2)}
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
                            {formatCurrency(order?.totalGBP ?? 0)}
                          </StatNumber>
                          {newCalculatedPrice && isEditing && (
                            <StatHelpText fontSize="sm" color="#f59e0b" fontWeight="bold">
                              New: {formatCurrency(newCalculatedPrice ?? 0)}
                            </StatHelpText>
                          )}
                        </Stat>
                        <Stat>
                          <StatLabel fontSize="xs" color={secondaryTextColor}>Scheduled Date</StatLabel>
                          <StatNumber fontSize="lg" color={textColor}>
                            {order?.scheduledAt ? new Date(order?.scheduledAt ?? '').toLocaleString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : 'Not scheduled'}
                          </StatNumber>
                          <StatHelpText fontSize="xs" color={secondaryTextColor}>
                            Reference: {order?.reference ?? ''}
                          </StatHelpText>
                        </Stat>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Capacity Check & Vehicles Required */}
                {order?.capacityCheck && (((order?.capacityCheck?.warnings?.length ?? 0) > 0) || order?.capacityCheck?.vansRequired) && (
                  <Alert 
                    status={(order?.capacityCheck?.vansRequired ?? 0) > 1 ? "error" : "warning"} 
                    bg={(order?.capacityCheck?.vansRequired ?? 0) > 1 ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)"} 
                    borderRadius="md" 
                    borderWidth={2} 
                    borderColor={(order?.capacityCheck?.vansRequired ?? 0) > 1 ? "#ef4444" : "#f59e0b"}
                  >
                    <AlertIcon color={(order?.capacityCheck?.vansRequired ?? 0) > 1 ? "#ef4444" : "#f59e0b"} boxSize={6} />
                    <VStack align="start" spacing={2} flex={1}>
                      {(order?.capacityCheck?.vansRequired ?? 0) > 1 && (
                        <Text fontSize="lg" fontWeight="bold" color="#ef4444">
                          🚛 REQUIRES {order?.capacityCheck?.vansRequired ?? 0} VANS
                        </Text>
                      )}
                      {order?.capacityCheck?.warnings && (order?.capacityCheck?.warnings?.length ?? 0) > 0 && (
                        <>
                          <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                            Capacity Warnings:
                          </Text>
                          <VStack align="start" spacing={1} w="full">
                            {order?.capacityCheck?.warnings?.map((warning, idx) => (
                              <Text key={idx} fontSize="sm" color={textColor}>• {warning}</Text>
                            ))}
                          </VStack>
                        </>
                      )}
                      {order?.capacityCheck?.recommendations && (order?.capacityCheck?.recommendations?.length ?? 0) > 0 && (
                        <>
                          <Text fontSize="sm" fontWeight="semibold" color={textColor} mt={2}>
                            Recommendations:
                          </Text>
                          <VStack align="start" spacing={1} w="full">
                            {order?.capacityCheck?.recommendations?.map((rec, idx) => (
                              <Text key={idx} fontSize="sm" color="#10b981">✓ {rec}</Text>
                            ))}
                          </VStack>
                        </>
                      )}
                      {((order?.capacityCheck?.weightUtilization !== undefined) || (order?.capacityCheck?.volumeUtilization !== undefined) || (order?.capacityCheck?.itemUtilization !== undefined)) && (
                        <SimpleGrid columns={3} spacing={3} w="full" mt={2}>
                          {order?.capacityCheck?.weightUtilization !== undefined && (
                            <Box p={2} bg="rgba(0,0,0,0.3)" borderRadius="md">
                              <Text fontSize="xs" color={secondaryTextColor}>Weight</Text>
                              <Text fontSize="md" fontWeight="bold" color={(order?.capacityCheck?.weightUtilization ?? 0) > 100 ? "#ef4444" : "#10b981"}>
                                {(order?.capacityCheck?.weightUtilization ?? 0).toFixed(0)}%
                              </Text>
                            </Box>
                          )}
                          {order?.capacityCheck?.volumeUtilization !== undefined && (
                            <Box p={2} bg="rgba(0,0,0,0.3)" borderRadius="md">
                              <Text fontSize="xs" color={secondaryTextColor}>Volume</Text>
                              <Text fontSize="md" fontWeight="bold" color={(order?.capacityCheck?.volumeUtilization ?? 0) > 100 ? "#ef4444" : "#10b981"}>
                                {(order?.capacityCheck?.volumeUtilization ?? 0).toFixed(0)}%
                              </Text>
                            </Box>
                          )}
                          {order?.capacityCheck?.itemUtilization !== undefined && (
                            <Box p={2} bg="rgba(0,0,0,0.3)" borderRadius="md">
                              <Text fontSize="xs" color={secondaryTextColor}>Items</Text>
                              <Text fontSize="md" fontWeight="bold" color={(order?.capacityCheck?.itemUtilization ?? 0) > 100 ? "#ef4444" : "#10b981"}>
                                {(order?.capacityCheck?.itemUtilization ?? 0).toFixed(0)}%
                              </Text>
                            </Box>
                          )}
                        </SimpleGrid>
                      )}
                    </VStack>
                  </Alert>
                )}

                {(amountPaid > 0 || order?.paidAt) && (
                  <Card bg={cardBg} borderColor="#2563eb" borderWidth={1}>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <HStack justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" fontSize="md" color={textColor}>
                              Post-Payment Adjustments
                            </Text>
                            <Text fontSize="xs" color={secondaryTextColor}>
                              Manage additional charges or refunds after the customer has paid.
                            </Text>
                          </VStack>
                          <Badge colorScheme={additionalPaymentStatusMeta.color} fontSize="0.7rem" px={3} py={1} borderRadius="full">
                            {additionalPaymentStatusMeta.label}
                          </Badge>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          <Card bg="#0f172a" borderColor="#1f2937" borderWidth={1}>
                            <CardBody>
                              <HStack align="center" spacing={3}>
                                <Circle size="38px" bg="rgba(16, 185, 129, 0.15)">
                                  <FiTrendingUp color="#10b981" />
                                </Circle>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="xs" color={secondaryTextColor}>Total Collected</Text>
                                  <Text fontWeight="bold" color="#10b981">{formatCurrency(amountPaid)}</Text>
                                </VStack>
                              </HStack>
                            </CardBody>
                          </Card>
                          <Card bg="#0f172a" borderColor="#1f2937" borderWidth={1}>
                            <CardBody>
                              <HStack align="center" spacing={3}>
                                <Circle size="38px" bg="rgba(37, 99, 235, 0.15)">
                                  <FiDollarSign color="#2563eb" />
                                </Circle>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="xs" color={secondaryTextColor}>Current Total</Text>
                                  <Text fontWeight="bold" color={textColor}>{formatCurrency(order?.totalGBP ?? 0)}</Text>
                                </VStack>
                              </HStack>
                            </CardBody>
                          </Card>
                          <Card bg="#0f172a" borderColor="#1f2937" borderWidth={1}>
                            <CardBody>
                              <HStack align="center" spacing={3}>
                                <Circle size="38px" bg={adjustedDifference > 0 ? 'rgba(249, 115, 22, 0.15)' : 'rgba(14, 165, 233, 0.15)'}>
                                  {adjustedDifference > 0 ? <FiArrowUpRight color="#f97316" /> : adjustedDifference < 0 ? <FiArrowDownRight color="#0ea5e9" /> : <FiCheckCircle color="#10b981" />}
                                </Circle>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="xs" color={secondaryTextColor}>Adjustment vs Paid</Text>
                                  <Text fontWeight="bold" color={adjustedDifference > 0 ? '#f97316' : adjustedDifference < 0 ? '#0ea5e9' : '#10b981'}>
                                    {adjustedDifference === 0 ? 'No Adjustment' : formatCurrency(Math.abs(adjustedDifference))}
                                  </Text>
                                </VStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        </SimpleGrid>

                        <VStack align="stretch" spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="xs" color={secondaryTextColor}>Adjusted Order Total (£)</FormLabel>
                            <NumberInput
                              value={(adjustedTotalGBP / 100).toFixed(2)}
                              onChange={(valueString) => {
                                const numericValue = Number.parseFloat(valueString);
                                if (Number.isNaN(numericValue)) {
                                  setAdjustedTotalGBP(0);
                                  return;
                                }
                                setAdjustedTotalGBP(Math.round(numericValue * 100));
                              }}
                              min={0}
                              step={1}
                              precision={2}
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
                            <FormLabel fontSize="xs" color={secondaryTextColor}>Reason (shown to customer)</FormLabel>
                            <Textarea
                              value={adjustmentReason}
                              onChange={(event) => setAdjustmentReason(event.target.value)}
                              placeholder="Explain why the adjustment is needed..."
                              bg={cardBg}
                              color={textColor}
                              borderColor={borderColor}
                              _hover={{ borderColor: '#2563eb' }}
                              _focus={{ borderColor: '#2563eb', bg: cardBg }}
                              rows={3}
                            />
                          </FormControl>

                          <HStack spacing={3} flexWrap="wrap">
                            <Button
                              colorScheme="blue"
                              leftIcon={<FiArrowUpRight />}
                              onClick={handleRequestAdditionalPayment}
                              isLoading={isRequestingAdditionalPayment}
                              isDisabled={adjustedDifference <= 0}
                            >
                              Request Additional Payment
                            </Button>
                            <Button
                              colorScheme="cyan"
                              variant="outline"
                              leftIcon={<FiArrowDownRight />}
                              onClick={handleIssueRefund}
                              isLoading={isIssuingRefund}
                              isDisabled={adjustedDifference >= 0}
                            >
                              Issue Refund
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              color={secondaryTextColor}
                              onClick={() => {
                                setAdjustedTotalGBP(order?.totalGBP ?? 0);
                                setAdjustmentReason('');
                              }}
                            >
                              Reset
                            </Button>
                          </HStack>
                        </VStack>

                        <VStack align="stretch" spacing={1} fontSize="xs" color={secondaryTextColor}>
                          <Text>{additionalPaymentStatusMeta.description}</Text>
                          <Text>Outstanding Balance: {formatCurrency(outstandingAmount)}</Text>
                          <Text>Last Payment: {formatDateTime(order?.lastPaymentDate || order?.paidAt || null)}</Text>
                          <Text>Last Refund: {formatDateTime(order?.lastRefundDate ?? null)}</Text>
                          {order?.additionalPaymentRequestedAt && (
                            <Text>Additional Payment Requested: {formatDateTime(order?.additionalPaymentRequestedAt ?? null)}</Text>
                          )}
                          {order?.additionalPaymentPaidAt && (
                            <Text>Additional Payment Received: {formatDateTime(order?.additionalPaymentPaidAt ?? null)}</Text>
                          )}
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Trip Metrics Card */}
                <Card bg={cardBg} borderColor="#2563eb" borderWidth={1}>
                  <CardBody>
                    <SimpleGrid columns={2} spacing={4}>
                      <VStack align="start" spacing={1}>
                        <HStack spacing={1}>
                          {getStatusIcon(!!(order?.baseDistanceMiles || order?.distanceMeters), true)}
                          <Text fontSize="xs" color={secondaryTextColor}>Distance</Text>
                        </HStack>
                        <Text fontWeight="bold" fontSize="lg" color={
                          (order?.baseDistanceMiles || order?.distanceMeters) ? "#2563eb" : "#ef4444"
                        }>
                          {order?.baseDistanceMiles 
                            ? `${(order?.baseDistanceMiles ?? 0).toFixed(1)} mi`
                            : order?.distanceMeters
                              ? `${((order?.distanceMeters ?? 0) / 1609.34).toFixed(1)} mi`
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
                          {order ? formatDuration(calculateEstimatedDuration(order!)) : 'N/A'}
                        </Text>
                      </VStack>
                    </SimpleGrid>
                  </CardBody>
                </Card>
                
                {/* Driver Earnings Breakdown */}
                {(order?.distanceMeters || order?.baseDistanceMiles) && order?.durationSeconds && (
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
                        value={editedOrder.scheduledAt ? new Date(editedOrder.scheduledAt as string).toISOString().slice(0, 16) : ''}
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
                ) : order ? (
                  <>
                    <HStack justify="space-between">
                      <Text color={textColor}>Scheduled Date</Text>
                      <Text color={textColor}>
                        {order!.scheduledAt
                          ? new Date(order!.scheduledAt).toLocaleDateString('en-GB', {
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
                        {order!.scheduledAt
                          ? new Date(order!.scheduledAt).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Not scheduled'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <HStack spacing={1}>
                        {getStatusIcon(!!order!.pickupTimeSlot, false)}
                        <Text color={textColor}>Time Slot</Text>
                      </HStack>
                      <Text color={order!.pickupTimeSlot ? textColor : "#f59e0b"}>
                        {order!.pickupTimeSlot || 'NOT SPECIFIED'}
                      </Text>
                    </HStack>
                  </>
                ) : null}
                <HStack justify="space-between">
                  <Text color={textColor}>Created</Text>
                  <Text color={textColor}>
                    {order ? new Date(order!.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </Text>
                </HStack>
                {order?.paidAt && (
                  <HStack justify="space-between">
                    <Text color={textColor}>Paid At</Text>
                    <Text color={textColor}>
                      {new Date(order!.paidAt as string).toLocaleDateString('en-GB', {
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
                  {getStatusIcon(!!order?.notes, false)}
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
                    bg={order?.notes ? cardBg : cardBg}
                    borderWidth={1}
                    borderColor={order?.notes ? "#2563eb" : borderColor}
                  >
                    <Text fontSize="sm" color={order?.notes ? textColor : secondaryTextColor} fontStyle={!order?.notes ? "italic" : "normal"}>
                      {order?.notes || 'No customer notes provided'}
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
                          New price £{(newCalculatedPrice! / 100).toFixed(2)} will replace current £{(order?.totalGBP ? (order!.totalGBP / 100).toFixed(2) : '0.00')}
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
                      color="#F5F8FF"
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
                      _hover={{ bg: '#18233A' }}
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
                      color="#F5F8FF"
                      _hover={{ bg: '#1d4ed8' }}
                      _disabled={{ bg: '#18233A', color: secondaryTextColor, opacity: 0.5 }}
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
                      _hover={{ bg: '#18233A' }}
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
                      _hover={{ bg: '#18233A' }}
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
                      _hover={{ bg: '#18233A' }}
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
                        _hover={{ bg: '#18233A' }}
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
                      _hover={{ bg: '#18233A' }}
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
          <ModalCloseButton color={textColor} _hover={{ bg: '#18233A' }} />
          <ModalBody bg={bgColor} color={textColor}>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" bg="#18233A" borderColor={borderColor}>
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
                _hover={{ bg: '#18233A' }}
              >
                Keep Order
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleCancelOrder}
                isLoading={isCancelling}
                loadingText="Cancelling..."
                bg="#ef4444"
                color="#F5F8FF"
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
          <ModalCloseButton color={textColor} _hover={{ bg: '#18233A' }} />
          <ModalBody overflowY="auto" maxH="60vh" bg={bgColor} color={textColor}>
            <VStack spacing={4} align="stretch">
              <Alert status="info" bg="#18233A" borderColor={borderColor}>
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
                    <Alert status="warning" bg="#18233A" borderColor={borderColor}>
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
                        _hover={{ bg: '#18233A' }}
                      >
                        Refresh Driver List
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        variant="outline"
                        borderColor={borderColor}
                        color="#f59e0b"
                        _hover={{ bg: '#18233A' }}
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
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between" align="center">
                          <Select
                            placeholder="👤 Click here to select a driver"
                            value={selectedDriverId}
                            onChange={(e) => setSelectedDriverId(e.target.value)}
                            bg="white"
                            color="black"
                            borderColor="gray.300"
                            focusBorderColor="blue.500"
                            size="md"
                            maxW="520px"
                            sx={{
                              option: { color: 'black', backgroundColor: 'white' },
                              'option:checked': { color: 'black', backgroundColor: 'white' }
                            }}
                          >
                            {availableDrivers.map((driver) => {
                              let distanceText = '';
                              const hasDriver = driver.DriverAvailability?.location?.lat && driver.DriverAvailability?.location?.lng && !isNaN(driver.DriverAvailability.location.lat) && !isNaN(driver.DriverAvailability.location.lng);
                              const pickupLatNum = Number(order?.pickupAddress?.lat ?? NaN);
                              const pickupLngNum = Number(order?.pickupAddress?.lng ?? NaN);
                              const dropoffLatNum = Number(order?.dropoffAddress?.lat ?? NaN);
                              const dropoffLngNum = Number(order?.dropoffAddress?.lng ?? NaN);
                              const hasPickup = !isNaN(pickupLatNum) && !isNaN(pickupLngNum);
                              const hasDropoff = !isNaN(dropoffLatNum) && !isNaN(dropoffLngNum);
                              if (hasDriver && (hasPickup || hasDropoff)) {
                                try {
                                  const driverLat = parseFloat(driver.DriverAvailability.location.lat);
                                  const driverLng = parseFloat(driver.DriverAvailability.location.lng);
                                  const targetLat = hasPickup ? pickupLatNum : dropoffLatNum;
                                  const targetLng = hasPickup ? pickupLngNum : dropoffLngNum;
                                  const R = 3959;
                                  const dLat = (targetLat - driverLat) * Math.PI / 180;
                                  const dLng = (targetLng - driverLng) * Math.PI / 180;
                                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(driverLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
                                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                  const distance = R * c;
                                  if (Number.isFinite(distance)) {
                                    distanceText = ` - ${distance.toFixed(1)} miles away`;
                                  }
                                } catch {
                                  distanceText = ' - Location unknown';
                                }
                              } else {
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
                          <Badge colorScheme="blue" variant="subtle">
                            {`Drivers with location: ${availableDrivers.filter(d => Number.isFinite(Number(d?.DriverAvailability?.location?.lat)) && Number.isFinite(Number(d?.DriverAvailability?.location?.lng))).length}/${availableDrivers.length}`}
                          </Badge>
                        </HStack>
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
                                  const MAPBOX_TOKEN = ${JSON.stringify(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '')};
                                  if (!MAPBOX_TOKEN) {
                                    const mapEl = document.getElementById('map');
                                    if (mapEl) {
                                      mapEl.innerHTML = '<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 14px; color: #111827; background: #f9fafb;">Map unavailable (missing Mapbox token).</div>';
                                    }
                                  } else {
                                    mapboxgl.accessToken = MAPBOX_TOKEN;
                                  
                                  const driversRaw = ${JSON.stringify(
                                    (availableDrivers || []).map(d => ({
                                      id: d.id,
                                      name: d.name,
                                      status: d.DriverAvailability?.status || 'unknown',
                                      activeJobs: d.totalActiveJobs || 0,
                                      reason: d.availabilityReason || 'Ready',
                                      lat: d.DriverAvailability?.location?.lat,
                                      lng: d.DriverAvailability?.location?.lng,
                                    }))
                                  )};
                                  const drivers = driversRaw
                                    .map(d => ({ ...d, lat: Number(d.lat), lng: Number(d.lng) }))
                                    .filter(d => Number.isFinite(d.lat) && Number.isFinite(d.lng));
                                  
                                  const ukBounds = [[-11.0, 49.0],[2.2, 61.0]]; // UK bounding box (approx)
                                  const map = new mapboxgl.Map({
                                    container: 'map',
                                    style: 'mapbox://styles/mapbox/streets-v12',
                                    center: [-1.5, 54.5], // Center over UK
                                    zoom: 5,
                                    maxBounds: ukBounds
                                  });
                                  
                                  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
                                  map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
                                  
                                  // Constrain panning to UK
                                  map.setMaxBounds(ukBounds);
                                  const pickupLng = Number("${(order as any)?.pickupAddress?.lng ?? ''}");
                                  const pickupLat = Number("${(order as any)?.pickupAddress?.lat ?? ''}");
                                  if (Number.isFinite(pickupLng) && Number.isFinite(pickupLat)) {
                                    const pickupEl = document.createElement('div');
                                    pickupEl.style.width = '14px';
                                    pickupEl.style.height = '14px';
                                    pickupEl.style.borderRadius = '50%';
                                    pickupEl.style.background = '#22c55e';
                                    pickupEl.style.boxShadow = '0 0 8px rgba(34,197,94,0.6)';
                                    new mapboxgl.Marker(pickupEl)
                                      .setLngLat([pickupLng, pickupLat])
                                      .setPopup(new mapboxgl.Popup({ offset: 25, maxWidth: '300px' })
                                        .setHTML('<strong>Pickup</strong><br/>${(order as any)?.pickupAddress?.label || ''}')
                                      )
                                      .addTo(map);
                                  }
                                  
                                  const dropoffLng = Number("${(order as any)?.dropoffAddress?.lng ?? ''}");
                                  const dropoffLat = Number("${(order as any)?.dropoffAddress?.lat ?? ''}");
                                  if (Number.isFinite(dropoffLng) && Number.isFinite(dropoffLat)) {
                                    const dropoffEl = document.createElement('div');
                                    dropoffEl.style.width = '14px';
                                    dropoffEl.style.height = '14px';
                                    dropoffEl.style.borderRadius = '50%';
                                    dropoffEl.style.background = '#ef4444';
                                    dropoffEl.style.boxShadow = '0 0 8px rgba(239,68,68,0.6)';
                                    new mapboxgl.Marker(dropoffEl)
                                      .setLngLat([dropoffLng, dropoffLat])
                                      .setPopup(new mapboxgl.Popup({ offset: 25, maxWidth: '300px' })
                                        .setHTML('<strong>Dropoff</strong><br/>${(order as any)?.dropoffAddress?.label || ''}')
                                      )
                                      .addTo(map);
                                  }
                                  
                                  // Add driver markers with tooltips
                                  drivers.forEach(driver => {
                                    if (!Number.isFinite(driver.lng) || !Number.isFinite(driver.lat)) return;
                                    const isOnline = driver.status === 'online';
                                    const el = document.createElement('div');
                                    el.style.width = '16px';
                                    el.style.height = '16px';
                                    el.style.borderRadius = '50%';
                                    el.style.background = isOnline ? '#3b82f6' : '#6b7280';
                                    el.style.boxShadow = '0 0 8px ' + (isOnline ? 'rgba(59,130,246,0.6)' : 'rgba(107,114,128,0.6)');
                                    el.style.border = '2px solid #ffffff';
                                    const popup = new mapboxgl.Popup({ 
                                      offset: 20,
                                      maxWidth: '260px'
                                    }).setHTML(
                                      '<div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">' + driver.name + '</div>' +
                                      '<span style="font-size: 12px; font-weight: 500; color: ' + (isOnline ? '#10B981' : '#6B7280') + ';">' + driver.status.toUpperCase() + '</span>' +
                                      '<div style="font-size: 11px; color: #6B7280; margin-bottom: 2px;">Active Jobs: <strong>' + driver.activeJobs + '</strong></div>' +
                                      '<div style="font-size: 11px; color: #9CA3AF;">' + driver.reason + '</div>'
                                    );
                                    new mapboxgl.Marker(el)
                                      .setLngLat([driver.lng, driver.lat])
                                      .setPopup(popup)
                                      .addTo(map);
                                  });
                                  
                                  // Fit bounds to UK and available points
                                  const bounds = new mapboxgl.LngLatBounds(ukBounds[0], ukBounds[1]);
                                  const maybeExtend = (lng, lat) => {
                                    if (Number.isFinite(lng) && Number.isFinite(lat)) {
                                      bounds.extend([lng, lat]);
                                    }
                                  };
                                  maybeExtend(pickupLng, pickupLat);
                                  maybeExtend(dropoffLng, dropoffLat);
                                  drivers.forEach(d => maybeExtend(d.lng, d.lat));
                                  map.fitBounds(bounds, { padding: 60, duration: 1000 });
                                  }
                                </script>
                              </body>
                              </html>
                            `}
                            style={{ width: '100%', height: '100%', border: '0' }}
                          />
                        </Box>
                      </VStack>
                    ) : (
                      <Alert status="info" variant="left-accent">
                        <AlertIcon />
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">No drivers available</Text>
                          <Text fontSize="xs" color="gray.600">We couldn't find any active drivers to show on the map.</Text>
                        </Box>
                      </Alert>
                    )}

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
                        const hasDriver = driver.DriverAvailability?.location?.lat && driver.DriverAvailability?.location?.lng && !isNaN(driver.DriverAvailability.location.lat) && !isNaN(driver.DriverAvailability.location.lng);
                        const pickupLatNum = Number(order?.pickupAddress?.lat ?? NaN);
                        const pickupLngNum = Number(order?.pickupAddress?.lng ?? NaN);
                        const dropoffLatNum = Number(order?.dropoffAddress?.lat ?? NaN);
                        const dropoffLngNum = Number(order?.dropoffAddress?.lng ?? NaN);
                        const hasPickup = !isNaN(pickupLatNum) && !isNaN(pickupLngNum);
                        const hasDropoff = !isNaN(dropoffLatNum) && !isNaN(dropoffLngNum);
                        if (hasDriver && (hasPickup || hasDropoff)) {
                          try {
                            const driverLat = parseFloat(driver.DriverAvailability.location.lat);
                            const driverLng = parseFloat(driver.DriverAvailability.location.lng);
                            const targetLat = hasPickup ? pickupLatNum : dropoffLatNum;
                            const targetLng = hasPickup ? pickupLngNum : dropoffLngNum;
                            
                            // Haversine formula for distance
                            const R = 3959; // Earth radius in miles
                            const dLat = (targetLat - driverLat) * Math.PI / 180;
                            const dLng = (targetLng - driverLng) * Math.PI / 180;
                            const a = 
                              Math.sin(dLat/2) * Math.sin(dLat/2) +
                              Math.cos(driverLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) *
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

