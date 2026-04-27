"use client";

import { Box, SimpleGrid, Stack, Text, chakra } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { HiChevronDown } from "react-icons/hi2";
import { easeOutExpo } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

interface TrackingDetailsProps {
  service?: string;
  variant?: string;
  scheduledAt?: string | null;
  pickup?: string;
  dropoff?: string;
  distanceMiles?: number | null;
  helpers?: number | null;
  packing?: boolean;
  assembly?: boolean;
  totalPaid?: number | null;
  insurance?: boolean;
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function TrackingDetails(props: TrackingDetailsProps) {
  const [open, setOpen] = useState(false);

  return (
    <Box
      bg="surface"
      rounded="xl"
      border="1px solid"
      borderColor="rgba(9,9,11,0.08)"
      overflow="hidden"
      boxShadow="0 12px 36px rgba(9,9,11,0.06)"
    >
      <chakra.button
        onClick={() => setOpen((v) => !v)}
        w="full"
        px={{ base: "6", md: "8" }}
        py="5"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg="transparent"
        _hover={{ bg: "rgba(212,175,55,0.05)" }}
        transition="background 200ms"
      >
        <Stack direction="row" gap="3" align="center">
          <Text
            color="gold"
            fontFamily="heading"
            fontWeight="500"
            fontSize="xs"
            letterSpacing="0.32em"
            textTransform="uppercase"
          >
            Booking Details
          </Text>
        </Stack>
        <MotionBox
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: easeOutExpo }}
          color="muted"
          display="inline-flex"
        >
          <HiChevronDown size={20} />
        </MotionBox>
      </chakra.button>

      <AnimatePresence initial={false}>
        {open && (
          <MotionBox
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: easeOutExpo }}
            overflow="hidden"
          >
            <Box px={{ base: "6", md: "8" }} pb="7" borderTop="1px solid" borderColor="rgba(9,9,11,0.06)" pt="5">
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
                <Detail label="Service" value={props.service || "—"} />
                <Detail label="Variant" value={props.variant || "—"} />
                <Detail label="Scheduled" value={formatDateTime(props.scheduledAt)} />
                <Detail
                  label="Distance"
                  value={props.distanceMiles != null ? `${props.distanceMiles.toFixed(1)} miles` : "—"}
                />
                <Detail label="Pickup" value={props.pickup || "—"} />
                <Detail label="Dropoff" value={props.dropoff || "—"} />
                <Detail label="Helpers" value={props.helpers != null ? `${props.helpers}` : "—"} />
                <Detail
                  label="Extras"
                  value={
                    [props.packing && "Packing", props.assembly && "Assembly"]
                      .filter(Boolean)
                      .join(" · ") || "None"
                  }
                />
                <Detail
                  label="Total paid"
                  value={
                    props.totalPaid != null
                      ? `£${(props.totalPaid / 100 < 1 ? props.totalPaid : props.totalPaid).toFixed?.(2) ?? props.totalPaid}`
                      : "—"
                  }
                />
                <Detail
                  label="Insurance"
                  value={
                    props.insurance ? (
                      <chakra.span
                        display="inline-flex"
                        px="2"
                        py="0.5"
                        rounded="full"
                        bg="rgba(5,150,105,0.12)"
                        color="emerald"
                        fontWeight="600"
                        fontSize="xs"
                      >
                        Covered
                      </chakra.span>
                    ) : (
                      "—"
                    )
                  }
                />
              </SimpleGrid>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack gap="1">
      <Text
        fontFamily="body"
        color="muted"
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="0.08em"
      >
        {label}
      </Text>
      <Text fontFamily="heading" color="ink" fontSize="sm" fontWeight="600">
        {value}
      </Text>
    </Stack>
  );
}
