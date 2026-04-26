"use client";

import { Box, HStack, Stack, Text } from "@chakra-ui/react";

interface BarDatum {
  label: string;
  value: number;
}

interface MiniBarChartProps {
  data: BarDatum[];
  h?: string | number;
  color?: string;
}

export function MiniBarChart({ data, h = "120px", color = "#D4AF37" }: MiniBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <HStack align="flex-end" gap="2" h={h} w="full">
      {data.map((d) => {
        const pct = Math.max((d.value / max) * 100, d.value > 0 ? 6 : 0);
        return (
          <Stack key={d.label} align="center" gap="1.5" flex="1" h="full" justify="flex-end">
            <Box
              w="full"
              rounded="sm"
              bg={color}
              opacity={0.75}
              style={{ height: `${pct}%`, transition: "height 600ms cubic-bezier(0.16,1,0.3,1)" }}
            />
            <Text
              fontFamily="body"
              color="muted"
              fontSize="9px"
              textAlign="center"
              lineHeight="1.3"
            >
              {d.label}
            </Text>
          </Stack>
        );
      })}
    </HStack>
  );
}
