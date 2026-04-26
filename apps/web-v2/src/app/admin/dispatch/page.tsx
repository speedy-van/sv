"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HiOutlineMapPin, HiOutlineXMark, HiOutlineCheck } from "react-icons/hi2";
import {
  getBookings,
  getDrivers,
  dispatchDriver,
  type AdminBooking,
  type AdminDriver,
} from "@/lib/admin-api";
import { StatusBadge } from "@/components/admin/StatusBadge";
import Link from "next/link";

// Bookings that need driver attention
const ACTIVE_STATUSES = ["CONFIRMED", "IN_PROGRESS", "PENDING_PAYMENT"];

function DriverPickerModal({
  booking,
  drivers,
  onAssign,
  onClose,
}: {
  booking: AdminBooking;
  drivers: AdminDriver[];
  onAssign: (driverId: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    if (!selected) return;
    setSaving(true);
    await onAssign(selected);
    setSaving(false);
  }

  const available = drivers.filter((d) => d.status === "online" || !d.status);

  return (
    <Box
      position="fixed"
      inset="0"
      zIndex={50}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="rgba(0,0,0,0.7)"
      backdropFilter="blur(4px)"
      onClick={onClose}
    >
      <Box
        bg="#0f0f11"
        border="1px solid"
        borderColor="rgba(255,255,255,0.1)"
        rounded="2xl"
        p="6"
        w="full"
        maxW="480px"
        mx="4"
        onClick={(e) => e.stopPropagation()}
      >
        <Stack gap="5">
          <HStack justify="space-between">
            <Text
              fontFamily="heading"
              fontWeight="700"
              color="pearl"
              fontSize="lg"
              letterSpacing="-0.01em"
            >
              Assign driver
            </Text>
            <Button
              size="sm"
              variant="ghost"
              color="muted"
              onClick={onClose}
              _hover={{ color: "pearl" }}
            >
              <Box as={HiOutlineXMark} fontSize="18px" />
            </Button>
          </HStack>

          <Box
            bg="rgba(255,255,255,0.03)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.07)"
            rounded="lg"
            p="3"
          >
            <Text fontFamily="mono" color="gold" fontSize="xs">
              {booking.reference}
            </Text>
            <Text fontFamily="body" color="pearl" fontSize="sm" mt="0.5">
              {booking.pickupAddress?.postcode} → {booking.dropoffAddress?.postcode}
            </Text>
          </Box>

          <Stack gap="2" maxH="280px" overflowY="auto">
            {available.length === 0 ? (
              <Text fontFamily="body" color="muted" fontSize="sm" py="4" textAlign="center">
                No online drivers available.
              </Text>
            ) : (
              available.map((d) => {
                const name = d.User?.name ?? "Unknown";
                const isSelected = selected === d.User?.id;
                return (
                  <HStack
                    key={d.User?.id}
                    gap="3"
                    px="3"
                    py="2.5"
                    rounded="lg"
                    cursor="pointer"
                    bg={isSelected ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)"}
                    border="1px solid"
                    borderColor={
                      isSelected ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.07)"
                    }
                    onClick={() => setSelected(d.User?.id ?? null)}
                    _hover={{ borderColor: "rgba(212,175,55,0.25)" }}
                  >
                    <Box
                      w="32px"
                      h="32px"
                      rounded="full"
                      bg="rgba(212,175,55,0.15)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Text fontFamily="heading" fontWeight="700" color="gold" fontSize="sm">
                        {name[0]?.toUpperCase() ?? "?"}
                      </Text>
                    </Box>
                    <Stack gap="0" flex="1">
                      <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                        {name}
                      </Text>
                      <Text fontFamily="body" color="muted" fontSize="xs">
                        {d.DriverVehicle?.make} {d.DriverVehicle?.model}
                        {d.DriverVehicle?.reg ? ` · ${d.DriverVehicle.reg}` : ""}
                      </Text>
                    </Stack>
                    {isSelected && (
                      <Box as={HiOutlineCheck} fontSize="16px" color="gold" flexShrink={0} />
                    )}
                  </HStack>
                );
              })
            )}
          </Stack>

          <HStack justify="flex-end" gap="3">
            <Button
              size="sm"
              variant="outline"
              borderColor="glassBorder"
              color="muted"
              rounded="full"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              bg="gold"
              color="obsidian"
              rounded="full"
              px="5"
              fontWeight="600"
              loading={saving}
              disabled={!selected}
              boxShadow={selected ? "goldGlow" : undefined}
              onClick={confirm}
              _hover={{ bg: "goldSoft" }}
            >
              Assign driver
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Box>
  );
}

