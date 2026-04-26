"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { getDashboard, type AdminAnalytics } from "@/lib/admin-api";
import { StatCard } from "@/components/admin/StatCard";
import { MiniBarChart } from "@/components/admin/MiniBarChart";
import {
  HiOutlineCurrencyPound,
  HiOutlineCalendarDays,
  HiOutlineClock,
} from "react-icons/hi2";

function formatGBP(n: number) {
  return `£${(n ?? 0).toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_PAYMENT: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "Live",
  COMPLETED: "Done",
  CANCELLED: "Cancelled",
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    getDashboard()
      .then((d) => setData(d))
      .catch(() => setError("Failed to load analytics."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py="20">
        <Spinner color="gold" size="xl" borderWidth="3px" />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Stack align="center" py="20" gap="4">
        <Text fontFamily="body" color="crimson">
          {error ?? "No data available."}
        </Text>
        <Button
          size="sm"
          variant="outline"
          borderColor="glassBorder"
          color="pearl"
          onClick={load}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  const chartData = (data.bookingCounts ?? []).map((b) => ({
    label: STATUS_LABELS[b.status] ?? b.status,
    value: b._count,
  }));

  const totalBookings = (data.bookingCounts ?? []).reduce(
    (acc, b) => acc + b._count,
    0,
  );
  const completedCount =
    data.bookingCounts?.find((b) => b.status === "COMPLETED")?._count ?? 0;
  const completionRate =
    totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0;

  return (
    <Stack gap={{ base: "6", md: "8" }}>
      {/* Revenue KPI row */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap="4">
        <StatCard
          label="Revenue 30d"
          value={formatGBP(data.revenue30d)}
          sub="rolling 30 days"
          icon={<HiOutlineCurrencyPound />}
        />
        <StatCard
          label="Revenue 7d"
          value={formatGBP(data.revenue7d)}
          sub="rolling 7 days"
          icon={<HiOutlineCalendarDays />}
        />
        <StatCard
          label="Revenue 24h"
          value={formatGBP(data.revenue24h)}
          sub="last 24 hours"
          icon={<HiOutlineClock />}
        />
      </SimpleGrid>

      {/* Booking volumes + bar chart */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
        {/* Bar chart */}
        <Box
          bg="rgba(255,255,255,0.04)"
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          rounded="xl"
          p="6"
        >
          <Stack gap="4">
            <HStack justify="space-between" align="baseline">
              <Text
                fontFamily="heading"
                fontWeight="700"
                color="pearl"
                fontSize="md"
                letterSpacing="-0.01em"
              >
                Bookings by status
              </Text>
              <Text fontFamily="body" color="muted" fontSize="xs">
                {totalBookings.toLocaleString("en-GB")} total
              </Text>
            </HStack>
            {chartData.length > 0 ? (
              <MiniBarChart data={chartData} h="140px" />
            ) : (
              <Box
                h="140px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontFamily="body" color="muted" fontSize="sm">
                  No data
                </Text>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Stat breakdown */}
        <Box
          bg="rgba(255,255,255,0.04)"
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          rounded="xl"
          p="6"
        >
          <Stack gap="5">
            <Text
              fontFamily="heading"
              fontWeight="700"
              color="pearl"
              fontSize="md"
              letterSpacing="-0.01em"
            >
              Breakdown
            </Text>
            <Stack gap="3">
              {(data.bookingCounts ?? []).map((b) => {
                const pct =
                  totalBookings > 0
                    ? Math.round((b._count / totalBookings) * 100)
                    : 0;
                return (
                  <HStack key={b.status} justify="space-between" align="center">
                    <HStack gap="2.5" align="center">
                      <Text fontFamily="body" color="muted" fontSize="sm" w="80px">
                        {STATUS_LABELS[b.status] ?? b.status}
                      </Text>
                      <Box
                        h="5px"
                        rounded="full"
                        bg="gold"
                        opacity={0.6}
                        style={{
                          width: `${Math.max(pct, 2)}px`,
                          maxWidth: "160px",
                          transition: "width 600ms cubic-bezier(0.16,1,0.3,1)",
                        }}
                      />
                    </HStack>
                    <HStack gap="3">
                      <Text fontFamily="body" color="muted" fontSize="xs">
                        {pct}%
                      </Text>
                      <Text
                        fontFamily="heading"
                        fontWeight="600"
                        color="pearl"
                        fontSize="sm"
                        w="36px"
                        textAlign="right"
                      >
                        {b._count.toLocaleString("en-GB")}
                      </Text>
                    </HStack>
                  </HStack>
                );
              })}
            </Stack>
          </Stack>
        </Box>
      </SimpleGrid>

      {/* Completion rate highlight */}
      <Box
        bg="rgba(212,175,55,0.06)"
        border="1px solid"
        borderColor="rgba(212,175,55,0.2)"
        rounded="xl"
        p="6"
      >
        <HStack gap="6" flexWrap="wrap">
          <Stack gap="1">
            <Text
              fontFamily="body"
              color="muted"
              fontSize="xs"
              letterSpacing="0.06em"
              textTransform="uppercase"
            >
              Job completion rate
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="800"
              color="gold"
              fontSize="4xl"
              letterSpacing="-0.02em"
              lineHeight="1"
            >
              {completionRate}%
            </Text>
          </Stack>
          <Stack gap="1">
            <Text
              fontFamily="body"
              color="muted"
              fontSize="xs"
              letterSpacing="0.06em"
              textTransform="uppercase"
            >
              Active drivers
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="800"
              color="pearl"
              fontSize="4xl"
              letterSpacing="-0.02em"
              lineHeight="1"
            >
              {data.realDrivers ?? "—"}
            </Text>
          </Stack>
          <Stack gap="1">
            <Text
              fontFamily="body"
              color="muted"
              fontSize="xs"
              letterSpacing="0.06em"
              textTransform="uppercase"
            >
              Total bookings
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="800"
              color="pearl"
              fontSize="4xl"
              letterSpacing="-0.02em"
              lineHeight="1"
            >
              {totalBookings.toLocaleString("en-GB")}
            </Text>
          </Stack>
        </HStack>
      </Box>
    </Stack>
  );
}
