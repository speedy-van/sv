"use client";

import {
  Box,
  Button,
  Container,
  HStack,
  Heading,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HiCheck, HiOutlineClipboard, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { ParticleField } from "@/components/home/ParticleField";
import { easeOutExpo } from "@/lib/motion";
import { getApiBase } from "@/lib/booking-types";
import { SITE } from "@/lib/site";

const MotionBox = motion.create(chakra.div);

interface SuccessViewProps {
  reference: string;
  sessionId: string;
  email: string;
}

export function SuccessView({ reference, sessionId, email }: SuccessViewProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Save email locally so the BookingDetectionPopup can re-introduce the user later.
  useEffect(() => {
    if (email) {
      try {
        window.localStorage.setItem("sv-last-email", email);
      } catch {
        /* ignore */
      }
    }
    if (reference) {
      try {
        window.localStorage.setItem("sv-last-booking-ref", reference);
      } catch {
        /* ignore */
      }
    }
  }, [email, reference]);

  const copyRef = async () => {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const downloadInvoice = async () => {
    if (!reference && !sessionId) return;
    setDownloading(true);
    try {
      const apiBase = getApiBase();
      const url = reference
        ? `${apiBase}/api/invoice/${encodeURIComponent(reference)}`
        : `${apiBase}/api/invoice/by-session/${encodeURIComponent(sessionId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = `speedy-van-invoice-${reference || sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
    } catch {
      // Silently fall back: open in new tab so user can save manually.
      const apiBase = getApiBase();
      const fallback = reference
        ? `${apiBase}/api/invoice/${encodeURIComponent(reference)}`
        : `${apiBase}/api/invoice/by-session/${encodeURIComponent(sessionId)}`;
      window.open(fallback, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box bg="obsidian" color="pearl" minH="100vh" position="relative" overflow="hidden">
      <Box
        position="absolute"
        top="-20%"
        left="50%"
        transform="translateX(-50%)"
        w="80%"
        h="80%"
        bg="radial-gradient(circle, rgba(212,175,55,0.20) 0%, transparent 60%)"
        pointerEvents="none"
      />
      <ParticleField />
      <Container maxW="2xl" position="relative" zIndex={1} py={{ base: "32", md: "40" }} textAlign="center">
        <Stack gap="6" align="center">
          {/* Spring-animated checkmark */}
          <MotionBox
            initial={{ scale: 0, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
          >
            <Box
              w={{ base: "100px", md: "120px" }}
              h={{ base: "100px", md: "120px" }}
              rounded="full"
              bg="rgba(212,175,55,0.15)"
              border="3px solid"
              borderColor="gold"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize={{ base: "5xl", md: "6xl" }}
              color="gold"
              boxShadow="0 0 0 8px rgba(212,175,55,0.10), 0 12px 40px rgba(212,175,55,0.30)"
            >
              <HiCheck />
            </Box>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: easeOutExpo }}
          >
            <Stack gap="3" align="center">
              <Text
                color="gold"
                fontFamily="heading"
                fontSize="sm"
                letterSpacing="0.32em"
                textTransform="uppercase"
                fontWeight="500"
              >
                Booking Confirmed
              </Text>
              <Heading
                as="h1"
                fontFamily="heading"
                fontWeight="800"
                color="pearl"
                letterSpacing="-0.03em"
                fontSize={{ base: "4xl", md: "5xl" }}
              >
                You&apos;re booked in.
              </Heading>
              <Text fontFamily="body" color="muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.7" maxW="md">
                We&apos;ve sent confirmation to your inbox. Your driver details will follow 24
                hours before your slot.
              </Text>
            </Stack>
          </MotionBox>

          {reference && (
            <MotionBox
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65, ease: easeOutExpo }}
              w="full"
              maxW="md"
            >
              <Box
                bg="glass"
                border="1px solid"
                borderColor="glassBorder"
                rounded="xl"
                px={{ base: "5", md: "7" }}
                py="5"
                backdropFilter="blur(12px)"
                style={{ WebkitBackdropFilter: "blur(12px)" }}
              >
                <Stack gap="3" align="center">
                  <Text fontFamily="body" color="muted" fontSize="xs" letterSpacing="0.16em" textTransform="uppercase">
                    Booking reference
                  </Text>
                  <HStack gap="3" align="center">
                    <Text
                      fontFamily="mono"
                      fontWeight="700"
                      color="gold"
                      fontSize={{ base: "3xl", md: "4xl" }}
                      letterSpacing="0.08em"
                    >
                      {reference}
                    </Text>
                    <Button
                      onClick={copyRef}
                      size="sm"
                      variant="ghost"
                      color={copied ? "gold" : "muted"}
                      rounded="full"
                      _hover={{ bg: "rgba(212,175,55,0.12)", color: "gold" }}
                      aria-label="Copy booking reference"
                    >
                      <HiOutlineClipboard />
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </HStack>
                </Stack>
              </Box>
            </MotionBox>
          )}

          <MotionBox
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85, ease: easeOutExpo }}
          >
            <Stack direction={{ base: "column", sm: "row" }} gap="3" mt="2">
              {reference && (
                <Link href={`/booking/track/${reference}${email ? `?email=${encodeURIComponent(email)}` : ""}`}>
                  <Button
                    bg="gold"
                    color="obsidian"
                    rounded="full"
                    h="12"
                    px="8"
                    fontWeight="600"
                    boxShadow="goldGlow"
                    _hover={{ bg: "goldSoft" }}
                  >
                    Track your move →
                  </Button>
                </Link>
              )}
              {(reference || sessionId) && (
                <Button
                  onClick={downloadInvoice}
                  variant="outline"
                  borderColor="glassBorder"
                  color="pearl"
                  rounded="full"
                  h="12"
                  px="8"
                  loading={downloading}
                  loadingText="Preparing…"
                  _hover={{ borderColor: "gold", bg: "rgba(255,255,255,0.05)" }}
                >
                  <HiOutlineDocumentArrowDown />
                  Download invoice
                </Button>
              )}
              <Link href="/">
                <Button
                  variant="ghost"
                  color="muted"
                  rounded="full"
                  h="12"
                  px="6"
                  _hover={{ color: "gold", bg: "rgba(255,255,255,0.04)" }}
                >
                  Back to home
                </Button>
              </Link>
            </Stack>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.05 }}
          >
            <Text fontFamily="body" color="muted" fontSize="xs" mt="6">
              Need a hand? Call{" "}
              <chakra.a href={SITE.phone.href} color="gold">
                {SITE.phone.display}
              </chakra.a>
              .
            </Text>
          </MotionBox>
        </Stack>
      </Container>
    </Box>
  );
}
