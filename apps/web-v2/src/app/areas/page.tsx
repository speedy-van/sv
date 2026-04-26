import type { Metadata } from "next";
import Link from "next/link";
import { Box, Container, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { FinalCTA } from "@/components/home/FinalCTA";
import { AREAS, REGIONS } from "@/lib/areas-data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Areas We Cover — Premium removals across Scotland",
  description:
    "Speedy Van services Glasgow, Edinburgh, Aberdeen, Dundee, Inverness, the Highlands, the Borders and everywhere in between. Find your area and your fixed price.",
  alternates: { canonical: "/areas" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: AREAS.map((a, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${SITE.url}/areas/${a.slug}`,
    name: `${a.name} removals`,
  })),
};

export default function AreasIndexPage() {
  return (
    <ClientShell>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        eyebrow="Coverage"
        title="Wherever you are in Scotland."
        subtitle="From the Central Belt to the Highlands, the East Coast to the Borders — one team, one standard, one fixed price."
      />
      <Box bg="pearl" py={{ base: "20", md: "28" }}>
        <Container maxW="7xl">
          <Stack gap="14">
            {REGIONS.map((region) => {
              const areasInRegion = AREAS.filter((a) => a.region === region);
              if (!areasInRegion.length) return null;
              return (
                <Stack key={region} gap="6">
                  <Heading
                    as="h2"
                    fontFamily="heading"
                    fontWeight="700"
                    color="ink"
                    letterSpacing="-0.02em"
                    fontSize={{ base: "2xl", md: "3xl" }}
                  >
                    <Box as="span" color="gold" mr="3">—</Box>
                    {region}
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="5">
                    {areasInRegion.map((a) => (
                      <Link key={a.slug} href={`/areas/${a.slug}`} style={{ display: "block", height: "100%" }}>
                        <Box
                          bg="surface"
                          rounded="lg"
                          border="1px solid"
                          borderColor="rgba(0,0,0,0.06)"
                          p={{ base: "5", md: "6" }}
                          h="full"
                          transition="all 250ms"
                          _hover={{ borderColor: "gold", transform: "translateY(-2px)", boxShadow: "md" }}
                        >
                          <Stack gap="2">
                            <Stack direction="row" justify="space-between" align="center">
                              <Heading as="h3" fontFamily="heading" fontWeight="600" color="ink" fontSize="lg">
                                {a.name}
                              </Heading>
                              <Text color="gold" fontFamily="body" fontSize="sm" fontWeight="500">
                                From {a.fromPrice}
                              </Text>
                            </Stack>
                            <Text fontFamily="body" color="muted" fontSize="sm" lineHeight="1.6">
                              {a.intro}
                            </Text>
                            <Text
                              fontFamily="body"
                              color="muted"
                              fontSize="xs"
                              textTransform="uppercase"
                              letterSpacing="0.08em"
                              mt="1"
                            >
                              {a.postcodePrefix} postcodes
                            </Text>
                          </Stack>
                        </Box>
                      </Link>
                    ))}
                  </SimpleGrid>
                </Stack>
              );
            })}
          </Stack>
        </Container>
      </Box>
      <FinalCTA />
    </ClientShell>
  );
}
