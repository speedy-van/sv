'use client';

import { notFound } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Button,
  List,
  ListItem,
  ListIcon,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { CheckCircleIcon, PhoneIcon, CalendarIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { ALL_SERVICE_AREAS, getServiceAreaBySlug, getNearbyServiceAreas } from '@/data/uk-service-areas';
import { ROUTES } from '@/lib/routing';

interface AreaPageProps {
  params: {
    slug: string;
  };
}

export default function AreaPage({ params }: AreaPageProps) {
  const area = getServiceAreaBySlug(params.slug);
  
  if (!area) {
    notFound();
  }
  
  const nearbyAreas = getNearbyServiceAreas(params.slug);
  
  return (
    <Container maxW="container.xl" py={12}>
      <VStack spacing={8} align="stretch">
        {/* Hero Section */}
        <Box textAlign="center">
          <Badge colorScheme="blue" fontSize="md" mb={4}>
            {area.region}
          </Badge>
          <Heading as="h1" size="2xl" mb={4}>
            Man and Van Services in {area.name}
          </Heading>
          <Text fontSize="xl" color="gray.600" mb={6}>
            Professional moving and delivery services from £25/hour
          </Text>
          <HStack justify="center" spacing={4}>
            <Button
              as={Link}
              href={ROUTES.SHARED.BOOKING_LUXURY}
              colorScheme="blue"
              size="lg"
              leftIcon={<CalendarIcon />}
            >
              Book Online Now
            </Button>
            <Button
              as="a"
              href="tel:01202129764"
              variant="outline"
              size="lg"
              leftIcon={<PhoneIcon />}
            >
              Call 01202129764
            </Button>
          </HStack>
        </Box>

        <Divider />

        {/* Description */}
        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Professional Moving Services in {area.name}
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Speedy Van provides fast, reliable, and affordable moving services throughout {area.name} and the surrounding areas in {area.region}. 
            Whether you're moving house, transporting furniture, or need same-day delivery, our experienced team is here to help.
          </Text>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            {area.description}
          </Text>
        </Box>

        {/* Services Grid */}
        <Box>
          <Heading as="h2" size="xl" mb={6}>
            Our Services in {area.name}
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <Card>
              <CardBody>
                <Heading size="md" mb={3}>House Removals</Heading>
                <Text mb={3}>Complete house moving services for all property sizes.</Text>
                <Text fontWeight="bold" color="blue.600">From £50</Text>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Heading size="md" mb={3}>Man and Van</Heading>
                <Text mb={3}>Flexible van hire with professional driver.</Text>
                <Text fontWeight="bold" color="blue.600">From £25/hour</Text>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Heading size="md" mb={3}>Same-Day Delivery</Heading>
                <Text mb={3}>Urgent delivery services across {area.name}.</Text>
                <Text fontWeight="bold" color="blue.600">From £50</Text>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Heading size="md" mb={3}>Furniture Transport</Heading>
                <Text mb={3}>Safe delivery of furniture and large items.</Text>
                <Text fontWeight="bold" color="blue.600">From £25/hour</Text>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Heading size="md" mb={3}>Student Moves</Heading>
                <Text mb={3}>Affordable moving for students with special rates.</Text>
                <Text fontWeight="bold" color="blue.600">From £40</Text>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Heading size="md" mb={3}>Office Relocation</Heading>
                <Text mb={3}>Professional business moving services.</Text>
                <Text fontWeight="bold" color="blue.600">From £75/hour</Text>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Why Choose Us */}
        <Box bg="blue.50" p={8} borderRadius="lg">
          <Heading as="h2" size="xl" mb={6}>
            Why Choose Speedy Van in {area.name}?
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <strong>Fully Insured:</strong> Comprehensive goods-in-transit insurance
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <strong>Experienced Team:</strong> Professional, trained drivers
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <strong>Same-Day Service:</strong> Available for urgent moves
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <strong>Competitive Pricing:</strong> From £25/hour with no hidden fees
              </ListItem>
            </List>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <strong>Online Booking:</strong> Instant quotes and easy booking
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <strong>24/7 Support:</strong> Customer service when you need it
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <strong>Real-Time Tracking:</strong> Know where your items are
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <strong>95% On-Time:</strong> Reliable and punctual service
              </ListItem>
            </List>
          </SimpleGrid>
        </Box>

        {/* Coverage Areas */}
        {nearbyAreas.length > 0 && (
          <Box>
            <Heading as="h2" size="xl" mb={4}>
              We Also Serve Areas Near {area.name}
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
              {nearbyAreas.map((nearbyArea) => (
                <Button
                  key={nearbyArea.slug}
                  as={Link}
                  href={`/areas/${nearbyArea.slug}`}
                  variant="outline"
                  size="sm"
                >
                  {nearbyArea.name}
                </Button>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* FAQ Section */}
        <Box>
          <Heading as="h2" size="xl" mb={6}>
            Frequently Asked Questions
          </Heading>
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading size="md" mb={2}>
                How much does a man and van cost in {area.name}?
              </Heading>
              <Text>
                Our man and van services start from £25/hour in {area.name}. House removals start from £50. 
                Final prices depend on the distance, number of items, and specific requirements. 
                Get an instant quote online or call us for a free estimate.
              </Text>
            </Box>
            
            <Box>
              <Heading size="md" mb={2}>
                Do you offer same-day service in {area.name}?
              </Heading>
              <Text>
                Yes! We offer same-day moving and delivery services across {area.name} and surrounding areas. 
                Subject to availability. Call us on 01202129764 for urgent bookings.
              </Text>
            </Box>
            
            <Box>
              <Heading size="md" mb={2}>
                Are you insured?
              </Heading>
              <Text>
                Yes, all our drivers are fully insured with comprehensive goods-in-transit insurance. 
                Your belongings are protected throughout the entire journey.
              </Text>
            </Box>
            
            <Box>
              <Heading size="md" mb={2}>
                What areas do you cover around {area.name}?
              </Heading>
              <Text>
                We cover {area.name} and all surrounding areas including {area.nearbyAreas.slice(0, 3).join(', ')}, 
                and more. We also provide nationwide services across the entire UK.
              </Text>
            </Box>
          </VStack>
        </Box>

        {/* CTA Section */}
        <Box bg="blue.600" color="white" p={8} borderRadius="lg" textAlign="center">
          <Heading as="h2" size="xl" mb={4}>
            Ready to Book Your Move in {area.name}?
          </Heading>
          <Text fontSize="lg" mb={6}>
            Get an instant quote online or speak to our team. Same-day service available.
          </Text>
          <HStack justify="center" spacing={4}>
            <Button
              as={Link}
              href={ROUTES.SHARED.BOOKING_LUXURY}
              colorScheme="white"
              variant="solid"
              size="lg"
            >
              Book Online Now
            </Button>
            <Button
              as="a"
              href="tel:01202129764"
              variant="outline"
              colorScheme="white"
              size="lg"
            >
              Call Now
            </Button>
          </HStack>
        </Box>
      </VStack>
    </Container>
  );
}

