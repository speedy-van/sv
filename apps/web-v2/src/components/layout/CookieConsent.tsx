"use client";

import { Box, Button, Container, HStack, Stack, Text, chakra } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { easeOutExpo } from "@/lib/motion";

const MotionDiv = motion.create(chakra.div);

export const COOKIE_CONSENT_KEY = "sv-cookie-consent";

export type ConsentValue = "all" | "essential";

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (v === "all" || v === "essential") return v;
  return null;
}

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredConsent();
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const decide = (value: ConsentValue) => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
      window.dispatchEvent(new CustomEvent("sv-consent-change", { detail: value }));
    } catch {
      /* storage blocked */
    }
    setVisible(false);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <MotionDiv
          position="fixed"
          left="0"
          right="0"
          bottom="0"
          zIndex="1500"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.55, ease: easeOutExpo }}
          px={{ base: "3", md: "6" }}
          pb={{ base: "3", md: "6" }}
        >
          <Container maxW="6xl" p="0">
            <Box
              bg="rgba(9,9,11,0.92)"
              border="1px solid"
              borderColor="glassBorder"
              backdropFilter="blur(18px)"
              style={{ WebkitBackdropFilter: "blur(18px)" }}
              rounded="xl"
              p={{ base: "5", md: "6" }}
              boxShadow="0 24px 60px rgba(0,0,0,0.45)"
            >
              <Stack
                direction={{ base: "column", md: "row" }}
                gap={{ base: "4", md: "6" }}
                align={{ base: "stretch", md: "center" }}
                justify="space-between"
              >
                <Stack gap="1.5" maxW={{ md: "2xl" }}>
                  <Text
                    color="gold"
                    fontFamily="heading"
                    fontSize="xs"
                    letterSpacing="0.32em"
                    textTransform="uppercase"
                    fontWeight="500"
                  >
                    Cookies
                  </Text>
                  <Text fontFamily="body" color="pearl" fontSize="sm" lineHeight="1.6">
                    We use essential cookies to make this site work, and optional analytics
                    cookies to understand how it&apos;s used. You can choose what to allow.
                    See our{" "}
                    <Link href="/privacy">
                      <chakra.span color="gold" textDecoration="underline" _hover={{ color: "goldSoft" }}>
                        privacy policy
                      </chakra.span>
                    </Link>
                    .
                  </Text>
                </Stack>
                <HStack gap="3" justify={{ base: "stretch", md: "flex-end" }}>
                  <Button
                    onClick={() => decide("essential")}
                    variant="outline"
                    borderColor="glassBorder"
                    color="pearl"
                    rounded="full"
                    h="11"
                    px="6"
                    fontWeight="500"
                    _hover={{ borderColor: "gold", bg: "rgba(255,255,255,0.04)" }}
                  >
                    Essential Only
                  </Button>
                  <Button
                    onClick={() => decide("all")}
                    bg="gold"
                    color="obsidian"
                    rounded="full"
                    h="11"
                    px="6"
                    fontWeight="600"
                    boxShadow="goldGlow"
                    _hover={{ bg: "goldSoft" }}
                  >
                    Accept All
                  </Button>
                </HStack>
              </Stack>
            </Box>
          </Container>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}
