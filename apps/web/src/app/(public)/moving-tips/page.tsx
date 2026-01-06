/**
 * Moving Tips Page
 * 
 * SEO-optimized page with expert moving tips and advice
 * Target keywords: "moving tips", "moving advice", "how to move house"
 */

'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Card,
  CardBody,
  List,
  ListItem,
  ListIcon,
  Button,
  Divider,
  Badge,
  Flex,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiTruck,
  FiPhone,
  FiBox,
  FiDownload,
  FiArrowRight,
} from 'react-icons/fi';
import Link from 'next/link';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';
import { ROUTES } from '@/lib/routing';

const quickTips = [
  {
    icon: '📦',
    title: 'Label Everything',
    description: 'Mark boxes with room names and contents. Use color coding for easy identification.',
  },
  {
    icon: '📸',
    title: 'Take Photos',
    description: 'Photograph electronics setup and valuable items before disconnecting.',
  },
  {
    icon: '🧹',
    title: 'Declutter First',
    description: 'Donate, sell, or discard items you no longer need before packing.',
  },
  {
    icon: '📅',
    title: 'Book Early',
    description: 'Reserve your moving date 4-8 weeks in advance for best rates.',
  },
  {
    icon: '🔌',
    title: 'Protect Electronics',
    description: 'Use original boxes if possible, or wrap well with bubble wrap.',
  },
  {
    icon: '🏠',
    title: 'Measure Doorways',
    description: 'Check that large furniture will fit through doors at new home.',
  },
];

const moneySavingTips = [
  {
    title: 'Move Mid-Week',
    description: 'Weekday moves are typically 20-30% cheaper than weekends.',
  },
  {
    title: 'Move Off-Season',
    description: 'Avoid summer months (June-August) when demand is highest.',
  },
  {
    title: 'Get Multiple Quotes',
    description: 'Compare at least 3 quotes to ensure competitive pricing.',
  },
  {
    title: 'Pack Yourself',
    description: 'Self-packing can save £200-500 on professional packing services.',
  },
  {
    title: 'Use Free Boxes',
    description: 'Ask local shops for used boxes or check online marketplaces.',
  },
  {
    title: 'Declutter Beforehand',
    description: 'Less to move means lower costs. Sell items to offset moving expenses.',
  },
];

