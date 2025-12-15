'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Input,
  Select,
  Switch,
  FormControl,
  FormLabel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  useToast,
  IconButton,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Stack,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Flex,
  Wrap,
  WrapItem,
  Center,
  Spinner,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiCopy,
  FiEye,
  FiPercent,
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiTrendingUp,
} from 'react-icons/fi';

interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minSpend: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  status: 'active' | 'inactive' | 'expired';
  firstTimeOnly: boolean;
  applicableAreas: string[];
  createdAt: string;
  updatedAt: string;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    minSpend: 0,
    maxDiscount: 0,
    usageLimit: 100,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active' as 'active' | 'inactive' | 'expired',
    firstTimeOnly: false,
    applicableAreas: [] as string[],
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await fetch('/api/admin/content/promos');
      if (response.ok) {
        const data = await response.json();
        setPromotions(data);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast({
        title: 'Error loading promotions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedPromo(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 10,
      minSpend: 0,
      maxDiscount: 0,
      usageLimit: 100,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      firstTimeOnly: false,
      applicableAreas: [],
    });
    onOpen();
  };

  const handleEdit = (promo: Promotion) => {
    setSelectedPromo(promo);
    setFormData({
      code: promo.code,
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      value: promo.value,
      minSpend: promo.minSpend,
      maxDiscount: promo.maxDiscount,
      usageLimit: promo.usageLimit,
      validFrom: new Date(promo.validFrom).toISOString().split('T')[0],
      validTo: new Date(promo.validTo).toISOString().split('T')[0],
      status: promo.status,
      firstTimeOnly: promo.firstTimeOnly,
      applicableAreas: promo.applicableAreas,
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.validFrom || !formData.validTo) {
      toast({
        title: 'Please fill all required fields',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/content/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Promotion saved successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        fetchPromotions();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save promotion',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast({
        title: 'Error',
        description: 'Failed to save promotion',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code copied!',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'yellow';
      case 'expired': return 'red';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getUsagePercentage = (promo: Promotion) => {
    return Math.round((promo.usedCount / promo.usageLimit) * 100);
  };

  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch = promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          promo.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || promo.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: promotions.length,
    active: promotions.filter(p => p.status === 'active').length,
    totalUsage: promotions.reduce((sum, p) => sum + p.usedCount, 0),
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor} p={8}>
        <Center h="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color="gray.500">Loading promotions...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} p={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="xl" mb={2}>Promotional Codes</Heading>
            <Text fontSize="lg" color="gray.600">Create and manage discount codes for your customers</Text>
          </Box>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            size="lg"
            shadow="sm"
            onClick={handleCreateNew}
          >
            Create Promotion
          </Button>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card bg={cardBg} shadow="sm">
            <CardBody>
              <Stat>
                <StatLabel color="gray.600">Total Promotions</StatLabel>
                <StatNumber fontSize="3xl">{stats.total}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiTrendingUp />
                    <Text>{stats.active} active</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="sm">
            <CardBody>
              <Stat>
                <StatLabel color="gray.600">Active Codes</StatLabel>
                <StatNumber fontSize="3xl" color="green.500">{stats.active}</StatNumber>
                <StatHelpText>Currently available</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="sm">
            <CardBody>
              <Stat>
                <StatLabel color="gray.600">Total Usage</StatLabel>
                <StatNumber fontSize="3xl">{stats.totalUsage}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiUsers />
                    <Text>Redemptions</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Search and Filters */}
        <Card bg={cardBg} shadow="sm">
          <CardBody>
            <HStack spacing={4}>
              <InputGroup maxW="400px">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Search promotions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              
              <Select
                maxW="200px"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </Select>
            </HStack>
          </CardBody>
        </Card>

        {/* Promotions Grid */}
        {filteredPromotions.length === 0 ? (
          <Card bg={cardBg} shadow="sm">
            <CardBody>
              <Center py={12}>
                <VStack spacing={4}>
                  <Box fontSize="4xl">🎁</Box>
                  <Text fontSize="lg" color="gray.500">No promotions found</Text>
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    onClick={handleCreateNew}
                  >
                    Create Your First Promotion
                  </Button>
                </VStack>
              </Center>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {filteredPromotions.map((promo) => (
              <Card
                key={promo.id}
                bg={cardBg}
                shadow="sm"
                borderWidth="1px"
                borderColor={borderColor}
                _hover={{ shadow: 'md', borderColor: 'blue.300' }}
                transition="all 0.2s"
              >
                <CardHeader pb={3}>
                  <Flex justify="space-between" align="start">
                    <Box flex={1}>
                      <HStack mb={2}>
                        <Badge colorScheme={getStatusColor(promo.status)} fontSize="sm" px={2} py={1}>
                          {promo.status}
                        </Badge>
                        {promo.firstTimeOnly && (
                          <Badge colorScheme="purple" fontSize="sm">First Time Only</Badge>
                        )}
                      </HStack>
                      <Heading size="md" mb={1}>{promo.name}</Heading>
                      <HStack spacing={2}>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.500" fontFamily="mono">
                          {promo.code}
                        </Text>
                        <IconButton
                          aria-label="Copy code"
                          icon={<FiCopy />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyCode(promo.code)}
                        />
                      </HStack>
                    </Box>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList bg="gray.800" borderColor="gray.700">
                        <MenuItem
                          icon={<FiEdit />}
                          bg="gray.800"
                          _hover={{ bg: 'gray.700' }}
                          onClick={() => handleEdit(promo)}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          icon={<FiEye />}
                          bg="gray.800"
                          _hover={{ bg: 'gray.700' }}
                        >
                          View Details
                        </MenuItem>
                        <MenuItem
                          icon={<FiTrash2 />}
                          color="red.500"
                          bg="gray.800"
                          _hover={{ bg: 'gray.700' }}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Flex>
                </CardHeader>

                <CardBody pt={0}>
                  {promo.description && (
                    <Text fontSize="sm" color="gray.600" mb={4}>
                      {promo.description}
                    </Text>
                  )}

                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>Discount</Text>
                      <HStack>
                        {promo.type === 'percentage' ? <FiPercent /> : <FiDollarSign />}
                        <Text fontWeight="bold" fontSize="lg">
                          {promo.type === 'percentage' ? `${promo.value}%` : `£${promo.value}`}
                        </Text>
                      </HStack>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>Min Spend</Text>
                      <Text fontWeight="semibold">
                        {promo.minSpend > 0 ? `£${promo.minSpend}` : 'No minimum'}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  <Box mb={4}>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="xs" color="gray.500">Usage</Text>
                      <Text fontSize="xs" fontWeight="semibold">
                        {promo.usedCount} / {promo.usageLimit}
                      </Text>
                    </Flex>
                    <Box w="full" h="2" bg="gray.200" borderRadius="full" overflow="hidden">
                      <Box
                        h="full"
                        bg={getUsagePercentage(promo) >= 90 ? 'red.400' : 'blue.400'}
                        w={`${getUsagePercentage(promo)}%`}
                        transition="width 0.3s"
                      />
                    </Box>
                  </Box>

                  <HStack fontSize="sm" color="gray.600">
                    <FiCalendar />
                    <Text>
                      {formatDate(promo.validFrom)} - {formatDate(promo.validTo)}
                    </Text>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>
            {selectedPromo ? 'Edit Promotion' : 'Create New Promotion'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Promotion Code</FormLabel>
                  <Input
                    placeholder="SUMMER2025"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    fontFamily="mono"
                    fontWeight="bold"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Display Name</FormLabel>
                  <Input
                    placeholder="Summer Sale"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Description</FormLabel>
                <Textarea
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Discount Type</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Value</FormLabel>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Min Spend (£)</FormLabel>
                  <Input
                    type="number"
                    value={formData.minSpend}
                    onChange={(e) => setFormData({ ...formData, minSpend: Number(e.target.value) })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Max Discount (£)</FormLabel>
                  <Input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Valid From</FormLabel>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Valid To</FormLabel>
                  <Input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Usage Limit</FormLabel>
                  <Input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Status</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'expired' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <HStack>
                  <Switch
                    isChecked={formData.firstTimeOnly}
                    onChange={(e) => setFormData({ ...formData, firstTimeOnly: e.target.checked })}
                    colorScheme="blue"
                  />
                  <FormLabel mb={0} fontSize="sm">First-time customers only</FormLabel>
                </HStack>
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSave} size="lg">
              {selectedPromo ? 'Update' : 'Create'} Promotion
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
