"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Spinner,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { getDriverJobs, postTrackingPing, type DriverJob } from "@/lib/driver-api";

// Fine-grained job steps in order.
interface Step {
  key: string;
  label: string;
  cta: string;   // Button label to advance
  color: string;
}

const STEPS: Step[] = [
  { key: "navigate_to_pickup", label: "Drive to pickup", cta: "I've arrived at pickup", color: "#D4AF37" },
  { key: "arrived_at_pickup", label: "At pickup", cta: "Start loading", color: "#D4AF37" },
  { key: "loading_started", label: "Loading in progress", cta: "Loading complete", color: "#60A5FA" },
  { key: "loading_completed", label: "Ready to depart", cta: "En route to drop-off", color: "#60A5FA" },
  { key: "en_route_to_dropoff", label: "En route to drop-off", cta: "I've arrived at drop-off", color: "#10B981" },
  { key: "arrived_at_dropoff", label: "At drop-off", cta: "Start unloading", color: "#10B981" },
  { key: "unloading_started", label: "Unloading in progress", cta: "Unloading complete", color: "#10B981" },
  { key: "unloading_completed", label: "Almost done", cta: "Complete job", color: "#10B981" },
  { key: "job_completed", label: "Job complete ✓", cta: "", color: "#34D399" },
];

function stepIndex(key: string) {
  return STEPS.findIndex((s) => s.key === key);
}

