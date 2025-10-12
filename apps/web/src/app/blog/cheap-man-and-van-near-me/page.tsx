import { Metadata } from 'next';
import { Box, Container, Heading, Text, VStack, UnorderedList, ListItem, Divider } from '@chakra-ui/react';

export const metadata: Metadata = {
  title: 'Cheap Man and Van Near Me | Affordable Moving Services UK 2025',
  description: 'Find cheap man and van services near you from £25/hour. Compare prices, read reviews, and book affordable moving services across the UK. Same-day service available.',
  keywords: 'cheap man and van near me, affordable man and van, budget moving service, cheap removal company, man and van prices, low cost moving, cheap furniture delivery',
  openGraph: {
    title: 'Cheap Man and Van Near Me | Affordable Moving Services UK 2025',
    description: 'Find cheap man and van services near you from £25/hour. Compare prices and book affordable moving services.',
    images: [{ url: '/og/og-blog.jpg', width: 1200, height: 630 }],
  },
};

export default function CheapManAndVanPage() {
  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="2xl" mb={4}>
            Cheap Man and Van Near Me: Complete Guide to Affordable Moving in 2025
          </Heading>
          <Text fontSize="lg" color="gray.600" mb={6}>
            Last updated: January 2025 | Reading time: 8 minutes
          </Text>
        </Box>

        <Divider />

        <Box>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Moving house or transporting furniture doesn't have to break the bank. Finding a **cheap man and van service near you** is easier than ever in 2025, with prices starting from just £25 per hour. This comprehensive guide will show you exactly how to find affordable, reliable moving services in your area while avoiding common pitfalls.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            What is a Man and Van Service?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            A man and van service is a flexible, affordable alternative to traditional removal companies. It typically consists of a professional driver with a van who helps you move items from one location to another. Unlike large removal firms, man and van services offer:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>Lower costs</strong> - No overhead of large companies</ListItem>
            <ListItem><strong>Flexibility</strong> - Book same-day or next-day service</ListItem>
            <ListItem><strong>Personal service</strong> - Direct communication with your driver</ListItem>
            <ListItem><strong>Local expertise</strong> - Drivers who know your area well</ListItem>
            <ListItem><strong>Smaller moves</strong> - Perfect for single items or small loads</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Average Man and Van Prices in the UK (2025)
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Understanding typical pricing helps you identify genuinely cheap services versus those cutting corners. Here's what you should expect to pay:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>Small van (SWB Transit)</strong> - £25-35/hour</ListItem>
            <ListItem><strong>Medium van (MWB Transit)</strong> - £30-40/hour</ListItem>
            <ListItem><strong>Large van (LWB Luton)</strong> - £35-50/hour</ListItem>
            <ListItem><strong>Two men and van</strong> - £40-60/hour</ListItem>
            <ListItem><strong>Minimum booking</strong> - Usually 2-3 hours</ListItem>
            <ListItem><strong>Fuel surcharge</strong> - £5-15 for long distances</ListItem>
          </UnorderedList>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            <strong>Regional variations:</strong> London and South East typically charge 20-30% more than Northern England, Scotland, or Wales. Birmingham, Manchester, and Glasgow fall in the middle range.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            How to Find the Cheapest Man and Van Near You
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Follow these proven strategies to secure the best rates:
          </Text>
          
          <Heading as="h3" size="lg" mt={6} mb={3}>
            1. Compare Multiple Quotes
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Never settle for the first quote. Get at least 3-5 quotes from different providers. Use comparison websites like Speedy Van, AnyVan, or Shiply to quickly gather multiple quotes. Be specific about:
          </Text>
          <UnorderedList spacing={2} fontSize="lg" pl={6} mb={6}>
            <ListItem>Exact pickup and delivery addresses</ListItem>
            <ListItem>Number and size of items</ListItem>
            <ListItem>Access issues (stairs, parking, narrow streets)</ListItem>
            <ListItem>Preferred date and time</ListItem>
          </UnorderedList>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            2. Book During Off-Peak Times
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Prices can vary by up to 40% depending on when you book. Cheapest times are typically Tuesday-Thursday mornings, avoiding month-ends and weekends. The most expensive times are Friday afternoons, last day of the month, and bank holiday weekends.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            3. Be Flexible with Dates
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            If you can be flexible, some services offer "fill-up" rates where your items are transported alongside other customers' loads. This can save 30-50% but may take longer.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            4. Prepare Everything in Advance
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Time is money. Have everything packed, disassembled, and ready to load before the van arrives. Every extra hour costs £25-50, so being prepared can save significant money.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Red Flags: When "Cheap" is Too Cheap
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Beware of these warning signs that indicate an unreliable service:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>No insurance</strong> - Legitimate services carry goods-in-transit insurance</ListItem>
            <ListItem><strong>Cash-only payments</strong> - Professional services accept card payments</ListItem>
            <ListItem><strong>No reviews or testimonials</strong> - Check Google, Trustpilot, or Facebook</ListItem>
            <ListItem><strong>Vague quotes</strong> - Proper quotes specify all costs upfront</ListItem>
            <ListItem><strong>No business address</strong> - Legitimate companies have registered addresses</ListItem>
            <ListItem><strong>Pressure tactics</strong> - "Book now or lose this price" is a red flag</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Money-Saving Tips from Professional Movers
          </Heading>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>Declutter first</strong> - Fewer items = smaller van = lower cost</ListItem>
            <ListItem><strong>Use free boxes</strong> - Supermarkets give away sturdy boxes</ListItem>
            <ListItem><strong>Pack yourself</strong> - Professional packing adds £50-150</ListItem>
            <ListItem><strong>Choose ground floor</strong> - Stairs add time and cost</ListItem>
            <ListItem><strong>Book in advance</strong> - Last-minute bookings cost 20-40% more</ListItem>
            <ListItem><strong>Share a load</strong> - Some services offer shared van options</ListItem>
            <ListItem><strong>Move mid-month</strong> - Avoid the expensive month-end rush</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Best Cheap Man and Van Services in the UK
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Based on 2025 customer reviews and pricing:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>Speedy Van</strong> - From £25/hour, same-day service, 5-star rated</ListItem>
            <ListItem><strong>AnyVan</strong> - Competitive quotes, nationwide coverage</ListItem>
            <ListItem><strong>Shiply</strong> - Auction-style pricing, good for flexibility</ListItem>
            <ListItem><strong>Compare the Man and Van</strong> - Price comparison platform</ListItem>
            <ListItem><strong>Local Facebook groups</strong> - Often find independent operators</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Frequently Asked Questions
          </Heading>
          
          <Heading as="h3" size="lg" mt={6} mb={3}>
            How much does a cheap man and van cost for 2 hours?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Expect to pay £50-70 for a 2-hour booking with a small van (most services have a 2-hour minimum). This typically covers moves within 5-10 miles.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            Is it cheaper to hire a van and move myself?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Van hire costs £50-80/day plus fuel (£20-40), totaling £70-120. A man and van service costs £50-100 for 2 hours but includes labor and insurance. For most people, man and van is better value unless you have free helpers.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            Do I need to tip my man and van driver?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Tipping isn't expected but is appreciated for exceptional service. £10-20 is standard for a job well done, or offer refreshments during the move.
          </Text>
        </Box>

        <Box bg="blue.50" p={8} borderRadius="lg">
          <Heading as="h2" size="xl" mb={4}>
            Ready to Book Your Cheap Man and Van?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Get instant quotes from verified, insured man and van services in your area. Compare prices, read reviews, and book online in 2 minutes. Same-day service available from £25/hour.
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            📞 Call 0800 XXX XXXX or book online at speedy-van.co.uk
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}

