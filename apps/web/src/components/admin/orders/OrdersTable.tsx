'use client';
import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { FaRoute } from 'react-icons/fa';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  Flex,
  Spinner,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Tooltip,
  Icon,
  Divider,
  Grid,
  GridItem,
  useDisclosure,
  Progress,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Textarea,
  Circle,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import ClientInput from '@/components/admin/ClientInput';
import {
  FaSearch,
  FaFilter,
  FaEllipsisV,
  FaEdit,
  FaUser,
  FaMapMarkerAlt,
  FaClock,
  FaPoundSign,
  FaCheck,
  FaTimes,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaTruck,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTrash,
  FaUserSlash,
} from 'react-icons/fa';
import { formatDistanceToNow, format, differenceInMinutes, differenceInDays, differenceInHours } from 'date-fns';
import {
  AdminShell,
  ViewToggle,
  type ViewType,
  OrderDetailDrawer,
} from '@/components/admin';

// Flashing animation for priority indicators
const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
`;

const fastPulseAnimation = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50% { opacity: 0.7; transform: scale(1.15); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
`;

const waveAnimation = keyframes`
  0% { 
    transform: translateX(-100%) translateY(0) scaleY(1); 
    opacity: 0.3;
  }
  25% { 
    transform: translateX(-50%) translateY(-5px) scaleY(1.1); 
    opacity: 0.5;
  }
  50% { 
    transform: translateX(0%) translateY(-10px) scaleY(1.2); 
    opacity: 0.7;
  }
  75% { 
    transform: translateX(50%) translateY(-5px) scaleY(1.1); 
    opacity: 0.5;
  }
  100% { 
    transform: translateX(100%) translateY(0) scaleY(1); 
    opacity: 0.3;
  }
`;

// Priority calculation based on scheduled date
function calculatePriority(scheduledAt: string): {
  level: 'urgent' | 'high' | 'medium' | 'low' | 'future';
  color: string;
  bgColor: string;
  label: string;
  animation: string;
  sortOrder: number;
} {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  const hoursUntil = differenceInHours(scheduled, now);
  const daysUntil = differenceInDays(scheduled, now);

  // Tomorrow (within 24-48 hours)
  if (hoursUntil >= 0 && hoursUntil <= 48) {
    return {
      level: 'urgent',
      color: 'red.500',
      bgColor: 'red.50',
      label: 'Tomorrow',
      animation: `${fastPulseAnimation} 1.5s ease-in-out infinite`,
      sortOrder: 1
    };
  }
  
  // Day after tomorrow (48-72 hours)
  if (hoursUntil > 48 && hoursUntil <= 72) {
    return {
      level: 'high',
      color: 'orange.500',
      bgColor: 'orange.50',
      label: 'Day After',
      animation: `${pulseAnimation} 2s ease-in-out infinite`,
      sortOrder: 2
    };
  }
  
  // This week (3-7 days)
  if (daysUntil > 3 && daysUntil <= 7) {
    return {
      level: 'medium',
      color: 'yellow.500',
      bgColor: 'yellow.50',
      label: 'This Week',
      animation: `${pulseAnimation} 2.5s ease-in-out infinite`,
      sortOrder: 3
    };
  }
  
  // Next week (7-14 days)
  if (daysUntil > 7 && daysUntil <= 14) {
    return {
      level: 'low',
      color: 'green.400',
      bgColor: 'green.50',
      label: 'Next Week',
      animation: `${pulseAnimation} 3s ease-in-out infinite`,
      sortOrder: 4
    };
  }
  
  // Future (14+ days)
  return {
    level: 'future',
    color: 'green.600',
    bgColor: 'green.50',
    label: 'Future',
    animation: `${pulseAnimation} 3.5s ease-in-out infinite`,
    sortOrder: 5
  };
}

interface Order {
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
  };
  dropoffAddress?: {
    label: string;
    postcode: string;
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
  customer?: {
    name: string;
    email: string;
  };
  driver?: {
    user: {
      name: string;
    };
  };
  route?: {
    id: string;
    reference: string;
    status: string;
    totalDrops: number;
  } | null;
  customerPreferences?: any;
  serviceType?: string;
  orderType?: string;
  isMultiDrop?: boolean;
  routeId?: string | null;
  createdAt: string;
  paidAt?: string;
  durationSeconds?: number;
  assignment?: {
    status: string;
    claimedAt?: string;
  };
  preferredDate?: string;
  timeSlot?: string;
  pickupTimeSlot?: string;
  urgency?: string;
  distanceMeters?: number;
}

export interface OrdersClientProps {
  declinedNotifications?: string[];
  acceptedNotifications?: string[];
  inProgressNotifications?: string[];
}

export interface OrdersTableProps extends OrdersClientProps {
  hideActionBar?: boolean;
  onActionsChange?: (actions: React.ReactNode) => void;
  embedded?: boolean;
}

