"use client";

import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { HiPhone, HiChatBubbleLeftRight } from "react-icons/hi2";

interface DriverCardProps {
  name?: string;
  phone?: string | null;
}

function shortName(full?: string): string {
  if (!full) return "Your Driver";
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

export function DriverCard({ name, phone }: DriverCardProps) {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <Box
      bg="surface"
      rounded="xl"
      p={{ base: "6", md: "7" }}
      border="1px solid"
      borderColor="rgba(9,9,11,0.08)"
      boxShadow="0 12px 36px rgba(9,9,11,0.06)"
      position="relative"
    >
      <Stack direction={{ base: "column", sm: "row" }} gap="5" align={{ base: "flex-start", sm: "center" }}>
        <Stack direction="row" gap="4" align="center" flex="1">
          <Box
            w="56px"
            h="56px"
            rounded="full"
            bg="gold"
            color="obsidian"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            fontFamily="heading"
            fontWeight="700"
            fontSize="xl"
          >
            🚛
          </Box>
          <Stack gap="0.5">
            <Text
              fontFamily="body"
              color="muted"
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Your Driver
            </Text>
            <Text fontFamily="heading" fontWeight="700" color="ink" fontSize="lg">
              {shortName(name)}
            </Text>
          </Stack>
        </Stack>

        <Stack direction="row" gap="3" w={{ base: "full", sm: "auto" }}>
          {phone ? (
            <Box as="a" {...{ href: `tel:${phone}` }} flex="1">
              <Button
                bg="obsidian"
                color="pearl"
                rounded="full"
                h="11"
                px="5"
                fontWeight="600"
                w="full"
                _hover={{ bg: "ink" }}
              >
                <HiPhone /> Call
              </Button>
            </Box>
          ) : (
            <Button
              bg="obsidian"
              color="pearl"
              rounded="full"
              h="11"
              px="5"
              fontWeight="600"
              opacity={0.5}
              cursor="not-allowed"
              flex={{ base: 1, sm: "initial" }}
            >
              <HiPhone /> Call
            </Button>
          )}
          <Button
            bg="gold"
            color="obsidian"
            rounded="full"
            h="11"
            px="5"
            fontWeight="600"
            _hover={{ bg: "goldSoft" }}
            onClick={() => {
              setToast("Chat coming soon");
              setTimeout(() => setToast(null), 2500);
            }}
            flex={{ base: 1, sm: "initial" }}
          >
            <HiChatBubbleLeftRight /> Message
          </Button>
        </Stack>
      </Stack>
      {toast && (
        <Box
          position="absolute"
          bottom="-12"
          right="0"
          bg="obsidian"
          color="pearl"
          px="4"
          py="2"
          rounded="full"
          fontSize="xs"
          fontFamily="body"
          boxShadow="lg"
        >
          {toast}
        </Box>
      )}
    </Box>
  );
}
