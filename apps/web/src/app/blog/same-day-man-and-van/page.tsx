import { Metadata } from 'next';
import { Box, Container, Heading, Text, VStack, UnorderedList, ListItem, Divider, Alert, AlertIcon } from '@chakra-ui/react';

export const metadata: Metadata = {
  title: 'Same Day Man and Van Service | Emergency Moving UK | Available 24/7',
  description: 'Need a man and van today? Book same-day emergency moving services across the UK. Available 24/7 with 2-hour response time. From £35/hour.',
  keywords: 'same day man and van, emergency man and van, urgent moving service, last minute man and van, man and van today, 24/7 man and van, same day furniture delivery',
  openGraph: {
    title: 'Same Day Man and Van Service | Emergency Moving UK | Available 24/7',
    description: 'Need a man and van today? Book same-day emergency moving services with 2-hour response time.',
    images: [{ url: '/og/og-blog.jpg', width: 1200, height: 630 }],
  },
};

export default function SameDayManAndVanPage() {
  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="2xl" mb={4}>
            Same Day Man and Van Service: Your Complete Guide to Emergency Moving in 2025
          </Heading>
          <Text fontSize="lg" color="gray.600" mb={6}>
            Last updated: January 2025 | Reading time: 7 minutes
          </Text>
        </Box>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text>
            <strong>Need a van NOW?</strong> Call 0800 XXX XXXX for immediate dispatch. Average response time: 2 hours.
          </Text>
        </Alert>

        <Divider />

        <Box>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Life doesn't always give you weeks to plan a move. Whether you're dealing with an unexpected eviction, emergency house clearance, or urgent furniture delivery, **same-day man and van services** are your lifeline. This guide covers everything you need to know about booking emergency moving services in the UK in 2025.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            What is a Same-Day Man and Van Service?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            A same-day man and van service provides emergency moving assistance with minimal notice - typically within 2-4 hours of booking. These services are designed for urgent situations where traditional removal companies (which require 1-2 weeks' notice) aren't practical.
          </Text>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            <strong>Typical use cases include:</strong>
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem>Emergency house moves (eviction, relationship breakdown)</ListItem>
            <ListItem>Urgent furniture delivery from stores</ListItem>
            <ListItem>Last-minute house clearances</ListItem>
            <ListItem>Emergency office relocations</ListItem>
            <ListItem>Urgent eBay/Facebook Marketplace collections</ListItem>
            <ListItem>Same-day student moves</ListItem>
            <ListItem>Emergency appliance delivery/removal</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            How Much Does Same-Day Man and Van Cost?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Same-day services typically cost 20-50% more than advance bookings due to the urgency premium. Here's what to expect:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>Small van (same-day)</strong> - £35-45/hour (vs £25-35 advance)</ListItem>
            <ListItem><strong>Medium van (same-day)</strong> - £40-50/hour (vs £30-40 advance)</ListItem>
            <ListItem><strong>Large van (same-day)</strong> - £45-60/hour (vs £35-50 advance)</ListItem>
            <ListItem><strong>Weekend/evening surcharge</strong> - Add 30-50%</ListItem>
            <ListItem><strong>Bank holiday surcharge</strong> - Add 50-100%</ListItem>
            <ListItem><strong>Minimum booking</strong> - Usually 2-3 hours</ListItem>
          </UnorderedList>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            <strong>Example costs:</strong> A 3-hour same-day move in London with a medium van would cost £120-150, compared to £90-120 if booked in advance.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            How to Book a Same-Day Man and Van (Step-by-Step)
          </Heading>
          
          <Heading as="h3" size="lg" mt={6} mb={3}>
            Step 1: Call or Book Online Immediately
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Don't waste time getting multiple quotes - same-day availability is limited. Call the first reputable service you find. Have this information ready:
          </Text>
          <UnorderedList spacing={2} fontSize="lg" pl={6} mb={6}>
            <ListItem>Pickup address with postcode</ListItem>
            <ListItem>Delivery address with postcode</ListItem>
            <ListItem>List of items to move</ListItem>
            <ListItem>Any access issues (stairs, parking restrictions)</ListItem>
            <ListItem>Your preferred time window</ListItem>
          </UnorderedList>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            Step 2: Confirm Availability and Price
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            The operator will check driver availability and give you a quote. Ask about: estimated arrival time (usually 1-4 hours), total estimated cost including any surcharges, insurance coverage, and payment methods accepted.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            Step 3: Prepare for the Driver's Arrival
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Time is money with same-day services. Have everything packed and ready to load. Disassemble furniture if possible. Clear pathways and doorways. Arrange parking permits if needed. Have payment ready (most accept card, some require cash).
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            Step 4: Track Your Driver
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Reputable services provide real-time tracking or regular updates via text/call. You should receive the driver's name, phone number, and van registration.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Best Same-Day Man and Van Services in the UK
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Based on 2025 availability and customer reviews:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>Speedy Van</strong> - 2-hour response time, 24/7 availability, from £35/hour</ListItem>
            <ListItem><strong>AnyVan Express</strong> - Same-day service in major cities, app booking</ListItem>
            <ListItem><strong>Shiply Urgent</strong> - Connects you with available drivers, variable pricing</ListItem>
            <ListItem><strong>Local Facebook groups</strong> - Often fastest for very local moves</ListItem>
            <ListItem><strong>Gumtree/Yell</strong> - Independent operators, call directly</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Tips for Successful Same-Day Moves
          </Heading>
          
          <Heading as="h3" size="lg" mt={6} mb={3}>
            1. Be Realistic About Timing
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            "Same-day" doesn't mean "within 30 minutes." Expect 2-4 hours for driver dispatch, plus travel time. In busy periods (weekends, month-end), it might take 4-6 hours.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            2. Prioritize Essentials
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            If you're in a true emergency, focus on moving essentials first. You can always arrange a second trip for non-urgent items at a cheaper advance-booking rate.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            3. Have a Backup Plan
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Same-day availability isn't guaranteed, especially during peak times. Have contact details for 2-3 services. Consider hiring a van yourself as a last resort.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            4. Check Insurance
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Emergency services sometimes cut corners. Confirm the driver has goods-in-transit insurance before loading your belongings.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Same-Day vs Next-Day: Which Should You Choose?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            If your situation allows even 12-24 hours of flexibility, next-day service is significantly cheaper and more reliable:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>Same-day</strong>: £120-150 for 3 hours, limited availability, higher stress</ListItem>
            <ListItem><strong>Next-day</strong>: £90-120 for 3 hours, better availability, more planning time</ListItem>
          </UnorderedList>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            <strong>Choose same-day only if:</strong> You're facing immediate eviction, you have a non-negotiable deadline (e.g., store closing), the item won't be available tomorrow, or you're dealing with an emergency situation.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Frequently Asked Questions
          </Heading>
          
          <Heading as="h3" size="lg" mt={6} mb={3}>
            Can I get a man and van in 1 hour?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Rarely. Most services need 2-4 hours minimum. In major cities during quiet periods, some operators might manage 1-2 hours, but expect to pay a significant premium (50-100% extra).
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            Do same-day services work on Sundays?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Yes, but availability is more limited and prices are 30-50% higher. Bank holidays have even higher surcharges (50-100% extra).
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            What if the driver cancels last minute?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Reputable services rarely cancel, but it happens. Always get the booking confirmed in writing (text/email) with the driver's details. If they cancel, you're entitled to a full refund and should immediately contact alternative services.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            Can I book a same-day man and van for long distances?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Yes, but availability decreases with distance. Moves over 50 miles on the same day are challenging and expensive. Consider next-day service for long-distance moves.
          </Text>
        </Box>

        <Box bg="red.50" p={8} borderRadius="lg">
          <Heading as="h2" size="xl" mb={4}>
            Need Emergency Moving Help Right Now?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Don't panic - we've got you covered. Our same-day man and van service operates 24/7 with an average 2-hour response time. Fully insured, professional drivers, and transparent pricing.
          </Text>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            📞 CALL NOW: 0800 XXX XXXX (24/7 Emergency Line)
          </Text>
          <Text fontSize="lg">
            Or book instantly online at speedy-van.co.uk/same-day
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}

