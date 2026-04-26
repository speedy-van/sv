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
import { HiOutlineStar } from "react-icons/hi2";
import { getDriverProfile, type DriverProfile } from "@/lib/driver-api";

function StarRow({ rating }: { rating: number }) {
  return (
    <HStack gap="1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Box
          key={n}
          as={HiOutlineStar}
          fontSize="18px"
          color={n <= Math.round(rating) ? "gold" : "rgba(255,255,255,0.15)"}
        />
      ))}
      <Text fontFamily="body" color="muted" fontSize="sm" ml="1">
        {(rating ?? 0).toFixed(1)}
      </Text>
    </HStack>
  );
}

function MetricCard({
  label,
  value,
  color = "pearl",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Box
      bg="rgba(255,255,255,0.04)"
      border="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      rounded="xl"
      p="4"
    >
      <Text
        fontFamily="body"
        color="muted"
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="0.06em"
      >
        {label}
      </Text>
      <Text
        fontFamily="heading"
        fontWeight="700"
        color={color}
        fontSize="2xl"
        mt="1"
      >
        {value}
      </Text>
    </Box>
  );
}

export default function DriverProfilePage() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDriverProfile()
      .then(setProfile)
      .catch(() => setError("Could not load profile."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py="20">
        <Spinner color="gold" size="xl" borderWidth="3px" />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Stack align="center" py="20" gap="4">
        <Text fontFamily="body" color="crimson" fontSize="sm">
          {error ?? "No profile data."}
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

  return (
    <Stack gap="6" maxW="720px">
      {/* Identity card */}
      <Box
        bg="rgba(255,255,255,0.04)"
        border="1px solid"
        borderColor="rgba(255,255,255,0.1)"
        rounded="2xl"
        p="6"
      >
        <Stack gap="5">
          <HStack gap="4" align="flex-start" flexWrap="wrap">
            {/* Avatar */}
            <Box
              w="16"
              h="16"
              rounded="full"
              bg="rgba(212,175,55,0.15)"
              border="2px solid"
              borderColor="gold"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text
                fontFamily="heading"
                fontWeight="700"
                color="gold"
                fontSize="2xl"
              >
                {(profile.name?.[0] ?? "D").toUpperCase()}
              </Text>
            </Box>

            <Stack gap="1" flex="1">
              <Text
                fontFamily="heading"
                fontWeight="700"
                color="pearl"
                fontSize="xl"
                letterSpacing="-0.01em"
              >
                {profile.name}
              </Text>
              <Text fontFamily="body" color="muted" fontSize="sm">
                {profile.email}
              </Text>
              {profile.basePostcode && (
                <Text fontFamily="body" color="muted" fontSize="xs">
                  Base: {profile.basePostcode}
                </Text>
              )}
            </Stack>

            {/* Status pill */}
            <Box
              px="3"
              py="1"
              rounded="full"
              bg={
                profile.onboardingStatus === "approved"
                  ? "rgba(5,150,105,0.15)"
                  : "rgba(212,175,55,0.12)"
              }
              border="1px solid"
              borderColor={
                profile.onboardingStatus === "approved"
                  ? "rgba(5,150,105,0.35)"
                  : "rgba(212,175,55,0.35)"
              }
            >
              <Text
                fontFamily="body"
                fontSize="xs"
                fontWeight="600"
                color={
                  profile.onboardingStatus === "approved" ? "emerald" : "gold"
                }
                textTransform="capitalize"
              >
                {profile.onboardingStatus ?? "Pending"}
              </Text>
            </Box>
          </HStack>

          {/* Vehicle + rating */}
          <HStack
            justify="space-between"
            flexWrap="wrap"
            gap="3"
            pt="4"
            borderTop="1px solid"
            borderColor="rgba(255,255,255,0.07)"
          >
            <Stack gap="0.5">
              <Text
                fontFamily="body"
                color="muted"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.06em"
              >
                Vehicle
              </Text>
              <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                {profile.vehicleType ?? "Not set"}
              </Text>
            </Stack>
            <Stack gap="0.5">
              <Text
                fontFamily="body"
                color="muted"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.06em"
              >
                Rating
              </Text>
              <StarRow rating={profile.rating ?? 0} />
            </Stack>
          </HStack>
        </Stack>
      </Box>

      {/* Performance metrics */}
      {profile.performance && (
        <Stack gap="3">
          <Text
            fontFamily="body"
            color="muted"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.06em"
          >
            Performance
          </Text>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap="3">
            <MetricCard
              label="Acceptance"
              value={`${(profile.performance.acceptanceRate ?? 0).toFixed(0)}%`}
              color="gold"
            />
            <MetricCard
              label="Completion"
              value={`${(profile.performance.completionRate ?? 0).toFixed(0)}%`}
              color="emerald"
            />
            <MetricCard
              label="On time"
              value={`${(profile.performance.onTimeRate ?? 0).toFixed(0)}%`}
              color="pearl"
            />
            <MetricCard
              label="Total jobs"
              value={profile.performance.totalJobs ?? 0}
              color="pearl"
            />
          </SimpleGrid>
        </Stack>
      )}
    </Stack>
  );
}
