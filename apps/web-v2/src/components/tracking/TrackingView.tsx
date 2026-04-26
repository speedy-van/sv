"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ParticleField } from "@/components/home/ParticleField";
import { easeOutExpo } from "@/lib/motion";
import { SITE } from "@/lib/site";

const MotionBox = motion.create(chakra.div);

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface TrackingData {
  id: string;
  reference: string;
  status: string;
  type?: string;
  booking?: {
    id: string;
    reference: string;
    status: string;
    scheduledAt?: string | null;
  };
  pickupAddress?: { label?: string; postcode?: string };
  dropoffAddress?: { label?: string; postcode?: string };
  driver?: { name?: string; isOnline?: boolean };
  routeProgress?: number;
  eta?: { minutesRemaining?: number; estimatedArrival?: string; isOnTime?: boolean };
  jobTimeline?: Array<{ step: string; label: string; timestamp?: string | null; notes?: string }>;
  lastUpdated?: string;
}

function formatTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Awaiting confirmation", tone: "muted" },
  CONFIRMED: { label: "Confirmed", tone: "gold" },
  ASSIGNED: { label: "Driver assigned", tone: "gold" },
  EN_ROUTE_PICKUP: { label: "Driver en route to pickup", tone: "gold" },
  AT_PICKUP: { label: "At pickup", tone: "gold" },
  LOADING: { label: "Loading", tone: "gold" },
  IN_TRANSIT: { label: "In transit", tone: "gold" },
  AT_DROPOFF: { label: "At drop-off", tone: "gold" },
  UNLOADING: { label: "Unloading", tone: "gold" },
  COMPLETED: { label: "Completed", tone: "emerald" },
  CANCELLED: { label: "Cancelled", tone: "crimson" },
};

function statusInfo(status: string) {
  return STATUS_COPY[status?.toUpperCase()] || { label: status || "Unknown", tone: "muted" };
}

