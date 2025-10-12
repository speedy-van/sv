import React from 'react';
import {
  Box,
  Heading,
  Badge,
  HStack,
  VStack,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  Grid,
  GridItem,
  Divider,
  List,
  ListItem,
  ListIcon,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiMapPin,
  FiClock,
  FiUser,
  FiTruck,
  FiDollarSign,
  FiMessageSquare,
  FiFile,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiPackage,
  FiNavigation,
} from 'react-icons/fi';

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  // Enhanced mock order data with capacity and route information
  const order = {
    id: params.id,
    ref: `ORD-${params.id}`,
    status: 'in-transit',
    type: 'multi-drop', // single-drop or multi-drop
    customer: {
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+44 7700 900123',
    },
    stops: [
      {
        type: 'pickup',
        address: '123 High Street, London SW1A 1AA',
        time: '14:00 - 16:00',
        contact: 'Jane Doe',
        phone: '+44 7700 900456',
        items: [
          { name: 'Sofa', quantity: 1, weight: 80, volume: 2.5, category: 'Living Room' },
          { name: 'Dining Table', quantity: 1, weight: 70, volume: 2.0, category: 'Dining' },
          { name: 'Boxes', quantity: 5, weight: 40, volume: 1.0, category: 'Miscellaneous' },
        ],
        capacityUsed: { weight: 190, volume: 5.5, items: 7 }
      },
      {
        type: 'dropoff',
        address: '456 Oxford Street, London W1C 1AP',
        time: '16:00 - 18:00',
        contact: 'Bob Wilson',
        phone: '+44 7700 900789',
        items: [
          { name: 'Sofa', quantity: 1, weight: 80, volume: 2.5, category: 'Living Room' },
        ],
        capacityUsed: { weight: 80, volume: 2.5, items: 1 }
      },
      {
        type: 'dropoff',
        address: '789 Park Lane, London W1K 7AA',
        time: '18:00 - 19:00',
        contact: 'Alice Brown',
        phone: '+44 7700 900111',
        items: [
          { name: 'Dining Table', quantity: 1, weight: 70, volume: 2.0, category: 'Dining' },
          { name: 'Boxes', quantity: 3, weight: 24, volume: 0.6, category: 'Miscellaneous' },
        ],
        capacityUsed: { weight: 94, volume: 2.6, items: 4 }
      }
    ],
    vehicle: {
      type: 'Luton Van',
      capacity: { maxWeight: 3500, maxVolume: 14.5, maxItems: 150 },
      utilization: { weight: 364, volume: 10.6, items: 12 }, // percentages
    },
    route: {
      totalDistance: 24.5,
      totalDuration: 185, // minutes
      optimization: {
        algorithm: 'capacity-aware',
        efficiencyScore: 92,
        timeSaved: 15,
        distanceSaved: 2.1
      },
      warnings: [],
      recommendations: ['Route optimized for LIFO unloading efficiency']
    },
    crew: 2,
    floors: 3,
    lift: true,
    price: 185.0, // Updated with multi-drop pricing
    pricingBreakdown: {
      baseFee: 75,
      itemsFee: 45,
      laborFee: 32,
      distanceFee: 24.5,
      multiDropDiscount: -15,
      total: 185
    },
    paymentStatus: 'paid',
    driver: {
      name: 'Sarah Johnson',
      phone: '+44 7700 900999',
      rating: 4.8,
    },
    timeline: [
      { time: '09:30', event: 'Order created', user: 'Customer' },
      { time: '10:15', event: 'Payment confirmed', user: 'System' },
      { time: '11:00', event: 'Assigned to driver', user: 'Admin' },
      { time: '13:45', event: 'Driver en route', user: 'Sarah J.' },
      { time: '14:30', event: 'Arrived at pickup', user: 'Sarah J.' },
      { time: '15:15', event: 'Loaded items', user: 'Sarah J.' },
      { time: '15:30', event: 'En route to dropoff', user: 'Sarah J.' },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'confirmed':
        return 'blue';
      case 'in-transit':
        return 'green';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">{order.ref}</Heading>
          <Text color="gray.600">Order Details</Text>
        </VStack>
        <HStack spacing={3}>
          <Badge colorScheme={getStatusColor(order.status)} size="lg">
            {order.status.replace('-', ' ').toUpperCase()}
          </Badge>
          <Button colorScheme="blue" size="sm">
            Assign Driver
          </Button>
          <Button variant="outline" size="sm">
            Update Time
          </Button>
          <Button variant="outline" size="sm">
            Refund
          </Button>
          <Button variant="outline" size="sm">
            Chat
          </Button>
        </HStack>
      </HStack>

      <Tabs>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Route & Capacity</Tab>
          <Tab>Timeline</Tab>
          <Tab>Payment</Tab>
          <Tab>Communications</Tab>
          <Tab>Files</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
              <VStack spacing={6} align="stretch">
                {/* Route Information */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Route
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      {order.stops.map((stop, index) => (
                        <HStack key={index}>
                          <FiMapPin />
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">
                              {stop.type === 'pickup' ? 'Pickup' : `Dropoff ${index}`}
                            </Text>
                            <Text>{stop.address}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {stop.time} • {stop.contact} ({stop.phone})
                            </Text>
                          </VStack>
                        </HStack>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Items */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Items
                    </Heading>
                    <List spacing={3}>
                      {order.stops.flatMap(stop => stop.items).map((item: any, index: number) => (
                        <ListItem key={index}>
                          <HStack justify="space-between">
                            <Text>
                              {item.name} (x{item.quantity})
                            </Text>
                            <Badge variant="outline">{item.category}</Badge>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  </CardBody>
                </Card>
              </VStack>

              <VStack spacing={6} align="stretch">
                {/* Customer Info */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Customer
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <FiUser />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">{order.customer.name}</Text>
                          <Text fontSize="sm">{order.customer.email}</Text>
                          <Text fontSize="sm">{order.customer.phone}</Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Driver Info */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Driver
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack>
                        <FiTruck />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">{order.driver.name}</Text>
                          <Text fontSize="sm">{order.driver.phone}</Text>
                          <Text fontSize="sm">
                            Rating: {order.driver.rating} ⭐
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Service Details */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Service Details
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text>Crew Size</Text>
                        <Text fontWeight="bold">{order.crew} people</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Floors</Text>
                        <Text fontWeight="bold">{order.floors}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Lift Available</Text>
                        <Text fontWeight="bold">
                          {order.lift ? 'Yes' : 'No'}
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </Grid>
          </TabPanel>

          {/* Route & Capacity Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {/* Capacity Utilization */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Stat>
                  <StatLabel>Weight Utilization</StatLabel>
                  <StatNumber>{order.vehicle.utilization.weight}kg</StatNumber>
                  <StatHelpText>
                    <StatArrow type={order.vehicle.utilization.weight > 80 ? 'increase' : 'decrease'} />
                    of {order.vehicle.capacity.maxWeight}kg max
                  </StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Volume Utilization</StatLabel>
                  <StatNumber>{order.vehicle.utilization.volume}m³</StatNumber>
                  <StatHelpText>
                    <StatArrow type={order.vehicle.utilization.volume > 12 ? 'increase' : 'decrease'} />
                    of {order.vehicle.capacity.maxVolume}m³ max
                  </StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Item Count</StatLabel>
                  <StatNumber>{order.vehicle.utilization.items}</StatNumber>
                  <StatHelpText>
                    of {order.vehicle.capacity.maxItems} max items
                  </StatHelpText>
                </Stat>
              </SimpleGrid>

              {/* Route Optimization */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>Route Optimization</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <VStack align="start">
                      <Text fontWeight="bold">Algorithm: {order.route.optimization.algorithm}</Text>
                      <Text>Efficiency Score: {order.route.optimization.efficiencyScore}%</Text>
                      <Text>Time Saved: {order.route.optimization.timeSaved} minutes</Text>
                      <Text>Distance Saved: {order.route.optimization.distanceSaved} km</Text>
                    </VStack>
                    <VStack align="start">
                      <Text fontWeight="bold">Total Distance: {order.route.totalDistance} km</Text>
                      <Text>Estimated Duration: {Math.round(order.route.totalDuration / 60)}h {order.route.totalDuration % 60}m</Text>
                      <Text>Stops: {order.stops.length}</Text>
                    </VStack>
                  </SimpleGrid>
                  {order.route.recommendations.length > 0 && (
                    <Box mt={4}>
                      <Text fontWeight="bold" mb={2}>Recommendations:</Text>
                      <List spacing={1}>
                        {order.route.recommendations.map((rec, index) => (
                          <ListItem key={index}>
                            <ListIcon as={FiCheckCircle} color="green.500" />
                            {rec}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardBody>
              </Card>

              {/* Multi-Stop Breakdown */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>Stop-by-Stop Breakdown</Heading>
                  <VStack spacing={4} align="stretch">
                    {order.stops.map((stop, index) => (
                      <Box key={index} p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                        <HStack justify="space-between" mb={2}>
                          <HStack>
                            <Badge colorScheme={stop.type === 'pickup' ? 'blue' : 'green'}>
                              {stop.type === 'pickup' ? 'Pickup' : `Drop ${index}`}
                            </Badge>
                            <Text fontWeight="bold">{stop.address}</Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">{stop.time}</Text>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2} mb={3}>
                          <Text fontSize="sm">Weight: {stop.capacityUsed.weight}kg</Text>
                          <Text fontSize="sm">Volume: {stop.capacityUsed.volume}m³</Text>
                          <Text fontSize="sm">Items: {stop.capacityUsed.items}</Text>
                        </SimpleGrid>

                        <Text fontSize="sm" fontWeight="medium" mb={1}>Items:</Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {stop.items.map((item, itemIndex) => (
                            <Badge key={itemIndex} variant="outline" fontSize="xs">
                              {item.name} (x{item.quantity}) - {item.weight}kg
                            </Badge>
                          ))}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Pricing Breakdown */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>Enhanced Pricing Breakdown</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <VStack align="start" spacing={2}>
                      <HStack justify="space-between" w="full">
                        <Text>Base Fee:</Text>
                        <Text>£{order.pricingBreakdown.baseFee}</Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text>Items Fee:</Text>
                        <Text>£{order.pricingBreakdown.itemsFee}</Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text>Labor Fee:</Text>
                        <Text>£{order.pricingBreakdown.laborFee}</Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text>Distance Fee:</Text>
                        <Text>£{order.pricingBreakdown.distanceFee}</Text>
                      </HStack>
                    </VStack>
                    <VStack align="start" spacing={2}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="bold">Multi-Drop Discount:</Text>
                        <Text color="green.500">£{order.pricingBreakdown.multiDropDiscount}</Text>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="bold" fontSize="lg">Total:</Text>
                        <Text fontWeight="bold" fontSize="lg">£{order.pricingBreakdown.total}</Text>
                      </HStack>
                    </VStack>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Timeline Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  Order Timeline
                </Heading>
                <VStack spacing={4} align="stretch">
                  {order.timeline.map((event, index) => (
                    <HStack key={index} spacing={4}>
                      <Text fontSize="sm" color="gray.600" minW="60px">
                        {event.time}
                      </Text>
                      <Box
                        w="12px"
                        h="12px"
                        borderRadius="full"
                        bg={
                          index === order.timeline.length - 1
                            ? 'blue.500'
                            : 'gray.300'
                        }
                      />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{event.event}</Text>
                        <Text fontSize="sm" color="gray.600">
                          by {event.user}
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Payment Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  Payment Information
                </Heading>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text>Status</Text>
                    <Badge
                      colorScheme={
                        order.paymentStatus === 'paid' ? 'green' : 'yellow'
                      }
                    >
                      {order.paymentStatus.toUpperCase()}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Amount</Text>
                    <Text fontWeight="bold">£{order.price.toFixed(2)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Payment Method</Text>
                    <Text>Card ending in 1234</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Transaction ID</Text>
                    <Text fontSize="sm" color="gray.600">
                      txn_123456789
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Communications Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  Communications
                </Heading>
                <Text color="gray.500">
                  Chat and email logs will be displayed here
                </Text>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Files Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  Files
                </Heading>
                <Text color="gray.500">
                  Photos, POD, and invoice PDFs will be displayed here
                </Text>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