export default function DriverActiveJobPage() {
  const [job, setJob] = useState<DriverJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepKey, setStepKey] = useState<string>("navigate_to_pickup");
  const [advancing, setAdvancing] = useState(false);
  const [tracking, setTracking] = useState(false);
  const watchRef = useRef<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getDriverJobs()
      .then((d) => {
        const active = d.assignedJobs?.[0] ?? null;
        setJob(active);
        if (!active) setError("No active job assigned.");
      })
      .catch(() => setError("Could not load active job."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── GPS tracking (Geolocation API + polling to server every 30 s) ───────
  useEffect(() => {
    if (!job || !tracking) {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      return;
    }

    if (!("geolocation" in navigator)) return;

    let lastSentAt = 0;
    const INTERVAL_MS = 30_000;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentAt < INTERVAL_MS) return;
        lastSentAt = now;
        postTrackingPing({
          bookingId: job.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };
  }, [job, tracking]);

  function advanceStep() {
    const idx = stepIndex(stepKey);
    if (idx < STEPS.length - 1) {
      setAdvancing(true);
      setTimeout(() => {
        setStepKey(STEPS[idx + 1].key);
        setAdvancing(false);
      }, 400);
    }
  }

  const currentStep = STEPS[stepIndex(stepKey)] ?? STEPS[0];
  const isComplete = stepKey === "job_completed";
  const idx = stepIndex(stepKey);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py="20">
        <Spinner color="gold" size="xl" borderWidth="3px" />
      </Box>
    );
  }

  if (error || !job) {
    return (
      <Stack align="center" py="20" gap="4">
        <Text fontFamily="body" color={error ? "crimson" : "muted"} fontSize="sm">
          {error ?? "No active job."}
        </Text>
        <Button size="sm" variant="outline" borderColor="glassBorder" color="pearl" onClick={load}>
          Refresh
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap={{ base: "5", md: "7" }} maxW="640px" mx="auto">
      {/* Job header */}
      <Box
        bg="rgba(212,175,55,0.06)"
        border="1px solid"
        borderColor="rgba(212,175,55,0.25)"
        rounded="xl"
        p="5"
      >
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap="2">
          <Stack gap="0.5">
            <Text fontFamily="mono" color="gold" fontSize="xs" letterSpacing="0.06em">
              {job.reference}
            </Text>
            <Text fontFamily="body" color="pearl" fontSize="md" fontWeight="500">
              {job.customer}
            </Text>
            <Text fontFamily="body" color="muted" fontSize="xs">
              {job.date} · {job.time} · {job.distance} · {job.duration}
            </Text>
          </Stack>
          <Text fontFamily="heading" fontWeight="700" color="gold" fontSize="2xl">
            £{job.estimatedEarnings.toFixed(2)}
          </Text>
        </HStack>

        {/* Route */}
        <Stack gap="2" mt="4">
          <HStack gap="2">
            <Box w="7px" h="7px" rounded="full" bg="emerald" flexShrink={0} />
            <Text fontFamily="body" color="pearl" fontSize="sm">
              {job.from}
            </Text>
          </HStack>
          <Box ml="3" w="1px" h="4" bg="rgba(255,255,255,0.12)" />
          <HStack gap="2">
            <Box w="7px" h="7px" rounded="full" bg="gold" flexShrink={0} />
            <Text fontFamily="body" color="muted" fontSize="sm">
              {job.to}
            </Text>
          </HStack>
        </Stack>
      </Box>

      {/* Progress bar */}
      <Stack gap="2">
        <HStack justify="space-between">
          <Text fontFamily="body" color="muted" fontSize="xs" letterSpacing="0.06em" textTransform="uppercase">
            Progress
          </Text>
          <Text fontFamily="body" color="muted" fontSize="xs">
            {idx + 1} / {STEPS.length}
          </Text>
        </HStack>
        <Box bg="rgba(255,255,255,0.08)" rounded="full" h="4px" overflow="hidden">
          <Box
            bg="gold"
            h="full"
            rounded="full"
            style={{
              width: `${((idx + 1) / STEPS.length) * 100}%`,
              transition: "width 500ms cubic-bezier(0.16,1,0.3,1)",
            }}
            boxShadow="goldGlow"
          />
        </Box>
      </Stack>

      {/* Current step card */}
      <Box
        bg="rgba(255,255,255,0.04)"
        border="1px solid"
        borderColor="rgba(255,255,255,0.1)"
        rounded="xl"
        p="6"
        textAlign="center"
      >
        <Stack gap="5" align="center">
          <Box
            w="64px"
            h="64px"
            rounded="full"
            bg={`${currentStep.color}20`}
            border="2px solid"
            borderColor={currentStep.color}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="xl"
            color={currentStep.color}
          >
            {isComplete ? "✓" : idx < 4 ? "🚐" : idx < 6 ? "📦" : "✓"}
          </Box>
          <Stack gap="1">
            <Text
              fontFamily="heading"
              fontWeight="700"
              color="pearl"
              fontSize="xl"
              letterSpacing="-0.01em"
            >
              {currentStep.label}
            </Text>
            <Text fontFamily="body" color="muted" fontSize="sm">
              Step {idx + 1} of {STEPS.length}
            </Text>
          </Stack>

          {!isComplete && currentStep.cta && (
            <Button
              bg="gold"
              color="obsidian"
              rounded="full"
              h="12"
              px="8"
              fontWeight="700"
              fontSize="md"
              loading={advancing}
              onClick={advanceStep}
              boxShadow="goldGlow"
              _hover={{ bg: "goldSoft" }}
              w="full"
              maxW="320px"
            >
              {currentStep.cta}
            </Button>
          )}

          {isComplete && (
            <Box
              bg="rgba(5,150,105,0.12)"
              border="1px solid"
              borderColor="rgba(5,150,105,0.3)"
              rounded="lg"
              px="6"
              py="4"
              w="full"
              textAlign="center"
            >
              <Text fontFamily="heading" fontWeight="600" color="emerald" fontSize="lg">
                Job completed. Great work!
              </Text>
              <Text fontFamily="body" color="muted" fontSize="sm" mt="1">
                Payment will be processed within 24 hours.
              </Text>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Steps list */}
      <Box
        bg="rgba(255,255,255,0.03)"
        border="1px solid"
        borderColor="rgba(255,255,255,0.07)"
        rounded="xl"
        p="5"
      >
        <Stack gap="2.5">
          <Text fontFamily="body" color="muted" fontSize="xs" letterSpacing="0.06em" textTransform="uppercase" mb="1">
            All steps
          </Text>
          {STEPS.map((s, i) => {
            const done = i < idx;
            const current = i === idx;
            return (
              <HStack key={s.key} gap="3" align="center">
                <Box
                  w="7px"
                  h="7px"
                  rounded="full"
                  flexShrink={0}
                  bg={done ? "emerald" : current ? "gold" : "rgba(255,255,255,0.15)"}
                />
                <Text
                  fontFamily="body"
                  fontSize="sm"
                  color={done ? "emerald" : current ? "pearl" : "muted"}
                  fontWeight={current ? "600" : "400"}
                  textDecoration={done ? "line-through" : undefined}
                >
                  {s.label}
                </Text>
              </HStack>
            );
          })}
        </Stack>
      </Box>

      {/* GPS toggle */}
      <HStack justify="space-between" align="center">
        <Stack gap="0.5">
          <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
            Live location sharing
          </Text>
          <Text fontFamily="body" color="muted" fontSize="xs">
            {tracking
              ? "Customers can see your location in real-time."
              : "Enable so customers can track your progress."}
          </Text>
        </Stack>
        <Button
          size="sm"
          variant="outline"
          borderColor={tracking ? "emerald" : "glassBorder"}
          color={tracking ? "emerald" : "muted"}
          rounded="full"
          px="4"
          onClick={() => setTracking((v) => !v)}
          _hover={{ borderColor: "gold", color: "pearl" }}
        >
          {tracking ? (
            <chakra.span>📡 Live</chakra.span>
          ) : (
            "Enable GPS"
          )}
        </Button>
      </HStack>
    </Stack>
  );
}
