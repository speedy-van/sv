import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { Container, Heading, Text, VStack } from '@chakra-ui/react';

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy | Speedy Van',
  description: 'How Speedy Van collects and uses your data.',
  alternates: { canonical: '/privacy' },
});

export default function PrivacyPage() {
  return (
    <Container maxW="4xl" py={{ base: 8, md: 14 }}>
      <VStack align="start" spacing={6}>
        <Heading as="h1" size="lg" color="white">
          Privacy Policy
        </Heading>
        
        <VStack 
          align="start" 
          spacing={2} 
          p={4} 
          bg="rgba(59, 130, 246, 0.1)" 
          borderRadius="md" 
          w="full"
          border="1px solid"
          borderColor="rgba(59, 130, 246, 0.3)"
        >
          <Text fontWeight="semibold" color="white">
            SPEEDY VAN REMOVALS LTD
          </Text>
          <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
            Company No. SC865658 · Registered in Scotland
          </Text>
          <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
            Office 2.18 1 Barrack St, Hamilton ML3 0HS, United Kingdom
          </Text>
        </VStack>

        <Text color="rgba(255, 255, 255, 0.9)">
          We respect your privacy. We only collect the information needed to
          provide our services, improve your experience, and meet legal
          obligations. Payments are processed by Stripe; we do not store card
          details.
        </Text>
        <Text color="rgba(255, 255, 255, 0.7)">
          For full details or data requests, contact support@speedy-van.co.uk.
        </Text>
      </VStack>
    </Container>
  );
}
