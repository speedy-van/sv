import type { Metadata } from "next";
import { Box, Container, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { FinalCTA } from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "About Us — Premium removals, built in Scotland",
  description:
    "Speedy Van is a Scottish removals company built around one idea: moves should feel premium, predictable, and personal. Meet the team behind the service.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Transparency",
    body: "Fixed prices, clear timelines, and the same answer whether you ask once or three times.",
  },
  {
    title: "Craftsmanship",
    body: "Trained crews, blanket-wrapped furniture, and the same care for a single armchair as a six-bedroom house.",
  },
  {
    title: "Respect for time",
    body: "On time, every time. We pick a slot together — and we keep it.",
  },
  {
    title: "Local pride",
    body: "Scottish-owned, Scotland-served. We know the closes, the cobbles, and the M8 at five o'clock.",
  },
];

export default function AboutPage() {
  return (
    <ClientShell>
      <PageHero
        eyebrow="About Us"
        title="A higher standard for moving."
        subtitle="We started Speedy Van because moving in Scotland deserved better tools, better people, and a better experience from quote to keys."
      />
      <Box bg="pearl" py={{ base: "20", md: "28" }}>
        <Container maxW="5xl">
          <Stack gap="16">
            <Stack gap="6" textAlign={{ base: "left", md: "center" }} align={{ base: "flex-start", md: "center" }}>
              <Heading
                as="h2"
                fontFamily="heading"
                fontWeight="700"
                color="ink"
                letterSpacing="-0.02em"
                fontSize={{ base: "3xl", md: "4xl" }}
              >
                Our story
              </Heading>
              <Stack gap="4" maxW="2xl" color="ink" fontFamily="body" fontSize="md" lineHeight="1.8">
                <Text>
                  We grew up moving things — between flats, across cities, in and out of student
                  halls. Every time, the experience felt the same: a vague phone quote, a delayed
                  van, a final invoice that didn't match the first.
                </Text>
                <Text>
                  Speedy Van is our answer. A Scottish removals company built on instant pricing,
                  respectful crews, and software that treats your move like the milestone it is.
                </Text>
                <Text>
                  We're independent, fully insured, and proudly based in Hamilton — serving every
                  corner of Scotland with one consistent standard.
                </Text>
              </Stack>
            </Stack>

            <Stack gap="8">
              <Heading
                as="h2"
                fontFamily="heading"
                fontWeight="700"
                color="ink"
                letterSpacing="-0.02em"
                fontSize={{ base: "2xl", md: "3xl" }}
                textAlign="center"
              >
                What we stand for
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
                {VALUES.map((v) => (
                  <Box
                    key={v.title}
                    bg="surface"
                    rounded="lg"
                    border="1px solid"
                    borderColor="rgba(0,0,0,0.06)"
                    borderLeft="3px solid"
                    borderLeftColor="gold"
                    p={{ base: "6", md: "7" }}
                    boxShadow="sm"
                  >
                    <Stack gap="2">
                      <Heading
                        as="h3"
                        fontFamily="heading"
                        fontWeight="600"
                        color="ink"
                        fontSize="lg"
                      >
                        {v.title}
                      </Heading>
                      <Text fontFamily="body" color="muted" lineHeight="1.7">
                        {v.body}
                      </Text>
                    </Stack>
                  </Box>
                ))}
              </SimpleGrid>
            </Stack>
          </Stack>
        </Container>
      </Box>
      <FinalCTA />
    </ClientShell>
  );
}