"use client";

import Link from "next/link";
import { Box, Button, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineCalendarDays,
  HiOutlineCurrencyPound,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { CustomerShell } from "@/components/customer/CustomerShell";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface Summary {
  upcomingCount?: number;
  totalBookings?: number;
  lifetimeSpend?: number;
  nextBooking?: { reference: string; scheduledAt?: string | null };
}

function formatGBP(pence?: number) {
  if (pence == null) return "£0";
  return `£${(pence / 100).toFixed(2)}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "—";
  }
}

export default function CustomerHomePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/customer/summary`, { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        setSummary(j ?? {});
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setSummary({});
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      label: "Upcoming moves",
      value: loading ? "—" : `${summary?.upcomingCount ?? 0}`,
      Icon: HiOutlineCalendarDays,
    },
    {
      label: "Total bookings",
      value: loading ? "—" : `${summary?.totalBookings ?? 0}`,
      Icon: HiOutlineClipboardDocumentList,
    },
    {
      label: "Lifetime spend",
      value: loading ? "—" : formatGBP(summary?.lifetimeSpend),
      Icon: HiOutlineCurrencyPound,
    },
  ];

  return (
    <CustomerShell>
      <Stack gap="6">
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
          {stats.map(({ label, value, Icon }) => (
            <Box
              key={label}
              bg="surface"
              border="1px solid"
              borderColor="rgba(9,9,11,0.08)"
              rounded="xl"
              p="6"
              boxShadow="0 8px 24px rgba(9,9,11,0.04)"
            >
              <Box as={Icon} fontSize="24px" color="gold" mb="3" />
              <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                {label}
              </Text>
              <Heading fontFamily="heading" fontWeight="700" color="ink" fontSize="2xl" mt="1">
                {value}
              </Heading>
            </Box>
          ))}
        </SimpleGrid>

        {summary?.nextBooking?.reference && (
          <Box
            bg="obsidian"
            color="pearl"
            rounded="xl"
            p={{ base: "6", md: "7" }}
            boxShadow="0 12px 36px rgba(9,9,11,0.18)"
          >
            <Text
              color="gold"
              fontFamily="heading"
              fontWeight="500"
              fontSize="xs"
              letterSpacing="0.32em"
              textTransform="uppercase"
              mb="2"
            >
              Next move
            </Text>
            <Stack direction={{ base: "column", md: "row" }} gap="4" justify="space-between" align={{ md: "center" }}>
              <Stack gap="1">
                <Heading fontFamily="heading" fontWeight="700" fontSize="xl">
                  {formatDate(summary.nextBooking.scheduledAt)}
                </Heading>
                <Text fontFamily="mono" color="muted" fontSize="sm">
                  {summary.nextBooking.reference}
                </Text>
              </Stack>
              <Link href={`/booking/track/${summary.nextBooking.reference}`}>
                <Button
                  bg="gold"
                  color="obsidian"
                  rounded="full"
                  h="11"
                  px="6"
                  fontWeight="600"
                  _hover={{ bg: "goldSoft" }}
                >
                  Track
                </Button>
              </Link>
            </Stack>
          </Box>
        )}

        <Box
          bg="surface"
          border="1px solid"
          borderColor="rgba(9,9,11,0.08)"
          rounded="xl"
          p={{ base: "6", md: "8" }}
        >
          <Stack direction={{ base: "column", md: "row" }} gap="4" justify="space-between" align={{ md: "center" }}>
            <Stack gap="1">
              <Box as={HiOutlineSparkles} fontSize="22px" color="gold" mb="1" />
              <Heading fontFamily="heading" fontWeight="700" color="ink" fontSize="xl">
                Need to book another move?
              </Heading>
              <Text fontFamily="body" color="muted" fontSize="sm">
                Get a fixed quote in under a minute.
              </Text>
            </Stack>
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
                Book Now
              </Button>
            </Link>
          </Stack>
        </Box>
      </Stack>
    </CustomerShell>
  );
}
