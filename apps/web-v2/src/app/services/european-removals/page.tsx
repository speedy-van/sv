"use client";

import {
  Box,
  Button,
  Container,
  Field,
  HStack,
  Heading,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  chakra,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FormEvent, useMemo, useState } from "react";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { easeOutExpo, fadeRise, staggerFast, viewportOnce } from "@/lib/motion";
import { SITE } from "@/lib/site";

const MotionDiv = motion.create(chakra.div);

const COUNTRIES: Array<{ code: string; flag: string; name: string }> = [
  { code: "FR", flag: "🇫🇷", name: "France" },
  { code: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "ES", flag: "🇪🇸", name: "Spain" },
  { code: "IT", flag: "🇮🇹", name: "Italy" },
  { code: "NL", flag: "🇳🇱", name: "Netherlands" },
  { code: "BE", flag: "🇧🇪", name: "Belgium" },
  { code: "PT", flag: "🇵🇹", name: "Portugal" },
  { code: "IE", flag: "🇮🇪", name: "Ireland" },
  { code: "AT", flag: "🇦🇹", name: "Austria" },
  { code: "DK", flag: "🇩🇰", name: "Denmark" },
  { code: "SE", flag: "🇸🇪", name: "Sweden" },
  { code: "NO", flag: "🇳🇴", name: "Norway" },
  { code: "FI", flag: "🇫🇮", name: "Finland" },
  { code: "PL", flag: "🇵🇱", name: "Poland" },
  { code: "CZ", flag: "🇨🇿", name: "Czechia" },
  { code: "CH", flag: "🇨🇭", name: "Switzerland" },
  { code: "GR", flag: "🇬🇷", name: "Greece" },
  { code: "HU", flag: "🇭🇺", name: "Hungary" },
  { code: "RO", flag: "🇷🇴", name: "Romania" },
  { code: "LU", flag: "🇱🇺", name: "Luxembourg" },
];

const PRICING_ROWS: Array<{ region: string; example: string; from: string; lead: string }> = [
  { region: "Western Europe", example: "Glasgow → Paris (1-bed)", from: "£1,850", lead: "5–7 days" },
  { region: "Western Europe", example: "Edinburgh → Amsterdam (2-bed)", from: "£2,450", lead: "5–7 days" },
  { region: "Iberia", example: "Glasgow → Madrid (2-bed)", from: "£3,150", lead: "7–10 days" },
  { region: "Iberia", example: "Edinburgh → Lisbon (3-bed)", from: "£3,890", lead: "7–10 days" },
  { region: "Central Europe", example: "Glasgow → Berlin (2-bed)", from: "£2,750", lead: "6–9 days" },
  { region: "Central Europe", example: "Edinburgh → Vienna (3-bed)", from: "£3,450", lead: "7–10 days" },
  { region: "Nordics", example: "Glasgow → Copenhagen (2-bed)", from: "£3,250", lead: "7–10 days" },
  { region: "Mediterranean", example: "Glasgow → Rome (3-bed)", from: "£3,950", lead: "8–12 days" },
];