export default function MovingTipsPage() {
  return (
    <>
      <Header />
      <MobileHeader />
      <Box pt={{ base: 20, md: 24 }} bg="gray.900" minH="100vh">
        {/* Hero Section */}
        <Box bgGradient="linear(to-br, blue.900, blue.800, gray.900)" py={{ base: 16, md: 24 }}>
          <Container maxW="container.xl">
            <VStack spacing={8} textAlign="center">
              <Badge colorScheme="blue" fontSize="md" px={4} py={2} borderRadius="full">
                <HStack spacing={2}>
                  <Icon as={FiBox} />
                  <Text>Expert Moving Guide</Text>
                </HStack>
              </Badge>

              <Heading as="h1" size={{ base: 'xl', md: '3xl' }} color="white" maxW="900px" lineHeight="shorter">
                Expert Moving Tips & Advice
                <Text as="span" display="block" color="blue.300">
                  From Professional Movers
                </Text>
              </Heading>

              <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.300" maxW="700px">
                Professional tips from experienced movers to make your relocation smooth and stress-free
              </Text>

              <HStack spacing={4} pt={4} flexWrap="wrap" justify="center">
                <Button
                  as={Link}
                  href={ROUTES.SHARED.BOOKING_LUXURY}
                  size="lg"
                  colorScheme="blue"
                  rightIcon={<FiTruck />}
                >
                  Get Moving Quote
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

        {/* Quick Tips Grid */}
        <Container maxW="container.xl" py={16}>
          <VStack spacing={12}>
            <Heading as="h2" size="xl" color="white" textAlign="center">
              Quick Moving Tips
            </Heading>

            <Flex wrap="wrap" gap={6} w="full" justify="center">
              {quickTips.map((tip, index) => (
                <Box
                  key={index}
                  flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
                  maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
                  minW={{ base: '280px', md: '280px' }}
                >
                  <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full" _hover={{ borderColor: 'blue.500', transform: 'translateY(-4px)', transition: 'all 0.3s' }}>
                    <CardBody>
                      <VStack spacing={4} align="start">
                        <Text fontSize="4xl">{tip.icon}</Text>
                        <Heading size="md" color="white">{tip.title}</Heading>
                        <Text color="gray.400">{tip.description}</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </Box>
              ))}
            </Flex>
          </VStack>
        </Container>

        <Divider borderColor="gray.700" />

        {/* Complete Moving Guide */}
        <Container maxW="container.lg" py={16}>
          <VStack spacing={12} align="stretch">
            <Heading as="h2" size="xl" color="white" textAlign="center">
              Complete Moving Guide
            </Heading>

            {/* Before Moving Day */}
            <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <HStack>
                    <Flex
                      bg="blue.600"
                      color="white"
                      borderRadius="full"
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      1
                    </Flex>
                    <Heading size="lg" color="white">Before Moving Day</Heading>
                  </HStack>

                  <Box pl={{ base: 0, md: 14 }}>
                    <VStack spacing={4} align="stretch">
                      <Box borderLeft="4px solid" borderColor="blue.500" pl={4}>
                        <Heading size="sm" color="white" mb={2}>Start Early (8 Weeks Before)</Heading>
                        <List spacing={1} color="gray.400" fontSize="sm">
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Create a moving timeline and checklist</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Research and book your moving company</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Start decluttering - donate or sell unwanted items</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Notify your landlord if renting</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Begin collecting packing materials</ListItem>
                        </List>
                      </Box>

                      <Box borderLeft="4px solid" borderColor="blue.500" pl={4}>
                        <Heading size="sm" color="white" mb={2}>6 Weeks Before</Heading>
                        <List spacing={1} color="gray.400" fontSize="sm">
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Update your address with banks, utilities, and subscriptions</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Arrange school transfers for children</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Book time off work for moving day</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Order packing supplies</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Start packing non-essential items</ListItem>
                        </List>
                      </Box>

                      <Box borderLeft="4px solid" borderColor="blue.500" pl={4}>
                        <Heading size="sm" color="white" mb={2}>2 Weeks Before</Heading>
                        <List spacing={1} color="gray.400" fontSize="sm">
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Confirm moving company booking</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Arrange utilities connection at new home</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Pack most rooms except essentials</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Use up frozen food</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Arrange pet care for moving day</ListItem>
                        </List>
                      </Box>
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Packing Like a Pro */}
            <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <HStack>
                    <Flex
                      bg="green.600"
                      color="white"
                      borderRadius="full"
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      2
                    </Flex>
                    <Heading size="lg" color="white">Packing Like a Pro</Heading>
                  </HStack>

                  <Box pl={{ base: 0, md: 14 }}>
                    <VStack spacing={4} align="stretch">
                      <Box bg="green.900" p={4} borderRadius="lg">
                        <Heading size="sm" color="white" mb={2}>Essential Packing Supplies</Heading>
                        <List spacing={1} color="gray.300" fontSize="sm">
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Sturdy cardboard boxes (various sizes)</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Bubble wrap and packing paper</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Strong packing tape</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Permanent markers for labeling</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Furniture blankets and covers</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Plastic bags for small items</ListItem>
                        </List>
                      </Box>

                      <Box borderLeft="4px solid" borderColor="green.500" pl={4}>
                        <Heading size="sm" color="white" mb={2}>Room-by-Room Packing Strategy</Heading>
                        <List spacing={1} color="gray.400" fontSize="sm">
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" /><strong>Kitchen:</strong> Pack dishes vertically, wrap fragile items individually</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" /><strong>Bedroom:</strong> Use wardrobe boxes for hanging clothes</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" /><strong>Bathroom:</strong> Seal liquids with plastic wrap under caps</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" /><strong>Living Room:</strong> Disassemble furniture, keep screws in labeled bags</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" /><strong>Office:</strong> Back up computer data, pack electronics separately</ListItem>
                        </List>
                      </Box>

                      <Box bg="yellow.900" p={4} borderRadius="lg" borderLeft="4px solid" borderColor="yellow.500">
                        <Heading size="sm" color="white" mb={2}>⚠️ Pro Tip: The "First Night" Box</Heading>
                        <Text color="gray.300" fontSize="sm">
                          Pack a separate box with essentials you'll need immediately: toiletries, change of clothes, 
                          phone chargers, basic kitchen items, important documents, and medications. Label it clearly 
                          and load it last so it's first off the van.
                        </Text>
                      </Box>
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Moving Day */}
            <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <HStack>
                    <Flex
                      bg="orange.600"
                      color="white"
                      borderRadius="full"
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      3
                    </Flex>
                    <Heading size="lg" color="white">Moving Day</Heading>
                  </HStack>

                  <Box pl={{ base: 0, md: 14 }}>
                    <VStack spacing={4} align="stretch">
                      <Box borderLeft="4px solid" borderColor="orange.500" pl={4}>
                        <Heading size="sm" color="white" mb={2}>Morning Checklist</Heading>
                        <List spacing={1} color="gray.400" fontSize="sm">
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Do a final walkthrough of your old home</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Check all cupboards, drawers, and storage spaces</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Take meter readings (gas, electric, water)</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Have cash ready for tipping movers</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Keep important documents with you</ListItem>
                        </List>
                      </Box>

                      <Box borderLeft="4px solid" borderColor="orange.500" pl={4}>
                        <Heading size="sm" color="white" mb={2}>During the Move</Heading>
                        <List spacing={1} color="gray.400" fontSize="sm">
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Stay available to answer questions</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Direct movers on furniture placement</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Check items as they're loaded/unloaded</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Keep pets and children in a safe area</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Take photos of valuable items before moving</ListItem>
                        </List>
                      </Box>
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Settling In */}
            <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <HStack>
                    <Flex
                      bg="purple.600"
                      color="white"
                      borderRadius="full"
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      4
                    </Flex>
                    <Heading size="lg" color="white">Settling Into Your New Home</Heading>
                  </HStack>

                  <Box pl={{ base: 0, md: 14 }}>
                    <VStack spacing={4} align="stretch">
                      <Box borderLeft="4px solid" borderColor="purple.500" pl={4}>
                        <Heading size="sm" color="white" mb={2}>First Day Priorities</Heading>
                        <List spacing={1} color="gray.400" fontSize="sm">
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Check all utilities are working</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Test smoke alarms and carbon monoxide detectors</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Locate the stopcock and fuse box</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Unpack essential items first</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Make beds and set up bathroom</ListItem>
                        </List>
                      </Box>

                      <Box borderLeft="4px solid" borderColor="purple.500" pl={4}>
                        <Heading size="sm" color="white" mb={2}>First Week Tasks</Heading>
                        <List spacing={1} color="gray.400" fontSize="sm">
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Register with local GP and dentist</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Update your driving license address</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Register to vote at new address</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Introduce yourself to neighbors</ListItem>
                          <ListItem><ListIcon as={FiCheckCircle} color="green.400" />Explore your new neighborhood</ListItem>
                        </List>
                      </Box>
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Container>

        <Divider borderColor="gray.700" />

        {/* Money-Saving Tips */}
        <Container maxW="container.xl" py={16}>
          <VStack spacing={12}>
            <Heading as="h2" size="xl" color="white" textAlign="center">
              Money-Saving Moving Tips
            </Heading>

            <Flex wrap="wrap" gap={6} w="full" justify="center">
              {moneySavingTips.map((tip, index) => (
                <Box
                  key={index}
                  flex={{ base: '1 1 100%', md: '1 1 calc(50% - 12px)' }}
                  maxW={{ base: '100%', md: 'calc(50% - 12px)' }}
                  minW={{ base: '280px', md: '280px' }}
                >
                  <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                    <CardBody>
                      <HStack spacing={4} align="start">
                        <Text fontSize="2xl">💰</Text>
                        <Box>
                          <Heading size="md" color="white" mb={2}>{tip.title}</Heading>
                          <Text color="gray.400" fontSize="sm">{tip.description}</Text>
                        </Box>
                      </HStack>
                    </CardBody>
                  </Card>
                </Box>
              ))}
            </Flex>
          </VStack>
        </Container>

        {/* CTA Section */}
        <Box bg="blue.900" py={16}>
          <Container maxW="container.xl">
            <VStack spacing={6} textAlign="center">
              <Heading as="h2" size="xl" color="white">Ready to Move?</Heading>
              <Text fontSize="lg" color="whiteAlpha.900">
                Get an instant quote and book your move in minutes
              </Text>
              <Flex gap={4} flexWrap="wrap" justify="center">
                <Button
                  as={Link}
                  href={ROUTES.SHARED.BOOKING_LUXURY}
                  size="lg"
                  colorScheme="blue"
                  bg="white"
                  color="blue.600"
                  rightIcon={<FiArrowRight />}
                  _hover={{ bg: 'blue.50' }}
                >
                  Get Instant Quote
                </Button>
                <Button
                  as={Link}
                  href="/checklist"
                  size="lg"
                  variant="outline"
                  color="white"
                  borderColor="white"
                  borderWidth="2px"
                  leftIcon={<FiDownload />}
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  Download Free Checklist
                </Button>
              </Flex>
            </VStack>
          </Container>
        </Box>
      </Box>
    </>
  );
}

