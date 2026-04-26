"use client";

import { Box, HStack, Heading, Spinner, Stack, Text, chakra } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import type { PriceQuote } from "@/lib/booking-types";

const MotionBox = motion.create(chakra.div);

interface PriceSummaryProps {
  quote: PriceQuote | null;
  loading: boolean;
  error: string | null;
}

function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

export function PriceSummary({ quote, loading, error }: PriceSummaryProps) {
  return (
    <Box
      bg="glass"
      rounded="xl"
      border="1px solid"
      borderColor="glassBorder"
      backdropFilter="blur(16px)"
      style={{ WebkitBackdropFilter: "blur(16px)" }}
      p={{ base: "6", md: "7" }}
      position={{ lg: "sticky" }}
      top={{ lg: "100px" }}
    >
      <Stack gap="5">
        <HStack justify="space-between" align="baseline">
          <Text
            color="gold"
            fontFamily="heading"
            fontSize="xs"
            letterSpacing="0.32em"
            textTransform="uppercase"
            fontWeight="500"
          >
            Live Quote
          </Text>
          {loading && <Spinner size="sm" color="gold" />}
        </HStack>

        <AnimatePresence mode="wait">
          {error && !loading && (
            <MotionBox
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Text fontFamily="body" color="crimson" fontSize="sm">
                {error}
              </Text>
            </MotionBox>
          )}

          {!quote && !error && !loading && (
            <MotionBox
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Stack gap="2">
                <Heading as="div" fontFamily="heading" fontWeight="700" color="pearl" fontSize="3xl">
                  £—
                </Heading>
                <Text fontFamily="body" color="muted" fontSize="sm">
                  Enter both addresses to see your fixed price.
                </Text>
              </Stack>
            </MotionBox>
          )}

          {quote && !error && (
            <MotionBox
              key={`quote-${quote.totalPrice}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Stack gap="5">
                <Stack gap="1">
                  <Heading
                    as="div"
                    fontFamily="heading"
                    fontWeight="800"
                    color="gold"
                    fontSize={{ base: "4xl", md: "5xl" }}
                    letterSpacing="-0.02em"
                    lineHeight="1"
                  >
                    {fmt(quote.totalPrice)}
                  </Heading>
                  <Text fontFamily="body" color="muted" fontSize="xs">
                    Fixed price · {quote.recommendedVehicle?.replace(/_/g, " ").toLowerCase() || "best-fit van"}
                    {quote.estimatedDuration ? ` · ${Math.round(quote.estimatedDuration / 60)}h` : ""}
                  </Text>
                </Stack>

                <Box h="1px" bg="rgba(255,255,255,0.08)" />

                <Stack gap="2.5">
                  {quote.basePrice > 0 && (
                    <HStack justify="space-between">
                      <Text fontFamily="body" color="muted" fontSize="sm">
                        Base service
                      </Text>
                      <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                        {fmt(quote.basePrice)}
                      </Text>
                    </HStack>
                  )}
                  {quote.distancePrice > 0 && (
                    <HStack justify="space-between">
                      <Text fontFamily="body" color="muted" fontSize="sm">
                        Distance
                      </Text>
                      <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                        {fmt(quote.distancePrice)}
                      </Text>
                    </HStack>
                  )}
                  {quote.itemsPrice > 0 && (
                    <HStack justify="space-between">
                      <Text fontFamily="body" color="muted" fontSize="sm">
                        Volume / weight
                      </Text>
                      <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                        {fmt(quote.itemsPrice)}
                      </Text>
                    </HStack>
                  )}
                  {quote.timePrice > 0 && (
                    <HStack justify="space-between">
                      <Text fontFamily="body" color="muted" fontSize="sm">
                        Time / labour
                      </Text>
                      <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                        {fmt(quote.timePrice)}
                      </Text>
                    </HStack>
                  )}
                  {quote.urgencyPrice > 0 && (
                    <HStack justify="space-between">
                      <Text fontFamily="body" color="muted" fontSize="sm">
                        Service tier
                      </Text>
                      <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                        {fmt(quote.urgencyPrice)}
                      </Text>
                    </HStack>
                  )}
                </Stack>
              </Stack>
            </MotionBox>
          )}
        </AnimatePresence>

        <Box h="1px" bg="rgba(255,255,255,0.08)" />
        <Stack gap="2">
          <HStack gap="2">
            <Box color="gold">✓</Box>
            <Text fontFamily="body" color="muted" fontSize="xs">
              No fuel surcharges
            </Text>
          </HStack>
          <HStack gap="2">
            <Box color="gold">✓</Box>
            <Text fontFamily="body" color="muted" fontSize="xs">
              Goods in Transit insurance
            </Text>
          </HStack>
          <HStack gap="2">
            <Box color="gold">✓</Box>
            <Text fontFamily="body" color="muted" fontSize="xs">
              Free reschedule up to 24h
            </Text>
          </HStack>
        </Stack>
      </Stack>
    </Box>
  );
}