export function TrackingView({ reference }: { reference: string }) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API}/api/track/${encodeURIComponent(reference)}?tracking=true`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setError(res.status === 404 ? "We couldn't find that booking reference." : "Could not load tracking data.");
          if (!cancelled) setLoading(false);
          return;
        }
        const json = (await res.json()) as TrackingData;
        if (!cancelled) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Could not reach the tracking server.");
          setLoading(false);
        }
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [reference]);

  const status = useMemo(() => statusInfo(data?.status || data?.booking?.status || ""), [data]);
  const progress = Math.max(0, Math.min(100, data?.routeProgress ?? 0));

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
      <Container maxW="5xl" py={{ base: "32", md: "40" }} position="relative" zIndex={1}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          <Stack gap="3" mb="10">
            <Text
              color="gold"
              fontFamily="heading"
              fontWeight="500"
              fontSize="sm"
              letterSpacing="0.32em"
              textTransform="uppercase"
            >
              Live Tracking
            </Text>
            <Heading
              as="h1"
              fontFamily="heading"
              fontWeight="800"
              color="pearl"
              letterSpacing="-0.03em"
              fontSize={{ base: "3xl", md: "5xl" }}
            >
              Booking{" "}
              <Box as="span" color="gold">
                #{reference}
              </Box>
            </Heading>
          </Stack>

          {loading && (
            <Box bg="glass" rounded="xl" p="10" textAlign="center" border="1px solid" borderColor="glassBorder">
              <Spinner color="gold" size="lg" />
              <Text mt="4" fontFamily="body" color="muted" fontSize="sm">
                Loading the latest update…
              </Text>
            </Box>
          )}

          {error && !loading && (
            <Box bg="glass" rounded="xl" p="8" border="1px solid" borderColor="glassBorder" textAlign="center">
              <Heading as="h2" fontFamily="heading" fontWeight="600" color="pearl" fontSize="xl" mb="3">
                {error}
              </Heading>
              <Text fontFamily="body" color="muted" fontSize="sm" mb="6">
                Double-check the reference, or call us and we'll find it for you.
              </Text>
              <a href={SITE.phone.href}>
                <Button bg="gold" color="obsidian" rounded="full" h="11" fontWeight="600" _hover={{ bg: "goldSoft" }}>
                  Call {SITE.phone.display}
                </Button>
              </a>
            </Box>
          )}

          {data && !error && (
            <Stack gap="6">
              {/* Status hero */}
              <Box
                bg="glass"
                rounded="xl"
                p={{ base: "6", md: "8" }}
                border="1px solid"
                borderColor="glassBorder"
                backdropFilter="blur(16px)"
                style={{ WebkitBackdropFilter: "blur(16px)" }}
              >
                <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
                  <Stack gap="1">
                    <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                      Status
                    </Text>
                    <Text fontFamily="heading" fontWeight="600" color={status.tone} fontSize="lg">
                      {status.label}
                    </Text>
                  </Stack>
                  <Stack gap="1">
                    <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                      Scheduled
                    </Text>
                    <Text fontFamily="heading" fontWeight="600" color="pearl" fontSize="lg">
                      {formatDate(data.booking?.scheduledAt)} · {formatTime(data.booking?.scheduledAt)}
                    </Text>
                  </Stack>
                  <Stack gap="1">
                    <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                      ETA
                    </Text>
                    <Text fontFamily="heading" fontWeight="600" color="pearl" fontSize="lg">
                      {data.eta?.minutesRemaining != null ? `${data.eta.minutesRemaining} min` : "—"}
                    </Text>
                  </Stack>
                </SimpleGrid>

                {/* Progress bar */}
                <Box mt="6">
                  <Box position="relative" h="3" bg="rgba(255,255,255,0.08)" rounded="full" overflow="hidden">
                    <MotionBox
                      position="absolute"
                      top="0"
                      left="0"
                      h="full"
                      bg="linear-gradient(90deg, #D4AF37 0%, #E6C76B 100%)"
                      rounded="full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: easeOutExpo }}
                    />
                  </Box>
                  <Text mt="2" fontFamily="body" color="muted" fontSize="xs" textAlign="right">
                    {progress.toFixed(0)}% complete
                  </Text>
                </Box>
              </Box>

              {/* Route */}
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
                <Box bg="glass" rounded="xl" p="6" border="1px solid" borderColor="glassBorder">
                  <Text fontFamily="body" color="gold" fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" mb="2">
                    Pickup
                  </Text>
                  <Text fontFamily="heading" fontWeight="600" color="pearl" fontSize="md">
                    {data.pickupAddress?.label || "—"}
                  </Text>
                  {data.pickupAddress?.postcode && (
                    <Text fontFamily="body" color="muted" fontSize="sm" mt="1">
                      {data.pickupAddress.postcode}
                    </Text>
                  )}
                </Box>
                <Box bg="glass" rounded="xl" p="6" border="1px solid" borderColor="glassBorder">
                  <Text fontFamily="body" color="gold" fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" mb="2">
                    Drop-off
                  </Text>
                  <Text fontFamily="heading" fontWeight="600" color="pearl" fontSize="md">
                    {data.dropoffAddress?.label || "—"}
                  </Text>
                  {data.dropoffAddress?.postcode && (
                    <Text fontFamily="body" color="muted" fontSize="sm" mt="1">
                      {data.dropoffAddress.postcode}
                    </Text>
                  )}
                </Box>
              </SimpleGrid>

              {/* Driver */}
              {data.driver && (
                <Box bg="glass" rounded="xl" p="6" border="1px solid" borderColor="glassBorder">
                  <Stack direction="row" align="center" gap="4">
                    <Box
                      w="48px"
                      h="48px"
                      rounded="full"
                      bg="gold"
                      color="obsidian"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      fontFamily="heading"
                      fontWeight="700"
                      fontSize="lg"
                    >
                      {(data.driver.name || "?").charAt(0).toUpperCase()}
                    </Box>
                    <Stack gap="0.5">
                      <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                        Your driver
                      </Text>
                      <Text fontFamily="heading" fontWeight="600" color="pearl" fontSize="md">
                        {data.driver.name || "Assigned"}
                      </Text>
                    </Stack>
                    {data.driver.isOnline && (
                      <Box ml="auto" px="3" py="1" rounded="full" bg="rgba(5,150,105,0.18)" color="emerald" fontFamily="body" fontSize="xs">
                        ● Online
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Timeline */}
              {data.jobTimeline && data.jobTimeline.length > 0 && (
                <Box bg="glass" rounded="xl" p={{ base: "6", md: "8" }} border="1px solid" borderColor="glassBorder">
                  <Heading as="h2" fontFamily="heading" fontWeight="600" color="pearl" fontSize="lg" mb="6">
                    Timeline
                  </Heading>
                  <Stack gap="5">
                    {data.jobTimeline.map((event, idx) => {
                      const done = !!event.timestamp;
                      return (
                        <Stack key={`${event.step}-${idx}`} direction="row" gap="4" align="flex-start">
                          <Box
                            w="12px"
                            h="12px"
                            rounded="full"
                            bg={done ? "gold" : "rgba(255,255,255,0.18)"}
                            mt="1.5"
                            flexShrink={0}
                            boxShadow={done ? "0 0 0 4px rgba(212,175,55,0.18)" : undefined}
                          />
                          <Stack gap="0.5" flex="1">
                            <Text
                              fontFamily="heading"
                              fontWeight="600"
                              color={done ? "pearl" : "muted"}
                              fontSize="sm"
                            >
                              {event.label}
                            </Text>
                            <Text fontFamily="body" color="muted" fontSize="xs">
                              {done ? formatTime(event.timestamp) : "Pending"}
                              {event.notes ? ` · ${event.notes}` : ""}
                            </Text>
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {data.lastUpdated && (
                <Text fontFamily="body" color="muted" fontSize="xs" textAlign="center">
                  Last updated {formatTime(data.lastUpdated)} · refreshes every 30 seconds
                </Text>
              )}
            </Stack>
          )}
        </MotionBox>
      </Container>
    </Box>
  );
}
