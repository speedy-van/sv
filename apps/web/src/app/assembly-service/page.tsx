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
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiShield,
  FiTruck,
  FiPhone,
  FiTool,
} from 'react-icons/fi';
import Link from 'next/link';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

export default function AssemblyServicePage() {
  return (
    <>
      <Header />
      <MobileHeader />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero */}
      <Box bgGradient="linear(to-br, red.900, orange.900, gray.900)" py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge colorScheme="red" fontSize="md" px={4} py={2} borderRadius="full">
              <HStack spacing={2}>
                <Icon as={FiTool} />
                <Text>Assembly Experts</Text>
              </HStack>
            </Badge>

            <Heading as="h1" size={{ base: 'xl', md: '3xl' }} color="white" maxW="900px" lineHeight="shorter">
              Furniture Assembly Service
              <Text as="span" display="block" color="red.300">
                We Build It So You Don&apos;t Have To
              </Text>
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.300" maxW="700px">
              Need flatpack furniture assembled? Want us to disassemble for a move and 
              reassemble at destination? Our skilled team handles IKEA, Argos, and all brands.
            </Text>

            <HStack spacing={4} pt={4}>
              <Button
                as={Link}
                href="/booking-luxury?service=assembly"
                size="lg"
                colorScheme="red"
                rightIcon={<FiTool />}
              >
                Book Assembly
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

      {/* Services */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Assembly Services
          </Heading>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            {[
              {
                title: 'Flatpack Assembly',
                price: 'from £35/item',
                desc: 'IKEA, Argos, Amazon - we build it all.',
                features: ['Any brand', 'Tools included', 'Packaging removed'],
              },
              {
                title: 'Disassembly',
                price: 'from £25/item',
                desc: 'Taking furniture apart for moving or disposal.',
                features: ['Careful handling', 'Parts organized', 'Ready for transport'],
              },
              {
                title: 'Delivery + Assembly',
                price: 'from £99',
                desc: 'We deliver and build - complete service.',
                features: ['Collect flatpack', 'Deliver to you', 'Fully assembled'],
                popular: true,
              },
            ].map((service) => (
              <Box
                key={service.title}
                flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
                maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
                minW={{ base: '280px', md: '280px' }}
              >
                <Card 
                  bg="gray.800" 
                  borderColor={service.popular ? 'red.500' : 'gray.700'} 
                  borderWidth={service.popular ? '2px' : '1px'}
                  h="full"
                >
                  <CardBody>
                    <VStack spacing={4}>
                      {service.popular && <Badge colorScheme="red">Complete Package</Badge>}
                      <Heading size="lg" color="white">{service.title}</Heading>
                      <Text fontSize="2xl" fontWeight="bold" color="red.400">{service.price}</Text>
                      <Text color="gray.400" textAlign="center">{service.desc}</Text>
                      <List spacing={2} color="gray.300">
                        {service.features.map((f) => (
                          <ListItem key={f}>
                            <ListIcon as={FiCheckCircle} color="green.400" />
                            {f}
                          </ListItem>
                        ))}
                      </List>
                      <Button as={Link} href="/booking-luxury?service=assembly" colorScheme="red" w="full">
                        Book Now
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* What We Assemble */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Items We Assemble
          </Heading>
          <Flex wrap="wrap" gap={3} justify="center" w="full">
            {[
              'Beds & Bed Frames',
              'Wardrobes',
              'Chest of Drawers',
              'Desks',
              'Dining Tables',
              'Bookshelves',
              'TV Units',
              'Garden Furniture',
            ].map((item) => (
              <Box
                key={item}
                bg="gray.800"
                borderColor="gray.700"
                borderWidth="1px"
                borderRadius="lg"
                p={3}
                flex={{ base: '1 1 calc(50% - 6px)', md: '1 1 calc(25% - 9px)' }}
                minW={{ base: '140px', md: '180px' }}
                maxW={{ base: 'calc(50% - 6px)', md: '220px' }}
              >
                <HStack spacing={2}>
                  <Icon as={FiCheckCircle} color="red.400" flexShrink={0} />
                  <Text color="white" fontWeight="medium" fontSize="sm">{item}</Text>
                </HStack>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Why Us */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Why Choose Our Assembly Service?
          </Heading>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            {[
              { title: 'Experienced Builders', desc: 'Our team assembles hundreds of items each month. We know the tricks.' },
              { title: 'All Tools Provided', desc: 'No need to hunt for an Allen key - we bring everything.' },
              { title: 'Packaging Removed', desc: 'We take away all the cardboard and packaging when we leave.' },
              { title: 'Satisfaction Guaranteed', desc: 'Not happy? We\'ll fix it or refund. Simple as that.' },
            ].map((item) => (
              <Box
                key={item.title}
                flex={{ base: '1 1 100%', md: '1 1 calc(50% - 12px)' }}
                maxW={{ base: '100%', md: 'calc(50% - 12px)' }}
                minW={{ base: '280px', md: '280px' }}
              >
                <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                  <CardBody>
                    <HStack spacing={4} align="start">
                      <Icon as={FiCheckCircle} boxSize={6} color="red.400" mt={1} flexShrink={0} />
                      <Box>
                        <Heading size="md" color="white" mb={2}>{item.title}</Heading>
                        <Text color="gray.400">{item.desc}</Text>
                      </Box>
                    </HStack>
                  </CardBody>
                </Card>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      {/* CTA */}
      <Box bg="red.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">Hate Flatpack?</Heading>
            <Text fontSize="lg" color="whiteAlpha.900">
              Let us do the building. Book assembly today.
            </Text>
            <Button
              as={Link}
              href="/booking-luxury?service=assembly"
              size="lg"
              colorScheme="orange"
              rightIcon={<FiTool />}
            >
              Book Assembly Service
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
    </>
  );
}
