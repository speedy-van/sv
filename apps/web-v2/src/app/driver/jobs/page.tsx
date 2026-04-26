"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HiOutlineClock, HiOutlineTruck } from "react-icons/hi2";
import { getDriverJobs, type DriverJob, type DriverJobsResponse } from "@/lib/driver-api";
import Link from "next/link";

const TABS: Array<{ label: string; key: "assigned" | "available" | "all" }> = [
  { label: "All", key: "all" },
  { label: "My jobs", key: "assigned" },
  { label: "Available", key: "available" },
];

function formatGBP(n: number) {
  return `£${(n ?? 0).toFixed(2)}`;
}

function JobRow({ job }: { job: DriverJob }) {
  const isAssigned = job.status === "accepted";
  return (
    <Box
      bg={isAssigned ? "rgba(212,175,55,0.05)" : "rgba(255,255,255,0.03)"}
      border="1px solid"
      borderColor={isAssigned ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.07)"}
      rounded="xl"
      p="5"
    >
      <Stack gap="4">
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap="2">
          <Stack gap="0.5">
            <Text fontFamily="mono" color="gold" fontSize="xs">
              {job.reference}
            </Text>
            <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
              {job.customer}
            </Text>
          </Stack>
          <HStack gap="3" align="center">
            <Text fontFamily="heading" fontWeight="700" color="gold" fontSize="lg">
              {formatGBP(job.estimatedEarnings)}
            </Text>
            {isAssigned ? (
              <Link href="/driver/active">
                <Button
                  size="sm"
                  bg="gold"
                  color="obsidian"
                  rounded="full"
                  px="4"
                  fontWeight="600"
                  boxShadow="goldGlow"
                  _hover={{ bg: "goldSoft" }}
                >
                  Open →
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                variant="outline"
                borderColor="glassBorder"
                color="pearl"
                rounded="full"
                px="4"
                _hover={{ borderColor: "gold", color: "gold" }}
              >
                Details
              </Button>
            )}
          </HStack>
        </HStack>

        <Stack gap="2">
          <HStack gap="2">
            <Box w="7px" h="7px" rounded="full" bg="emerald" flexShrink={0} />
            <Text fontFamily="body" color="pearl" fontSize="sm">
              {job.from}
            </Text>
          </HStack>
          <Box ml="3" w="1px" h="3" bg="rgba(255,255,255,0.12)" />
          <HStack gap="2">
            <Box w="7px" h="7px" rounded="full" bg="gold" flexShrink={0} />
            <Text fontFamily="body" color="muted" fontSize="sm">
              {job.to}
            </Text>
          </HStack>
        </Stack>

        <HStack gap="5" flexWrap="wrap">
          <HStack gap="1.5">
            <Box as={HiOutlineClock} fontSize="13px" color="muted" />
            <Text fontFamily="body" color="muted" fontSize="xs">
              {job.date} · {job.time}
            </Text>
          </HStack>
          <HStack gap="1.5">
            <Box as={HiOutlineTruck} fontSize="13px" color="muted" />
            <Text fontFamily="body" color="muted" fontSize="xs">
              {job.distance} · {job.duration}
            </Text>
          </HStack>
        </HStack>
      </Stack>
    </Box>
  );
}

export default function DriverJobsPage() {
  const [data, setData] = useState<DriverJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"assigned" | "available" | "all">("all");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDriverJobs()
      .then(setData)
      .catch(() => setError("Could not load jobs."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredJobs: DriverJob[] = (() => {
    if (!data) return [];
    if (tab === "assigned") return data.assignedJobs ?? [];
    if (tab === "available") return data.availableJobs ?? [];
    return [...(data.assignedJobs ?? []), ...(data.availableJobs ?? [])];
  })();

  return (
    <Stack gap="6">
      {/* Tabs */}
      <HStack gap="1" flexWrap="wrap">
        {TABS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? "solid" : "outline"}
            bg={tab === t.key ? "gold" : "transparent"}
            color={tab === t.key ? "obsidian" : "muted"}
            borderColor="glassBorder"
            rounded="full"
            px="4"
            onClick={() => setTab(t.key)}
            _hover={{ borderColor: "gold", color: "pearl" }}
          >
            {t.label}
            {t.key === "assigned" && data?.assignedJobs?.length ? (
              <Box
                as="span"
                ml="1.5"
                bg="obsidian"
                color="gold"
                rounded="full"
                fontSize="10px"
                px="1.5"
                fontWeight="700"
              >
                {data.assignedJobs.length}
              </Box>
            ) : null}
          </Button>
        ))}
        <Box flex="1" />
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
      ) : filteredJobs.length === 0 ? (
        <Box
          bg="rgba(255,255,255,0.03)"
          border="1px solid"
          borderColor="rgba(255,255,255,0.07)"
          rounded="xl"
          p="12"
          textAlign="center"
        >
          <Text fontFamily="body" color="muted" fontSize="sm">
            No jobs in this category.
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
          {filteredJobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
