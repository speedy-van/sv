import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Box, Button, Container, Heading, SimpleGrid, Stack, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { FinalCTA } from "@/components/home/FinalCTA";
import { FAQ } from "@/components/home/FAQ";
import { AREAS, getArea } from "@/lib/areas-data";
import { SERVICES } from "@/lib/services-data";
import { SITE } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return AREAS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) return { title: "Area not found" };
  return {
    title: `Removals in ${area.name} — From ${area.fromPrice}`,
    description: `Premium removals and man-and-van services in ${area.name} (${area.postcodePrefix}). Fixed pricing from ${area.fromPrice}. ${area.intro}`,
    alternates: { canonical: `/areas/${area.slug}` },
    openGraph: {
      title: `${area.name} Removals — Speedy Van`,
      description: area.intro,
      url: `${SITE.url}/areas/${area.slug}`,
      type: "website",
    },
  };
}

export default async function AreaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MovingCompany",
    name: `${SITE.name} — ${area.name}`,
    url: `${SITE.url}/areas/${area.slug}`,
    telephone: SITE.phone.display,
    priceRange: `${area.fromPrice}+`,
    areaServed: {
      "@type": "City",
      name: area.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: area.name,
        addressRegion: area.region,
        postalCode: area.postcodePrefix,
        addressCountry: "GB",
      },
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: area.lat,
      longitude: area.lng,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "1 Barrack Street, Office 2.18",
      addressLocality: "Hamilton",
      postalCode: "ML3 0HS",
      addressCountry: "GB",
    },
  };

  const popularServices = SERVICES.slice(0, 6);
  const otherAreas = AREAS.filter((a) => a.slug !== area.slug && a.region === area.region).slice(0, 4);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Areas", item: `${SITE.url}/areas` },
      { "@type": "ListItem", position: 3, name: area.name, item: `${SITE.url}/areas/${area.slug}` },
    ],
  };

  return (
    <ClientShell>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <PageHero
        eyebrow={`${area.region} · From ${area.fromPrice}`}
        title={`Removals in ${area.name}`}
        subtitle={area.intro}
      />

      <Box bg="pearl" py={{ base: "16", md: "24" }}>
        <Container maxW="6xl">
          <SimpleGrid columns={{ base: 1, lg: 12 }} gap={{ base: "10", lg: "16" }}>
            <Box gridColumn={{ lg: "span 7" }}>
              <Stack gap="6">
                {area.paragraphs.map((p, i) => (
                  <Text
                    key={i}
                    fontFamily="body"
                    color="ink"
                    fontSize={{ base: "md", md: "lg" }}
                    lineHeight="1.8"
                  >
                    {p}
                  </Text>
                ))}

                <Stack gap="4" mt="6">
                  <Heading as="h2" fontFamily="heading" fontWeight="700" color="ink" fontSize="xl">
                    Neighbourhoods we cover
                  </Heading>
                  <Wrap gap="2">
                    {area.neighborhoods.map((n) => (
                      <WrapItem key={n}>
                        <Box
                          px="3.5"
                          py="1.5"
                          rounded="full"
                          bg="surface"
                          border="1px solid"
                          borderColor="rgba(0,0,0,0.08)"
                          fontFamily="body"
                          fontSize="sm"
                          color="ink"
                        >
                          {n}
                        </Box>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Stack>

                <Stack gap="4" mt="6">
                  <Heading as="h2" fontFamily="heading" fontWeight="700" color="ink" fontSize="xl">
                    Popular routes
                  </Heading>
                  <Stack gap="2">
                    {area.popularRoutes.map((r) => (
                      <Box
                        key={r}
                        bg="surface"
                        border="1px solid"
                        borderColor="rgba(0,0,0,0.06)"
                        rounded="md"
                        px="4"
                        py="3"
                        fontFamily="body"
                        color="ink"
                        fontSize="sm"
                      >
                        <Box as="span" color="gold" mr="2">→</Box>
                        {r}
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            </Box>

            <Box gridColumn={{ lg: "span 5" }}>
              <Box
                bg="surface"
                rounded="lg"
                border="1px solid"
                borderColor="rgba(0,0,0,0.08)"
                borderTop="3px solid"
                borderTopColor="gold"
                p={{ base: "6", md: "7" }}
                boxShadow="md"
                position={{ lg: "sticky" }}
                top={{ lg: "100px" }}
              >
                <Stack gap="5">
                  <Stack gap="1">
                    <Text
                      color="gold"
                      fontFamily="heading"
                      fontWeight="500"
                      fontSize="xs"
                      letterSpacing="0.24em"
                      textTransform="uppercase"
                    >
                      Pricing in {area.name}
                    </Text>
                    <Heading as="h2" fontFamily="heading" fontWeight="700" color="ink" fontSize="2xl">
                      From {area.fromPrice}
                    </Heading>
                    <Text fontFamily="body" color="muted" fontSize="sm">
                      Fixed quote · {area.postcodePrefix} postcodes · {area.region}
                    </Text>
                  </Stack>

                  <Stack gap="3">
                    <Text fontFamily="heading" fontWeight="600" color="ink" fontSize="md">
                      Services in {area.name}
                    </Text>
                    <Stack gap="1.5">
                      {popularServices.map((s) => (
                        <Link key={s.slug} href={`/services/${s.slug}`}>
                          <Text
                            fontFamily="body"
                            color="ink"
                            fontSize="sm"
                            _hover={{ color: "gold" }}
                            transition="color 200ms"
                          >
                            <Box as="span" color="gold" mr="2">·</Box>
                            {s.title}
                          </Text>
                        </Link>
                      ))}
                    </Stack>
                  </Stack>

                  <Link href="/book">
                    <Button
                      w="full"
                      bg="gold"
                      color="obsidian"
                      rounded="full"
                      h="12"
                      fontFamily="body"
                      fontWeight="600"
                      _hover={{ bg: "goldSoft" }}
                      boxShadow="goldGlow"
                    >
                      Book in {area.name}
                    </Button>
                  </Link>

                  <Link href={SITE.phone.href}>
                    <Button
                      w="full"
                      variant="outline"
                      borderColor="ink"
                      color="ink"
                      rounded="full"
                      h="12"
                      fontFamily="body"
                      fontWeight="500"
                      _hover={{ bg: "ink", color: "pearl" }}
                    >
                      Call {SITE.phone.display}
                    </Button>
                  </Link>
                </Stack>
              </Box>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {otherAreas.length > 0 && (
        <Box bg="surface" py={{ base: "16", md: "20" }}>
          <Container maxW="6xl">
            <Stack gap="8">
              <Heading
                as="h2"
                fontFamily="heading"
                fontWeight="700"
                color="ink"
                fontSize={{ base: "2xl", md: "3xl" }}
                letterSpacing="-0.02em"
              >
                Other areas in {area.region}
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="5">
                {otherAreas.map((a) => (
                  <Link key={a.slug} href={`/areas/${a.slug}`}>
                    <Box
                      bg="pearl"
                      rounded="lg"
                      border="1px solid"
                      borderColor="rgba(0,0,0,0.06)"
                      p="5"
                      transition="all 250ms"
                      _hover={{ borderColor: "gold", transform: "translateY(-2px)" }}
                    >
                      <Stack gap="2">
                        <Text color="gold" fontFamily="body" fontSize="xs" fontWeight="500">
                          From {a.fromPrice}
                        </Text>
                        <Text fontFamily="heading" fontWeight="600" color="ink" fontSize="md">
                          {a.name}
                        </Text>
                      </Stack>
                    </Box>
                  </Link>
                ))}
              </SimpleGrid>
            </Stack>
          </Container>
        </Box>
      )}

      <FAQ />
      <FinalCTA />
    </ClientShell>
  );
}