export function OrdersTable({ 
  hideActionBar = false,
  onActionsChange,
  embedded = false,
  declinedNotifications = [],
  acceptedNotifications = [],
  inProgressNotifications = []
}: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'new' | 'existing'>('all');
  const [viewMode, setViewMode] = useState<ViewType>('table');
  const [selectedOrderCode, setSelectedOrderCode] = useState<
    string | undefined
  >();
  const [showAllOrders, setShowAllOrders] = useState(true); // Ensure all orders are shown by default
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100, // Increased limit to show more orders
    total: 0,
    hasMore: false,
  });
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const toast = useToast();

  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();

  const {
    isOpen: isRoutePreviewOpen,
    onOpen: onRoutePreviewOpen,
    onClose: onRoutePreviewClose,
  } = useDisclosure();
  
  const {
    isOpen: isRemoveOpen,
    onOpen: onRemoveOpen,
    onClose: onRemoveClose,
  } = useDisclosure();
  
  const [selectedOrderForRemoval, setSelectedOrderForRemoval] = useState<Order | null>(null);
  const [removalType, setRemovalType] = useState<'single' | 'all'>('single');
  const [removalReason, setRemovalReason] = useState('');
  
  // Driver Assignment State
  const {
    isOpen: isAssignOpen,
    onOpen: onAssignOpen,
    onClose: onAssignClose,
  } = useDisclosure();
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<Order | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);

  const loadOrders = useCallback(
    async (refresh = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (statusFilter) params.set('status', statusFilter);
        if (paymentFilter) params.set('payment', paymentFilter);
        if (dateRange) params.set('dateRange', dateRange);
        if (driverFilter) params.set('driver', driverFilter);
        if (areaFilter) params.set('area', areaFilter);
        params.set('take', pagination.limit.toString());

        // Ensure we get all orders if no specific filters are applied
        if (
          !statusFilter &&
          !paymentFilter &&
          !dateRange &&
          !driverFilter &&
          !areaFilter &&
          !searchQuery
        ) {
          params.set('take', '500'); // Get maximum orders when no filters
        }

        if (!refresh && pagination.page > 1) {
          // For pagination, we'd need cursor-based pagination
          // For now, just reload all
        }

        const response = await fetch(`/api/admin/orders?${params.toString()}`);
        const data = await response.json();

        if (refresh) {
          setOrders(data.items || data);

          // Count new orders (pending and confirmed without driver)
          const newOrders = (data.items || data).filter(
            (order: Order) =>
              ['pending', 'CONFIRMED'].includes(order.status) && !order.driver
          );
          setNewOrdersCount(newOrders.length);

          setPagination(prev => ({
            ...prev,
            total: data.items?.length || 0,
            hasMore: data.nextCursor ? true : false,
          }));
        } else {
          setOrders(prev => [...prev, ...(data.items || data)]);
        }
      } catch (error) {
        toast({
          title: 'Error loading orders',
          description: 'Failed to fetch orders data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [
      searchQuery,
      statusFilter,
      paymentFilter,
      dateRange,
      driverFilter,
      areaFilter,
      pagination.limit,
      toast,
    ]
  );

  useEffect(() => {
    // Prevent unnecessary API calls during hot reload
    if (typeof window !== 'undefined') {
      loadOrders(true);
    }
  }, [
    statusFilter,
    paymentFilter,
    dateRange,
    driverFilter,
    areaFilter,
    orderTypeFilter,
    showAllOrders,
  ]);

  // Filter orders based on search query and type using useMemo for better performance
  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];

    let filtered = orders;

    // Apply order type filter first
    if (orderTypeFilter !== 'all') {
      if (orderTypeFilter === 'new') {
        // New orders: PENDING_PAYMENT status or CONFIRMED without driver
        filtered = filtered.filter(
          order =>
            order.status === 'PENDING_PAYMENT' ||
            (order.status === 'CONFIRMED' && !order.driver)
        );
      } else if (orderTypeFilter === 'existing') {
        // Existing orders: All others
        filtered = filtered.filter(
          order =>
            order.status !== 'PENDING_PAYMENT' &&
            !(order.status === 'CONFIRMED' && !order.driver)
        );
      }
    }

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(
        order =>
          String(order?.reference ?? '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          String(order?.pickupAddress?.label ?? '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          String(order?.dropoffAddress?.label ?? '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          String(order?.customerName ?? '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          String(order?.customerEmail ?? '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // ✅ Sort by priority (urgent first) then by scheduled date
    filtered.sort((a, b) => {
      const priorityA = calculatePriority(a.scheduledAt);
      const priorityB = calculatePriority(b.scheduledAt);
      
      // Sort by priority level first (urgent → future)
      if (priorityA.sortOrder !== priorityB.sortOrder) {
        return priorityA.sortOrder - priorityB.sortOrder;
      }
      
      // Then by scheduled date (earliest first)
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

    return filtered;
  }, [orders, searchQuery, orderTypeFilter]);

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'No orders selected',
        description: 'Please select orders to perform bulk actions',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const apiEndpoint = '/api/admin/orders/bulk';
      const requestBody: any = {
        orderIds: selectedOrders,
        action: action,
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();

        let description = result.message || `${action} applied to ${selectedOrders.length} orders`;

        // Special handling for floor warning results
        if (action === 'send-floor-warnings' && result.summary) {
          description = `Checked ${result.summary.totalChecked} orders. Sent ${result.summary.sent} floor warnings.`;
        }

        toast({
          title: 'Bulk action completed',
          description,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setSelectedOrders([]);
        loadOrders(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk action failed');
      }
    } catch (error) {
      toast({
        title: 'Bulk action failed',
        description: 'Failed to perform bulk action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCreateRouteFromOrders = async () => {
    if (selectedOrders.length < 2) {
      toast({
        title: 'Insufficient orders',
        description: 'Please select at least 2 orders to create a route',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Call the route creation API with selected order IDs
      const response = await fetch('/api/admin/routes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingIds: selectedOrders,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Route created successfully',
          description: `Created route ${result.route?.reference || result.route?.id} with ${selectedOrders.length} orders`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setSelectedOrders([]);
        loadOrders(true);
        
        // Optionally redirect to operations page (routes tab)
        // window.location.href = '/admin/operations';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create route');
      }
    } catch (error) {
      console.error('Error creating route:', error);
      toast({
        title: 'Failed to create route',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleViewOrder = (orderCode: string) => {
    setSelectedOrderCode(orderCode);
    onDetailOpen();
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'gray';

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

  const getPaymentStatusColor = (status: string | undefined) => {
    if (!status) return 'gray';

    switch (status) {
      case 'paid':
        return 'green';
      case 'requires_action':
        return 'orange';
      case 'refunded':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatCurrency = (totalGBP: number) => {
    return `£${(totalGBP / 100).toFixed(2)}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Quick data quality check for orders table
  const getDataQualityScore = (order: Order) => {
    let score = 100;
    
    // Critical checks (-20 each)
    if (!order.distanceMeters && !order.pickupAddress) score -= 20;
    if (!order.customerPhone || order.customerPhone.length < 10) score -= 20;
    
    // Warning checks (-10 each)  
    if (!order.pickupTimeSlot) score -= 10;
    if (!order.preferredDate && !order.scheduledAt) score -= 10;
    
    return Math.max(0, score);
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return '-';
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getSLAStatus = (order: Order) => {
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      return { status: 'COMPLETED', message: 'Order completed' };
    }

    const now = new Date();
    const orderDate = order.scheduledAt
      ? new Date(order.scheduledAt)
      : new Date(order.createdAt);
    const minutesSinceOrder = differenceInMinutes(now, orderDate);

    if (minutesSinceOrder > 120) {
      // 2 hours
      return { status: 'overdue', message: `${minutesSinceOrder}min overdue` };
    } else if (minutesSinceOrder > 60) {
      // 1 hour
      return { status: 'warning', message: `${minutesSinceOrder}min old` };
    } else {
      return { status: 'ok', message: `${minutesSinceOrder}min old` };
    }
  };

  const handleCreateOrder = () => {
    window.open('/booking-luxury', '_blank');
  };

  const handleOpenRemoveModal = (order: Order) => {
    setSelectedOrderForRemoval(order);
    setRemovalType('single');
    setRemovalReason('');
    onRemoveOpen();
  };

  const handleOpenAssignModal = async (order: Order) => {
    setSelectedOrderForAssign(order);
    setSelectedDriverId('');
    setAssignReason('');
    
    // Load available drivers
    try {
      const response = await fetch('/api/admin/drivers?status=available');
      const data = await response.json();
      if (data.drivers) {
        setAvailableDrivers(data.drivers);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available drivers',
        status: 'error',
        duration: 3000,
      });
    }
    
    onAssignOpen();
  };

  const handleAssignDriver = async () => {
    if (!selectedOrderForAssign || !selectedDriverId) return;

    setIsAssigning(true);
    try {
      const isReassign = !!selectedOrderForAssign.driver;
      const response = await fetch(
        `/api/admin/orders/${selectedOrderForAssign.reference}/assign-driver`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: selectedDriverId,
            reason: assignReason || (isReassign ? 'Reassigned by admin' : 'Assigned by admin')
          })
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        toast({
          title: 'Success',
          description: isReassign 
            ? `Order ${selectedOrderForAssign.reference} reassigned successfully. Driver will be notified.` 
            : `Order ${selectedOrderForAssign.reference} assigned to driver. Notification sent.`,
          status: 'success',
          duration: 3000,
        });
        
        onAssignClose();
        loadOrders(true);
      } else {
        throw new Error(data.error || 'Failed to assign driver');
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign driver',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel order #${order.reference}?\n\n` +
      `This will:\n` +
      `- Cancel the order\n` +
      `- Notify the driver (if assigned)\n` +
      `- Update the customer\n` +
      `- Free up the driver's capacity\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmCancel) return;

    const reason = window.prompt('Please provide a reason for cancellation:', 'Cancelled by admin');
    
    try {
      const response = await fetch(
        `/api/admin/orders/${order.reference}/cancel-enhanced`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: reason || 'Cancelled by admin',
            notifyCustomer: true
          })
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        toast({
          title: 'Success',
          description: `Order #${order.reference} has been cancelled. All notifications sent.`,
          status: 'success',
          duration: 4000,
        });
        
        loadOrders(true);
      } else {
        throw new Error(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel order',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleRemoveOrder = async () => {
    if (!selectedOrderForRemoval) return;

    try {
      if (removalType === 'single') {
        // Remove single order
        const response = await fetch(
          `/api/admin/orders/${selectedOrderForRemoval.reference}/remove-driver`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason: removalReason || 'Removed by admin'
            })
          }
        );

        const data = await response.json();

        if (data.success) {
          toast({
            title: 'Order Removed',
            description: data.message,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          loadOrders(true);
          onRemoveClose();
        } else {
          throw new Error(data.error || 'Failed to remove order');
        }
      } else if (removalType === 'all' && selectedOrderForRemoval.driver) {
        // Remove all orders from driver
        const driverId = (selectedOrderForRemoval as any).driverId;
        
        const response = await fetch(
          `/api/admin/drivers/${driverId}/remove-all`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'orders',
              reason: removalReason || 'Removed all orders by admin'
            })
          }
        );

        const data = await response.json();

        if (data.success) {
          toast({
            title: 'All Orders Removed',
            description: data.message,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          loadOrders(true);
          onRemoveClose();
        } else {
          throw new Error(data.error || 'Failed to remove all orders');
        }
      }
    } catch (error) {
      toast({
        title: 'Removal Failed',
        description: error instanceof Error ? error.message : 'Failed to remove order',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const renderOrdersTable = () => (
    <Card bg="#000000" borderColor="#333333">
      <CardBody p={0} bg="#000000">
        <Table 
          variant="simple"
          sx={{
            backgroundColor: '#000000',
            color: '#FFFFFF',
            '& thead tr': {
              backgroundColor: '#111111 !important',
            },
            '& thead th': {
              backgroundColor: '#111111 !important',
              color: '#FFFFFF !important',
              borderColor: '#333333 !important',
            },
            '& tbody tr:nth-of-type(even)': {
              backgroundColor: '#000000 !important',
              backgroundImage: 'none !important',
            },
            '& tbody tr:nth-of-type(odd)': {
              backgroundColor: '#0a0a0a !important',
              backgroundImage: 'none !important',
            },
            '& tbody tr': {
              backgroundColor: '#000000 !important',
              backgroundImage: 'none !important',
              color: '#FFFFFF !important',
            },
            '& tbody td': {
              color: '#FFFFFF !important',
              borderColor: '#333333 !important',
            },
          }}
        >
          <Thead>
            <Tr>
              <Th px={4} color="#FFFFFF" bg="#111111" borderColor="#333333">
                <Checkbox
                  isChecked={
                    selectedOrders.length === filteredOrders.length &&
                    filteredOrders.length > 0
                  }
                  isIndeterminate={
                    selectedOrders.length > 0 &&
                    selectedOrders.length < filteredOrders.length
                  }
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedOrders(filteredOrders.map(order => order.id));
                    } else {
                      setSelectedOrders([]);
                    }
                  }}
                />
              </Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Code</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Customer</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Service</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Type</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Route</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Time Window</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Status</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Driver</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Price</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Data Quality</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Payment</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">SLA</Th>
              <Th color="#FFFFFF" bg="#111111" borderColor="#333333">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Tr key={`loading-${i}`}>
                  <Td colSpan={13}>
                    <Flex justify="center" py={8}>
                      <Spinner />
                    </Flex>
                  </Td>
                </Tr>
              ))
            ) : filteredOrders.length === 0 ? (
              <Tr>
                <Td colSpan={13} color="#FFFFFF">
                  <Flex justify="center" py={8}>
                    <Text color="#FFFFFF">No orders found</Text>
                  </Flex>
                </Td>
              </Tr>
            ) : (
              filteredOrders.map(order => {
                const slaStatus = getSLAStatus(order);
                const isDeclined = declinedNotifications.includes(order.id);
                const isAccepted = acceptedNotifications.includes(order.id);
                const isInProgress = inProgressNotifications.includes(order.id);
                
                return (
                  <Tr
                    key={order.id}
                    _hover={{ 
                      bg: isDeclined ? 'red.900' : 
                          isInProgress ? 'blue.900' :
                          isAccepted ? 'green.900' : 
                          '#1a1a1a' 
                    }}
                    cursor="pointer"
                    onClick={() => handleViewOrder(order.reference)}
                    bg={
                      isDeclined ? 'red.950' : 
                      isInProgress ? 'blue.950' :
                      isAccepted ? 'green.950' : 
                      'transparent'
                    }
                    color="#FFFFFF"
                    borderLeft={
                      isDeclined || isAccepted || isInProgress ? '4px solid' : 'none'
                    }
                    borderLeftColor={
                      isDeclined ? 'red.500' : 
                      isInProgress ? 'blue.500' :
                      isAccepted ? 'green.500' : 
                      'transparent'
                    }
                  >
                    <Td px={4} onClick={e => e.stopPropagation()}>
                      <Checkbox
                        isChecked={selectedOrders.includes(order.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedOrders([...selectedOrders, order.id]);
                          } else {
                            setSelectedOrders(
                              selectedOrders.filter(id => id !== order.id)
                            );
                          }
                        }}
                      />
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Circle
                          size="12px"
                          bg={
                            isDeclined ? '#E53E3E' : 
                            isInProgress ? '#3B82F6' :
                            isAccepted ? '#10B981' : 
                            calculatePriority(order.scheduledAt).color
                          }
                          animation={
                            isDeclined ? `${fastPulseAnimation} 1s ease-in-out infinite` : 
                            isInProgress ? `${pulseAnimation} 2s ease-in-out infinite` :
                            isAccepted ? `${pulseAnimation} 2s ease-in-out infinite` :
                            calculatePriority(order.scheduledAt).animation
                          }
                        />
                        <Text fontWeight="bold" color={
                          isDeclined ? 'red.400' : 
                          isInProgress ? 'blue.400' :
                          isAccepted ? 'green.400' :
                          '#FFFFFF'
                        }>
                          #{order.reference || 'N/A'}
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium" color="#FFFFFF">
                          {order.customerName || 'Unknown Customer'}
                        </Text>
                        <Text fontSize="sm" color="#9ca3af">
                          {order.customer?.email || order.customerEmail || '-'}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={
                          order.serviceType === 'economy' ? 'blue' :
                          order.serviceType === 'express' ? 'red' :
                          'green'
                        }
                        size="sm"
                      >
                        {order.serviceType === 'economy' ? 'Economy' :
                         order.serviceType === 'express' ? 'Express' :
                         'Standard'}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={order.isMultiDrop || order.orderType === 'multi-drop' ? 'purple' : 'gray'}
                        size="sm"
                      >
                        {order.isMultiDrop || order.orderType === 'multi-drop' ? 'Multi-Drop' : 'Single'}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Icon
                            as={FaMapMarkerAlt}
                            color="green.500"
                            boxSize={3}
                          />
                          <Text fontSize="sm" noOfLines={1} maxW="200px" color="#FFFFFF">
                            {order.pickupAddress?.label || '-'}
                          </Text>
                        </HStack>
                        <HStack>
                          <Icon
                            as={FaMapMarkerAlt}
                            color="red.500"
                            boxSize={3}
                          />
                          <Text fontSize="sm" noOfLines={1} maxW="200px" color="#FFFFFF">
                            {order.dropoffAddress?.label || '-'}
                          </Text>
                        </HStack>
                        {order.route && (
                          <Text fontSize="xs" color="purple.400">
                            Route: {order.route.reference} ({order.route.totalDrops} drops)
                          </Text>
                        )}
                        <Text fontSize="xs" color="#9ca3af">
                          {formatDistance(order.distanceMeters)} •{' '}
                          {formatDuration(order.durationSeconds)}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" color="#FFFFFF">
                          {order.scheduledAt
                            ? format(new Date(order.scheduledAt), 'MMM dd')
                            : '-'}
                        </Text>
                        <Text fontSize="xs" color="#9ca3af">
                          {order.pickupTimeSlot || order.timeSlot || '-'}
                        </Text>
                        {order.urgency && order.urgency !== 'scheduled' && (
                          <Badge size="sm" colorScheme={
                            order.urgency === 'same-day' ? 'red' : 
                            order.urgency === 'next-day' ? 'orange' : 'green'
                          }>
                            {order.urgency === 'same-day' ? 'Same Day' :
                             order.urgency === 'next-day' ? 'Next Day' : 'Scheduled'}
                          </Badge>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Badge colorScheme={getStatusColor(order.status)}>
                          {order.status
                            ? String(order.status).replace('_', ' ')
                            : 'Unknown'}
                        </Badge>
                        {isDeclined && (
                          <Badge 
                            colorScheme="red" 
                            variant="solid" 
                            animation={`${pulseAnimation} 2s ease-in-out infinite`}
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            🚨 DECLINED
                          </Badge>
                        )}
                        {isAccepted && (
                          <Badge 
                            colorScheme="green" 
                            variant="solid" 
                            animation={`${pulseAnimation} 2s ease-in-out infinite`}
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            ✅ ACCEPTED
                          </Badge>
                        )}
                        {isInProgress && (
                          <Badge 
                            colorScheme="blue" 
                            variant="solid" 
                            animation={`${pulseAnimation} 2s ease-in-out infinite`}
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            🚀 IN PROGRESS
                          </Badge>
                        )}
                      </HStack>
                    </Td>
                    <Td>
                      <HStack>
                        {order.driver?.user?.name ? (
                          <>
                            <Icon as={FaTruck} color="blue.500" boxSize={3} />
                            <Text fontSize="sm" color="#FFFFFF">{order.driver.user.name}</Text>
                          </>
                        ) : (
                          <Text fontSize="sm" color="#9ca3af">
                            -
                          </Text>
                        )}
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontWeight="bold" color="#FFFFFF">{formatCurrency(order.totalGBP || 0)}</Text>
                    </Td>
                    <Td>
                      <Tooltip label={`Data completeness: ${getDataQualityScore(order)}%`}>
                        <Badge colorScheme={getQualityColor(getDataQualityScore(order))} size="sm">
                          {getDataQualityScore(order)}%
                        </Badge>
                      </Tooltip>
                    </Td>
                    <Td>
                      <Badge colorScheme={getPaymentStatusColor(order.status)}>
                        {order.status
                          ? String(order.status).replace('_', ' ')
                          : 'Unknown'}
                      </Badge>
                    </Td>
                    <Td>
                      <Tooltip label={slaStatus.message}>
                        <HStack spacing={1}>
                          <Icon
                            as={
                              slaStatus.status === 'overdue'
                                ? FaExclamationTriangle
                                : slaStatus.status === 'warning'
                                  ? FaClock
                                  : FaCheckCircle
                            }
                            color={
                              slaStatus.status === 'overdue'
                                ? 'red.500'
                                : slaStatus.status === 'warning'
                                  ? 'orange.500'
                                  : 'green.500'
                            }
                            boxSize={3}
                          />
                          <Text
                            fontSize="xs"
                            color={
                              slaStatus.status === 'overdue'
                                ? 'red.400'
                                : slaStatus.status === 'warning'
                                  ? 'orange.400'
                                  : '#9ca3af'
                            }
                          >
                            {slaStatus.message}
                          </Text>
                        </HStack>
                      </Tooltip>
                    </Td>
                    <Td onClick={e => e.stopPropagation()}>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FaEllipsisV />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem
                            icon={<FaEye />}
                            onClick={() => handleViewOrder(order.reference)}
                          >
                            View Details
                          </MenuItem>
                          <MenuItem
                            icon={<FaEdit />}
                            onClick={() => handleBulkAction('edit')}
                          >
                            Edit Order
                          </MenuItem>
                          <MenuItem
                            icon={<FaUser />}
                            onClick={() => handleBulkAction('assign')}
                          >
                            Assign Driver
                          </MenuItem>
                          <MenuItem
                            icon={<FaEnvelope />}
                            onClick={() => handleBulkAction('email')}
                          >
                            Email Customer
                          </MenuItem>
                          <MenuItem
                            icon={<FaTruck />}
                            onClick={() => handleOpenAssignModal(order)}
                            color="blue.500"
                          >
                            {order.driver ? 'Reassign Driver' : 'Assign Driver'}
                          </MenuItem>
                          {order.driver && (
                            <MenuItem
                              icon={<FaUserSlash />}
                              onClick={() => handleOpenRemoveModal(order)}
                              color="red.500"
                            >
                              Remove Assignment
                            </MenuItem>
                          )}
                          {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                            <MenuItem
                              icon={<FaTrash />}
                              onClick={() => handleCancelOrder(order)}
                              color="red.600"
                            >
                              Cancel Order
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );

  const renderOrdersCards = () => (
    <Grid templateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={4}>
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <Card key={`loading-${i}`}>
            <CardBody>
              <Flex justify="center" py={8}>
                <Spinner />
              </Flex>
            </CardBody>
          </Card>
        ))
      ) : filteredOrders.length === 0 ? (
        <GridItem colSpan={1}>
          <Card>
            <CardBody>
              <Flex justify="center" py={8}>
                <Text color="gray.500">No orders found</Text>
              </Flex>
            </CardBody>
          </Card>
        </GridItem>
      ) : (
        filteredOrders.map(order => {
          const slaStatus = getSLAStatus(order);
          return (
            <Card
              key={order.id}
              bg="#111111"
              borderColor="#333333"
              borderWidth="2px"
              borderRadius="xl"
              boxShadow="0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)"
              cursor="pointer"
              onClick={() => handleViewOrder(order.reference)}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${getStatusColor(order.status) === 'green' ? '#10b981' : getStatusColor(order.status) === 'red' ? '#ef4444' : getStatusColor(order.status) === 'yellow' ? '#f59e0b' : '#2563eb'} 0%, transparent 100%)`,
              }}
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.5), 0 0 0 1px rgba(37, 99, 235, 0.2)',
                borderColor: '#2563eb',
              }}
            >
              <CardBody bg="#111111" p={5}>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Text 
                      fontWeight="bold" 
                      color="#2563eb" 
                      fontSize="lg"
                      letterSpacing="0.5px"
                      textShadow="0 0 10px rgba(37, 99, 235, 0.3)"
                    >
                      #{order.reference}
                    </Text>
                    <Checkbox
                      isChecked={selectedOrders.includes(order.id)}
                      onChange={e => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedOrders([...selectedOrders, order.id]);
                        } else {
                          setSelectedOrders(
                            selectedOrders.filter(id => id !== order.id)
                          );
                        }
                      }}
                    />
                  </HStack>

                  <VStack align="start" spacing={2}>
                    <Text 
                      fontWeight="semibold" 
                      color="#FFFFFF"
                      fontSize="md"
                      letterSpacing="0.3px"
                    >
                      {order.customer && order.customer.name
                        ? order.customer.name
                        : order.customerName || '-'}
                    </Text>
                    <Text 
                      fontSize="sm" 
                      color="#9ca3af"
                      fontWeight="medium"
                    >
                      {order.customer && order.customer.email
                        ? order.customer.email
                        : order.customerEmail || '-'}
                    </Text>
                  </VStack>

                  <VStack align="start" spacing={2}>
                    <HStack spacing={2}>
                      <Icon as={FaMapMarkerAlt} color="#10b981" boxSize={4} />
                      <Text 
                        fontSize="sm" 
                        color="#FFFFFF"
                        fontWeight="medium"
                        noOfLines={1}
                      >
                        {order.pickupAddress?.label || '-'}
                      </Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Icon as={FaMapMarkerAlt} color="#ef4444" boxSize={4} />
                      <Text 
                        fontSize="sm" 
                        color="#FFFFFF"
                        fontWeight="medium"
                        noOfLines={1}
                      >
                        {order.dropoffAddress?.label || '-'}
                      </Text>
                    </HStack>
                  </VStack>

                  <HStack justify="space-between" pt={2} borderTop="1px solid" borderColor="#333333">
                    <Badge 
                      colorScheme={getStatusColor(order.status)}
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontWeight="semibold"
                      fontSize="xs"
                      letterSpacing="0.5px"
                      boxShadow="0 2px 8px rgba(0, 0, 0, 0.3)"
                    >
                      {order.status
                        ? String(order.status).replace('_', ' ')
                        : 'Unknown'}
                    </Badge>
                    <Text 
                      fontWeight="bold" 
                      color="#10b981"
                      fontSize="lg"
                      letterSpacing="0.5px"
                    >
                      {formatCurrency(order.totalGBP || 0)}
                    </Text>
                  </HStack>

                  <HStack
                    justify="space-between"
                    fontSize="sm"
                    color="gray.600"
                  >
                    <HStack>
                      {order.driver &&
                      order.driver.user &&
                      order.driver.user.name ? (
                        <>
                          <Icon as={FaTruck} color="blue.500" boxSize={3} />
                          <Text>{order.driver.user.name}</Text>
                        </>
                      ) : (
                        <Text>No driver</Text>
                      )}
                    </HStack>
                    <HStack>
                      <Icon
                        as={
                          slaStatus.status === 'overdue'
                            ? FaExclamationTriangle
                            : slaStatus.status === 'warning'
                              ? FaClock
                              : FaCheckCircle
                        }
                        color={
                          slaStatus.status === 'overdue'
                            ? 'red.500'
                            : slaStatus.status === 'warning'
                              ? 'orange.500'
                              : 'green.500'
                        }
                        boxSize={3}
                      />
                      <Text fontSize="xs">{slaStatus.message}</Text>
                    </HStack>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          );
        })
      )}
    </Grid>
  );

  const renderOrdersKanban = () => (
    <Grid templateColumns="repeat(5, 1fr)" gap={4}>
      {['DRAFT', 'CONFIRMED', 'in_progress', 'COMPLETED', 'CANCELLED'].map(
        status => {
          const statusOrders = filteredOrders.filter(
            order => order.status === status
          );
          return (
            <Card 
              key={status}
              bg="#111111"
              borderColor="#333333"
              borderWidth="2px"
              borderRadius="xl"
              boxShadow="0 4px 16px rgba(0, 0, 0, 0.4)"
              overflow="hidden"
            >
              <CardHeader 
                bg="linear-gradient(135deg, #1a1a1a 0%, #111111 100%)"
                borderBottom="2px solid"
                borderColor="#333333"
                pb={3}
              >
                <HStack justify="space-between">
                  <Heading 
                    size="sm" 
                    textTransform="capitalize"
                    color="#FFFFFF"
                    fontWeight="bold"
                    letterSpacing="0.5px"
                  >
                    {status ? String(status).replace('_', ' ') : 'Unknown'}
                  </Heading>
                  <Badge 
                    colorScheme="blue" 
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontWeight="bold"
                    fontSize="sm"
                    boxShadow="0 2px 8px rgba(37, 99, 235, 0.4)"
                  >
                    {statusOrders.length}
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody bg="#111111" p={4}>
                <VStack spacing={3} align="stretch">
                  {statusOrders.map(order => {
                    const slaStatus = getSLAStatus(order);
                    return (
                      <Card
                        key={order.id}
                        bg="#1a1a1a"
                        borderColor="#333333"
                        borderWidth="1px"
                        borderRadius="lg"
                        cursor="pointer"
                        onClick={() => handleViewOrder(order.reference)}
                        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                        _hover={{
                          transform: 'translateX(4px)',
                          borderColor: '#2563eb',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        }}
                      >
                        <CardBody p={3}>
                          <VStack align="start" spacing={2}>
                            <Text 
                              fontWeight="bold" 
                              fontSize="sm"
                              color="#2563eb"
                              letterSpacing="0.3px"
                            >
                              #{order.reference}
                            </Text>
                            <Text 
                              fontSize="xs" 
                              color="#FFFFFF"
                              fontWeight="medium"
                            >
                              {order.customerName}
                            </Text>
                            <Text 
                              fontSize="xs" 
                              color="#9ca3af" 
                              noOfLines={1}
                              fontWeight="medium"
                            >
                              {order.pickupAddress?.label || '-'}
                            </Text>
                            <HStack justify="space-between" w="full" pt={1} borderTop="1px solid" borderColor="#333333">
                              <Text 
                                fontWeight="bold" 
                                fontSize="xs"
                                color="#10b981"
                              >
                                {formatCurrency(order.totalGBP || 0)}
                              </Text>
                              <Icon
                                as={
                                  slaStatus.status === 'overdue'
                                    ? FaExclamationTriangle
                                    : slaStatus.status === 'warning'
                                      ? FaClock
                                      : FaCheckCircle
                                }
                                color={
                                  slaStatus.status === 'overdue'
                                    ? '#ef4444'
                                    : slaStatus.status === 'warning'
                                      ? '#f59e0b'
                                      : '#10b981'
                                }
                                boxSize={4}
                              />
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </VStack>
              </CardBody>
            </Card>
          );
        }
      )}
    </Grid>
  );

  const actionBar = useMemo(() => (
    <HStack spacing={3}>
      <ViewToggle view={viewMode} onViewChange={setViewMode} />
      <Button
        leftIcon={<FaDownload />}
        variant="outline"
        onClick={() => handleBulkAction('export')}
        isDisabled={selectedOrders.length === 0}
        bg="#111111"
        color="#FFFFFF"
        borderColor="#333333"
        borderWidth="2px"
        borderRadius="lg"
        px={4}
        py={2}
        fontWeight="semibold"
        letterSpacing="0.5px"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
        _hover={{
          bg: '#1a1a1a',
          borderColor: '#2563eb',
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
        }}
        _active={{
          transform: 'translateY(0)',
        }}
        _disabled={{
          opacity: 0.5,
          cursor: 'not-allowed',
          bg: '#0a0a0a',
          borderColor: '#1a1a1a',
        }}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        Export ({selectedOrders.length})
      </Button>
      <Button
        leftIcon={<FaEnvelope />}
        variant="outline"
        onClick={() => handleBulkAction('email')}
        isDisabled={selectedOrders.length === 0}
        bg="#111111"
        color="#FFFFFF"
        borderColor="#333333"
        borderWidth="2px"
        borderRadius="lg"
        px={4}
        py={2}
        fontWeight="semibold"
        letterSpacing="0.5px"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
        _hover={{
          bg: '#1a1a1a',
          borderColor: '#10b981',
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
        }}
        _active={{
          transform: 'translateY(0)',
        }}
        _disabled={{
          opacity: 0.5,
          cursor: 'not-allowed',
          bg: '#0a0a0a',
          borderColor: '#1a1a1a',
        }}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        Email Customers
      </Button>
      <Button
        leftIcon={<FaExclamationTriangle />}
        colorScheme="orange"
        variant="outline"
        onClick={() => handleBulkAction('send-floor-warnings')}
        isDisabled={selectedOrders.length === 0}
        title="Send floor warning emails to selected customers who didn't specify floor numbers"
        bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        color="#FFFFFF"
        borderColor="#f59e0b"
        borderWidth="2px"
        borderRadius="lg"
        px={4}
        py={2}
        fontWeight="bold"
        letterSpacing="0.5px"
        boxShadow="0 4px 16px rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2)"
        _hover={{
          bg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          borderColor: '#f59e0b',
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 24px rgba(245, 158, 11, 0.6), 0 0 30px rgba(245, 158, 11, 0.3)',
        }}
        _active={{
          transform: 'translateY(0)',
        }}
        _disabled={{
          opacity: 0.5,
          cursor: 'not-allowed',
          bg: '#0a0a0a',
          borderColor: '#1a1a1a',
        }}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        Send Floor Warnings ({selectedOrders.length})
      </Button>
    </HStack>
  ), [handleBulkAction, selectedOrders.length, setViewMode, viewMode]);

  useEffect(() => {
    if (onActionsChange) {
      onActionsChange(actionBar);
    }
  }, [actionBar, onActionsChange]);

  return (
    <>
      <Box>
        {!hideActionBar && (
          <Box mb={4}>
            {actionBar}
          </Box>
        )}
        <Box>
          {/* Pending Orders Banner */}
          {!embedded && newOrdersCount > 0 && (
            <Card 
              mb={6} 
              bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              borderColor="#f59e0b"
              borderWidth="2px"
              borderRadius="xl"
              boxShadow="0 8px 32px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.2)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                pointerEvents: 'none',
              }}
              _after={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '200%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 25%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.5) 75%, transparent 100%)',
                animation: `${waveAnimation} 3s ease-in-out infinite`,
                pointerEvents: 'none',
                zIndex: 1,
                filter: 'blur(1px)',
              }}
              css={{
                '@keyframes wave': {
                  '0%': {
                    transform: 'translateX(-100%) translateY(0) scaleY(1)',
                    opacity: '0.3',
                  },
                  '25%': {
                    transform: 'translateX(-50%) translateY(-5px) scaleY(1.1)',
                    opacity: '0.5',
                  },
                  '50%': {
                    transform: 'translateX(0%) translateY(-10px) scaleY(1.2)',
                    opacity: '0.7',
                  },
                  '75%': {
                    transform: 'translateX(50%) translateY(-5px) scaleY(1.1)',
                    opacity: '0.5',
                  },
                  '100%': {
                    transform: 'translateX(100%) translateY(0) scaleY(1)',
                    opacity: '0.3',
                  },
                },
              }}
            >
              <CardBody p={4} position="relative" zIndex={2}>
                <HStack spacing={4} align="center" position="relative" zIndex={2}>
                  <Circle
                    size="48px"
                    bg="rgba(255, 255, 255, 0.2)"
                    backdropFilter="blur(10px)"
                    border="2px solid rgba(255, 255, 255, 0.3)"
                    boxShadow="0 4px 16px rgba(0, 0, 0, 0.2)"
                  >
                    <Icon
                      as={FaExclamationTriangle}
                      color="#FFFFFF"
                      boxSize="24px"
                      animation={`${fastPulseAnimation} 2s infinite`}
                    />
                  </Circle>
                  <VStack align="start" spacing={1} flex={1}>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color="#FFFFFF"
                      letterSpacing="0.5px"
                      textShadow="0 2px 8px rgba(0, 0, 0, 0.3)"
                    >
                      {newOrdersCount} New Order{newOrdersCount > 1 ? 's' : ''} Pending Assignment
                    </Text>
                    <Text
                      fontSize="sm"
                      color="rgba(255, 255, 255, 0.9)"
                      fontWeight="medium"
                    >
                      These orders need driver assignment. Click to view and assign drivers.
                    </Text>
                  </VStack>
                  <Badge
                    bg="rgba(255, 255, 255, 0.2)"
                    color="#FFFFFF"
                    fontSize="lg"
                    fontWeight="bold"
                    px={4}
                    py={2}
                    borderRadius="full"
                    border="2px solid rgba(255, 255, 255, 0.3)"
                    boxShadow="0 4px 16px rgba(0, 0, 0, 0.2)"
                    backdropFilter="blur(10px)"
                  >
                    {newOrdersCount}
                  </Badge>
                </HStack>
              </CardBody>
            </Card>
          )}

          {/* Filters */}
          <Card mb={6} bg="#000000" borderColor="#333333">
            <CardBody bg="#000000">
              <VStack spacing={4} align="stretch">
                {/* Search and Quick Filters */}
                <Flex gap={4} wrap="wrap">
                  <Box flex="1" minW="300px">
                    <InputGroup>
                      <InputLeftElement color="#FFFFFF">
                        <FaSearch />
                      </InputLeftElement>
                      <ClientInput
                        placeholder="Search by code, address, customer..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        bg="#111111"
                        color="#FFFFFF"
                        borderColor="#333333"
                        _placeholder={{ color: '#9ca3af' }}
                        _focus={{ borderColor: '#2563eb', bg: '#111111' }}
                      />
                    </InputGroup>
                  </Box>
                  <Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    placeholder="All Status"
                    minW="150px"
                    bg="#111111"
                    color="#FFFFFF"
                    borderColor="#333333"
                    _hover={{ borderColor: '#2563eb' }}
                    _focus={{ borderColor: '#2563eb', bg: '#111111' }}
                  >
                    <option value="open" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Open</option>
                    <option value="assigned" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Assigned</option>
                    <option value="in_progress" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>In Progress</option>
                    <option value="completed" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Completed</option>
                    <option value="cancelled" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Cancelled</option>
                  </Select>
                  <Select
                    value={paymentFilter}
                    onChange={e => setPaymentFilter(e.target.value)}
                    placeholder="All Payments"
                    minW="150px"
                    bg="#111111"
                    color="#FFFFFF"
                    borderColor="#333333"
                    _hover={{ borderColor: '#2563eb' }}
                    _focus={{ borderColor: '#2563eb', bg: '#111111' }}
                  >
                    <option value="unpaid" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Unpaid</option>
                    <option value="requires_action" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Requires Action</option>
                    <option value="paid" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Paid</option>
                    <option value="refunded" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Refunded</option>
                  </Select>
                  <Select
                    value={orderTypeFilter}
                    onChange={e => setOrderTypeFilter(e.target.value as 'all' | 'new' | 'existing')}
                    placeholder="Order Type"
                    minW="150px"
                    bg="#111111"
                    color="#FFFFFF"
                    borderColor="#333333"
                    _hover={{ borderColor: '#2563eb' }}
                    _focus={{ borderColor: '#2563eb', bg: '#111111' }}
                  >
                    <option value="all" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>All Orders</option>
                    <option value="new" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>New Orders Only</option>
                    <option value="existing" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Existing Orders Only</option>
                  </Select>
                  <Select
                    value={dateRange}
                    onChange={e => setDateRange(e.target.value)}
                    placeholder="Date Range"
                    minW="150px"
                    bg="#111111"
                    color="#FFFFFF"
                    borderColor="#333333"
                    _hover={{ borderColor: '#2563eb' }}
                    _focus={{ borderColor: '#2563eb', bg: '#111111' }}
                  >
                    <option value="today" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Today</option>
                    <option value="week" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>This Week</option>
                    <option value="month" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>This Month</option>
                    <option value="custom" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Custom Range</option>
                  </Select>
                </Flex>

                {/* Additional Filters */}
                <Flex gap={4} wrap="wrap">
                  <ClientInput
                    placeholder="Filter by driver name..."
                    value={driverFilter}
                    onChange={e => setDriverFilter(e.target.value)}
                    minW="200px"
                    bg="#111111"
                    color="#FFFFFF"
                    borderColor="#333333"
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: '#2563eb', bg: '#111111' }}
                  />
                  <ClientInput
                    placeholder="Filter by area..."
                    value={areaFilter}
                    onChange={e => setAreaFilter(e.target.value)}
                    minW="200px"
                    bg="#111111"
                    color="#FFFFFF"
                    borderColor="#333333"
                    _placeholder={{ color: '#9ca3af' }}
                    _focus={{ borderColor: '#2563eb', bg: '#111111' }}
                  />
                </Flex>

                {/* Bulk Actions */}
                {selectedOrders.length > 0 && (
                  <Alert status="info" bg="#1a1a1a" borderColor="#2563eb">
                    <AlertIcon color="#2563eb" />
                    <HStack justify="space-between" w="full">
                      <Text color="#FFFFFF">{selectedOrders.length} orders selected</Text>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          onClick={() => handleBulkAction('assign')}
                          bg="#2563eb"
                          color="#FFFFFF"
                          _hover={{ bg: '#1d4ed8' }}
                        >
                          Assign Driver
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleBulkAction('status')}
                          bg="#2563eb"
                          color="#FFFFFF"
                          _hover={{ bg: '#1d4ed8' }}
                        >
                          Change Status
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedOrders([])}
                          variant="outline"
                          borderColor="#333333"
                          color="#FFFFFF"
                          _hover={{ bg: '#1a1a1a' }}
                        >
                          Clear Selection
                        </Button>
                      </HStack>
                    </HStack>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Orders View */}
          {viewMode === 'table' && renderOrdersTable()}
          {viewMode === 'card' && renderOrdersCards()}
          {viewMode === 'kanban' && renderOrdersKanban()}

          {/* Pagination and Summary */}
          <Flex justify="space-between" align="center" mt={4}>
            <Text color="#FFFFFF">
              Showing {filteredOrders.length} of {orders.length} orders
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                isDisabled={pagination.page === 1}
                onClick={() =>
                  setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                }
                borderColor="#333333"
                color="#FFFFFF"
                _hover={{ bg: '#1a1a1a' }}
                _disabled={{ borderColor: '#333333', color: '#9ca3af', opacity: 0.5 }}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                isDisabled={!pagination.hasMore}
                onClick={() => {
                  setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                  loadOrders();
                }}
                borderColor="#333333"
                color="#FFFFFF"
                _hover={{ bg: '#1a1a1a' }}
                _disabled={{ borderColor: '#333333', color: '#9ca3af', opacity: 0.5 }}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Box>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        isOpen={isDetailOpen}
        onClose={onDetailClose}
        orderCode={selectedOrderCode}
        variant={embedded ? 'embedded' : 'standalone'}
        showSummaryCards={!embedded}
      />

      {/* Assign/Reassign Driver Modal */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedOrderForAssign?.driver ? 'Reassign Driver' : 'Assign Driver'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2}>Order:</Text>
                <Text>#{selectedOrderForAssign?.reference}</Text>
                {selectedOrderForAssign?.driver && (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Current Driver: {selectedOrderForAssign.driver.user?.name}
                  </Text>
                )}
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Select Driver:</Text>
                <Select
                  placeholder="Choose a driver..."
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                >
                  {availableDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.User?.name || driver.name} - {driver.status}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Reason (Optional):</Text>
                <Textarea
                  placeholder="e.g., Original driver unavailable, Better route match, etc."
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  rows={3}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAssignClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleAssignDriver}
              isLoading={isAssigning}
              isDisabled={!selectedDriverId}
            >
              {selectedOrderForAssign?.driver ? 'Reassign' : 'Assign'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Remove Assignment Modal */}
      <Modal isOpen={isRemoveOpen} onClose={onRemoveClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Remove Driver Assignment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                This will remove the driver assignment from the order and free it up for reassignment.
              </Alert>

              {selectedOrderForRemoval && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Order Details:</Text>
                  <Text>Order: #{selectedOrderForRemoval.reference}</Text>
                  <Text>Customer: {selectedOrderForRemoval.customerName}</Text>
                  {selectedOrderForRemoval.driver && (
                    <Text>Current Driver: {selectedOrderForRemoval.driver.user.name}</Text>
                  )}
                </Box>
              )}

              <Divider />

              <Box>
                <Text fontWeight="bold" mb={2}>Removal Options:</Text>
                <VStack align="stretch" spacing={2}>
                  <Button
                    variant={removalType === 'single' ? 'solid' : 'outline'}
                    colorScheme={removalType === 'single' ? 'blue' : 'gray'}
                    onClick={() => setRemovalType('single')}
                    justifyContent="flex-start"
                  >
                    Remove this order only (#{selectedOrderForRemoval?.reference})
                  </Button>
                  {selectedOrderForRemoval?.driver && (
                    <Button
                      variant={removalType === 'all' ? 'solid' : 'outline'}
                      colorScheme={removalType === 'all' ? 'red' : 'gray'}
                      onClick={() => setRemovalType('all')}
                      justifyContent="flex-start"
                    >
                      Remove ALL orders from {selectedOrderForRemoval.driver.user.name}
                    </Button>
                  )}
                </VStack>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Reason (Optional):</Text>
                <Textarea
                  placeholder="e.g., Van breakdown, driver unavailable, etc."
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  rows={3}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRemoveClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleRemoveOrder}
            >
              {removalType === 'all' ? 'Remove All Orders' : 'Remove Order'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function OrdersClient(props: OrdersClientProps) {
  const [actions, setActions] = useState<ReactNode | null>(null);

  return (
    <AdminShell
      title="Orders"
      subtitle="Manage and track all orders"
      showCreateButton={false}
      showDispatchMode={true}
      actions={actions}
    >
      <OrdersTable
        {...props}
        hideActionBar
        onActionsChange={setActions}
      />
    </AdminShell>
  );
}
