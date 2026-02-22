'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Select,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Flex,
  SimpleGrid,
  Card,
  CardBody,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Collapse,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaClock,
  FaCheckCircle,
  FaHourglassHalf,
  FaComments,
  FaEllipsisV,
  FaReply,
  FaTrash,
  FaEye,
  FaUser,
  FaCalendarAlt,
  FaTruck,
  FaSync,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaWhatsapp,
  FaCopy,
  FaStar,
  FaExclamationCircle,
  FaInbox,
} from 'react-icons/fa';

// Function to play chat notification sound
const playChatNotificationSound = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Use Web Audio API to create a pleasant notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a pleasant two-tone chime sound for chat notifications
    // First tone (higher)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    // Play second tone after a short delay
    setTimeout(() => {
      try {
        const audioContext2 = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator2 = audioContext2.createOscillator();
        const gainNode2 = audioContext2.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext2.destination);
        
        oscillator2.frequency.setValueAtTime(1000, audioContext2.currentTime);
        oscillator2.frequency.setValueAtTime(1200, audioContext2.currentTime + 0.1);
        
        gainNode2.gain.setValueAtTime(0, audioContext2.currentTime);
        gainNode2.gain.linearRampToValueAtTime(0.3, audioContext2.currentTime + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext2.currentTime + 0.3);
        
        oscillator2.type = 'sine';
        oscillator2.start(audioContext2.currentTime);
        oscillator2.stop(audioContext2.currentTime + 0.3);
      } catch (e) {
        // Ignore errors for second tone
      }
    }, 150);
  } catch (e) {
    console.log('Audio notification not available:', e);
    // Fallback: Try to play a simple beep using HTML5 Audio
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURAJR6Hh8sBrJAUwgM/y2IU1CBxou+3nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors
      });
    } catch (fallbackError) {
      // Ignore all audio errors
    }
  }
};

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// Stats Card Component
const StatCard = ({ icon, label, value, color, trend }: { icon: any; label: string; value: number; color: string; trend?: string }) => (
  <Card
    bg="rgba(255,255,255,0.03)"
    border="1px solid"
    borderColor="rgba(255,255,255,0.08)"
    borderRadius="xl"
    overflow="hidden"
    position="relative"
    _hover={{ 
      borderColor: `${color}.400`,
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 30px ${color === 'yellow' ? 'rgba(236, 201, 75, 0.15)' : color === 'blue' ? 'rgba(66, 153, 225, 0.15)' : color === 'green' ? 'rgba(72, 187, 120, 0.15)' : 'rgba(160, 174, 192, 0.15)'}`
    }}
    transition="all 0.3s ease"
  >
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      h="3px"
      bgGradient={`linear(to-r, ${color}.400, ${color}.600)`}
    />
    <CardBody py={5} px={6}>
      <HStack spacing={4}>
        <Flex
          w="50px"
          h="50px"
          bg={`${color}.500`}
          bgGradient={`linear(135deg, ${color}.400, ${color}.600)`}
          borderRadius="xl"
          align="center"
          justify="center"
          boxShadow={`0 4px 15px ${color === 'yellow' ? 'rgba(236, 201, 75, 0.3)' : color === 'blue' ? 'rgba(66, 153, 225, 0.3)' : color === 'green' ? 'rgba(72, 187, 120, 0.3)' : 'rgba(160, 174, 192, 0.3)'}`}
        >
          <Icon as={icon} boxSize={5} color="white" />
        </Flex>
        <Box>
          <Text fontSize="sm" color="gray.400" fontWeight="medium">{label}</Text>
          <HStack spacing={2} align="baseline">
            <Text fontSize="2xl" fontWeight="bold" color="white">{value}</Text>
            {trend && (
              <Text fontSize="xs" color={trend.startsWith('+') ? 'green.400' : 'red.400'}>
                {trend}
              </Text>
            )}
          </HStack>
        </Box>
      </HStack>
    </CardBody>
  </Card>
);

// Inquiry Card Component for mobile/grid view
const InquiryCard = ({ inquiry, onView, onUpdateStatus, getStatusColor, getStatusIcon }: any) => (
  <Card
    bg="rgba(255,255,255,0.03)"
    border="1px solid"
    borderColor={inquiry.status === 'pending' ? 'yellow.500' : 'rgba(255,255,255,0.08)'}
    borderRadius="xl"
    overflow="hidden"
    _hover={{ borderColor: 'blue.400', transform: 'translateY(-2px)' }}
    transition="all 0.3s ease"
  >
    <CardBody>
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Avatar 
              size="sm" 
              name={inquiry.name} 
              bg="blue.500"
              color="white"
            />
            <Box>
              <Text fontWeight="bold" color="white" fontSize="sm">{inquiry.name}</Text>
              <Text fontSize="xs" color="gray.400">{inquiry.email}</Text>
            </Box>
          </HStack>
          <Badge 
            colorScheme={getStatusColor(inquiry.status)}
            borderRadius="full"
            px={3}
            py={1}
            fontSize="xs"
          >
            <HStack spacing={1}>
              <Icon as={getStatusIcon(inquiry.status)} boxSize={3} />
              <Text>{inquiry.status}</Text>
            </HStack>
          </Badge>
        </HStack>
        
        <Text fontSize="sm" color="gray.300" noOfLines={2}>
          {inquiry.message}
        </Text>
        
        <Divider borderColor="rgba(255,255,255,0.08)" />
        
        <HStack justify="space-between" fontSize="xs" color="gray.400">
          <HStack spacing={1}>
            <Icon as={FaCalendarAlt} />
            <Text>{new Date(inquiry.createdAt).toLocaleDateString()}</Text>
          </HStack>
          {inquiry.service && (
            <HStack spacing={1}>
              <Icon as={FaTruck} />
              <Text>{inquiry.service}</Text>
            </HStack>
          )}
        </HStack>
        
        <HStack spacing={2}>
          <Button 
            size="sm" 
            flex={1}
            variant="outline" 
            colorScheme="blue"
            leftIcon={<FaEye />}
            onClick={() => onView(inquiry)}
          >
            View
          </Button>
          {inquiry.status === 'pending' && (
            <Button 
              size="sm" 
              flex={1}
              colorScheme="blue"
              onClick={() => onUpdateStatus(inquiry.id, 'contacted')}
            >
              Contact
            </Button>
          )}
          {inquiry.status === 'contacted' && (
            <Button 
              size="sm" 
              flex={1}
              colorScheme="green"
              onClick={() => onUpdateStatus(inquiry.id, 'resolved')}
            >
              Resolve
            </Button>
          )}
        </HStack>
      </VStack>
    </CardBody>
  </Card>
);

export default function ContactInquiriesPage() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  // Calculate stats
  const stats = useMemo(() => {
    const pending = inquiries.filter(i => i.status === 'pending').length;
    const contacted = inquiries.filter(i => i.status === 'contacted').length;
    const resolved = inquiries.filter(i => i.status === 'resolved').length;
    return { total: inquiries.length, pending, contacted, resolved };
  }, [inquiries]);

  // Filter inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inquiry => {
      const matchesSearch = searchQuery === '' || 
        inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [inquiries, searchQuery]);

  useEffect(() => {
    fetchInquiries();
    
    // Setup Pusher for real-time notifications
    if (typeof window !== 'undefined' && (window as any).Pusher) {
      const PUSHER_KEY = '407cb06c423e6c032e9c';
      const PUSHER_CLUSTER = 'eu';
      
      const pusher = new (window as any).Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
      });
      
      const notificationsChannel = pusher.subscribe('admin-notifications');
      
      notificationsChannel.bind('live-chat-message', (data: any) => {
        console.log('💬 New live chat message received:', data);
        
        toast({
          title: '💬 New Live Chat Message',
          description: `${data.data.customerName} sent a message`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        
        // Play notification sound
        playChatNotificationSound();
        
        // Refresh inquiries list
        fetchInquiries();
      });
      
      return () => {
        notificationsChannel.unbind_all();
        notificationsChannel.unsubscribe();
        pusher.disconnect();
      };
    }
  }, [statusFilter, toast]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contact-inquiries?status=${statusFilter}`);
      const data = await response.json();
      
      if (response.ok) {
        setInquiries(data.inquiries);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch contact inquiries',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/contact-inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Status updated successfully',
          status: 'success',
          duration: 2000,
        });
        fetchInquiries();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'contacted': return 'blue';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return FaHourglassHalf;
      case 'contacted': return FaComments;
      case 'resolved': return FaCheckCircle;
      default: return FaClock;
    }
  };

  const viewDetails = (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry);
    setReplyMessage('');
    onOpen();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
      status: 'success',
      duration: 2000,
    });
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box minH="100vh" bg="#121A2B" py={6}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          
          {/* Header Section */}
          <Box
            bg="rgba(255,255,255,0.02)"
            borderRadius="2xl"
            border="1px solid rgba(255,255,255,0.06)"
            p={6}
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="4px"
              bgGradient="linear(to-r, blue.400, purple.500, pink.400)"
            />
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack spacing={4}>
                <Flex
                  w="60px"
                  h="60px"
                  bg="blue.500"
                  bgGradient="linear(135deg, blue.400, purple.500)"
                  borderRadius="xl"
                  align="center"
                  justify="center"
                  boxShadow="0 8px 30px rgba(66, 153, 225, 0.3)"
                >
                  <Icon as={FaInbox} boxSize={7} color="white" />
                </Flex>
                <Box>
                  <Heading size="lg" color="white" fontWeight="bold">
                    Contact Inquiries
                  </Heading>
                  <Text color="gray.400" fontSize="sm">
                    Manage and respond to customer inquiries
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={3}>
                <Tooltip label="Refresh">
                  <IconButton
                    aria-label="Refresh"
                    icon={<FaSync />}
                    onClick={fetchInquiries}
                    variant="outline"
                    colorScheme="blue"
                    borderRadius="xl"
                    isLoading={loading}
                  />
                </Tooltip>
                <Button
                  leftIcon={<FaFilter />}
                  variant="outline"
                  colorScheme="purple"
                  borderRadius="xl"
                  onClick={() => setShowFilters(!showFilters)}
                  rightIcon={showFilters ? <FaChevronUp /> : <FaChevronDown />}
                >
                  Filters
                </Button>
              </HStack>
            </Flex>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <StatCard 
              icon={FaInbox} 
              label="Total Inquiries" 
              value={stats.total} 
              color="gray"
            />
            <StatCard 
              icon={FaHourglassHalf} 
              label="Pending" 
              value={stats.pending} 
              color="yellow"
            />
            <StatCard 
              icon={FaComments} 
              label="Contacted" 
              value={stats.contacted} 
              color="blue"
            />
            <StatCard 
              icon={FaCheckCircle} 
              label="Resolved" 
              value={stats.resolved} 
              color="green"
            />
          </SimpleGrid>

          {/* Filters Section */}
          <Collapse in={showFilters} animateOpacity>
            <Box
              bg="rgba(255,255,255,0.02)"
              borderRadius="xl"
              border="1px solid rgba(255,255,255,0.06)"
              p={5}
            >
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={2} fontWeight="medium">
                    Search
                  </Text>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FaSearch} color="gray.500" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by name, email or message..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      bg="rgba(255,255,255,0.03)"
                      border="1px solid rgba(255,255,255,0.1)"
                      borderRadius="xl"
                      color="white"
                      _placeholder={{ color: 'gray.500' }}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                    />
                  </InputGroup>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={2} fontWeight="medium">
                    Status
                  </Text>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.1)"
                    borderRadius="xl"
                    color="white"
                    _focus={{ borderColor: 'blue.400' }}
                  >
                    <option value="all" style={{ background: '#18233A' }}>All Status</option>
                    <option value="pending" style={{ background: '#18233A' }}>Pending</option>
                    <option value="contacted" style={{ background: '#18233A' }}>Contacted</option>
                    <option value="resolved" style={{ background: '#18233A' }}>Resolved</option>
                  </Select>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={2} fontWeight="medium">
                    View
                  </Text>
                  <HStack>
                    <Button
                      size="sm"
                      flex={1}
                      variant={viewMode === 'table' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      borderRadius="xl"
                      onClick={() => setViewMode('table')}
                    >
                      Table
                    </Button>
                    <Button
                      size="sm"
                      flex={1}
                      variant={viewMode === 'grid' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      borderRadius="xl"
                      onClick={() => setViewMode('grid')}
                    >
                      Cards
                    </Button>
                  </HStack>
                </Box>
              </SimpleGrid>
            </Box>
          </Collapse>

          {/* Quick Search (Always visible) */}
          {!showFilters && (
            <InputGroup maxW="400px">
              <InputLeftElement>
                <Icon as={FaSearch} color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Quick search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="rgba(255,255,255,0.03)"
                border="1px solid rgba(255,255,255,0.1)"
                borderRadius="xl"
                color="white"
                _placeholder={{ color: 'gray.500' }}
                _focus={{ borderColor: 'blue.400' }}
              />
            </InputGroup>
          )}

          {/* Content */}
          {loading ? (
            <Flex justify="center" align="center" py={20}>
              <VStack spacing={4}>
                <Spinner size="xl" color="blue.400" thickness="4px" />
                <Text color="gray.400">Loading inquiries...</Text>
              </VStack>
            </Flex>
          ) : filteredInquiries.length === 0 ? (
            <Box 
              textAlign="center" 
              py={20}
              bg="rgba(255,255,255,0.02)"
              borderRadius="xl"
              border="1px solid rgba(255,255,255,0.06)"
            >
              <Icon as={FaInbox} boxSize={16} color="gray.600" mb={4} />
              <Text color="gray.400" fontSize="lg">No inquiries found</Text>
              <Text color="gray.500" fontSize="sm" mt={2}>
                {searchQuery ? 'Try adjusting your search' : 'New inquiries will appear here'}
              </Text>
            </Box>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {filteredInquiries.map((inquiry) => (
                <InquiryCard
                  key={inquiry.id}
                  inquiry={inquiry}
                  onView={viewDetails}
                  onUpdateStatus={updateStatus}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </SimpleGrid>
          ) : (
            /* Table View */
            <Box 
              overflowX="auto" 
              bg="rgba(255,255,255,0.02)" 
              borderRadius="xl" 
              border="1px solid rgba(255,255,255,0.06)"
            >
              <Table variant="simple">
                <Thead>
                  <Tr bg="rgba(255,255,255,0.03)">
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)" py={4}>Customer</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Contact</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Service</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Status</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Time</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)" textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredInquiries.map((inquiry) => (
                    <Tr 
                      key={inquiry.id} 
                      _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                      borderColor="rgba(255,255,255,0.06)"
                      cursor="pointer"
                      onClick={() => viewDetails(inquiry)}
                    >
                      <Td borderColor="rgba(255,255,255,0.06)">
                        <HStack spacing={3}>
                          <Avatar 
                            size="sm" 
                            name={inquiry.name}
                            bg={inquiry.status === 'pending' ? 'yellow.500' : 'blue.500'}
                          />
                          <Box>
                            <Text fontWeight="semibold" color="white" fontSize="sm">
                              {inquiry.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500" noOfLines={1} maxW="200px">
                              {inquiry.message.substring(0, 50)}...
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td borderColor="rgba(255,255,255,0.06)">
                        <VStack align="start" spacing={0}>
                          <HStack spacing={1} color="gray.300" fontSize="sm">
                            <Icon as={FaEnvelope} boxSize={3} />
                            <Text>{inquiry.email}</Text>
                          </HStack>
                          {inquiry.phone && (
                            <HStack spacing={1} color="gray.400" fontSize="xs">
                              <Icon as={FaPhone} boxSize={3} />
                              <Text>{inquiry.phone}</Text>
                            </HStack>
                          )}
                        </VStack>
                      </Td>
                      <Td borderColor="rgba(255,255,255,0.06)">
                        {inquiry.service ? (
                          <Badge colorScheme="purple" borderRadius="full" px={2}>
                            {inquiry.service}
                          </Badge>
                        ) : (
                          <Text color="gray.500" fontSize="sm">-</Text>
                        )}
                      </Td>
                      <Td borderColor="rgba(255,255,255,0.06)">
                        <Badge 
                          colorScheme={getStatusColor(inquiry.status)}
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          <HStack spacing={1}>
                            <Icon as={getStatusIcon(inquiry.status)} boxSize={3} />
                            <Text textTransform="capitalize">{inquiry.status}</Text>
                          </HStack>
                        </Badge>
                      </Td>
                      <Td borderColor="rgba(255,255,255,0.06)">
                        <Text color="gray.400" fontSize="sm">
                          {getTimeAgo(inquiry.createdAt)}
                        </Text>
                      </Td>
                      <Td borderColor="rgba(255,255,255,0.06)" textAlign="right" onClick={(e) => e.stopPropagation()}>
                        <HStack spacing={2} justify="flex-end">
                          {inquiry.status === 'pending' && (
                            <Button
                              size="xs"
                              colorScheme="blue"
                              borderRadius="lg"
                              onClick={() => updateStatus(inquiry.id, 'contacted')}
                            >
                              Contact
                            </Button>
                          )}
                          {inquiry.status === 'contacted' && (
                            <Button
                              size="xs"
                              colorScheme="green"
                              borderRadius="lg"
                              onClick={() => updateStatus(inquiry.id, 'resolved')}
                            >
                              Resolve
                            </Button>
                          )}
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FaEllipsisV />}
                              variant="ghost"
                              size="sm"
                              color="gray.400"
                              _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                            />
                            <MenuList bg="#18233A" borderColor="rgba(255,255,255,0.1)">
                              <MenuItem 
                                icon={<FaEye />} 
                                bg="transparent"
                                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                color="white"
                                onClick={() => viewDetails(inquiry)}
                              >
                                View Details
                              </MenuItem>
                              <MenuItem 
                                icon={<FaReply />}
                                bg="transparent"
                                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                color="white"
                                as="a"
                                href={`mailto:${inquiry.email}`}
                              >
                                Reply via Email
                              </MenuItem>
                              {inquiry.phone && (
                                <MenuItem 
                                  icon={<FaWhatsapp />}
                                  bg="transparent"
                                  _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                  color="green.400"
                                  as="a"
                                  href={`https://wa.me/${inquiry.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                >
                                  WhatsApp
                                </MenuItem>
                              )}
                              <MenuItem 
                                icon={<FaCopy />}
                                bg="transparent"
                                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                color="white"
                                onClick={() => copyToClipboard(inquiry.email, 'Email')}
                              >
                                Copy Email
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {/* Results count */}
          {!loading && filteredInquiries.length > 0 && (
            <Text color="gray.500" fontSize="sm" textAlign="center">
              Showing {filteredInquiries.length} of {inquiries.length} inquiries
            </Text>
          )}
        </VStack>
      </Container>

      {/* Enhanced Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.85)" backdropFilter="blur(8px)" />
        <ModalContent 
          bg="#111" 
          border="1px solid rgba(255,255,255,0.1)"
          borderRadius="2xl"
          overflow="hidden"
        >
          {selectedInquiry && (
            <>
              <Box
                h="4px"
                bgGradient={`linear(to-r, ${getStatusColor(selectedInquiry.status)}.400, ${getStatusColor(selectedInquiry.status)}.600)`}
              />
              <ModalHeader pt={6}>
                <HStack spacing={4}>
                  <Avatar 
                    size="lg" 
                    name={selectedInquiry.name}
                    bg="blue.500"
                  />
                  <Box>
                    <Text color="white" fontSize="xl" fontWeight="bold">
                      {selectedInquiry.name}
                    </Text>
                    <HStack spacing={3} mt={1}>
                      <Badge 
                        colorScheme={getStatusColor(selectedInquiry.status)}
                        borderRadius="full"
                        px={3}
                      >
                        <HStack spacing={1}>
                          <Icon as={getStatusIcon(selectedInquiry.status)} boxSize={3} />
                          <Text>{selectedInquiry.status}</Text>
                        </HStack>
                      </Badge>
                      <Text color="gray.500" fontSize="sm">
                        {getTimeAgo(selectedInquiry.createdAt)}
                      </Text>
                    </HStack>
                  </Box>
                </HStack>
              </ModalHeader>
              <ModalCloseButton color="white" />
              
              <ModalBody pb={6}>
                <VStack spacing={5} align="stretch">
                  {/* Contact Info */}
                  <SimpleGrid columns={2} spacing={4}>
                    <Box
                      bg="rgba(255,255,255,0.03)"
                      p={4}
                      borderRadius="xl"
                      border="1px solid rgba(255,255,255,0.06)"
                    >
                      <HStack spacing={3}>
                        <Flex
                          w="40px"
                          h="40px"
                          bg="blue.500"
                          borderRadius="lg"
                          align="center"
                          justify="center"
                        >
                          <Icon as={FaEnvelope} color="white" />
                        </Flex>
                        <Box flex={1}>
                          <Text color="gray.400" fontSize="xs">Email</Text>
                          <Text color="white" fontSize="sm" fontWeight="medium">
                            {selectedInquiry.email}
                          </Text>
                        </Box>
                        <IconButton
                          aria-label="Copy"
                          icon={<FaCopy />}
                          size="sm"
                          variant="ghost"
                          color="gray.400"
                          onClick={() => copyToClipboard(selectedInquiry.email, 'Email')}
                        />
                      </HStack>
                    </Box>
                    
                    <Box
                      bg="rgba(255,255,255,0.03)"
                      p={4}
                      borderRadius="xl"
                      border="1px solid rgba(255,255,255,0.06)"
                    >
                      <HStack spacing={3}>
                        <Flex
                          w="40px"
                          h="40px"
                          bg={selectedInquiry.phone ? 'green.500' : 'gray.600'}
                          borderRadius="lg"
                          align="center"
                          justify="center"
                        >
                          <Icon as={FaPhone} color="white" />
                        </Flex>
                        <Box flex={1}>
                          <Text color="gray.400" fontSize="xs">Phone</Text>
                          <Text color="white" fontSize="sm" fontWeight="medium">
                            {selectedInquiry.phone || 'Not provided'}
                          </Text>
                        </Box>
                        {selectedInquiry.phone && (
                          <IconButton
                            aria-label="Copy"
                            icon={<FaCopy />}
                            size="sm"
                            variant="ghost"
                            color="gray.400"
                            onClick={() => copyToClipboard(selectedInquiry.phone || '', 'Phone')}
                          />
                        )}
                      </HStack>
                    </Box>
                  </SimpleGrid>

                  {/* Service */}
                  {selectedInquiry.service && (
                    <Box
                      bg="rgba(128,90,213,0.1)"
                      p={4}
                      borderRadius="xl"
                      border="1px solid rgba(128,90,213,0.3)"
                    >
                      <HStack spacing={3}>
                        <Icon as={FaTruck} color="purple.400" boxSize={5} />
                        <Box>
                          <Text color="gray.400" fontSize="xs">Service Requested</Text>
                          <Text color="white" fontWeight="medium">{selectedInquiry.service}</Text>
                        </Box>
                      </HStack>
                    </Box>
                  )}

                  {/* Message */}
                  <Box>
                    <Text color="gray.400" fontSize="sm" mb={2} fontWeight="medium">
                      Message
                    </Text>
                    <Box
                      bg="rgba(255,255,255,0.03)"
                      p={5}
                      borderRadius="xl"
                      border="1px solid rgba(255,255,255,0.06)"
                    >
                      <Text color="white" whiteSpace="pre-wrap" lineHeight="1.7">
                        {selectedInquiry.message}
                      </Text>
                    </Box>
                  </Box>

                  {/* Timeline */}
                  <Box
                    bg="rgba(255,255,255,0.02)"
                    p={4}
                    borderRadius="xl"
                    border="1px solid rgba(255,255,255,0.06)"
                  >
                    <HStack justify="space-between" fontSize="sm">
                      <HStack spacing={2} color="gray.400">
                        <Icon as={FaCalendarAlt} />
                        <Text>Received: {new Date(selectedInquiry.createdAt).toLocaleString()}</Text>
                      </HStack>
                      <HStack spacing={2} color="gray.400">
                        <Icon as={FaClock} />
                        <Text>Updated: {new Date(selectedInquiry.updatedAt).toLocaleString()}</Text>
                      </HStack>
                    </HStack>
                  </Box>
                </VStack>
              </ModalBody>

              <ModalFooter borderTop="1px solid rgba(255,255,255,0.06)" pt={4}>
                <HStack spacing={3} w="full">
                  {selectedInquiry.status === 'pending' && (
                    <Button
                      colorScheme="blue"
                      borderRadius="xl"
                      leftIcon={<FaComments />}
                      onClick={() => {
                        updateStatus(selectedInquiry.id, 'contacted');
                        onClose();
                      }}
                    >
                      Mark Contacted
                    </Button>
                  )}
                  {selectedInquiry.status === 'contacted' && (
                    <Button
                      colorScheme="green"
                      borderRadius="xl"
                      leftIcon={<FaCheckCircle />}
                      onClick={() => {
                        updateStatus(selectedInquiry.id, 'resolved');
                        onClose();
                      }}
                    >
                      Mark Resolved
                    </Button>
                  )}
                  <Button
                    as="a"
                    href={`mailto:${selectedInquiry.email}`}
                    variant="outline"
                    colorScheme="blue"
                    borderRadius="xl"
                    leftIcon={<FaReply />}
                  >
                    Reply via Email
                  </Button>
                  {selectedInquiry.phone && (
                    <Button
                      as="a"
                      href={`https://wa.me/${selectedInquiry.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      variant="outline"
                      colorScheme="green"
                      borderRadius="xl"
                      leftIcon={<FaWhatsapp />}
                    >
                      WhatsApp
                    </Button>
                  )}
                </HStack>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
}
