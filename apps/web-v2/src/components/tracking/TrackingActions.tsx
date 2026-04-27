"use client";

import { Box, Button, Heading, Stack, Text, chakra } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { HiPhone, HiChatBubbleLeftRight, HiArrowDownTray, HiXCircle } from "react-icons/hi2";
import { SITE } from "@/lib/site";

const MotionBox = motion.create(chakra.div);

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface TrackingActionsProps {
  reference: string;
  status: string;
  scheduledAt?: string | null;
  totalPaid?: number | null;
  onCancelled?: () => void;
}

function refundPercent(scheduledAt?: string | null): { pct: number; copy: string } {
  if (!scheduledAt) return { pct: 0, copy: "We can't determine the refund window automatically — call us." };
  const t = new Date(scheduledAt).getTime();
  if (Number.isNaN(t)) return { pct: 0, copy: "Unknown refund window." };
  const hours = (t - Date.now()) / 36e5;
  if (hours >= 48) return { pct: 100, copy: "More than 48 hours away — full refund." };
  if (hours >= 24) return { pct: 50, copy: "Between 24h and 48h — 50% refund." };
  return { pct: 0, copy: "Less than 24 hours — no refund available." };
}

export function TrackingActions({
  reference,
  status,
  scheduledAt,
  totalPaid,
  onCancelled,
}: TrackingActionsProps) {
  const upper = (status || "").toUpperCase();
  const isCompleted = upper === "COMPLETED";
  const isCancelled = upper === "CANCELLED";
  const canCancel = !isCompleted && !isCancelled;

  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refund = refundPercent(scheduledAt);
  const refundAmount = totalPaid != null ? (totalPaid * refund.pct) / 100 : null;

  async function downloadInvoice() {
    const url = `${API}/api/invoice/${encodeURIComponent(reference)}`;
    window.open(url, "_blank", "noopener");
  }

  async function confirmCancel() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/booking/${encodeURIComponent(reference)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setError("Could not cancel — please call us.");
        setSubmitting(false);
        return;
      }
      setConfirming(false);
      setSubmitting(false);
      onCancelled?.();
    } catch {
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Box
      bg="surface"
      rounded="xl"
      p={{ base: "6", md: "7" }}
      border="1px solid"
      borderColor="rgba(9,9,11,0.08)"
      boxShadow="0 12px 36px rgba(9,9,11,0.06)"
    >
      <Stack direction={{ base: "column", md: "row" }} gap="3" flexWrap="wrap">
        {isCompleted && (
          <Button
            bg="gold"
            color="obsidian"
            rounded="full"
            h="11"
            px="6"
            fontWeight="600"
            _hover={{ bg: "goldSoft" }}
            onClick={downloadInvoice}
          >
            <HiArrowDownTray /> Download Invoice
          </Button>
        )}
        {canCancel && (
          <Button
            variant="outline"
            color="crimson"
            borderColor="crimson"
            rounded="full"
            h="11"
            px="6"
            fontWeight="600"
            _hover={{ bg: "rgba(220,38,38,0.08)" }}
            onClick={() => setConfirming(true)}
          >
            <HiXCircle /> Cancel Booking
          </Button>
        )}
        <Box as="a" {...{ href: SITE.phone.href }} flex="1" minW="140px">
          <Button
            bg="obsidian"
            color="pearl"
            rounded="full"
            h="11"
            px="6"
            fontWeight="600"
            w="full"
            _hover={{ bg: "ink" }}
          >
            <HiPhone /> Call Us
          </Button>
        </Box>
        <Box as="a" {...{ href: SITE.whatsapp.href, target: "_blank", rel: "noopener noreferrer" }} flex="1" minW="140px">
          <Button
            bg="emerald"
            color="white"
            rounded="full"
            h="11"
            px="6"
            fontWeight="600"
            w="full"
            _hover={{ opacity: 0.9 }}
          >
            <HiChatBubbleLeftRight /> WhatsApp
          </Button>
        </Box>
      </Stack>

      <AnimatePresence>
        {confirming && (
          <MotionBox
            position="fixed"
            inset="0"
            zIndex="2000"
            bg="rgba(9,9,11,0.7)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px="4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && setConfirming(false)}
          >
            <MotionBox
              bg="surface"
              rounded="xl"
              p={{ base: "6", md: "8" }}
              maxW="480px"
              w="full"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              boxShadow="0 24px 80px rgba(0,0,0,0.4)"
            >
              <Heading as="h3" fontFamily="heading" fontWeight="700" color="ink" fontSize="xl" mb="3">
                Cancel this booking?
              </Heading>
              <Text fontFamily="body" color="muted" fontSize="sm" mb="5">
                {refund.copy}
              </Text>
              {refundAmount != null && refund.pct > 0 && (
                <Box bg="rgba(212,175,55,0.1)" rounded="md" p="4" mb="5">
                  <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                    Estimated refund
                  </Text>
                  <Text fontFamily="heading" color="ink" fontWeight="700" fontSize="2xl">
                    £{refundAmount.toFixed(2)}
                  </Text>
                </Box>
              )}
              {error && (
                <Text color="crimson" fontFamily="body" fontSize="sm" mb="4">
                  {error}
                </Text>
              )}
              <Stack direction="row" gap="3" justify="flex-end">
                <Button
                  variant="ghost"
                  color="muted"
                  rounded="full"
                  onClick={() => setConfirming(false)}
                  disabled={submitting}
                >
                  Keep booking
                </Button>
                <Button
                  bg="crimson"
                  color="white"
                  rounded="full"
                  px="6"
                  fontWeight="600"
                  loading={submitting}
                  onClick={confirmCancel}
                  _hover={{ opacity: 0.9 }}
                >
                  Confirm cancel
                </Button>
              </Stack>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}
