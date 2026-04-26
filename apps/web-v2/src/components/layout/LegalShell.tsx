"use client";

import { Box, Container, Heading, Stack, Text, chakra } from "@chakra-ui/react";
import { ReactNode } from "react";

interface LegalShellProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalShell({ title, lastUpdated, children }: LegalShellProps) {
  return (
    <Box bg="pearl" py={{ base: "12", md: "16" }}>
      <Container maxW="3xl">
        <Stack gap="6" mb="10">
          <Heading
            as="h1"
            fontFamily="heading"
            fontWeight="700"
            color="ink"
            letterSpacing="-0.02em"
            fontSize={{ base: "3xl", md: "4xl" }}
          >
            {title}
          </Heading>
          <Text fontFamily="body" color="muted" fontSize="sm">
            Last updated · {lastUpdated}
          </Text>
        </Stack>
        <chakra.article
          fontFamily="body"
          color="ink"
          fontSize="md"
          lineHeight="1.8"
          css={{
            "& h2": {
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 600,
              fontSize: "1.5rem",
              marginTop: "2.5rem",
              marginBottom: "0.75rem",
              letterSpacing: "-0.01em",
            },
            "& p": { marginBottom: "1rem" },
            "& ul": { marginBottom: "1rem", paddingLeft: "1.25rem" },
            "& li": { marginBottom: "0.4rem" },
            "& a": { color: "#D4AF37", textDecoration: "underline" },
          }}
        >
          {children}
        </chakra.article>
      </Container>
    </Box>
  );
}