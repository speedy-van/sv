"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  HiOutlineCurrencyPound,
  HiOutlineClipboardDocumentList,
  HiOutlineTruck,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { getDashboard, type AdminAnalytics } from "@/lib/admin-api";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";

function formatGBP(n: number) {
  return `£${(n ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => setData(d))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
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
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  const confirmed =
    data.bookingCounts?.find((b) => b.status === "CONFIRMED")?._count ?? 0;
  const completed =
    data.bookingCounts?.find((b) => b.status === "COMPLETED")?._count ?? 0;
  const inProgress =
    data.bookingCounts?.find((b) => b.status === "IN_PROGRESS")?._count ?? 0;

  return (
    <Stack gap={{ base: "6", md: "8" }}>
      {/* KPI cards */}
      <SimpleGrid columns={{ base: 2, lg: 4 }} gap="4">
        <StatCard
          label="Revenue (30d)"
          value={formatGBP(data.revenue30d)}
          sub="past 30 days"
          icon={<HiOutlineCurrencyPound />}
        />
        <StatCard
          label="Active jobs"
          value={inProgress + confirmed}
          sub={`${inProgress} in progress`}
          icon={<HiOutlineClipboardDocumentList />}
        />
        <StatCard
          label="Drivers"
          value={data.realDrivers ?? "—"}
          sub="registered"
          icon={<HiOutlineTruck />}
        />
        <StatCard
          label="Completed"
          value={completed}
          sub="all time"
          icon={<HiOutlineCheckCircle />}
        />
      </SimpleGrid>

      {/* Recent bookings */}
      <Box>
        <HStack justify="space-between" align="center" mb="4">
          <Text
            fontFamily="heading"
            fontWeight="700"
            color="pearl"
            fontSize="lg"
            letterSpacing="-0.01em"
          >
            Recent bookings
          </Text>
          <Link href="/admin/bookings">
            <Button
              size="sm"
              variant="outline"
              borderColor="glassBorder"
              color="gold"
              rounded="full"
              px="4"
              _hover={{ bg: "rgba(212,175,55,0.08)", borderColor: "gold" }}
            >
              View all →
            </Button>
          </Link>
        </HStack>

        <Box
          rounded="xl"
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          overflow="hidden"
        >
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="rgba(255,255,255,0.03)" borderBottomColor="rgba(255,255,255,0.06)">
                <Table.ColumnHeader
                  color="muted"
                  fontFamily="body"
                  fontSize="xs"
                  fontWeight="500"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  py="3"
                  px="4"
                >
                  Ref
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="muted"
                  fontFamily="body"
                  fontSize="xs"
                  fontWeight="500"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  py="3"
                >
                  Customer
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="muted"
                  fontFamily="body"
                  fontSize="xs"
                  fontWeight="500"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  py="3"
                  display={{ base: "none", md: "table-cell" }}
                >
                  Route
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="muted"
                  fontFamily="body"
                  fontSize="xs"
                  fontWeight="500"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  py="3"
                >
                  Status
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="muted"
                  fontFamily="body"
                  fontSize="xs"
                  fontWeight="500"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  py="3"
                  textAlign="right"
                >
                  Amount
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="muted"
                  fontFamily="body"
                  fontSize="xs"
                  fontWeight="500"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  py="3"
                  display={{ base: "none", lg: "table-cell" }}
                >
                  Date
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {(data.recentBookings ?? []).slice(0, 10).map((b) => (
                <Table.Row
                  key={b.id}
                  borderBottomColor="rgba(255,255,255,0.05)"
                  _hover={{ bg: "rgba(255,255,255,0.02)" }}
                >
                  <Table.Cell py="3" px="4">
                    <Text fontFamily="mono" color="gold" fontSize="xs">
                      {b.reference ?? b.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell py="3">
                    <Text fontFamily="body" color="pearl" fontSize="sm">
                      {b.customer?.name ?? "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell py="3" display={{ base: "none", md: "table-cell" }}>
                    <Text fontFamily="body" color="muted" fontSize="xs">
                      {b.pickupAddress?.postcode ?? "—"} → {b.dropoffAddress?.postcode ?? "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell py="3">
                    <StatusBadge status={b.status} />
                  </Table.Cell>
                  <Table.Cell py="3" textAlign="right">
                    <Text fontFamily="heading" fontWeight="600" color="pearl" fontSize="sm">
                      {b.totalGBP ? formatGBP(b.totalGBP) : "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell
                    py="3"
                    display={{ base: "none", lg: "table-cell" }}
                  >
                    <Text fontFamily="body" color="muted" fontSize="xs">
                      {formatDate(b.scheduledAt ?? b.createdAt)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
              {(!data.recentBookings || data.recentBookings.length === 0) && (
                <Table.Row>
                  <Table.Cell
                    colSpan={6}
                    textAlign="center"
                    py="10"
                    color="muted"
                    fontFamily="body"
                    fontSize="sm"
                  >
                    No bookings yet.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>
    </Stack>
  );
}
