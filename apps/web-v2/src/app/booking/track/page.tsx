"use client";

import {
  Box,
  Button,
  Container,
  Field,
  Heading,
  Input,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { easeOutExpo } from "@/lib/motion";

const MotionDiv = motion.create(chakra.div);

export default function TrackIndexPage() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const ref = reference.trim().toUpperCase();
    if (!ref) {
      setError("Please enter your booking reference.");
      return;
    }
    if (!/^[A-Z0-9-]{4,}$/.test(ref)) {
      setError("That doesn't look like a valid reference.");
      return;
    }
    setSubmitting(true);
    const params = new URLSearchParams();
    if (email.trim()) params.set("email", email.trim());
    const qs = params.toString();
    router.push(`/booking/track/${encodeURIComponent(ref)}${qs ? `?${qs}` : ""}`);
  };

  return (
    <ClientShell>
      <PageHero
        eyebrow="Live Tracking"
        title="Track your move."
        subtitle="Enter your booking reference and we'll show you exactly where your crew is."
      />
      <Box bg="pearl" py={{ base: "16", md: "24" }}>
        <Container maxW="lg">
          <MotionDiv
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
          >
            <Box
              bg="obsidian"
              color="pearl"
              rounded="xl"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              p={{ base: "6", md: "10" }}
              boxShadow="0 24px 60px rgba(9,9,11,0.18)"
            >
              <Stack as="form" onSubmit={onSubmit} gap="6">
                <Stack gap="1.5">
                  <Text
                    color="gold"
                    fontFamily="heading"
                    fontSize="xs"
                    letterSpacing="0.32em"
                    textTransform="uppercase"
                    fontWeight="500"
                  >
                    Find My Booking
                  </Text>
                  <Heading
                    as="h2"
                    fontFamily="heading"
                    fontWeight="700"
                    color="pearl"
                    fontSize="2xl"
                    letterSpacing="-0.02em"
                  >
                    Lookup
                  </Heading>
                </Stack>

                <Field.Root>
                  <Field.Label
                    color="muted"
                    fontSize="xs"
                    fontWeight="500"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                  >
                    Booking Reference
                  </Field.Label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value.toUpperCase())}
                    placeholder="e.g. SV-2K7P9X"
                    bg="rgba(255,255,255,0.06)"
                    border="1px solid"
                    borderColor={reference ? "gold" : "glassBorder"}
                    color="pearl"
                    h="12"
                    rounded="md"
                    fontFamily="mono"
                    letterSpacing="0.08em"
                    _placeholder={{ color: "rgba(250,250,249,0.35)" }}
                    _focus={{ borderColor: "gold" }}
                    autoFocus
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label
                    color="muted"
                    fontSize="xs"
                    fontWeight="500"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                  >
                    Email (optional, for verification)
                  </Field.Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    bg="rgba(255,255,255,0.06)"
                    border="1px solid"
                    borderColor={email ? "gold" : "glassBorder"}
                    color="pearl"
                    h="12"
                    rounded="md"
                    _placeholder={{ color: "rgba(250,250,249,0.35)" }}
                    _focus={{ borderColor: "gold" }}
                  />
                </Field.Root>

                {error && (
                  <Box
                    bg="rgba(220,38,38,0.1)"
                    border="1px solid"
                    borderColor="crimson"
                    rounded="md"
                    px="4"
                    py="3"
                  >
                    <Text fontFamily="body" color="crimson" fontSize="sm">
                      {error}
                    </Text>
                  </Box>
                )}

                <Button
                  type="submit"
                  bg="gold"
                  color="obsidian"
                  rounded="full"
                  h="12"
                  fontWeight="600"
                  boxShadow="goldGlow"
                  _hover={{ bg: "goldSoft" }}
                  loading={submitting}
                  loadingText="Looking up…"
                >
                  Track booking →
                </Button>

                <Text fontFamily="body" color="muted" fontSize="xs" textAlign="center">
                  Reference is on your confirmation email. Lost it? Call{" "}
                  <chakra.a href="tel:+441202129746" color="gold">
                    01202 129 746
                  </chakra.a>
                  .
                </Text>
              </Stack>
            </Box>
          </MotionDiv>
        </Container>
      </Box>
    </ClientShell>
  );
}
