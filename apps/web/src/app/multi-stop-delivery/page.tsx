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
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiShield,
  FiTruck,
  FiPhone,
  FiMapPin,
  FiNavigation,
} from 'react-icons/fi';
import Link from 'next/link';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

export default function MultiStopDeliveryPage() {
  return (
    <>
      <Header />
      <MobileHeader />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero */}
      <Box bgGradient="linear(to-br, green.900, teal.900, gray.900)" py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge colorScheme="green" fontSize="md" px={4} py={2} borderRadius="full">
              <HStack spacing={2}>
                <Icon as={FiMapPin} />
                <Text>Multiple Locations</Text>
              </HStack>
            </Badge>

            <Heading as="h1" size={{ base: 'xl', md: '3xl' }} color="white" maxW="900px" lineHeight="shorter">
              Multi-Stop Delivery
              <Text as="span" display="block" color="green.300">
                One Trip, Multiple Destinations
              </Text>
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.300" maxW="700px">
              Multiple pickups, multiple drop-offs, or both - all in one efficient trip. 
              Perfect for marketplace sellers, charity collections, or complex moves.
            </Text>

            <HStack spacing={4} pt={4}>
              <Button
                as={Link}
                href="/booking-luxury?service=multi-stop"
                size="lg"
                colorScheme="green"
                rightIcon={<FiNavigation />}
              >
                Plan Your Route
              </Button>
              <Button
                as="a"
                href="tel:+441202129746"
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

      {/* Use Cases */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            When to Use Multi-Stop Delivery
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
            {[
              { title: 'Marketplace Sellers', desc: 'Selling multiple items? We collect from you and deliver to multiple buyers in one trip.' },
              { title: 'Multiple Purchases', desc: 'Bought items from different sellers? We pick up from each and bring everything to you.' },
              { title: 'Charity Collections', desc: 'Donating to multiple charities or collecting donations from several locations.' },
              { title: 'Business Deliveries', desc: 'Distribute stock, samples, or equipment to multiple locations efficiently.' },
              { title: 'Family Splits', desc: 'Dividing belongings between family members at different addresses.' },
              { title: 'Event Setup', desc: 'Collect equipment from various suppliers and deliver to your venue.' },
            ].map((item) => (
              <Card key={item.title} bg="gray.800" borderColor="gray.700" borderWidth="1px">
                <CardBody>
                  <HStack spacing={4} align="start">
                    <Icon as={FiCheckCircle} boxSize={6} color="green.400" mt={1} />
                    <Box>
                      <Heading size="md" color="white" mb={2}>{item.title}</Heading>
                      <Text color="gray.400">{item.desc}</Text>
                    </Box>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Pricing */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Multi-Stop Pricing
          </Heading>

          {/* Mobile: Stacked cards */}
          <VStack spacing={6} w="full" display={{ base: 'flex', md: 'none' }}>
            {[
              {
                title: '2-3 Stops',
                price: 'from £99',
                features: ['Up to 3 locations', 'Optimized route', 'Single day'],
              },
              {
                title: '4-6 Stops',
                price: 'from £149',
                features: ['Up to 6 locations', 'Route planning', 'Progress updates'],
                popular: true,
              },
              {
                title: '7+ Stops',
                price: 'Custom Quote',
                features: ['Unlimited stops', 'Dedicated driver', 'Full day hire'],
              },
            ].map((pkg) => (
              <Card 
                key={pkg.title} 
                bg="gray.800" 
                borderColor={pkg.popular ? 'green.500' : 'gray.700'} 
                borderWidth={pkg.popular ? '2px' : '1px'}
                w="full"
              >
                <CardBody>
                  <VStack spacing={4}>
                    {pkg.popular && <Badge colorScheme="green">Best Value</Badge>}
                    <Heading size="lg" color="white">{pkg.title}</Heading>
                    <Text fontSize="2xl" fontWeight="bold" color="green.400">{pkg.price}</Text>
                    <List spacing={2} color="gray.300">
                      {pkg.features.map((f) => (
                        <ListItem key={f}>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          {f}
                        </ListItem>
                      ))}
                    </List>
                    <Button as={Link} href="/booking-luxury?service=multi-stop" colorScheme="green" w="full">
                      Get Quote
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>

          {/* Desktop: Side by side */}
          <HStack spacing={8} w="full" display={{ base: 'none', md: 'flex' }} align="stretch">
            {[
              {
                title: '2-3 Stops',
                price: 'from £99',
                features: ['Up to 3 locations', 'Optimized route', 'Single day'],
              },
              {
                title: '4-6 Stops',
                price: 'from £149',
                features: ['Up to 6 locations', 'Route planning', 'Progress updates'],
                popular: true,
              },
              {
                title: '7+ Stops',
                price: 'Custom Quote',
                features: ['Unlimited stops', 'Dedicated driver', 'Full day hire'],
              },
            ].map((pkg) => (
              <Card 
                key={pkg.title} 
                bg="gray.800" 
                borderColor={pkg.popular ? 'green.500' : 'gray.700'} 
                borderWidth={pkg.popular ? '2px' : '1px'}
                flex={1}
              >
                <CardBody>
                  <VStack spacing={4}>
                    {pkg.popular && <Badge colorScheme="green">Best Value</Badge>}
                    <Heading size="lg" color="white">{pkg.title}</Heading>
                    <Text fontSize="2xl" fontWeight="bold" color="green.400">{pkg.price}</Text>
                    <List spacing={2} color="gray.300">
                      {pkg.features.map((f) => (
                        <ListItem key={f}>
                          <ListIcon as={FiCheckCircle} color="green.400" />
                          {f}
                        </ListItem>
                      ))}
                    </List>
                    <Button as={Link} href="/booking-luxury?service=multi-stop" colorScheme="green" w="full">
                      Get Quote
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </HStack>

          <Text color="gray.500" fontSize="sm">
            * Final price depends on total distance, items, and time required. Each additional stop adds 10-15 minutes to route time.
          </Text>
        </VStack>
      </Container>

      {/* CTA */}
      <Box bg="green.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">Got Multiple Stops?</Heading>
            <Text fontSize="lg" color="whiteAlpha.900">
              Enter all your addresses and we&apos;ll optimize the route for you.
            </Text>
            <Button
              as={Link}
              href="/booking-luxury?service=multi-stop"
              size="lg"
              colorScheme="teal"
              rightIcon={<FiNavigation />}
            >
              Plan Your Route
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
    </>
  );
}
