"use client";

import {
  Box,
  Button,
  Container,
  HStack,
  SimpleGrid,
  Stack,
  chakra,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ParticleField } from "@/components/home/ParticleField";
import { PriceSummary } from "./PriceSummary";
import { Step0Service } from "./Step0Service";
import { Step1Addresses } from "./Step1Addresses";
import { Step2Schedule } from "./Step2Schedule";
import { Step3Payment } from "./Step3Payment";
import { StepIndicator } from "./StepIndicator";
import {
  buildSyntheticItems,
  DEFAULT_BOOKING,
  getApiBase,
  type BookingState,
  type PriceQuote,
} from "@/lib/booking-types";
import { easeOutExpo } from "@/lib/motion";
import { SITE } from "@/lib/site";

const MotionBox = motion.create(chakra.div);

const STEP_LABELS = ["Service", "Addresses", "Schedule", "Confirm"];

type StepNum = 1 | 2 | 3 | 4;

export function BookingFlow() {
  const [step, setStep] = useState<StepNum>(1);
  const [state, setState] = useState<BookingState>(DEFAULT_BOOKING);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (next: Partial<BookingState>) => setState((prev) => ({ ...prev, ...next }));

  // Live quote fetch — debounced when both addresses present
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quoteKey = useMemo(() => {
    if (!state.pickup || !state.dropoff) return null;
    return JSON.stringify({
      p: state.pickup.postcode,
      d: state.dropoff.postcode,
      ps: state.pickupDetails.size,
      ds: state.dropoffDetails.size,
      pf: state.pickupDetails.floors,
      df: state.dropoffDetails.floors,
      pl: state.pickupDetails.hasLift,
      dl: state.dropoffDetails.hasLift,
      sv: state.serviceType,
      ts: state.timeSlot,
      sd: state.scheduledDate,
    });
  }, [state]);

  useEffect(() => {
    if (!quoteKey || !state.pickup || !state.dropoff) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const body = {
          items: buildSyntheticItems(state.pickupDetails.size),
          pickupAddress: {
            address: state.pickup!.full,
            postcode: state.pickup!.postcode,
            coordinates: state.pickup!.coordinates,
          },
          dropoffAddress: {
            address: state.dropoff!.full,
            postcode: state.dropoff!.postcode,
            coordinates: state.dropoff!.coordinates,
          },
          pickupProperty: {
            type: state.pickupDetails.type,
            floors: state.pickupDetails.floors,
            hasLift: state.pickupDetails.hasLift,
            hasParking: state.pickupDetails.hasParking,
            accessNotes: state.pickupDetails.accessNotes,
          },
          dropoffProperty: {
            type: state.dropoffDetails.type,
            floors: state.dropoffDetails.floors,
            hasLift: state.dropoffDetails.hasLift,
            hasParking: state.dropoffDetails.hasParking,
            accessNotes: state.dropoffDetails.accessNotes,
          },
          serviceType: state.serviceType === "white-glove" ? "white-glove" : state.serviceType,
          scheduledDate: state.scheduledDate || undefined,
          timeSlot: state.timeSlot,
          promoCode: state.promoCode || undefined,
        };
        const res = await fetch(`${getApiBase()}/api/pricing/quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          setQuoteError(json?.error || "Could not calculate price.");
          setQuote(null);
        } else {
          setQuote(json.data as PriceQuote);
        }
      } catch {
        setQuoteError("Could not reach the pricing server.");
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [quoteKey, state]);

  function canAdvance(): boolean {
    if (step === 1) return !!state.serviceCategory;
    if (step === 2) return !!state.pickup && !!state.dropoff;
    if (step === 3) return !!state.scheduledDate;
    if (step === 4) {
      const c = state.customer;
      return !!(c.name && c.email && c.phone && /\S+@\S+\.\S+/.test(c.email));
    }
    return false;
  }

  async function handleSubmit() {
    if (!quote) {
      setSubmitError("Please wait for the price to calculate.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : SITE.url;
      const body = {
        amount: quote.totalPrice,
        currency: "gbp",
        customerEmail: state.customer.email,
        customerName: state.customer.name,
        bookingData: {
          customer: state.customer,
          pickupAddress: {
            address: state.pickup?.full,
            postcode: state.pickup?.postcode || "",
            coordinates: state.pickup?.coordinates,
          },
          dropoffAddress: {
            address: state.dropoff?.full,
            postcode: state.dropoff?.postcode || "",
            coordinates: state.dropoff?.coordinates,
          },
          pricing: {
            total: quote.totalPrice,
            currency: "GBP",
          },
          pickupDetails: state.pickupDetails,
          dropoffDetails: state.dropoffDetails,
          serviceType: state.serviceType,
          scheduledDate: state.scheduledDate,
          pickupDate: state.scheduledDate,
          notes: state.notes,
          promotionCode: state.promoCode || undefined,
        },
        successUrl: `${origin}/book/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/book/cancelled`,
      };
      const res = await fetch(`${getApiBase()}/api/payment/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json?.sessionUrl) {
        setSubmitError(json?.error || "Could not start payment.");
        return;
      }
      window.location.assign(json.sessionUrl);
    } catch {
      setSubmitError("Could not reach the payment server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box bg="obsidian" color="pearl" minH="100vh" position="relative" overflow="hidden">
      <Box
        position="absolute"
        top="-20%"
        left="50%"
        transform="translateX(-50%)"
        w="80%"
        h="80%"
        bg="radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 60%)"
        pointerEvents="none"
      />
      <ParticleField />
      <Container maxW="6xl" pt={{ base: "28", md: "32" }} pb={{ base: "16", md: "24" }} position="relative" zIndex={1}>
        <StepIndicator current={step} steps={STEP_LABELS} />

        <SimpleGrid columns={{ base: 1, lg: 12 }} gap={{ base: "10", lg: "12" }}>
          <Box gridColumn={{ lg: "span 8" }}>
            <Box
              bg="glass"
              rounded="xl"
              border="1px solid"
              borderColor="glassBorder"
              backdropFilter="blur(16px)"
              style={{ WebkitBackdropFilter: "blur(16px)" }}
              p={{ base: "6", md: "10" }}
            >
              <AnimatePresence mode="wait">
                <MotionBox
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.4, ease: easeOutExpo }}
                >
                  {step === 1 && <Step0Service state={state} set={set} />}
                  {step === 2 && (
                    <Step1Addresses
                      pickup={state.pickup}
                      setPickup={(a) => set({ pickup: a })}
                      pickupDetails={state.pickupDetails}
                      setPickupDetails={(d) => set({ pickupDetails: d })}
                      dropoff={state.dropoff}
                      setDropoff={(a) => set({ dropoff: a })}
                      dropoffDetails={state.dropoffDetails}
                      setDropoffDetails={(d) => set({ dropoffDetails: d })}
                      items={state.items ?? []}
                      setItems={(items) => set({ items })}
                    />
                  )}
                  {step === 3 && (
                    <Step2Schedule state={state} set={set} quote={quote} quoteLoading={quoteLoading} />
                  )}
                  {step === 4 && <Step3Payment state={state} set={set} />}
                </MotionBox>
              </AnimatePresence>

              <HStack mt={{ base: "10", md: "12" }} gap="3" justify="space-between">
                <Button
                  variant="outline"
                  borderColor="glassBorder"
                  color="pearl"
                  rounded="full"
                  h="12"
                  px="6"
                  visibility={step === 1 ? "hidden" : "visible"}
                  onClick={() => setStep((s) => (s > 1 ? ((s - 1) as StepNum) : s))}
                  _hover={{ bg: "rgba(255,255,255,0.05)", borderColor: "gold" }}
                >
                  Back
                </Button>

                {step < 4 ? (
                  <Button
                    bg="gold"
                    color="obsidian"
                    rounded="full"
                    h="12"
                    px="8"
                    fontWeight="600"
                    disabled={!canAdvance()}
                    onClick={() => setStep((s) => (s < 4 ? ((s + 1) as StepNum) : s))}
                    _hover={{ bg: "goldSoft" }}
                    _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
                    boxShadow="goldGlow"
                  >
                    Continue →
                  </Button>
                ) : (
                  <Button
                    bg="gold"
                    color="obsidian"
                    rounded="full"
                    h="12"
                    px="8"
                    fontWeight="600"
                    disabled={!canAdvance() || submitting || !quote}
                    loading={submitting}
                    onClick={handleSubmit}
                    _hover={{ bg: "goldSoft" }}
                    _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
                    boxShadow="goldGlow"
                  >
                    {quote ? `Pay £${quote.totalPrice.toFixed(2)} →` : "Pay →"}
                  </Button>
                )}
              </HStack>

              {submitError && (
                <Box
                  mt="4"
                  bg="rgba(220,38,38,0.1)"
                  border="1px solid"
                  borderColor="crimson"
                  rounded="md"
                  px="4"
                  py="3"
                >
                  <chakra.p color="crimson" fontFamily="body" fontSize="sm">
                    {submitError}
                  </chakra.p>
                </Box>
              )}
            </Box>
          </Box>

          <Box gridColumn={{ lg: "span 4" }}>
            <PriceSummary quote={quote} loading={quoteLoading} error={quoteError} />
          </Box>
        </SimpleGrid>

        <Stack mt="10" gap="2" textAlign="center">
          <chakra.p fontFamily="body" color="muted" fontSize="xs">
            Need a hand? Call <chakra.a href={SITE.phone.href} color="gold">{SITE.phone.display}</chakra.a> or WhatsApp{" "}
            <chakra.a href={SITE.whatsapp.href} color="gold" target="_blank" rel="noopener noreferrer">
              {SITE.whatsapp.display}
            </chakra.a>
          </chakra.p>
        </Stack>
      </Container>
    </Box>
  );
}
