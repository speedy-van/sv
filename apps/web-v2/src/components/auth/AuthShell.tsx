"use client";

import {
  Box,
  Button,
  Container,
  Field,
  Heading,
  Input,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode, useState } from "react";
import { ParticleField } from "@/components/home/ParticleField";
import { Logo } from "@/components/ui/Logo";
import { easeOutExpo } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    autoComplete?: string;
    placeholder?: string;
  }>;
  submitLabel: string;
  footer: ReactNode;
  apiUrl: string; // e.g. `${NEXT_PUBLIC_API_URL}/api/auth/callback/credentials`
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  fields,
  submitLabel,
  footer,
  apiUrl,
}: AuthShellProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        body: data,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Authentication failed.");
        setError(text || "Authentication failed.");
        return;
      }
      const back = new URLSearchParams(window.location.search).get("callbackUrl");
      window.location.assign(back || "/");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      minH="100vh"
      bg="obsidian"
      position="relative"
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={{ base: "16", md: "20" }}
    >
      <Box
        position="absolute"
        top="-20%"
        left="50%"
        transform="translateX(-50%)"
        w="80%"
        h="80%"
        bg="radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 60%)"
        pointerEvents="none"
      />
      <ParticleField />
      <Container maxW="md" position="relative" zIndex={1}>
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
        >
          <Stack gap="8" align="center">
            <Logo variant="gold" size="md" href="/" />

            <Stack gap="3" textAlign="center">
              <Text
                color="gold"
                fontFamily="heading"
                fontWeight="500"
                fontSize="xs"
                letterSpacing="0.32em"
                textTransform="uppercase"
              >
                {eyebrow}
              </Text>
              <Heading
                as="h1"
                fontFamily="heading"
                fontWeight="700"
                color="pearl"
                letterSpacing="-0.02em"
                fontSize={{ base: "3xl", md: "4xl" }}
              >
                {title}
              </Heading>
              <Text fontFamily="body" color="muted" fontSize="sm">
                {subtitle}
              </Text>
            </Stack>

            <chakra.form
              onSubmit={handleSubmit}
              w="full"
              bg="glass"
              border="1px solid"
              borderColor="glassBorder"
              backdropFilter="blur(16px)"
              style={{ WebkitBackdropFilter: "blur(16px)" }}
              rounded="xl"
              p={{ base: "6", md: "8" }}
            >
              <Stack gap="5">
                {fields.map((f) => (
                  <Field.Root key={f.name}>
                    <Field.Label
                      color="muted"
                      fontFamily="body"
                      fontSize="xs"
                      fontWeight="500"
                      letterSpacing="0.06em"
                      textTransform="uppercase"
                    >
                      {f.label}
                    </Field.Label>
                    <Input
                      name={f.name}
                      type={f.type}
                      autoComplete={f.autoComplete}
                      placeholder={f.placeholder}
                      required
                      bg="rgba(255,255,255,0.06)"
                      border="1px solid"
                      borderColor="glassBorder"
                      color="pearl"
                      h="12"
                      rounded="md"
                      _placeholder={{ color: "rgba(250,250,249,0.35)" }}
                      _focus={{ borderColor: "gold", boxShadow: "0 0 0 1px #D4AF37" }}
                    />
                  </Field.Root>
                ))}

                {error && (
                  <Text color="crimson" fontFamily="body" fontSize="sm" role="alert">
                    {error}
                  </Text>
                )}

                <Button
                  type="submit"
                  loading={submitting}
                  disabled={submitting}
                  bg="gold"
                  color="obsidian"
                  rounded="full"
                  h="12"
                  fontFamily="body"
                  fontWeight="600"
                  _hover={{ bg: "goldSoft" }}
                  _active={{ transform: "scale(0.98)" }}
                  boxShadow="goldGlow"
                >
                  {submitLabel}
                </Button>
              </Stack>
            </chakra.form>

            <Box color="muted" fontFamily="body" fontSize="sm" textAlign="center">
              {footer}
            </Box>
          </Stack>
        </MotionBox>
      </Container>
    </Box>
  );
}