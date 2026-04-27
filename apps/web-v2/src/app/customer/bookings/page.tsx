"use client";

import Link from "next/link";
import { Box, Button, Heading, Spinner, Stack, Text, chakra } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { CustomerShell } from "@/components/customer/CustomerShell";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface BookingRow {
  id?: string;
  reference: string;
  status: string;
  scheduledAt?: string | null;
  service?: string;
  pickupLabel?: string;
  dropoffLabel?: string;
  totalAmount?: number | null;
}

const STATUS_TONE: Record<string, { bg: string; color: string }> = {
  COMPLETED: { bg: "rgba(5,150,105,0.12)", color: "emerald" },
  CANCELLED: { bg: "rgba(220,38,38,0.10)", color: "crimson" },
};

function statusStyle(status: string) {
  return (
    STATUS_TONE[status?.toUpperCase()] ?? {
      bg: "rgba(212,175,55,0.12)",
      color: "ink",
    }
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatGBP(pence?: number | null) {
  if (pence == null) return "—";
  return `£${(pence / 100).toFixed(2)}`;
}

export default function CustomerBookingsPage() {
  const [items, setItems] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/customer/bookings`, { credentials: "include", cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        const j = await r.json();
        const list: BookingRow[] = Array.isArray(j) ? j : j.bookings ?? j.items ?? [];
        if (!cancelled) {
          setItems(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load your bookings.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CustomerShell>
      {loading ? (
        <Box bg="surface" rounded="xl" p="12" textAlign="center" boxShadow="md">
          <Spinner color="gold" />
          <Text mt="3" fontFamily="body" color="muted" fontSize="sm">
            Loading your bookings…
          </Text>
        </Box>
      ) : error ? (
        <Box bg="surface" rounded="xl" p="8" textAlign="center" boxShadow="md">
          <Text color="crimson" fontFamily="body" fontSize="sm">
            {error}
          </Text>
        </Box>
      ) : items.length === 0 ? (
        <Box bg="surface" rounded="xl" p="10" textAlign="center" boxShadow="md">
          <Heading as="h2" fontFamily="heading" fontWeight="700" color="ink" fontSize="xl" mb="2">
            No bookings yet
          </Heading>
          <Text fontFamily="body" color="muted" fontSize="sm" mb="6">
            Your move history will appear here once you book.
          </Text>
          <Link href="/book">
            <Button
              bg="gold"
              color="obsidian"
              rounded="full"
              h="11"
              px="7"
              fontWeight="600"
              boxShadow="goldGlow"
              _hover={{ bg: "goldSoft" }}
            >
              Book Your First Move
            </Button>
          </Link>
        </Box>
      ) : (
        <Stack gap="3">
          {items.map((b) => {
            const tone = statusStyle(b.status);
            return (
              <Box
                key={b.reference}
                bg="surface"
                border="1px solid"
                borderColor="rgba(9,9,11,0.08)"
                rounded="xl"
                p={{ base: "5", md: "6" }}
                boxShadow="0 8px 24px rgba(9,9,11,0.04)"
              >
                <Stack
                  direction={{ base: "column", md: "row" }}
                  gap="4"
                  justify="space-between"
                  align={{ md: "center" }}
                >
                  <Stack gap="2" flex="1">
                    <Stack direction="row" gap="3" align="center" flexWrap="wrap">
                      <chakra.span
                        px="2.5"
                        py="0.5"
                        rounded="full"
                        bg={tone.bg}
                        color={tone.color}
                        fontFamily="body"
                        fontSize="xs"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing="0.06em"
                      >
                        {b.status}
                      </chakra.span>
                      <Text fontFamily="mono" color="muted" fontSize="xs">
                        {b.reference}
                      </Text>
                    </Stack>
                    <Heading fontFamily="heading" fontWeight="700" color="ink" fontSize="md">
                      {b.service || "Move"} · {formatDate(b.scheduledAt)}
                    </Heading>
                    {(b.pickupLabel || b.dropoffLabel) && (
                      <Text fontFamily="body" color="muted" fontSize="sm">
                        {b.pickupLabel ?? "—"} → {b.dropoffLabel ?? "—"}
                      </Text>
                    )}
                  </Stack>
                  <Stack direction="row" gap="2" align="center" flexShrink={0}>
                    <Text fontFamily="heading" fontWeight="700" color="ink" fontSize="lg">
                      {formatGBP(b.totalAmount)}
                    </Text>
                    <Link href={`/booking/track/${b.reference}`}>
                      <Button
                        bg="obsidian"
                        color="pearl"
                        rounded="full"
                        h="9"
                        px="4"
                        fontWeight="600"
                        fontSize="sm"
                        _hover={{ bg: "ink" }}
                      >
                        View
                      </Button>
                    </Link>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </CustomerShell>
  );
}
