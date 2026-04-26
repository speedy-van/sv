import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Box, Button, Container, Heading, List, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { HiCheck } from "react-icons/hi2";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { FinalCTA } from "@/components/home/FinalCTA";
import { FAQ } from "@/components/home/FAQ";
import { SERVICES, getService } from "@/lib/services-data";
import { SITE } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return { title: "Service not found" };
  return {
    title: `${service.title} in Scotland`,
    description: service.short,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.title} — Speedy Van`,
      description: service.short,
      url: `${SITE.url}/services/${service.slug}`,
      type: "website",
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.title,
    provider: {
      "@type": "MovingCompany",
      name: SITE.name,
      url: SITE.url,
      telephone: SITE.phone.display,
      address: {
        "@type": "PostalAddress",
        streetAddress: "1 Barrack Street, Office 2.18",
        addressLocality: "Hamilton",
        postalCode: "ML3 0HS",
        addressCountry: "GB",
      },
    },
    areaServed: { "@type": "Country", name: "Scotland" },
    description: service.short,
    offers: {
      "@type": "Offer",
      price: service.fromPrice.replace(/[^0-9]/g, ""),
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    },
  };

  const otherServices = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 4);

  return (
    <ClientShell>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero eyebrow={`From ${service.fromPrice}`} title={service.title} subtitle={service.hero} />

      {/* Body section */}
      <Box bg="pearl" py={{ base: "16", md: "24" }}>
        <Container maxW="6xl">
          <SimpleGrid columns={{ base: 1, lg: 12 }} gap={{ base: "10", lg: "16" }}>
            <Box gridColumn={{ lg: "span 7" }}>
              <Stack gap="6">
                {service.paragraphs.map((p, i) => (
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
                      At a glance
                    </Text>
                    <Heading as="h2" fontFamily="heading" fontWeight="700" color="ink" fontSize="2xl">
                      From {service.fromPrice}
                    </Heading>
                  </Stack>

                  <SimpleGrid columns={2} gap="4">
                    <Stack gap="0.5">
                      <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
                        Duration
                      </Text>
                      <Text fontFamily="body" color="ink" fontSize="sm" fontWeight="500">
                        {service.duration}
                      </Text>
                    </Stack>
                    <Stack gap="0.5">
                      <Text fontFamily="body" color="muted" fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
                        Best for
                      </Text>
                      <Text fontFamily="body" color="ink" fontSize="sm" fontWeight="500">
                        {service.bestFor}
                      </Text>
                    </Stack>
                  </SimpleGrid>

                  <Stack gap="3">
                    <Text fontFamily="heading" fontWeight="600" color="ink" fontSize="md">
                      What's included
                    </Text>
                    <List.Root gap="2" variant="plain">
                      {service.highlights.map((h) => (
                        <List.Item key={h} display="flex" gap="3" alignItems="flex-start">
                          <Box color="gold" mt="0.5" flexShrink={0}>
                            <HiCheck size={18} />
                          </Box>
                          <Text fontFamily="body" color="ink" fontSize="sm">
                            {h}
                          </Text>
                        </List.Item>
                      ))}
                    </List.Root>
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
                      Book {service.title}
                    </Button>
                  </Link>
                </Stack>
              </Box>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Related services */}
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
              Other services
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="5">
              {otherServices.map((s) => (
                <Link key={s.slug} href={`/services/${s.slug}`}>
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
                        From {s.fromPrice}
                      </Text>
                      <Text fontFamily="heading" fontWeight="600" color="ink" fontSize="md">
                        {s.title}
                      </Text>
                    </Stack>
                  </Box>
                </Link>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      <FAQ />
      <FinalCTA />
    </ClientShell>
  );
}
