import type { Metadata } from "next";
import Link from "next/link";
import { Box, Button, Container, Heading, Stack, Text } from "@chakra-ui/react";
import { ClientShell } from "@/components/layout/ClientShell";

export const metadata: Metadata = {
  title: "Booking Cancelled",
  robots: { index: false, follow: false },
};

export default function BookingCancelledPage() {
  return (
    <ClientShell>
      <Box bg="obsidian" color="pearl" minH="100vh">
        <Container maxW="2xl" py={{ base: "32", md: "40" }} textAlign="center">
          <Stack gap="6" align="center">
            <Text color="gold" fontFamily="heading" fontSize="sm" letterSpacing="0.32em" textTransform="uppercase">
              Payment Cancelled
            </Text>
            <Heading
              as="h1"
              fontFamily="heading"
              fontWeight="800"
              color="pearl"
              fontSize={{ base: "3xl", md: "4xl" }}
              letterSpacing="-0.03em"
            >
              No charge, no booking.
            </Heading>
            <Text fontFamily="body" color="muted" fontSize="md" maxW="md">
              You can resume your booking any time — your details haven't been saved.
            </Text>
            <Stack direction={{ base: "column", sm: "row" }} gap="3" mt="2">
              <Link href="/book">
                <Button bg="gold" color="obsidian" rounded="full" h="12" px="8" fontWeight="600" _hover={{ bg: "goldSoft" }} boxShadow="goldGlow">
                  Try again
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" borderColor="glassBorder" color="pearl" rounded="full" h="12" px="8" _hover={{ borderColor: "gold" }}>
                  Back to home
                </Button>
              </Link>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </ClientShell>
  );
}
