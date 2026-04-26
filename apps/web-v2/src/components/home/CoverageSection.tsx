"use client";

import {
  Box,
  Container,
  HStack,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  Wrap,
  WrapItem,
  chakra,
} from "@chakra-ui/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { easeOutExpo, staggerFast, viewportOnce } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

interface CityPin {
  name: string;
  // SVG percentage coordinates inside our viewBox
  x: number;
  y: number;
  fromPrice: string;
}

// Approximate positions on a stylised Scotland silhouette (viewBox 0 0 100 140)
const PINS: CityPin[] = [
  { name: "Aberdeen", x: 78, y: 48, fromPrice: "From £55" },
  { name: "Inverness", x: 50, y: 38, fromPrice: "From £65" },
  { name: "Dundee", x: 70, y: 62, fromPrice: "From £45" },
  { name: "Perth", x: 60, y: 66, fromPrice: "From £45" },
  { name: "Stirling", x: 53, y: 73, fromPrice: "From £45" },
  { name: "Glasgow", x: 42, y: 80, fromPrice: "From £45" },
  { name: "Edinburgh", x: 62, y: 78, fromPrice: "From £45" },
  { name: "Falkirk", x: 55, y: 78, fromPrice: "From £45" },
  { name: "Kilmarnock", x: 38, y: 88, fromPrice: "From £55" },
  { name: "Ayr", x: 32, y: 92, fromPrice: "From £55" },
  { name: "Dumfries", x: 45, y: 102, fromPrice: "From £75" },
  { name: "Fort William", x: 35, y: 56, fromPrice: "From £85" },
  { name: "Oban", x: 28, y: 70, fromPrice: "From £85" },
];

const REGIONS = [
  {
    title: "Central Belt",
    towns: [
      "Glasgow",
      "Edinburgh",
      "Stirling",
      "Falkirk",
      "Linlithgow",
      "Livingston",
      "Motherwell",
      "Hamilton",
      "Paisley",
    ],
  },
  {
    title: "East Coast",
    towns: ["Dundee", "Perth", "St Andrews", "Arbroath", "Montrose", "Aberdeen"],
  },
  {
    title: "Highlands & Islands",
    towns: ["Inverness", "Fort William", "Oban", "Aviemore", "Skye"],
  },
  {
    title: "South West",
    towns: ["Ayr", "Kilmarnock", "Dumfries", "Galashiels", "Stranraer"],
  },
];

