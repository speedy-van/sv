"use client";

import { Box, Button, Container, Heading, Stack, Text, chakra } from "@chakra-ui/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { easeOutExpo } from "@/lib/motion";

const MotionDiv = motion.create(chakra.div);

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[web-v2] Route error:", error);
  }, [error]);

  return (
    <Box bg="obsidian" color="pearl" minH="100vh" position="relative" overflow="hidden">
      <Box
        position="absolute"
        top="-15%"
        left="50%"
        transform="translateX(-50%)"
        w="80%"
        h="80%"
        bg="radial-gradient(circle, rgba(220,38,38,0.10) 0%, transparent 60%)"
        pointerEvents="none"
      />
      <Container
        maxW="2xl"
        position="relative"
        zIndex={1}
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={{ base: "20", md: "32" }}
      >
        <MotionDiv
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          textAlign="center"
        >
          <Stack gap={{ base: "6", md: "8" }} align="center">
            <Box
              w="80px"
              h="80px"
              rounded="full"
              bg="rgba(220,38,38,0.12)"
              border="2px solid"
              borderColor="crimson"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="3xl"
              color="crimson"
            >
              !
            </Box>
            <Stack gap="3" align="center">
              <Text
                color="gold"
                fontFamily="heading"
                fontSize="xs"
                letterSpacing="0.32em"
                textTransform="uppercase"
                fontWeight="500"
              >
                Something Went Wrong
              </Text>
              <Heading
                as="h1"
                fontFamily="heading"
                fontWeight="700"
                color="pearl"
                fontSize={{ base: "2xl", md: "4xl" }}
                letterSpacing="-0.02em"
                maxW="lg"
              >
                We hit a small bump in the road.
              </Heading>
              <Text fontFamily="body" color="muted" fontSize={{ base: "md", md: "lg" }} maxW="md" lineHeight="1.7">
                Don&apos;t worry — your booking is safe. Try again, or head home and
                we&apos;ll get you sorted.
              </Text>
              {error.digest && (
                <Text fontFamily="mono" color="muted" fontSize="xs" mt="2">
                  ref: {error.digest}
                </Text>
              )}
            </Stack>
            <Stack direction={{ base: "column", sm: "row" }} gap="3" pt="2">
              <Button
                bg="gold"
                color="obsidian"
                rounded="full"
                h="12"
                px="8"
                fontWeight="600"
                boxShadow="goldGlow"
                _hover={{ bg: "goldSoft" }}
                onClick={() => reset()}
              >
                Try Again
              </Button>
              <Link href="/">
                <Button
                  variant="outline"
                  borderColor="glassBorder"
                  color="pearl"
                  rounded="full"
                  h="12"
                  px="8"
                  _hover={{ borderColor: "gold", bg: "rgba(255,255,255,0.05)" }}
                >
                  Back to Home
                </Button>
              </Link>
            </Stack>
          </Stack>
        </MotionDiv>
      </Container>
    </Box>
  );
}
