"use client";

import { Field, Heading, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import type { BookingState } from "@/lib/booking-types";

interface Step3Props {
  state: BookingState;
  set: (next: Partial<BookingState>) => void;
}

export function Step3Payment({ state, set }: Step3Props) {
  const c = state.customer;
  return (
    <Stack gap={{ base: "10", md: "12" }}>
      <Stack gap="2">
        <Text color="gold" fontFamily="heading" fontSize="xs" letterSpacing="0.32em" textTransform="uppercase">
          Step 3 of 3
        </Text>
        <Heading
          as="h2"
          fontFamily="heading"
          fontWeight="700"
          color="pearl"
          fontSize={{ base: "2xl", md: "3xl" }}
          letterSpacing="-0.02em"
        >
          Just your details.
        </Heading>
        <Text fontFamily="body" color="muted" fontSize="sm">
          We'll send confirmation by email and SMS. Payment is taken securely on the next screen via Stripe.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
        <Field.Root>
          <Field.Label color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
            Full name
          </Field.Label>
          <Input
            value={c.name}
            onChange={(e) => set({ customer: { ...c, name: e.target.value } })}
            placeholder="Sarah Thompson"
            autoComplete="name"
            bg="rgba(255,255,255,0.06)"
            border="1px solid"
            borderColor={c.name ? "gold" : "glassBorder"}
            color="pearl"
            h="12"
            rounded="md"
            _placeholder={{ color: "rgba(250,250,249,0.35)" }}
            _focus={{ borderColor: "gold" }}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
            Phone
          </Field.Label>
          <Input
            type="tel"
            value={c.phone}
            onChange={(e) => set({ customer: { ...c, phone: e.target.value } })}
            placeholder="07000 000 000"
            autoComplete="tel"
            bg="rgba(255,255,255,0.06)"
            border="1px solid"
            borderColor={c.phone ? "gold" : "glassBorder"}
            color="pearl"
            h="12"
            rounded="md"
            _placeholder={{ color: "rgba(250,250,249,0.35)" }}
            _focus={{ borderColor: "gold" }}
          />
        </Field.Root>

        <Field.Root gridColumn={{ md: "span 2" }}>
          <Field.Label color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
            Email
          </Field.Label>
          <Input
            type="email"
            value={c.email}
            onChange={(e) => set({ customer: { ...c, email: e.target.value } })}
            placeholder="you@example.com"
            autoComplete="email"
            bg="rgba(255,255,255,0.06)"
            border="1px solid"
            borderColor={c.email ? "gold" : "glassBorder"}
            color="pearl"
            h="12"
            rounded="md"
            _placeholder={{ color: "rgba(250,250,249,0.35)" }}
            _focus={{ borderColor: "gold" }}
          />
        </Field.Root>

        <Field.Root gridColumn={{ md: "span 2" }}>
          <Field.Label color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
            Promo code (optional)
          </Field.Label>
          <Input
            value={state.promoCode}
            onChange={(e) => set({ promoCode: e.target.value.toUpperCase() })}
            placeholder="WELCOME10"
            bg="rgba(255,255,255,0.06)"
            border="1px solid"
            borderColor="glassBorder"
            color="pearl"
            h="12"
            rounded="md"
            _placeholder={{ color: "rgba(250,250,249,0.35)" }}
            _focus={{ borderColor: "gold" }}
          />
        </Field.Root>
      </SimpleGrid>
    </Stack>
  );
}
