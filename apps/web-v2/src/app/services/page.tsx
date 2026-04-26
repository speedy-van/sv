import type { Metadata } from "next";
import Link from "next/link";
import { Box, Container, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { FinalCTA } from "@/components/home/FinalCTA";
import { SERVICES } from "@/lib/services-data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Services — Premium removals across Scotland",
  description:
    "Ten focused moving services from Speedy Van: house removals, office relocations, furniture delivery, student moves, piano transport and more. Fixed prices, premium care.",
  alternates: { canonical: "/services" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: SERVICES.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${SITE.url}/services/${s.slug}`,
    name: s.title,
  })),
};

export default function ServicesIndexPage() {
  return (
    <ClientShell>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        eyebrow="Services"
        title="Ten ways to move with us."
        subtitle="From a single sofa to a six-bedroom house, every service is fixed-price, fully insured, and crewed by people we trust."
      />
      <Box bg="pearl" py={{ base: "20", md: "28" }}>
        <Container maxW="7xl">
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
            {SERVICES.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} style={{ display: "block", height: "100%" }}>
                <Box
                  bg="surface"
                  rounded="lg"
                  border="1px solid"
                  borderColor="rgba(0,0,0,0.06)"
                  p={{ base: "6", md: "7" }}
                  h="full"
                  boxShadow="sm"
                  transition="all 250ms"
                  _hover={{
                    borderColor: "gold",
                    transform: "translateY(-4px)",
                    boxShadow: "lg",
                  }}
                >
                  <Stack gap="3" h="full">
                    <Text
                      color="gold"
                      fontFamily="heading"
                      fontWeight="500"
                      fontSize="xs"
                      letterSpacing="0.24em"
                      textTransform="uppercase"
                    >
                      From {s.fromPrice}
                    </Text>
                    <Heading
                      as="h2"
                      fontFamily="heading"
                      fontWeight="700"
                      color="ink"
                      fontSize="xl"
                      letterSpacing="-0.01em"
                    >
                      {s.title}
                    </Heading>
                    <Text fontFamily="body" color="muted" lineHeight="1.6">
                      {s.short}
                    </Text>
                    <Box flex="1" />
                    <Text
                      color="gold"
                      fontFamily="body"
                      fontWeight="500"
                      fontSize="sm"
                      mt="2"
                    >
                      Learn more →
                    </Text>
                  </Stack>
                </Box>
              </Link>
            ))}
          </SimpleGrid>
        </Container>
      </Box>
      <FinalCTA />
    </ClientShell>
  );
}
