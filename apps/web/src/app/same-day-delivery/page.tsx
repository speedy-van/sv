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
  Alert,
  AlertIcon,
  Flex,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiStar,
  FiShield,
  FiTruck,
  FiClock,
  FiPhone,
  FiZap,
} from 'react-icons/fi';
import Link from 'next/link';
import Header from '@/components/site/Header';

export default function SameDayDeliveryPage() {
  return (
    <>
      <Header />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero Section */}
      <Box
        bgGradient="linear(to-br, orange.900, red.900, gray.900)"
        py={{ base: 16, md: 24 }}
      >
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge colorScheme="orange" fontSize="md" px={4} py={2} borderRadius="full">
              <HStack spacing={2}>
                <Icon as={FiZap} />
                <Text>Express Service</Text>
              </HStack>
            </Badge>

            <Heading as="h1" size={{ base: 'xl', md: '3xl' }} color="white" maxW="900px" lineHeight="shorter">
              Same Day Delivery
              <Text as="span" display="block" color="orange.300">
                Urgent? We&apos;ve Got You Covered
              </Text>
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.300" maxW="700px">
              Need it today? Our same-day delivery service gets your items where they 
              need to be - fast. Book by 10am for guaranteed same-day collection.
            </Text>

            <Alert status="info" bg="orange.800" borderRadius="md" maxW="500px">
              <AlertIcon color="orange.300" />
              <Text color="white">Book before 10am for same-day collection</Text>
            </Alert>

            <HStack spacing={4} pt={4}>
              <Button
                as={Link}
                href="/booking-luxury?service=same-day"
                size="lg"
                colorScheme="orange"
                rightIcon={<FiZap />}
              >
                Book Same Day
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

            <HStack spacing={8} pt={6} flexWrap="wrap" justify="center">
              {[
                { icon: FiClock, text: 'Collection within 4 hours' },
                { icon: FiShield, text: 'Fully Insured' },
                { icon: FiStar, text: 'Priority Service' },
              ].map((badge) => (
                <HStack key={badge.text} color="whiteAlpha.800">
                  <Icon as={badge.icon} />
                  <Text fontWeight="medium">{badge.text}</Text>
                </HStack>
              ))}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* How It Works */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              How Same Day Delivery Works
            </Heading>
          </Box>

          <Flex wrap="wrap" gap={4} w="full" justify="center">
            {[
              { time: 'By 10am', title: 'Book Online', desc: 'Place your order by 10am for same-day service' },
              { time: '10am-2pm', title: 'We Collect', desc: 'Our driver collects from the pickup address' },
              { time: '2pm-6pm', title: 'In Transit', desc: 'Your item is on its way to the destination' },
              { time: 'By 8pm', title: 'Delivered', desc: 'Item delivered to your chosen address' },
            ].map((item, idx) => (
              <Box 
                key={idx}
                flex={{ base: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' }}
                minW={{ base: '140px', md: '200px' }}
                maxW={{ base: 'calc(50% - 8px)', md: 'calc(25% - 12px)' }}
              >
                <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                  <CardBody>
                    <VStack spacing={3} textAlign="center">
                      <Badge colorScheme="orange">{item.time}</Badge>
                      <Heading size="md" color="white">{item.title}</Heading>
                      <Text color="gray.400" fontSize="sm">{item.desc}</Text>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Pricing */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Same Day Delivery Pricing
            </Heading>
            <Text color="gray.400">
              Express surcharge applies on top of standard delivery rates
            </Text>
          </Box>

          {/* Pricing Cards - Responsive with Flex wrap */}
          <Flex 
            wrap="wrap" 
            gap={6} 
            w="full" 
            justify="center"
          >
            <Box 
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg" color="white">Small Items</Heading>
                    <Text fontSize="3xl" fontWeight="bold" color="orange.400">from £69</Text>
                    <List spacing={2} color="gray.300">
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Boxes, small furniture</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Same-day collection</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Delivery by 8pm</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </Box>

            <Box 
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card bg="gray.800" borderColor="orange.500" borderWidth="2px" h="full">
                <CardBody>
                  <VStack spacing={4}>
                    <Badge colorScheme="orange">Most Popular</Badge>
                    <Heading size="lg" color="white">Large Items</Heading>
                    <Text fontSize="3xl" fontWeight="bold" color="orange.400">from £99</Text>
                    <List spacing={2} color="gray.300">
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Sofas, beds, appliances</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />2-man team</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Priority handling</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </Box>

            <Box 
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg" color="white">Multi-Item</Heading>
                    <Text fontSize="3xl" fontWeight="bold" color="orange.400">from £149</Text>
                    <List spacing={2} color="gray.300">
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Multiple items</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Large van</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Same-day guarantee</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* When to Use */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            When You Need Same Day Delivery
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
            {[
              'Last-minute house move items',
              'Urgent business deliveries',
              'Marketplace purchase - seller only available today',
              'Replacement appliance needed ASAP',
              'Event furniture and equipment',
              'Emergency storage pickup',
            ].map((item) => (
              <HStack key={item} spacing={4} bg="gray.800" p={4} borderRadius="md">
                <Icon as={FiCheckCircle} color="orange.400" />
                <Text color="white">{item}</Text>
              </HStack>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>

      {/* CTA */}
      <Box bg="orange.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">
              Need It Today?
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="600px">
              Book now for same-day collection. Our team is standing by.
            </Text>
            <Flex wrap="wrap" gap={4} justify="center">
              <Button
                as={Link}
                href="/booking-luxury?service=same-day"
                size="lg"
                colorScheme="yellow"
                rightIcon={<FiZap />}
              >
                Book Same Day Delivery
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
            </Flex>
          </VStack>
        </Container>
      </Box>
    </Box>
    </>
  );
}
