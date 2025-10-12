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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
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
} from '@chakra-ui/react';
import {
  FiSettings,
  FiMapPin,
  FiTag,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
} from 'react-icons/fi';

export default function ContentPage() {
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContentData();
  }, []);

  const fetchContentData = async () => {
    try {
      const response = await fetch('/api/admin/content');
      if (response.ok) {
        const data = await response.json();

        setServiceAreas(data.serviceAreas || []);
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      console.error('Error fetching content data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'draft':
        return 'yellow';
      case 'scheduled':
        return 'blue';
      case 'inactive':
        return 'gray';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Box>
        <Text>Loading content data...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Content Management</Heading>
          <Text color="gray.600">Service areas and promotions</Text>
        </VStack>
        <HStack spacing={3}>
          <Button leftIcon={<FiEye />} variant="outline" size="sm">
            Preview Changes
          </Button>
          <Button leftIcon={<FiSettings />} colorScheme="blue" size="sm">
            Publish All
          </Button>
        </HStack>
      </HStack>

      <Tabs>
        <TabList>
          <Tab>Service Areas</Tab>
          <Tab>Promotions</Tab>
        </TabList>

        <TabPanels>
          {/* Service Areas Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Service Areas</Heading>
                  <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm">
                    Add Area
                  </Button>
                </HStack>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Postcodes</Th>
                      <Th>Capacity</Th>
                      <Th>Status</Th>
                      <Th>Blackout Dates</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {serviceAreas.map(area => (
                      <Tr key={area.id}>
                        <Td>
                          <Text fontWeight="bold">{area.name}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{area.postcodes.join(', ')}</Text>
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
                          <Text fontSize="sm">
                            {area.blackoutDates.length > 0
                              ? area.blackoutDates.join(', ')
                              : 'None'}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button
                              size="xs"
                              leftIcon={<FiEdit />}
                              variant="outline"
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
                            <Button
                              size="xs"
                              leftIcon={<FiTrash2 />}
                              colorScheme="red"
                              variant="outline"
                            >
                              Delete
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Promotions Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Promotions</Heading>
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    size="sm"
                    onClick={() =>
                      (window.location.href = '/admin/content/promos')
                    }
                  >
                    Add Promotion
                  </Button>
                </HStack>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Code</Th>
                      <Th>Type</Th>
                      <Th>Value</Th>
                      <Th>Min Spend</Th>
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
                          <Text fontWeight="bold">{promo.reference}</Text>
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
                          <Text>£{promo.minSpend.toFixed(2)}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {promo.usedCount}/{promo.usageLimit}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {new Date(promo.validFrom).toLocaleDateString()} -{' '}
                            {new Date(promo.validTo).toLocaleDateString()}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(promo.status)}>
                            {promo.status}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button
                              size="xs"
                              leftIcon={<FiEdit />}
                              variant="outline"
                            >
                              Edit
                            </Button>
                            <Button
                              size="xs"
                              leftIcon={<FiEye />}
                              variant="outline"
                            >
                              Preview
                            </Button>
                            <Button
                              size="xs"
                              leftIcon={<FiTrash2 />}
                              colorScheme="red"
                              variant="outline"
                            >
                              Delete
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Version Control Info */}
      <Card mt={6}>
        <CardBody>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">Version Control</Text>
              <Text fontSize="sm" color="gray.600">
                All changes are versioned and can be reverted. Preview changes
                before publishing.
              </Text>
            </VStack>
            <HStack spacing={3}>
              <Button variant="outline" size="sm">
                View History
              </Button>
              <Button variant="outline" size="sm">
                Revert Changes
              </Button>
            </HStack>
          </HStack>
        </CardBody>
      </Card>
    </Box>
  );
}
