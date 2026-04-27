"use client";

import { Box, Stack, Text, chakra } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { easeOutExpo } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

export interface TimelineStep {
  status: string;
  title: string;
  description: string;
  icon: string;
  timestamp?: string | null;
  isActive: boolean;
  isCompleted: boolean;
}

function formatTime(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  isCancelled?: boolean;
  cancelledAt?: string | null;
}

export function StatusTimeline({ steps, isCancelled, cancelledAt }: StatusTimelineProps) {
  return (
    <Box
      bg="surface"
      rounded="xl"
      p={{ base: "6", md: "8" }}
      border="1px solid"
      borderColor="rgba(9,9,11,0.08)"
      boxShadow="0 12px 36px rgba(9,9,11,0.06)"
    >
      <Text
        color="gold"
        fontFamily="heading"
        fontWeight="500"
        fontSize="xs"
        letterSpacing="0.32em"
        textTransform="uppercase"
        mb="5"
      >
        Status Timeline
      </Text>
      <Stack gap="0" position="relative">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const lineActive = step.isCompleted;
          return (
            <MotionBox
              key={step.status}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: step.isCompleted ? idx * 0.06 : 0,
                ease: easeOutExpo,
              }}
            >
              <Stack direction="row" gap="4" align="flex-start" position="relative">
                {/* Dot column */}
                <Box position="relative" w="36px" flexShrink={0} display="flex" justifyContent="center">
                  {/* Connecting line */}
                  {!isLast && (
                    <Box
                      position="absolute"
                      top="36px"
                      bottom="-8px"
                      left="50%"
                      transform="translateX(-50%)"
                      w="2px"
                      bg={lineActive ? "gold" : "transparent"}
                      borderLeft={lineActive ? undefined : "2px dashed"}
                      borderColor={lineActive ? undefined : "rgba(113,113,122,0.35)"}
                    />
                  )}
                  {step.isCompleted ? (
                    <MotionBox
                      w="36px"
                      h="36px"
                      rounded="full"
                      bg="gold"
                      color="obsidian"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="700"
                      fontSize="md"
                      boxShadow="0 0 0 4px rgba(212,175,55,0.18)"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 220, damping: 14, delay: idx * 0.05 }}
                    >
                      ✓
                    </MotionBox>
                  ) : step.isActive ? (
                    <Box position="relative" w="36px" h="36px">
                      <MotionBox
                        position="absolute"
                        inset="0"
                        rounded="full"
                        bg="gold"
                        animate={{
                          scale: [1, 1.35, 1],
                          opacity: [0.6, 0, 0.6],
                        }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                      />
                      <Box
                        position="absolute"
                        inset="6px"
                        rounded="full"
                        bg="gold"
                        boxShadow="0 0 14px rgba(212,175,55,0.6)"
                      />
                    </Box>
                  ) : (
                    <Box
                      w="36px"
                      h="36px"
                      rounded="full"
                      border="2px dashed"
                      borderColor="rgba(113,113,122,0.4)"
                      bg="transparent"
                    />
                  )}
                </Box>

                {/* Content */}
                <Box flex="1" pb={isLast ? "0" : "6"}>
                  <Stack direction="row" justify="space-between" align="flex-start" gap="3">
                    <Stack gap="1" flex="1">
                      <Stack direction="row" gap="2" align="center">
                        <Text fontSize="lg">{step.icon}</Text>
                        <Text
                          fontFamily="heading"
                          fontWeight="600"
                          color={step.isCompleted || step.isActive ? "ink" : "muted"}
                          fontSize="sm"
                        >
                          {step.title}
                        </Text>
                      </Stack>
                      <Text fontFamily="body" color="muted" fontSize="xs">
                        {step.description}
                      </Text>
                    </Stack>
                    {step.timestamp && (
                      <Text
                        fontFamily="mono"
                        color="muted"
                        fontSize="xs"
                        whiteSpace="nowrap"
                      >
                        {formatTime(step.timestamp)}
                      </Text>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </MotionBox>
          );
        })}

        {isCancelled && (
          <MotionBox
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Stack direction="row" gap="4" align="flex-start" mt="4">
              <Box w="36px" flexShrink={0} display="flex" justifyContent="center">
                <Box
                  w="36px"
                  h="36px"
                  rounded="full"
                  bg="crimson"
                  color="white"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="700"
                  fontSize="md"
                >
                  ✕
                </Box>
              </Box>
              <Stack gap="1" flex="1">
                <Text fontFamily="heading" fontWeight="600" color="crimson" fontSize="sm">
                  Cancelled
                </Text>
                <Text fontFamily="body" color="muted" fontSize="xs">
                  This booking was cancelled.
                </Text>
                {cancelledAt && (
                  <Text fontFamily="mono" color="muted" fontSize="xs">
                    {formatTime(cancelledAt)}
                  </Text>
                )}
              </Stack>
            </Stack>
          </MotionBox>
        )}
      </Stack>
    </Box>
  );
}

export const ALL_TIMELINE_STEPS = [
  { status: "CONFIRMED", title: "Booking Confirmed", icon: "✅", description: "Payment received." },
  { status: "ASSIGNED", title: "Driver Assigned", icon: "🚛", description: "A driver has been assigned." },
  { status: "DRIVER_EN_ROUTE", title: "Driver En Route", icon: "🚗", description: "Your driver is on the way." },
  { status: "ARRIVED_PICKUP", title: "Arrived at Pickup", icon: "📍", description: "Driver arrived at your address." },
  { status: "LOADING", title: "Loading", icon: "📦", description: "Your items are being loaded." },
  { status: "IN_TRANSIT", title: "On the Way", icon: "🛣️", description: "Items are in transit." },
  { status: "ARRIVED_DROPOFF", title: "Arrived at Destination", icon: "🏠", description: "Van arrived at new address." },
  { status: "UNLOADING", title: "Unloading", icon: "📦", description: "Items being placed." },
  { status: "COMPLETED", title: "Move Complete!", icon: "🎉", description: "All done!" },
] as const;

const STATUS_ALIASES: Record<string, string> = {
  EN_ROUTE_PICKUP: "DRIVER_EN_ROUTE",
  AT_PICKUP: "ARRIVED_PICKUP",
  AT_DROPOFF: "ARRIVED_DROPOFF",
};

function normaliseStatus(s: string): string {
  const upper = s?.toUpperCase() ?? "";
  return STATUS_ALIASES[upper] ?? upper;
}

export function deriveTimelineSteps(
  currentStatus: string,
  events?: Array<{ step: string; timestamp?: string | null }> | null
): TimelineStep[] {
  const normalisedCurrent = normaliseStatus(currentStatus);
  const eventMap = new Map<string, string>();
  if (events) {
    for (const e of events) {
      const key = normaliseStatus(e.step);
      if (e.timestamp) eventMap.set(key, e.timestamp);
    }
  }

  const currentIndex = ALL_TIMELINE_STEPS.findIndex((s) => s.status === normalisedCurrent);

  return ALL_TIMELINE_STEPS.map((step, idx) => {
    const ts = eventMap.get(step.status) ?? null;
    const isCompleted =
      currentIndex >= 0 ? idx < currentIndex || normalisedCurrent === "COMPLETED" : false;
    const isActive = currentIndex >= 0 ? idx === currentIndex && normalisedCurrent !== "COMPLETED" : false;
    return {
      ...step,
      timestamp: ts,
      isCompleted,
      isActive,
    };
  });
}
