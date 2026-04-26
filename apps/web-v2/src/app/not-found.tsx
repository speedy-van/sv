"use client";

import { Box, Button, Container, Heading, Stack, Text, chakra } from "@chakra-ui/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ParticleField } from "@/components/home/ParticleField";
import { easeOutExpo } from "@/lib/motion";

const MotionDiv = motion.create(chakra.div);

export default function NotFound() {
  return (
    <Box bg="obsidian" color="pearl" minH="100vh" position="relative" overflow="hidden">
      <Box
        position="absolute"
        top="-15%"
        left="50%"
        transform="translateX(-50%)"
        w="80%"
        h="80%"
        bg="radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 60%)"
        pointerEvents="none"
      />
      <ParticleField />
      <Container
        maxW="2xl"
        position="relative"
        zIndex={1}
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={{ base: "20", md: "32" }}
      >
        <MotionDiv
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          textAlign="center"
        >
          <Stack gap={{ base: "6", md: "8" }} align="center">
            <Heading
              as="h1"
              fontFamily="heading"
              fontWeight="800"
              color="gold"
              fontSize={{ base: "8xl", md: "9xl" }}
              letterSpacing="-0.04em"
              lineHeight="1"
              textShadow="0 8px 40px rgba(212,175,55,0.35)"
            >
              404
            </Heading>
            <Stack gap="3" align="center">
              <Text
                color="gold"
                fontFamily="heading"
                fontSize="xs"
                letterSpacing="0.32em"
                textTransform="uppercase"
                fontWeight="500"
              >
                Page Not Found
              </Text>
              <Heading
                as="h2"
                fontFamily="heading"
                fontWeight="700"
                color="pearl"
                fontSize={{ base: "2xl", md: "4xl" }}
                letterSpacing="-0.02em"
                maxW="lg"
              >
                That route isn&apos;t on our map.
              </Heading>
              <Text fontFamily="body" color="muted" fontSize={{ base: "md", md: "lg" }} maxW="md" lineHeight="1.7">
                The page you&apos;re looking for has moved, been retired, or never
                existed. Let&apos;s get you back on track.
              </Text>
            </Stack>
            <Stack direction={{ base: "column", sm: "row" }} gap="3" pt="2">
              <Link href="/">
                <Button
                  bg="gold"
                  color="obsidian"
                  rounded="full"
                  h="12"
                  px="8"
                  fontWeight="600"
                  boxShadow="goldGlow"
                  _hover={{ bg: "goldSoft" }}
                >
                  Go Home
                </Button>
              </Link>
              <Link href="/book">
                <Button
                  variant="outline"
                  borderColor="glassBorder"
                  color="pearl"
                  rounded="full"
                  h="12"
                  px="8"
                  _hover={{ borderColor: "gold", bg: "rgba(255,255,255,0.05)" }}
                >
                  Book Now
                </Button>
              </Link>
            </Stack>
          </Stack>
        </MotionDiv>
      </Container>
    </Box>
  );
}
