"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  chakra,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { easeOutExpo } from "@/lib/motion";
import { StarRating } from "@/components/review/StarRating";

const MotionBox = motion.create(chakra.div);
const API = process.env.NEXT_PUBLIC_API_URL || "";

interface ReviewFormProps {
  reference: string;
}

export function ReviewForm({ reference }: ReviewFormProps) {
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailValid && rating >= 1 && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/booking/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email, rating, comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const code = (j as { error?: string }).error;
        if (res.status === 401 || code === "EMAIL_MISMATCH") {
          setError("Email doesn't match this booking.");
        } else if (res.status === 409 || code === "ALREADY_REVIEWED") {
          setError("You've already reviewed this booking.");
        } else if (res.status === 400 || code === "NOT_COMPLETED") {
          setError("This booking isn't completed yet.");
        } else {
          setError("Could not submit your review. Please try again.");
        }
        setSubmitting(false);
        return;
      }
      setDone(true);
      setSubmitting(false);
    } catch {
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Box bg="pearl" minH="100vh" py={{ base: "28", md: "32" }}>
      <Container maxW="500px">
        <AnimatePresence mode="wait">
          {!done ? (
            <MotionBox
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: easeOutExpo }}
              bg="surface"
              rounded="xl"
              p={{ base: "6", md: "8" }}
              boxShadow="0 16px 48px rgba(9,9,11,0.08)"
            >
              <Stack gap="6">
                <Stack gap="2" textAlign="center">
                  <Text fontSize="3xl">⭐</Text>
                  <Heading as="h1" fontFamily="heading" fontWeight="800" color="ink" fontSize="2xl">
                    Rate Your Experience
                  </Heading>
                  <Text fontFamily="body" color="muted" fontSize="sm">
                    How was your move with Speedy Van?
                  </Text>
                  <Text fontFamily="mono" color="muted" fontSize="xs" mt="1">
                    {reference}
                  </Text>
                </Stack>

                <chakra.form onSubmit={submit} display="flex" flexDirection="column" gap="5">
                  <Stack gap="2">
                    <Text
                      fontFamily="body"
                      color="muted"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Email (to verify)
                    </Text>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      bg="pearl"
                      color="ink"
                      borderColor="rgba(9,9,11,0.15)"
                      _focus={{ borderColor: "gold", boxShadow: "0 0 0 1px #D4AF37" }}
                      h="11"
                      rounded="md"
                    />
                  </Stack>

                  <Stack gap="2" align="center">
                    <Text
                      fontFamily="body"
                      color="muted"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Tap to rate
                    </Text>
                    <StarRating value={rating} onChange={setRating} size={44} />
                  </Stack>

                  <Stack gap="2">
                    <Text
                      fontFamily="body"
                      color="muted"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Tell us more (optional)
                    </Text>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value.slice(0, 500))}
                      placeholder="Share what went well…"
                      bg="pearl"
                      color="ink"
                      borderColor="rgba(9,9,11,0.15)"
                      _focus={{ borderColor: "gold", boxShadow: "0 0 0 1px #D4AF37" }}
                      rows={4}
                      rounded="md"
                      resize="vertical"
                    />
                    <Text fontFamily="mono" color="muted" fontSize="2xs" textAlign="right">
                      {comment.length}/500
                    </Text>
                  </Stack>

                  {error && (
                    <Box bg="rgba(220,38,38,0.08)" rounded="md" p="3">
                      <Text color="crimson" fontFamily="body" fontSize="sm">
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
                    fontWeight="700"
                    fontSize="md"
                    w="full"
                    disabled={!canSubmit}
                    loading={submitting}
                    _hover={{ bg: "goldSoft" }}
                    _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                  >
                    Submit Review →
                  </Button>
                </chakra.form>
              </Stack>
            </MotionBox>
          ) : (
            <MotionBox
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: easeOutExpo }}
              bg="surface"
              rounded="xl"
              p={{ base: "8", md: "10" }}
              textAlign="center"
              position="relative"
              overflow="hidden"
              boxShadow="0 16px 48px rgba(9,9,11,0.08)"
            >
              {/* Confetti particles */}
              {Array.from({ length: 18 }).map((_, i) => {
                const left = (i * 53) % 100;
                const delay = (i % 6) * 0.05;
                const drift = ((i * 7) % 24) - 12;
                return (
                  <MotionBox
                    key={i}
                    position="absolute"
                    top="-10px"
                    left={`${left}%`}
                    w="6px"
                    h="10px"
                    bg={i % 3 === 0 ? "gold" : i % 3 === 1 ? "goldSoft" : "emerald"}
                    rounded="sm"
                    initial={{ y: -20, opacity: 1, rotate: 0 }}
                    animate={{
                      y: 480,
                      opacity: [1, 1, 0],
                      rotate: 360,
                      x: drift,
                    }}
                    transition={{ duration: 2, delay, ease: "easeIn" }}
                    pointerEvents="none"
                  />
                );
              })}

              <Stack gap="5" position="relative">
                <Text fontSize="5xl">🎉</Text>
                <Heading as="h2" fontFamily="heading" fontWeight="800" color="ink" fontSize="2xl">
                  Thank you for your review!
                </Heading>
                <Text fontFamily="body" color="muted" fontSize="md">
                  Your feedback helps us improve.
                </Text>
                <Link href="/">
                  <Button
                    bg="obsidian"
                    color="pearl"
                    rounded="full"
                    h="11"
                    fontWeight="600"
                    px="8"
                    _hover={{ bg: "ink" }}
                  >
                    Back to Home
                  </Button>
                </Link>
              </Stack>
            </MotionBox>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
}
