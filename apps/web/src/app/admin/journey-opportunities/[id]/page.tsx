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
  Grid,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  useDisclosure,
  Input,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  IconButton,
} from '@chakra-ui/react';
import {
  FiMapPin,
  FiDollarSign,
  FiPackage,
  FiUser,
  FiMail,
  FiPhone,
  FiEdit,
  FiSave,
  FiX,
  FiRefreshCw,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiTruck,
} from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';

interface JourneyOpportunity {
  id: string;
  type: string;
  status: string;
  bookingId: string | null;
  bookingReference: string | null;
  originalBookingReference: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerId: string | null;
  pickupAddress: string;
  pickupPostcode: string;
  pickupCity: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffAddress: string;
  dropoffPostcode: string;
  dropoffCity: string | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  totalPrice: number;
  basePrice: number | null;
  distanceMiles: number | null;
  itemsCount: number;
  crewSize: string | null;
  serviceLevel: string | null;
  discount: number | null;
  discountPercentage: number | null;
  driverEarnings: number | null;
  matchScore: number | null;
  multiDropPotential: boolean;
  potentialSavings: number | null;
  items: any;
  scheduledDate: string | null;
  estimatedDuration: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface JourneyOpportunityResponse {
  success: boolean;
  data: {
    journeyOpportunity: JourneyOpportunity;
    bookingDetails: any | null;
  };
}

export default function JourneyOpportunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [opportunity, setOpportunity] = useState<JourneyOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<JourneyOpportunity>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();

  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/journey-opportunities/${id}`);
      const data: JourneyOpportunityResponse = await response.json();

      if (data.success) {
        setOpportunity(data.data.journeyOpportunity);
        setEditData(data.data.journeyOpportunity);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch journey opportunity',
          status: 'error',
          duration: 3000,
        });
        router.push('/admin/journey-opportunities');
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch journey opportunity',
        status: 'error',
        duration: 3000,
      });
      router.push('/admin/journey-opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!opportunity) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/journey-opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Journey opportunity updated successfully',
          status: 'success',
          duration: 3000,
        });
        setOpportunity(data.data);
        setEditData(data.data);
        setIsEditing(false);
        fetchOpportunity();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update journey opportunity',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update journey opportunity',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!opportunity) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/journey-opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Status updated to ${newStatus}`,
          status: 'success',
          duration: 3000,
        });
        fetchOpportunity();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update status',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'green';
      case 'claimed':
        return 'blue';
      case 'converted':
        return 'purple';
      case 'expired':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'new_journey':
        return 'blue';
      case 'return_journey':
        return 'orange';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Box p={8} bg="gray.900" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="white">Loading journey opportunity...</Text>
        </VStack>
      </Box>
    );
  }

  if (!opportunity) {
    return (
      <Box p={8} bg="gray.900" minH="100vh">
        <Alert status="error" variant="subtle" colorScheme="red">
          <AlertIcon />
          Journey opportunity not found
        </Alert>
      </Box>
    );
  }

  const displayData = isEditing ? editData : opportunity;

  return (
    <Box p={8} bg="gray.900" minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={4}>
            <IconButton
              aria-label="Go back"
              icon={<FiArrowLeft />}
              onClick={() => router.push('/admin/journey-opportunities')}
              variant="ghost"
              colorScheme="blue"
            />
            <Heading size="lg" color="white">
              Journey Opportunity Details
            </Heading>
          </HStack>
          <HStack>
            {!isEditing ? (
              <>
                <Button
                  leftIcon={<FiEdit />}
                  onClick={() => setIsEditing(true)}
                  colorScheme="blue"
                >
                  Edit
                </Button>
                <Select
                  value={opportunity.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  bg="gray.800"
                  borderColor="gray.700"
                  color="white"
                  w="200px"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="CLAIMED">Claimed</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="EXPIRED">Expired</option>
                </Select>
              </>
            ) : (
              <>
                <Button
                  leftIcon={<FiX />}
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(opportunity);
                  }}
                  variant="outline"
                  colorScheme="gray"
                >
                  Cancel
                </Button>
                <Button
                  leftIcon={<FiSave />}
                  onClick={handleSave}
                  isLoading={saving}
                  colorScheme="green"
                >
                  Save Changes
                </Button>
              </>
            )}
            <IconButton
              aria-label="Refresh"
              icon={<FiRefreshCw />}
              onClick={fetchOpportunity}
              variant="ghost"
              colorScheme="blue"
            />
          </HStack>
        </HStack>

        {/* Type and Status Badges */}
        <HStack>
          <Badge colorScheme={getTypeColor(opportunity.type)} fontSize="md" p={2}>
            {opportunity.type === 'NEW_JOURNEY' ? 'New Journey' : 'Return Journey'}
          </Badge>
          <Badge colorScheme={getStatusColor(opportunity.status)} fontSize="md" p={2}>
            {opportunity.status}
          </Badge>
          {opportunity.bookingReference && (
            <Badge colorScheme="purple" fontSize="md" p={2}>
              Ref: {opportunity.bookingReference}
            </Badge>
          )}
        </HStack>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Main Content */}
          <VStack spacing={6} align="stretch">
            {/* Customer Information */}
            <Box bg="gray.800" borderColor="gray.700" borderWidth="1px" borderRadius="md" p={6}>
                <Heading size="md" color="white" mb={4}>
                  Customer Information
                </Heading>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel color="gray.400">Customer Name</FormLabel>
                    {isEditing ? (
                      <Input
                        value={editData.customerName || ''}
                        onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                      />
                    ) : (
                      <Text color="white">{opportunity.customerName}</Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.400">Email</FormLabel>
                    {isEditing ? (
                      <Input
                        value={editData.customerEmail || ''}
                        onChange={(e) => setEditData({ ...editData, customerEmail: e.target.value })}
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                      />
                    ) : (
                      <Text color="white">{opportunity.customerEmail || 'N/A'}</Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.400">Phone</FormLabel>
                    {isEditing ? (
                      <Input
                        value={editData.customerPhone || ''}
                        onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                      />
                    ) : (
                      <Text color="white">{opportunity.customerPhone || 'N/A'}</Text>
                    )}
                  </FormControl>
                </SimpleGrid>
              </Box>

            {/* Journey Details */}
            <Box bg="gray.800" borderColor="gray.700" borderWidth="1px" borderRadius="md" p={6}>
                <Heading size="md" color="white" mb={4}>
                  Journey Details
                </Heading>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text color="gray.400" fontSize="sm" mb={2}>
                      Pickup Address
                    </Text>
                    {isEditing ? (
                      <VStack spacing={2} align="stretch">
                        <Input
                          value={editData.pickupAddress || ''}
                          onChange={(e) => setEditData({ ...editData, pickupAddress: e.target.value })}
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="Street address"
                        />
                        <HStack>
                          <Input
                            value={editData.pickupPostcode || ''}
                            onChange={(e) => setEditData({ ...editData, pickupPostcode: e.target.value })}
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                            placeholder="Postcode"
                            flex={1}
                          />
                          <Input
                            value={editData.pickupCity || ''}
                            onChange={(e) => setEditData({ ...editData, pickupCity: e.target.value })}
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                            placeholder="City"
                            flex={1}
                          />
                        </HStack>
                      </VStack>
                    ) : (
                      <Text color="white">
                        {opportunity.pickupAddress}, {opportunity.pickupPostcode}
                        {opportunity.pickupCity && `, ${opportunity.pickupCity}`}
                      </Text>
                    )}
                  </Box>
                  <Box>
                    <Text color="gray.400" fontSize="sm" mb={2}>
                      Dropoff Address
                    </Text>
                    {isEditing ? (
                      <VStack spacing={2} align="stretch">
                        <Input
                          value={editData.dropoffAddress || ''}
                          onChange={(e) => setEditData({ ...editData, dropoffAddress: e.target.value })}
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="Street address"
                        />
                        <HStack>
                          <Input
                            value={editData.dropoffPostcode || ''}
                            onChange={(e) => setEditData({ ...editData, dropoffPostcode: e.target.value })}
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                            placeholder="Postcode"
                            flex={1}
                          />
                          <Input
                            value={editData.dropoffCity || ''}
                            onChange={(e) => setEditData({ ...editData, dropoffCity: e.target.value })}
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                            placeholder="City"
                            flex={1}
                          />
                        </HStack>
                      </VStack>
                    ) : (
                      <Text color="white">
                        {opportunity.dropoffAddress}, {opportunity.dropoffPostcode}
                        {opportunity.dropoffCity && `, ${opportunity.dropoffCity}`}
                      </Text>
                    )}
                  </Box>
                </VStack>
              </Box>

            {/* Items */}
            {opportunity.items && (
              <Box bg="gray.800" borderColor="gray.700" borderWidth="1px" borderRadius="md" p={6}>
                  <Heading size="md" color="white" mb={4}>
                    Items
                  </Heading>
                  {Array.isArray(opportunity.items) && opportunity.items.length > 0 ? (
                    <VStack align="stretch" spacing={2}>
                      {opportunity.items.map((item: any, index: number) => (
                        <HStack key={index} justify="space-between" p={2} bg="gray.700" borderRadius="md">
                          <Text color="white">
                            {item.name} x{item.quantity}
                          </Text>
                          {item.weight && (
                            <Text color="gray.400" fontSize="sm">
                              {item.weight}kg
                            </Text>
                          )}
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text color="gray.400">No items specified</Text>
                  )}
              </Box>
            )}

            {/* Notes */}
            <Box bg="gray.800" borderColor="gray.700" borderWidth="1px" borderRadius="md" p={6}>
                <Heading size="md" color="white" mb={4}>
                  Notes
                </Heading>
                {isEditing ? (
                  <Textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    bg="gray.700"
                    borderColor="gray.600"
                    color="white"
                    placeholder="Add notes about this opportunity..."
                    rows={4}
                  />
                ) : (
                  <Text color="white">{opportunity.notes || 'No notes'}</Text>
                )}
              </Box>
          </VStack>

          {/* Sidebar */}
          <VStack spacing={6} align="stretch">
            {/* Pricing */}
            <Box bg="gray.800" borderColor="gray.700" borderWidth="1px" borderRadius="md" p={6}>
                <Heading size="md" color="white" mb={4}>
                  Pricing
                </Heading>
                <VStack spacing={4} align="stretch">
                  <Stat>
                    <StatLabel color="gray.400">Total Price</StatLabel>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData.totalPrice || 0}
                        onChange={(e) =>
                          setEditData({ ...editData, totalPrice: parseFloat(e.target.value) })
                        }
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                      />
                    ) : (
                      <StatNumber color="white">£{opportunity.totalPrice.toFixed(2)}</StatNumber>
                    )}
                  </Stat>
                  {opportunity.discount && opportunity.discount > 0 && (
                    <Stat>
                      <StatLabel color="gray.400">Discount</StatLabel>
                      <StatNumber color="green.400">
                        -£{opportunity.discount.toFixed(2)} ({opportunity.discountPercentage?.toFixed(0)}%)
                      </StatNumber>
                    </Stat>
                  )}
                  {opportunity.driverEarnings && (
                    <Stat>
                      <StatLabel color="gray.400">Driver Earnings</StatLabel>
                      <StatNumber color="blue.400">£{opportunity.driverEarnings.toFixed(2)}</StatNumber>
                    </Stat>
                  )}
                  {opportunity.matchScore && (
                    <Stat>
                      <StatLabel color="gray.400">Match Score</StatLabel>
                      <StatNumber color="purple.400">{opportunity.matchScore.toFixed(0)}%</StatNumber>
                    </Stat>
                  )}
                    </VStack>
              </Box>

            {/* Journey Info */}
            <Box bg="gray.800" borderColor="gray.700" borderWidth="1px" borderRadius="md" p={6}>
                <Heading size="md" color="white" mb={4}>
                  Journey Info
                </Heading>
                <VStack spacing={4} align="stretch">
                  <Stat>
                    <StatLabel color="gray.400">Distance</StatLabel>
                    <StatNumber color="white">
                      {opportunity.distanceMiles ? `${opportunity.distanceMiles.toFixed(1)} miles` : 'N/A'}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel color="gray.400">Items Count</StatLabel>
                    <StatNumber color="white">{opportunity.itemsCount}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel color="gray.400">Crew Size</StatLabel>
                    <StatNumber color="white">{opportunity.crewSize || '2'}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel color="gray.400">Service Level</StatLabel>
                    <StatNumber color="white">{opportunity.serviceLevel || 'Standard'}</StatNumber>
                  </Stat>
                  {opportunity.scheduledDate && (
                    <Stat>
                      <StatLabel color="gray.400">Scheduled Date</StatLabel>
                      <StatNumber color="white" fontSize="md">
                        {new Date(opportunity.scheduledDate).toLocaleDateString()}
                      </StatNumber>
                      <StatHelpText color="gray.400">
                        {new Date(opportunity.scheduledDate).toLocaleTimeString()}
                      </StatHelpText>
                    </Stat>
                  )}
                  {opportunity.estimatedDuration && (
                    <Stat>
                      <StatLabel color="gray.400">Estimated Duration</StatLabel>
                      <StatNumber color="white">{opportunity.estimatedDuration} minutes</StatNumber>
                    </Stat>
                  )}
                </VStack>
              </Box>

            {/* Metadata */}
            <Box bg="gray.800" borderColor="gray.700" borderWidth="1px" borderRadius="md" p={6}>
                <Heading size="md" color="white" mb={4}>
                  Metadata
                </Heading>
                <VStack spacing={2} align="stretch">
                  <Text color="gray.400" fontSize="sm">
                    Created: {new Date(opportunity.createdAt).toLocaleString()}
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Updated: {new Date(opportunity.updatedAt).toLocaleString()}
                  </Text>
                  {opportunity.multiDropPotential && (
                    <Badge colorScheme="green" mt={2}>
                      Multi-drop Potential
                    </Badge>
                  )}
                  {opportunity.potentialSavings && opportunity.potentialSavings > 0 && (
                    <Text color="green.400" fontSize="sm" mt={2}>
                      Potential Savings: £{opportunity.potentialSavings.toFixed(2)}
                    </Text>
                  )}
                </VStack>
              </Box>
          </VStack>
        </Grid>
      </VStack>
    </Box>
  );
}