export default function EuropeanRemovalsPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    fromCity: "",
    toCountry: "FR",
    toCity: "",
    date: "",
    packing: "no",
    notes: "",
  });

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const update = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.email.trim() || !form.fromCity.trim() || !form.toCity.trim()) {
      setError("Please fill the required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/enquiry/european`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
    } catch {
      // Fallback: open mailto
      const subject = encodeURIComponent(`European removal enquiry — ${form.fromCity} → ${form.toCity}`);
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\nFrom: ${form.fromCity}\nTo: ${form.toCity}, ${form.toCountry}\nPreferred date: ${form.date}\nPacking: ${form.packing}\n\nNotes:\n${form.notes}`
      );
      window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ClientShell>
      <PageHero
        eyebrow="International"
        title="European Removals"
        subtitle="Door-to-door moves from Scotland to 20+ European countries — fully insured, customs-handled, fixed price."
      />

      {/* Country flags grid */}
      <Box bg="pearl" py={{ base: "16", md: "24" }}>
        <Container maxW="6xl">
          <MotionDiv
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={fadeRise}
          >
            <Stack gap="3" mb="10" textAlign="center">
              <Text
                color="gold"
                fontFamily="heading"
                fontSize="xs"
                letterSpacing="0.32em"
                textTransform="uppercase"
                fontWeight="500"
              >
                Where We Move To
              </Text>
              <Heading
                as="h2"
                fontFamily="heading"
                fontWeight="700"
                color="ink"
                fontSize={{ base: "3xl", md: "4xl" }}
                letterSpacing="-0.02em"
              >
                20 countries. One trusted crew.
              </Heading>
            </Stack>
          </MotionDiv>

          <MotionDiv
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={staggerFast}
          >
            <SimpleGrid columns={{ base: 3, sm: 4, md: 5 }} gap={{ base: "3", md: "4" }}>
              {COUNTRIES.map((c) => (
                <MotionDiv key={c.code} variants={fadeRise}>
                  <Box
                    bg="surface"
                    border="1px solid"
                    borderColor="rgba(0,0,0,0.06)"
                    rounded="lg"
                    p={{ base: "4", md: "5" }}
                    textAlign="center"
                    transition="all 200ms"
                    _hover={{ borderColor: "gold", transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(212,175,55,0.18)" }}
                  >
                    <Text fontSize={{ base: "3xl", md: "4xl" }} mb="1.5" lineHeight="1">
                      {c.flag}
                    </Text>
                    <Text fontFamily="body" color="ink" fontSize="xs" fontWeight="500">
                      {c.name}
                    </Text>
                  </Box>
                </MotionDiv>
              ))}
            </SimpleGrid>
          </MotionDiv>
        </Container>
      </Box>

      {/* Indicative pricing */}
      <Box bg="obsidian" color="pearl" py={{ base: "16", md: "24" }}>
        <Container maxW="5xl">
          <Stack gap="3" mb="10" textAlign="center">
            <Text color="gold" fontFamily="heading" fontSize="xs" letterSpacing="0.32em" textTransform="uppercase" fontWeight="500">
              Indicative Pricing
            </Text>
            <Heading
              as="h2"
              fontFamily="heading"
              fontWeight="700"
              color="pearl"
              fontSize={{ base: "3xl", md: "4xl" }}
              letterSpacing="-0.02em"
            >
              Honest numbers. No surprises.
            </Heading>
            <Text fontFamily="body" color="muted" fontSize="sm" maxW="xl" mx="auto">
              Final price depends on access, lift, packing and exact distance. Every enquiry gets a written fixed quote within 24 hours.
            </Text>
          </Stack>

          <Box bg="glass" border="1px solid" borderColor="glassBorder" rounded="xl" overflow="hidden" backdropFilter="blur(16px)" style={{ WebkitBackdropFilter: "blur(16px)" }}>
            <Box overflowX="auto">
              <chakra.table width="100%" style={{ borderCollapse: "collapse" }}>
                <chakra.thead bg="rgba(255,255,255,0.04)">
                  <chakra.tr>
                    {["Region", "Example route", "From", "Door-to-door"].map((h) => (
                      <chakra.th
                        key={h}
                        textAlign="left"
                        px={{ base: "4", md: "6" }}
                        py="4"
                        color="gold"
                        fontFamily="heading"
                        fontSize="xs"
                        letterSpacing="0.16em"
                        textTransform="uppercase"
                        fontWeight="600"
                      >
                        {h}
                      </chakra.th>
                    ))}
                  </chakra.tr>
                </chakra.thead>
                <chakra.tbody>
                  {PRICING_ROWS.map((r, i) => (
                    <chakra.tr
                      key={r.example}
                      borderTop="1px solid"
                      borderColor={i === 0 ? "transparent" : "rgba(255,255,255,0.06)"}
                    >
                      <chakra.td px={{ base: "4", md: "6" }} py="4" fontFamily="body" color="muted" fontSize="sm">
                        {r.region}
                      </chakra.td>
                      <chakra.td px={{ base: "4", md: "6" }} py="4" fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                        {r.example}
                      </chakra.td>
                      <chakra.td px={{ base: "4", md: "6" }} py="4" fontFamily="heading" color="gold" fontSize="md" fontWeight="700">
                        {r.from}
                      </chakra.td>
                      <chakra.td px={{ base: "4", md: "6" }} py="4" fontFamily="body" color="muted" fontSize="sm">
                        {r.lead}
                      </chakra.td>
                    </chakra.tr>
                  ))}
                </chakra.tbody>
              </chakra.table>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Enquiry form */}
      <Box bg="pearl" py={{ base: "16", md: "24" }}>
        <Container maxW="2xl">
          <MotionDiv initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOutExpo }} viewport={{ once: true }}>
            <Box
              bg="obsidian"
              color="pearl"
              rounded="xl"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              p={{ base: "6", md: "10" }}
              boxShadow="0 24px 60px rgba(9,9,11,0.18)"
            >
              {submitted ? (
                <Stack gap="4" textAlign="center" py="8">
                  <Box
                    w="64px"
                    h="64px"
                    rounded="full"
                    bg="rgba(212,175,55,0.15)"
                    border="2px solid"
                    borderColor="gold"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                    color="gold"
                    boxShadow="goldGlow"
                    mx="auto"
                  >
                    ✓
                  </Box>
                  <Heading as="h3" fontFamily="heading" fontWeight="700" color="pearl" fontSize="2xl" letterSpacing="-0.02em">
                    Enquiry received.
                  </Heading>
                  <Text fontFamily="body" color="muted" fontSize="sm" maxW="md" mx="auto">
                    A senior coordinator will be in touch within 24 hours with a written, fixed quote.
                  </Text>
                </Stack>
              ) : (
                <Stack as="form" onSubmit={onSubmit} gap="5">
                  <Stack gap="1.5">
                    <Text color="gold" fontFamily="heading" fontSize="xs" letterSpacing="0.32em" textTransform="uppercase" fontWeight="500">
                      Free Enquiry
                    </Text>
                    <Heading as="h2" fontFamily="heading" fontWeight="700" color="pearl" fontSize="2xl" letterSpacing="-0.02em">
                      Tell us about your move.
                    </Heading>
                  </Stack>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                    <FormField label="Your name *">
                      <StyledInput value={form.name} onChange={(v) => update("name", v)} placeholder="Full name" />
                    </FormField>
                    <FormField label="Email *">
                      <StyledInput type="email" value={form.email} onChange={(v) => update("email", v)} placeholder="you@example.com" />
                    </FormField>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                    <FormField label="Phone">
                      <StyledInput type="tel" value={form.phone} onChange={(v) => update("phone", v)} placeholder="07…" />
                    </FormField>
                    <FormField label="Preferred date">
                      <Input
                        type="date"
                        min={minDate}
                        value={form.date}
                        onChange={(e) => update("date", e.target.value)}
                        bg="rgba(255,255,255,0.06)"
                        border="1px solid"
                        borderColor="glassBorder"
                        color="pearl"
                        h="12"
                        rounded="md"
                        _focus={{ borderColor: "gold" }}
                        css={{ colorScheme: "dark" }}
                      />
                    </FormField>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                    <FormField label="From (city) *">
                      <StyledInput value={form.fromCity} onChange={(v) => update("fromCity", v)} placeholder="e.g. Glasgow" />
                    </FormField>
                    <FormField label="To (country) *">
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={form.toCountry}
                          onChange={(e) => update("toCountry", e.target.value)}
                          bg="rgba(255,255,255,0.06)"
                          border="1px solid"
                          borderColor="glassBorder"
                          color="pearl"
                          h="12"
                          rounded="md"
                          _focus={{ borderColor: "gold" }}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code} style={{ background: "#09090B" }}>
                              {c.flag} {c.name}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator color="gold" />
                      </NativeSelect.Root>
                    </FormField>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                    <FormField label="To (city) *">
                      <StyledInput value={form.toCity} onChange={(v) => update("toCity", v)} placeholder="e.g. Paris" />
                    </FormField>
                    <FormField label="Packing service">
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={form.packing}
                          onChange={(e) => update("packing", e.target.value)}
                          bg="rgba(255,255,255,0.06)"
                          border="1px solid"
                          borderColor="glassBorder"
                          color="pearl"
                          h="12"
                          rounded="md"
                          _focus={{ borderColor: "gold" }}
                        >
                          <option value="no" style={{ background: "#09090B" }}>I&apos;ll pack myself</option>
                          <option value="partial" style={{ background: "#09090B" }}>Partial packing</option>
                          <option value="full" style={{ background: "#09090B" }}>Full packing</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator color="gold" />
                      </NativeSelect.Root>
                    </FormField>
                  </SimpleGrid>

                  <FormField label="Notes (size of move, fragile items, access)">
                    <Textarea
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      placeholder="Approx volume, special items, lift access, parking…"
                      bg="rgba(255,255,255,0.06)"
                      border="1px solid"
                      borderColor="glassBorder"
                      color="pearl"
                      rounded="md"
                      rows={4}
                      _placeholder={{ color: "rgba(250,250,249,0.35)" }}
                      _focus={{ borderColor: "gold" }}
                    />
                  </FormField>

                  {error && (
                    <Box bg="rgba(220,38,38,0.1)" border="1px solid" borderColor="crimson" rounded="md" px="4" py="3">
                      <Text fontFamily="body" color="crimson" fontSize="sm">{error}</Text>
                    </Box>
                  )}

                  <HStack justify="space-between" pt="2">
                    <Text fontFamily="body" color="muted" fontSize="xs">
                      We reply within 24h.
                    </Text>
                    <Button
                      type="submit"
                      bg="gold"
                      color="obsidian"
                      rounded="full"
                      h="12"
                      px="8"
                      fontWeight="600"
                      boxShadow="goldGlow"
                      _hover={{ bg: "goldSoft" }}
                      loading={submitting}
                      loadingText="Sending…"
                    >
                      Request quote →
                    </Button>
                  </HStack>
                </Stack>
              )}
            </Box>
          </MotionDiv>
        </Container>
      </Box>
    </ClientShell>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Field.Root>
      <Field.Label color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
        {label}
      </Field.Label>
      {children}
    </Field.Root>
  );
}

function StyledInput({
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      bg="rgba(255,255,255,0.06)"
      border="1px solid"
      borderColor={value ? "gold" : "glassBorder"}
      color="pearl"
      h="12"
      rounded="md"
      _placeholder={{ color: "rgba(250,250,249,0.35)" }}
      _focus={{ borderColor: "gold" }}
    />
  );
}
