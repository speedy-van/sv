"use client";

import {
  Box,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { HiMagnifyingGlass, HiMinus, HiPlus } from "react-icons/hi2";
import { getApiBase, type SelectedItem } from "@/lib/booking-types";

const MotionBox = motion.create(chakra.div);

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  image?: string;
  weight?: number;
  volume?: number;
}

const FALLBACK_CATALOG: CatalogItem[] = [
  // Living room
  { id: "sofa-3", name: "Sofa (3-seater)", category: "Living Room", weight: 45, volume: 1.6 },
  { id: "sofa-2", name: "Sofa (2-seater)", category: "Living Room", weight: 32, volume: 1.1 },
  { id: "armchair", name: "Armchair", category: "Living Room", weight: 18, volume: 0.6 },
  { id: "coffee-table", name: "Coffee Table", category: "Living Room", weight: 15, volume: 0.4 },
  { id: "tv-stand", name: "TV Stand", category: "Living Room", weight: 20, volume: 0.45 },
  { id: "tv-large", name: 'TV (50"+)', category: "Living Room", weight: 18, volume: 0.35 },
  { id: "bookshelf", name: "Bookshelf", category: "Living Room", weight: 28, volume: 0.7 },
  // Bedroom
  { id: "bed-double", name: "Double Bed", category: "Bedroom", weight: 38, volume: 1.4 },
  { id: "bed-king", name: "King Bed", category: "Bedroom", weight: 48, volume: 1.8 },
  { id: "bed-single", name: "Single Bed", category: "Bedroom", weight: 28, volume: 0.9 },
  { id: "wardrobe", name: "Wardrobe", category: "Bedroom", weight: 55, volume: 1.5 },
  { id: "dresser", name: "Dresser", category: "Bedroom", weight: 35, volume: 0.7 },
  { id: "mattress", name: "Mattress", category: "Bedroom", weight: 22, volume: 0.6 },
  { id: "bedside", name: "Bedside Table", category: "Bedroom", weight: 12, volume: 0.2 },
  // Kitchen
  { id: "fridge", name: "Fridge / Freezer", category: "Kitchen", weight: 65, volume: 1.2 },
  { id: "washing-machine", name: "Washing Machine", category: "Kitchen", weight: 70, volume: 0.45 },
  { id: "dishwasher", name: "Dishwasher", category: "Kitchen", weight: 50, volume: 0.4 },
  { id: "microwave", name: "Microwave", category: "Kitchen", weight: 14, volume: 0.1 },
  { id: "kitchen-table", name: "Kitchen Table", category: "Kitchen", weight: 25, volume: 0.5 },
  { id: "kitchen-chair", name: "Dining Chair", category: "Kitchen", weight: 6, volume: 0.15 },
  // Office
  { id: "desk", name: "Desk", category: "Office", weight: 30, volume: 0.7 },
  { id: "office-chair", name: "Office Chair", category: "Office", weight: 12, volume: 0.4 },
  { id: "filing-cabinet", name: "Filing Cabinet", category: "Office", weight: 35, volume: 0.4 },
  { id: "monitor", name: "Monitor", category: "Office", weight: 6, volume: 0.1 },
  // Boxes & misc
  { id: "box-small", name: "Small Box", category: "Boxes", weight: 8, volume: 0.05 },
  { id: "box-medium", name: "Medium Box", category: "Boxes", weight: 12, volume: 0.1 },
  { id: "box-large", name: "Large Box", category: "Boxes", weight: 18, volume: 0.18 },
  { id: "suitcase", name: "Suitcase", category: "Boxes", weight: 15, volume: 0.12 },
  // Garden / outdoor
  { id: "lawnmower", name: "Lawnmower", category: "Garden", weight: 25, volume: 0.4 },
  { id: "bbq", name: "BBQ", category: "Garden", weight: 22, volume: 0.5 },
  { id: "bicycle", name: "Bicycle", category: "Garden", weight: 12, volume: 0.4 },
];

interface ItemPickerProps {
  items: SelectedItem[];
  onChange: (items: SelectedItem[]) => void;
}

