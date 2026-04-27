"use client";

import { Box, Heading, Stack, Text, chakra } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { easeOutExpo } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

interface StatusHeroProps {
  reference: string;
  serviceLabel?: string;
  status: string;
  statusLabel: string;
  etaMinutes?: number | null;
  etaArrival?: string | null;
  lastUpdated?: string | null;
  isLive?: boolean;
}

const STATUS_GRADIENT: Record<string, string> = {
  CONFIRMED: "linear-gradient(135deg, #D4AF37 0%, #E6C76B 100%)",
  ASSIGNED: "linear-gradient(135deg, #D4AF37 0%, #E6C76B 100%)",
  DRIVER_EN_ROUTE: "linear-gradient(135deg, #2563EB 0%, #4F8BFF 100%)",
  EN_ROUTE_PICKUP: "linear-gradient(135deg, #2563EB 0%, #4F8BFF 100%)",
  IN_TRANSIT: "linear-gradient(135deg, #2563EB 0%, #4F8BFF 100%)",
  ARRIVED_PICKUP: "linear-gradient(135deg, #D4AF37 0%, #E6C76B 100%)",
  AT_PICKUP: "linear-gradient(135deg, #D4AF37 0%, #E6C76B 100%)",
  LOADING: "linear-gradient(135deg, #D4AF37 0%, #E6C76B 100%)",
  ARRIVED_DROPOFF: "linear-gradient(135deg, #D4AF37 0%, #E6C76B 100%)",
  AT_DROPOFF: "linear-gradient(135deg, #D4AF37 0%, #E6C76B 100%)",
  UNLOADING: "linear-gradient(135deg, #D4AF37 0%, #E6C76B 100%)",
  COMPLETED: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  CANCELLED: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
};

const STATUS_ICON: Record<string, string> = {
  CONFIRMED: "✅",
  ASSIGNED: "🚛",
  DRIVER_EN_ROUTE: "🚗",
  EN_ROUTE_PICKUP: "🚗",
  ARRIVED_PICKUP: "📍",
  AT_PICKUP: "📍",
  LOADING: "📦",
  IN_TRANSIT: "🛣️",
  ARRIVED_DROPOFF: "🏠",
  AT_DROPOFF: "🏠",
  UNLOADING: "📦",
  COMPLETED: "🎉",
  CANCELLED: "❌",
};

function timeAgo(iso: string | null | undefined, now: number): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Math.floor((now - t) / 1000));
  if (diff < 60) return `${diff} second${diff === 1 ? "" : "s"} ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  return `${h} hour${h === 1 ? "" : "s"} ago`;
}

export function StatusHero({
  reference,
  serviceLabel,
  status,
  statusLabel,
  etaMinutes,
  etaArrival,
  lastUpdated,
  isLive = true,
}: StatusHeroProps) {
  const upper = (status || "").toUpperCase();
  const gradient = STATUS_GRADIENT[upper] || STATUS_GRADIENT.CONFIRMED;
  const icon = STATUS_ICON[upper] || "📦";

  // ETA local countdown
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const etaArrivalMs = etaArrival ? new Date(etaArrival).getTime() : null;
  const liveEtaMin = etaArrivalMs
    ? Math.max(0, Math.round((etaArrivalMs - now) / 60000))
    : etaMinutes ?? null;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: easeOutExpo }}
      rounded="xl"
      p={{ base: "6", md: "8" }}
      color="obsidian"
      style={{ background: gradient }}
      boxShadow="0 16px 48px rgba(9,9,11,0.18)"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset="0"
        bg="radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18) 0%, transparent 60%)"
        pointerEvents="none"
      />
      <Stack gap="4" position="relative">
        <Stack gap="1">
          {serviceLabel && (
            <Text fontFamily="heading" fontWeight="600" fontSize="lg" color="obsidian">
              🚛 {serviceLabel}
            </Text>
          )}
          <Text fontFamily="mono" fontSize="sm" color="rgba(9,9,11,0.7)">
            {reference}
          </Text>
        </Stack>

        <Box
          bg="rgba(9,9,11,0.85)"
          color="pearl"
          rounded="lg"
          px={{ base: "5", md: "6" }}
          py={{ base: "4", md: "5" }}
          backdropFilter="blur(8px)"
        >
          <Stack direction="row" gap="3" align="center" justify="space-between" flexWrap="wrap">
            <Stack direction="row" gap="3" align="center">
              <Text fontSize="2xl">{icon}</Text>
              <Heading
                as="h2"
                fontFamily="heading"
                fontWeight="700"
                fontSize={{ base: "lg", md: "xl" }}
                letterSpacing="-0.01em"
                textTransform="uppercase"
              >
                {statusLabel}
              </Heading>
            </Stack>
            {liveEtaMin != null && upper !== "COMPLETED" && upper !== "CANCELLED" && (
              <Text fontFamily="mono" color="gold" fontWeight="600" fontSize="sm">
                ETA: {liveEtaMin} min
              </Text>
            )}
          </Stack>
        </Box>

        <Stack direction="row" gap="2" align="center">
          {isLive ? (
            <>
              <Box position="relative" w="10px" h="10px">
                <chakra.span
                  position="absolute"
                  inset="0"
                  rounded="full"
                  bg="emerald"
                  animation="sv-live-pulse 1.6s ease-out infinite"
                />
                <Box position="absolute" inset="2px" rounded="full" bg="emerald" />
              </Box>
              <Text fontFamily="body" fontSize="xs" color="obsidian" fontWeight="500">
                Live · Updated {timeAgo(lastUpdated, now) || "just now"}
              </Text>
            </>
          ) : (
            <>
              <Box w="10px" h="10px" rounded="full" bg="crimson" />
              <Text fontFamily="body" fontSize="xs" color="obsidian" fontWeight="500">
                Reconnecting…
              </Text>
            </>
          )}
        </Stack>
      </Stack>
      <style jsx global>{`
        @keyframes sv-live-pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          70% {
            transform: scale(2.4);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </MotionBox>
  );
}
