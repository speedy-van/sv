"use client";

import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { CustomerShell } from "@/components/customer/CustomerShell";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface Profile {
  name?: string;
  email?: string;
  phone?: string;
  defaultAddress?: string;
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/customer/profile`, { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        if (j) setProfile(j);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/customer/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        setMessage({ tone: "error", text: "Could not save changes. Please try again." });
      } else {
        setMessage({ tone: "ok", text: "Saved." });
      }
    } catch {
      setMessage({ tone: "error", text: "Network error — please try again." });
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof Profile>(key: K, value: string) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  return (
    <CustomerShell>
      <Box
        bg="surface"
        border="1px solid"
        borderColor="rgba(9,9,11,0.08)"
        rounded="xl"
        p={{ base: "6", md: "8" }}
        boxShadow="0 8px 24px rgba(9,9,11,0.04)"
      >
        {loading ? (
          <Stack align="center" py="10">
            <Spinner color="gold" />
            <Text fontFamily="body" color="muted" fontSize="sm">
              Loading your profile…
            </Text>
          </Stack>
        ) : (
          <form onSubmit={save}>
            <Stack gap="6">
              <Stack gap="1">
                <Heading fontFamily="heading" fontWeight="700" color="ink" fontSize="xl">
                  Account details
                </Heading>
                <Text fontFamily="body" color="muted" fontSize="sm">
                  Updating your details here syncs to future bookings.
                </Text>
              </Stack>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
                <Field.Root>
                  <Field.Label color="muted" fontFamily="body" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
                    Full name
                  </Field.Label>
                  <Input
                    value={profile.name ?? ""}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Sarah Thompson"
                    bg="pearl"
                    color="ink"
                    borderColor="rgba(9,9,11,0.15)"
                    h="11"
                    rounded="md"
                    _focus={{ borderColor: "gold", boxShadow: "0 0 0 1px #D4AF37" }}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label color="muted" fontFamily="body" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
                    Email
                  </Field.Label>
                  <Input
                    type="email"
                    value={profile.email ?? ""}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@example.com"
                    bg="pearl"
                    color="ink"
                    borderColor="rgba(9,9,11,0.15)"
                    h="11"
                    rounded="md"
                    _focus={{ borderColor: "gold", boxShadow: "0 0 0 1px #D4AF37" }}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label color="muted" fontFamily="body" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
                    Phone
                  </Field.Label>
                  <Input
                    type="tel"
                    value={profile.phone ?? ""}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="07000 000000"
                    bg="pearl"
                    color="ink"
                    borderColor="rgba(9,9,11,0.15)"
                    h="11"
                    rounded="md"
                    _focus={{ borderColor: "gold", boxShadow: "0 0 0 1px #D4AF37" }}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label color="muted" fontFamily="body" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
                    Default address
                  </Field.Label>
                  <Input
                    value={profile.defaultAddress ?? ""}
                    onChange={(e) => update("defaultAddress", e.target.value)}
                    placeholder="House, street, postcode"
                    bg="pearl"
                    color="ink"
                    borderColor="rgba(9,9,11,0.15)"
                    h="11"
                    rounded="md"
                    _focus={{ borderColor: "gold", boxShadow: "0 0 0 1px #D4AF37" }}
                  />
                </Field.Root>
              </SimpleGrid>

              {message && (
                <Box
                  bg={message.tone === "ok" ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.10)"}
                  color={message.tone === "ok" ? "emerald" : "crimson"}
                  rounded="md"
                  p="3"
                  fontFamily="body"
                  fontSize="sm"
                >
                  {message.text}
                </Box>
              )}

              <Stack direction="row" gap="3" justify="flex-end">
                <Button
                  type="submit"
                  bg="gold"
                  color="obsidian"
                  rounded="full"
                  h="11"
                  px="7"
                  fontWeight="600"
                  loading={saving}
                  _hover={{ bg: "goldSoft" }}
                  boxShadow="goldGlow"
                >
                  Save changes
                </Button>
              </Stack>
            </Stack>
          </form>
        )}
      </Box>
    </CustomerShell>
  );
}
