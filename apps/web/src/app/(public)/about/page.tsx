'use client';

import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Avatar,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { JsonLd } from './metadata';
import AnalyticsConsentGate from './AnalyticsConsentGate';
import HeaderButton from '@/components/common/HeaderButton';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';
import { ROUTES } from '@/lib/routing';
import { 
  FiCheckCircle, 
  FiShield, 
  FiTruck, 
  FiMapPin, 
  FiAward, 
  FiUsers,
  FiClock,
  FiBox,
  FiPackage,
  FiZap,
  FiTarget,
  FiHeart,
  FiTrendingUp,
  FiStar,
  FiMail,
  FiPhone
} from 'react-icons/fi';

export default function AboutPage() {
  return (
    <Box bg="#0D0D0D" minH="100vh">
      <Header />
      <MobileHeader />
      <AnalyticsConsentGate />
      <JsonLd />
      
      {/* Hero Section with Gradient */}
      <Box
        bgGradient="linear(to-br, #0D0D0D, #1a1a2e)"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(0,194,255,0.1), transparent 50%)',
          pointerEvents: 'none',
        }}
      >
        <Container maxW="6xl" py={{ base: 20, md: 32 }} mt={{ base: 12, md: 16 }}>
          <VStack spacing={6} align="start" maxW="3xl">
            <Badge 
              colorScheme="blue" 
              fontSize="sm" 
              px={3} 
              py={1}
              borderRadius="full"
              bg="rgba(0,194,255,0.1)"
              color="neon.400"
              border="1px solid"
              borderColor="rgba(0,194,255,0.3)"
            >
              About Speedy Van
            </Badge>
            <Heading 
              as="h1" 
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="bold"
              color="white"
              lineHeight="1.2"
            >
              Reliable moves and deliveries
              <Text as="span" color="neon.400"> across the UK</Text>
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.400" maxW="2xl">
              Instant quotes, vetted drivers, live tracking—no hidden fees. We make moving simple.
            </Text>
            <HStack spacing={4} pt={4} flexWrap="wrap">
              <Button
                as={Link}
                href={ROUTES.SHARED.BOOKING_LUXURY}
                size="lg"
                bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                color="white"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(0,194,255,0.4)',
                }}
                borderRadius="xl"
                fontWeight="semibold"
                transition="all 0.3s ease"
                leftIcon={<FiZap />}
              >
                Get Instant Quote
              </Button>
              <Button
                as={Link}
                href="/track"
                size="lg"
                variant="outline"
                borderColor="rgba(255,255,255,0.2)"
                color="white"
                _hover={{
                  borderColor: "neon.400",
                  color: "neon.400",
                  bg: "rgba(0,194,255,0.05)",
                }}
              >
                Track Booking
              </Button>
            </HStack>
            <HStack spacing={6} pt={4} flexWrap="wrap">
              <HStack spacing={2}>
                <Icon as={FiShield} color="green.400" boxSize={5} />
                <Text color="gray.300" fontSize="sm">Fully Insured</Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FiMapPin} color="blue.400" boxSize={5} />
                <Text color="gray.300" fontSize="sm">Live Tracking</Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FiAward} color="purple.400" boxSize={5} />
                <Text color="gray.300" fontSize="sm">UK-based Support</Text>
              </HStack>
            </HStack>
          </VStack>
        </Container>
      </Box>

      <Container maxW="6xl" py={{ base: 12, md: 16 }}>
        {/* Stats Section */}
        <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={6} mb={20}>
          {[
            { label: 'On-time Delivery', value: '98.4%', icon: FiClock, color: 'green.400' },
            { label: 'Jobs Completed', value: '12,000+', icon: FiTruck, color: 'blue.400' },
            { label: 'Average Rating', value: '4.9/5', icon: FiStar, color: 'yellow.400' },
            { label: 'Customer NPS', value: '+72', icon: FiTrendingUp, color: 'purple.400' },
          ].map(s => (
            <Box
              key={s.label}
              p={6}
              bg="rgba(255,255,255,0.03)"
              border="1px solid"
              borderColor="rgba(255,255,255,0.1)"
              borderRadius="xl"
              transition="all 0.3s ease"
              _hover={{
                bg: "rgba(255,255,255,0.05)",
                borderColor: "rgba(0,194,255,0.3)",
                transform: "translateY(-4px)",
              }}
            >
              <Icon as={s.icon} color={s.color} boxSize={8} mb={3} />
              <Text fontSize="3xl" fontWeight="bold" color="white">
                {s.value}
              </Text>
              <Text color="gray.400" fontSize="sm">
                {s.label}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        {/* Our Story & What We Do */}
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={12} mb={20}>
          <GridItem>
            <VStack align="start" spacing={4}>
              <Badge colorScheme="blue" fontSize="xs" px={3} py={1}>Our Story</Badge>
              <Heading size="lg" color="white">
                Built for a better moving experience
              </Heading>
              <Text color="gray.400" fontSize="md" lineHeight="tall">
                Speedy Van started with a simple idea: moving and deliveries
                shouldn't be stressful. We saw friends and small businesses struggle
                with slow quotes and no visibility.
              </Text>
              <Text color="gray.400" fontSize="md" lineHeight="tall">
                So we built a better way—instant, transparent quotes, vetted drivers, 
                and live tracking from pickup to drop-off. Today, we help people and 
                businesses across the UK move faster and with confidence.
              </Text>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack align="start" spacing={4} mb={6}>
              <Badge colorScheme="purple" fontSize="xs" px={3} py={1}>What We Do</Badge>
              <Heading size="lg" color="white">
                Services that move with you
              </Heading>
            </VStack>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
              {[
                { 
                  title: 'Man and Van', 
                  desc: 'Affordable moves for rooms, flats, and small offices.',
                  icon: FiTruck,
                  color: 'blue.400'
                },
                { 
                  title: 'Removals', 
                  desc: 'From single items to full-home moves with care.',
                  icon: FiBox,
                  color: 'green.400'
                },
                { 
                  title: 'Same‑day Delivery', 
                  desc: 'Urgent deliveries with real-time tracking.',
                  icon: FiZap,
                  color: 'yellow.400'
                },
                { 
                  title: 'Business Logistics', 
                  desc: 'On-demand van fleet for e‑commerce and retail.',
                  icon: FiPackage,
                  color: 'purple.400'
                },
              ].map(service => (
                <Box 
                  key={service.title}
                  p={5} 
                  bg="rgba(255,255,255,0.03)"
                  border="1px solid"
                  borderColor="rgba(255,255,255,0.1)"
                  borderRadius="xl"
                  transition="all 0.3s ease"
                  _hover={{
                    bg: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(0,194,255,0.3)",
                    transform: "translateY(-4px)",
                  }}
                >
                  <Icon as={service.icon} color={service.color} boxSize={6} mb={3} />
                  <Heading size="sm" color="white" mb={2}>{service.title}</Heading>
                  <Text color="gray.400" fontSize="sm">
                    {service.desc}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </GridItem>
        </Grid>

        {/* How We Work */}
        <Box mb={20}>
          <VStack align="start" spacing={4} mb={8}>
            <Badge colorScheme="green" fontSize="xs" px={3} py={1}>The Process</Badge>
            <Heading size="lg" color="white">
              Simple steps from booking to delivery
            </Heading>
          </VStack>
          <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={6}>
            {[
              {
                step: '1',
                title: 'Book',
                desc: 'Get a price and book online in minutes.',
                icon: FiCheckCircle,
                color: 'blue.400'
              },
              {
                step: '2',
                title: 'Assign',
                desc: 'We match you with a vetted, insured driver.',
                icon: FiUsers,
                color: 'green.400'
              },
              {
                step: '3',
                title: 'Track',
                desc: 'Live updates and ETA from pickup to drop-off.',
                icon: FiMapPin,
                color: 'yellow.400'
              },
              {
                step: '4',
                title: 'Deliver',
                desc: 'On-time delivery and proof of completion.',
                icon: FiTarget,
                color: 'purple.400'
              },
            ].map((item) => (
              <Box 
                key={item.step} 
                p={6} 
                bg="rgba(255,255,255,0.03)"
                border="1px solid"
                borderColor="rgba(255,255,255,0.1)"
                borderRadius="xl"
                position="relative"
                transition="all 0.3s ease"
                _hover={{
                  bg: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(0,194,255,0.3)",
                  transform: "translateY(-4px)",
                }}
              >
                <Badge 
                  position="absolute"
                  top={4}
                  right={4}
                  colorScheme="blue"
                  fontSize="xs"
                  px={2}
                  py={1}
                >
                  {item.step}
                </Badge>
                <Icon as={item.icon} color={item.color} boxSize={8} mb={4} />
                <Heading size="sm" color="white" mb={2}>{item.title}</Heading>
                <Text color="gray.400" fontSize="sm">
                  {item.desc}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* Values */}
        <Box mb={20}>
          <VStack align="start" spacing={4} mb={8}>
            <Badge colorScheme="purple" fontSize="xs" px={3} py={1}>Our Values</Badge>
            <Heading size="lg" color="white">
              What drives us every day
            </Heading>
          </VStack>
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
            {[
              {
                title: 'On time, every time',
                desc: 'We plan ahead and communicate clearly to hit your deadlines.',
                icon: FiClock,
                color: 'green.400'
              },
              {
                title: 'People first',
                desc: 'Careful handling, respectful drivers, and responsive support.',
                icon: FiHeart,
                color: 'red.400'
              },
              {
                title: 'Transparent pricing',
                desc: 'No hidden fees, clear quotes, and fair pricing every time.',
                icon: FiCheckCircle,
                color: 'blue.400'
              },
            ].map(v => (
              <Box 
                key={v.title} 
                p={6} 
                bg="rgba(255,255,255,0.03)"
                border="1px solid"
                borderColor="rgba(255,255,255,0.1)"
                borderRadius="xl"
                transition="all 0.3s ease"
                _hover={{
                  bg: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(0,194,255,0.3)",
                  transform: "translateY(-4px)",
                }}
              >
                <Icon as={v.icon} color={v.color} boxSize={8} mb={4} />
                <Heading size="sm" color="white" mb={2}>{v.title}</Heading>
                <Text color="gray.400" fontSize="sm">{v.desc}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* Coverage & Fleet */}
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={12} mb={20}>
          <GridItem>
            <VStack align="start" spacing={4}>
              <Badge colorScheme="cyan" fontSize="xs" px={3} py={1}>Coverage</Badge>
              <Heading size="lg" color="white">
                UK-wide service with local expertise
              </Heading>
              <Text color="gray.400" lineHeight="tall">
                Greater London, Glasgow, and UK coverage for longer routes. 
                We optimize routes and group jobs where possible to reduce emissions.
              </Text>
              <HStack spacing={3} flexWrap="wrap">
                <Badge bg="rgba(0,194,255,0.1)" color="neon.400" px={3} py={1}>Hire & Reward</Badge>
                <Badge bg="rgba(0,194,255,0.1)" color="neon.400" px={3} py={1}>DVLA checked</Badge>
                <Badge bg="rgba(0,194,255,0.1)" color="neon.400" px={3} py={1}>MOT certified</Badge>
              </HStack>
            </VStack>
          </GridItem>
          <GridItem>
            <VStack align="start" spacing={4} mb={6}>
              <Badge colorScheme="orange" fontSize="xs" px={3} py={1}>Our Fleet</Badge>
              <Heading size="lg" color="white">
                Right van for every job
              </Heading>
            </VStack>
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
              {[
                { name: 'Small', payload: 'up to ~600kg', icon: FiTruck },
                { name: 'LWB', payload: 'up to ~1200kg', icon: FiTruck },
                { name: 'Luton', payload: 'up to ~1000kg', icon: FiTruck },
              ].map(v => (
                <Box 
                  key={v.name} 
                  p={4} 
                  bg="rgba(255,255,255,0.03)"
                  border="1px solid"
                  borderColor="rgba(255,255,255,0.1)"
                  borderRadius="lg"
                  textAlign="center"
                  transition="all 0.3s ease"
                  _hover={{
                    bg: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(0,194,255,0.3)",
                  }}
                >
                  <Icon as={v.icon} color="neon.400" boxSize={6} mb={2} mx="auto" />
                  <Heading size="xs" color="white" mb={1}>{v.name}</Heading>
                  <Text color="gray.500" fontSize="xs">{v.payload}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </GridItem>
        </Grid>

        {/* Testimonials */}
        <Box mb={20}>
          <VStack align="start" spacing={4} mb={8}>
            <Badge colorScheme="yellow" fontSize="xs" px={3} py={1}>Testimonials</Badge>
            <Heading size="lg" color="white">
              What our customers say
            </Heading>
          </VStack>
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
            {[
              {
                name: 'Amira, London',
                quote: 'Super quick and careful with our flat move. Highly recommend!',
                rating: 5
              },
              {
                name: 'Tom, Glasgow',
                quote: 'Same‑day delivery arrived on time. Great communication throughout.',
                rating: 5
              },
              {
                name: 'Sophie, Bristol',
                quote: 'Transparent pricing and friendly driver. Will use again.',
                rating: 5
              },
            ].map(t => (
              <Box 
                key={t.name} 
                p={6} 
                bg="rgba(255,255,255,0.03)"
                border="1px solid"
                borderColor="rgba(255,255,255,0.1)"
                borderRadius="xl"
                transition="all 0.3s ease"
                _hover={{
                  bg: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(0,194,255,0.3)",
                  transform: "translateY(-4px)",
                }}
              >
                <HStack mb={3}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Icon key={i} as={FiStar} color="yellow.400" boxSize={4} />
                  ))}
                </HStack>
                <Text color="gray.300" mb={4} fontStyle="italic">"{t.quote}"</Text>
                <HStack>
                  <Avatar size="sm" name={t.name} bg="neon.400" color="black" />
                  <Text color="gray.400" fontSize="sm">{t.name}</Text>
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* Sustainability */}
        <Box mb={20} p={8} bg="rgba(0,194,255,0.05)" borderRadius="2xl" border="1px solid" borderColor="rgba(0,194,255,0.2)">
          <HStack spacing={4} mb={4}>
            <Icon as={FiTarget} color="green.400" boxSize={8} />
            <VStack align="start" spacing={1}>
              <Heading size="md" color="white">
                Committed to sustainability
              </Heading>
              <Text color="gray.400">
                Reducing our carbon footprint one delivery at a time
              </Text>
            </VStack>
          </HStack>
          <Text color="gray.300" lineHeight="tall">
            We reduce empty miles with smart routing and job grouping. Where possible, 
            we reuse packing materials and recommend the right van size to cut emissions. 
            Our mission is to make every move as eco-friendly as possible.
          </Text>
        </Box>

        {/* Company Info */}
        <Box mb={20}>
          <VStack align="start" spacing={4} mb={6}>
            <Badge colorScheme="gray" fontSize="xs" px={3} py={1}>Company Information</Badge>
            <Heading size="lg" color="white">
              Press & legal
            </Heading>
          </VStack>
          <Box 
            p={6} 
            bg="rgba(255,255,255,0.03)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.1)"
            borderRadius="xl"
          >
            <VStack align="start" spacing={3}>
              <Text color="white" fontWeight="semibold" fontSize="lg">
                SPEEDY VAN REMOVALS LTD
              </Text>
              <Text color="gray.400" fontSize="sm">
                Company No. SC865658 · Private Limited by Shares
              </Text>
              <Text color="gray.400" fontSize="sm">
                Registered in Scotland · Companies House
              </Text>
              <Text color="gray.400" fontSize="sm">
                Registered address: Office 2.18 1 Barrack St, Hamilton ML3 0HS, United Kingdom
              </Text>
              <Text color="gray.400" fontSize="sm">
                Date of incorporation: 7 October 2025
              </Text>
              <Divider borderColor="rgba(255,255,255,0.1)" my={3} />
              <HStack spacing={3} flexWrap="wrap">
                <Button as={Link} href="/privacy" size="sm" variant="outline" borderColor="rgba(255,255,255,0.2)" color="white">
                  Privacy Policy
                </Button>
                <Button as={Link} href="/terms" size="sm" variant="outline" borderColor="rgba(255,255,255,0.2)" color="white">
                  Terms & Conditions
                </Button>
                <Button as={Link} href="/cancellation" size="sm" variant="outline" borderColor="rgba(255,255,255,0.2)" color="white">
                  Cancellation Policy
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>

        {/* Contact CTA */}
        <Box 
          p={12} 
          bg="linear-gradient(135deg, rgba(0,194,255,0.1), rgba(0,209,143,0.1))"
          borderRadius="2xl"
          border="1px solid"
          borderColor="rgba(0,194,255,0.3)"
          textAlign="center"
          mb={20}
        >
          <Heading size="xl" color="white" mb={4}>
            Ready to move?
          </Heading>
          <Text color="gray.300" fontSize="lg" mb={8}>
            Get your instant quote and book your move today
          </Text>
          <HStack spacing={4} justify="center" flexWrap="wrap">
            <Button
              as={Link}
              href={ROUTES.SHARED.BOOKING_LUXURY}
              size="lg"
              bg="linear-gradient(135deg, #00C2FF, #00D18F)"
              color="white"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(0,194,255,0.4)',
              }}
              borderRadius="xl"
              fontWeight="semibold"
              transition="all 0.3s ease"
              leftIcon={<FiZap />}
            >
              Get Instant Quote
            </Button>
            <Button
              as={Link}
              href={ROUTES.CONTACT}
              size="lg"
              variant="outline"
              borderColor="rgba(255,255,255,0.2)"
              color="white"
              _hover={{
                borderColor: "neon.400",
                color: "neon.400",
                bg: "rgba(0,194,255,0.05)",
              }}
              leftIcon={<FiMail />}
            >
              Contact Us
            </Button>
          </HStack>
          <HStack spacing={8} justify="center" mt={8}>
            <VStack spacing={1}>
              <Text color="gray.400" fontSize="sm">Support Email</Text>
              <Text
                as={Link}
                href="mailto:support@speedy-van.co.uk"
                color="neon.400"
                fontSize="sm"
                fontWeight="medium"
              >
                support@speedy-van.co.uk
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text color="gray.400" fontSize="sm">Response Time</Text>
              <Text color="white" fontSize="sm" fontWeight="medium">
                Under 2 hours
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* FAQ */}
        <Box as="section" aria-labelledby="faq-heading">
          <VStack align="start" spacing={4} mb={8}>
            <Badge colorScheme="blue" fontSize="xs" px={3} py={1}>FAQ</Badge>
            <Heading id="faq-heading" size="lg" color="white">
              Frequently asked questions
            </Heading>
          </VStack>
          <VStack align="stretch" spacing={4}>
            {[
              {
                q: 'Are you insured?',
                a: 'Yes. All our drivers have Hire & Reward insurance and we provide Goods in Transit cover for moves.',
              },
              {
                q: 'Where do you operate?',
                a: 'We operate in Greater London, Glasgow, and provide UK-wide coverage for longer routes.',
              },
              {
                q: 'How do I get a price?',
                a: 'Simply use our booking flow at speedy-van.co.uk/booking-luxury for an instant, transparent quote.',
              },
              {
                q: 'Do you handle heavy items?',
                a: 'Yes, with proper crew and equipment. Just let us know in the booking form what you need moved.',
              },
              {
                q: 'How do payments work?',
                a: 'All payments are processed securely through Stripe. We accept all major credit and debit cards.',
              },
            ].map((f, i) => (
              <Box 
                key={i} 
                p={6} 
                bg="rgba(255,255,255,0.03)"
                border="1px solid"
                borderColor="rgba(255,255,255,0.1)"
                borderRadius="xl"
                transition="all 0.3s ease"
                _hover={{
                  bg: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(0,194,255,0.3)",
                }}
              >
                <Text fontWeight="bold" color="white" mb={2} fontSize="md">{f.q}</Text>
                <Text color="gray.400">{f.a}</Text>
              </Box>
            ))}
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
