"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  Spinner,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { easeOutExpo } from "@/lib/motion";
import { SITE } from "@/lib/site";
import { usePusherEvent } from "@/hooks/usePusher";
import { StatusHero } from "./StatusHero";
import { LiveMap } from "./LiveMap";
import { StatusTimeline, deriveTimelineSteps } from "./StatusTimeline";
import { TrackingDetails } from "./TrackingDetails";
import { DriverCard } from "./DriverCard";
import { TrackingActions } from "./TrackingActions";

const MotionBox = motion.create(chakra.div);
const API = process.env.NEXT_PUBLIC_API_URL || "";

interface TrackingData {
  id?: string;
  reference: string;
  status: string;
  type?: string;
  service?: string;
  serviceVariant?: string;
  totalAmount?: number | null;
  insurance?: boolean;
  booking?: {
    id?: string;
    reference: string;
    status: string;
    scheduledAt?: string | null;
    service?: string;
    variant?: string;
    totalAmount?: number | null;
  };
  pickupAddress?: { label?: string; postcode?: string; lat?: number; lng?: number };
  dropoffAddress?: { label?: string; postcode?: string; lat?: number; lng?: number };
  driver?: { id?: string; name?: string; phone?: string | null; isOnline?: boolean };
  driverLocation?: { lat?: number; lng?: number } | null;
  routeProgress?: number;
  distanceMiles?: number | null;
  helpers?: number | null;
  packing?: boolean;
  assembly?: boolean;
  eta?: { minutesRemaining?: number; estimatedArrival?: string; isOnTime?: boolean };
  jobTimeline?: Array<{ step: string; label?: string; timestamp?: string | null; notes?: string }>;
  cancelledAt?: string | null;
  lastUpdated?: string;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  ASSIGNED: "Driver assigned",
  DRIVER_EN_ROUTE: "Driver en route",
  EN_ROUTE_PICKUP: "Driver en route",
  ARRIVED_PICKUP: "Arrived at pickup",
  AT_PICKUP: "Arrived at pickup",
  LOADING: "Loading",
  IN_TRANSIT: "On the way",
  ARRIVED_DROPOFF: "Arrived at destination",
  AT_DROPOFF: "Arrived at destination",
  UNLOADING: "Unloading",
  COMPLETED: "Move complete",
  CANCELLED: "Cancelled",
};

const PRE_DISPATCH = new Set(["PENDING", "PENDING_PAYMENT", "CONFIRMED"]);

export function TrackingView({ reference }: { reference: string }) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(
        `${API}/api/track/${encodeURIComponent(reference)}?tracking=true`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        if (cancelledRef.current) return;
        if (res.status === 404) setError("We couldn't find that booking reference.");
        else setError("Could not load tracking data.");
        setIsLive(false);
        setLoading(false);
        return;
      }
      const json = (await res.json()) as TrackingData;
      if (cancelledRef.current) return;
      setData(json);
      setError(null);
      setIsLive(true);
      setLoading(false);
    } catch {
      if (cancelledRef.current) return;
      setError("Could not reach the tracking server.");
      setIsLive(false);
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    cancelledRef.current = false;
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, [fetchData]);

  // Pusher: refetch on tracking-update
  usePusherEvent(
    data?.id ? `booking-${data.id}` : null,
    "tracking-update",
    () => {
      fetchData();
    }
  );

  const status = (data?.status || data?.booking?.status || "").toUpperCase();
  const statusLabel = STATUS_LABEL[status] || status || "Unknown";
  const isCancelled = status === "CANCELLED";

  const timelineSteps = useMemo(
    () =>
      deriveTimelineSteps(
        status,
        data?.jobTimeline?.map((e) => ({ step: e.step, timestamp: e.timestamp }))
      ),
    [status, data?.jobTimeline]
  );

  const showMap = !!data && !PRE_DISPATCH.has(status) && !isCancelled;
  const hasMapCoords =
    !!data?.pickupAddress?.lat &&
    !!data?.pickupAddress?.lng &&
    !!data?.dropoffAddress?.lat &&
    !!data?.dropoffAddress?.lng;

  const serviceLabel =
    data?.service || data?.booking?.service || data?.type || "Speedy Van Move";

  const totalPaid = data?.totalAmount ?? data?.booking?.totalAmount ?? null;

  return (
    <Box bg="pearl" color="ink" minH="100vh">
      <Container maxW="4xl" py={{ base: "28", md: "32" }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          {loading && !data && (
            <Box bg="surface" rounded="xl" p="12" textAlign="center" boxShadow="md">
              <Spinner color="gold" size="lg" />
              <Text mt="4" fontFamily="body" color="muted" fontSize="sm">
                Loading the latest update…
              </Text>
            </Box>
          )}

          {error && !data && (
            <Box bg="surface" rounded="xl" p="8" boxShadow="md" textAlign="center">
              <Heading as="h2" fontFamily="heading" fontWeight="700" color="ink" fontSize="xl" mb="3">
                {error}
              </Heading>
              <Text fontFamily="body" color="muted" fontSize="sm" mb="6">
                Double-check the reference, or call us and we&apos;ll find it for you.
              </Text>
              <a href={SITE.phone.href}>
                <Button bg="gold" color="obsidian" rounded="full" h="11" fontWeight="600" _hover={{ bg: "goldSoft" }}>
                  Call {SITE.phone.display}
                </Button>
              </a>
            </Box>
          )}

          {data && (
            <Stack gap="6">
              <StatusHero
                reference={data.reference || reference}
                serviceLabel={serviceLabel}
                status={status}
                statusLabel={statusLabel}
                etaMinutes={data.eta?.minutesRemaining}
                etaArrival={data.eta?.estimatedArrival}
                lastUpdated={data.lastUpdated}
                isLive={isLive}
              />

              {showMap && hasMapCoords && (
                <LiveMap
                  pickupLat={data.pickupAddress!.lat!}
                  pickupLng={data.pickupAddress!.lng!}
                  dropoffLat={data.dropoffAddress!.lat!}
                  dropoffLng={data.dropoffAddress!.lng!}
                  driverLat={data.driverLocation?.lat ?? null}
                  driverLng={data.driverLocation?.lng ?? null}
                  bookingId={data.id}
                />
              )}

              <StatusTimeline
                steps={timelineSteps}
                isCancelled={isCancelled}
                cancelledAt={data.cancelledAt}
              />

              <TrackingDetails
                service={data.service || data.booking?.service}
                variant={data.serviceVariant || data.booking?.variant}
                scheduledAt={data.booking?.scheduledAt}
                pickup={data.pickupAddress?.label}
                dropoff={data.dropoffAddress?.label}
                distanceMiles={data.distanceMiles}
                helpers={data.helpers}
                packing={data.packing}
                assembly={data.assembly}
                totalPaid={totalPaid}
                insurance={data.insurance}
              />

              {data.driver && !PRE_DISPATCH.has(status) && (
                <DriverCard name={data.driver.name} phone={data.driver.phone ?? null} />
              )}

              <TrackingActions
                reference={data.reference || reference}
                status={status}
                scheduledAt={data.booking?.scheduledAt}
                totalPaid={totalPaid}
                onCancelled={fetchData}
              />
            </Stack>
          )}
        </MotionBox>
      </Container>
    </Box>
  );
}
