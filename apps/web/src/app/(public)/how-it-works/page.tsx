import type { Metadata } from 'next';
import NextLink from 'next/link';
import {
  Box,
  Heading,
  Link as ChakraLink,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { ROUTES } from '@/lib/routing';

export const metadata: Metadata = {
  title: 'How It Works | Speedy Van',
  description:
    'Book online, get an instant price, track your driver live, and get proof of delivery.',
  openGraph: {
    title: 'How It Works | Speedy Van',
    description: 'Simple 4-step process from quote to delivery.',
    url: 'https://speedy-van.co.uk/how-it-works',
    type: 'website',
  },
};

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box borderWidth="1px" borderRadius="2xl" p={5}>
      <Text mb={2} fontSize="sm" fontWeight="semibold" opacity={0.7}>
        Step {n}
      </Text>
      <Heading as="h3" size="md" mb={2}>
        {title}
      </Heading>
      <Box fontSize="sm" opacity={0.9}>
        {children}
      </Box>
    </Box>
  );
}

export default function HowItWorksPage() {
  return (
    <Box as="main" mx="auto" maxW="5xl" px={4} py={10}>
      <Box as="header" mb={8}>
        <Heading as="h1" size="xl">
          How Speedy Van Works
        </Heading>
        <Text mt={2} fontSize="md" opacity={0.8}>
          Book online in minutes. We assign a vetted driver. You track live.
          Done.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
        <Step n="1" title="Get an instant price & book">
          Enter pickup and drop-off, choose van size and time slot. See a clear
          price breakdown (no hidden fees).
          <Box mt={3}>
            <ChakraLink
              as={NextLink}
              href={ROUTES.SHARED.BOOKING_LUXURY}
              textDecoration="underline"
            >
              Start a booking
            </ChakraLink>
          </Box>
        </Step>

        <Step n="2" title="Secure checkout">
          Pay with Stripe. Your booking is locked and you’ll get confirmation +
          receipt instantly.
          <Box mt={3}>
            <ChakraLink
              as={NextLink}
              href={`${ROUTES.SHARED.BOOKING_LUXURY}?step=2`}
              textDecoration="underline"
            >
              Go to checkout
            </ChakraLink>
          </Box>
        </Step>

        <Step n="3" title="Driver assignment & updates">
          We match the best driver for your slot. You’ll see status updates and
          ETA in real time.
          <Box mt={3}>
            <ChakraLink
              as={NextLink}
              href={ROUTES.CUSTOMER.BOOKINGS}
              textDecoration="underline"
            >
              View your orders
            </ChakraLink>
          </Box>
        </Step>

        <Step n="4" title="Track live & delivery">
          Track the van on a live map, chat if needed, and get proof of delivery
          when the job’s done.
          <Box mt={3}>
            <ChakraLink as={NextLink} href="/track" textDecoration="underline">
              Open live tracking
            </ChakraLink>
          </Box>
        </Step>
      </SimpleGrid>

      <Box mt={10} borderRadius="2xl" p={5} bg="bg.muted">
        <Heading as="h2" size="md" mb={2}>
          What you get
        </Heading>
        <Box as="ul" pl={5} sx={{ listStyle: 'disc inside' }}>
          <Box as="li" fontSize="sm" opacity={0.9}>
            Vetted, insured drivers
          </Box>

          <Box as="li" fontSize="sm" opacity={0.9}>
            Live tracking + status timeline
          </Box>
          <Box as="li" fontSize="sm" opacity={0.9}>
            Receipts and invoices for every job
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
