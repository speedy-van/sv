"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import Link from "next/link";

interface LogoProps {
  variant?: "gold" | "obsidian";
  size?: "sm" | "md" | "lg";
  href?: string;
}

const sizes = {
  sm: { dot: "20px", title: "lg" },
  md: { dot: "26px", title: "xl" },
  lg: { dot: "32px", title: "2xl" },
};

export function Logo({ variant = "gold", size = "md", href = "/" }: LogoProps) {
  const s = sizes[size];
  const titleColor = variant === "gold" ? "pearl" : "obsidian";
  const accent = "gold";

  return (
    <Link href={href} aria-label="Speedy Van home" style={{ display: "inline-flex" }}>
      <Flex align="center" gap="3">
        <Box
          w={s.dot}
          h={s.dot}
          rounded="md"
          bg={accent}
          position="relative"
          boxShadow="0 0 0 1px rgba(212,175,55,0.35)"
        >
          <Box
            position="absolute"
            inset="0"
            rounded="md"
            bg="obsidian"
            transform="scale(0.45)"
          />
        </Box>
        <Text
          fontFamily="heading"
          fontWeight="800"
          fontSize={s.title}
          color={titleColor}
          letterSpacing="-0.02em"
          lineHeight="1"
        >
          Speedy<Text as="span" color={accent}>Van</Text>
        </Text>
      </Flex>
    </Link>
  );
}
