"use client";

import { Box, Field, Input, List, Spinner, Stack, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { getApiBase, type BookingAddress } from "@/lib/booking-types";

interface AddressInputProps {
  label: string;
  value: BookingAddress | null;
  onChange: (addr: BookingAddress | null) => void;
}

// Shape returned by GET /api/address/autocomplete-uk
interface ApiSuggestion {
  id: string;
  displayText: string;
  mainText?: string;
  secondaryText?: string;
  provider: "google" | "mapbox";
  sessionToken?: string;
  // Mapbox suggestions include full data immediately
  fullAddress?: string;
  coordinates?: { lat: number; lng: number };
  components?: {
    houseNumber?: string;
    street?: string;
    city?: string;
    postcode?: string;
    flatNumber?: string;
  };
}

export function AddressInput({ label, value, onChange }: AddressInputProps) {
  const [query, setQuery] = useState(value?.full || "");
  const [suggestions, setSuggestions] = useState<ApiSuggestion[]>([]);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ query });
        if (sessionToken) qs.set("sessionToken", sessionToken);
        const res = await fetch(
          `${getApiBase()}/api/address/autocomplete-uk?${qs}`,
          { credentials: "include" },
        );
        if (!res.ok) { setSuggestions([]); return; }
        const json = await res.json();
        const items: ApiSuggestion[] = json?.data?.suggestions ?? [];
        // Persist session token returned by API (Google Places billing optimisation)
        if (json?.data?.sessionToken) setSessionToken(json.data.sessionToken);
        setSuggestions(items.slice(0, 6));
        setOpen(items.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function pick(s: ApiSuggestion) {
    setOpen(false);
    setQuery(s.displayText);

    // Mapbox suggestions already contain full data — no second request needed
    if (s.provider === "mapbox" && s.components) {
      const c = s.components;
      const line1 = [c.flatNumber, c.houseNumber, c.street].filter(Boolean).join(" ");
      onChange({
        full: s.fullAddress || s.displayText,
        line1: line1 || s.displayText,
        city: c.city || "",
        postcode: c.postcode || "",
        coordinates: s.coordinates,
      });
      return;
    }

    // Google suggestions: resolve with place details POST
    setResolving(true);
    try {
      const res = await fetch(`${getApiBase()}/api/address/autocomplete-uk`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: s.id, sessionToken }),
      });
      if (!res.ok) throw new Error("details failed");
      const json = await res.json();
      const d = json?.data;
      const c = d?.components ?? {};
      const line1 = [c.flatNumber, c.houseNumber, c.street].filter(Boolean).join(" ");
      onChange({
        full: d?.fullAddress || d?.displayText || s.displayText,
        line1: line1 || s.displayText,
        city: c.city || "",
        postcode: c.postcode || "",
        coordinates: d?.coordinates,
      });
      setQuery(d?.fullAddress || d?.displayText || s.displayText);
      // Reset session token after completing a session
      setSessionToken("");
    } catch {
      // Fallback: use what we have from the suggestion
      onChange({
        full: s.displayText,
        line1: s.mainText || s.displayText,
        city: s.secondaryText || "",
        postcode: "",
      });
    } finally {
      setResolving(false);
    }
  }

  return (
    <Field.Root>
      <Field.Label
        color="muted"
        fontFamily="body"
        fontSize="xs"
        fontWeight="500"
        letterSpacing="0.06em"
        textTransform="uppercase"
      >
        {label}
      </Field.Label>
      <Box ref={containerRef} position="relative" w="full">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder="Start typing a postcode or address…"
          bg="rgba(255,255,255,0.06)"
          border="1px solid"
          borderColor={value ? "gold" : "glassBorder"}
          color="pearl"
          h="12"
          rounded="md"
          autoComplete="off"
          _placeholder={{ color: "rgba(250,250,249,0.35)" }}
          _focus={{ borderColor: "gold", boxShadow: "0 0 0 1px #D4AF37" }}
        />
        {(loading || resolving) && (
          <Box position="absolute" right="3" top="3.5">
            <Spinner size="sm" color="gold" />
          </Box>
        )}
        {open && suggestions.length > 0 && (
          <Box
            position="absolute"
            top="calc(100% + 6px)"
            left="0"
            right="0"
            bg="obsidian"
            border="1px solid"
            borderColor="glassBorder"
            rounded="md"
            boxShadow="lg"
            zIndex={20}
            maxH="280px"
            overflowY="auto"
          >
            <List.Root gap="0" variant="plain">
              {suggestions.map((s, i) => (
                <List.Item
                  key={s.id ?? i}
                  px="4"
                  py="3"
                  cursor="pointer"
                  borderBottom={i < suggestions.length - 1 ? "1px solid" : undefined}
                  borderBottomColor="rgba(255,255,255,0.06)"
                  _hover={{ bg: "rgba(212,175,55,0.08)" }}
                  onClick={() => pick(s)}
                >
                  <Stack gap="0.5">
                    <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                      {s.mainText || s.displayText}
                    </Text>
                    {s.secondaryText && (
                      <Text fontFamily="body" color="muted" fontSize="xs">
                        {s.secondaryText}
                      </Text>
                    )}
                  </Stack>
                </List.Item>
              ))}
            </List.Root>
          </Box>
        )}
      </Box>
      {value && (
        <Text fontFamily="body" color="emerald" fontSize="xs" mt="1.5">
          ✓ Confirmed: {value.postcode}
        </Text>
      )}
    </Field.Root>
  );
}
