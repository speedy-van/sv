"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
  chakra,
} from "@chakra-ui/react";
import { getBookings, type AdminBooking } from "@/lib/admin-api";
import { StatusBadge } from "@/components/admin/StatusBadge";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING_PAYMENT" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function formatGBP(n: number) {
  return `£${(n ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getBookings({ page, status: status || undefined, q: debouncedQ || undefined })
      .then((res) => {
        setBookings(res.orders ?? []);
        setTotal(res.pagination?.total ?? res.count ?? 0);
      })
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, [page, status, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [status, debouncedQ]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <Stack gap="6">
      {/* Filters */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reference, name, postcode…"
          bg="rgba(255,255,255,0.05)"
          border="1px solid"
          borderColor="glassBorder"
          color="pearl"
          h="10"
          rounded="md"
          _placeholder={{ color: "rgba(250,250,249,0.3)" }}
          _focus={{ borderColor: "gold" }}
        />
        <HStack gap="1" flexWrap="wrap">
          {STATUS_TABS.map((t) => (
            <Button
              key={t.value}
              size="xs"
              variant={status === t.value ? "solid" : "outline"}
              bg={status === t.value ? "gold" : "transparent"}
              color={status === t.value ? "obsidian" : "muted"}
              borderColor="glassBorder"
              rounded="full"
              px="3"
              onClick={() => setStatus(t.value)}
              _hover={{ borderColor: "gold", color: "pearl" }}
            >
              {t.label}
            </Button>
          ))}
        </HStack>
      </SimpleGrid>

      {/* Summary row */}
      <HStack justify="space-between" align="center">
        <Text fontFamily="body" color="muted" fontSize="sm">
          {loading ? "Loading…" : `${total.toLocaleString("en-GB")} bookings`}
        </Text>
        {loading && <Spinner size="sm" color="gold" />}
      </HStack>

      {/* Table */}
      <Box
        rounded="xl"
        border="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        overflow="auto"
      >
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row
              bg="rgba(255,255,255,0.03)"
              borderBottomColor="rgba(255,255,255,0.06)"
            >
              {[
                "Ref",
                "Customer",
                "Route",
                "Service date",
                "Status",
                "Amount",
                "Driver",
              ].map((col) => (
                <Table.ColumnHeader
                  key={col}
                  color="muted"
                  fontFamily="body"
                  fontSize="xs"
                  fontWeight="500"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  py="3"
                  px="4"
                  whiteSpace="nowrap"
                >
                  {col}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {error ? (
              <Table.Row>
                <Table.Cell colSpan={7} textAlign="center" py="10">
                  <Stack align="center" gap="3">
                    <Text fontFamily="body" color="crimson" fontSize="sm">
                      {error}
                    </Text>
                    <Button
                      size="xs"
                      variant="outline"
                      borderColor="glassBorder"
                      color="pearl"
                      onClick={load}
                    >
                      Retry
                    </Button>
                  </Stack>
                </Table.Cell>
              </Table.Row>
            ) : bookings.length === 0 && !loading ? (
              <Table.Row>
                <Table.Cell
                  colSpan={7}
                  textAlign="center"
                  py="10"
                  color="muted"
                  fontFamily="body"
                  fontSize="sm"
                >
                  No bookings match your filters.
                </Table.Cell>
              </Table.Row>
            ) : (
              bookings.map((b) => (
                <Table.Row
                  key={b.id}
                  borderBottomColor="rgba(255,255,255,0.04)"
                  _hover={{ bg: "rgba(255,255,255,0.02)" }}
                >
                  <Table.Cell py="3" px="4">
                    <Text fontFamily="mono" color="gold" fontSize="xs" whiteSpace="nowrap">
                      {b.reference ?? b.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell py="3">
                    <Stack gap="0.5">
                      <Text fontFamily="body" color="pearl" fontSize="sm" whiteSpace="nowrap">
                        {b.customer?.name ?? "—"}
                      </Text>
                      <Text fontFamily="body" color="muted" fontSize="xs">
                        {b.customer?.email ?? ""}
                      </Text>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell py="3">
                    <Text fontFamily="body" color="muted" fontSize="xs" whiteSpace="nowrap">
                      {b.pickupAddress?.postcode ?? "—"} → {b.dropoffAddress?.postcode ?? "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell py="3">
                    <Text fontFamily="body" color="muted" fontSize="xs" whiteSpace="nowrap">
                      {formatDate(b.scheduledAt ?? b.createdAt)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell py="3">
                    <StatusBadge status={b.status} />
                  </Table.Cell>
                  <Table.Cell py="3">
                    <Text
                      fontFamily="heading"
                      fontWeight="600"
                      color="pearl"
                      fontSize="sm"
                      whiteSpace="nowrap"
                    >
                      {b.totalGBP ? formatGBP(b.totalGBP) : "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell py="3">
                    <Text fontFamily="body" color="muted" fontSize="xs">
                      {b.driver?.User?.name ?? (
                        <chakra.span color="rgba(212,175,55,0.6)">Unassigned</chakra.span>
                      )}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Pagination */}
      <HStack justify="space-between" align="center">
        <Text fontFamily="body" color="muted" fontSize="xs">
          Page {page} of {totalPages}
        </Text>
        <HStack gap="2">
          <Button
            size="sm"
            variant="outline"
            borderColor="glassBorder"
            color="pearl"
            rounded="md"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
            _hover={{ borderColor: "gold" }}
          >
            ← Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor="glassBorder"
            color="pearl"
            rounded="md"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
            _hover={{ borderColor: "gold" }}
          >
            Next →
          </Button>
        </HStack>
      </HStack>
    </Stack>
  );
}
