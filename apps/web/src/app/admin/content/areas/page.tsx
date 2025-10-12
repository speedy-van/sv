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
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiEye,
  FiTrash2,
  FiSave,
  FiX,
  FiMapPin,
} from 'react-icons/fi';

interface ServiceArea {
  id: string;
  name: string;
  description?: string;
  postcodes: string[];
  polygon?: any;
  capacity: number;
  status: string;
  blackoutDates: string[];
  surgeMultiplier: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function ServiceAreasPage() {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    postcodes: [] as string[],
    polygon: null,
    capacity: 100,
    status: 'active',
    blackoutDates: [] as string[],
    surgeMultiplier: 1.0,
  });

  const [newPostcode, setNewPostcode] = useState('');
  const [newBlackoutDate, setNewBlackoutDate] = useState('');

  useEffect(() => {
    fetchServiceAreas();
  }, []);

  const fetchServiceAreas = async () => {
    try {
      const response = await fetch('/api/admin/content/areas');
      if (response.ok) {
        const data = await response.json();
        setServiceAreas(data);
      }
    } catch (error) {
      console.error('Error fetching service areas:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service areas',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedArea(null);
    setFormData({
      name: '',
      description: '',
      postcodes: [],
      polygon: null,
      capacity: 100,
      status: 'active',
      blackoutDates: [],
      surgeMultiplier: 1.0,
    });
    onOpen();
  };

  const handleEdit = (area: ServiceArea) => {
    setSelectedArea(area);
    setFormData({
      name: area.name,
      description: area.description || '',
      postcodes: area.postcodes,
      polygon: area.polygon,
      capacity: area.capacity,
      status: area.status,
      blackoutDates: area.blackoutDates,
      surgeMultiplier: area.surgeMultiplier,
    });
    onOpen();
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/content/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Service area saved successfully',
          status: 'success',
          duration: 5000,
        });
        onClose();
        fetchServiceAreas();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save service area',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error saving service area:', error);
      toast({
        title: 'Error',
        description: 'Failed to save service area',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const addPostcode = () => {
    if (
      newPostcode &&
      !formData.postcodes.includes(newPostcode.toUpperCase())
    ) {
      setFormData({
        ...formData,
        postcodes: [...formData.postcodes, newPostcode.toUpperCase()],
      });
      setNewPostcode('');
    }
  };

  const removePostcode = (postcode: string) => {
    setFormData({
      ...formData,
      postcodes: formData.postcodes.filter(p => p !== postcode),
    });
  };

  const addBlackoutDate = () => {
    if (newBlackoutDate && !formData.blackoutDates.includes(newBlackoutDate)) {
      setFormData({
        ...formData,
        blackoutDates: [...formData.blackoutDates, newBlackoutDate],
      });
      setNewBlackoutDate('');
    }
  };

  const removeBlackoutDate = (date: string) => {
    setFormData({
      ...formData,
      blackoutDates: formData.blackoutDates.filter(d => d !== date),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'gray';
      case 'draft':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Box>
        <Text>Loading service areas...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Service Areas</Heading>
          <Text color="gray.600">
            Manage geographic service boundaries and capacity
          </Text>
        </VStack>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={handleCreateNew}
        >
          New Service Area
        </Button>
      </HStack>

      <Alert status="info" mb={6}>
        <AlertIcon />
        Service areas define where you operate and can include capacity limits
        and blackout dates.
      </Alert>

      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Postcodes</Th>
                <Th>Capacity</Th>
                <Th>Status</Th>
                <Th>Surge Multiplier</Th>
                <Th>Blackout Dates</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {serviceAreas.map(area => (
                <Tr key={area.id}>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{area.name}</Text>
                      {area.description && (
                        <Text fontSize="sm" color="gray.500">
                          {area.description}
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    <HStack spacing={1} flexWrap="wrap">
                      {area.postcodes.slice(0, 3).map(postcode => (
                        <Badge key={postcode} size="sm" variant="outline">
                          {postcode}
                        </Badge>
                      ))}
                      {area.postcodes.length > 3 && (
                        <Badge size="sm" variant="outline">
                          +{area.postcodes.length - 3} more
                        </Badge>
                      )}
                    </HStack>
                  </Td>
                  <Td>
                    <Text>{area.capacity} jobs/day</Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(area.status)}>
                      {area.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Text>{(area.surgeMultiplier * 100).toFixed(0)}%</Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {area.blackoutDates.length > 0
                        ? `${area.blackoutDates.length} dates`
                        : 'None'}
                    </Text>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        leftIcon={<FiEdit />}
                        variant="outline"
                        onClick={() => handleEdit(area)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        leftIcon={<FiMapPin />}
                        variant="outline"
                      >
                        Map
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Service Area Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedArea ? 'Edit Service Area' : 'New Service Area'}
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Central London"
                    />
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
                      <option value="draft">Draft</option>
                    </Select>
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
                  placeholder="Optional description of this service area"
                />
              </FormControl>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <FormControl>
                    <FormLabel>Daily Capacity</FormLabel>
                    <NumberInput
                      value={formData.capacity}
                      onChange={value =>
                        setFormData({ ...formData, capacity: parseInt(value) })
                      }
                      min={1}
                      max={1000}
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
                    <FormLabel>Surge Multiplier (%)</FormLabel>
                    <NumberInput
                      value={formData.surgeMultiplier * 100}
                      onChange={value =>
                        setFormData({
                          ...formData,
                          surgeMultiplier: parseFloat(value) / 100,
                        })
                      }
                      min={100}
                      max={300}
                      precision={0}
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

              <FormControl>
                <FormLabel>Postcodes</FormLabel>
                <InputGroup>
                  <Input
                    value={newPostcode}
                    onChange={e => setNewPostcode(e.target.value)}
                    placeholder="Enter postcode (e.g., SW1A 1AA)"
                    onKeyPress={e => e.key === 'Enter' && addPostcode()}
                  />
                  <InputRightElement>
                    <Button size="sm" onClick={addPostcode}>
                      Add
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <HStack spacing={2} mt={2} flexWrap="wrap">
                  {formData.postcodes.map(postcode => (
                    <Tag
                      key={postcode}
                      size="md"
                      colorScheme="blue"
                      borderRadius="full"
                    >
                      <TagLabel>{postcode}</TagLabel>
                      <TagCloseButton
                        onClick={() => removePostcode(postcode)}
                      />
                    </Tag>
                  ))}
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel>Blackout Dates</FormLabel>
                <InputGroup>
                  <Input
                    type="date"
                    value={newBlackoutDate}
                    onChange={e => setNewBlackoutDate(e.target.value)}
                  />
                  <InputRightElement>
                    <Button size="sm" onClick={addBlackoutDate}>
                      Add
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <HStack spacing={2} mt={2} flexWrap="wrap">
                  {formData.blackoutDates.map(date => (
                    <Tag
                      key={date}
                      size="md"
                      colorScheme="red"
                      borderRadius="full"
                    >
                      <TagLabel>{date}</TagLabel>
                      <TagCloseButton
                        onClick={() => removeBlackoutDate(date)}
                      />
                    </Tag>
                  ))}
                </HStack>
              </FormControl>

              <Alert status="info">
                <AlertIcon />
                Geographic boundaries can be set using the map interface in the
                full editor.
              </Alert>
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
              Save Service Area
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
