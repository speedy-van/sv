"use client";

import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HiHome,
  HiBriefcase,
  HiTruck,
  HiAcademicCap,
} from "react-icons/hi2";
import { IconType } from "react-icons";
import { easeOutExpo, staggerFast, viewportOnce } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

interface Service {
  icon: IconType;
  title: string;
  shortDesc: string;
  longDesc: string;
  price: string;
  href: string;
  imageGradient: string;
}

const SERVICES: Service[] = [
  {
    icon: HiHome,
    title: "House Removals",
    shortDesc: "From £120",
    longDesc:
      "Full-service moves for flats and family homes. Trained crew, padded blankets, and total peace of mind.",
    price: "From £120",
    href: "/services/house-removals",
    imageGradient:
      "linear-gradient(135deg, #1f2937 0%, #0f172a 100%)",
  },
  {
    icon: HiBriefcase,
    title: "Office Relocation",
    shortDesc: "From £180",
    longDesc:
      "Out-of-hours commercial moves engineered around your business. Zero disruption, maximum care.",
    price: "From £180",
    href: "/services/office-relocation",
    imageGradient:
      "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)",
  },
  {
    icon: HiTruck,
    title: "Furniture Delivery",
    shortDesc: "From £45",
    longDesc:
      "Marketplace pickups and same-day deliveries handled with the same precision as a full move.",
    price: "From £45",
    href: "/services/furniture-delivery",
    imageGradient:
      "linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)",
  },
  {
    icon: HiAcademicCap,
    title: "Student Moves",
    shortDesc: "From £60",
    longDesc:
      "Move-in, move-out, and end-of-term storage. Built around academic timelines and tight budgets.",
    price: "From £60",
    href: "/services/student-moves",
    imageGradient:
      "linear-gradient(135deg, #7c2d12 0%, #1f2937 100%)",
  },
];

export function ServicesSection() {
  return (
    <chakra.section id="services" bg="pearl" py={{ base: "20", md: "28" }}>
      <Container maxW="7xl">
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          mb={{ base: "12", md: "16" }}
          textAlign="center"
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
            Our Services
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
            Professional Moving Services
          </Heading>
          <Text
            color="muted"
            fontFamily="body"
            fontSize={{ base: "md", md: "lg" }}
            maxW="2xl"
            mx="auto"
            lineHeight="1.7"
          >
            One discreet team. Every kind of move. Choose the service that fits and
            we'll handle the rest.
          </Text>
        </MotionBox>

        <MotionBox
          variants={staggerFast}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: "5", md: "6" }}>
            {SERVICES.map((s) => (
              <ServiceCard key={s.title} service={s} />
            ))}
          </SimpleGrid>
        </MotionBox>
      </Container>
    </chakra.section>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon;
  return (
    <MotionBox
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: easeOutExpo },
        },
      }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: easeOutExpo }}
    >
      <Link href={service.href} style={{ display: "block", height: "100%" }}>
        <Box
          role="group"
          position="relative"
          h="280px"
          rounded="lg"
          overflow="hidden"
          border="1px solid"
          borderColor="rgba(0,0,0,0.06)"
          bg="surface"
          boxShadow="md"
          transition="all 350ms ease"
          _hover={{ boxShadow: "xl", borderColor: "rgba(212,175,55,0.4)" }}
          cursor="pointer"
        >
          {/* Image / gradient layer (always rendered, hidden by default) */}
          <Box
            position="absolute"
            inset="0"
            bgImage={service.imageGradient}
            opacity={0}
            transition="opacity 400ms ease"
            _groupHover={{ opacity: 1 }}
          />
          <Box
            position="absolute"
            inset="0"
            bgGradient="linear(to-t, rgba(9,9,11,0.85), rgba(9,9,11,0.2))"
            opacity={0}
            transition="opacity 400ms ease"
            _groupHover={{ opacity: 1 }}
          />

          {/* Default content */}
          <Stack
            position="absolute"
            inset="0"
            p="6"
            justify="space-between"
            opacity={1}
            transition="opacity 350ms ease"
            _groupHover={{ opacity: 0 }}
          >
            <Box
              w="52px"
              h="52px"
              rounded="md"
              bg="rgba(212,175,55,0.12)"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              color="gold"
            >
              <Icon size={26} />
            </Box>
            <Stack gap="1">
              <Text
                fontFamily="heading"
                fontWeight="600"
                color="ink"
                fontSize="xl"
              >
                {service.title}
              </Text>
              <Text fontFamily="mono" color="gold" fontSize="sm" fontWeight="500">
                {service.shortDesc} →
              </Text>
            </Stack>
          </Stack>

          {/* Hover content */}
          <Stack
            position="absolute"
            inset="0"
            p="6"
            justify="flex-end"
            color="pearl"
            opacity={0}
            transform="translateY(10px)"
            transition="all 350ms ease"
            _groupHover={{ opacity: 1, transform: "translateY(0)" }}
          >
            <Text
              fontFamily="heading"
              fontWeight="600"
              fontSize="xl"
            >
              {service.title}
            </Text>
            <Text
              fontFamily="body"
              fontSize="sm"
              color="zinc.300"
              opacity={0.9}
              lineHeight="1.6"
            >
              {service.longDesc}
            </Text>
            <Text fontFamily="mono" color="gold" fontSize="sm" fontWeight="500">
              {service.price} →
            </Text>
          </Stack>
        </Box>
      </Link>
    </MotionBox>
  );
}
