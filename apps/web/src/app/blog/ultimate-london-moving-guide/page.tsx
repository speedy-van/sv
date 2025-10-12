import { Metadata } from 'next';
import { Container, Heading, Text, Box, VStack, HStack, List, ListItem, Badge, Divider } from '@chakra-ui/react';
import FAQSchema from '@/components/Schema/FAQSchema';

export const metadata: Metadata = {
  title: 'The Ultimate Guide to Moving in London | Speedy Van',
  description: 'Complete guide to moving in London including area guides, transport links, costs, and expert tips from London\'s leading man and van service.',
  keywords: 'moving to London, London areas, student moving London, house removal London, London transport, moving costs London',
  alternates: { canonical: 'https://speedy-van.co.uk/blog/ultimate-london-moving-guide' },
  openGraph: {
    title: 'The Ultimate Guide to Moving in London | Speedy Van',
    description: 'Complete guide to moving in London with expert tips and area recommendations.',
    url: 'https://speedy-van.co.uk/blog/ultimate-london-moving-guide',
    siteName: 'Speedy Van',
    type: 'article',
    publishedTime: '2025-01-20T00:00:00.000Z',
    authors: ['Speedy Van Team'],
    tags: ['moving', 'London', 'guide', 'relocation']
  },
};

const faqs = [
  {
    question: "What are the best areas to live in London for students?",
    answer: "Popular student areas include Camden, Islington, Hackney, and Southwark. These areas offer good transport links, affordable housing options, and vibrant communities perfect for students."
  },
  {
    question: "How much does it cost to move in London?",
    answer: "Moving costs in London vary depending on distance and items. Our man and van service starts from £25/hour, with full house removals typically costing £150-400 depending on the size of your move."
  },
  {
    question: "What transport links should I consider when choosing an area?",
    answer: "Look for areas with good Tube, bus, and rail connections. Zones 1-2 offer the best transport links, but Zones 3-4 can be more affordable while still providing good connectivity."
  },
  {
    question: "How far in advance should I book a removal service?",
    answer: "We recommend booking at least 2-3 weeks in advance, especially during peak moving periods (summer months and end of academic year). For same-day service, we can often accommodate with 24 hours notice."
  }
];

