"use client";

import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  trend?: { value: number; positive?: boolean };
}

export function StatCard({ label, value, sub, icon, trend }: StatCardProps) {
  return (
    <Box
      bg="rgba(255,255,255,0.04)"
      border="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      rounded="xl"
      p={{ base: "5", md: "6" }}
    >
      <Stack gap="3">
        <HStack justify="space-between" align="flex-start">
          <Text
            fontFamily="body"
            color="muted"
            fontSize="xs"
            fontWeight="500"
            letterSpacing="0.06em"
            textTransform="uppercase"
          >
            {label}
          </Text>
          {icon && (
            <Box
              color="gold"
              opacity={0.7}
              fontSize="lg"
            >
              {icon}
            </Box>
          )}
        </HStack>

        <Text
          fontFamily="heading"
          fontWeight="800"
          color="pearl"
          fontSize={{ base: "3xl", md: "4xl" }}
          letterSpacing="-0.02em"
          lineHeight="1"
        >
          {value}
        </Text>

        <HStack gap="2" align="center">
          {trend !== undefined && (
            <Text
              fontFamily="body"
              fontSize="xs"
              fontWeight="600"
              color={
                trend.positive !== false && trend.value >= 0 ? "emerald" : "crimson"
              }
            >
              {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}%
            </Text>
          )}
          {sub && (
            <Text fontFamily="body" color="muted" fontSize="xs">
              {sub}
            </Text>
          )}
        </HStack>
      </Stack>
    </Box>
  );
}
