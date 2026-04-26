"use client";

import { Field, Heading, SimpleGrid, Stack, Text, Textarea, chakra } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AirlineCalendar } from "./AirlineCalendar";
import { PricingLoader } from "./PricingLoader";
import type { BookingState, PriceQuote } from "@/lib/booking-types";

const MotionBox = motion.create(chakra.div);

const SERVICES: Array<{ value: BookingState["serviceType"]; label: string; sub: string }> = [
  { value: "standard", label: "Standard", sub: "Two-person crew, blanket-wrap" },
  { value: "premium", label: "Premium", sub: "Disassembly + reassembly included" },
  { value: "white-glove", label: "White Glove", sub: "Full packing + unpacking" },
];

interface Step2Props {
  state: BookingState;
  set: (next: Partial<BookingState>) => void;
  quote: PriceQuote | null;
  quoteLoading: boolean;
}

export function Step2Schedule({ state, set, quote, quoteLoading }: Step2Props) {
  // Show loader for at least 2.5s the first time the user lands here
  const [loaderDone, setLoaderDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaderDone(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const showLoader = !loaderDone || (quoteLoading && !quote);

  const basePrice = quote?.totalPrice ?? 220;

  return (
    <Stack gap={{ base: "10", md: "12" }}>
      <Stack gap="2">
        <Text color="gold" fontFamily="heading" fontSize="xs" letterSpacing="0.32em" textTransform="uppercase">
          Step 3 of 4
        </Text>
        <Heading
          as="h2"
          fontFamily="heading"
          fontWeight="700"
          color="pearl"
          fontSize={{ base: "2xl", md: "3xl" }}
          letterSpacing="-0.02em"
        >
          When and how?
        </Heading>
        <Text fontFamily="body" color="muted" fontSize="sm">
          Pick the cheapest day and a time window. Prices update live.
        </Text>
      </Stack>

      {showLoader ? (
        <PricingLoader />
      ) : (
        <MotionBox
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AirlineCalendar
            selectedDate={state.scheduledDate}
            onDateChange={(iso) => set({ scheduledDate: iso })}
            selectedSlot={state.timeSlot}
            onSlotChange={(slot) => set({ timeSlot: slot })}
            basePrice={basePrice}
          />
        </MotionBox>
      )}

      <Stack gap="3">
        <Text color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
          Service level
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="3">
          {SERVICES.map((s) => {
            const active = state.serviceType === s.value;
            return (
              <MotionBox
                key={s.value}
                onClick={() => set({ serviceType: s.value })}
                cursor="pointer"
                bg={active ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)"}
                border="1px solid"
                borderColor={active ? "gold" : "glassBorder"}
                rounded="md"
                p="4"
                whileTap={{ scale: 0.98 }}
              >
                <Text fontFamily="heading" fontWeight="600" color="pearl" fontSize="md">
                  {s.label}
                </Text>
                <Text fontFamily="body" color="muted" fontSize="xs" mt="1">
                  {s.sub}
                </Text>
              </MotionBox>
            );
          })}
        </SimpleGrid>
      </Stack>

      <Field.Root>
        <Field.Label color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
          Anything we should know? (optional)
        </Field.Label>
        <Textarea
          value={state.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Fragile items, large appliances, parking restrictions…"
          bg="rgba(255,255,255,0.06)"
          border="1px solid"
          borderColor="glassBorder"
          color="pearl"
          rounded="md"
          rows={3}
          _placeholder={{ color: "rgba(250,250,249,0.35)" }}
          _focus={{ borderColor: "gold" }}
        />
      </Field.Root>
    </Stack>
  );
}
