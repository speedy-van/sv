import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import {
  Container,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  Button,
  HStack,
  Icon,
  Box,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiPhone, FiMail, FiMessageCircle, FiMapPin, FiClock } from 'react-icons/fi';
import Link from 'next/link';

// Force dynamic rendering to avoid serialization issues with Icon components
export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Support & Help Center | Speedy Van',
  description: 'Get help with Speedy Van delivery services. Contact our support team 24/7.',
  alternates: { canonical: '/support' },
});

const contactMethods = [
  {
    icon: FiPhone,
    title: 'Phone Support',
    value: '+44 7901846297',
    description: '24/7 Support Available',
    action: 'tel:+447901846297',
    color: 'blue',
  },
  {
    icon: FiMail,
    title: 'Email Support',
    value: 'support@speedy-van.co.uk',
    description: 'Response within 2 hours',
    action: 'mailto:support@speedy-van.co.uk',
    color: 'green',
  },
  {
    icon: FiMapPin,
    title: 'Office Location',
    value: '140 Charles Street, Glasgow City',
    description: 'G21 2QB, United Kingdom',
    action: null,
    color: 'orange',
  },
];

const supportHours = [
  { day: 'Monday - Friday', hours: '8:00 AM - 8:00 PM' },
  { day: 'Saturday', hours: '9:00 AM - 6:00 PM' },
  { day: 'Sunday', hours: '10:00 AM - 4:00 PM' },
  { day: 'Emergency Line', hours: '24/7 Available' },
];

export default function SupportPage() {
  return (
    <Container maxW="6xl" py={{ base: 8, md: 14 }}>
      <VStack align="start" spacing={8}>
        {/* Header */}
        <VStack align="start" spacing={3}>
          <Heading as="h1" size="xl">
            Support & Help Center
          </Heading>
          <Text fontSize="lg" color="gray.600">
            We're here to help! Get in touch with our support team for any questions or assistance.
          </Text>
        </VStack>

        {/* Contact Methods */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
          {contactMethods.map((method, index) => (
            <Card
              key={index}
              variant="outline"
              _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Icon as={method.icon} boxSize={8} color={`${method.color}.500`} />
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="semibold" fontSize="lg">
                      {method.title}
                    </Text>
                    <Text color="gray.700" fontWeight="medium">
                      {method.value}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {method.description}
                    </Text>
                  </VStack>
                  {method.action && (
                    <Button
                      as="a"
                      href={method.action}
                      colorScheme={method.color}
                      size="sm"
                      w="full"
                    >
                      Contact Now
                    </Button>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {/* Support Hours */}
        <Card w="full" variant="outline">
          <CardBody>
            <VStack align="start" spacing={4}>
              <HStack>
                <Icon as={FiClock} boxSize={6} color="blue.500" />
                <Heading size="md">Support Hours</Heading>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                {supportHours.map((schedule, index) => (
                  <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                    <Text fontWeight="medium" color="gray.700">
                      {schedule.day}
                    </Text>
                    <Text color="gray.600">{schedule.hours}</Text>
                  </HStack>
                ))}
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Quick Links */}
        <Card w="full" variant="outline" bg="blue.50">
          <CardBody>
            <VStack align="start" spacing={4}>
              <Heading size="md">Need Help With Something Specific?</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="full">
                <Button as={Link} href="/tracking" variant="outline" colorScheme="blue">
                  Track Your Delivery
                </Button>
                <Button as={Link} href="/booking-luxury" variant="outline" colorScheme="blue">
                  Book a Delivery
                </Button>
                <Button as={Link} href="/privacy" variant="outline" colorScheme="blue">
                  Privacy Policy
                </Button>
                <Button as={Link} href="/terms" variant="outline" colorScheme="blue">
                  Terms & Conditions
                </Button>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Company Info */}
        <Box w="full" p={6} bg="gray.50" borderRadius="md">
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold" fontSize="lg" color="gray.800">
              SPEEDY VAN REMOVALS LTD
            </Text>
            <Text fontSize="sm" color="gray.600">
              Company No. SC865658 · Registered in Scotland
            </Text>
            <Text fontSize="sm" color="gray.600">
              Office 2.18 1 Barrack St, Hamilton ML3 0HS, United Kingdom
            </Text>
            <Text fontSize="sm" color="gray.600">
              Email: support@speedy-van.co.uk · Phone: +44 7901846297
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}

