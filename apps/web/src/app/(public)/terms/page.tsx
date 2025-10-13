import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { Container, Heading, Text, VStack } from '@chakra-ui/react';

export const metadata: Metadata = buildMetadata({
  title: 'Terms & Conditions | Speedy Van',
  description: 'Key terms for using Speedy Van services.',
  alternates: { canonical: '/terms' },
});

export default function TermsPage() {
  return (
    <Container maxW="4xl" py={{ base: 8, md: 14 }}>
      <VStack align="start" spacing={6}>
        <Heading as="h1" size="lg">
          Terms & Conditions
        </Heading>
        
        <VStack align="start" spacing={2} p={4} bg="gray.50" borderRadius="md" w="full">
          <Text fontWeight="semibold" color="gray.800">
            SPEEDY VAN REMOVALS LTD
          </Text>
          <Text fontSize="sm" color="gray.600">
            Company No. SC865658 · Registered in Scotland
          </Text>
          <Text fontSize="sm" color="gray.600">
            Office 2.18 1 Barrack St, Hamilton ML3 0HS, United Kingdom
          </Text>
        </VStack>

        <Text color="gray.700">
          By booking with Speedy Van, you agree to our service terms including
          scope of work, cancellations, and liability limits. Please ensure
          access, parking, and accurate item details are provided.
        </Text>
        <Text color="gray.600">
          For the complete terms or questions, email support@speedy-van.co.uk.
        </Text>
      </VStack>
    </Container>
  );
}
