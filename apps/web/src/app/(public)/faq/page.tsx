'use client';

import type { FAQPage, WithContext, Organization, BreadcrumbList } from 'schema-dts';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import NextLink from 'next/link';

const faqs = [
  {
    q: 'Can I use Klarna or Clearpay to pay later?',
    a: 'Yes. If your booking is eligible in Stripe (GBP, UK customer, supported amount and service date), Klarna and Clearpay will appear automatically at checkout alongside cards, Apple Pay, and Google Pay.',
    badge: 'Book now, pay later',
  },
  {
    q: 'How do I get a price?',
    a: 'Start a booking, enter pickup and drop-off addresses, select items, and you will see transparent pricing before confirming payment.',
  },
  {
    q: 'Where do you operate?',
    a: 'We serve major UK cities and longer UK routes. Enter your postcodes to confirm availability.',
  },
  {
    q: 'Do you handle heavy or bulky items?',
    a: 'Yes, with the right crew and equipment. Please list heavy items (e.g., pianos, safes, appliances) during booking so we can assign suitable capacity.',
  },
  {
    q: 'Are you insured?',
    a: 'Yes. We operate with Hire & Reward and Goods in Transit cover. For high-value items, let us know so we can plan appropriate protection.',
  },
  {
    q: 'How do payments work?',
    a: 'Payments are processed securely by Stripe. Eligible customers can use Klarna or Clearpay, plus cards, Apple Pay, and Google Pay.',
  },
  {
    q: 'Can I change or cancel?',
    a: 'Yes. Contact support ahead of your service date. Changes may affect availability or pricing.',
  },
  {
    q: 'How do I contact support?',
    a: 'Call 01202 129746 or email support@speedy-van.co.uk. Include your booking reference if you have one.',
  },
];

function JsonLd() {
  const faqSchema: WithContext<FAQPage> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  const org: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Speedy Van',
    url: 'https://speedy-van.co.uk',
    telephone: '+44 1202 129746',
    email: 'support@speedy-van.co.uk',
    logo: 'https://speedy-van.co.uk/logo.png',
  };

  const breadcrumbs: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://speedy-van.co.uk/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'FAQ',
        item: 'https://speedy-van.co.uk/faq',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

export default function FAQPage() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <Box as="main" bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh" py={{ base: 10, md: 16 }}>
      <JsonLd />

      <Container maxW="5xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 8, md: 12 }} align="stretch">
          <VStack spacing={3} align="flex-start">
            <Badge colorScheme="purple" borderRadius="full" px={3} py={1} fontSize="xs">
              FAQ
            </Badge>
            <Heading size={{ base: 'xl', md: '2xl' }} color={useColorModeValue('gray.900', 'white')}>
              Frequently Asked Questions
            </Heading>
            <Text color={textColor} maxW="3xl">
              Straight answers on booking, pricing, payments, and support. No fluff, just what you need to book confidently.
            </Text>
            <HStack spacing={3} flexWrap="wrap">
              <Badge colorScheme="teal" variant="subtle" borderRadius="full" px={3} py={1} fontSize="xs">
                Klarna & Clearpay
              </Badge>
              <Text fontSize="sm" color={textColor}>
                Book now, pay later appears in Stripe Checkout when eligible.
              </Text>
            </HStack>
            <HStack spacing={3} flexWrap="wrap">
              <Button
                as={NextLink}
                href="/booking-luxury"
                colorScheme="purple"
                size="md"
              >
                Start Booking
              </Button>
              <Button
                as={NextLink}
                href="tel:+441202129746"
                variant="outline"
                colorScheme="purple"
                size="md"
              >
                Call 01202 129746
              </Button>
            </HStack>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
            {faqs.map((item) => (
              <Box
                key={item.q}
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="xl"
                p={{ base: 4, md: 5 }}
                boxShadow="sm"
                _hover={{ boxShadow: 'md' }}
              >
                <VStack align="flex-start" spacing={2}>
                  <HStack spacing={2} flexWrap="wrap">
                    <Heading size="sm" color={useColorModeValue('gray.900', 'white')}>
                      {item.q}
                    </Heading>
                    {item.badge ? (
                      <Badge colorScheme="teal" variant="subtle" borderRadius="full" px={2} py={1} fontSize="xs">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </HStack>
                  <Text fontSize="sm" color={textColor} lineHeight="1.6">
                    {item.a}
                  </Text>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}

