import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { Container, Heading, Text, VStack } from '@chakra-ui/react';

export const metadata: Metadata = buildMetadata({
  title: 'Cancellation & Refund Policy | Speedy Van',
  description: 'How cancellations and refunds work at Speedy Van.',
  alternates: { canonical: '/cancellation' },
});

export default function CancellationPage() {
  return (
    <Container maxW="4xl" py={{ base: 8, md: 14 }}>
      <VStack align="start" spacing={4}>
        <Heading as="h1" size="lg">
          Cancellation & Refund Policy
        </Heading>
        <Text color="gray.700">
          You may cancel free of charge within a short window after booking.
          Closer to the job start time, a partial fee may apply to cover driver
          allocation. If we cannot fulfil a confirmed booking, you will receive
          a full refund.
        </Text>
        <Text color="gray.600">
          Questions? Contact support@speedy-van.co.uk.
        </Text>
      </VStack>
    </Container>
  );
}
