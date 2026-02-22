'use client';

import { Container, Heading, Text, VStack, Box, Divider, List, ListItem, ListIcon } from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, CloseIcon } from '@chakra-ui/icons';
import Header from '@/components/site/Header';

export default function CancellationPage() {
  return (
    <>
      <Header />
      <Container maxW="5xl" py={{ base: 20, md: 32 }} mt={{ base: 16, md: 20 }}>
        <VStack align="start" spacing={10}>
          {/* Header Section */}
          <Box w="full">
            <Heading 
              as="h1" 
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="bold"
              color="white"
              mb={4}
              bgGradient="linear(to-r, white, blue.200)"
              bgClip="text"
            >
              Cancellation & Refund Policy
            </Heading>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="rgba(255, 255, 255, 0.8)" lineHeight="tall">
              We understand plans change. Review our transparent cancellation policy to understand your options and any applicable fees.
            </Text>
          </Box>

          <Divider borderColor="rgba(59, 130, 246, 0.3)" />

          {/* Company Info Card */}
          <Box 
            w="full"
            p={{ base: 6, md: 8 }}
            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)"
            borderRadius="xl"
            border="2px solid"
            borderColor="rgba(59, 130, 246, 0.4)"
            shadow="lg"
          >
            <VStack align="start" spacing={3}>
              <Heading as="h2" fontSize="2xl" fontWeight="bold" color="blue.300">
                SPEEDY VAN REMOVALS LTD
              </Heading>
              <Text fontSize="md" color="rgba(255, 255, 255, 0.85)" fontWeight="medium">
                Company No. SC865658 · Registered in Scotland
              </Text>
              <Text fontSize="md" color="rgba(255, 255, 255, 0.85)">
                📍 Office 2.18 1 Barrack St, Hamilton ML3 0HS, United Kingdom
              </Text>
              <Text fontSize="md" color="rgba(255, 255, 255, 0.85)">
                📧 support@speedy-van.co.uk | 📞 01202 129746
              </Text>
            </VStack>
          </Box>

          {/* Cancellation Tiers */}
          <VStack align="start" spacing={8} w="full">
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={6}>
                Cancellation Timeline & Fees
              </Heading>
              
              <VStack align="start" spacing={5} w="full">
                {/* Free Cancellation */}
                <Box 
                  w="full"
                  p={6} 
                  bg="rgba(34, 197, 94, 0.12)" 
                  borderRadius="xl" 
                  border="2px solid" 
                  borderColor="rgba(34, 197, 94, 0.4)"
                  shadow="md"
                >
                  <VStack align="start" spacing={3}>
                    <Box display="flex" alignItems="center" gap={3}>
                      <CheckCircleIcon boxSize={8} color="green.400" />
                      <Heading as="h3" fontSize="xl" color="green.300" fontWeight="bold">
                        Free Cancellation
                      </Heading>
                    </Box>
                    <Text fontSize="lg" fontWeight="semibold" color="rgba(255, 255, 255, 0.95)">
                      48+ Hours Before Service
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.85)" fontSize="md" lineHeight="tall">
                      Cancel your booking at any time up to 48 hours before your scheduled service and receive a full 100% refund. No questions asked, no penalties.
                    </Text>
                    <List spacing={2} mt={2}>
                      <ListItem color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        Full refund processed within 5-7 business days
                      </ListItem>
                      <ListItem color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        Instant confirmation via email
                      </ListItem>
                      <ListItem color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        Re-book anytime at the same rate
                      </ListItem>
                    </List>
                  </VStack>
                </Box>

                {/* Partial Fee */}
                <Box 
                  w="full"
                  p={6} 
                  bg="rgba(251, 191, 36, 0.12)" 
                  borderRadius="xl" 
                  border="2px solid" 
                  borderColor="rgba(251, 191, 36, 0.4)"
                  shadow="md"
                >
                  <VStack align="start" spacing={3}>
                    <Box display="flex" alignItems="center" gap={3}>
                      <WarningIcon boxSize={8} color="yellow.400" />
                      <Heading as="h3" fontSize="xl" color="yellow.300" fontWeight="bold">
                        Partial Cancellation Fee
                      </Heading>
                    </Box>
                    <Text fontSize="lg" fontWeight="semibold" color="rgba(255, 255, 255, 0.95)">
                      24-48 Hours Before Service
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.85)" fontSize="md" lineHeight="tall">
                      Cancellations within this window incur a 50% fee to cover driver allocation and scheduling costs. You will receive a 50% refund of the total booking amount.
                    </Text>
                    <List spacing={2} mt={2}>
                      <ListItem color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                        <ListIcon as={CheckCircleIcon} color="yellow.400" />
                        50% refund processed within 5-7 business days
                      </ListItem>
                      <ListItem color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                        <ListIcon as={CheckCircleIcon} color="yellow.400" />
                        Helps us compensate the driver's reserved time
                      </ListItem>
                    </List>
                  </VStack>
                </Box>

                {/* No Refund */}
                <Box 
                  w="full"
                  p={6} 
                  bg="rgba(239, 68, 68, 0.12)" 
                  borderRadius="xl" 
                  border="2px solid" 
                  borderColor="rgba(239, 68, 68, 0.4)"
                  shadow="md"
                >
                  <VStack align="start" spacing={3}>
                    <Box display="flex" alignItems="center" gap={3}>
                      <CloseIcon boxSize={7} color="red.400" />
                      <Heading as="h3" fontSize="xl" color="red.300" fontWeight="bold">
                        No Refund
                      </Heading>
                    </Box>
                    <Text fontSize="lg" fontWeight="semibold" color="rgba(255, 255, 255, 0.95)">
                      Less Than 24 Hours or No-Show
                    </Text>
                    <Text color="rgba(255, 255, 255, 0.85)" fontSize="md" lineHeight="tall">
                      Cancellations made less than 24 hours before your scheduled service, or if you don't show up at the agreed time, are charged the full booking amount with no refund.
                    </Text>
                    <List spacing={2} mt={2}>
                      <ListItem color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                        <ListIcon as={CloseIcon} color="red.400" />
                        Full amount retained (100% cancellation fee)
                      </ListItem>
                      <ListItem color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                        <ListIcon as={CloseIcon} color="red.400" />
                        Driver has already been dispatched and allocated
                      </ListItem>
                      <ListItem color="rgba(255, 255, 255, 0.8)" fontSize="sm">
                        <ListIcon as={CloseIcon} color="red.400" />
                        Vehicle reserved and unavailable for other bookings
                      </ListItem>
                    </List>
                  </VStack>
                </Box>
              </VStack>
            </Box>

            {/* Our Commitment */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                Our Commitment to You
              </Heading>
              <Box 
                p={6} 
                bg="rgba(59, 130, 246, 0.08)" 
                borderRadius="lg" 
                border="1px solid" 
                borderColor="rgba(59, 130, 246, 0.3)"
              >
                <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                  If we cannot fulfill a confirmed booking due to circumstances on our end (driver unavailability, vehicle breakdown, etc.), you will receive a <Text as="span" fontWeight="bold" color="blue.300">full 100% refund</Text> immediately.
                </Text>
                <List spacing={3}>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    <ListIcon as={CheckCircleIcon} color="blue.400" />
                    We'll notify you immediately if any issues arise
                  </ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    <ListIcon as={CheckCircleIcon} color="blue.400" />
                    Priority re-booking at no extra cost
                  </ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    <ListIcon as={CheckCircleIcon} color="blue.400" />
                    Compensation for any inconvenience caused
                  </ListItem>
                </List>
              </Box>
            </Box>

            {/* How to Cancel */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                How to Cancel Your Booking
              </Heading>
              <VStack align="start" spacing={4}>
                <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall">
                  Cancelling your booking is quick and easy:
                </Text>
                <List spacing={3}>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    <ListIcon as={CheckCircleIcon} color="blue.400" />
                    <Text as="span" fontWeight="semibold">Online:</Text> Log into your account and cancel from your bookings dashboard
                  </ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    <ListIcon as={CheckCircleIcon} color="blue.400" />
                    <Text as="span" fontWeight="semibold">Email:</Text> Send a cancellation request to support@speedy-van.co.uk
                  </ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    <ListIcon as={CheckCircleIcon} color="blue.400" />
                    <Text as="span" fontWeight="semibold">Phone:</Text> Call us at 01202 129746 during business hours
                  </ListItem>
                </List>
                <Box 
                  p={4} 
                  bg="rgba(59, 130, 246, 0.1)" 
                  borderRadius="md" 
                  w="full"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                >
                  <Text color="rgba(255, 255, 255, 0.8)" fontSize="sm" fontStyle="italic">
                    💡 Tip: You'll receive an instant confirmation email once your cancellation is processed, along with refund timeline details.
                  </Text>
                </Box>
              </VStack>
            </Box>

            {/* Refund Processing */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                Refund Processing
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                All eligible refunds are processed automatically and securely:
              </Text>
              <List spacing={3}>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Refunds credited to your original payment method
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Processing time: 5-7 business days (may vary by bank)
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Secure processing through Stripe payment gateway
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Email confirmation sent once refund is initiated
                </ListItem>
              </List>
            </Box>

            {/* Special Circumstances */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                Special Circumstances
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                We understand that emergencies happen. If you need to cancel due to:
              </Text>
              <List spacing={3} mb={4}>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  • Medical emergencies (with documentation)
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  • Severe weather conditions
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  • Unforeseen property access issues
                </ListItem>
              </List>
              <Text color="rgba(255, 255, 255, 0.85)" fontSize="md" lineHeight="tall">
                Please contact our support team. We'll review your situation on a case-by-case basis and work with you to find a fair solution, which may include waiving cancellation fees or rescheduling at no extra cost.
              </Text>
            </Box>
          </VStack>

          <Divider borderColor="rgba(59, 130, 246, 0.3)" />

          {/* Contact Section */}
          <Box 
            w="full"
            p={{ base: 6, md: 8 }}
            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)"
            borderRadius="xl"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.3)"
          >
            <VStack align="start" spacing={4}>
              <Heading as="h3" fontSize="xl" color="blue.300">
                Questions About Cancellations?
              </Heading>
              <Text color="rgba(255, 255, 255, 0.85)" fontSize="md" lineHeight="tall">
                Our customer support team is here to help with any questions about our cancellation policy or to assist with your cancellation request.
              </Text>
              <VStack align="start" spacing={2}>
                <Text color="rgba(255, 255, 255, 0.9)" fontSize="md">
                  📧 <Text as="span" fontWeight="medium">support@speedy-van.co.uk</Text>
                </Text>
                <Text color="rgba(255, 255, 255, 0.9)" fontSize="md">
                  📞 <Text as="span" fontWeight="medium">01202 129746</Text>
                </Text>
              </VStack>
              <Text color="rgba(255, 255, 255, 0.6)" fontSize="sm" mt={2}>
                Last Updated: December 2025
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </>
  );
}
