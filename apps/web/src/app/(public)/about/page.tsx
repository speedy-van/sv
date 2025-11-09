import { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
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
} from '@chakra-ui/react';
import { JsonLd } from './metadata';
import AnalyticsClient from './AnalyticsClient';
import { parseConsentCookie } from '@/lib/consent';
import { cookies } from 'next/headers';
import HeaderButton from '@/components/common/HeaderButton';
import { ROUTES } from '@/lib/routing';

export const metadata: Metadata = buildMetadata({
  title: 'About Speedy Van | Trusted UK Moves & Deliveries',
  description:
    'We make moving and deliveries simple: instant quotes, vetted drivers, live tracking. Fully insured, UK-based support.',
  openGraph: {
    title: 'About Speedy Van | Trusted UK Moves & Deliveries',
    description:
      'We make moving and deliveries simple: instant quotes, vetted drivers, live tracking.',
    url: '/about',
    images: [
      {
        url: '/og/og-about.jpg',
        width: 1200,
        height: 630,
        alt: 'About Speedy Van',
      },
    ],
  },
  alternates: { canonical: '/about' },
});

// Force dynamic rendering (fixes DYNAMIC_SERVER_USAGE error)
export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const cookieStore = await cookies();
  const consent = parseConsentCookie(cookieStore.get('sv_consent')?.value);
  return (
    <Container maxW="6xl" py={{ base: 8, md: 14 }}>
      {consent && consent.preferences?.analytics && <AnalyticsClient />}
      <JsonLd />
      {/* Hero */}
      <VStack spacing={4} align="start">
        <Heading as="h1" size="xl">
          Reliable moves and deliveries across the UK.
        </Heading>
        <Text color="gray.600">
          Instant quotes, vetted drivers, live tracking—no hidden fees.
        </Text>
        <HStack>
          <Button
            as={Link}
            href={ROUTES.SHARED.BOOKING_LUXURY}
            colorScheme="blue"
            data-analytics="about_cta_quote_click"
            data-analytics-props='{"placement":"hero"}'
          >
            Get your instant quote
          </Button>
        </HStack>
        <HStack spacing={6} pt={2}>
          <Badge colorScheme="green">Fully insured</Badge>
          <Badge colorScheme="purple">UK-based support</Badge>
          <Badge colorScheme="blue">Live tracking</Badge>
        </HStack>
      </VStack>

      <Divider my={10} />

      {/* Our Story & What We Do */}
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={10}>
        <GridItem>
          <Heading size="md" mb={3}>
            Our story
          </Heading>
          <Text color="gray.700">
            Speedy Van started with a simple idea: moving and deliveries
            shouldn’t be stressful. We saw friends and small businesses struggle
            with slow quotes and no visibility. So we built a better way—
            instant, transparent quotes, vetted drivers, and live tracking from
            pickup to drop-off. Today, we help people and businesses across the
            UK move faster and with confidence.
          </Text>
        </GridItem>
        <GridItem>
          <Heading size="md" mb={3}>
            What we do
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
            <Box p={4} borderWidth="1px" rounded="md">
              <Heading size="sm">Man and Van</Heading>
              <Text color="gray.600">
                Affordable moves for rooms, flats, and small offices.
              </Text>
            </Box>
            <Box p={4} borderWidth="1px" rounded="md">
              <Heading size="sm">Removals</Heading>
              <Text color="gray.600">
                From single items to full-home moves with care.
              </Text>
            </Box>
            <Box p={4} borderWidth="1px" rounded="md">
              <Heading size="sm">Courier & Same‑day</Heading>
              <Text color="gray.600">
                Urgent deliveries with real-time tracking.
              </Text>
            </Box>
            <Box p={4} borderWidth="1px" rounded="md">
              <Heading size="sm">Business Logistics</Heading>
              <Text color="gray.600">
                On-demand van fleet for e‑commerce and retail.
              </Text>
            </Box>
          </SimpleGrid>
        </GridItem>
      </Grid>

      <Divider my={10} />

      {/* How We Work */}
      <Box>
        <Heading size="md" mb={3}>
          How we work
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          {['Book', 'Assign', 'Track', 'Deliver'].map((step, i) => (
            <Box key={step} p={4} borderWidth="1px" rounded="md">
              <Badge mb={2}>{i + 1}</Badge>
              <Heading size="sm">{step}</Heading>
              <Text color="gray.600">
                {i === 0 && 'Get a price and book online in minutes.'}
                {i === 1 && 'We match you with a vetted, insured driver.'}
                {i === 2 && 'Live updates and ETA from pickup to drop-off.'}
                {i === 3 && 'On-time delivery and simple proof of completion.'}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Divider my={10} />

      {/* Coverage & Fleet */}
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={10}>
        <GridItem>
          <Heading size="md" mb={3}>
            Coverage & Fleet
          </Heading>
          <Text color="gray.700">
            Greater London, Glasgow, and UK coverage for longer routes.
          </Text>
          <Text color="gray.600" mt={2}>
            Van types: Small, LWB, Luton. We’ll recommend the right fit based on
            your job.
          </Text>
          <Text color="gray.600" mt={2}>
            Eco: we optimize routes and group jobs where possible.
          </Text>
          <Text color="gray.600" mt={2}>
            <Link href="/track">Track your booking</Link> in real time.
          </Text>
        </GridItem>
        <GridItem>
          <SimpleGrid columns={3} spacing={4}>
            {[
              { name: 'Small', payload: 'up to ~600kg' },
              { name: 'LWB', payload: 'up to ~1200kg' },
              { name: 'Luton', payload: 'up to ~1000kg + tail lift' },
            ].map(v => (
              <Box key={v.name} p={4} borderWidth="1px" rounded="md">
                <Heading size="sm">{v.name}</Heading>
                <Text color="gray.600">{v.payload}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </GridItem>
      </Grid>

      <Divider my={10} />

      {/* Safety & Compliance */}
      <Box>
        <Heading size="md" mb={3}>
          Safety & compliance
        </Heading>
        <Text color="gray.700">
          All drivers hold right‑to‑work, DVLA‑checked licences, valid MOT, and
          Hire & Reward insurance. Goods in Transit cover available for moves.
        </Text>
        <HStack mt={3} spacing={3}>
          <Badge>Hire & Reward</Badge>
          <Badge>DVLA checked</Badge>
          <Badge>MOT</Badge>
        </HStack>
      </Box>

      <Divider my={10} />

      {/* Values */}
      <Box>
        <Heading size="md" mb={3}>
          Our values
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {[
            {
              t: 'On time, every time',
              d: 'We plan ahead and communicate clearly to hit your deadlines.',
            },
            {
              t: 'People first',
              d: 'Careful handling, respectful drivers, and responsive support.',
            },
            {
              t: 'Transparent pricing',
              d: 'No hidden fees, clear quotes, and fair pricing every time.',
            },
          ].map(v => (
            <Box key={v.t} p={4} borderWidth="1px" rounded="md">
              <Heading size="sm">{v.t}</Heading>
              <Text color="gray.600">{v.d}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Divider my={10} />

      {/* Numbers That Matter */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
        {[
          { label: 'On-time', value: '98.4%' },
          { label: 'Jobs completed', value: '12,000+' },
          { label: 'Avg rating', value: '4.9/5' },
          { label: 'NPS', value: '+72' },
        ].map(s => (
          <Stat key={s.label} p={4} borderWidth="1px" rounded="md">
            <StatLabel>{s.label}</StatLabel>
            <StatNumber>{s.value}</StatNumber>
            <StatHelpText>Last 90 days</StatHelpText>
          </Stat>
        ))}
      </SimpleGrid>

      <Divider my={10} />

      {/* Reviews & Logos (logo wall) */}
      <Box>
        <Heading size="md" mb={3}>
          Trusted technology
        </Heading>
        <HStack spacing={3} flexWrap="wrap">
          {['Stripe', 'Mapbox', 'SendGrid', 'Pusher'].map(name => (
            <Badge key={name} px={3} py={1} variant="outline">
              {name}
            </Badge>
          ))}
        </HStack>
      </Box>

      <Divider my={10} />

      {/* Testimonials */}
      <Box id="testimonials">
        <Heading size="md" mb={3}>
          What customers say
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {[
            {
              name: 'Amira, London',
              quote: 'Super quick and careful with our flat move.',
            },
            {
              name: 'Tom, Glasgow',
              quote: 'Same‑day delivery arrived on time, great comms.',
            },
            {
              name: 'Sophie, Bristol',
              quote: 'Transparent price and friendly driver.',
            },
          ].map(t => (
            <Box key={t.name} p={4} borderWidth="1px" rounded="md">
              <Text>“{t.quote}”</Text>
              <HStack mt={3}>
                <Avatar size="sm" name={t.name} />
                <Text color="gray.600">{t.name}</Text>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Divider my={10} />

      {/* CSR / Sustainability */}
      <Box>
        <Heading size="md" mb={3}>
          Sustainability
        </Heading>
        <Text color="gray.700">
          We reduce empty miles with smart routing and job grouping. Where
          possible, we reuse packing materials and recommend the right van size
          to cut emissions.
        </Text>
      </Box>

      <Divider my={10} />

      {/* Careers / Drivers CTA */}
      <Box>
        <Heading size="md" mb={3}>
          Work with us
        </Heading>
        <Text color="gray.700">
          We're always looking for reliable partners.
        </Text>
        <HStack mt={3}>
          <Button
            as={Link}
            href={ROUTES.CUSTOMER_LOGIN}
            variant="outline"
            data-analytics="about_cta_quote_click"
            data-analytics-props='{"placement":"work_with_us","cta":"customer_portal"}'
          >
            Customer portal
          </Button>
        </HStack>
      </Box>

      <Divider my={10} />

      {/* Press & Legal */}
      <Box>
        <Heading size="md" mb={3}>
          Press & legal
        </Heading>
        <VStack align="start" spacing={2}>
          <Text color="gray.700" fontWeight="semibold">
            SPEEDY VAN REMOVALS LTD
          </Text>
          <Text color="gray.600" fontSize="sm">
            Company No. SC865658 · Private Limited by Shares
          </Text>
          <Text color="gray.600" fontSize="sm">
            Registered in Scotland · Companies House
          </Text>
          <Text color="gray.600" fontSize="sm">
            Registered address: Office 2.18 1 Barrack St, Hamilton ML3 0HS, United Kingdom
          </Text>
          <Text color="gray.600" fontSize="sm">
            Date of incorporation: 7 October 2025
          </Text>
        </VStack>
        <HStack mt={3} spacing={3}>
          <Button as={Link} href="/privacy" size="sm" variant="outline">
            Privacy
          </Button>
          <Button as={Link} href="/terms" size="sm" variant="outline">
            Terms
          </Button>
          <Button as={Link} href="/cancellation" size="sm" variant="outline">
            Cancellation policy
          </Button>
        </HStack>
      </Box>

      <Divider my={10} />

      {/* Contact */}
      <Box>
        <Heading size="md" mb={3}>
          Contact
        </Heading>
        <Text color="gray.700">
          Support:{' '}
          <Link
            href="mailto:support@speedy-van.co.uk"
            data-analytics="about_contact_click"
            data-analytics-props='{"channel":"email"}'
          >
            support@speedy-van.co.uk
          </Link>{' '}
          · Mon–Fri 9am–6pm · Typical response under 2h.
        </Text>
        <HStack mt={3}>
          <Button
            as={Link}
            href={ROUTES.SHARED.BOOKING_LUXURY}
            bg="linear-gradient(135deg, #00C2FF, #00D18F)"
            color="white"
            _hover={{
              bg: 'linear-gradient(135deg, #00B8F0, #00C77F)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
            }}
            borderRadius="xl"
            fontWeight="semibold"
            transition="all 0.2s ease"
            _active={{
              transform: 'scale(0.98)',
            }}
            data-analytics="about_cta_quote_click"
            data-analytics-props='{"placement":"contact"}'
          >
            Get a quote
          </Button>
          <Button
            as={Link}
            href="/track"
            variant="outline"
            data-analytics="about_contact_click"
            data-analytics-props='{"channel":"track"}'
          >
            Track a booking
          </Button>
        </HStack>
      </Box>

      <Divider my={10} />

      {/* FAQ (short) with schema-friendly structure */}
      <Box as="section" aria-labelledby="faq-heading">
        <Heading id="faq-heading" size="md" mb={3}>
          FAQ
        </Heading>
        <VStack align="stretch" spacing={3}>
          {[
            {
              q: 'Are you insured?',
              a: 'Yes. Hire & Reward + Goods in Transit for moves.',
            },
            {
              q: 'Where do you operate?',
              a: 'Greater London, Glasgow, and longer UK routes.',
            },
            {
              q: 'How do I get a price?',
              a: 'Use the booking flow at speedy-van.co.uk/booking-luxury for an instant quote.',
            },
            {
              q: 'Do you handle heavy items?',
              a: 'Yes, with proper crew and equipment. Let us know in the booking.',
            },
            {
              q: 'How do payments work?',
              a: 'All payments are processed securely by Stripe.',
            },
          ].map((f, i) => (
            <Box key={i} p={4} borderWidth="1px" rounded="md">
              <Text fontWeight="bold">{f.q}</Text>
              <Text color="gray.700">{f.a}</Text>
            </Box>
          ))}
        </VStack>
      </Box>
    </Container>
  );
}