function JobCard({
  booking,
  onDispatch,
}: {
  booking: AdminBooking;
  onDispatch: (b: AdminBooking) => void;
}) {
  const hasDriver = !!booking.driver;
  return (
    <Box
      bg="rgba(255,255,255,0.03)"
      border="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      rounded="xl"
      p="5"
    >
      <Stack gap="4">
        {/* Header */}
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap="2">
          <Stack gap="0.5">
            <Text fontFamily="mono" color="gold" fontSize="xs" letterSpacing="0.06em">
              {booking.reference}
            </Text>
            <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
              {booking.customer?.name}
            </Text>
          </Stack>
          <StatusBadge status={booking.status} />
        </HStack>

        {/* Route */}
        <Stack gap="1.5">
          <HStack gap="2">
            <Box w="7px" h="7px" rounded="full" bg="emerald" flexShrink={0} />
            <Text fontFamily="body" color="pearl" fontSize="xs">
              {booking.pickupAddress?.line1
                ? `${booking.pickupAddress.line1}, ${booking.pickupAddress.postcode}`
                : booking.pickupAddress?.postcode}
            </Text>
          </HStack>
          <Box ml="3" w="1px" h="3" bg="rgba(255,255,255,0.12)" />
          <HStack gap="2">
            <Box w="7px" h="7px" rounded="full" bg="gold" flexShrink={0} />
            <Text fontFamily="body" color="muted" fontSize="xs">
              {booking.dropoffAddress?.line1
                ? `${booking.dropoffAddress.line1}, ${booking.dropoffAddress.postcode}`
                : booking.dropoffAddress?.postcode}
            </Text>
          </HStack>
        </Stack>

        {/* Driver row */}
        <HStack
          justify="space-between"
          align="center"
          pt="3"
          borderTop="1px solid"
          borderTopColor="rgba(255,255,255,0.06)"
          flexWrap="wrap"
          gap="2"
        >
          {hasDriver ? (
            <HStack gap="2">
              <Box
                w="7"
                h="7"
                rounded="full"
                bg="rgba(5,150,105,0.15)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontFamily="heading" color="emerald" fontSize="xs" fontWeight="700">
                  {booking.driver?.User?.name?.[0]?.toUpperCase() ?? "D"}
                </Text>
              </Box>
              <Text fontFamily="body" color="pearl" fontSize="sm">
                {booking.driver?.User?.name}
              </Text>
            </HStack>
          ) : (
            <Text fontFamily="body" color="muted" fontSize="xs">
              No driver assigned
            </Text>
          )}

          <HStack gap="2">
            {booking.status === "IN_PROGRESS" && (
              <Link href={`/booking/track/${booking.reference}`} target="_blank">
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="rgba(212,175,55,0.3)"
                  color="gold"
                  rounded="full"
                  px="3"
                  _hover={{ bg: "rgba(212,175,55,0.08)" }}
                >
                  <Box as={HiOutlineMapPin} fontSize="12px" mr="1" />
                  Track
                </Button>
              </Link>
            )}
            <Button
              size="xs"
              variant="outline"
              borderColor="glassBorder"
              color={hasDriver ? "muted" : "pearl"}
              rounded="full"
              px="3"
              _hover={{ borderColor: "gold", color: "gold" }}
              onClick={() => onDispatch(booking)}
            >
              {hasDriver ? "Reassign" : "Assign driver"}
            </Button>
          </HStack>
        </HStack>
      </Stack>
    </Box>
  );
}

