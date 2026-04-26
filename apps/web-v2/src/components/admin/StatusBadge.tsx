"use client";

import { Box, Text } from "@chakra-ui/react";

const MAP: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: {
    bg: "rgba(113,113,122,0.18)",
    color: "#71717A",
    label: "Draft",
  },
  PENDING_PAYMENT: {
    bg: "rgba(212,175,55,0.15)",
    color: "#D4AF37",
    label: "Pending payment",
  },
  CONFIRMED: {
    bg: "rgba(5,150,105,0.18)",
    color: "#10B981",
    label: "Confirmed",
  },
  IN_PROGRESS: {
    bg: "rgba(59,130,246,0.18)",
    color: "#60A5FA",
    label: "In progress",
  },
  COMPLETED: {
    bg: "rgba(16,185,129,0.18)",
    color: "#34D399",
    label: "Completed",
  },
  CANCELLED: {
    bg: "rgba(220,38,38,0.15)",
    color: "#F87171",
    label: "Cancelled",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? {
    bg: "rgba(255,255,255,0.08)",
    color: "#FAFAF9",
    label: status,
  };
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      gap="1.5"
      px="2.5"
      py="0.5"
      rounded="full"
      bg={s.bg}
      border="1px solid"
      borderColor={s.color + "40"}
    >
      <Box w="5px" h="5px" rounded="full" bg={s.color} flexShrink={0} />
      <Text
        fontFamily="body"
        fontSize="xs"
        fontWeight="500"
        color={s.color}
        lineHeight="1"
      >
        {s.label}
      </Text>
    </Box>
  );
}
