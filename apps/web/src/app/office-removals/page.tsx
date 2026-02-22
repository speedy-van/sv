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
  FiClock,
  FiPhone,
  FiBriefcase,
  FiMonitor,
} from 'react-icons/fi';
import Link from 'next/link';
import Header from '@/components/site/Header';

export default function OfficeRemovalsPage() {
  return (
    <>
      <Header />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero */}
      <Box bgGradient="linear(to-br, gray.800, blue.900, gray.900)" py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge colorScheme="blue" fontSize="md" px={4} py={2} borderRadius="full">
              <HStack spacing={2}>
                <Icon as={FiBriefcase} />
                <Text>Business Relocations</Text>
              </HStack>
            </Badge>

            <Heading as="h1" size={{ base: 'xl', md: '3xl' }} color="white" maxW="900px" lineHeight="shorter">
              Office Removals
              <Text as="span" display="block" color="blue.300">
                Minimal Downtime, Maximum Efficiency
              </Text>
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.300" maxW="700px">
              Professional office relocation service. Desks, IT equipment, filing systems - 
              we move your business with care and speed. Evening and weekend moves available 
              to minimize disruption.
            </Text>

            <HStack spacing={4} pt={4}>
              <Button
                as={Link}
                href="/booking-luxury?service=office-removal"
                size="lg"
                colorScheme="blue"
                rightIcon={<FiTruck />}
              >
                Get Business Quote
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
                { icon: FiClock, text: 'Out-of-Hours Available' },
                { icon: FiMonitor, text: 'IT Equipment Specialists' },
                { icon: FiShield, text: 'Fully Insured' },
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

      {/* What We Move */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Office Equipment We Move
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
            {[
              'Desks & Workstations',
              'Office Chairs',
              'Filing Cabinets',
              'Computers & Monitors',
              'Servers & IT Equipment',
              'Conference Tables',
              'Reception Furniture',
              'Storage Units',
            ].map((item) => (
              <HStack key={item} spacing={3} p={3} bg="gray.800" borderRadius="md">
                <Icon as={FiCheckCircle} color="blue.400" flexShrink={0} />
                <Text color="white" fontWeight="medium">{item}</Text>
              </HStack>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Packages */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Office Removal Packages
          </Heading>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            <Box
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="white">Small Office</Heading>
                    <Text color="gray.400">1-5 Workstations</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.400">from £299</Text>
                    <List spacing={2} color="gray.300">
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />2-man team</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Half day service</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Basic IT handling</ListItem>
                    </List>
                    <Button as={Link} href="/booking-luxury?service=office-removal" colorScheme="blue" w="full">Get Quote</Button>
                  </VStack>
                </CardBody>
              </Card>
            </Box>

            <Box
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card bg="gray.800" borderColor="blue.500" borderWidth="2px" h="full">
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <Badge colorScheme="blue" alignSelf="center">Most Popular</Badge>
                    <Heading size="md" color="white">Medium Office</Heading>
                    <Text color="gray.400">6-20 Workstations</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.400">from £599</Text>
                    <List spacing={2} color="gray.300">
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />3-4 man team</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Full day service</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />IT disconnect/reconnect</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Furniture disassembly</ListItem>
                    </List>
                    <Button as={Link} href="/booking-luxury?service=office-removal" colorScheme="blue" w="full">Get Quote</Button>
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
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="white">Large Office</Heading>
                    <Text color="gray.400">20+ Workstations</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.400">Custom Quote</Text>
                    <List spacing={2} color="gray.300">
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Dedicated team</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Multi-day if needed</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Full project management</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Out-of-hours option</ListItem>
                    </List>
                    <Button as={Link} href="/booking-luxury?service=office-removal" colorScheme="blue" w="full">Get Quote</Button>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Why Choose Us */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Why Businesses Choose Us
          </Heading>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            {[
              { title: 'Minimal Downtime', desc: 'Weekend and evening moves mean your business keeps running.' },
              { title: 'IT Specialists', desc: 'Trained handling of computers, servers, and networking equipment.' },
              { title: 'Project Management', desc: 'Dedicated coordinator for larger moves to ensure smooth execution.' },
              { title: 'Fully Insured', desc: 'Comprehensive cover for all office equipment and furniture.' },
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
                      <Icon as={FiCheckCircle} boxSize={6} color="blue.400" mt={1} flexShrink={0} />
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
      <Box bg="blue.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">Planning an Office Move?</Heading>
            <Text fontSize="lg" color="whiteAlpha.900">
              Get a tailored quote for your business relocation.
            </Text>
            <Flex wrap="wrap" gap={4} justify="center">
              <Button
                as={Link}
                href="/booking-luxury?service=office-removal"
                size="lg"
                colorScheme="cyan"
                rightIcon={<FiTruck />}
              >
                Get Business Quote
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