export default function UltimateLondonMovingGuide() {
  return (
    <Container maxW="4xl" py={16}>
      <VStack spacing={8} align="stretch">
        {/* Article Header */}
        <Box>
          <Badge colorScheme="blue" mb={4}>Moving Tips</Badge>
          <Heading as="h1" size="2xl" mb={4}>
            The Ultimate Guide to Moving in London
          </Heading>
          <HStack spacing={4} color="gray.600" fontSize="sm">
            <Text>Published: January 20, 2025</Text>
            <Text>•</Text>
            <Text>8 min read</Text>
            <Text>•</Text>
            <Text>By Speedy Van Team</Text>
          </HStack>
        </Box>

        {/* Introduction */}
        <Box>
          <Text fontSize="lg" color="gray.600" mb={6}>
            Moving to London can be both exciting and overwhelming. With 32 boroughs, countless neighborhoods, 
            and a complex transport system, it's essential to plan your move carefully. This comprehensive 
            guide will help you navigate London's moving landscape like a pro.
          </Text>
        </Box>

        {/* Table of Contents */}
        <Box bg="gray.50" p={6} borderRadius="lg">
          <Heading as="h2" size="lg" mb={4}>Table of Contents</Heading>
          <List spacing={2}>
            <ListItem>• Choosing the Right Area</ListItem>
            <ListItem>• Understanding London Transport</ListItem>
            <ListItem>• Moving Costs and Budgeting</ListItem>
            <ListItem>• Finding the Right Home</ListItem>
            <ListItem>• Essential Services Setup</ListItem>
            <ListItem>• Moving Day Checklist</ListItem>
          </List>
        </Box>

        {/* Main Content Sections */}
        <Box>
          <Heading as="h2" size="xl" mb={4}>1. Choosing the Right Area</Heading>
          <Text mb={4}>
            London's diversity means there's a perfect area for everyone. Consider these factors:
          </Text>
          <List spacing={2} mb={6}>
            <ListItem>• <strong>Budget:</strong> Central areas (Zones 1-2) are more expensive but offer better transport links</ListItem>
            <ListItem>• <strong>Lifestyle:</strong> Young professionals often prefer Shoreditch, while families might prefer Richmond</ListItem>
            <ListItem>• <strong>Transport:</strong> Check Tube, bus, and rail connections to your workplace or university</ListItem>
            <ListItem>• <strong>Amenities:</strong> Consider proximity to shops, restaurants, and green spaces</ListItem>
          </List>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>2. Understanding London Transport</Heading>
          <Text mb={4}>
            London's transport system is extensive but can be confusing for newcomers:
          </Text>
          <List spacing={2} mb={6}>
            <ListItem>• <strong>Oyster Card:</strong> Essential for all public transport</ListItem>
            <ListItem>• <strong>Zones:</strong> London is divided into 9 zones, with Zone 1 being the center</ListItem>
            <ListItem>• <strong>Peak Hours:</strong> Avoid traveling 7-9am and 5-7pm to save money</ListItem>
            <ListItem>• <strong>Contactless:</strong> Use your bank card for seamless travel</ListItem>
          </List>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>3. Moving Costs and Budgeting</Heading>
          <Text mb={4}>
            Moving costs in London can vary significantly. Here's what to expect:
          </Text>
          <List spacing={2} mb={6}>
            <ListItem>• <strong>Man and Van:</strong> £25-35/hour for small moves</ListItem>
            <ListItem>• <strong>Full Removal:</strong> £150-400 depending on home size</ListItem>
            <ListItem>• <strong>Deposits:</strong> Usually 4-6 weeks rent in advance</ListItem>
            <ListItem>• <strong>Council Tax:</strong> Varies by borough and property value</ListItem>
          </List>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>4. Finding the Right Home</Heading>
          <Text mb={4}>
            The London rental market is competitive. Start your search early and be prepared:
          </Text>
          <List spacing={2} mb={6}>
            <ListItem>• <strong>Rightmove & Zoopla:</strong> Main property portals</ListItem>
            <ListItem>• <strong>Viewings:</strong> Book multiple viewings and be flexible</ListItem>
            <ListItem>• <strong>References:</strong> Have employer and previous landlord references ready</ListItem>
            <ListItem>• <strong>Deposits:</strong> Be ready to pay immediately if you like a property</ListItem>
          </List>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>5. Essential Services Setup</Heading>
          <Text mb={4}>
            Don't forget to set up these essential services:
          </Text>
          <List spacing={2} mb={6}>
            <ListItem>• <strong>Utilities:</strong> Gas, electricity, water, and internet</ListItem>
            <ListItem>• <strong>Council Tax:</strong> Register with your local council</ListItem>
            <ListItem>• <strong>GP Registration:</strong> Find a local doctor</ListItem>
            <ListItem>• <strong>Bank Account:</strong> Update your address with your bank</ListItem>
          </List>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>6. Moving Day Checklist</Heading>
          <Text mb={4}>
            Make your moving day stress-free with this checklist:
          </Text>
          <List spacing={2} mb={6}>
            <ListItem>• <strong>Book Early:</strong> Reserve your removal service 2-3 weeks in advance</ListItem>
            <ListItem>• <strong>Pack Smart:</strong> Label boxes by room and importance</ListItem>
            <ListItem>• <strong>Take Photos:</strong> Document your belongings for insurance</ListItem>
            <ListItem>• <strong>Keys Ready:</strong> Ensure you have keys for both properties</ListItem>
            <ListItem>• <strong>Parking:</strong> Arrange parking permits if needed</ListItem>
          </List>
        </Box>

        <Divider />

        {/* FAQ Section */}
        <Box>
          <Heading as="h2" size="xl" mb={6}>Frequently Asked Questions</Heading>
          <VStack spacing={6} align="stretch">
            {faqs.map((faq, index) => (
              <Box key={index} p={4} borderWidth={1} borderRadius="md">
                <Heading as="h3" size="md" mb={2} color="blue.600">
                  {faq.question}
                </Heading>
                <Text color="gray.600">
                  {faq.answer}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* CTA Section */}
        <Box
          bg="blue.50"
          p={8}
          borderRadius="lg"
          textAlign="center"
          mt={8}
        >
          <Heading as="h2" size="lg" mb={4}>
            Ready to Make Your Move?
          </Heading>
          <Text mb={6} color="gray.600">
            Let Speedy Van handle your London move with professional, reliable service from just £25/hour.
          </Text>
          <a
            href="/booking-luxury"
            style={{
              display: 'inline-block',
              backgroundColor: '#3182ce',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Get Your Quote Now
          </a>
        </Box>
      </VStack>

      {/* FAQ Schema */}
      <FAQSchema faqs={faqs} />
    </Container>
  );
}
