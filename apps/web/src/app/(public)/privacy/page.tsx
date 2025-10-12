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
        <Heading as="h1" size="lg">
          Privacy Policy
        </Heading>
        
        <VStack align="start" spacing={2} p={4} bg="gray.50" borderRadius="md" w="full">
          <Text fontWeight="semibold" color="gray.800">
            SPEEDY VAN REMOVALS LTD
          </Text>
          <Text fontSize="sm" color="gray.600">
            Company No. SC865658 · Registered in Scotland
          </Text>
          <Text fontSize="sm" color="gray.600">
            Office 2.18, 1 Barrack Street, Hamilton, ML3 0DG, United Kingdom
          </Text>
        </VStack>

        <Text color="gray.700">
          We respect your privacy. We only collect the information needed to
          provide our services, improve your experience, and meet legal
          obligations. Payments are processed by Stripe; we do not store card
          details.
        </Text>
        <Text color="gray.600">
          For full details or data requests, contact support@speedy-van.co.uk.
        </Text>
      </VStack>
    </Container>
  );
}