export function ItemPicker({ items, onChange }: ItemPickerProps) {
  const [catalog, setCatalog] = useState<CatalogItem[]>(FALLBACK_CATALOG);
  const [activeCategory, setActiveCategory] = useState<string>(FALLBACK_CATALOG[0].category);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/items`);
        if (!res.ok) return;
        const json = await res.json();
        const list: CatalogItem[] | undefined = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json?.data)
          ? json.data
          : undefined;
        if (!cancelled && list && list.length > 0) {
          setCatalog(list);
          setActiveCategory(list[0].category);
        }
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((c) => {
      if (q) return c.name.toLowerCase().includes(q);
      return c.category === activeCategory;
    });
  }, [catalog, activeCategory, search]);

  const qtyOf = (id: string) => items.find((i) => i.id === id)?.quantity ?? 0;

  const setQty = (item: CatalogItem, qty: number) => {
    const next = qty <= 0
      ? items.filter((i) => i.id !== item.id)
      : items.some((i) => i.id === item.id)
      ? items.map((i) => (i.id === item.id ? { ...i, quantity: qty } : i))
      : [
          ...items,
          {
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: qty,
            image: item.image,
            weight: item.weight,
            volume: item.volume,
          },
        ];
    onChange(next);
  };

  const totalCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Stack gap="5">
      <HStack
        bg="rgba(255,255,255,0.06)"
        border="1px solid"
        borderColor="glassBorder"
        rounded="full"
        px="4"
        h="11"
        gap="3"
      >
        <HiMagnifyingGlass color="#71717A" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          variant="subtle"
          bg="transparent"
          color="pearl"
          border="none"
          h="full"
          px="0"
          _placeholder={{ color: "rgba(250,250,249,0.4)" }}
          _focus={{ outline: "none", boxShadow: "none" }}
        />
      </HStack>

      {!search && (
        <Box overflowX="auto" mx={{ base: "-2", md: "0" }} px={{ base: "2", md: "0" }}>
          <HStack gap="2" minW="max-content">
            {categories.map((cat) => {
              const active = cat === activeCategory;
              return (
                <chakra.button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  px="4"
                  h="9"
                  rounded="full"
                  bg={active ? "gold" : "rgba(255,255,255,0.06)"}
                  color={active ? "obsidian" : "pearl"}
                  border="1px solid"
                  borderColor={active ? "gold" : "glassBorder"}
                  fontFamily="body"
                  fontSize="sm"
                  fontWeight={active ? "600" : "500"}
                  whiteSpace="nowrap"
                  transition="all 200ms"
                  _hover={!active ? { borderColor: "gold", color: "gold" } : undefined}
                >
                  {cat}
                </chakra.button>
              );
            })}
          </HStack>
        </Box>
      )}

      <SimpleGrid columns={{ base: 3, sm: 4, md: 5 }} gap={{ base: "2.5", md: "3" }}>
        {filtered.map((item) => {
          const q = qtyOf(item.id);
          const active = q > 0;
          return (
            <MotionBox
              key={item.id}
              position="relative"
              bg={active ? "rgba(212,175,55,0.10)" : "rgba(255,255,255,0.04)"}
              border="1px solid"
              borderColor={active ? "gold" : "glassBorder"}
              rounded="lg"
              p="2.5"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              minH="120px"
            >
              {active && (
                <Box
                  position="absolute"
                  top="-6px"
                  right="-6px"
                  bg="gold"
                  color="obsidian"
                  rounded="full"
                  minW="22px"
                  h="22px"
                  px="1.5"
                  fontFamily="heading"
                  fontWeight="700"
                  fontSize="xs"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="goldGlow"
                >
                  {q}
                </Box>
              )}
              <Stack gap="2" h="full" justify="space-between" align="center">
                <Box
                  w="full"
                  h="46px"
                  rounded="md"
                  bg="rgba(0,0,0,0.18)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xl"
                  color="muted"
                  overflow="hidden"
                >
                  {item.image ? (
                    <chakra.img src={item.image} alt={item.name} maxH="full" maxW="full" />
                  ) : (
                    <Text>📦</Text>
                  )}
                </Box>
                <Text
                  fontFamily="body"
                  color={active ? "pearl" : "muted"}
                  fontSize="xs"
                  fontWeight="500"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  {item.name}
                </Text>
                <HStack gap="1" w="full" justify="space-between">
                  <IconButton
                    aria-label="Decrease"
                    onClick={() => setQty(item, Math.max(0, q - 1))}
                    size="xs"
                    variant="ghost"
                    color="pearl"
                    rounded="full"
                    minW="6"
                    h="6"
                    _hover={{ bg: "rgba(212,175,55,0.15)", color: "gold" }}
                    disabled={q <= 0}
                  >
                    <HiMinus size={12} />
                  </IconButton>
                  <Text fontFamily="heading" color={active ? "gold" : "muted"} fontSize="sm" fontWeight="700" minW="6" textAlign="center">
                    {q}
                  </Text>
                  <IconButton
                    aria-label="Increase"
                    onClick={() => setQty(item, q + 1)}
                    size="xs"
                    variant="ghost"
                    color="pearl"
                    rounded="full"
                    minW="6"
                    h="6"
                    _hover={{ bg: "rgba(212,175,55,0.15)", color: "gold" }}
                  >
                    <HiPlus size={12} />
                  </IconButton>
                </HStack>
              </Stack>
            </MotionBox>
          );
        })}
      </SimpleGrid>

      {filtered.length === 0 && (
        <Text fontFamily="body" color="muted" fontSize="sm" textAlign="center" py="6">
          No items match &ldquo;{search}&rdquo;.
        </Text>
      )}

      {/* Summary */}
      <HStack
        bg="rgba(212,175,55,0.08)"
        border="1px solid"
        borderColor="gold"
        rounded="full"
        px="5"
        py="3"
        justify="space-between"
      >
        <Stack gap="0">
          <Text fontFamily="heading" fontSize="xs" letterSpacing="0.16em" textTransform="uppercase" color="gold" fontWeight="600">
            Inventory
          </Text>
          <Text fontFamily="body" color="pearl" fontSize="sm">
            {totalCount === 0 ? "No items selected yet" : `${totalCount} item${totalCount === 1 ? "" : "s"} · ${items.length} type${items.length === 1 ? "" : "s"}`}
          </Text>
        </Stack>
        {totalCount > 0 && (
          <chakra.button
            type="button"
            onClick={() => onChange([])}
            color="muted"
            fontFamily="body"
            fontSize="xs"
            textDecoration="underline"
            _hover={{ color: "gold" }}
          >
            Clear all
          </chakra.button>
        )}
      </HStack>
    </Stack>
  );
}
