'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Badge,
  Spinner,
  Button,
  Text,
  VStack,
  HStack,
  useToast,
  Card,
  CardBody,
  Icon,
  IconButton,
  SimpleGrid,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
} from '@chakra-ui/react';
import { AdminShell } from '@/components/admin';
import {
  FiPhone,
  FiCopy,
  FiCheck,
  FiClock,
  FiUser,
  FiMail,
  FiCalendar,
  FiMoreVertical,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiPhoneCall,
} from 'react-icons/fi';

interface CallbackRecord {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  message: string;
  status: string;
  source: string;
  createdAt: string;
  metadata?: {
    preferredTime?: string;
    page?: string;
  };
}

export default function CallbacksPage() {
  const [data, setData] = useState<CallbackRecord[]>([]);
  const [filteredData, setFilteredData] = useState<CallbackRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/callbacks');
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to load callbacks');
      }
      setData(json.data || []);
      setFilteredData(json.data || []);
    } catch (error) {
      toast({
        title: 'Error loading callbacks',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filter data based on search and status
  useEffect(() => {
    let filtered = data;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.phone?.toLowerCase().includes(term) ||
          item.email?.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    
    setFilteredData(filtered);
  }, [data, searchTerm, statusFilter]);

  const copyPhone = async (phone: string, id: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(id);
      toast({
        title: 'Phone number copied!',
        description: phone,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'called':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'cancelled':
      case 'no_answer':
        return 'red';
      default:
        return 'purple';
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/callbacks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setData((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
        toast({
          title: 'Status updated',
          status: 'success',
          duration: 2000,
        });
      }
    } catch {
      toast({
        title: 'Failed to update status',
        status: 'error',
        duration: 2000,
      });
    }
  };

  return (
    <AdminShell title="Callbacks">
      <VStack align="stretch" spacing={6}>
        {/* Premium Header */}
        <Box
          p={6}
          borderRadius="2xl"
          bg="linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)"
          border="1px solid rgba(139, 92, 246, 0.3)"
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="-50%"
            right="-10%"
            w="300px"
            h="300px"
            bg="radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)"
            borderRadius="full"
          />
          <HStack justify="space-between" position="relative">
            <VStack align="start" spacing={1}>
              <HStack spacing={3}>
                <Box
                  p={3}
                  borderRadius="xl"
                  bg="linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)"
                >
                  <Icon as={FiPhoneCall} color="white" boxSize={6} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" color="white">
                    Callback Requests
                  </Heading>
                  <Text color="gray.400" fontSize="sm">
                    Manage customer callback requests
                  </Text>
                </VStack>
              </HStack>
            </VStack>
            <HStack spacing={3}>
              <Badge
                px={4}
                py={2}
                borderRadius="full"
                bg="rgba(139, 92, 246, 0.2)"
                color="purple.300"
                fontSize="md"
                fontWeight="bold"
              >
                {data.length} Total
              </Badge>
              <Badge
                px={4}
                py={2}
                borderRadius="full"
                bg="rgba(234, 179, 8, 0.2)"
                color="yellow.300"
                fontSize="md"
                fontWeight="bold"
              >
                {data.filter((d) => d.status === 'pending').length} Pending
              </Badge>
              <IconButton
                aria-label="Refresh"
                icon={<FiRefreshCw />}
                onClick={load}
                isLoading={loading}
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </HStack>
          </HStack>
        </Box>

        {/* Search & Filter Bar */}
        <HStack spacing={4}>
          <InputGroup maxW="400px">
            <InputLeftElement>
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="rgba(255,255,255,0.05)"
              border="1px solid rgba(255,255,255,0.1)"
              color="white"
              _placeholder={{ color: 'gray.500' }}
              _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
            />
          </InputGroup>
          <HStack spacing={2}>
            <Icon as={FiFilter} color="gray.400" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              maxW="180px"
              bg="rgba(255,255,255,0.05)"
              border="1px solid rgba(255,255,255,0.1)"
              color="white"
            >
              <option value="all" style={{ background: '#1a1a2e' }}>All Status</option>
              <option value="pending" style={{ background: '#1a1a2e' }}>Pending</option>
              <option value="called" style={{ background: '#1a1a2e' }}>Called</option>
              <option value="completed" style={{ background: '#1a1a2e' }}>Completed</option>
              <option value="no_answer" style={{ background: '#1a1a2e' }}>No Answer</option>
            </Select>
          </HStack>
        </HStack>

        {/* Callbacks Grid */}
        {loading ? (
          <Flex justify="center" py={12}>
            <VStack spacing={4}>
              <Spinner size="xl" color="purple.400" thickness="4px" />
              <Text color="gray.400">Loading callbacks...</Text>
            </VStack>
          </Flex>
        ) : filteredData.length === 0 ? (
          <Card
            bg="rgba(255,255,255,0.02)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="xl"
          >
            <CardBody py={12}>
              <VStack spacing={4}>
                <Box
                  p={4}
                  borderRadius="full"
                  bg="rgba(139, 92, 246, 0.1)"
                >
                  <Icon as={FiPhone} boxSize={8} color="purple.400" />
                </Box>
                <Text color="gray.400" fontSize="lg">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No callbacks match your filters'
                    : 'No callback requests yet'}
                </Text>
                {(searchTerm || statusFilter !== 'all') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="purple"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={4}>
            {filteredData.map((item) => (
              <Card
                key={item.id}
                bg="rgba(255,255,255,0.03)"
                border="1px solid rgba(255,255,255,0.08)"
                borderRadius="xl"
                _hover={{
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 30px rgba(139, 92, 246, 0.15)',
                }}
                transition="all 0.2s ease"
                overflow="hidden"
              >
                {/* Card Header with Customer Name */}
                <Box
                  px={5}
                  py={4}
                  bg="linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)"
                  borderBottom="1px solid rgba(255,255,255,0.06)"
                >
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Box
                        p={2.5}
                        borderRadius="lg"
                        bg="linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)"
                      >
                        <Icon as={FiUser} color="white" boxSize={4} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text
                          color="white"
                          fontWeight="bold"
                          fontSize="lg"
                          letterSpacing="tight"
                        >
                          {item.name}
                        </Text>
                        {item.email && (
                          <HStack spacing={1}>
                            <Icon as={FiMail} color="gray.500" boxSize={3} />
                            <Text fontSize="xs" color="gray.500">
                              {item.email}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </HStack>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                        color="gray.400"
                        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                      />
                      <MenuList bg="gray.800" borderColor="gray.700">
                        <MenuItem
                          icon={<FiCheckCircle />}
                          onClick={() => updateStatus(item.id, 'called')}
                          bg="transparent"
                          _hover={{ bg: 'gray.700' }}
                        >
                          Mark as Called
                        </MenuItem>
                        <MenuItem
                          icon={<FiCheck />}
                          onClick={() => updateStatus(item.id, 'completed')}
                          bg="transparent"
                          _hover={{ bg: 'gray.700' }}
                        >
                          Mark as Completed
                        </MenuItem>
                        <MenuItem
                          icon={<FiXCircle />}
                          onClick={() => updateStatus(item.id, 'no_answer')}
                          bg="transparent"
                          _hover={{ bg: 'gray.700' }}
                        >
                          No Answer
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </Box>

                <CardBody px={5} py={4}>
                  <VStack align="stretch" spacing={4}>
                    {/* Phone Number - Highlighted */}
                    <Box
                      p={4}
                      borderRadius="xl"
                      bg="rgba(16, 185, 129, 0.1)"
                      border="1px solid rgba(16, 185, 129, 0.2)"
                    >
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Box
                            p={2}
                            borderRadius="lg"
                            bg="rgba(16, 185, 129, 0.2)"
                          >
                            <Icon as={FiPhone} color="green.400" boxSize={4} />
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">
                              Phone Number
                            </Text>
                            <Text
                              color="green.300"
                              fontWeight="bold"
                              fontSize="xl"
                              fontFamily="mono"
                              letterSpacing="wider"
                            >
                              {item.phone || 'Not provided'}
                            </Text>
                          </VStack>
                        </HStack>
                        {item.phone && (
                          <HStack spacing={2}>
                            <Tooltip label="Call now" placement="top">
                              <IconButton
                                aria-label="Call"
                                icon={<FiExternalLink />}
                                as="a"
                                href={`tel:${item.phone}`}
                                size="sm"
                                colorScheme="green"
                                variant="ghost"
                              />
                            </Tooltip>
                            <Tooltip label={copiedId === item.id ? 'Copied!' : 'Copy number'} placement="top">
                              <IconButton
                                aria-label="Copy phone"
                                icon={copiedId === item.id ? <FiCheck /> : <FiCopy />}
                                onClick={() => copyPhone(item.phone!, item.id)}
                                size="sm"
                                colorScheme={copiedId === item.id ? 'green' : 'blue'}
                                variant={copiedId === item.id ? 'solid' : 'ghost'}
                              />
                            </Tooltip>
                          </HStack>
                        )}
                      </HStack>
                    </Box>

                    {/* Time Info */}
                    <HStack spacing={4}>
                      <Box flex={1} p={3} borderRadius="lg" bg="rgba(255,255,255,0.03)">
                        <HStack spacing={2}>
                          <Icon as={FiClock} color="purple.400" boxSize={4} />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" color="gray.500">
                              Preferred Time
                            </Text>
                            <Text color="white" fontWeight="medium" fontSize="sm">
                              {item.metadata?.preferredTime || 'Anytime'}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                      <Box flex={1} p={3} borderRadius="lg" bg="rgba(255,255,255,0.03)">
                        <HStack spacing={2}>
                          <Icon as={FiCalendar} color="blue.400" boxSize={4} />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" color="gray.500">
                              Requested
                            </Text>
                            <Text color="white" fontWeight="medium" fontSize="sm">
                              {formatDate(item.createdAt)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              at {formatTime(item.createdAt)}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    </HStack>

                    {/* Status & Page */}
                    <HStack justify="space-between" pt={2}>
                      <Badge
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        colorScheme={getStatusColor(item.status)}
                        variant="subtle"
                        fontSize="xs"
                        fontWeight="bold"
                        textTransform="uppercase"
                      >
                        {item.status || 'pending'}
                      </Badge>
                      {item.metadata?.page && (
                        <Text fontSize="xs" color="gray.500">
                          From: {item.metadata.page}
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </AdminShell>
  );
}
