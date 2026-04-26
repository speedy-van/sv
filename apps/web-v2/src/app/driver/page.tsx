"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import {
  HiOutlineClock,
  HiOutlineCurrencyPound,
  HiOutlineStar,
  HiOutlineTruck,
} from "react-icons/hi2";
import {
  getDriverDashboard,
  postDriverStatus,
  type DriverJob,
  type DriverJobsResponse,
} from "@/lib/driver-api";

function formatGBP(n: number) {
  return `£${(n ?? 0).toFixed(2)}`;
}

function JobCard({ job }: { job: DriverJob }) {
  const isAssigned = job.status === "accepted";
  return (
    <Box
      bg={isAssigned ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.03)"}
      border="1px solid"
      borderColor={isAssigned ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.08)"}
      rounded="xl"
      p="5"
    >
      <Stack gap="4">
        {/* Header */}
        <HStack justify="space-between" align="flex-start">
          <Stack gap="0.5">
            <Text fontFamily="mono" color="gold" fontSize="xs" letterSpacing="0.06em">
              {job.reference}
            </Text>
            <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
              {job.customer}
            </Text>
          </Stack>
          <Box
            px="2.5"
            py="1"
            rounded="full"
            bg={isAssigned ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.06)"}
            borderColor={isAssigned ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"}
            border="1px solid"
          >
            <Text
              fontFamily="body"
              fontSize="xs"
              fontWeight="600"
              color={isAssigned ? "gold" : "muted"}
            >
              {isAssigned ? "Your job" : "Available"}
            </Text>
          </Box>
        </HStack>

        {/* Route */}
        <Stack gap="2">
          <HStack gap="2" align="flex-start">
            <Box
              w="7px"
              h="7px"
              rounded="full"
              bg="emerald"
              mt="1.5"
              flexShrink={0}
            />
            <Text fontFamily="body" color="pearl" fontSize="sm" lineHeight="1.4">
              {job.from}
            </Text>
          </HStack>
          <Box ml="3" w="1px" h="4" bg="rgba(255,255,255,0.15)" />
          <HStack gap="2" align="flex-start">
            <Box
              w="7px"
              h="7px"
              rounded="full"
              bg="gold"
              mt="1.5"
              flexShrink={0}
            />
            <Text fontFamily="body" color="muted" fontSize="sm" lineHeight="1.4">
              {job.to}
            </Text>
          </HStack>
        </Stack>

        {/* Meta row */}
        <HStack gap="4" flexWrap="wrap">
          <HStack gap="1.5">
            <Box as={HiOutlineClock} fontSize="14px" color="muted" />
            <Text fontFamily="body" color="muted" fontSize="xs">
              {job.date} · {job.time}
            </Text>
          </HStack>
          <HStack gap="1.5">
            <Box as={HiOutlineTruck} fontSize="14px" color="muted" />
            <Text fontFamily="body" color="muted" fontSize="xs">
              {job.distance} · {job.duration}
            </Text>
          </HStack>
        </HStack>

        {/* Footer */}
        <HStack justify="space-between" align="center">
          <Text
            fontFamily="heading"
            fontWeight="700"
            color="gold"
            fontSize="xl"
            letterSpacing="-0.01em"
          >
            {formatGBP(job.estimatedEarnings)}
          </Text>
          {isAssigned ? (
            <Link href="/driver/active">
              <Button
                size="sm"
                bg="gold"
                color="obsidian"
                rounded="full"
                px="5"
                fontWeight="600"
                boxShadow="goldGlow"
                _hover={{ bg: "goldSoft" }}
              >
                Start job →
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="outline"
              borderColor="gold"
              color="gold"
              rounded="full"
              px="5"
              _hover={{ bg: "rgba(212,175,55,0.08)" }}
            >
              View details
            </Button>
          )}
        </HStack>
      </Stack>
    </Box>
  );
}

export default function DriverDashboardPage() {
  const [data, setData] = useState<DriverJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<"online" | "offline">("offline");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDriverDashboard()
      .then((d) => {
        setData(d);
        // Infer online status from driver profile if available
        setOnlineStatus(
          (d.driver?.status as "online" | "offline") ?? "offline",
        );
      })
      .catch(() => setError("Could not load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus() {
    const next = onlineStatus === "online" ? "offline" : "online";
    setTogglingStatus(true);
    try {
      await postDriverStatus(next);
      setOnlineStatus(next);
    } catch {
      // ignore
    } finally {
      setTogglingStatus(false);
    }
  }

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
          {error ?? "No data."}
        </Text>
        <Button size="sm" variant="outline" borderColor="glassBorder" color="pearl" onClick={load}>
          Retry
        </Button>
      </Stack>
    );
  }

  const stats = data.statistics;
  const allJobs = [...(data.assignedJobs ?? []), ...(data.availableJobs ?? [])];

  return (
    <Stack gap={{ base: "6", md: "8" }}>
      {/* Online toggle */}
      <HStack
        bg="rgba(255,255,255,0.03)"
        border="1px solid"
        borderColor="rgba(255,255,255,0.07)"
        rounded="xl"
        p="5"
        justify="space-between"
        align="center"
      >
        <Stack gap="0.5">
          <Text fontFamily="heading" fontWeight="700" color="pearl" fontSize="lg">
            You are{" "}
            <chakra.span color={onlineStatus === "online" ? "emerald" : "muted"}>
              {onlineStatus}
            </chakra.span>
          </Text>
          <Text fontFamily="body" color="muted" fontSize="sm">
            {onlineStatus === "online"
              ? "You're visible for new job assignments."
              : "Go online to receive job offers."}
          </Text>
        </Stack>
        <Button
          bg={onlineStatus === "online" ? "rgba(5,150,105,0.15)" : "gold"}
          color={onlineStatus === "online" ? "emerald" : "obsidian"}
          border={onlineStatus === "online" ? "1px solid" : undefined}
          borderColor={onlineStatus === "online" ? "emerald" : undefined}
          rounded="full"
          px="6"
          fontWeight="600"
          loading={togglingStatus}
          onClick={toggleStatus}
          _hover={{
            bg: onlineStatus === "online" ? "rgba(5,150,105,0.25)" : "goldSoft",
          }}
          boxShadow={onlineStatus !== "online" ? "goldGlow" : undefined}
        >
          {onlineStatus === "online" ? "Go offline" : "Go online"}
        </Button>
      </HStack>

      {/* Stats cards */}
      {stats && (
        <SimpleGrid columns={{ base: 2, md: 4 }} gap="3">
          <Box
            bg="rgba(255,255,255,0.04)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            rounded="xl"
            p="4"
          >
            <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
              Today
            </Text>
            <Text fontFamily="heading" fontWeight="700" color="gold" fontSize="2xl" mt="1">
              {formatGBP(stats.todayEarnings)}
            </Text>
          </Box>
          <Box
            bg="rgba(255,255,255,0.04)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            rounded="xl"
            p="4"
          >
            <HStack gap="1" mb="1">
              <Box as={HiOutlineCurrencyPound} fontSize="12px" color="muted" />
              <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
                This week
              </Text>
            </HStack>
            <Text fontFamily="heading" fontWeight="700" color="pearl" fontSize="2xl">
              {formatGBP(stats.weekEarnings)}
            </Text>
          </Box>
          <Box
            bg="rgba(255,255,255,0.04)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            rounded="xl"
            p="4"
          >
            <HStack gap="1" mb="1">
              <Box as={HiOutlineTruck} fontSize="12px" color="muted" />
              <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
                Jobs done
              </Text>
            </HStack>
            <Text fontFamily="heading" fontWeight="700" color="pearl" fontSize="2xl">
              {stats.totalJobs}
            </Text>
          </Box>
          <Box
            bg="rgba(255,255,255,0.04)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            rounded="xl"
            p="4"
          >
            <HStack gap="1" mb="1">
              <Box as={HiOutlineStar} fontSize="12px" color="muted" />
              <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
                Rating
              </Text>
            </HStack>
            <Text fontFamily="heading" fontWeight="700" color="gold" fontSize="2xl">
              {(stats.rating ?? 0).toFixed(1)}
            </Text>
          </Box>
        </SimpleGrid>
      )}

      {/* Jobs */}
      <Stack gap="4">
        <HStack justify="space-between" align="center">
          <Text fontFamily="heading" fontWeight="700" color="pearl" fontSize="lg" letterSpacing="-0.01em">
            {data.assignedJobs?.length ? "Your upcoming jobs" : "Available jobs"}
          </Text>
          <Link href="/driver/jobs">
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

        {allJobs.length === 0 ? (
          <Box
            bg="rgba(255,255,255,0.03)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.07)"
            rounded="xl"
            p="10"
            textAlign="center"
          >
            <Text fontFamily="body" color="muted" fontSize="sm">
              No jobs at the moment.{" "}
              {onlineStatus === "offline" && "Go online to start receiving offers."}
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            {allJobs.slice(0, 4).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Stack>
  );
}
