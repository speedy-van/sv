'use client';
import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Card,
  CardBody,
  IconButton,
  Divider,
  Badge,
  Grid,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiTrash2,
  FiPackage,
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiClock,
  FiDollarSign,
} from 'react-icons/fi';

interface DropPoint {
  id: string;
  address: string;
  postcode: string;
  contactName: string;
  contactPhone: string;
  notes: string;
  itemDescription: string;
  floorLevel: number;
}

const vehicleTypes = [
  { value: 'small_van', label: 'Small Van' },
  { value: 'medium_van', label: 'Medium Van' },
  { value: 'large_van', label: 'Large Van' },
  { value: 'xlarge_van', label: 'XLarge Van' },
  { value: 'truck', label: 'Truck' },
];

export default function OrdersSettings() {
  const toast = useToast();
  const bgColor = 'bg.surface';
  const borderColor = 'border.primary';

  const [orderData, setOrderData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    pickupAddress: '',
    pickupPostcode: '',
    pickupContactName: '',
    pickupContactPhone: '',
    pickupNotes: '',
    vehicleType: 'small_van',
    scheduledDate: '',
    scheduledTime: '',
  });

  const [dropPoints, setDropPoints] = useState<DropPoint[]>([
    {
      id: '1',
      address: '',
      postcode: '',
      contactName: '',
      contactPhone: '',
      notes: '',
      itemDescription: '',
      floorLevel: 0,
    },
  ]);

  const addDropPoint = () => {
    const newDropPoint: DropPoint = {
      id: Date.now().toString(),
      address: '',
      postcode: '',
      contactName: '',
      contactPhone: '',
      notes: '',
      itemDescription: '',
      floorLevel: 0,
    };
    setDropPoints([...dropPoints, newDropPoint]);
  };

  const removeDropPoint = (id: string) => {
    if (dropPoints.length > 1) {
      setDropPoints(dropPoints.filter(point => point.id !== id));
    } else {
      toast({
        title: 'Warning',
        description: 'There must be at least one delivery point',
        status: 'warning',
      });
    }
  };

  const updateDropPoint = (id: string, field: string, value: any) => {
    setDropPoints(
      dropPoints.map(point =>
        point.id === id ? { ...point, [field]: value } : point
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!orderData.customerName || !orderData.customerPhone) {
      toast({
        title: 'Error',
        description: 'Please enter customer details',
        status: 'error',
      });
      return;
    }

    if (!orderData.pickupAddress || !orderData.pickupPostcode) {
      toast({
        title: 'Error',
        description: 'Please enter pickup address',
        status: 'error',
      });
      return;
    }

    // Validate all drop points
    for (let i = 0; i < dropPoints.length; i++) {
      const point = dropPoints[i];
      if (!point.address || !point.postcode) {
        toast({
          title: 'Error',
          description: `Please complete delivery point ${i + 1} details`,
          status: 'error',
        });
        return;
      }
    }

    try {
      const response = await fetch('/api/admin/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          dropPoints,
          type: 'multi_drop',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Order created successfully. Order number: ${result.bookingId}`,
        status: 'success',
        duration: 5000,
      });

      // Reset form
      setOrderData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        pickupAddress: '',
        pickupPostcode: '',
        pickupContactName: '',
        pickupContactPhone: '',
        pickupNotes: '',
        vehicleType: 'small_van',
        scheduledDate: '',
        scheduledTime: '',
      });

      setDropPoints([
        {
          id: '1',
          address: '',
          postcode: '',
          contactName: '',
          contactPhone: '',
          notes: '',
          itemDescription: '',
          floorLevel: 0,
        },
      ]);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create order',
        status: 'error',
      });
    }
  };

  return (
    <Box p={6}>
      <VStack align="start" spacing={6} w="full">
        <Box>
          <Heading size="lg" mb={2}>
            Create Multi-Drop Order
          </Heading>
          <Text color="gray.600">
            Create a complex order with multiple delivery points and route optimization
          </Text>
        </Box>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <VStack spacing={6} w="full">
            {/* Customer Information */}
            <Card
              bg={bgColor}
              border="1px solid"
              borderColor={borderColor}
              w="full"
            >
              <CardBody>
                <VStack align="start" spacing={4}>
                  <HStack>
                    <FiUser />
                    <Heading size="md">Customer Information</Heading>
                  </HStack>
                  <Divider />

                  <Grid
                    templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                    gap={4}
                    w="full"
                  >
                    <FormControl isRequired>
                      <FormLabel>Customer Name</FormLabel>
                      <Input
                        value={orderData.customerName}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            customerName: e.target.value,
                          })
                        }
                        placeholder="Enter customer name"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Email Address</FormLabel>
                      <Input
                        type="email"
                        value={orderData.customerEmail}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            customerEmail: e.target.value,
                          })
                        }
                        placeholder="example@domain.com"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Phone Number</FormLabel>
                      <Input
                        type="tel"
                        value={orderData.customerPhone}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            customerPhone: e.target.value,
                          })
                        }
                        placeholder="+966 5X XXX XXXX"
                      />
                    </FormControl>
                  </Grid>
                </VStack>
              </CardBody>
            </Card>

            {/* Pickup Information */}
            <Card
              bg={bgColor}
              border="1px solid"
              borderColor={borderColor}
              w="full"
            >
              <CardBody>
                <VStack align="start" spacing={4}>
                  <HStack>
                    <FiMapPin />
                    <Heading size="md">Pickup Point</Heading>
                    <Badge colorScheme="blue">Pickup</Badge>
                  </HStack>
                  <Divider />

                  <Grid
                    templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                    gap={4}
                    w="full"
                  >
                    <FormControl isRequired>
                      <FormLabel>Address</FormLabel>
                      <Input
                        value={orderData.pickupAddress}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            pickupAddress: e.target.value,
                          })
                        }
                        placeholder="Enter pickup address"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Postcode</FormLabel>
                      <Input
                        value={orderData.pickupPostcode}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            pickupPostcode: e.target.value,
                          })
                        }
                        placeholder="SW1A 1AA"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Contact Name</FormLabel>
                      <Input
                        value={orderData.pickupContactName}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            pickupContactName: e.target.value,
                          })
                        }
                        placeholder="Name of the contact person"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Contact Phone</FormLabel>
                      <Input
                        type="tel"
                        value={orderData.pickupContactPhone}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            pickupContactPhone: e.target.value,
                          })
                        }
                        placeholder="+966 5X XXX XXXX"
                      />
                    </FormControl>

                    <FormControl gridColumn={{ base: '1', md: 'span 2' }}>
                      <FormLabel>Pickup Notes</FormLabel>
                      <Textarea
                        value={orderData.pickupNotes}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            pickupNotes: e.target.value,
                          })
                        }
                        placeholder="Additional pickup notes..."
                        rows={3}
                      />
                    </FormControl>
                  </Grid>
                </VStack>
              </CardBody>
            </Card>

            {/* Drop Points */}
            {dropPoints.map((dropPoint, index) => (
              <Card
                key={dropPoint.id}
                bg={bgColor}
                border="1px solid"
                borderColor={borderColor}
                w="full"
              >
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <HStack justify="space-between" w="full">
                      <HStack>
                        <FiPackage />
                        <Heading size="md">Delivery Point {index + 1}</Heading>
                        <Badge colorScheme="green">Drop {index + 1}</Badge>
                      </HStack>
                      <IconButton
                        aria-label="Delete delivery point"
                        icon={<FiTrash2 />}
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => removeDropPoint(dropPoint.id)}
                        isDisabled={dropPoints.length === 1}
                      />
                    </HStack>
                    <Divider />

                    <Grid
                      templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                      gap={4}
                      w="full"
                    >
                      <FormControl isRequired>
                        <FormLabel>Address</FormLabel>
                        <Input
                          value={dropPoint.address}
                          onChange={e =>
                            updateDropPoint(
                              dropPoint.id,
                              'address',
                              e.target.value
                            )
                          }
                          placeholder="Enter delivery address"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Postcode</FormLabel>
                        <Input
                          value={dropPoint.postcode}
                          onChange={e =>
                            updateDropPoint(
                              dropPoint.id,
                              'postcode',
                              e.target.value
                            )
                          }
                          placeholder="SW1A 1AA"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Contact Name</FormLabel>
                        <Input
                          value={dropPoint.contactName}
                          onChange={e =>
                            updateDropPoint(
                              dropPoint.id,
                              'contactName',
                              e.target.value
                            )
                          }
                          placeholder="Name of the contact person"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Contact Phone</FormLabel>
                        <Input
                          type="tel"
                          value={dropPoint.contactPhone}
                          onChange={e =>
                            updateDropPoint(
                              dropPoint.id,
                              'contactPhone',
                              e.target.value
                            )
                          }
                          placeholder="+966 5X XXX XXXX"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Item Description</FormLabel>
                        <Input
                          value={dropPoint.itemDescription}
                          onChange={e =>
                            updateDropPoint(
                              dropPoint.id,
                              'itemDescription',
                              e.target.value
                            )
                          }
                          placeholder="Boxes, furniture, etc..."
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Floor Level</FormLabel>
                        <NumberInput
                          value={dropPoint.floorLevel}
                          onChange={(_, value) =>
                            updateDropPoint(dropPoint.id, 'floorLevel', value)
                          }
                          min={-2}
                          max={50}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl gridColumn={{ base: '1', md: 'span 2' }}>
                        <FormLabel>Delivery Notes</FormLabel>
                        <Textarea
                          value={dropPoint.notes}
                          onChange={e =>
                            updateDropPoint(dropPoint.id, 'notes', e.target.value)
                          }
                          placeholder="Additional delivery notes..."
                          rows={2}
                        />
                      </FormControl>
                    </Grid>
                  </VStack>
                </CardBody>
              </Card>
            ))}

            {/* Add Drop Point Button */}
            <Button
              leftIcon={<FiPlus />}
              onClick={addDropPoint}
              colorScheme="green"
              variant="outline"
              w="full"
            >
              Add Another Delivery Point
            </Button>

            {/* Order Details */}
            <Card
              bg={bgColor}
              border="1px solid"
              borderColor={borderColor}
              w="full"
            >
              <CardBody>
                <VStack align="start" spacing={4}>
                  <HStack>
                    <FiClock />
                    <Heading size="md">Order Details</Heading>
                  </HStack>
                  <Divider />

                  <Grid
                    templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
                    gap={4}
                    w="full"
                  >
                    <FormControl isRequired>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select
                        value={orderData.vehicleType}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            vehicleType: e.target.value,
                          })
                        }
                      >
                        {vehicleTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Schedule Date</FormLabel>
                      <Input
                        type="date"
                        value={orderData.scheduledDate}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            scheduledDate: e.target.value,
                          })
                        }
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Schedule Time</FormLabel>
                      <Input
                        type="time"
                        value={orderData.scheduledTime}
                        onChange={e =>
                          setOrderData({
                            ...orderData,
                            scheduledTime: e.target.value,
                          })
                        }
                      />
                    </FormControl>
                  </Grid>
                </VStack>
              </CardBody>
            </Card>

            {/* Summary */}
            <Card
              bg="blue.50"
              border="1px solid"
              borderColor="blue.200"
              w="full"
            >
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Heading size="sm">Order Summary</Heading>
                  <Text fontSize="sm">
                    <strong>Customer:</strong> {orderData.customerName || 'Not specified'}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Pickup Point:</strong>{' '}
                    {orderData.pickupPostcode || 'Not specified'}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Delivery Points:</strong> {dropPoints.length}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Vehicle Type:</strong>{' '}
                    {vehicleTypes.find(v => v.value === orderData.vehicleType)
                      ?.label || 'Not specified'}
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              w="full"
              leftIcon={<FiPackage />}
            >
              Create Order
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
}
