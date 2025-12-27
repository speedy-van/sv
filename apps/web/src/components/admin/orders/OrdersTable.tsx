'use client';
import React, { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
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
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Textarea,
  Circle,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
  FaChevronDown,
  FaUserFriends,
  FaFlagCheckered,
} from 'react-icons/fa';
import { formatDistanceToNow, format, differenceInMinutes, differenceInDays, differenceInHours } from 'date-fns';
import {
  AdminShell,
  ViewToggle,
  type ViewType,
  OrderDetailDrawer,
} from '@/components/admin';
import { QuickFilterPresets, DEFAULT_QUICK_FILTERS, type QuickFilterPreset } from './QuickFilterPresets';
import { AdvancedFilters, type AdvancedFilterState } from './AdvancedFilters';
import { BulkOperationsMenu } from './BulkOperationsMenu';
import { AdvancedSortingGrouping, type SortConfig, type GroupByConfig } from './AdvancedSortingGrouping';
import { ExportReportingMenu, type ExportOptions } from './ExportReportingMenu';
import { exportOrdersToCSV, exportOrdersToExcel, exportOrdersToPDF } from '@/lib/export/orders-export';
import { ActiveFilterChips, type ActiveFilter } from './ActiveFilterChips';

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
      email: string;
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
  isEconomyService?: boolean;
  shouldBeMultiDrop?: boolean;
  orderType?: string;
  isMultiDrop?: boolean;
  routeId?: string | null;
  createdAt: string;
  paidAt?: string;
  durationSeconds?: number;
  assignment?: {
    status: string;
    claimedAt?: string;
    driverId?: string;
  };
  assignments?: Array<{
    id: string;
    status: string;
    driverId: string;
    claimedAt?: string;
    declinedAt?: string;
    driver?: {
      user?: {
        name: string;
        email: string;
      };
    };
  }>;
  preferredDate?: string;
  timeSlot?: string;
  pickupTimeSlot?: string;
  urgency?: string;
  distanceMeters?: number;
  amountPaidGBP?: number;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    volumeM3: number;
    image?: string;
  }>;
  notes?: string;
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
  filterAdditionalJourneys?: boolean;
}

