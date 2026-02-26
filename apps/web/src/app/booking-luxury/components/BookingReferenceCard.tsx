'use client';

import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Button,
  Icon,
  Spinner,
  useClipboard,
} from '@chakra-ui/react';
import { FaInfoCircle, FaCopy } from 'react-icons/fa';
import LuxurySurfaceCard from './LuxurySurfaceCard';

export type BookingReferenceVariant = 'bar' | 'card';

interface BookingReferenceCardProps {
  /** Booking reference (e.g. SV-XXXXXX). Omit or empty = don't render. */
  reference: string | undefined;
  /** Show spinner instead of Copy when true */
  isLoading?: boolean;
  /** bar = compact horizontal bar; card = single unified card with short hint */
  variant?: BookingReferenceVariant;
}

/**
 * Single shared design for showing booking reference in the luxury flow.
 * Rendered at page level so it is visible on ALL steps (1, 2, 3) with one consistent,
 * distinct look (different from address/item/payment cards).
 * Critical: keeps data-testid="booking-reference-alert" for tracking/tests.
 */
export default function BookingReferenceCard({
  reference,
  isLoading = false,
  variant = 'bar',
}: BookingReferenceCardProps) {
  const { hasCopied, onCopy } = useClipboard(reference ?? '');

  if (!reference && !isLoading) {
    return null;
  }

  const content = (
    <Flex w="full" align="center" justify="space-between" gap={3} flexWrap="wrap">
      <HStack spacing={3}>
        <Icon as={FaInfoCircle} boxSize={5} color="blue.400" flexShrink={0} />
        <Box minW={0}>
          <Text color="text.primary" fontSize="sm" fontWeight="600">
            Booking reference{reference ? '' : ' (pending)'}
          </Text>
          <Text
            color="text.secondary"
            fontSize="sm"
            fontFamily={reference ? 'mono' : undefined}
            letterSpacing={reference ? 'wider' : undefined}
          >
            {reference || 'Generating your reference...'}
          </Text>
        </Box>
      </HStack>
      {reference ? (
        <Button
          size="sm"
          leftIcon={<FaCopy />}
          onClick={onCopy}
          colorScheme={hasCopied ? 'green' : 'blue'}
          variant="solid"
        >
          {hasCopied ? 'Copied' : 'Copy'}
        </Button>
      ) : (
        <Spinner size="sm" color="blue.400" />
      )}
    </Flex>
  );

  if (variant === 'card') {
    return (
      <LuxurySurfaceCard
        tone="info"
        borderWidth="2px"
        borderColor="blue.400"
        bg="linear-gradient(135deg, rgba(59,130,246,0.22), rgba(37,99,235,0.12))"
        data-testid="booking-reference-alert"
        data-critical="true"
        minH="100px"
      >
        <Box p={{ base: 3, md: 4 }}>
          {content}
          {reference && (
            <Text mt={2} color="text.secondary" fontSize="xs">
              Share with admin to view or modify before payment.
            </Text>
          )}
        </Box>
      </LuxurySurfaceCard>
    );
  }

  // variant === 'bar' — distinct design visible on all steps (not a content card)
  return (
    <Box
      borderRadius="2xl"
      border="1px solid"
      borderColor="border.primary"
      borderLeftWidth="4px"
      borderLeftColor="blue.400"
      bg="linear-gradient(90deg, rgba(59,130,246,0.08) 0%, var(--chakra-colors-bg-card) 24px)"
      p={{ base: 4, md: 5 }}
      data-testid="booking-reference-alert"
      data-critical="true"
      boxShadow="0 4px 20px rgba(59,130,246,0.12)"
    >
      {content}
    </Box>
  );
}
