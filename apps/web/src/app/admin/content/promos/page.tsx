'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  Card,
  CardBody,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  Switch,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  useToast,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputRightElement,
  Progress,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiEye,
  FiTrash2,
  FiSave,
  FiX,
  FiGift,
} from 'react-icons/fi';

interface Promotion {
  id: string;
  reference: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  minSpend: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  status: string;
  applicableAreas: string[];
  applicableVans: string[];
  firstTimeOnly: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    reference: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 10,
    minSpend: 0,
    maxDiscount: 0,
    usageLimit: 1000,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    status: 'active',
    applicableAreas: [] as string[],
    applicableVans: [] as string[],
    firstTimeOnly: false,
  });

  const [newArea, setNewArea] = useState('');
  const [newVan, setNewVan] = useState('');

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
        title: 'Error',
        description: 'Failed to load promotions',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedPromo(null);
    setFormData({
      reference: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 10,
      minSpend: 0,
      maxDiscount: 0,
      usageLimit: 1000,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'active',
      applicableAreas: [],
      applicableVans: [],
      firstTimeOnly: false,
    });
    onOpen();
  };

  const handleEdit = (promo: Promotion) => {
    setSelectedPromo(promo);
    setFormData({
      reference: promo.reference,
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
      applicableAreas: promo.applicableAreas,
      applicableVans: promo.applicableVans,
      firstTimeOnly: promo.firstTimeOnly,
    });
    onOpen();
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/content/promos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Promotion saved successfully',
          status: 'success',
          duration: 5000,
        });
        onClose();
        fetchPromotions();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save promotion',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast({
        title: 'Error',
        description: 'Failed to save promotion',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const addArea = () => {
    if (newArea && !formData.applicableAreas.includes(newArea)) {
      setFormData({
        ...formData,
        applicableAreas: [...formData.applicableAreas, newArea],
      });
      setNewArea('');
    }
  };

  const removeArea = (area: string) => {
    setFormData({
      ...formData,
      applicableAreas: formData.applicableAreas.filter(a => a !== area),
    });
  };

  const addVan = () => {
    if (newVan && !formData.applicableVans.includes(newVan)) {
      setFormData({
        ...formData,
        applicableVans: [...formData.applicableVans, newVan],
      });
      setNewVan('');
    }
  };

  const removeVan = (van: string) => {
    setFormData({
      ...formData,
      applicableVans: formData.applicableVans.filter(v => v !== van),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'gray';
      case 'scheduled':
        return 'blue';
      case 'expired':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getUsagePercentage = (promo: Promotion) => {
    return (promo.usedCount / promo.usageLimit) * 100;
  };

  const isExpired = (promo: Promotion) => {
    return new Date() > new Date(promo.validTo);
  };

  const isScheduled = (promo: Promotion) => {
    return new Date() < new Date(promo.validFrom);
  };

  if (loading) {
    return (
      <Box>
        <Text>Loading promotions...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Promotions</Heading>
          <Text color="gray.600">Manage promotional codes and discounts</Text>
        </VStack>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={handleCreateNew}
        >
          New Promotion
        </Button>
      </HStack>

      <Alert status="info" mb={6}>
        <AlertIcon />
        Promotions can be percentage or fixed discounts with usage limits and
        validity periods.
      </Alert>

      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Value</Th>
                <Th>Usage</Th>
                <Th>Valid Period</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {promotions.map(promo => (
                <Tr key={promo.id}>
                  <Td>
                    <Text fontWeight="bold" fontFamily="mono">
                      {promo.reference}
                    </Text>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{promo.name}</Text>
                      {promo.description && (
                        <Text fontSize="sm" color="gray.500">
                          {promo.description}
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    <Badge variant="outline" colorScheme="blue">
                      {promo.type}
                    </Badge>
                  </Td>
                  <Td>
                    <Text>
                      {promo.type === 'percentage'
                        ? `${promo.value}%`
                        : `£${promo.value.toFixed(2)}`}
                    </Text>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm">
                        {promo.usedCount}/{promo.usageLimit}
                      </Text>
                      <Progress
                        value={getUsagePercentage(promo)}
                        size="sm"
                        colorScheme={
                          getUsagePercentage(promo) > 80 ? 'red' : 'green'
                        }
                        w="100px"
                      />
                    </VStack>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {new Date(promo.validFrom).toLocaleDateString()} -{' '}
                      {new Date(promo.validTo).toLocaleDateString()}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(promo.status)}>
                      {isExpired(promo)
                        ? 'Expired'
                        : isScheduled(promo)
                          ? 'Scheduled'
                          : promo.status}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        leftIcon={<FiEdit />}
                        variant="outline"
                        onClick={() => handleEdit(promo)}
                      >
                        Edit
                      </Button>
                      <Button size="xs" leftIcon={<FiEye />} variant="outline">
                        Preview
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Promotion Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedPromo ? 'Edit Promotion' : 'New Promotion'}
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Promotion Code</FormLabel>
                    <Input
                      value={formData.reference}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          reference: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g., FIRST10"
                      fontFamily="mono"
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., First Order Discount"
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description of this promotion"
                />
              </FormControl>

              <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={formData.type}
                      onChange={e =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="free_shipping">Free Shipping</option>
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>
                      {formData.type === 'percentage'
                        ? 'Percentage (%)'
                        : 'Amount (£)'}
                    </FormLabel>
                    <NumberInput
                      value={formData.value}
                      onChange={value =>
                        setFormData({ ...formData, value: parseFloat(value) })
                      }
                      min={0}
                      max={formData.type === 'percentage' ? 100 : 1000}
                      precision={formData.type === 'percentage' ? 0 : 2}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={formData.status}
                      onChange={e =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="scheduled">Scheduled</option>
                    </Select>
                  </FormControl>
                </GridItem>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <FormControl>
                    <FormLabel>Minimum Spend (£)</FormLabel>
                    <NumberInput
                      value={formData.minSpend}
                      onChange={value =>
                        setFormData({
                          ...formData,
                          minSpend: parseFloat(value),
                        })
                      }
                      min={0}
                      precision={2}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>Maximum Discount (£)</FormLabel>
                    <NumberInput
                      value={formData.maxDiscount}
                      onChange={value =>
                        setFormData({
                          ...formData,
                          maxDiscount: parseFloat(value),
                        })
                      }
                      min={0}
                      precision={2}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <FormControl>
                    <FormLabel>Usage Limit</FormLabel>
                    <NumberInput
                      value={formData.usageLimit}
                      onChange={value =>
                        setFormData({
                          ...formData,
                          usageLimit: parseInt(value),
                        })
                      }
                      min={1}
                      max={100000}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>First Time Only</FormLabel>
                    <Switch
                      isChecked={formData.firstTimeOnly}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          firstTimeOnly: e.target.checked,
                        })
                      }
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Valid From</FormLabel>
                    <Input
                      type="date"
                      value={formData.validFrom}
                      onChange={e =>
                        setFormData({ ...formData, validFrom: e.target.value })
                      }
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Valid To</FormLabel>
                    <Input
                      type="date"
                      value={formData.validTo}
                      onChange={e =>
                        setFormData({ ...formData, validTo: e.target.value })
                      }
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl>
                <FormLabel>Applicable Areas</FormLabel>
                <InputGroup>
                  <Input
                    value={newArea}
                    onChange={e => setNewArea(e.target.value)}
                    placeholder="Enter area ID"
                    onKeyPress={e => e.key === 'Enter' && addArea()}
                  />
                  <InputRightElement>
                    <Button size="sm" onClick={addArea}>
                      Add
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <HStack spacing={2} mt={2} flexWrap="wrap">
                  {formData.applicableAreas.map(area => (
                    <Tag
                      key={area}
                      size="md"
                      colorScheme="blue"
                      borderRadius="full"
                    >
                      <TagLabel>{area}</TagLabel>
                      <TagCloseButton onClick={() => removeArea(area)} />
                    </Tag>
                  ))}
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel>Applicable Van Types</FormLabel>
                <InputGroup>
                  <Input
                    value={newVan}
                    onChange={e => setNewVan(e.target.value)}
                    placeholder="Enter van type"
                    onKeyPress={e => e.key === 'Enter' && addVan()}
                  />
                  <InputRightElement>
                    <Button size="sm" onClick={addVan}>
                      Add
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <HStack spacing={2} mt={2} flexWrap="wrap">
                  {formData.applicableVans.map(van => (
                    <Tag
                      key={van}
                      size="md"
                      colorScheme="green"
                      borderRadius="full"
                    >
                      <TagLabel>{van}</TagLabel>
                      <TagCloseButton onClick={() => removeVan(van)} />
                    </Tag>
                  ))}
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              leftIcon={<FiSave />}
              colorScheme="blue"
              onClick={handleSave}
            >
              Save Promotion
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
