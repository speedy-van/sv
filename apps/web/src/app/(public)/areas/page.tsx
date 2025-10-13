'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import Link from 'next/link';
import { ALL_SERVICE_AREAS, getServiceAreasByRegion, UK_REGIONS } from '@/data/uk-service-areas';

export default function AreasPage() {
  const englandAreas = getServiceAreasByRegion('England');
  const scotlandAreas = getServiceAreasByRegion('Scotland');
  const walesAreas = getServiceAreasByRegion('Wales');
  const niAreas = getServiceAreasByRegion('Northern Ireland');
  
  return (
    <Container maxW="container.xl" py={12}>
      <VStack spacing={8} align="stretch">
        {/* Hero Section */}
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>
            Areas We Cover
          </Heading>
          <Text fontSize="xl" color="gray.600" mb={6}>
            Professional moving and delivery services nationwide across the United Kingdom
          </Text>
          <Text fontSize="lg" mb={6}>
            Speedy Van operates in all major cities and towns across England, Scotland, Wales, and Northern Ireland. 
            From London to Edinburgh, Manchester to Cardiff, we're here to help with your moving needs.
          </Text>
        </Box>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
          <Box textAlign="center" p={6} bg="blue.50" borderRadius="lg">
            <Heading size="2xl" color="blue.600">4</Heading>
            <Text>Countries Covered</Text>
          </Box>
          <Box textAlign="center" p={6} bg="green.50" borderRadius="lg">
            <Heading size="2xl" color="green.600">{ALL_SERVICE_AREAS.length}+</Heading>
            <Text>Cities & Towns</Text>
          </Box>
          <Box textAlign="center" p={6} bg="purple.50" borderRadius="lg">
            <Heading size="2xl" color="purple.600">50,000+</Heading>
            <Text>Happy Customers</Text>
          </Box>
          <Box textAlign="center" p={6} bg="orange.50" borderRadius="lg">
            <Heading size="2xl" color="orange.600">95%</Heading>
            <Text>On-Time Delivery</Text>
          </Box>
        </SimpleGrid>

        {/* Service Areas by Region */}
        <Box>
          <Heading as="h2" size="xl" mb={6}>
            Browse by Region
          </Heading>
          
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>England ({englandAreas.length})</Tab>
              <Tab>Scotland ({scotlandAreas.length})</Tab>
              <Tab>Wales ({walesAreas.length})</Tab>
              <Tab>Northern Ireland ({niAreas.length})</Tab>
            </TabList>

            <TabPanels>
              {/* England */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {englandAreas.map((area) => (
                    <Card key={area.slug} _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
                      <CardBody>
                        <Heading size="md" mb={2}>
                          <Link href={`/areas/${area.slug}`}>
                            {area.name}
                          </Link>
                        </Heading>
                        <Text fontSize="sm" color="gray.600" mb={3}>
                          Population: {(area.population / 1000).toFixed(0)}k
                        </Text>
                        <Button
                          as={Link}
                          href={`/areas/${area.slug}`}
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          width="full"
                        >
                          View Services
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </TabPanel>

              {/* Scotland */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {scotlandAreas.map((area) => (
                    <Card key={area.slug} _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
                      <CardBody>
                        <Heading size="md" mb={2}>
                          <Link href={`/areas/${area.slug}`}>
                            {area.name}
                          </Link>
                        </Heading>
                        <Text fontSize="sm" color="gray.600" mb={3}>
                          Population: {(area.population / 1000).toFixed(0)}k
                        </Text>
                        <Button
                          as={Link}
                          href={`/areas/${area.slug}`}
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          width="full"
                        >
                          View Services
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </TabPanel>

              {/* Wales */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {walesAreas.map((area) => (
                    <Card key={area.slug} _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
                      <CardBody>
                        <Heading size="md" mb={2}>
                          <Link href={`/areas/${area.slug}`}>
                            {area.name}
                          </Link>
                        </Heading>
                        <Text fontSize="sm" color="gray.600" mb={3}>
                          Population: {(area.population / 1000).toFixed(0)}k
                        </Text>
                        <Button
                          as={Link}
                          href={`/areas/${area.slug}`}
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          width="full"
                        >
                          View Services
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </TabPanel>

              {/* Northern Ireland */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {niAreas.map((area) => (
                    <Card key={area.slug} _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
                      <CardBody>
                        <Heading size="md" mb={2}>
                          <Link href={`/areas/${area.slug}`}>
                            {area.name}
                          </Link>
                        </Heading>
                        <Text fontSize="sm" color="gray.600" mb={3}>
                          Population: {(area.population / 1000).toFixed(0)}k
                        </Text>
                        <Button
                          as={Link}
                          href={`/areas/${area.slug}`}
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          width="full"
                        >
                          View Services
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        {/* Services Overview */}
        <Box bg="gray.50" p={8} borderRadius="lg">
          <Heading as="h2" size="xl" mb={6}>
            Our Services Across the UK
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <Box>
              <Heading size="md" mb={2}>🏠 House Removals</Heading>
              <Text>Complete house moving services for all property sizes from £50.</Text>
            </Box>
            <Box>
              <Heading size="md" mb={2}>🚐 Man and Van</Heading>
              <Text>Flexible van hire with professional driver from £25/hour.</Text>
            </Box>
            <Box>
              <Heading size="md" mb={2}>⚡ Same-Day Delivery</Heading>
              <Text>Urgent delivery services across the UK from £50.</Text>
            </Box>
            <Box>
              <Heading size="md" mb={2}>🪑 Furniture Transport</Heading>
              <Text>Safe delivery of furniture and large items from £25/hour.</Text>
            </Box>
            <Box>
              <Heading size="md" mb={2}>🎓 Student Moves</Heading>
              <Text>Affordable moving for students with special rates from £40.</Text>
            </Box>
            <Box>
              <Heading size="md" mb={2}>🏢 Office Relocation</Heading>
              <Text>Professional business moving services from £75/hour.</Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* CTA Section */}
        <Box bg="blue.600" color="white" p={8} borderRadius="lg" textAlign="center">
          <Heading as="h2" size="xl" mb={4}>
            Ready to Book Your Move?
          </Heading>
          <Text fontSize="lg" mb={6}>
            Get an instant quote online or speak to our team. Same-day service available nationwide.
          </Text>
          <Button
            as={Link}
            href="/booking"
            colorScheme="white"
            variant="solid"
            size="lg"
          >
            Book Online Now
          </Button>
        </Box>
      </VStack>
    </Container>
  );
}

