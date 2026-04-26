"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Input,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { getDrivers, type AdminDriver } from "@/lib/admin-api";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function pct(n: number | null | undefined) {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

function stars(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toFixed(1)} ★`;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DriverStatusDot({ status }: { status?: string }) {
  const color =
    !status || status === "active"
      ? "#10B981"
      : status === "inactive"
        ? "#71717A"
        : "#D4AF37";
  return (
    <HStack gap="2" align="center">
      <Box w="7px" h="7px" rounded="full" bg={color} flexShrink={0} />
      <Text fontFamily="body" color="pearl" fontSize="xs" textTransform="capitalize">
        {status ?? "active"}
      </Text>
    </HStack>
  );
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDrivers({
      page,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    })
      .then((res) => {
        setDrivers(res.drivers ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => setError("Failed to load drivers."))
      .finally(() => setLoading(false));
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <Stack gap="6">
      {/* Filters */}
      <HStack gap="3" flexWrap="wrap">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, vehicle reg…"
          bg="rgba(255,255,255,0.05)"
          border="1px solid"
          borderColor="glassBorder"
          color="pearl"
          h="10"
          rounded="md"
          maxW="300px"
          _placeholder={{ color: "rgba(250,250,249,0.3)" }}
          _focus={{ borderColor: "gold" }}
        />
        <HStack gap="1">
          {STATUS_TABS.map((t) => (
            <Button
              key={t.value}
              size="xs"
              variant={statusFilter === t.value ? "solid" : "outline"}
              bg={statusFilter === t.value ? "gold" : "transparent"}
              color={statusFilter === t.value ? "obsidian" : "muted"}
              borderColor="glassBorder"
              rounded="full"
              px="3"
              onClick={() => setStatusFilter(t.value)}
              _hover={{ borderColor: "gold", color: "pearl" }}
            >
              {t.label}
            </Button>
          ))}
        </HStack>
      </HStack>

      <HStack justify="space-between">
        <Text fontFamily="body" color="muted" fontSize="sm">
          {loading ? "Loading…" : `${total.toLocaleString("en-GB")} drivers`}
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
              {["Driver", "Vehicle", "Status", "Acceptance", "Completion", "Rating", "Joined"].map(
                (col) => (
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
                ),
              )}
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
            ) : drivers.length === 0 && !loading ? (
              <Table.Row>
                <Table.Cell
                  colSpan={7}
                  textAlign="center"
                  py="10"
                  color="muted"
                  fontFamily="body"
                  fontSize="sm"
                >
                  No drivers match your search.
                </Table.Cell>
              </Table.Row>
            ) : (
              drivers.map((d) => {
                const perf = d.DriverPerformance;
                const vehicle = d.DriverVehicle;
                return (
                  <Table.Row
                    key={d.User.id}
                    borderBottomColor="rgba(255,255,255,0.04)"
                    _hover={{ bg: "rgba(255,255,255,0.02)" }}
                  >
                    <Table.Cell py="3" px="4">
                      <Stack gap="0.5">
                        <Text fontFamily="body" color="pearl" fontSize="sm" whiteSpace="nowrap">
                          {d.User.name}
                        </Text>
                        <Text fontFamily="body" color="muted" fontSize="xs">
                          {d.User.email}
                        </Text>
                      </Stack>
                    </Table.Cell>
                    <Table.Cell py="3">
                      {vehicle ? (
                        <Stack gap="0.5">
                          <Text
                            fontFamily="body"
                            color="pearl"
                            fontSize="sm"
                            whiteSpace="nowrap"
                          >
                            {vehicle.make} {vehicle.model}
                          </Text>
                          <Text fontFamily="mono" color="gold" fontSize="xs">
                            {vehicle.reg}
                          </Text>
                        </Stack>
                      ) : (
                        <Text fontFamily="body" color="muted" fontSize="xs">
                          —
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell py="3">
                      <DriverStatusDot status={d.status} />
                    </Table.Cell>
                    <Table.Cell py="3">
                      <Text fontFamily="body" color="pearl" fontSize="sm">
                        {pct(perf?.acceptanceRate)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py="3">
                      <Text fontFamily="body" color="pearl" fontSize="sm">
                        {pct(perf?.completionRate)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py="3">
                      <Text fontFamily="body" color="gold" fontSize="sm" fontWeight="500">
                        {stars(perf?.averageRating)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py="3">
                      <Text fontFamily="body" color="muted" fontSize="xs" whiteSpace="nowrap">
                        {formatDate(d.User.createdAt)}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                );
              })
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
