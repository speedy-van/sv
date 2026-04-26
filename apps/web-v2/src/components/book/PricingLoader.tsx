"use client";

import { Box, HStack, Stack, Text, chakra } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { easeOutExpo } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

const STEPS = [
  { label: "Distance & route" },
  { label: "Service & crew" },
  { label: "Helpers & access" },
  { label: "Floor & lift" },
  { label: "Weather window" },
];

interface PricingLoaderProps {
  /** Optional: callback fired once minimum display time has elapsed AND parent says ready. */
  onMinElapsed?: () => void;
  /** Minimum visible duration in ms. Defaults to 2500. */
  minDurationMs?: number;
}

export function PricingLoader({ onMinElapsed, minDurationMs = 2500 }: PricingLoaderProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const stepInterval = Math.max(220, Math.floor(minDurationMs / (STEPS.length + 1)));
    const intervals: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      intervals.push(setTimeout(() => setActiveStep(i + 1), stepInterval * (i + 1)));
    });
    const minT = setTimeout(() => onMinElapsed?.(), minDurationMs);
    return () => {
      intervals.forEach(clearTimeout);
      clearTimeout(minT);
    };
  }, [minDurationMs, onMinElapsed]);

  return (
    <Box
      bg="glass"
      border="1px solid"
      borderColor="glassBorder"
      backdropFilter="blur(16px)"
      style={{ WebkitBackdropFilter: "blur(16px)" }}
      rounded="xl"
      p={{ base: "8", md: "10" }}
      textAlign="center"
    >
      <Stack gap="6" align="center">
        {/* Spinning logo mark */}
        <Box position="relative" w="68px" h="68px">
          <MotionBox
            position="absolute"
            inset="0"
            rounded="full"
            border="2px solid"
            borderColor="rgba(212,175,55,0.18)"
          />
          <MotionBox
            position="absolute"
            inset="0"
            rounded="full"
            border="2px solid transparent"
            borderTopColor="gold"
            borderRightColor="gold"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />
          <Box
            position="absolute"
            inset="22%"
            rounded="full"
            bg="gold"
            color="obsidian"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontFamily="heading"
            fontWeight="800"
            fontSize="lg"
            boxShadow="goldGlow"
          >
            S
          </Box>
        </Box>

        <Stack gap="1.5">
          <Text fontFamily="heading" fontSize="xs" letterSpacing="0.32em" textTransform="uppercase" color="gold" fontWeight="500">
            One Moment
          </Text>
          <Text fontFamily="heading" fontWeight="700" color="pearl" fontSize={{ base: "lg", md: "xl" }}>
            Calculating your quote…
          </Text>
        </Stack>

        <Stack gap="2.5" align="stretch" minW={{ base: "full", sm: "300px" }}>
          {STEPS.map((s, i) => {
            const done = i < activeStep;
            const current = i === activeStep;
            return (
              <MotionBox
                key={s.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: easeOutExpo }}
              >
                <HStack gap="3" justify="flex-start">
                  <Box
                    w="20px"
                    h="20px"
                    rounded="full"
                    bg={done ? "gold" : "rgba(255,255,255,0.06)"}
                    border="1px solid"
                    borderColor={done ? "gold" : current ? "gold" : "glassBorder"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="obsidian"
                    fontFamily="heading"
                    fontSize="2xs"
                    fontWeight="700"
                    flexShrink="0"
                  >
                    {done ? (
                      "✓"
                    ) : current ? (
                      <MotionBox
                        w="6px"
                        h="6px"
                        rounded="full"
                        bg="gold"
                        animate={{ scale: [1, 0.6, 1], opacity: [1, 0.4, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                      />
                    ) : null}
                  </Box>
                  <Text fontFamily="body" fontSize="sm" color={done ? "pearl" : current ? "gold" : "muted"} textAlign="left">
                    {s.label}
                  </Text>
                </HStack>
              </MotionBox>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}

export const PRICING_LOADER_MIN_MS = 2500;