export function OrdersTable({ 
  hideActionBar = false,
  onActionsChange,
  embedded = false,
  declinedNotifications = [],
  acceptedNotifications = [],
  inProgressNotifications = [],
  filterAdditionalJourneys = false
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
  const [viewMode, setViewMode] = useState<ViewType>('card');
  const [showUnpaidOrders, setShowUnpaidOrders] = useState(false);
  const [localFilterAdditionalJourneys, setLocalFilterAdditionalJourneys] = useState(false);
  const [multiDropFilter, setMultiDropFilter] = useState<'all' | 'multi-drop' | 'single'>('all');
  
  // Cancel order confirmation dialog
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelDialogRef = useRef<HTMLButtonElement>(null);
  const { isOpen: isCancelDialogOpen, onOpen: onCancelDialogOpen, onClose: onCancelDialogClose } = useDisclosure();
  
  // Mark as Paid confirmation dialog
  const [orderToMarkPaid, setOrderToMarkPaid] = useState<Order | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const markPaidDialogRef = useRef<HTMLButtonElement>(null);
  const { isOpen: isMarkPaidDialogOpen, onOpen: onMarkPaidDialogOpen, onClose: onMarkPaidDialogClose } = useDisclosure();
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
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | undefined>();
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({});
  const [savedFilterPresets, setSavedFilterPresets] = useState<Array<{ name: string; filters: AdvancedFilterState }>>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'scheduledAt', direction: 'asc' });
  const [groupByConfig, setGroupByConfig] = useState<GroupByConfig>({ field: 'none' });
  const [savedSortPresets, setSavedSortPresets] = useState<Array<{ name: string; sort: SortConfig; groupBy: GroupByConfig }>>([]);
  const {
    isOpen: isAdvancedFiltersOpen,
    onOpen: onAdvancedFiltersOpen,
    onClose: onAdvancedFiltersClose,
  } = useDisclosure();
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
  const [driversWithDistance, setDriversWithDistance] = useState<Array<{
    driver: any;
    distanceToPickup: number | null;
    distanceToDropoff: number | null;
    isNearby: boolean;
  }>>([]);

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

        // Default limit: show recent orders first (last 100 orders)
        // Only increase limit if specific filters are applied
        if (
          !statusFilter &&
          !paymentFilter &&
          !dateRange &&
          !driverFilter &&
          !areaFilter &&
          !searchQuery
        ) {
          params.set('take', '100'); // Default: show last 100 orders
        }

        if (!refresh && pagination.page > 1) {
          // For pagination, we'd need cursor-based pagination
          // For now, just reload all
        }

        const apiUrl = `/api/admin/orders?${params.toString()}`;
        console.log('🔍 Loading orders with filters:', {
          searchQuery,
          statusFilter,
          paymentFilter,
          dateRange,
          driverFilter,
          areaFilter,
          apiUrl,
        });

        const response = await fetch(apiUrl);
        const data = await response.json();
        
        console.log('✅ Orders loaded:', {
          count: data.items?.length || data.length || 0,
          filters: params.toString(),
        });

        // Transform orders to include assignments array from Assignment
        const transformOrders = (orders: any[]): Order[] => {
          return orders.map((order: any) => {
            // Convert Assignment (capital A) to assignments (lowercase) array
            const rawAssignments = order.Assignment || [];
            
            const assignments = rawAssignments.map((assignment: any) => {
              // Normalize status to lowercase for consistent comparison
              const rawStatus = assignment.status || '';
              const normalizedStatus = rawStatus.toLowerCase();
              
              // Debug for SV-000080
              if (order.reference === 'SV-000080') {
                console.log('📋 Processing Assignment:', {
                  assignmentId: assignment.id,
                  rawStatus: rawStatus,
                  normalizedStatus: normalizedStatus,
                  driverId: assignment.driverId,
                  driverName: assignment.Driver?.User?.name,
                  declinedAt: assignment.declinedAt,
                  updatedAt: assignment.updatedAt,
                  fullAssignment: assignment,
                });
              }
              
              return {
                id: assignment.id,
                status: normalizedStatus, // Use normalized status
                driverId: assignment.driverId,
                claimedAt: assignment.claimedAt,
                declinedAt: assignment.declinedAt || (normalizedStatus === 'declined' ? assignment.updatedAt : undefined),
                driver: assignment.Driver ? {
                  user: assignment.Driver.User ? {
                    name: assignment.Driver.User.name,
                    email: assignment.Driver.User.email,
                  } : undefined,
                } : undefined,
              };
            });

            return {
              ...order,
              assignments: assignments.length > 0 ? assignments : undefined,
            };
          });
        };

        const transformedData = transformOrders(data.items || data);

        if (refresh) {
          setOrders(transformedData);

          // Count new orders (pending and confirmed without driver)
          // Note: This count will be recalculated in useMemo based on filteredOrders
          // to account for localFilterAdditionalJourneys filter
          const newOrders = transformedData.filter(
            (order: Order) =>
              ['pending', 'CONFIRMED'].includes(order.status) && !order.driver
          );
          setNewOrdersCount(newOrders.length);

          setPagination(prev => ({
            ...prev,
            total: transformedData.length,
            hasMore: data.nextCursor ? true : false,
          }));
        } else {
          setOrders(prev => [...prev, ...transformedData]);
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

  // Track if component has mounted to prevent unnecessary initial loads
  const hasMountedRef = useRef(false);
  const lastFiltersRef = useRef<string>('');
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Prevent unnecessary API calls during hot reload
    if (typeof window === 'undefined') return;

    // Prevent concurrent loads
    if (isLoadingRef.current) {
      return;
    }

    // Create a string representation of current filters to detect changes
    const currentFilters = JSON.stringify({
      statusFilter,
      paymentFilter,
      dateRange,
      driverFilter,
      areaFilter,
      searchQuery,
    });

    // Only reload if filters actually changed
    if (hasMountedRef.current && lastFiltersRef.current === currentFilters) {
      return; // Filters haven't changed, skip reload
    }

    // Update refs
    hasMountedRef.current = true;
    lastFiltersRef.current = currentFilters;
    isLoadingRef.current = true;

    console.log('🔄 useEffect triggered - reloading orders', {
      statusFilter,
      paymentFilter,
      dateRange,
      driverFilter,
      areaFilter,
      searchQuery,
    });
    
    loadOrders(true).finally(() => {
      isLoadingRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statusFilter,
    paymentFilter,
    dateRange,
    driverFilter,
    areaFilter,
    searchQuery,
    // Note: orderTypeFilter and showAllOrders are Frontend-only filters
    // They don't trigger API reload, they filter the results client-side
    // Note: loadOrders is intentionally excluded to prevent infinite loops
  ]);

  // Set up Pusher for real-time order updates
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).Pusher) {
      return;
    }

    const PUSHER_KEY = '407cb06c423e6c032e9c';
    const PUSHER_CLUSTER = 'eu';
    const pusher = new (window as any).Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });

    const ordersChannel = pusher.subscribe('admin-orders');

    ordersChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Subscribed to admin-orders channel for real-time updates');
    });

    // Listen for order status changes (when driver accepts/declines)
    ordersChannel.bind('order-status-changed', (data: any) => {
      console.log('🔄 Order status changed via Pusher:', data);
      toast({
        title: data.reason === 'declined' ? 'Driver Declined Order' : 'Order Status Updated',
        description: data.reason === 'declined' 
          ? `${data.driverName || 'Driver'} declined order ${data.bookingReference || data.jobId}`
          : `Order ${data.bookingReference || data.jobId} status updated`,
        status: data.reason === 'declined' ? 'warning' : 'info',
        duration: 5000,
        isClosable: true,
      });
      // Reload orders to get updated assignment status
      if (!isLoadingRef.current) {
        loadOrders(false);
      }
    });

    // Listen for order accepted events
    ordersChannel.bind('order-accepted', (data: any) => {
      console.log('✅ Order accepted via Pusher:', data);
      toast({
        title: 'Order Accepted',
        description: `${data.driverName || 'Driver'} accepted order ${data.bookingReference || data.jobId}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Reload orders to get updated assignment status
      if (!isLoadingRef.current) {
        loadOrders(false);
      }
    });

    // Listen for driver declined job events
    const notificationsChannel = pusher.subscribe('admin-notifications');
    notificationsChannel.bind('driver-declined-job', (data: any) => {
      console.log('⚠️ Driver declined job via Pusher:', data);
      // Reload orders to get updated assignment status
      if (!isLoadingRef.current) {
        loadOrders(false);
      }
    });

    return () => {
      ordersChannel.unbind_all();
      ordersChannel.unsubscribe();
      notificationsChannel.unbind_all();
      notificationsChannel.unsubscribe();
    };
  }, [loadOrders, toast]);

  // Apply advanced filters
  const applyAdvancedFilters = useCallback((order: Order, filters: AdvancedFilterState): boolean => {
    // Date filters
    if (filters.scheduledDateRange?.start || filters.scheduledDateRange?.end) {
      const scheduledDate = order.scheduledAt ? new Date(order.scheduledAt) : null;
      if (!scheduledDate) return false;
      
      if (filters.scheduledDateRange.start && scheduledDate < filters.scheduledDateRange.start) return false;
      if (filters.scheduledDateRange.end) {
        const endDate = new Date(filters.scheduledDateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (scheduledDate > endDate) return false;
      }
    }

    // Price filters
    if (filters.priceRange?.min !== null && filters.priceRange?.min !== undefined) {
      if (order.totalGBP < filters.priceRange.min) return false;
    }
    if (filters.priceRange?.max !== null && filters.priceRange?.max !== undefined) {
      if (order.totalGBP > filters.priceRange.max) return false;
    }
    if (filters.unpaidOnly && order.paidAt) return false;
    if (filters.partiallyPaid) {
      const amountPaid = order.amountPaidGBP || 0;
      if (amountPaid === 0 || amountPaid >= order.totalGBP) return false;
    }

    // Journey filters
    const orderAny = order as any;
    if (filters.hasReturnJourney && !orderAny.hasReturnJourney) return false;
    if (filters.hasAdditionalJourney && !orderAny.hasAdditionalJourney && !orderAny.hasNewJourney) return false;
    if (filters.totalSegments?.min !== null && filters.totalSegments?.min !== undefined) {
      const totalSegs = orderAny.totalSegments || 1;
      if (totalSegs < filters.totalSegments.min) return false;
    }
    if (filters.totalSegments?.max !== null && filters.totalSegments?.max !== undefined) {
      const totalSegs = orderAny.totalSegments || 1;
      if (totalSegs > filters.totalSegments.max) return false;
    }

    // Driver filters
    if (filters.driverStatus === 'assigned' && !order.driver) return false;
    if (filters.driverStatus === 'unassigned' && order.driver) return false;

    // Status filters
    if (filters.urgency && filters.urgency !== 'all') {
      const priority = calculatePriority(order.scheduledAt);
      if (filters.urgency === 'critical' && priority.level !== 'urgent') return false;
      if (filters.urgency === 'high' && priority.level !== 'high') return false;
      if (filters.urgency === 'medium' && priority.level !== 'medium') return false;
      if (filters.urgency === 'low' && priority.level !== 'low' && priority.level !== 'future') return false;
    }

    return true;
  }, []);

  // Filter orders based on search query and type using useMemo for better performance
  const { filteredOrders, unpaidOrdersCount, newOrdersCountFromFiltered } = useMemo(() => {
    // Removed excessive logging to prevent console spam
    if (!orders.length) return { filteredOrders: [], unpaidOrdersCount: 0, newOrdersCountFromFiltered: 0 };

    let filtered = orders;
    let unpaidCount = 0;

    // Count unpaid orders first
    unpaidCount = orders.filter(order => !order.paidAt).length;

    // Apply additional journeys filter (if enabled)
    // Use localFilterAdditionalJourneys (from quick filters) or prop filterAdditionalJourneys
    if (localFilterAdditionalJourneys || filterAdditionalJourneys) {
      filtered = filtered.filter(order => {
        const orderAny = order as any;
        return orderAny.hasReturnJourney || orderAny.hasNewJourney || (orderAny.totalSegments && orderAny.totalSegments > 1);
      });
    }
    
    // Apply multi-drop filter
    if (multiDropFilter === 'multi-drop') {
      filtered = filtered.filter(order => {
        const orderAny = order as any;
        return orderAny.isMultiDrop === true || orderAny.orderType === 'multi-drop' || orderAny.routeId !== null;
      });
    } else if (multiDropFilter === 'single') {
      filtered = filtered.filter(order => {
        const orderAny = order as any;
        return orderAny.isMultiDrop === false && orderAny.orderType !== 'multi-drop' && orderAny.routeId === null;
      });
    }
    
    // Count new orders (pending and confirmed without driver) from filtered orders
    // This ensures the count matches what's actually visible after filters are applied
    const newOrdersCountFromFiltered = filtered.filter(
      (order: Order) =>
        ['pending', 'CONFIRMED'].includes(order.status) && !order.driver
    ).length;

    // Apply advanced filters
    if (Object.keys(advancedFilters).length > 0) {
      filtered = filtered.filter(order => applyAdvancedFilters(order, advancedFilters));
    }

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

    // Apply payment filter
    if (showUnpaidOrders) {
      // Show ONLY unpaid orders when button is clicked
      console.log('🔍 Filtering for unpaid orders. Before:', filtered.length);
      filtered = filtered.filter(order => !order.paidAt);
      console.log('🔍 After unpaid filter:', filtered.length);
    }
    // Otherwise show ALL orders (no filter applied by default)

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

    // Apply advanced sorting
    filtered.sort((a, b) => {
      // Primary sort
      let comparison = 0;
      const orderAnyA = a as any;
      const orderAnyB = b as any;

      switch (sortConfig.field) {
        case 'scheduledAt':
          comparison = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
          break;
        case 'createdAt':
          const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = createdAtA - createdAtB;
          break;
        case 'totalGBP':
          comparison = (a.totalGBP || 0) - (b.totalGBP || 0);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'customerName':
          comparison = (a.customerName || '').localeCompare(b.customerName || '');
          break;
        case 'reference':
          comparison = (a.reference || '').localeCompare(b.reference || '');
          break;
        case 'priority':
          const priorityA = calculatePriority(a.scheduledAt);
          const priorityB = calculatePriority(b.scheduledAt);
          comparison = priorityA.sortOrder - priorityB.sortOrder;
          break;
        case 'driverName':
          const driverNameA = orderAnyA.driver?.user?.name || '';
          const driverNameB = orderAnyB.driver?.user?.name || '';
          comparison = driverNameA.localeCompare(driverNameB);
          break;
        case 'paymentStatus':
          const paidA = a.paidAt ? 1 : 0;
          const paidB = b.paidAt ? 1 : 0;
          comparison = paidA - paidB;
          break;
        default:
          comparison = 0;
      }

      // Apply direction
      if (sortConfig.direction === 'desc') {
        comparison = -comparison;
      }

      // Secondary sort if primary is equal
      if (comparison === 0 && sortConfig.secondaryField) {
        let secondaryComparison = 0;
        switch (sortConfig.secondaryField) {
          case 'scheduledAt':
            secondaryComparison = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
            break;
          case 'createdAt':
            const secCreatedAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const secCreatedAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            secondaryComparison = secCreatedAtA - secCreatedAtB;
            break;
          case 'totalGBP':
            secondaryComparison = (a.totalGBP || 0) - (b.totalGBP || 0);
            break;
          case 'status':
            secondaryComparison = (a.status || '').localeCompare(b.status || '');
            break;
          case 'customerName':
            secondaryComparison = (a.customerName || '').localeCompare(b.customerName || '');
            break;
          case 'reference':
            secondaryComparison = (a.reference || '').localeCompare(b.reference || '');
            break;
        }
        if (sortConfig.secondaryDirection === 'desc') {
          secondaryComparison = -secondaryComparison;
        }
        comparison = secondaryComparison;
      }

      return comparison;
    });

    return { filteredOrders: filtered, unpaidOrdersCount: unpaidCount, newOrdersCountFromFiltered };
  }, [orders, searchQuery, orderTypeFilter, showUnpaidOrders, filterAdditionalJourneys, localFilterAdditionalJourneys, multiDropFilter, advancedFilters, applyAdvancedFilters, sortConfig]);
  
  // Update newOrdersCount based on filtered orders (accounts for localFilterAdditionalJourneys and other filters)
  useEffect(() => {
    if (typeof newOrdersCountFromFiltered !== 'undefined') {
      setNewOrdersCount(newOrdersCountFromFiltered);
    }
  }, [newOrdersCountFromFiltered]);

  // Export to CSV function
  const handleExportToCSV = useCallback((ordersToExport: Order[] = filteredOrders) => {
    if (ordersToExport.length === 0) {
      toast({
        title: 'No orders to export',
        description: 'Please select orders or apply filters to export',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Define CSV headers
      const headers = [
        'Reference',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Status',
        'Scheduled Date',
        'Pickup Address',
        'Pickup Postcode',
        'Dropoff Address',
        'Dropoff Postcode',
        'Total Price (GBP)',
        'Amount Paid (GBP)',
        'Payment Status',
        'Driver Name',
        'Driver Email',
        'Order Type',
        'Has Return Journey',
        'Has Additional Journey',
        'Total Segments',
        'Created At',
        'Notes',
      ];

      // Convert orders to CSV rows
      const csvRows = [
        headers.join(','),
        ...ordersToExport.map(order => {
          const orderAny = order as any;
          return [
            `"${order.reference || ''}"`,
            `"${order.customerName || ''}"`,
            `"${order.customerEmail || ''}"`,
            `"${order.customerPhone || ''}"`,
            `"${order.status || ''}"`,
            `"${order.scheduledAt ? new Date(order.scheduledAt).toLocaleString('en-GB') : ''}"`,
            `"${order.pickupAddress?.label || ''}"`,
            `"${order.pickupAddress?.postcode || ''}"`,
            `"${order.dropoffAddress?.label || ''}"`,
            `"${order.dropoffAddress?.postcode || ''}"`,
            `"${((order.totalGBP || 0) / 100).toFixed(2)}"`,
            `"${((order.amountPaidGBP || 0) / 100).toFixed(2)}"`,
            `"${order.paidAt ? 'Paid' : 'Unpaid'}"`,
            `"${order.driver?.user?.name || ''}"`,
            `"${order.driver?.user?.email || ''}"`,
            `"${order.orderType || (order.isMultiDrop ? 'multi-drop' : 'single')}"`,
            `"${orderAny.hasReturnJourney ? 'Yes' : 'No'}"`,
            `"${orderAny.hasAdditionalJourney || orderAny.hasNewJourney ? 'Yes' : 'No'}"`,
            `"${orderAny.totalSegments || 1}"`,
            `"${order.createdAt ? new Date(order.createdAt).toLocaleString('en-GB') : ''}"`,
            `"${(order.notes || '').replace(/"/g, '""')}"`,
          ].join(',');
        }),
      ];

      // Create CSV content
      const csvContent = csvRows.join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Exported ${ordersToExport.length} order(s) to CSV`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export orders',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [filteredOrders, toast]);

  const handleBulkAction = async (action: string, data?: any) => {
    if (action === 'export') {
      // Use selected orders if any, otherwise export all filtered orders
      const ordersToExport = selectedOrders.length > 0
        ? filteredOrders.filter(order => selectedOrders.includes(order.id))
        : filteredOrders;
      handleExportToCSV(ordersToExport);
      return;
    }

    if (action === 'create-route') {
      handleCreateRouteFromOrders();
      return;
    }

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
        data: data,
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
        description: error instanceof Error ? error.message : 'Failed to perform bulk action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
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

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistanceMiles = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get postcode coordinates using Mapbox API
  const getPostcodeCoordinates = async (postcode: string): Promise<{ lat: number; lng: number } | null> => {
    if (!postcode) return null;
    
    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!mapboxToken) {
        console.warn('Mapbox token not configured');
        return null;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postcode)}.json?country=gb&types=postcode&limit=1&access_token=${mapboxToken}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
    } catch (error) {
      console.error('Error geocoding postcode:', error);
    }
    return null;
  };

  const handleOpenAssignModal = async (order: Order) => {
    setSelectedOrderForAssign(order);
    setSelectedDriverId('');
    setAssignReason('');
    
    // Load available drivers
    try {
      console.log('🚗 Loading available drivers for assignment...');
      const response = await fetch('/api/admin/drivers/available');
      
      if (!response.ok) {
        throw new Error(`Failed to load drivers: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Drivers API response:', data);
      
      // API returns data in data.data.drivers structure
      if (data.success && data.data && data.data.drivers) {
        const drivers = data.data.drivers;
        setAvailableDrivers(drivers);
        console.log(`📋 Loaded ${drivers.length} available drivers`);
        
        // Calculate distances to pickup and dropoff postcodes
        const pickupPostcode = order.pickupAddress?.postcode;
        const dropoffPostcode = order.dropoffAddress?.postcode;
        
        if (pickupPostcode || dropoffPostcode) {
          console.log('📍 Calculating driver distances...');
          const [pickupCoords, dropoffCoords] = await Promise.all([
            pickupPostcode ? getPostcodeCoordinates(pickupPostcode) : null,
            dropoffPostcode ? getPostcodeCoordinates(dropoffPostcode) : null,
          ]);

          const driversWithDistances = await Promise.all(
            drivers.map(async (driver: any) => {
              const driverLat = driver.DriverAvailability?.location?.lat || driver.DriverAvailability?.lastLat;
              const driverLng = driver.DriverAvailability?.location?.lng || driver.DriverAvailability?.lastLng;

              let distanceToPickup: number | null = null;
              let distanceToDropoff: number | null = null;

              if (driverLat && driverLng) {
                if (pickupCoords) {
                  distanceToPickup = calculateDistanceMiles(
                    driverLat,
                    driverLng,
                    pickupCoords.lat,
                    pickupCoords.lng
                  );
                }
                if (dropoffCoords) {
                  distanceToDropoff = calculateDistanceMiles(
                    driverLat,
                    driverLng,
                    dropoffCoords.lat,
                    dropoffCoords.lng
                  );
                }
              }

              // Driver is "nearby" if within 15 miles of pickup or dropoff
              const isNearby = 
                (distanceToPickup !== null && distanceToPickup <= 15) ||
                (distanceToDropoff !== null && distanceToDropoff <= 15);

              return {
                driver,
                distanceToPickup,
                distanceToDropoff,
                isNearby,
              };
            })
          );

          // Sort: nearby drivers first, then by distance to pickup
          driversWithDistances.sort((a, b) => {
            if (a.isNearby && !b.isNearby) return -1;
            if (!a.isNearby && b.isNearby) return 1;
            const aDist = a.distanceToPickup ?? Infinity;
            const bDist = b.distanceToPickup ?? Infinity;
            return aDist - bDist;
          });

          setDriversWithDistance(driversWithDistances);
          console.log('✅ Calculated distances for all drivers');
        } else {
          // No postcodes, just set drivers without distance info
          setDriversWithDistance(drivers.map((d: any) => ({
            driver: d,
            distanceToPickup: null,
            distanceToDropoff: null,
            isNearby: false,
          })));
        }
        
        if (drivers.length === 0) {
          toast({
            title: 'No Drivers Available',
            description: 'No active drivers found. Please check driver status.',
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
      setAvailableDrivers([]);
      setDriversWithDistance([]);
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

  // Quick filter handlers
  const handleQuickFilterClick = useCallback((presetId: string) => {
    // Reset all filters first
    setSearchQuery('');
    setStatusFilter('');
    setPaymentFilter('');
    setDriverFilter('');
    setAreaFilter('');
    setDateRange('');
    setOrderTypeFilter('all');
    setShowUnpaidOrders(false);
    setLocalFilterAdditionalJourneys(false);
    
    // Apply preset-specific filters
    switch (presetId) {
      case 'today':
        setDateRange('today');
        setActiveQuickFilter('today');
        break;
      case 'this-week':
        setDateRange('week');
        setActiveQuickFilter('this-week');
        break;
      case 'this-month':
        setDateRange('month');
        setActiveQuickFilter('this-month');
        break;
      case 'urgent':
        // Urgent = orders scheduled within 48 hours
        setDateRange('urgent');
        setActiveQuickFilter('urgent');
        break;
      case 'unpaid':
        setShowUnpaidOrders(true);
        setActiveQuickFilter('unpaid');
        break;
      case 'unassigned':
        setStatusFilter('unassigned');
        setActiveQuickFilter('unassigned');
        break;
      case 'confirmed':
        setStatusFilter('CONFIRMED');
        setActiveQuickFilter('confirmed');
        break;
      case 'in-progress':
        setStatusFilter('in_progress');
        setActiveQuickFilter('in-progress');
        break;
      case 'with-return':
        setLocalFilterAdditionalJourneys(true);
        setActiveQuickFilter('with-return');
        break;
      case 'with-additional':
        setLocalFilterAdditionalJourneys(true);
        setActiveQuickFilter('with-additional');
        break;
      case 'multi-drop':
        setMultiDropFilter('multi-drop');
        setActiveQuickFilter('multi-drop');
        break;
      case 'single':
        setMultiDropFilter('single');
        setActiveQuickFilter('single');
        break;
      default:
        setActiveQuickFilter(undefined);
        break;
    }
  }, []);

  const quickFilterPresets = useMemo(() => {
    const todayCount = orders.filter(order => {
      const orderDate = order.scheduledAt ? new Date(order.scheduledAt) : new Date(order.createdAt);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length;

    const unpaidCount = orders.filter(order => !order.paidAt).length;
    const unassignedCount = orders.filter(order => order.status === 'CONFIRMED' && !order.driver).length;
    const confirmedCount = orders.filter(order => order.status === 'CONFIRMED').length;
    const inProgressCount = orders.filter(order => order.status === 'in_progress').length;
    const withReturnCount = orders.filter((order: any) => order.hasReturnJourney).length;
    const withAdditionalCount = orders.filter((order: any) => order.hasAdditionalJourney || order.hasNewJourney).length;
    const multiDropCount = orders.filter((order: any) => order.isMultiDrop === true || order.orderType === 'multi-drop' || order.routeId !== null).length;
    const singleCount = orders.filter((order: any) => order.isMultiDrop === false && order.orderType !== 'multi-drop' && order.routeId === null).length;

    return DEFAULT_QUICK_FILTERS.map(preset => ({
      ...preset,
      onClick: () => handleQuickFilterClick(preset.id),
      badge: 
        preset.id === 'today' ? todayCount :
        preset.id === 'unpaid' ? unpaidCount :
        preset.id === 'unassigned' ? unassignedCount :
        preset.id === 'confirmed' ? confirmedCount :
        preset.id === 'in-progress' ? inProgressCount :
        preset.id === 'with-return' ? withReturnCount :
        preset.id === 'with-additional' ? withAdditionalCount :
        preset.id === 'multi-drop' ? multiDropCount :
        preset.id === 'single' ? singleCount :
        undefined,
      isActive: activeQuickFilter === preset.id,
    }));
  }, [orders, activeQuickFilter, handleQuickFilterClick]);

  const handleCancelOrder = (order: Order) => {
    setOrderToCancel(order);
    setCancelReason('');
    onCancelDialogOpen();
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    setIsCancelling(true);
    
    try {
      const response = await fetch(
        `/api/admin/orders/${orderToCancel.reference}/cancel-enhanced`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: cancelReason.trim() || 'Cancelled by admin',
            notifyCustomer: true
          })
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        toast({
          title: 'Order Cancelled',
          description: `Order #${orderToCancel.reference} has been cancelled. All notifications sent.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        onCancelDialogClose();
        setOrderToCancel(null);
        setCancelReason('');
        loadOrders(true);
      } else {
        throw new Error(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
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

  const handleSendConfirmation = async (order: Order) => {
    try {
      const response = await fetch(
        `/api/admin/orders/${order.reference}/send-confirmation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Confirmation Sent',
          description: `Confirmation email sent to ${order.customerEmail || 'customer'}`,
          status: 'success',
          duration: 4000,
        });
      } else {
        throw new Error(data.error || 'Failed to send confirmation');
      }
    } catch (error) {
      console.error('Error sending confirmation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send confirmation email',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleSendFloorWarning = async (order: Order) => {
    try {
      // Send floor warning for single order
      const response = await fetch(
        `/api/admin/orders/${order.reference}/send-floor-warning`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Floor Warning Sent',
          description: `Floor warning sent to ${order.customerEmail || 'customer'}`,
          status: 'success',
          duration: 4000,
        });
      } else {
        throw new Error(data.error || 'Failed to send floor warning');
      }
    } catch (error) {
      console.error('Error sending floor warning:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send floor warning',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const [drawerInitialTab, setDrawerInitialTab] = useState<'overview' | 'timeline' | 'journeys' | 'payment' | undefined>();
  const [drawerInitialMode, setDrawerInitialMode] = useState<'view' | 'edit'>('view');

  const handleEditOrder = (order: Order) => {
    // Prevent any navigation
    // Set state first, then open drawer
    setDrawerInitialMode('edit');
    setDrawerInitialTab('overview');
    setSelectedOrderCode(order.reference);
    // Use setTimeout to ensure state is set before opening
    setTimeout(() => {
      onDetailOpen();
    }, 0);
  };

  const handleCompleteOrder = async (order: Order) => {
    try {
      const response = await fetch(
        `/api/admin/orders/${order.reference}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Order Completed',
          description: `Order #${order.reference} has been marked as completed.`,
          status: 'success',
          duration: 4000,
        });
        loadOrders(false);
      } else {
        throw new Error(data.error || 'Failed to complete order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete order',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleMarkAsPaid = (order: Order) => {
    setOrderToMarkPaid(order);
    onMarkPaidDialogOpen();
  };

  const confirmMarkAsPaid = async () => {
    if (!orderToMarkPaid) return;
    
    setIsMarkingPaid(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${orderToMarkPaid.reference}/confirm-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Payment Confirmed',
          description: `Order #${orderToMarkPaid.reference} has been marked as paid and confirmed.`,
          status: 'success',
          duration: 4000,
        });
        loadOrders(true);
        onMarkPaidDialogClose();
        setOrderToMarkPaid(null);
      } else {
        throw new Error(data.message || data.error || 'Failed to mark as paid');
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark order as paid',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleViewPaymentDetails = (order: Order) => {
    // Prevent any navigation
    // Set state first, then open drawer
    setDrawerInitialMode('view');
    setDrawerInitialTab('payment');
    setSelectedOrderCode(order.reference);
    // Use setTimeout to ensure state is set before opening
    setTimeout(() => {
      onDetailOpen();
    }, 0);
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
            },
            '& tbody tr:nth-of-type(odd)': {
              backgroundColor: '#0a0a0a !important',
            },
            '& tbody tr': {
              backgroundColor: '#000000 !important',
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
              <Th 
                px={4} 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
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
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Code
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Customer
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Service
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Type
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Journey Info
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Route
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Time Window
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Booked At
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Status
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Driver
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Price
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Data Quality
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Payment
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                SLA
              </Th>
              <Th 
                color="#FFFFFF" 
                bg="linear-gradient(180deg, #1a1a1a 0%, #111111 100%)" 
                borderColor="#333333"
                position="sticky"
                top={0}
                zIndex={5}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                py={4}
                boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
              >
                Actions
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Tr key={`loading-${i}`}>
                  <Td colSpan={15}>
                    <Flex justify="center" py={8}>
                      <Spinner />
                    </Flex>
                  </Td>
                </Tr>
              ))
            ) : filteredOrders.length === 0 ? (
              <Tr>
                <Td colSpan={15} color="#FFFFFF">
                  <Flex justify="center" py={8}>
                    <Text color="#FFFFFF">No orders found</Text>
                  </Flex>
                </Td>
              </Tr>
            ) : groupByConfig.field === 'none' ? (
              filteredOrders.map(order => {
                const slaStatus = getSLAStatus(order);
                const isDeclined = declinedNotifications.includes(order.id);
                const isAccepted = acceptedNotifications.includes(order.id);
                const isInProgress = inProgressNotifications.includes(order.id);
                
                return (
                  <Tr
                    key={order.id}
                    _hover={{ 
                      bg: isDeclined ? 'rgba(239, 68, 68, 0.15)' : 
                          isInProgress ? 'rgba(59, 130, 246, 0.15)' :
                          isAccepted ? 'rgba(16, 185, 129, 0.15)' : 
                          '#1a1a1a',
                      transform: 'translateX(2px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}
                    cursor="pointer"
                    onClick={() => handleViewOrder(order.reference)}
                    bg={
                      isDeclined ? 'rgba(239, 68, 68, 0.05)' : 
                      isInProgress ? 'rgba(59, 130, 246, 0.05)' :
                      isAccepted ? 'rgba(16, 185, 129, 0.05)' : 
                      'transparent'
                    }
                    color="#FFFFFF"
                    borderLeft={
                      isDeclined || isAccepted || isInProgress ? '4px solid' : '2px solid transparent'
                    }
                    borderLeftColor={
                      isDeclined ? '#ef4444' : 
                      isInProgress ? '#3b82f6' :
                      isAccepted ? '#10b981' : 
                      'transparent'
                    }
                    transition="all 0.2s ease"
                    py={2}
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
                    <Td py={3}>
                      <HStack spacing={3}>
                        <Circle
                          size="14px"
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
                          boxShadow={`0 0 8px ${
                            isDeclined ? '#E53E3E40' : 
                            isInProgress ? '#3B82F640' :
                            isAccepted ? '#10B98140' : 
                            `${calculatePriority(order.scheduledAt).color}40`
                          }`}
                        />
                        <Text 
                          fontWeight="bold" 
                          fontSize="sm"
                          color={
                            isDeclined ? 'red.400' : 
                            isInProgress ? 'blue.400' :
                            isAccepted ? 'green.400' :
                            '#FFFFFF'
                          }
                          fontFamily="mono"
                        >
                          #{order.reference || 'N/A'}
                        </Text>
                      </HStack>
                    </Td>
                    <Td py={3}>
                      <VStack align="start" spacing={1.5}>
                        <HStack spacing={2}>
                          <Icon as={FaUser} color="#9ca3af" fontSize="xs" />
                          <Text fontWeight="semibold" color="#FFFFFF" fontSize="sm">
                            {order.customerName || 'Unknown Customer'}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="#9ca3af" noOfLines={1}>
                          {order.customer?.email || order.customerEmail || '-'}
                        </Text>
                      </VStack>
                    </Td>
                    <Td py={3}>
                      <Badge 
                        colorScheme={
                          (order.serviceType?.toUpperCase() === 'ECONOMY' || order.isEconomyService) ? 'green' :
                          (order.serviceType?.toUpperCase() === 'PREMIUM' || order.urgency === 'next-day') ? 'purple' :
                          (order.serviceType?.toUpperCase() === 'ENTERPRISE' || order.urgency === 'same-day') ? 'red' :
                          'blue'
                        }
                        size="sm"
                        variant="solid"
                        fontSize="xs"
                        px={2.5}
                        py={1}
                        borderRadius="md"
                        fontWeight="semibold"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        {(order.serviceType?.toUpperCase() === 'ECONOMY' || order.isEconomyService) ? '🟢 Economy' :
                         (order.serviceType?.toUpperCase() === 'PREMIUM' || order.urgency === 'next-day') ? '🟣 Premium' :
                         (order.serviceType?.toUpperCase() === 'ENTERPRISE' || order.urgency === 'same-day') ? '🔴 Enterprise' :
                         '🔵 Standard'}
                      </Badge>
                    </Td>
                    <Td py={3}>
                      <Badge 
                        colorScheme={order.isMultiDrop || order.orderType === 'multi-drop' ? 'purple' : 'gray'}
                        size="sm"
                        px={2.5}
                        py={1}
                        borderRadius="md"
                        fontSize="xs"
                        fontWeight="medium"
                      >
                        {order.isMultiDrop || order.orderType === 'multi-drop' ? 'Multi-Drop' : 'Single'}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        {/* Main Journey Badge */}
                        <Badge colorScheme="blue" size="sm" fontSize="xs">
                          🎯 Main Journey
                        </Badge>
                        
                        {/* Additional Journeys Indicator - Shows return and additional journeys */}
                        {((order as any).hasReturnJourney || (order as any).hasAdditionalJourney || (order as any).hasNewJourney || ((order as any).totalSegments && (order as any).totalSegments > 1)) && (
                          <Tooltip 
                            label={
                              <VStack align="start" spacing={1} p={1}>
                                <Text fontWeight="bold">Additional Journeys Details:</Text>
                                {(order as any).totalSegments > 1 && (
                                  <Text fontSize="xs" color="#9ca3af">
                                    Total Segments: {(order as any).totalSegments}
                                  </Text>
                                )}
                                {(order as any).hasReturnJourney && (
                                  <Text fontSize="xs" color="#10b981" fontWeight="bold">🔄 Has Return Journey</Text>
                                )}
                                {((order as any).hasAdditionalJourney || (order as any).hasNewJourney) && (
                                  <Text fontSize="xs" color="#06b6d4" fontWeight="bold">➕ Has Additional Journey</Text>
                                )}
                                {(order as any).relatedJourneys && (order as any).relatedJourneys.length > 0 && (
                                  <>
                                    {(order as any).relatedJourneys
                                      .filter((j: any) => j.type?.toLowerCase().includes('return'))
                                      .map((journey: any, idx: number) => (
                                        <Box key={idx} mt={1} p={1} bg="rgba(16, 185, 129, 0.1)" borderRadius="md">
                                          <Text fontSize="xs" fontWeight="bold" color="#10b981">Return Journey #{idx + 1}:</Text>
                                          <Text fontSize="xs">📍 {journey.pickupAddress || 'N/A'} → {journey.dropoffAddress || 'N/A'}</Text>
                                          <Text fontSize="xs">💰 £{journey.price?.toFixed(2) || '0.00'}</Text>
                                          {journey.scheduledDate && (
                                            <Text fontSize="xs">📅 {new Date(journey.scheduledDate).toLocaleDateString()}</Text>
                                          )}
                                        </Box>
                                      ))}
                                    {(order as any).relatedJourneys
                                      .filter((j: any) => 
                                        j.type?.toLowerCase().includes('additional') && 
                                        !j.type?.toLowerCase().includes('return')
                                      )
                                      .map((journey: any, idx: number) => (
                                        <Box key={idx} mt={1} p={1} bg="rgba(6, 182, 212, 0.1)" borderRadius="md">
                                          <Text fontSize="xs" fontWeight="bold" color="#06b6d4">Additional Journey #{idx + 1}:</Text>
                                          <Text fontSize="xs">📍 {journey.pickupAddress || 'N/A'} → {journey.dropoffAddress || 'N/A'}</Text>
                                          <Text fontSize="xs">💰 £{journey.price?.toFixed(2) || '0.00'}</Text>
                                          {journey.scheduledDate && (
                                            <Text fontSize="xs">📅 {new Date(journey.scheduledDate).toLocaleDateString()}</Text>
                                          )}
                                        </Box>
                                      ))}
                                  </>
                                )}
                              </VStack>
                            }
                            placement="right"
                            hasArrow
                          >
                            <HStack spacing={1}>
                              {(order as any).hasReturnJourney && (
                                <Badge 
                                  colorScheme="green" 
                                  size="sm" 
                                  fontSize="xs"
                                  cursor="pointer"
                                >
                                  🔄 Return
                                </Badge>
                              )}
                              {((order as any).hasAdditionalJourney || (order as any).hasNewJourney) && (
                                <Badge 
                                  colorScheme="cyan" 
                                  size="sm" 
                                  fontSize="xs"
                                  cursor="pointer"
                                >
                                  ➕ Additional
                                </Badge>
                              )}
                              {((order as any).totalSegments > 1) && !(order as any).hasReturnJourney && !(order as any).hasAdditionalJourney && !(order as any).hasNewJourney && (
                                <Badge 
                                  colorScheme="purple" 
                                  size="sm" 
                                  fontSize="xs"
                                  cursor="pointer"
                                >
                                  📦 {(order as any).totalSegments} Journeys
                                </Badge>
                              )}
                            </HStack>
                          </Tooltip>
                        )}
                        
                        {/* If this order is actually a return journey */}
                        {(order as any).isReturnJourney && (
                          <Badge colorScheme="orange" size="sm" fontSize="xs">
                            🔁 Is Return Journey
                          </Badge>
                        )}
                      </VStack>
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
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" color="#FFFFFF" fontWeight="medium">
                          {order.createdAt
                            ? format(new Date(order.createdAt), 'MMM dd, yyyy')
                            : '-'}
                        </Text>
                        <Text fontSize="xs" color="#9ca3af">
                          {order.createdAt
                            ? format(new Date(order.createdAt), 'HH:mm')
                            : ''}
                        </Text>
                        <Text fontSize="xs" color="#6b7280">
                          {order.createdAt
                            ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })
                            : ''}
                        </Text>
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
                      <HStack spacing={1}>
                        <Tooltip label="Edit Order">
                          <IconButton
                            icon={<FaEdit />}
                            aria-label="Edit"
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOrder(order);
                            }}
                            color="#2563eb"
                            _hover={{ bg: '#1a1a1a' }}
                          />
                        </Tooltip>
                        <Tooltip label="Send Confirmation">
                          <IconButton
                            icon={<FaEnvelope />}
                            aria-label="Send Confirmation"
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            onClick={() => handleSendConfirmation(order)}
                            isDisabled={order.status === 'CANCELLED'}
                            color="#10b981"
                            _hover={{ bg: '#1a1a1a' }}
                          />
                        </Tooltip>
                        {!order.paidAt ? (
                          <Tooltip label="Mark as Paid">
                            <IconButton
                              icon={<FaCheckCircle />}
                              aria-label="Mark Paid"
                              size="sm"
                              variant="ghost"
                              colorScheme="green"
                              onClick={() => handleMarkAsPaid(order)}
                              isDisabled={order.status === 'CANCELLED'}
                              color="#10b981"
                              _hover={{ bg: '#1a1a1a' }}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip label="View Payment">
                            <IconButton
                              icon={<FaPoundSign />}
                              aria-label="Payment"
                              size="sm"
                              variant="ghost"
                              colorScheme="orange"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleViewPaymentDetails(order);
                              }}
                              color="#f59e0b"
                              _hover={{ bg: '#1a1a1a' }}
                            />
                          </Tooltip>
                        )}
                        <Tooltip label="Floor Warning">
                          <IconButton
                            icon={<FaExclamationTriangle />}
                            aria-label="Floor Warning"
                            size="sm"
                            variant="ghost"
                            colorScheme="yellow"
                            onClick={() => handleSendFloorWarning(order)}
                            isDisabled={order.status === 'CANCELLED'}
                            color="#f59e0b"
                            _hover={{ bg: '#1a1a1a' }}
                          />
                        </Tooltip>
                        <Tooltip label={order.driver ? "Change Driver" : "Assign Driver"}>
                          <IconButton
                            icon={order.driver ? <FaUserFriends /> : <FaUser />}
                            aria-label={order.driver ? "Change Driver" : "Assign Driver"}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => handleOpenAssignModal(order)}
                            isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                            color="#2563eb"
                            _hover={{ bg: '#1a1a1a' }}
                          />
                        </Tooltip>
                        <Tooltip label="Complete Order">
                          <IconButton
                            icon={<FaFlagCheckered />}
                            aria-label="Complete"
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            onClick={() => handleCompleteOrder(order)}
                            isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                            color="#10b981"
                            _hover={{ bg: '#1a1a1a' }}
                          />
                        </Tooltip>
                        <Tooltip label="Cancel Order">
                          <IconButton
                            icon={<FaTimes />}
                            aria-label="Cancel"
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleCancelOrder(order)}
                            isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                            color="#ef4444"
                            _hover={{ bg: '#1a1a1a' }}
                          />
                        </Tooltip>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FaEllipsisV />}
                            variant="ghost"
                            size="sm"
                            color="#FFFFFF"
                            _hover={{ bg: '#1a1a1a' }}
                          />
                          <MenuList bg="#111111" borderColor="#333333" borderWidth={2}>
                            <MenuItem
                              icon={<FaEye />}
                              bg="#111111"
                              color="#FFFFFF"
                              _hover={{ bg: '#1a1a1a' }}
                              onClick={() => handleViewOrder(order.reference)}
                            >
                              View Details
                            </MenuItem>
                            {order.driver && (
                              <MenuItem
                                icon={<FaUserSlash />}
                                bg="#111111"
                                color="#ef4444"
                                _hover={{ bg: '#1a1a1a' }}
                                onClick={() => handleOpenRemoveModal(order)}
                              >
                                Remove Assignment
                              </MenuItem>
                            )}
                          </MenuList>
                        </Menu>
                      </HStack>
                    </Td>
                  </Tr>
                );
              })
            ) : (
              // Render grouped orders
              Array.from(groupedOrders.entries()).map(([groupKey, groupOrders]) => (
                <React.Fragment key={groupKey}>
                  {/* Group Header */}
                  <Tr bg="#1a1a1a" borderTop="2px solid" borderColor="#333333">
                    <Td colSpan={15} py={3} px={4}>
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Text fontWeight="bold" fontSize="md" color="#FFFFFF">
                            {groupKey}
                          </Text>
                          {groupByConfig.showCounts !== false && (
                            <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                              {groupOrders.length} order{groupOrders.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </HStack>
                        <HStack spacing={2}>
                          <Text fontSize="sm" color="#9ca3af">
                            Total: {formatCurrency(groupOrders.reduce((sum, o) => sum + (o.totalGBP || 0), 0))}
                          </Text>
                        </HStack>
                      </HStack>
                    </Td>
                  </Tr>
                  {/* Group Orders */}
                  {groupOrders.map(order => {
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
                        {/* Same table cells as above - will need to duplicate the row content */}
                        <Td px={4}>
                          <Checkbox
                            isChecked={selectedOrders.includes(order.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                setSelectedOrders([...selectedOrders, order.id]);
                              } else {
                                setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Td>
                        <Td>
                          <Text fontWeight="bold" color="#2563eb" fontSize="sm">
                            {order.reference}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="#FFFFFF">{order.customerName || '-'}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme="blue" size="sm">
                            {order.serviceType || 'standard'}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={order.isMultiDrop ? 'purple' : 'gray'} size="sm">
                            {order.isMultiDrop ? 'Multi-Drop' : 'Single'}
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
                          </VStack>
                        </Td>
                        <Td>
                          {order.route ? (
                            <Text fontSize="sm" color="purple.400">
                              {order.route.reference}
                            </Text>
                          ) : (
                            <Text fontSize="sm" color="#9ca3af">-</Text>
                          )}
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="#FFFFFF">
                            {format(new Date(order.scheduledAt), 'MMM dd, HH:mm')}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="#9ca3af">
                            {order.createdAt ? format(new Date(order.createdAt), 'MMM dd') : '-'}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Badge colorScheme={getStatusColor(order.status)} size="sm">
                              {order.status?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                            {isDeclined && (
                              <Badge 
                                colorScheme="red" 
                                variant="solid" 
                                animation={`${pulseAnimation} 2s ease-in-out infinite`}
                                fontSize="xs"
                                fontWeight="bold"
                              >
                                ❌ DECLINED
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
                              <Text fontSize="sm" color="#9ca3af">-</Text>
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
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FaEllipsisV />}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <MenuList bg="#111111" borderColor="#333333" borderWidth={2}>
                              <MenuItem
                                icon={<FaEye />}
                                bg="#111111"
                                color="#FFFFFF"
                                _hover={{ bg: '#1a1a1a' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOrder(order.reference);
                                }}
                              >
                                View Details
                              </MenuItem>
                              <MenuItem
                                icon={<FaEdit />}
                                bg="#111111"
                                color="#FFFFFF"
                                _hover={{ bg: '#1a1a1a' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditOrder(order);
                                }}
                              >
                                Edit Order
                              </MenuItem>
                              <MenuItem
                                icon={<FaEnvelope />}
                                bg="#111111"
                                color="#FFFFFF"
                                _hover={{ bg: '#1a1a1a' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendConfirmation(order);
                                }}
                                isDisabled={order.status === 'CANCELLED'}
                              >
                                Send Confirmation
                              </MenuItem>
                              <MenuItem
                                icon={<FaExclamationTriangle />}
                                bg="#111111"
                                color="#FFFFFF"
                                _hover={{ bg: '#1a1a1a' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendFloorWarning(order);
                                }}
                                isDisabled={order.status === 'CANCELLED'}
                              >
                                Send Floor Warning
                              </MenuItem>
                              <MenuItem
                                icon={order.driver ? <FaUserFriends /> : <FaUser />}
                                bg="#111111"
                                color="#FFFFFF"
                                _hover={{ bg: '#1a1a1a' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAssignModal(order);
                                }}
                                isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                              >
                                {order.driver ? 'Change Driver' : 'Assign Driver'}
                              </MenuItem>
                              <MenuItem
                                icon={<FaFlagCheckered />}
                                bg="#111111"
                                color="#10b981"
                                _hover={{ bg: '#1a1a1a' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteOrder(order);
                                }}
                                isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                              >
                                Complete Order
                              </MenuItem>
                              <MenuItem
                                icon={<FaTimes />}
                                bg="#111111"
                                color="#ef4444"
                                _hover={{ bg: '#1a1a1a' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelOrder(order);
                                }}
                                isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                              >
                                Cancel Order
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    );
                  })}
                </React.Fragment>
              ))
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
              <CardBody bg="#111111" p={4}>
                <VStack align="stretch" spacing={3}>
                  {/* Header: Order ID + Actions Menu + Checkbox */}
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1} flex={1}>
                      <Text 
                        fontWeight="bold" 
                        color="#2563eb" 
                        fontSize="lg"
                        letterSpacing="0.5px"
                      >
                        #{order.reference}
                      </Text>
                      <Text 
                        fontSize="xs" 
                        color="#9ca3af"
                      >
                        {order.customer && order.customer.name
                          ? order.customer.name
                          : order.customerName || 'Unknown Customer'}
                      </Text>
                      {order.createdAt && (
                        <HStack spacing={1} align="center">
                          <Icon as={FaClock} color="#6b7280" boxSize={3} />
                          <Text 
                            fontSize="xs" 
                            color="#6b7280"
                            fontStyle="italic"
                          >
                            Booked: {new Date(order.createdAt).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                    <HStack spacing={2}>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FaEllipsisV />}
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          color="#FFFFFF"
                          _hover={{ bg: '#1a1a1a' }}
                        />
                        <MenuList bg="#111111" borderColor="#333333" borderWidth={2}>
                          <MenuItem
                            icon={<FaEye />}
                            bg="#111111"
                            color="#FFFFFF"
                            _hover={{ bg: '#1a1a1a' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrder(order.reference);
                            }}
                          >
                            View Details
                          </MenuItem>
                          <MenuItem
                            icon={<FaEdit />}
                            bg="#111111"
                            color="#FFFFFF"
                            _hover={{ bg: '#1a1a1a' }}
                            onClick={(e) => {
                              e.stopPropagation();
                                  handleEditOrder(order);
                                }}
                              >
                                Edit Order
                          </MenuItem>
                          <MenuItem
                            icon={<FaEnvelope />}
                            bg="#111111"
                            color="#FFFFFF"
                            _hover={{ bg: '#1a1a1a' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendConfirmation(order);
                            }}
                            isDisabled={order.status === 'CANCELLED'}
                          >
                            Send Confirmation
                          </MenuItem>
                          <MenuItem
                            icon={<FaExclamationTriangle />}
                            bg="#111111"
                            color="#FFFFFF"
                            _hover={{ bg: '#1a1a1a' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendFloorWarning(order);
                            }}
                            isDisabled={order.status === 'CANCELLED'}
                          >
                            Send Floor Warning
                          </MenuItem>
                          <MenuItem
                            icon={order.driver ? <FaUserFriends /> : <FaUser />}
                            bg="#111111"
                            color="#FFFFFF"
                            _hover={{ bg: '#1a1a1a' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAssignModal(order);
                            }}
                            isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                          >
                            {order.driver ? 'Change Driver' : 'Assign Driver'}
                          </MenuItem>
                          <MenuItem
                            icon={<FaFlagCheckered />}
                            bg="#111111"
                            color="#10b981"
                            _hover={{ bg: '#1a1a1a' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteOrder(order);
                            }}
                            isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                          >
                            Complete Order
                          </MenuItem>
                          <MenuItem
                            icon={<FaTimes />}
                            bg="#111111"
                            color="#ef4444"
                            _hover={{ bg: '#1a1a1a' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(order);
                            }}
                            isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                          >
                            Cancel Order
                          </MenuItem>
                        </MenuList>
                      </Menu>
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
                        onClick={(e) => e.stopPropagation()}
                      />
                    </HStack>
                  </HStack>

                  {/* Status - VISUALLY DOMINANT */}
                  <Box>
                    <Badge 
                      colorScheme={getStatusColor(order.status)}
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontWeight="bold"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                      boxShadow="0 2px 8px rgba(0, 0, 0, 0.3)"
                    >
                      {order.status?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                    {!order.paidAt && (
                      <Badge
                        ml={2}
                        colorScheme="red"
                        variant="solid"
                        px={2}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        UNPAID
                      </Badge>
                    )}
                  </Box>

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

                  {/* Payment & Assignment Status */}
                  <HStack justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor="#333333">
                    <VStack align="start" spacing={1}>
                      <HStack spacing={2}>
                        {order.driver && order.driver.user && order.driver.user.name ? (
                          <>
                            <Icon as={FaTruck} color="blue.400" boxSize={3} />
                            <Text fontSize="xs" color="blue.400" fontWeight="medium">
                              {order.driver.user.name}
                            </Text>
                          </>
                        ) : (
                          <Text fontSize="xs" color="gray.500" fontWeight="medium">
                            <Icon as={FaUserSlash} color="gray.500" boxSize={3} mr={1} />
                            No driver
                          </Text>
                        )}
                      </HStack>
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
                              ? 'red.400'
                              : slaStatus.status === 'warning'
                                ? 'orange.400'
                                : 'green.400'
                          }
                          boxSize={3}
                        />
                        <Text fontSize="xs" color="gray.400">
                          {slaStatus.message}
                        </Text>
                      </HStack>
                    </VStack>
                    <VStack align="end" spacing={1}>
                      <Text 
                        fontWeight="bold" 
                        color="#10b981"
                        fontSize="xl"
                        letterSpacing="0.5px"
                      >
                        {formatCurrency(order.totalGBP || 0)}
                      </Text>
                      {!order.paidAt && (
                        <Badge colorScheme="red" fontSize="xs" px={2} py={0.5} borderRadius="full">
                          UNPAID
                        </Badge>
                      )}
                    </VStack>
                  </HStack>

                  {/* Driver Assignment Response Status */}
                  {(() => {
                    // Debug logging for rendering (only log once per render cycle)
                    // Removed excessive logging to prevent console spam
                    
                    // Try to get assignments from multiple sources
                    let assignments = order.assignments || [];
                    
                    // Fallback: if assignments is empty, try to get from raw Assignment
                    if (!assignments || assignments.length === 0) {
                      const rawAssignments = (order as any).Assignment || [];
                      if (rawAssignments.length > 0) {
                        assignments = rawAssignments.map((assignment: any) => ({
                          id: assignment.id,
                          status: assignment.status,
                          driverId: assignment.driverId,
                          claimedAt: assignment.claimedAt,
                          declinedAt: assignment.declinedAt || (assignment.status === 'declined' ? assignment.updatedAt : undefined),
                          driver: assignment.Driver ? {
                            user: assignment.Driver.User ? {
                              name: assignment.Driver.User.name,
                              email: assignment.Driver.User.email,
                            } : undefined,
                          } : undefined,
                        }));
                      }
                    }
                    
                    // Show ALL assignments regardless of status - admin needs to see everything
                    const validAssignments = Array.isArray(assignments) && assignments.length > 0
                      ? assignments
                      : [];
                    
                    // Debug: Log assignment details for SV-000080
                    if (order.reference === 'SV-000080' && validAssignments.length > 0) {
                      console.log('🔍 Assignment Details for SV-000080:', validAssignments.map((a: any) => ({
                        id: a.id,
                        status: a.status,
                        rawStatus: (order as any).Assignment?.find((ass: any) => ass.id === a.id)?.status,
                        driverId: a.driverId,
                        driverName: a.driver?.user?.name || a.Driver?.User?.name,
                        fullAssignment: a,
                      })));
                    }
                    
                    if (validAssignments.length === 0) {
                      return null;
                    }
                    
                    return (
                      <Box 
                        pt={2} 
                        borderTop="1px solid" 
                        borderColor="#333333"
                        w="full"
                      >
                        <VStack align="start" spacing={2} w="full">
                          <Text fontSize="xs" color="#9ca3af" fontWeight="semibold" textTransform="uppercase" letterSpacing="0.5px">
                            Driver Response
                          </Text>
                          {validAssignments.map((assignment: any) => {
                            const rawStatus = assignment.status || (assignment as any).status || '';
                            const status = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';
                            const isAccepted = status === 'accepted';
                            const isDeclined = status === 'declined';
                            const isClaimed = status === 'claimed' || status === 'invited' || status === 'pending';
                            const driverName = assignment.driver?.user?.name 
                              || assignment.Driver?.User?.name 
                              || 'Unknown Driver';
                            
                            // Debug for SV-000080 - expand the assignment object
                            if (order.reference === 'SV-000080') {
                              console.log('🎯 Rendering Assignment:', {
                                assignmentId: assignment.id,
                                rawStatus: rawStatus,
                                status: status,
                                isAccepted,
                                isDeclined,
                                isClaimed,
                                driverName,
                                fullAssignment: JSON.stringify(assignment, null, 2),
                              });
                            }
                            
                            return (
                              <HStack
                                key={assignment.id}
                                w="full"
                                p={2}
                                borderRadius="md"
                                bg={
                                  isAccepted 
                                    ? "rgba(16, 185, 129, 0.15)" 
                                    : isDeclined 
                                      ? "rgba(239, 68, 68, 0.15)" 
                                      : "rgba(251, 191, 36, 0.15)"
                                }
                                border="1px solid"
                                borderColor={
                                  isAccepted 
                                    ? "rgba(16, 185, 129, 0.3)" 
                                    : isDeclined 
                                      ? "rgba(239, 68, 68, 0.3)" 
                                      : "rgba(251, 191, 36, 0.3)"
                                }
                                spacing={2}
                              >
                                {isAccepted && (
                                  <Circle size="20px" bg="rgba(16, 185, 129, 0.2)" border="2px solid #10b981">
                                    <Icon as={FaCheckCircle} color="#10b981" boxSize={3} />
                                  </Circle>
                                )}
                                {isDeclined && (
                                  <Circle size="20px" bg="rgba(239, 68, 68, 0.2)" border="2px solid #ef4444">
                                    <Icon as={FaTimes} color="#ef4444" boxSize={3} />
                                  </Circle>
                                )}
                                {isClaimed && (
                                  <Circle size="20px" bg="rgba(251, 191, 36, 0.2)" border="2px solid #fbbf24">
                                    <Icon as={FaClock} color="#fbbf24" boxSize={3} />
                                  </Circle>
                                )}
                                <VStack align="start" spacing={0} flex={1}>
                                  <HStack spacing={2}>
                                    <Text 
                                      fontSize="xs" 
                                      fontWeight="bold"
                                      color={
                                        isAccepted 
                                          ? "#10b981" 
                                          : isDeclined 
                                            ? "#ef4444" 
                                            : "#fbbf24"
                                      }
                                    >
                                      {driverName}
                                    </Text>
                                    <Badge
                                      fontSize="xs"
                                      px={2}
                                      py={0.5}
                                      borderRadius="full"
                                      bg={
                                        isAccepted 
                                          ? "rgba(16, 185, 129, 0.2)" 
                                          : isDeclined 
                                            ? "rgba(239, 68, 68, 0.2)" 
                                            : "rgba(251, 191, 36, 0.2)"
                                      }
                                      color={
                                        isAccepted 
                                          ? "#10b981" 
                                          : isDeclined 
                                            ? "#ef4444" 
                                            : "#fbbf24"
                                      }
                                      border="1px solid"
                                      borderColor={
                                        isAccepted 
                                          ? "#10b981" 
                                          : isDeclined 
                                            ? "#ef4444" 
                                            : "#fbbf24"
                                      }
                                    >
                                      {isAccepted ? 'ACCEPTED' : isDeclined ? 'DECLINED' : 'PENDING'}
                                    </Badge>
                                  </HStack>
                                  {(assignment.claimedAt || assignment.declinedAt) && (
                                    <Text fontSize="xs" color="#9ca3af">
                                      {assignment.claimedAt 
                                        ? `Claimed: ${new Date(assignment.claimedAt).toLocaleString()}`
                                        : assignment.declinedAt
                                          ? `Declined: ${new Date(assignment.declinedAt).toLocaleString()}`
                                          : ''
                                      }
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>
                            );
                          })}
                        </VStack>
                      </Box>
                    );
                  })()}

                  {/* Action Buttons - Always Visible */}
                  <VStack spacing={2} pt={3} borderTop="1px solid" borderColor="#333333">
                    <HStack spacing={2} w="full">
                      <Button
                        size="sm"
                        leftIcon={<FaEdit />}
                        colorScheme="blue"
                        flex={1}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleEditOrder(order);
                        }}
                        bg="#2563eb"
                        color="#FFFFFF"
                        _hover={{ bg: '#1d4ed8' }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<FaEnvelope />}
                        colorScheme="green"
                        variant="outline"
                        flex={1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendConfirmation(order);
                        }}
                        isDisabled={order.status === 'CANCELLED'}
                        borderColor="#10b981"
                        color="#10b981"
                        _hover={{ bg: '#10b981', color: '#FFFFFF' }}
                        _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                      >
                        Confirm
                      </Button>
                    </HStack>
                    <HStack spacing={2} w="full">
                      {!order.paidAt ? (
                        <Button
                          size="sm"
                          leftIcon={<FaCheckCircle />}
                          colorScheme="green"
                          flex={1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsPaid(order);
                          }}
                          isDisabled={order.status === 'CANCELLED'}
                          bg="#10b981"
                          color="#FFFFFF"
                          _hover={{ bg: '#059669' }}
                          _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                        >
                          Mark Paid
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          leftIcon={<FaPoundSign />}
                          colorScheme="orange"
                          variant="outline"
                          flex={1}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleViewPaymentDetails(order);
                          }}
                          borderColor="#f59e0b"
                          color="#f59e0b"
                          _hover={{ bg: '#f59e0b', color: '#FFFFFF' }}
                        >
                          Payment
                        </Button>
                      )}
                      <Button
                        size="sm"
                        leftIcon={<FaExclamationTriangle />}
                        colorScheme="yellow"
                        variant="outline"
                        flex={1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendFloorWarning(order);
                        }}
                        isDisabled={order.status === 'CANCELLED'}
                        borderColor="#f59e0b"
                        color="#f59e0b"
                        _hover={{ bg: '#f59e0b', color: '#FFFFFF' }}
                        _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                      >
                        Floor Warning
                      </Button>
                    </HStack>
                    <HStack spacing={2} w="full">
                      <Button
                        size="sm"
                        leftIcon={order.driver ? <FaUserFriends /> : <FaUser />}
                        colorScheme="blue"
                        variant="outline"
                        flex={1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignModal(order);
                        }}
                        isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                        borderColor="#2563eb"
                        color="#2563eb"
                        _hover={{ bg: '#2563eb', color: '#FFFFFF' }}
                        _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                      >
                        {order.driver ? 'Change Driver' : 'Assign Driver'}
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<FaFlagCheckered />}
                        colorScheme="green"
                        variant="outline"
                        flex={1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteOrder(order);
                        }}
                        isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                        borderColor="#10b981"
                        color="#10b981"
                        _hover={{ bg: '#10b981', color: '#FFFFFF' }}
                        _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                      >
                        Complete
                      </Button>
                    </HStack>
                    <HStack spacing={2} w="full">
                      <Button
                        size="sm"
                        leftIcon={<FaTimes />}
                        colorScheme="red"
                        variant="outline"
                        flex={1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(order);
                        }}
                        isDisabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                        borderColor="#ef4444"
                        color="#ef4444"
                        _hover={{ bg: '#ef4444', color: '#FFFFFF' }}
                        _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </VStack>
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

  // Load saved presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('orderFilterPresets');
      if (saved) {
        setSavedFilterPresets(JSON.parse(saved));
      }
      const savedSort = localStorage.getItem('orderSortPresets');
      if (savedSort) {
        setSavedSortPresets(JSON.parse(savedSort));
      }
    } catch (error) {
      console.error('Error loading saved presets:', error);
    }
  }, []);

  // Group orders function
  const groupOrders = useCallback((orders: Order[], config: GroupByConfig): Map<string, Order[]> => {
    const groups = new Map<string, Order[]>();

    if (config.field === 'none') {
      groups.set('All Orders', orders);
      return groups;
    }

    orders.forEach((order) => {
      const orderAny = order as any;
      let groupKey = '';

      switch (config.field) {
        case 'status':
          groupKey = order.status || 'Unknown';
          break;
        case 'driver':
          groupKey = orderAny.driver?.user?.name || 'Unassigned';
          break;
        case 'scheduledDate':
          const scheduledDate = new Date(order.scheduledAt);
          groupKey = scheduledDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          break;
        case 'customer':
          groupKey = order.customerName || 'Unknown';
          break;
        case 'serviceType':
          groupKey = order.serviceType || 'standard';
          break;
        case 'paymentStatus':
          groupKey = order.paidAt ? 'Paid' : 'Unpaid';
          break;
        case 'urgency':
          const priority = calculatePriority(order.scheduledAt);
          groupKey = priority.level.charAt(0).toUpperCase() + priority.level.slice(1);
          break;
        case 'route':
          groupKey = orderAny.route?.reference || 'No Route';
          break;
        default:
          groupKey = 'Other';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(order);
    });

    return groups;
  }, []);

  // Get grouped orders
  const groupedOrders = useMemo(() => {
    return groupOrders(filteredOrders, groupByConfig);
  }, [filteredOrders, groupByConfig, groupOrders]);

  const handleSaveFilterPreset = useCallback((name: string, filters: AdvancedFilterState) => {
    const newPresets = [...savedFilterPresets, { name, filters }];
    setSavedFilterPresets(newPresets);
    try {
      localStorage.setItem('orderFilterPresets', JSON.stringify(newPresets));
    } catch (error) {
      console.error('Error saving preset:', error);
    }
  }, [savedFilterPresets]);

  const handleDeleteFilterPreset = useCallback((name: string) => {
    const newPresets = savedFilterPresets.filter(p => p.name !== name);
    setSavedFilterPresets(newPresets);
    try {
      localStorage.setItem('orderFilterPresets', JSON.stringify(newPresets));
    } catch (error) {
      console.error('Error deleting preset:', error);
    }
  }, [savedFilterPresets]);

  const handleSaveSortPreset = useCallback((name: string, sort: SortConfig, groupBy: GroupByConfig) => {
    const newPresets = [...savedSortPresets, { name, sort, groupBy }];
    setSavedSortPresets(newPresets);
    try {
      localStorage.setItem('orderSortPresets', JSON.stringify(newPresets));
    } catch (error) {
      console.error('Error saving sort preset:', error);
    }
  }, [savedSortPresets]);

  const handleDeleteSortPreset = useCallback((name: string) => {
    const newPresets = savedSortPresets.filter(p => p.name !== name);
    setSavedSortPresets(newPresets);
    try {
      localStorage.setItem('orderSortPresets', JSON.stringify(newPresets));
    } catch (error) {
      console.error('Error deleting sort preset:', error);
    }
  }, [savedSortPresets]);

  // Handle export
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf', options: ExportOptions) => {
    const ordersToExport = selectedOrders.length > 0
      ? filteredOrders.filter(order => selectedOrders.includes(order.id))
      : filteredOrders;

    if (ordersToExport.length === 0) {
      toast({
        title: 'No Orders to Export',
        description: 'Please select orders or apply filters',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Transform orders to export format
    const exportData = ordersToExport.map(order => {
      const orderAny = order as any;
      return {
        reference: order.reference,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        status: order.status,
        scheduledAt: order.scheduledAt,
        createdAt: order.createdAt,
        pickupAddress: order.pickupAddress?.label,
        pickupPostcode: order.pickupAddress?.postcode,
        dropoffAddress: order.dropoffAddress?.label,
        dropoffPostcode: order.dropoffAddress?.postcode,
        totalGBP: order.totalGBP || 0,
        amountPaidGBP: order.amountPaidGBP || 0,
        paymentStatus: order.paidAt ? 'Paid' : 'Unpaid',
        driverName: orderAny.driver?.user?.name,
        driverEmail: orderAny.driver?.user?.email,
        items: order.items,
        notes: order.notes,
        segments: orderAny.segments,
      };
    });

    try {
      switch (format) {
        case 'csv':
          exportOrdersToCSV(exportData, options);
          break;
        case 'excel':
          exportOrdersToExcel(exportData, options);
          break;
        case 'pdf':
          exportOrdersToPDF(exportData, options);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }, [filteredOrders, selectedOrders, toast]);

  // Primary Bar: View Controls (Always Visible)
  const primaryBar = useMemo(() => (
    <HStack spacing={3} align="center">
      <ViewToggle view={viewMode} onViewChange={setViewMode} />
      <AdvancedSortingGrouping
        currentSort={sortConfig}
        currentGroupBy={groupByConfig}
        onSortChange={setSortConfig}
        onGroupByChange={setGroupByConfig}
        onSavePreset={handleSaveSortPreset}
        onLoadPreset={(sort, groupBy) => {
          setSortConfig(sort);
          setGroupByConfig(groupBy);
        }}
        onDeletePreset={handleDeleteSortPreset}
        savedPresets={savedSortPresets}
      />
      <ExportReportingMenu
        orders={filteredOrders}
        selectedOrders={[]}
        onExport={handleExport}
        disabled={loading}
      />
      <Button
        leftIcon={<FaFilter />}
        variant="outline"
        onClick={onAdvancedFiltersOpen}
        bg="#111111"
        color="#FFFFFF"
        borderColor="#333333"
        borderWidth="1px"
        borderRadius="md"
        size="sm"
        fontWeight="medium"
        _hover={{
          bg: '#1a1a1a',
          borderColor: '#2563eb',
        }}
      >
        Advanced Filters
        {Object.keys(advancedFilters).length > 0 && (
          <Badge ml={2} colorScheme="blue" borderRadius="full" px={2} fontSize="xs">
            {Object.keys(advancedFilters).length}
          </Badge>
        )}
      </Button>
    </HStack>
  ), [viewMode, setViewMode, sortConfig, groupByConfig, handleSaveSortPreset, handleDeleteSortPreset, savedSortPresets, advancedFilters, onAdvancedFiltersOpen, filteredOrders, handleExport, loading]);

  // Secondary Bar: Contextual Actions (Only when selection > 0)
  const secondaryBar = useMemo(() => {
    if (selectedOrders.length === 0) {
      return null;
    }

    return (
      <HStack spacing={2} align="center" bg="#1a1a1a" p={2} borderRadius="md" borderWidth="1px" borderColor="#333333">
        <Text fontSize="sm" color="gray.400" fontWeight="medium" mr={2}>
          {selectedOrders.length} selected
        </Text>
        <BulkOperationsMenu
          selectedCount={selectedOrders.length}
          onAction={handleBulkAction}
          disabled={loading}
        />
        <ExportReportingMenu
          orders={filteredOrders}
          selectedOrders={selectedOrders}
          onExport={handleExport}
          disabled={loading}
        />
      </HStack>
    );
  }, [selectedOrders.length, handleBulkAction, loading, filteredOrders, handleExport]);

  // Legacy actionBar for backward compatibility
  const actionBar = useMemo(() => (
    <VStack spacing={2} align="stretch">
      {primaryBar}
      {secondaryBar}
    </VStack>
  ), [primaryBar, secondaryBar]);

  useEffect(() => {
    if (onActionsChange) {
      onActionsChange(actionBar);
    }
  }, [actionBar, onActionsChange]);

  return (
    <>
      <Box>
        {/* Quick Filter Presets */}
        {!hideActionBar && (
          <Box mb={4}>
            <QuickFilterPresets
              presets={quickFilterPresets}
              onPresetClick={handleQuickFilterClick}
              activePreset={activeQuickFilter}
            />
          </Box>
        )}
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
              cursor="pointer"
              onClick={() => {
                // Filter to show only orders that need driver assignment
                // These are orders with status 'CONFIRMED' that don't have a driver
                // API supports status='unassigned' which filters CONFIRMED orders without driver
                setStatusFilter('unassigned');
                setDriverFilter(''); // Clear driver filter
                // Scroll to top of orders list
                window.scrollTo({ top: 0, behavior: 'smooth' });
                toast({
                  title: 'Filtered to pending assignments',
                  description: `Showing ${newOrdersCount} order${newOrdersCount > 1 ? 's' : ''} that need driver assignment`,
                  status: 'info',
                  duration: 3000,
                  isClosable: true,
                });
              }}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(245, 158, 11, 0.4), 0 0 30px rgba(245, 158, 11, 0.3)',
              }}
              transition="all 0.2s"
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

          {/* Compact Filters Bar */}
          <Box mb={4}>
            <Card bg="#111111" borderColor="#333333" borderWidth="1px">
              <CardBody p={3}>
                <VStack spacing={3} align="stretch">
                  {/* Compact Horizontal Filter Row */}
                  <Flex gap={2} wrap="wrap" align="center">
                    {/* Search */}
                    <Box flex="1" minW="250px" maxW="400px">
                      <InputGroup size="sm">
                        <InputLeftElement color="gray.400">
                          <FaSearch />
                        </InputLeftElement>
                        <ClientInput
                          placeholder="Search orders..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          bg="#000000"
                          color="#FFFFFF"
                          borderColor="#333333"
                          size="sm"
                          _placeholder={{ color: '#9ca3af' }}
                          _focus={{ borderColor: '#2563eb', bg: '#000000' }}
                        />
                      </InputGroup>
                    </Box>

                    {/* Compact Dropdowns */}
                    <Select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      placeholder="Status"
                      size="sm"
                      minW="120px"
                      bg="#000000"
                      color="#FFFFFF"
                      borderColor="#333333"
                      _hover={{ borderColor: '#2563eb' }}
                      _focus={{ borderColor: '#2563eb', bg: '#000000' }}
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
                      placeholder="Payment"
                      size="sm"
                      minW="120px"
                      bg="#000000"
                      color="#FFFFFF"
                      borderColor="#333333"
                      _hover={{ borderColor: '#2563eb' }}
                      _focus={{ borderColor: '#2563eb', bg: '#000000' }}
                    >
                      <option value="unpaid" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Unpaid</option>
                      <option value="requires_action" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Requires Action</option>
                      <option value="paid" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Paid</option>
                      <option value="refunded" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Refunded</option>
                    </Select>

                    <Select
                      value={orderTypeFilter}
                      onChange={e => setOrderTypeFilter(e.target.value as 'all' | 'new' | 'existing')}
                      placeholder="Type"
                      size="sm"
                      minW="120px"
                      bg="#000000"
                      color="#FFFFFF"
                      borderColor="#333333"
                      _hover={{ borderColor: '#2563eb' }}
                      _focus={{ borderColor: '#2563eb', bg: '#000000' }}
                    >
                      <option value="all" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>All</option>
                      <option value="new" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>New</option>
                      <option value="existing" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Existing</option>
                    </Select>

                    <Select
                      value={dateRange}
                      onChange={e => setDateRange(e.target.value)}
                      placeholder="Date"
                      size="sm"
                      minW="120px"
                      bg="#000000"
                      color="#FFFFFF"
                      borderColor="#333333"
                      _hover={{ borderColor: '#2563eb' }}
                      _focus={{ borderColor: '#2563eb', bg: '#000000' }}
                    >
                      <option value="today" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Today</option>
                      <option value="week" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>This Week</option>
                      <option value="month" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>This Month</option>
                      <option value="custom" style={{ backgroundColor: '#111111', color: '#FFFFFF' }}>Custom</option>
                    </Select>

                    {/* Additional Filters - Collapsed */}
                    <Menu>
                      <MenuButton
                        as={Button}
                        size="sm"
                        variant="outline"
                        bg="#000000"
                        color="#FFFFFF"
                        borderColor="#333333"
                        _hover={{ borderColor: '#2563eb', bg: '#0a0a0a' }}
                        leftIcon={<FaFilter />}
                      >
                        More
                      </MenuButton>
                      <MenuList bg="#111111" borderColor="#333333">
                        <Box p={3}>
                          <VStack spacing={2} align="stretch">
                            <Text fontSize="xs" color="gray.400" mb={1}>Additional Filters</Text>
                            <ClientInput
                              placeholder="Driver name..."
                              value={driverFilter}
                              onChange={e => setDriverFilter(e.target.value)}
                              size="sm"
                              bg="#000000"
                              color="#FFFFFF"
                              borderColor="#333333"
                              _placeholder={{ color: '#9ca3af' }}
                              _focus={{ borderColor: '#2563eb', bg: '#000000' }}
                            />
                            <ClientInput
                              placeholder="Area..."
                              value={areaFilter}
                              onChange={e => setAreaFilter(e.target.value)}
                              size="sm"
                              bg="#000000"
                              color="#FFFFFF"
                              borderColor="#333333"
                              _placeholder={{ color: '#9ca3af' }}
                              _focus={{ borderColor: '#2563eb', bg: '#000000' }}
                            />
                          </VStack>
                        </Box>
                      </MenuList>
                    </Menu>
                  </Flex>

                  {/* Active Filter Chips */}
                  {(() => {
                    const activeFilters: ActiveFilter[] = [];
                    
                    if (searchQuery) {
                      activeFilters.push({
                        id: 'search',
                        label: 'Search',
                        value: searchQuery,
                        onRemove: () => setSearchQuery(''),
                        colorScheme: 'blue',
                      });
                    }
                    if (statusFilter) {
                      activeFilters.push({
                        id: 'status',
                        label: 'Status',
                        value: statusFilter,
                        onRemove: () => setStatusFilter(''),
                        colorScheme: 'purple',
                      });
                    }
                    if (paymentFilter) {
                      activeFilters.push({
                        id: 'payment',
                        label: 'Payment',
                        value: paymentFilter,
                        onRemove: () => setPaymentFilter(''),
                        colorScheme: 'orange',
                      });
                    }
                    if (orderTypeFilter !== 'all') {
                      activeFilters.push({
                        id: 'type',
                        label: 'Type',
                        value: orderTypeFilter,
                        onRemove: () => setOrderTypeFilter('all'),
                        colorScheme: 'cyan',
                      });
                    }
                    if (dateRange) {
                      activeFilters.push({
                        id: 'date',
                        label: 'Date',
                        value: dateRange,
                        onRemove: () => setDateRange(''),
                        colorScheme: 'green',
                      });
                    }
                    if (driverFilter) {
                      activeFilters.push({
                        id: 'driver',
                        label: 'Driver',
                        value: driverFilter,
                        onRemove: () => setDriverFilter(''),
                        colorScheme: 'teal',
                      });
                    }
                    if (areaFilter) {
                      activeFilters.push({
                        id: 'area',
                        label: 'Area',
                        value: areaFilter,
                        onRemove: () => setAreaFilter(''),
                        colorScheme: 'pink',
                      });
                    }
                    if (showUnpaidOrders) {
                      activeFilters.push({
                        id: 'unpaid',
                        label: 'Unpaid Only',
                        value: 'true',
                        onRemove: () => setShowUnpaidOrders(false),
                        colorScheme: 'red',
                      });
                    }

                    return activeFilters.length > 0 ? (
                      <ActiveFilterChips
                        filters={activeFilters}
                        onClearAll={() => {
                          setSearchQuery('');
                          setStatusFilter('');
                          setPaymentFilter('');
                          setOrderTypeFilter('all');
                          setDateRange('');
                          setDriverFilter('');
                          setAreaFilter('');
                          setShowUnpaidOrders(false);
                        }}
                        showSummary={true}
                        totalCount={orders.length}
                        filteredCount={filteredOrders.length}
                      />
                    ) : null;
                  })()}

                  {/* Bulk Selection Alert */}
                  {selectedOrders.length > 0 && (
                    <Alert status="info" bg="#1a1a1a" borderColor="#2563eb" borderRadius="md" size="sm">
                      <AlertIcon color="#2563eb" />
                      <HStack justify="space-between" w="full">
                        <Text color="#FFFFFF" fontSize="sm" fontWeight="semibold">
                          {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
                        </Text>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            onClick={() => handleBulkAction('assign')}
                            bg="#2563eb"
                            color="#FFFFFF"
                            _hover={{ bg: '#1d4ed8' }}
                          >
                            Assign Driver
                          </Button>
                          <Button 
                            size="xs" 
                            onClick={() => setSelectedOrders([])}
                            variant="outline"
                            borderColor="#333333"
                            color="#FFFFFF"
                            _hover={{ bg: '#1a1a1a' }}
                          >
                            Clear
                          </Button>
                        </HStack>
                      </HStack>
                    </Alert>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </Box>

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
        onClose={() => {
          onDetailClose();
          // Reset drawer state when closing
          setDrawerInitialTab(undefined);
          setDrawerInitialMode('view');
        }}
        orderCode={selectedOrderCode}
        variant={embedded ? 'embedded' : 'standalone'}
        showSummaryCards={!embedded}
        initialTab={drawerInitialTab}
        initialMode={drawerInitialMode}
        key={`${selectedOrderCode}-${drawerInitialMode}-${drawerInitialTab}`}
      />

      {/* Assign/Reassign Driver Modal */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedOrderForAssign?.driver ? 'Change Driver' : 'Assign Driver'}
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
                {availableDrivers.length === 0 ? (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                      No drivers available. Please check driver status or try again later.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Menu>
                    <MenuButton
                      as={Button}
                      w="full"
                      textAlign="left"
                      bg="#111111"
                      color="#FFFFFF"
                      borderColor="#333333"
                      borderWidth="1px"
                      _hover={{ borderColor: '#555555', bg: '#1a1a1a' }}
                      _active={{ borderColor: '#2563eb', bg: '#1a1a1a' }}
                      _focus={{ borderColor: '#2563eb', boxShadow: '0 0 0 1px #2563eb' }}
                      rightIcon={<Icon as={FaChevronDown} />}
                    >
                      {selectedDriverId ? (
                        (() => {
                          const selectedDriverData = driversWithDistance.length > 0
                            ? driversWithDistance.find(d => d.driver.id === selectedDriverId)
                            : null;
                          const selectedDriver = selectedDriverData?.driver || availableDrivers.find(d => d.id === selectedDriverId);
                          const isNearby = selectedDriverData?.isNearby || false;
                          
                          return (
                            <HStack spacing={2} w="full" justify="space-between">
                              <HStack spacing={2}>
                                {isNearby && <Icon as={FaCheckCircle} color="#10b981" />}
                                <Text color={isNearby ? "#10b981" : "#FFFFFF"} fontWeight={isNearby ? "bold" : "normal"}>
                                  {selectedDriver?.name || `Driver ${selectedDriverId.slice(-4)}`}
                                </Text>
                              </HStack>
                              {selectedDriverData && selectedDriverData.distanceToPickup !== null && selectedDriverData.distanceToPickup !== undefined && (
                                <Text fontSize="sm" color="#9ca3af">
                                  {selectedDriverData.distanceToPickup.toFixed(1)}mi
                                </Text>
                              )}
                            </HStack>
                          );
                        })()
                      ) : (
                        <Text color="#9ca3af">Choose a driver...</Text>
                      )}
                    </MenuButton>
                    <MenuList
                      bg="#111111"
                      borderColor="#333333"
                      borderWidth="2px"
                      maxH="500px"
                      overflowY="auto"
                      p={2}
                      borderRadius="lg"
                      boxShadow="0 10px 40px rgba(0,0,0,0.5)"
                    >
                      {driversWithDistance.length > 0 ? (
                        driversWithDistance.map(({ driver, distanceToPickup, distanceToDropoff, isNearby }) => {
                          const isSelected = selectedDriverId === driver.id;
                          const statusColor = driver.DriverAvailability?.status === 'online' ? '#10b981' : 
                                            driver.DriverAvailability?.status === 'offline' ? '#ef4444' : '#9ca3af';
                          
                          return (
                            <MenuItem
                              key={driver.id}
                              onClick={() => setSelectedDriverId(driver.id)}
                              bg={isSelected ? (isNearby ? "rgba(16, 185, 129, 0.15)" : "#1a1a1a") : "#111111"}
                              color={isNearby ? "#10b981" : "#FFFFFF"}
                              fontWeight={isNearby ? "bold" : "normal"}
                              _hover={{ 
                                bg: isNearby ? "rgba(16, 185, 129, 0.2)" : "#1a1a1a",
                                transform: "translateX(4px)"
                              }}
                              _focus={{ bg: isNearby ? "rgba(16, 185, 129, 0.2)" : "#1a1a1a" }}
                              borderLeft={isNearby ? "4px solid #10b981" : "4px solid transparent"}
                              borderRadius="md"
                              mb={2}
                              p={3}
                              transition="all 0.2s"
                            >
                              <VStack align="start" spacing={2} w="full">
                                {/* Header: Name + Status */}
                                <HStack spacing={3} w="full" justify="space-between" align="start">
                                  <HStack spacing={2} flex={1}>
                                    {isNearby && (
                                      <Circle size="24px" bg="rgba(16, 185, 129, 0.2)" border="2px solid #10b981">
                                        <Icon as={FaCheckCircle} color="#10b981" boxSize={3} />
                                      </Circle>
                                    )}
                                    <VStack align="start" spacing={0}>
                                      <HStack spacing={2}>
                                        <Icon as={FaUser} color={isNearby ? "#10b981" : "#9ca3af"} boxSize={4} />
                                        <Text 
                                          color={isNearby ? "#10b981" : "#FFFFFF"} 
                                          fontWeight={isNearby ? "bold" : "semibold"}
                                          fontSize="sm"
                                        >
                                          {driver.name || `Driver ${driver.id.slice(-4)}`}
                                        </Text>
                                      </HStack>
                                      {driver.email && (
                                        <Text fontSize="xs" color="#6b7280" ml={6}>
                                          {driver.email}
                                        </Text>
                                      )}
                                    </VStack>
                                  </HStack>
                                  <VStack align="end" spacing={1}>
                                    {driver.isAvailable ? (
                                      <Badge 
                                        colorScheme="green" 
                                        fontSize="xs" 
                                        px={2} 
                                        py={1}
                                        borderRadius="full"
                                        bg="rgba(16, 185, 129, 0.2)"
                                        color="#10b981"
                                        border="1px solid #10b981"
                                      >
                                        Available
                                      </Badge>
                                    ) : (
                                      <Badge 
                                        colorScheme="gray" 
                                        fontSize="xs" 
                                        px={2} 
                                        py={1}
                                        borderRadius="full"
                                      >
                                        {driver.availabilityReason || driver.DriverAvailability?.status || 'Unknown'}
                                      </Badge>
                                    )}
                                    {driver.DriverAvailability?.status && (
                                      <HStack spacing={1}>
                                        <Circle size="8px" bg={statusColor} />
                                        <Text fontSize="xs" color="#9ca3af">
                                          {driver.DriverAvailability.status}
                                        </Text>
                                      </HStack>
                                    )}
                                  </VStack>
                                </HStack>

                                {/* Distance Information */}
                                {(distanceToPickup !== null || distanceToDropoff !== null) && (
                                  <HStack 
                                    spacing={4} 
                                    w="full" 
                                    p={2} 
                                    bg={isNearby ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)"}
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor={isNearby ? "rgba(16, 185, 129, 0.3)" : "rgba(59, 130, 246, 0.3)"}
                                  >
                                    {distanceToPickup !== null && (
                                      <HStack spacing={1.5}>
                                        <Icon as={FaMapMarkerAlt} color={isNearby ? "#10b981" : "#3b82f6"} boxSize={3} />
                                        <VStack align="start" spacing={0}>
                                          <Text fontSize="xs" color="#9ca3af">Pickup</Text>
                                          <Text 
                                            fontSize="sm" 
                                            fontWeight="bold" 
                                            color={isNearby ? "#10b981" : "#3b82f6"}
                                          >
                                            {distanceToPickup.toFixed(1)} mi
                                          </Text>
                                        </VStack>
                                      </HStack>
                                    )}
                                    {distanceToDropoff !== null && (
                                      <HStack spacing={1.5}>
                                        <Icon as={FaRoute} color={isNearby ? "#10b981" : "#3b82f6"} boxSize={3} />
                                        <VStack align="start" spacing={0}>
                                          <Text fontSize="xs" color="#9ca3af">Dropoff</Text>
                                          <Text 
                                            fontSize="sm" 
                                            fontWeight="bold" 
                                            color={isNearby ? "#10b981" : "#3b82f6"}
                                          >
                                            {distanceToDropoff.toFixed(1)} mi
                                          </Text>
                                        </VStack>
                                      </HStack>
                                    )}
                                  </HStack>
                                )}

                                {/* Additional Info */}
                                <HStack spacing={4} w="full" fontSize="xs" color="#9ca3af">
                                  {driver.totalActiveJobs > 0 && (
                                    <HStack spacing={1}>
                                      <Icon as={FaClock} boxSize={3} />
                                      <Text>
                                        {driver.totalActiveJobs} active job{driver.totalActiveJobs > 1 ? 's' : ''}
                                      </Text>
                                    </HStack>
                                  )}
                                  {driver.DriverAvailability?.lastSeenAt && (
                                    <HStack spacing={1}>
                                      <Icon as={FaClock} boxSize={3} />
                                      <Text>
                                        Last seen: {new Date(driver.DriverAvailability.lastSeenAt).toLocaleTimeString()}
                                      </Text>
                                    </HStack>
                                  )}
                                </HStack>
                              </VStack>
                            </MenuItem>
                          );
                        })
                      ) : (
                        availableDrivers.map((driver) => {
                          const isSelected = selectedDriverId === driver.id;
                          const statusColor = driver.DriverAvailability?.status === 'online' ? '#10b981' : 
                                            driver.DriverAvailability?.status === 'offline' ? '#ef4444' : '#9ca3af';
                          
                          return (
                            <MenuItem
                              key={driver.id}
                              onClick={() => setSelectedDriverId(driver.id)}
                              bg={isSelected ? "#1a1a1a" : "#111111"}
                              color="#FFFFFF"
                              _hover={{ bg: "#1a1a1a", transform: "translateX(4px)" }}
                              _focus={{ bg: "#1a1a1a" }}
                              borderRadius="md"
                              mb={2}
                              p={3}
                              transition="all 0.2s"
                            >
                              <VStack align="start" spacing={2} w="full">
                                <HStack spacing={3} w="full" justify="space-between" align="start">
                                  <HStack spacing={2} flex={1}>
                                    <Icon as={FaUser} color="#9ca3af" boxSize={4} />
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="semibold" fontSize="sm">
                                        {driver.name || `Driver ${driver.id.slice(-4)}`}
                                      </Text>
                                      {driver.email && (
                                        <Text fontSize="xs" color="#6b7280">
                                          {driver.email}
                                        </Text>
                                      )}
                                    </VStack>
                                  </HStack>
                                  <VStack align="end" spacing={1}>
                                    {driver.isAvailable ? (
                                      <Badge 
                                        colorScheme="green" 
                                        fontSize="xs" 
                                        px={2} 
                                        py={1}
                                        borderRadius="full"
                                        bg="rgba(16, 185, 129, 0.2)"
                                        color="#10b981"
                                        border="1px solid #10b981"
                                      >
                                        Available
                                      </Badge>
                                    ) : (
                                      <Badge 
                                        colorScheme="gray" 
                                        fontSize="xs" 
                                        px={2} 
                                        py={1}
                                        borderRadius="full"
                                      >
                                        {driver.availabilityReason || driver.DriverAvailability?.status || 'Unknown'}
                                      </Badge>
                                    )}
                                    {driver.DriverAvailability?.status && (
                                      <HStack spacing={1}>
                                        <Circle size="8px" bg={statusColor} />
                                        <Text fontSize="xs" color="#9ca3af">
                                          {driver.DriverAvailability.status}
                                        </Text>
                                      </HStack>
                                    )}
                                  </VStack>
                                </HStack>
                                {driver.totalActiveJobs > 0 && (
                                  <HStack spacing={1} fontSize="xs" color="#9ca3af">
                                    <Icon as={FaClock} boxSize={3} />
                                    <Text>
                                      {driver.totalActiveJobs} active job{driver.totalActiveJobs > 1 ? 's' : ''}
                                    </Text>
                                  </HStack>
                                )}
                              </VStack>
                            </MenuItem>
                          );
                        })
                      )}
                    </MenuList>
                  </Menu>
                )}
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
              {selectedOrderForAssign?.driver ? 'Change Driver' : 'Assign Driver'}
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

      {/* Advanced Filters Modal */}
      <AdvancedFilters
        isOpen={isAdvancedFiltersOpen}
        onClose={onAdvancedFiltersClose}
        onApply={(filters) => {
          setAdvancedFilters(filters);
          setActiveQuickFilter(undefined); // Clear quick filter when advanced filters applied
        }}
        onSave={handleSaveFilterPreset}
        onLoadPreset={(filters) => {
          setAdvancedFilters(filters);
        }}
        onDeletePreset={handleDeleteFilterPreset}
        savedPresets={savedFilterPresets}
        currentFilters={advancedFilters}
      />

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog
        isOpen={isCancelDialogOpen}
        leastDestructiveRef={cancelDialogRef}
        onClose={onCancelDialogClose}
        isCentered
        motionPreset="scale"
      >
        <AlertDialogOverlay bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(4px)" />
        <AlertDialogContent
          bg="#111111"
          borderColor="#ef4444"
          borderWidth="2px"
          borderRadius="xl"
          boxShadow="0 20px 60px rgba(239, 68, 68, 0.3)"
          maxW="500px"
        >
          <AlertDialogHeader
            fontSize="xl"
            fontWeight="bold"
            color="#FFFFFF"
            borderBottom="1px solid"
            borderColor="#333333"
            pb={4}
          >
            <HStack spacing={3}>
              <Icon as={FaExclamationTriangle} color="#ef4444" boxSize={6} />
              <Text>Cancel Order #{orderToCancel?.reference}</Text>
            </HStack>
          </AlertDialogHeader>

          <AlertDialogBody py={6}>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" borderRadius="md" bg="#1a1a1a" borderColor="#f59e0b" borderWidth="1px">
                <AlertIcon color="#f59e0b" />
                <Box flex="1">
                  <Text color="#f59e0b" fontWeight="bold" mb={2}>
                    This action cannot be undone
                  </Text>
                  <AlertDescription color="#FFFFFF" fontSize="sm">
                    Cancelling this order will permanently mark it as cancelled and trigger notifications.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box>
                <Text fontWeight="semibold" color="#FFFFFF" mb={2}>
                  What will happen:
                </Text>
                <VStack align="stretch" spacing={2} pl={4}>
                  <HStack>
                    <Icon as={FaCheckCircle} color="#10b981" boxSize={4} />
                    <Text color="#9ca3af" fontSize="sm">Cancel the order permanently</Text>
                  </HStack>
                  {orderToCancel?.driver && (
                    <HStack>
                      <Icon as={FaTruck} color="#2563eb" boxSize={4} />
                      <Text color="#9ca3af" fontSize="sm">Notify the assigned driver</Text>
                    </HStack>
                  )}
                  <HStack>
                    <Icon as={FaEnvelope} color="#10b981" boxSize={4} />
                    <Text color="#9ca3af" fontSize="sm">Send cancellation email to customer</Text>
                  </HStack>
                  {orderToCancel?.driver && (
                    <HStack>
                      <Icon as={FaUser} color="#2563eb" boxSize={4} />
                      <Text color="#9ca3af" fontSize="sm">Free up driver capacity</Text>
                    </HStack>
                  )}
                </VStack>
              </Box>

              <Divider borderColor="#333333" />

              <Box>
                <Text fontWeight="semibold" color="#FFFFFF" mb={2}>
                  Cancellation Reason:
                </Text>
                <Textarea
                  placeholder="Enter reason for cancellation (e.g., Customer request, Van breakdown, etc.)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  bg="#000000"
                  color="#FFFFFF"
                  borderColor="#333333"
                  _placeholder={{ color: '#6b7280' }}
                  _focus={{ borderColor: '#ef4444', boxShadow: '0 0 0 1px #ef4444' }}
                  rows={3}
                  resize="vertical"
                />
              </Box>
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter borderTop="1px solid" borderColor="#333333" pt={4}>
            <Button
              ref={cancelDialogRef}
              onClick={onCancelDialogClose}
              variant="ghost"
              color="#FFFFFF"
              _hover={{ bg: '#1a1a1a' }}
              isDisabled={isCancelling}
            >
              Keep Order
            </Button>
            <Button
              colorScheme="red"
              onClick={handleConfirmCancel}
              ml={3}
              isLoading={isCancelling}
              loadingText="Cancelling..."
              bg="#ef4444"
              color="#FFFFFF"
              _hover={{ bg: '#dc2626' }}
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
              leftIcon={<FaTimes />}
            >
              Cancel Order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Paid Confirmation Dialog */}
      <AlertDialog
        isOpen={isMarkPaidDialogOpen}
        leastDestructiveRef={markPaidDialogRef}
        onClose={onMarkPaidDialogClose}
        isCentered
        motionPreset="scale"
      >
        <AlertDialogOverlay bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(4px)" />
        <AlertDialogContent
          bg="#111111"
          borderColor="#10b981"
          borderWidth="2px"
          borderRadius="xl"
          boxShadow="0 20px 60px rgba(16, 185, 129, 0.3)"
          maxW="500px"
        >
          <AlertDialogHeader
            fontSize="xl"
            fontWeight="bold"
            color="#FFFFFF"
            borderBottom="1px solid"
            borderColor="#333333"
            pb={4}
          >
            <HStack spacing={3}>
              <Icon as={FaCheckCircle} color="#10b981" boxSize={6} />
              <Text>Mark Order #{orderToMarkPaid?.reference} as Paid</Text>
            </HStack>
          </AlertDialogHeader>

          <AlertDialogBody py={6}>
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md" bg="#1a1a1a" borderColor="#10b981" borderWidth="1px">
                <AlertIcon color="#10b981" />
                <Box flex="1">
                  <Text color="#10b981" fontWeight="bold" mb={2}>
                    Payment Confirmation
                  </Text>
                  <AlertDescription color="#FFFFFF" fontSize="sm">
                    This will mark the order as paid and update its status to confirmed.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box>
                <Text fontWeight="semibold" color="#FFFFFF" mb={2}>
                  This action will:
                </Text>
                <VStack align="stretch" spacing={2} pl={4}>
                  <HStack>
                    <Icon as={FaCheckCircle} color="#10b981" boxSize={4} />
                    <Text color="#9ca3af" fontSize="sm">Set payment status to paid</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="#10b981" boxSize={4} />
                    <Text color="#9ca3af" fontSize="sm">Update order status to CONFIRMED</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="#10b981" boxSize={4} />
                    <Text color="#9ca3af" fontSize="sm">Record payment date and time</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter borderTop="1px solid" borderColor="#333333" pt={4}>
            <Button
              ref={markPaidDialogRef}
              onClick={onMarkPaidDialogClose}
              variant="ghost"
              color="#FFFFFF"
              _hover={{ bg: '#1a1a1a' }}
              isDisabled={isMarkingPaid}
            >
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={confirmMarkAsPaid}
              ml={3}
              isLoading={isMarkingPaid}
              loadingText="Confirming..."
              bg="#10b981"
              color="#FFFFFF"
              _hover={{ bg: '#059669' }}
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
              leftIcon={<FaCheckCircle />}
            >
              Mark as Paid
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
