'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  List,
  ListItem,
  ListIcon,
  Button,
  Divider,
  Badge,
  Flex,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiStar,
  FiShield,
  FiTruck,
  FiClock,
  FiPhone,
  FiMapPin,
  FiChevronRight,
} from 'react-icons/fi';
import { FaFacebook, FaCouch, FaBed, FaBox } from 'react-icons/fa';
import Link from 'next/link';
import type { LocationData } from './locationData';

interface LocationDeliveryPageProps {
  location: LocationData;
}

export default function LocationDeliveryPage({ location }: LocationDeliveryPageProps) {
  const isRoute = location.serviceType === 'route';
  const isMarketplace = location.serviceType === 'marketplace';

  const bgGradient = isMarketplace
    ? 'linear(to-br, blue.900, purple.900, gray.900)'
    : 'linear(to-br, cyan.900, teal.900, gray.900)';

  const accentColor = isMarketplace ? 'blue' : 'cyan';

  return (
    <Box pt={20} bg="gray.900" minH="100vh">
      {/* Breadcrumbs */}
      <Box bg="gray.800" py={3}>
        <Container maxW="container.xl">
          <Breadcrumb separator={<Icon as={FiChevronRight} color="gray.500" />} fontSize="sm">
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} href="/" color="gray.400" _hover={{ color: 'white' }}>
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} href="/furniture-collection-delivery" color="gray.400" _hover={{ color: 'white' }}>
                Furniture Delivery
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <Text color="white">{location.region}</Text>
            </BreadcrumbItem>
          </Breadcrumb>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box bgGradient={bgGradient} py={{ base: 12, md: 20 }} position="relative" overflow="hidden">
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Badge colorScheme={accentColor} fontSize="md" px={4} py={2} borderRadius="full">
              <HStack spacing={2}>
                <Icon as={FiMapPin} />
                <Text>{location.region}</Text>
              </HStack>
            </Badge>

            <Heading as="h1" size={{ base: 'xl', md: '2xl' }} color="white" lineHeight="shorter">
              {location.h1}
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="whiteAlpha.900" maxW="800px">
              {location.description}
            </Text>

            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                <HStack spacing={1}>
                  <Icon as={FiShield} />
                  <Text>Fully Insured</Text>
                </HStack>
              </Badge>
              <Badge colorScheme="yellow" fontSize="sm" px={3} py={1}>
                <HStack spacing={1}>
                  <Icon as={FiStar} />
                  <Text>5-Star Rated</Text>
                </HStack>
              </Badge>
              <Badge colorScheme="cyan" fontSize="sm" px={3} py={1}>
                <HStack spacing={1}>
                  <Icon as={FiClock} />
                  <Text>Same Day Available</Text>
                </HStack>
              </Badge>
            </HStack>

            <HStack spacing={4} mt={4}>
              <Button
                as={Link}
                href={`/booking-luxury?source=${location.slug}`}
                size="lg"
                colorScheme={accentColor}
                rightIcon={<FiTruck />}
              >
                Get Instant Quote
              </Button>
              <Button
                as="a"
                href="tel:01202129746"
                size="lg"
                variant="outline"
                color="white"
                borderColor="white"
                leftIcon={<FiPhone />}
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                Call Now
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Service Details */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              {isRoute
                ? `Furniture Collection & Delivery: ${location.fromArea} to ${location.toArea}`
                : `${isMarketplace ? 'Marketplace' : 'Furniture'} Collection in ${location.region}`}
            </Heading>
            <Text fontSize="lg" color="gray.400" maxW="700px" mx="auto">
              Professional door-to-door service with fully insured transport
            </Text>
          </Box>

          {/* What We Move */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} w="full">
            {[
              { icon: FaCouch, name: 'Sofas', price: 'from £79' },
              { icon: FaBed, name: 'Beds', price: 'from £79' },
              { icon: FaBox, name: 'Wardrobes', price: 'from £89' },
              { icon: FiTruck, name: 'Appliances', price: 'from £69' },
            ].map((item, idx) => (
              <Card key={idx} bg="gray.800" borderColor="gray.700" borderWidth="1px">
                <CardBody>
                  <VStack spacing={2}>
                    <Icon as={item.icon} boxSize={8} color={`${accentColor}.400`} />
                    <Text fontWeight="bold" color="white">
                      {item.name}
                    </Text>
                    <Text fontSize="sm" color={`${accentColor}.300`}>
                      {item.price}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Popular Routes / Collection Areas */}
      {location.popularRoutes && location.popularRoutes.length > 0 && (
        <Container maxW="container.xl" py={16}>
          <VStack spacing={8}>
            <Box textAlign="center">
              <Heading as="h2" size="xl" mb={4} color="white">
                {isRoute ? 'Popular Routes We Cover' : 'Collection Areas'}
              </Heading>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
              {location.popularRoutes.map((route, idx) => (
                <Card key={idx} bg="gray.800" borderColor="gray.700" borderWidth="1px">
                  <CardBody>
                    <HStack spacing={3}>
                      <Icon as={FiMapPin} color={`${accentColor}.400`} />
                      <Text color="white" fontWeight="medium">
                        {route}
                      </Text>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      )}

      <Divider borderColor="gray.700" />

      {/* Service Features */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Why Choose Speedy Van for {location.region}?
            </Heading>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
            <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
              <CardBody>
                <HStack spacing={4} align="start">
                  <Icon as={FaFacebook} boxSize={8} color="blue.400" mt={1} />
                  <Box>
                    <Heading size="md" color="white" mb={2}>
                      Marketplace Pickup
                    </Heading>
                    <Text color="gray.400">
                      We collect from Facebook Marketplace, Gumtree, and eBay sellers.
                      You don't need to be at the collection address.
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>

            <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
              <CardBody>
                <HStack spacing={4} align="start">
                  <Icon as={FiShield} boxSize={8} color="green.400" mt={1} />
                  <Box>
                    <Heading size="md" color="white" mb={2}>
                      Fully Insured
                    </Heading>
                    <Text color="gray.400">
                      All items covered up to £10,000 during transport.
                      Professional blankets and secure strapping on every job.
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>

            <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
              <CardBody>
                <HStack spacing={4} align="start">
                  <Icon as={FiClock} boxSize={8} color="yellow.400" mt={1} />
                  <Box>
                    <Heading size="md" color="white" mb={2}>
                      Same Day Service
                    </Heading>
                    <Text color="gray.400">
                      Book before 10am for same-day collection and delivery.
                      We work around your schedule.
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>

            <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
              <CardBody>
                <HStack spacing={4} align="start">
                  <Icon as={FiTruck} boxSize={8} color="purple.400" mt={1} />
                  <Box>
                    <Heading size="md" color="white" mb={2}>
                      2-Man Team
                    </Heading>
                    <Text color="gray.400">
                      Professional team for heavy items. We handle stairs,
                      narrow access, and place furniture in your room.
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>

      {/* Nearby Areas */}
      {location.nearbyAreas && location.nearbyAreas.length > 0 && (
        <>
          <Divider borderColor="gray.700" />
          <Container maxW="container.xl" py={16}>
            <VStack spacing={8}>
              <Box textAlign="center">
                <Heading as="h3" size="lg" mb={4} color="white">
                  We Also Cover Nearby Areas
                </Heading>
                <Text color="gray.400">
                  Need delivery to or from these locations? We've got you covered.
                </Text>
              </Box>

              <HStack spacing={4} flexWrap="wrap" justify="center">
                {location.nearbyAreas.map((area, idx) => (
                  <Badge
                    key={idx}
                    colorScheme="gray"
                    fontSize="md"
                    px={4}
                    py={2}
                    borderRadius="full"
                  >
                    {area}
                  </Badge>
                ))}
              </HStack>
            </VStack>
          </Container>
        </>
      )}

      {/* Final CTA */}
      <Box bg={`${accentColor}.900`} py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">
              Ready for {location.region} Furniture Delivery?
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="600px">
              Get an instant quote now. Enter your pickup and delivery postcodes
              for accurate pricing with no hidden fees.
            </Text>
            <HStack spacing={4}>
              <Button
                as={Link}
                href={`/booking-luxury?source=${location.slug}`}
                size="lg"
                colorScheme="yellow"
                rightIcon={<FiTruck />}
              >
                Get Instant Quote
              </Button>
              <Button
                as="a"
                href="tel:01202129746"
                size="lg"
                variant="outline"
                color="white"
                borderColor="white"
                leftIcon={<FiPhone />}
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                01202 129746
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
