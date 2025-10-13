'use client';

import { Box, Container, Heading, Text, VStack, UnorderedList, ListItem, Divider, Badge } from '@chakra-ui/react';

export { metadata } from './metadata';

export default function StudentMovingServicePage() {
  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Badge colorScheme="green" fontSize="md" mb={4}>
            STUDENT DISCOUNT AVAILABLE
          </Badge>
          <Heading as="h1" size="2xl" mb={4}>
            Student Moving Service: Complete Guide to Affordable University Moving in 2025
          </Heading>
          <Text fontSize="lg" color="gray.600" mb={6}>
            Last updated: January 2025 | Reading time: 9 minutes
          </Text>
        </Box>

        <Divider />

        <Box>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Moving to and from university accommodation is a rite of passage for UK students, but it doesn't have to drain your student loan. With **specialist student moving services** offering rates from just £20/hour (with student discount), you can relocate your entire room for less than a night out. This comprehensive guide covers everything students need to know about affordable, stress-free moving in 2025.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Why Use a Student Moving Service?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Traditional removal companies are designed for families with entire houses to move. Student moving services are specifically tailored for university students, offering:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>Student discounts</strong> - 15-25% off standard rates with valid student ID</ListItem>
            <ListItem><strong>Flexible dates</strong> - Understand term-time constraints and exam periods</ListItem>
            <ListItem><strong>Small load specialists</strong> - Efficient for single rooms or shared flats</ListItem>
            <ListItem><strong>Storage options</strong> - Keep belongings safe during summer holidays</ListItem>
            <ListItem><strong>University expertise</strong> - Know campus access rules and parking</ListItem>
            <ListItem><strong>Shared van services</strong> - Split costs with other students on similar routes</ListItem>
            <ListItem><strong>Payment flexibility</strong> - Accept student accounts and split payments</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Student Moving Prices (2025)
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Here's what you should expect to pay with a valid student ID:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>Small van (student rate)</strong> - £20-30/hour (vs £25-35 standard)</ListItem>
            <ListItem><strong>Medium van (student rate)</strong> - £25-35/hour (vs £30-40 standard)</ListItem>
            <ListItem><strong>Shared van service</strong> - £40-80 fixed price (split between students)</ListItem>
            <ListItem><strong>Storage (per month)</strong> - £30-60 for a student room's worth</ListItem>
            <ListItem><strong>Packing materials</strong> - £10-20 for boxes, tape, bubble wrap</ListItem>
          </UnorderedList>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            <strong>Real example:</strong> Moving from Manchester to Leeds (45 miles) with a small van typically takes 3 hours total (1 hour loading, 1 hour driving, 1 hour unloading) = £60-90 with student discount.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Peak Student Moving Periods (Book Early!)
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Student moving services get extremely busy during these periods. Book 2-4 weeks in advance:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>September (Freshers' Week)</strong> - Busiest period, prices up 30-50%</ListItem>
            <ListItem><strong>Late June/Early July</strong> - End of academic year exodus</ListItem>
            <ListItem><strong>January</strong> - Spring semester starts, moderate demand</ListItem>
            <ListItem><strong>Easter holidays</strong> - Students moving between accommodations</ListItem>
          </UnorderedList>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            <strong>Money-saving tip:</strong> If possible, move a week before or after peak times. Prices drop by 20-40% and availability is much better.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            How to Move on a Student Budget: Money-Saving Strategies
          </Heading>
          
          <Heading as="h3" size="lg" mt={6} mb={3}>
            1. Share a Van with Other Students
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Many services offer shared van options where 2-4 students heading in the same direction split the cost. A £120 move becomes £30-60 per person. Post in your university Facebook group or use student forums to find van-share partners.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            2. Declutter Before Moving
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Every box costs money to move. Sell textbooks, donate old clothes, and leave behind items you can replace cheaply at your destination. A typical student can reduce their load by 30-40% by ruthless decluttering.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            3. Use Free Packing Materials
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Don't buy boxes! Get free sturdy boxes from: supermarkets (ask at customer service), campus bookshops (textbook delivery boxes), local shops, and Facebook Marketplace. Use clothes and towels as padding instead of bubble wrap.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            4. Book During Off-Peak Times
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Mid-week moves (Tuesday-Thursday) are 20-30% cheaper than weekends. Early morning slots (8-10am) are often discounted because most students prefer afternoon moves.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            5. Do Your Own Packing and Loading
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Have everything packed and ready before the van arrives. Recruit friends to help load (pizza and drinks are cheaper than paying for extra labor). Every 30 minutes saved is £10-15 in your pocket.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            6. Consider Train + Taxi for Small Loads
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            If you only have 2-3 bags and a few boxes, a train ticket (£20-50 with railcard) plus taxi at each end (£10-20) might be cheaper than a van, especially for short distances.
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            What to Move vs What to Leave Behind
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            <strong>Definitely move:</strong>
          </Text>
          <UnorderedList spacing={2} fontSize="lg" pl={6} mb={4}>
            <ListItem>Laptop, phone, electronics</ListItem>
            <ListItem>Important documents (passport, birth certificate)</ListItem>
            <ListItem>Sentimental items</ListItem>
            <ListItem>Quality clothing and shoes</ListItem>
            <ListItem>Textbooks you'll use again</ListItem>
          </UnorderedList>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            <strong>Consider leaving behind:</strong>
          </Text>
          <UnorderedList spacing={2} fontSize="lg" pl={6} mb={6}>
            <ListItem>Cheap furniture (costs more to move than replace)</ListItem>
            <ListItem>Kitchen equipment (if new place is furnished)</ListItem>
            <ListItem>Old textbooks (sell or donate)</ListItem>
            <ListItem>Bulky items you rarely use</ListItem>
            <ListItem>Anything you can buy for £10-20 at your destination</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Student Storage Solutions
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            Many students need storage during summer holidays or year abroad. Options include:
          </Text>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>University storage</strong> - Some unis offer summer storage (£50-100)</ListItem>
            <ListItem><strong>Self-storage units</strong> - £30-80/month for a student room's worth</ListItem>
            <ListItem><strong>Student storage companies</strong> - Collect, store, and deliver (£80-150/summer)</ListItem>
            <ListItem><strong>Share with friends</strong> - Rent one unit between 2-3 students</ListItem>
            <ListItem><strong>Leave at parents' house</strong> - Free if you can get it there!</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Best Student Moving Services in the UK (2025)
          </Heading>
          <UnorderedList spacing={3} fontSize="lg" pl={6} mb={6}>
            <ListItem><strong>Speedy Van Student</strong> - 20% student discount, flexible booking, from £20/hour</ListItem>
            <ListItem><strong>Student Beans Moving</strong> - Exclusive student deals, nationwide coverage</ListItem>
            <ListItem><strong>Uni Baggage</strong> - Specialist in student moves, includes storage</ListItem>
            <ListItem><strong>AnyVan Student</strong> - Shared van options, good for long distances</ListItem>
            <ListItem><strong>Local man and van</strong> - Often cheapest for local moves, check university forums</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            University-Specific Moving Tips
          </Heading>
          
          <Heading as="h3" size="lg" mt={6} mb={3}>
            Campus Access and Parking
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Most university campuses have strict vehicle access rules. Book your moving slot with accommodation office 1-2 weeks in advance. Some unis charge £10-30 for vehicle access permits. Peak times (September, June) have limited slots - book early. Have a backup parking plan if campus access is denied.
          </Heading>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            Halls of Residence Challenges
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Halls often have narrow corridors, small lifts, and many flights of stairs. Warn your moving service in advance. Consider booking two people if you're on a high floor. Move during quieter times to avoid lift queues.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            International Students
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            If you're an international student, consider: shipping large items home vs storage, selling furniture and electronics before leaving, using student storage for the summer, and booking your move well in advance (visa timing can be unpredictable).
          </Text>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Student Moving Checklist
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            <strong>4 weeks before:</strong>
          </Text>
          <UnorderedList spacing={2} fontSize="lg" pl={6} mb={4}>
            <ListItem>Get quotes from 3-5 student moving services</ListItem>
            <ListItem>Book your preferred service</ListItem>
            <ListItem>Notify accommodation office of move date</ListItem>
            <ListItem>Start decluttering and selling unwanted items</ListItem>
          </UnorderedList>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            <strong>2 weeks before:</strong>
          </Text>
          <UnorderedList spacing={2} fontSize="lg" pl={6} mb={4}>
            <ListItem>Collect free boxes from supermarkets</ListItem>
            <ListItem>Confirm campus access and parking arrangements</ListItem>
            <ListItem>Take meter readings and photos of current room</ListItem>
            <ListItem>Arrange mail forwarding</ListItem>
          </UnorderedList>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            <strong>1 week before:</strong>
          </Text>
          <UnorderedList spacing={2} fontSize="lg" pl={6} mb={4}>
            <ListItem>Start packing non-essentials</ListItem>
            <ListItem>Confirm move time with service</ListItem>
            <ListItem>Recruit friends to help load</ListItem>
            <ListItem>Prepare payment (most services accept card)</ListItem>
          </UnorderedList>
          <Text fontSize="lg" lineHeight="tall" mb={4}>
            <strong>Moving day:</strong>
          </Text>
          <UnorderedList spacing={2} fontSize="lg" pl={6} mb={6}>
            <ListItem>Have everything packed and ready</ListItem>
            <ListItem>Do final room check</ListItem>
            <ListItem>Take photos of empty room (for deposit)</ListItem>
            <ListItem>Hand in keys to accommodation office</ListItem>
          </UnorderedList>
        </Box>

        <Box>
          <Heading as="h2" size="xl" mb={4}>
            Frequently Asked Questions
          </Heading>
          
          <Heading as="h3" size="lg" mt={6} mb={3}>
            Do I need to show my student ID for the discount?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Yes, most services require a valid student ID or university email address. Some also accept NUS cards or enrollment confirmation letters.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            Can my parents book and pay for me?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Absolutely! Many parents book and pay for their children's student moves. Just make sure the student ID is provided for the discount.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            What if I need to cancel my booking?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Most services allow free cancellation up to 48 hours before. Within 48 hours, you might forfeit a deposit (usually 20-50% of total cost). Always check the cancellation policy when booking.
          </Text>

          <Heading as="h3" size="lg" mt={6} mb={3}>
            Is my stuff insured during the move?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Reputable services include basic goods-in-transit insurance (usually up to £10,000). For expensive items (laptop, musical instruments), check if you need additional coverage or use your parents' home insurance.
          </Text>
        </Box>

        <Box bg="green.50" p={8} borderRadius="lg">
          <Heading as="h2" size="xl" mb={4}>
            Ready to Book Your Student Move?
          </Heading>
          <Text fontSize="lg" lineHeight="tall" mb={6}>
            Get 20% student discount on all moves. Flexible booking, campus access expertise, and storage options available. From £20/hour with valid student ID.
          </Text>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            📞 Student Hotline: 0800 XXX XXXX
          </Text>
          <Text fontSize="lg">
            Or book online at speedy-van.co.uk/student with code STUDENT20
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}

