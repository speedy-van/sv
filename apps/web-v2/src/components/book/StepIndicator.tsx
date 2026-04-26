"use client";

import { Box, HStack, Stack, Text, chakra } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionBox = motion.create(chakra.div);

interface StepIndicatorProps {
  current: number;
  steps: string[];
}

export function StepIndicator({ current, steps }: StepIndicatorProps) {
  return (
    <Box w="full" mb={{ base: "8", md: "12" }}>
      <HStack gap={{ base: "2", md: "4" }} justify="center" align="center">
        {steps.map((label, i) => {
          const idx = i + 1;
          const done = current > idx;
          const active = current === idx;
          return (
            <HStack key={label} gap={{ base: "2", md: "3" }} align="center">
              <Stack align="center" gap="1.5" w="auto">
                <Box position="relative">
                  <MotionBox
                    w={{ base: "9", md: "11" }}
                    h={{ base: "9", md: "11" }}
                    rounded="full"
                    bg={done ? "gold" : active ? "gold" : "rgba(255,255,255,0.1)"}
                    color={done || active ? "obsidian" : "muted"}
                    border="2px solid"
                    borderColor={done || active ? "gold" : "rgba(255,255,255,0.15)"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontFamily="heading"
                    fontWeight="700"
                    fontSize={{ base: "sm", md: "md" }}
                    boxShadow={active ? "goldGlow" : undefined}
                    animate={{ scale: active ? 1.05 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {done ? "✓" : idx}
                  </MotionBox>
                </Box>
                <Text
                  display={{ base: "none", md: "block" }}
                  fontFamily="body"
                  fontSize="xs"
                  color={active ? "gold" : done ? "pearl" : "muted"}
                  fontWeight="500"
                  letterSpacing="0.04em"
                  textTransform="uppercase"
                >
                  {label}
                </Text>
              </Stack>
              {idx < steps.length && (
                <Box
                  w={{ base: "8", md: "16" }}
                  h="1px"
                  bg={done ? "gold" : "rgba(255,255,255,0.15)"}
                  mt={{ base: "0", md: "-5" }}
                  transition="background 300ms"
                />
              )}
            </HStack>
          );
        })}
      </HStack>
    </Box>
  );
}