export default function AdminDispatchPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispatchTarget, setDispatchTarget] = useState<AdminBooking | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => {
    Promise.all([
      getBookings({ limit: 50 }),
      getDrivers({ limit: 100 } as Parameters<typeof getDrivers>[0]),
    ])
      .then(([bRes, dRes]) => {
        const active = (bRes.orders ?? []).filter((b) =>
          ACTIVE_STATUSES.includes(b.status),
        );
        setBookings(active);
        setDrivers(dRes.drivers ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load dispatch data.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    refreshRef.current = setInterval(load, 30_000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [load]);

  async function handleAssign(driverId: string) {
    if (!dispatchTarget) return;
    try {
      await dispatchDriver(dispatchTarget.id, driverId);
      setDispatchTarget(null);
      load();
    } catch {
      // keep modal open so user can retry
    }
  }

  const STATUS_TABS = [
    { key: "ALL", label: "All active" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "IN_PROGRESS", label: "In progress" },
    { key: "PENDING_PAYMENT", label: "Pending" },
  ];

  const visible =
    statusFilter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  const inProgress = bookings.filter((b) => b.status === "IN_PROGRESS").length;
  const unassigned = bookings.filter((b) => !b.driver).length;

  return (
    <>
      {/* Assign-driver modal */}
      {dispatchTarget && (
        <DriverPickerModal
          booking={dispatchTarget}
          drivers={drivers}
          onAssign={handleAssign}
          onClose={() => setDispatchTarget(null)}
        />
      )}

      <Stack gap={{ base: "6", md: "8" }}>
        {/* KPI strip */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap="3">
          {[
            { label: "Active jobs", value: bookings.length },
            { label: "In progress", value: inProgress, color: "emerald" },
            { label: "Unassigned", value: unassigned, color: unassigned > 0 ? "crimson" : "pearl" },
            { label: "Online drivers", value: drivers.filter((d) => d.status === "online").length, color: "gold" },
          ].map(({ label, value, color = "pearl" }) => (
            <Box
              key={label}
              bg="rgba(255,255,255,0.04)"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              rounded="xl"
              p="4"
            >
              <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
                {label}
              </Text>
              <Text fontFamily="heading" fontWeight="700" color={color} fontSize="2xl" mt="1">
                {value}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        {/* Status filter tabs */}
        <HStack gap="1" flexWrap="wrap" justify="space-between">
          <HStack gap="1" flexWrap="wrap">
            {STATUS_TABS.map((t) => (
              <Button
                key={t.key}
                size="sm"
                variant={statusFilter === t.key ? "solid" : "outline"}
                bg={statusFilter === t.key ? "gold" : "transparent"}
                color={statusFilter === t.key ? "obsidian" : "muted"}
                borderColor="glassBorder"
                rounded="full"
                px="4"
                onClick={() => setStatusFilter(t.key)}
                _hover={{ borderColor: "gold", color: "pearl" }}
              >
                {t.label}
              </Button>
            ))}
          </HStack>
          <Button
            size="sm"
            variant="outline"
            borderColor="glassBorder"
            color="muted"
            rounded="full"
            onClick={load}
            _hover={{ borderColor: "gold", color: "pearl" }}
          >
            Refresh
          </Button>
        </HStack>

        {/* Job grid */}
        {loading ? (
          <Box display="flex" justifyContent="center" py="16">
            <Spinner color="gold" size="lg" borderWidth="3px" />
          </Box>
        ) : error ? (
          <Stack align="center" py="16" gap="4">
            <Text fontFamily="body" color="crimson" fontSize="sm">
              {error}
            </Text>
            <Button size="sm" variant="outline" borderColor="glassBorder" color="pearl" onClick={load}>
              Retry
            </Button>
          </Stack>
        ) : visible.length === 0 ? (
          <Box
            bg="rgba(255,255,255,0.03)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.07)"
            rounded="xl"
            p="12"
            textAlign="center"
          >
            <Text fontFamily="body" color="muted" fontSize="sm">
              No active jobs right now.
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="4">
            {visible.map((b) => (
              <JobCard key={b.id} booking={b} onDispatch={setDispatchTarget} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </>
  );
}