export function CoverageSection() {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <chakra.section bg="pearl" py={{ base: "20", md: "28" }}>
      <Container maxW="7xl">
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          textAlign="center"
          mb={{ base: "12", md: "16" }}
        >
          <Text
            color="gold"
            fontFamily="heading"
            fontWeight="500"
            fontSize="sm"
            letterSpacing="0.32em"
            textTransform="uppercase"
            mb="3"
          >
            Coverage
          </Text>
          <Heading
            as="h2"
            fontFamily="heading"
            fontWeight="700"
            color="ink"
            letterSpacing="-0.02em"
            fontSize={{ base: "3xl", md: "5xl" }}
            mb="4"
          >
            Wherever you are in Scotland
          </Heading>
          <Text
            color="muted"
            fontFamily="body"
            fontSize={{ base: "md", md: "lg" }}
            maxW="2xl"
            mx="auto"
            lineHeight="1.7"
          >
            From Glasgow to Inverness, the Highlands to the Borders — one trusted
            team, one transparent price.
          </Text>
        </MotionBox>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: "10", md: "16" }} alignItems="center">
          {/* SVG Map */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.8, ease: easeOutExpo }}
          >
            <Box
              position="relative"
              bg="obsidian"
              rounded="xl"
              p={{ base: "6", md: "8" }}
              boxShadow="lg"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="-30%"
                right="-30%"
                w="80%"
                h="80%"
                bg="radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)"
                pointerEvents="none"
              />
              <chakra.svg
                viewBox="0 0 100 140"
                w="full"
                h="auto"
                aria-label="Map of Scotland with Speedy Van coverage pins"
                position="relative"
                zIndex={1}
              >
                {/* Stylised Scotland silhouette */}
                <path
                  d="M 50 18 L 58 22 L 64 28 L 72 32 L 80 38 L 84 46 L 82 54 L 86 60 L 84 68 L 78 72 L 80 78 L 76 84 L 70 82 L 64 88 L 60 92 L 56 96 L 50 100 L 46 106 L 42 112 L 36 110 L 32 104 L 30 96 L 34 88 L 30 82 L 26 74 L 22 68 L 26 60 L 22 54 L 18 46 L 22 38 L 28 32 L 36 28 L 42 22 Z"
                  fill="rgba(255,255,255,0.04)"
                  stroke="rgba(212,175,55,0.25)"
                  strokeWidth="0.4"
                />
                {/* Pins */}
                {PINS.map((p) => {
                  const isHover = hover === p.name;
                  return (
                    <g
                      key={p.name}
                      onMouseEnter={() => setHover(p.name)}
                      onMouseLeave={() => setHover(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHover ? 2.6 : 1.4}
                        fill="#D4AF37"
                        opacity={isHover ? 1 : 0.85}
                        style={{ transition: "all 200ms" }}
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHover ? 5 : 3}
                        fill="#D4AF37"
                        opacity={isHover ? 0.25 : 0.12}
                        style={{ transition: "all 200ms" }}
                      />
                      {isHover && (
                        <g>
                          <rect
                            x={p.x + 3}
                            y={p.y - 6}
                            width="22"
                            height="9"
                            rx="2"
                            fill="#09090B"
                            stroke="#D4AF37"
                            strokeWidth="0.3"
                          />
                          <text
                            x={p.x + 4}
                            y={p.y - 1.8}
                            fill="#FAFAF9"
                            fontSize="2.6"
                            fontFamily="DM Sans, sans-serif"
                            fontWeight="500"
                          >
                            {p.name}
                          </text>
                          <text
                            x={p.x + 4}
                            y={p.y + 1.4}
                            fill="#D4AF37"
                            fontSize="2.2"
                            fontFamily="DM Sans, sans-serif"
                          >
                            {p.fromPrice}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </chakra.svg>
              <HStack mt="4" gap="2" justify="center">
                <Box w="2" h="2" bg="gold" rounded="full" />
                <Text color="muted" fontFamily="body" fontSize="xs">
                  Hover a pin to see starting prices
                </Text>
              </HStack>
            </Box>
          </MotionBox>

          {/* Regions */}
          <MotionBox
            variants={staggerFast}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <Stack gap="8">
              {REGIONS.map((r) => (
                <MotionBox
                  key={r.title}
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    show: {
                      opacity: 1,
                      x: 0,
                      transition: { duration: 0.5, ease: easeOutExpo },
                    },
                  }}
                >
                  <Stack gap="3">
                    <Text
                      fontFamily="heading"
                      fontWeight="600"
                      color="ink"
                      fontSize="md"
                      letterSpacing="0.04em"
                      textTransform="uppercase"
                    >
                      <Box as="span" color="gold" mr="2">—</Box>
                      {r.title}
                    </Text>
                    <Wrap gap="2">
                      {r.towns.map((t) => (
                        <WrapItem key={t}>
                          <Box
                            px="3.5"
                            py="1.5"
                            rounded="full"
                            bg="surface"
                            border="1px solid"
                            borderColor="rgba(0,0,0,0.06)"
                            fontFamily="body"
                            fontSize="sm"
                            color="ink"
                            transition="all 200ms"
                            _hover={{
                              borderColor: "gold",
                              color: "gold",
                              transform: "translateY(-1px)",
                            }}
                            cursor="default"
                          >
                            {t}
                          </Box>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Stack>
                </MotionBox>
              ))}
            </Stack>
          </MotionBox>
        </SimpleGrid>
      </Container>
    </chakra.section>
  );
}
