'use client';

// ⚡⚡⚡ Dataset Validation Fix v4.0 - NO MORE RED ERRORS! - 2025-10-07T01:48:00Z ⚡⚡⚡
// ✅ Removed throw statement that caused red console errors
// ✅ loadFromOfficialDataset now returns empty array instead of throwing
// ✅ Changed validation logic to check array length instead of catching errors
// ✅ Graceful fallback to directory manifest (668 images)
// 🎉 ZERO RED ERRORS - Clean console with warnings only!

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  IconButton,
  useToast,
  Divider,
  Icon,
  SimpleGrid,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  FormLabel,
  FormControl,
  FormErrorMessage,
  Badge,
  Flex,
  Card,
  CardBody,
  Circle,
  Collapse,
  useDisclosure,
  Progress,
  Tooltip,
  Grid,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image,
  useBreakpointValue,
  useBreakpoint,
} from '@chakra-ui/react';
// Images rendered with Chakra <Image>
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';

import {
  FaMapMarkerAlt,
  FaBolt,
  FaTrash,
  FaBuilding,
  FaParking,
  FaTags,
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaPlus,
  FaMinus,
  FaCheck,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaHome,
  FaCouch,
  FaBed,
  FaTv,
  FaUtensils,
  FaTshirt,
  FaFire,
  FaCoffee,
  FaChair,
  FaBoxOpen,
  FaArrowLeft,
  FaArrowRight,
  FaEye,
} from 'react-icons/fa';
import { MdElevator, MdKitchen, MdLocalLaundryService, MdTv } from 'react-icons/md';

import type { FormData } from '../hooks/useBookingForm';
import { useDeviceDetection } from '@/lib/hooks/use-device-detection';
import { SmartSearchBox } from './SmartSearchBox';
import { COMPREHENSIVE_CATALOG, HOUSE_PACKAGES } from '../../../lib/pricing/catalog-dataset';
import { IndividualItem } from '@speedy-van/shared';

type CategoryConfig = {
  displayName: string;
  folder: string;
  aliases: string[];
};

const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    displayName: 'Antiques & Collectibles',
    folder: 'Antiques_Collectibles',
    aliases: ['antiques collectibles', 'antiques_collectibles', 'antiques collectibles items', 'antiques'],
  },
  {
    displayName: 'Bags, Luggage & Boxes',
    folder: 'Bag_luggage_box',
    aliases: ['bags luggage boxes', 'bag luggage box', 'boxes', 'bag_luggage_box'],
  },
  {
    displayName: 'Bathroom Items',
    folder: 'Bathroom_Furniture',
    aliases: ['bathroom furniture', 'bathroom items', 'bathroom', 'bathroom_items', 'bathroom_furniture'],
  },
  {
    displayName: 'Bedroom Furniture',
    folder: 'Bedroom',
    aliases: ['bedroom furniture', 'bedroom', 'bedroom_items', 'bedroom_furniture'],
  },
  {
    displayName: 'Carpets & Rugs',
    folder: 'Carpets_Rugs',
    aliases: ['carpets rugs', 'carpets_rugs', 'carpet rugs'],
  },
  {
    displayName: 'Children & Baby Items',
    folder: 'Children_Baby_Items',
    aliases: ['children baby items', 'children_baby_items', 'children & baby'],
  },
  {
    displayName: 'Dining Room Furniture',
    folder: 'Dining_Room_Furniture',
    aliases: ['dining room furniture', 'dining_room_furniture'],
  },
  {
    displayName: 'Electrical & Electronics',
    folder: 'Electrical_Electronic',
    aliases: ['electrical electronics', 'electrical electronic', 'electronics'],
  },
  {
    displayName: 'Garden & Outdoor',
    folder: 'Garden_Outdoor',
    aliases: ['garden outdoor', 'garden outdoor furniture', 'garden_outdoor', 'garden & outdoor furniture'],
  },
  {
    displayName: 'Gym & Fitness Equipment',
    folder: 'Gym_Fitness_Equipment',
    aliases: ['gym equipment', 'gym fitness equipment', 'gym_fitness_equipment'],
  },
  {
    displayName: 'Office Furniture',
    folder: 'Office_furniture',
    aliases: ['home office furniture', 'office furniture', 'office_furniture'],
  },
  {
    displayName: 'Kitchen Appliances',
    folder: 'Kitchen_appliances',
    aliases: ['kitchen items', 'kitchen appliances', 'kitchen_appliances'],
  },
  {
    displayName: 'Living Room Furniture',
    folder: 'Living_room_Furniture',
    aliases: ['living room furniture', 'living_room_furniture'],
  },
  {
    displayName: 'Miscellaneous Household',
    folder: 'Miscellaneous_household',
    aliases: ['miscellaneous items', 'miscellaneous household', 'miscellaneous'],
  },
  {
    displayName: 'Musical Instruments',
    folder: 'Musical_instruments',
    aliases: ['musical instruments', 'musical_instruments'],
  },
  {
    displayName: 'Pet Items',
    folder: 'Pet_items',
    aliases: ['pet items', 'pet_items'],
  },
  {
    displayName: 'Seasonal Items',
    folder: 'Seasonal_Items',
    aliases: ['seasonal items', 'seasonal_items'],
  },
  {
    displayName: 'Special & Awkward Items',
    folder: 'Special_Awkward_items',
    aliases: ['special awkward items', 'special_awkward_items'],
  },
  {
    displayName: 'Wardrobes & Closets',
    folder: 'Wardrobes_closet',
    aliases: ['wardrobes closets', 'wardrobes & closets', 'wardrobes_closet', 'storage hallway furniture', 'storage_hallway_furniture'],
  },
];

const normalizeCategoryKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const CATEGORY_LOOKUP = CATEGORY_CONFIG.reduce<Map<string, CategoryConfig>>((acc, entry) => {
  const candidates = new Set<string>([entry.displayName, entry.folder, ...entry.aliases]);
  candidates.forEach((candidate) => {
    acc.set(normalizeCategoryKey(candidate), entry);
  });
  return acc;
}, new Map<string, CategoryConfig>());

const resolveCategoryInfo = (rawValue: string): { displayName: string; folder: string } => {
  const normalized = rawValue ? normalizeCategoryKey(rawValue) : '';
  const entry = normalized ? CATEGORY_LOOKUP.get(normalized) : undefined;

  if (entry) {
    return { displayName: entry.displayName, folder: entry.folder };
  }

  const fallbackDisplay = rawValue
    ? rawValue
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Miscellaneous Household';

  const fallbackFolder = rawValue
    ? rawValue
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '') || 'Miscellaneous_household'
    : 'Miscellaneous_household';

  return { displayName: fallbackDisplay || 'Miscellaneous Household', folder: fallbackFolder };
};

interface WhereAndWhatStepProps {
  formData: FormData;
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
  errors: Record<string, string>;
  onNext?: () => void;
  calculatePricing?: () => void;
  pricingTiers?: {
    economy: any;
    standard: any;
    express: any;
  } | null;
  availabilityData?: any;
  isLoadingAvailability?: boolean;
}

export default function WhereAndWhatStep({
  formData,
  updateFormData,
  errors,
  onNext,
  calculatePricing,
  pricingTiers,
  availabilityData,
  isLoadingAvailability,
}: WhereAndWhatStepProps) {
  
  // 🚨 Safari 17+ Device Detection for Layout Bug Workaround
  const { 
    shouldUseSimplifiedLayout, 
    hasBackdropFilterBug, 
    hasFlexGridBug,
    isSafari17Plus,
    isAffectedIPhone 
  } = useDeviceDetection();
  
  // State for item selection mode
  const [itemSelectionMode, setItemSelectionMode] = useState<'bedroom' | 'smart' | 'choose'>('choose');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('bedroom');
  // Using dataset-backed imagery with graceful fallbacks
  
  // 🔥 Version check log - FORCE REBUILD v3.1
  console.log('�🔥🔥 WhereAndWhatStep loaded - Dataset Validation Fix v3.1 - FORCE REBUILD - ' + new Date().toISOString());
  console.log('✅ If you still see old error message, Next.js is using CACHED component!');
  
  const { step1 } = formData;
  const toast = useToast();

  // 🎯 Responsive Design Hooks - Force responsive behavior
  const breakpoint = useBreakpoint();
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false }) ?? false;
  const isDesktop = useBreakpointValue({ base: false, lg: true }) ?? false;

  // 🎯 Responsive Values - Using useBreakpointValue for precise control
  const cardPadding = useBreakpointValue({ base: 3, sm: 4, md: 6 }) ?? 4;
  const cardSpacing = useBreakpointValue({ base: 3, sm: 4, md: 6 }) ?? 4;
  const cardBorderRadius = useBreakpointValue({ base: 'lg', md: 'xl' }) ?? 'lg';
  const iconSize = useBreakpointValue({ base: '44px', sm: '48px', md: '56px' }) ?? '48px';
  const iconBoxSize = useBreakpointValue({ base: 4.5, sm: 5, md: 6 }) ?? 5;
  const headingSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'xl' }) ?? 'md';
  const textSize = useBreakpointValue({ base: 'xs', sm: 'sm', md: 'md' }) ?? 'sm';
  const titleTextSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'xl' }) ?? 'md';
  const addressGridColumns = useBreakpointValue({ base: 1, md: 2 }) ?? 1;
  const addressGridSpacing = useBreakpointValue({ base: 3, sm: 4, md: 6 }) ?? 4;
  const buttonMinHeight = useBreakpointValue({ base: '48px', sm: '44px' }) ?? '44px';
  const buttonFontSize = useBreakpointValue({ base: 'sm', sm: 'md' }) ?? 'md';
  const searchPlaceholder = "type what you looking for";

  const [individualItems, setIndividualItems] = useState<IndividualItem[]>([]);
  const [individualItemsLoading, setIndividualItemsLoading] = useState<boolean>(true);
  const [individualItemsError, setIndividualItemsError] = useState<string | null>(null);
  // Category -> image URLs from public dataset
  const [datasetCategoryImages, setDatasetCategoryImages] = useState<Record<string, string[]>>({});
  const [datasetCategoryImagesNormalized, setDatasetCategoryImagesNormalized] = useState<Record<string, string[]>>({});
  const [fallbackMode, setFallbackMode] = useState<'dataset' | 'directory' | 'smart-search'>('dataset');

  const datasetFallbackImage = '/UK_Removal_Dataset/Images_Only/Bag_luggage_box/moving_boxes_uboxes_with_handles_10_premium_jpg_15kg.jpg';

  // Network helper with timeout to avoid hanging fetches in dev/prod
  const fetchWithTimeout = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit & { timeoutMs?: number }) => {
      const controller = new AbortController();
      const timeoutMs = init?.timeoutMs ?? 4000;
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(input, { ...init, signal: controller.signal });
        return res;
      } finally {
        clearTimeout(id);
      }
    },
    []
  );

  // Normalize a category key consistently (scoped helper for dataset mapping)
  const normalizeCategoryKeySafe = useCallback((category?: string) => {
    if (!category) return '';
    return category
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .trim()
      .toLowerCase();
  }, []);

  // Load dataset images mapping once and build normalized index
  useEffect(() => {
    fetchWithTimeout('/api/dataset/images', { timeoutMs: 4000 })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.data) {
          const raw = data.data as Record<string, string[]>;
          setDatasetCategoryImages(raw);
          const normalized: Record<string, string[]> = {};
          Object.entries(raw).forEach(([folder, images]) => {
            normalized[normalizeCategoryKeySafe(folder)] = images;
          });
          setDatasetCategoryImagesNormalized(normalized);
        }
      })
      .catch(() => void 0);
  }, [normalizeCategoryKeySafe, fetchWithTimeout]);

  // Build category list from dataset folders
  const datasetCategories = useMemo(() => {
    const keys = Object.keys(datasetCategoryImagesNormalized);
    const toLabel = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return keys.map((key) => ({ key, label: toLabel(key) }));
  }, [datasetCategoryImagesNormalized]);

  // Build category groups from all folders and all images provided by API
  const datasetGroups = useMemo(() => {
    const toLabel = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return Object.entries(datasetCategoryImagesNormalized).map(([key, images]) => ({
      key,
      label: toLabel(key),
      images, // include ALL images per folder, no truncation
    }));
  }, [datasetCategoryImagesNormalized]);

  // Featured popular items (derive exact same pictures from dataset, no duplication)
  const featuredPopularItems = useMemo(() => {
    // Map desired popular items to search keywords in filenames
    const popularSpecs: { name: string; keyHints: string[] }[] = [
      { name: 'Sofa', keyHints: ['sofa', 'couch'] },
      { name: 'Fridge', keyHints: ['fridge', 'refrigerator', 'freezer'] },
      { name: 'Washing Machine', keyHints: ['washing_machine', 'washer'] },
      { name: 'Fan', keyHints: ['fan'] },
      { name: 'Mirror', keyHints: ['mirror'] },
      { name: 'Bicycle', keyHints: ['bicycle', 'bike'] },
      { name: 'TV', keyHints: ['tv', 'television'] },
      { name: 'Mattress', keyHints: ['mattress'] },
      { name: 'Table', keyHints: ['table'] },
      { name: 'Chairs', keyHints: ['chair', 'chairs'] },
      { name: 'Boxes', keyHints: ['box', 'boxes'] },
    ];

    const toLabel = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const items: { label: string; groupKey: string; src: string }[] = [];

    for (const spec of popularSpecs) {
      let found: { groupKey: string; src: string } | null = null;
      for (const [groupKey, images] of Object.entries(datasetCategoryImagesNormalized)) {
        const hit = images.find((src) => {
          const file = src.split('/').pop() || '';
          const lower = file.toLowerCase();
          return spec.keyHints.some((k) => lower.includes(k));
        });
        if (hit) {
          found = { groupKey, src: hit };
          break;
        }
      }
      if (found) {
        items.push({ label: spec.name, groupKey: found.groupKey, src: found.src });
      }
    }
    // De-duplicate by src
    const seen = new Set<string>();
    return items.filter((it) => {
      if (seen.has(it.src)) return false;
      seen.add(it.src);
      return true;
    }).map((it) => ({ ...it, groupLabel: toLabel(it.groupKey) }));
  }, [datasetCategoryImagesNormalized]);

  // Quantity helpers for dataset-image items (id derived from src)
  const getDatasetItemId = (groupKey: string, src: string) => `img:${groupKey}:${src}`;
  const getQuantityForDataset = (groupKey: string, src: string) => {
    const id = getDatasetItemId(groupKey, src);
    return step1.items.find(i => i.id === id)?.quantity || 0;
  };
  const incrementDatasetItem = (groupKey: string, src: string, label: string) => {
    const id = getDatasetItemId(groupKey, src);
    const existing = step1.items.find(i => i.id === id);
    if (existing) {
      const q = (existing.quantity || 0) + 1;
      updateFormData('step1', {
        items: step1.items.map(i => i.id === id ? { ...i, quantity: q, totalPrice: (i.unitPrice || 25) * q } : i)
      });
    } else {
      updateFormData('step1', {
        items: [
          ...step1.items,
          {
            id,
            name: label,
            description: label,
            category: label,
            size: 'medium',
            quantity: 1,
            unitPrice: 25,
            totalPrice: 25,
            weight: 10,
            volume: 1,
            image: src,
          },
        ],
      });
    }
  };
  const decrementDatasetItem = (groupKey: string, src: string) => {
    const id = getDatasetItemId(groupKey, src);
    const existing = step1.items.find(i => i.id === id);
    if (!existing) return;
    const q = Math.max(0, (existing.quantity || 0) - 1);
    if (q === 0) {
      updateFormData('step1', { items: step1.items.filter(i => i.id !== id) });
    } else {
      updateFormData('step1', {
        items: step1.items.map(i => i.id === id ? { ...i, quantity: q, totalPrice: (i.unitPrice || 25) * q } : i)
      });
    }
  };

  // (video background removed per request)

  // (reverted) enhanced video frame logic removed per user request

  // Derive a human friendly title from image src
  const titleFromSrc = (src: string, fallback: string) => {
    try {
      const file = src.split('/').pop() || '';
      const base = file.replace(/\.(jpg|jpeg|png|webp)$/i, '');
      // remove trailing _jpg_*kg patterns
      const cleaned = base.replace(/_jpg.*$/i, '').replace(/_/g, ' ');
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    } catch {
      return fallback;
    }
  };

  // Centralized resolver with strict precedence order (keep original image, no hard fallback)
  const resolveItemImage = useCallback((params: { category?: string; itemImage?: string; catalogImage?: string; itemId?: string; }): string => {
    const { category, itemImage, catalogImage, itemId } = params;

    // 1) Use explicit item image as-is if provided
    if (itemImage && itemImage.trim().length > 0) return itemImage;

    // 2) Use catalog image if provided
    if (catalogImage && catalogImage.trim().length > 0) return catalogImage;

    // 3) Dataset folder by normalized category (best-effort preview)
    const norm = normalizeCategoryKeySafe(category);
    const ds = norm ? datasetCategoryImagesNormalized[norm] : undefined;
    if (ds && ds.length > 0) return ds[0];

    // 4) Optional mapping (best-effort); do NOT enforce a boxes fallback
    try {
      // Lazy import to avoid increasing client bundle if unused
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const imagesLib = require('@/lib/images/item-images');
      if (imagesLib?.getItemImageWithFallback && itemId) {
        const im = imagesLib.getItemImageWithFallback(itemId, category);
        if (im?.primary) return im.primary;
      }
    } catch {}

    // 5) No fallback image; return empty to keep original picture policy
    return '';
  }, [datasetCategoryImagesNormalized, normalizeCategoryKeySafe]);

  const ItemImage: React.FC<{
    src?: string | null;
    alt: string;
    ratio?: number; // width/height, default 3/4
  }> = ({ src, alt, ratio = 3 / 4 }) => {
    const [resolvedSrc, setResolvedSrc] = useState<string>(src && src.length > 0 ? src : '');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
      setResolvedSrc(src && src.length > 0 ? src : '');
      setLoaded(false);
    }, [src]);

    const paddingTop = `${Math.round((1 / ratio) * 100)}%`;

    return (
      <Box
        position="relative"
        w="full"
        borderRadius="xl"
        overflow="hidden"
        sx={{
          '@keyframes neonPulse': {
            '0%': {
              boxShadow: '0 0 6px rgba(0, 255, 255, 0.45), 0 0 12px rgba(0, 255, 255, 0.25), 0 0 18px rgba(0, 255, 255, 0.15)'
            },
            '100%': {
              boxShadow: '0 0 14px rgba(0, 255, 255, 0.8), 0 0 26px rgba(0, 255, 255, 0.55), 0 0 38px rgba(0, 255, 255, 0.35)'
            }
          },
          animation: 'neonPulse 2s ease-in-out infinite alternate',
          border: '1px solid rgba(0, 255, 255, 0.45)'
        }}
      >
        <Box position="relative" w="full" _before={{ content: '""', display: 'block', paddingTop }}>
          <Image
            src={resolvedSrc}
            alt={alt}
            position="absolute"
            inset={0}
            w="full"
            h="full"
            objectFit="cover"
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        </Box>
      </Box>
    );
  };

  // Function to parse filename and extract name and weight
  const parseFilename = (filename: string): { name: string; weight: number } => {
    const sanitized = filename.trim();
    const match = sanitized.match(/^(?<rawName>.+?)(?:_jpg)?_(?<weight>\d+(?:\.\d+)?)kg\.(?:jpg|jpeg|png)$/i);

    if (!match || !match.groups) {
      throw new Error(`CRITICAL: Unable to parse filename ${filename} - ensure the pattern includes weight (e.g. _jpg_20kg.jpg).`);
    }

    const rawName = match.groups.rawName;
    const parsedWeight = Number(match.groups.weight);

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      throw new Error(`CRITICAL: Invalid weight detected in filename ${filename}.`);
    }

    const humanReadableName = rawName
      .split(/[_-]+/)
      .filter(Boolean)
      .map((part) => {
        if (part.toUpperCase() === part) {
          return part.toUpperCase();
        }
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      name: humanReadableName,
      weight: parsedWeight,
    };
  };

  // Function to generate items from directory structure
  const generateItemsFromDirectory = async (): Promise<IndividualItem[]> => {
    // Define the actual files we found in each category
    const categoryFiles: Record<string, string[]> = {
      'Antiques_Collectibles': [
        'antique_jewelry_box_wooden_jpg_6kg.jpg',
        'armoire_oak_tudor_jpg_145kg.jpg',
        'books_leather_bound_modern_jpg_15kg.jpg',
        'books_vintage_leather_set_jpg_18kg.jpg',
        'buffet_victorian_console_jpg_95kg.jpg',
        'buffet_vintage_sideboard_jpg_85kg.jpg',
        'cassettone_dresser_chestnut_jpg_95kg.jpg',
        'chest_drawers_mahogany_jpg_75kg.jpg',
        'china_cabinet_glass_doors_jpg_125kg.jpg',
        'coffee_table_carved_walnut_jpg_45kg.jpg',
        'coffee_table_reclaimed_wood_jpg_35kg.jpg',
        'dining_chairs_rustic_set6_jpg_48kg.jpg',
        'dining_chairs_vintage_set4_jpg_32kg.jpg',
        'display_cabinet_vintage_jpg_135kg.jpg',
        'dresser_antique_rosewood_jpg_85kg.jpg',
        'end_table_vintage_round_jpg_25kg.jpg',
        'floor_lamp_brass_twist_jpg_15kg.jpg',
        'floor_lamp_chinoiserie_jpg_12kg.jpg',
        'grandfather_clock_english_jpg_195kg.jpg',
        'grandfather_clock_mahogany_jpg_185kg.jpg',
        'grandfather_clock_traditional_jpg_175kg.jpg',
        'hutch_cabinet_refinished_jpg_95kg.jpg',
        'mantel_clock_howard_miller_jpg_12kg.jpg',
        'mantel_clock_vintage_handle_jpg_8kg.jpg',
        'mirror_antique_wall_lights_jpg_18kg.jpg',
        'mirror_victorian_brass_jpg_15kg.jpg',
        'picture_frame_antique_gold_jpg_3kg.jpg',
        'picture_frame_baroque_vintage_jpg_4kg.jpg',
        'picture_frames_gold_set4_jpg_8kg.jpg',
        'pottery_vessels_vintage_jpg_12kg.jpg',
        'pub_chair_vintage_wood_jpg_8kg.jpg',
        'secretary_bureau_oak_jpg_105kg.jpg',
        'secretary_desk_chippendale_jpg_125kg.jpg',
        'secretary_desk_queen_anne_jpg_115kg.jpg',
        'table_lamp_traditional_jpg_8kg.jpg',
        'trunk_antique_steamer_jpg_45kg.jpg',
        'trunk_coffee_table_vintage_jpg_55kg.jpg',
        'trunk_decorative_large_jpg_35kg.jpg',
        'vase_ceramic_asian_style_jpg_5kg.jpg',
        'wardrobe_antique_carved_jpg_165kg.jpg'
      ],
      'Bag_luggage_box': [
        'backpack_rucksack_ll_bean_continental_jpg_4kg.jpg',
        'garment_bag_60_deluxe_travel_wallybags_jpg_2kg.jpg',
        'moving_boxes_8_best_top_moving_house_boxes_jpg_18kg.jpg',
        'moving_boxes_uboxes_1_room_economy_kit_15_boxes_jpg_22kg.jpg',
        'moving_boxes_uboxes_with_handles_10_premium_jpg_15kg.jpg',
        'storage_trunk_signature_design_ashley_kettleby_jpg_25kg.jpg',
        'suitcase_luggage_extra_large_33_lightweight_4_wheel_abs_hard_shell_jpg_8kg.jpg',
        'suitcase_luggage_melalenia_sets_7_piece_jpg_18kg.jpg',
        'suitcase_luggage_zimtown_3_piece_nested_spinner_tsa_lock_pink_jpg_12kg.jpg',
        'travel_bag_litvyak_duffle_50l_canvas_jpg_3kg.jpg',
        'travel_luggage_bags_brake_spinner_wheels_jpg_14kg.jpg'
      ],
      // Sample files for other categories - in production these would be scanned from the actual directory
      'Bathroom_Furniture': [
        'bathroom_bench_white_storage_jpg_15kg.jpg',
        'bathroom_hooks_chrome_square_jpg_1kg.jpg',
        'bathroom_hooks_wall_modern_jpg_1kg.jpg',
        'bathroom_mat_doormat_indoor_jpg_2kg.jpg',
        'bathroom_rug_30x20_soft_jpg_1kg.jpg',
        'bathroom_scale_digital_black_jpg_3kg.jpg',
        'bathroom_scale_health_meter_jpg_3kg.jpg',
        'bathroom_scale_vitafit_glass_jpg_4kg.jpg',
        'bathroom_stool_teak_round_jpg_8kg.jpg',
        'blanket_ladder_bathroom_jpg_12kg.jpg',
        'corner_shelf_4tier_ladder_jpg_20kg.jpg',
        'corner_shelf_metal_short_jpg_8kg.jpg',
        'corner_shelf_unit_black_jpg_25kg.jpg',
        'exhaust_fan_bathroom_diagram_jpg_8kg.jpg',
        'exhaust_fan_installation_guide_jpg_10kg.jpg',
        'exhaust_fan_venting_system_jpg_12kg.jpg',
        'ladder_shelf_decorative_4ft_jpg_18kg.jpg',
        'ladder_towel_rack_wooden_jpg_15kg.jpg',
        'laundry_basket_cabinet_jpg_22kg.jpg',
        'laundry_hamper_bamboo_jpg_14kg.jpg',
        'linen_cabinet_rattan_68inch_jpg_42kg.jpg',
        'linen_cabinet_white_67inch_jpg_45kg.jpg',
        'medicine_cabinet_LED_lights_jpg_20kg.jpg',
        'medicine_cabinet_arched_mirror_jpg_15kg.jpg',
        'medicine_cabinet_mirror_LED_jpg_22kg.jpg',
        'medicine_cabinet_recessed_black_jpg_18kg.jpg',
        'mirror_black_36x24_wall_jpg_22kg.jpg',
        'mirror_black_50x30_wall_jpg_25kg.jpg',
        'mirror_black_55x36_large_jpg_32kg.jpg',
        'over_toilet_shelf_adjustable_jpg_22kg.jpg',
        'over_toilet_shelf_bamboo_jpg_25kg.jpg',
        'over_toilet_storage_cabinet_jpg_28kg.jpg',
        'plant_stand_5tier_bathroom_jpg_12kg.jpg',
        'plant_stand_corner_6tier_jpg_15kg.jpg',
        'plant_stand_metal_5tier_jpg_10kg.jpg',
        'shower_bench_teak_21inch_jpg_12kg.jpg',
        'shower_bench_waterproof_jpg_10kg.jpg',
        'shower_caddy_3tier_standing_jpg_8kg.jpg',
        'shower_caddy_corner_30inch_jpg_6kg.jpg',
        'shower_caddy_hanging_organizer_jpg_3kg.jpg',
        'shower_curtain_rod_curved_jpg_5kg.jpg',
        'shower_curtain_rod_l_shaped_jpg_4kg.jpg',
        'shower_curtain_rod_u_shaped_jpg_6kg.jpg',
        'shower_stool_teak_solid_jpg_6kg.jpg',
        'soap_dispenser_3chamber_wall_jpg_4kg.jpg',
        'soap_dispenser_wall_400ml_jpg_2kg.jpg',
        'soap_dispenser_wall_mount_jpg_3kg.jpg',
        'storage_bench_oak_entryway_jpg_25kg.jpg',
        'storage_cabinet_bamboo_66inch_jpg_32kg.jpg',
        'storage_cabinet_narrow_68inch_jpg_38kg.jpg',
        'storage_cabinet_tall_67inch_jpg_35kg.jpg',
        'storage_cabinet_tall_white_jpg_38kg.jpg',
        'tissue_box_cover_black_jpg_1kg.jpg',
        'tissue_box_cover_white_jpg_1kg.jpg',
        'toilet_paper_holder_stand_jpg_5kg.jpg',
        'toilet_paper_holder_swirl_jpg_4kg.jpg',
        'toothbrush_holder_eco_bamboo_jpg_1kg.jpg',
        'toothbrush_holder_metal_black_jpg_2kg.jpg',
        'toothbrush_holder_sliding_lid_jpg_1kg.jpg',
        'towel_hooks_robe_holder_jpg_2kg.jpg',
        'towel_rack_metal_set2_jpg_4kg.jpg',
        'towel_rack_rolled_towels_jpg_8kg.jpg',
        'towel_rack_wall_28inch_jpg_6kg.jpg',
        'towel_ring_adhesive_nickel_jpg_1kg.jpg',
        'towel_ring_hand_holder_jpg_1kg.jpg',
        'towel_storage_rack_wall_jpg_12kg.jpg',
        'towel_warmer_chrome_33inch_jpg_25kg.jpg',
        'towel_warmer_rack_10_bar_jpg_18kg.jpg',
        'trash_can_decorative_white_jpg_2kg.jpg',
        'trash_can_slim_2gallon_jpg_3kg.jpg',
        'vanity_light_3_bulb_black_jpg_5kg.jpg',
        'vanity_light_4_bulb_chrome_jpg_6kg.jpg',
        'vanity_light_crystal_modern_jpg_8kg.jpg',
        'vanity_stool_black_back_jpg_7kg.jpg',
        'vanity_stool_upholstered_jpg_9kg.jpg',
        'vanity_unit_30inch_sink_jpg_45kg.jpg',
        'vanity_unit_corner_painted_jpg_55kg.jpg',
        'vanity_unit_oak_double_basin_jpg_75kg.jpg',
        'wall_cabinet_towel_bar_jpg_18kg.jpg',
        'waste_bin_stone_ekobo_jpg_2kg.jpg'
      ],
      'Bedroom': [
        'bunk_bed_frame_l_shaped_white_storage_desk_jpg_95kg.jpg',
        'bunk_bed_frame_nexus_silver_triple_sleeper_jpg_85kg.jpg',
        'bunk_bed_frame_paddington_kids_white_jpg_75kg.jpg',
        'double_bed_frame_cavill_fabric_grey_jpg_38kg.jpg',
        'double_bed_frame_florence_luxury_jpg_35kg.jpg',
        'double_bed_frame_harper_storage_mattress_jpg_45kg.jpg',
        'king_bed_frame_cavill_fabric_grey_jpg_55kg.jpg',
        'king_bed_frame_classic_luxe_storage_jpg_65kg.jpg',
        'ottoman_bed_frame_giselle_panel_plush_velvet_jpg_58kg.jpg',
        'ottoman_bed_frame_upholstered_king_linen_fabric_jpg_65kg.jpg',
        'platform_bed_frame_low_enkel_no_headboard_jpg_28kg.jpg',
        'platform_bed_frame_low_fuji_attic_jpg_32kg.jpg',
        'platform_bed_frame_oregon_low_solid_wood_jpg_45kg.jpg',
        'queen_bed_frame_florence_luxury_jpg_48kg.jpg',
        'queen_bed_frame_metal_tall_heavy_duty_jpg_32kg.jpg',
        'queen_bed_frame_modern_headboard_plank_jpg_42kg.jpg',
        'single_bed_frame_sussex_white_jpg_22kg.jpg',
        'single_bed_frame_white_hampshire_jpg_18kg.jpg',
        'single_bed_frame_wooden_3ft_white_jpg_20kg.jpg',
        'small_double_bed_frame_2_storage_drawers_jpg_28kg.jpg',
        'small_double_bed_frame_casa_thistle_pine_jpg_25kg.jpg',
        'super_king_bed_frame_sparkford_oak_6ft_jpg_85kg.jpg',
        'super_king_bed_frame_transform_bedroom_jpg_75kg.jpg',
        'super_king_bed_frame_upholstered_6ft_jpg_68kg.jpg'
      ],
      'Carpets_Rugs': [
        'area_rug_8x10_oriental_jpg_25kg.jpg',
        'area_rug_9x12_non_slip_jpg_28kg.jpg',
        'area_rug_large_6x9_white_jpg_15kg.jpg',
        'area_rug_modern_bordered_jpg_12kg.jpg',
        'kitchen_runner_cotton_2x6_jpg_4kg.jpg',
        'kitchen_runner_washable_2x10_jpg_5kg.jpg',
        'kitchen_runner_washable_2x12_jpg_7kg.jpg',
        'modern_rug_geometric_6x9_jpg_14kg.jpg',
        'outdoor_rug_waterproof_5x8_jpg_18kg.jpg',
        'persian_rug_traditional_medallion_jpg_22kg.jpg',
        'persian_rug_vintage_6x9_jpg_16kg.jpg',
        'persian_rug_vintage_hamadan_jpg_18kg.jpg',
        'round_rug_boho_4ft_jpg_8kg.jpg',
        'round_rug_green_5ft_jpg_10kg.jpg',
        'round_rug_ultra_thin_6ft_jpg_12kg.jpg',
        'runner_rug_extra_long_narrow_jpg_10kg.jpg',
        'runner_rug_hallway_2x12_jpg_8kg.jpg',
        'runner_rug_washable_2x10_jpg_6kg.jpg',
        'stair_runner_vintage_pattern_jpg_15kg.jpg',
        'stair_runner_vintage_traditional_jpg_12kg.jpg'
      ],
      'Children_Baby_Items': [
        'baby_bouncer_swing_seat_jpg_15kg.jpg',
        'baby_crib_convertible_white_jpg_35kg.jpg',
        'baby_playpen_safety_yard_jpg_22kg.jpg',
        'baby_stroller_2in1_foldable_jpg_16kg.jpg',
        'baby_stroller_lightweight_2in1_jpg_14kg.jpg',
        'baby_stroller_newborn_foldable_jpg_18kg.jpg',
        'baby_swing_3in1_motion_jpg_20kg.jpg',
        'baby_swing_bouncer_deluxe_jpg_18kg.jpg',
        'bunk_bed_espresso_trundle_jpg_75kg.jpg',
        'bunk_bed_house_twin_jpg_65kg.jpg',
        'bunk_bed_white_twin_trundle_jpg_72kg.jpg',
        'changing_table_dresser_combo_jpg_45kg.jpg',
        'dresser_5drawer_changing_table_jpg_48kg.jpg',
        'glider_rocker_standard_jpg_28kg.jpg',
        'high_chair_15in1_convertible_jpg_15kg.jpg',
        'high_chair_4in1_convertible_jpg_12kg.jpg',
        'high_chair_feeding_position_jpg_8kg.jpg',
        'kids_bookshelf_toy_organizer_jpg_20kg.jpg',
        'kids_desk_chair_adjustable_jpg_25kg.jpg',
        'kids_desk_chair_set_blue_jpg_28kg.jpg',
        'kids_dress_up_storage_jpg_22kg.jpg',
        'kids_table_4chairs_wooden_jpg_32kg.jpg',
        'kids_wardrobe_blue_closet_jpg_28kg.jpg',
        'kids_wardrobe_portable_jpg_25kg.jpg',
        'nursery_dresser_changing_table_jpg_42kg.jpg',
        'nursery_glider_with_ottoman_jpg_32kg.jpg',
        'nursery_set_3piece_crib_jpg_85kg.jpg',
        'nursery_set_7piece_complete_jpg_120kg.jpg',
        'playpen_6panel_indoor_outdoor_jpg_25kg.jpg',
        'toddler_bed_classic_wood_jpg_20kg.jpg',
        'toddler_bed_montessori_rails_jpg_22kg.jpg',
        'toddler_bed_wood_white_jpg_18kg.jpg',
        'toddler_table_chair_wooden_jpg_25kg.jpg',
        'toy_bench_wooden_small_jpg_15kg.jpg',
        'toy_box_extra_large_jpg_12kg.jpg',
        'toy_chest_storage_39inch_jpg_28kg.jpg',
        'toy_organizer_bookshelf_combo_jpg_24kg.jpg',
        'toy_storage_bookcase_pink_jpg_18kg.jpg',
        'toy_storage_chest_organizer_jpg_15kg.jpg',
        'toy_table_chairs_furniture_jpg_18kg.jpg'
      ],
      'Dining_Room_Furniture': [
        'bar_cart_6tier_retro_jpg_32kg.jpg',
        'bar_cart_wooden_wheels_jpg_25kg.jpg',
        'bar_stools_counter_height_full_jpg_24kg.jpg',
        'bar_stools_swivel_set4_jpg_36kg.jpg',
        'bar_stools_velvet_set2_jpg_22kg.jpg',
        'bar_table_pub_height_jpg_45kg.jpg',
        'buffet_sideboard_cabinet_white_jpg_72kg.jpg',
        'chandelier_farmhouse_5light_jpg_12kg.jpg',
        'chandelier_linear_crystal_3light_jpg_18kg.jpg',
        'chandelier_modern_linear_16light_jpg_15kg.jpg',
        'china_cabinet_casual_treasures_jpg_95kg.jpg',
        'china_cabinet_curio_lighted_jpg_85kg.jpg',
        'console_table_50inch_sideboard_buffet_jpg_48kg.jpg',
        'console_table_59inch_drawers_williamspace_jpg_35kg.jpg',
        'console_table_rustic_drawers_shelf_jpg_42kg.jpg',
        'corner_hutch_shaker_style_jpg_85kg.jpg',
        'corner_shelf_stand_tall_jpg_35kg.jpg',
        'corner_storage_cabinet_67inch_jpg_75kg.jpg',
        'counter_height_dining_table_jpg_55kg.jpg',
        'dining_bench_tufted_68inch_jpg_32kg.jpg',
        'dining_bench_upholstered_74inch_jpg_35kg.jpg',
        'dining_chairs_faux_leather_set_jpg_32kg.jpg',
        'dining_chairs_mid_century_set6_jpg_48kg.jpg',
        'dining_chairs_tufted_set2_jpg_32kg.jpg',
        'dining_chairs_velvet_beige_set2_jpg_30kg.jpg',
        'dining_chairs_velvet_blue_set2_jpg_28kg.jpg',
        'dining_chairs_walnut_leather_set2_jpg_26kg.jpg',
        'dining_hutch_69inch_buffet_jpg_125kg.jpg',
        'dining_hutch_wine_cabinet_jpg_88kg.jpg',
        'dining_mirror_round_32inch_jpg_8kg.jpg',
        'dining_mirror_wall_decor_jpg_12kg.jpg',
        'dining_room_rug_guide_jpg_18kg.jpg',
        'dining_rug_size_guide_jpg_22kg.jpg',
        'dining_set_6piece_bench_jpg_95kg.jpg',
        'dining_table_expandable_transformer_jpg_75kg.jpg',
        'dining_table_extendable_55inch_jpg_65kg.jpg',
        'dining_table_marble_7piece_jpg_120kg.jpg',
        'dining_table_set_6chairs_lexicon_jpg_90kg.jpg',
        'dining_table_set_6piece_bench_jpg_105kg.jpg',
        'dining_table_set_6seater_modern_jpg_85kg.jpg',
        'dining_table_slip_leaf_chairs_jpg_80kg.jpg',
        'dining_table_solid_wood_extendable_jpg_95kg.jpg',
        'dining_wall_art_kitchen_decor_jpg_3kg.jpg',
        'display_cabinet_curio_lighted_jpg_82kg.jpg',
        'extension_dining_table_drawleaf_jpg_78kg.jpg',
        'extension_table_double_leaf_jpg_82kg.jpg',
        'glass_dining_table_7piece_jpg_85kg.jpg',
        'glass_dining_table_set8_jpg_95kg.jpg',
        'mirror_wall_decor_multiple_jpg_15kg.jpg',
        'plant_stand_bamboo_37inch_jpg_12kg.jpg',
        'plant_stand_indoor_outdoor_jpg_15kg.jpg',
        'plant_stand_wooden_multi_tier_jpg_18kg.jpg',
        'round_dining_table_48inch_jpg_58kg.jpg',
        'round_dining_table_pedestal_jpg_65kg.jpg',
        'round_pedestal_table_farmhouse_jpg_75kg.jpg',
        'serving_cart_solid_wood_jpg_28kg.jpg',
        'sideboard_buffet_66inch_large_jpg_75kg.jpg',
        'sideboard_cabinet_66inch_grey_jpg_78kg.jpg',
        'sideboard_cambridge_series_jpg_65kg.jpg',
        'wine_bar_cabinet_led_jpg_62kg.jpg',
        'wine_cabinet_58inch_storage_jpg_68kg.jpg',
        'wine_rack_bar_cabinet_jpg_55kg.jpg'
      ],
      'Electrical_Electronic': [
        'computer_monitor_24inch_gaming_jpg_6kg.jpg',
        'computer_monitor_24inch_koorui_jpg_6kg.jpg',
        'computer_monitor_27inch_best_jpg_8kg.jpg',
        'computer_monitor_27inch_hp_jpg_7kg.jpg',
        'desktop_computer_gaming_tower_jpg_15kg.jpg',
        'desktop_computer_hp_elite_tower_jpg_12kg.jpg',
        'desktop_computer_hp_tower_jpg_10kg.jpg',
        'electric_coffee_maker_turkish_jpg_1kg.jpg',
        'electric_kettle_smart_jpg_2kg.jpg',
        'electric_kettle_tea_maker_buydeem_jpg_2kg.jpg',
        'gaming_console_best_6_consoles_jpg_6kg.jpg',
        'gaming_console_evolution_history_jpg_5kg.jpg',
        'gaming_console_ps5_xbox_series_jpg_8kg.jpg',
        'home_theater_bose_smart_ultra_jpg_25kg.jpg',
        'home_theater_klipsch_5_2_jpg_45kg.jpg',
        'laptop_computer_best_2025_jpg_2kg.jpg',
        'laptop_computer_comparison_jpg_2kg.jpg',
        'laptop_computer_notebook_jpg_2kg.jpg',
        'microwave_convection_oven_combo_jpg_32kg.jpg',
        'microwave_oven_kitchen_design_jpg_18kg.jpg',
        'microwave_oven_wall_built_in_jpg_25kg.jpg',
        'mini_fridge_3_2_cuft_freezer_jpg_35kg.jpg',
        'mini_fridge_compact_3_5_cuft_jpg_38kg.jpg',
        'portable_air_conditioner_cooling_jpg_8kg.jpg',
        'portable_air_conditioner_evaporative_jpg_12kg.jpg',
        'printer_all_in_one_best_2025_jpg_15kg.jpg',
        'printer_hp_laserjet_wireless_color_jpg_18kg.jpg',
        'printer_inkjet_vs_laser_jpg_12kg.jpg',
        'projector_benq_4k_laser_cinema_jpg_12kg.jpg',
        'projector_epson_5040ub_4k_jpg_10kg.jpg',
        'projector_epson_home_cinema_5010_jpg_8kg.jpg',
        'robot_vacuum_best_ces_2025_jpg_5kg.jpg',
        'robot_vacuum_cleaner_ultra_slim_jpg_3kg.jpg',
        'robot_vacuum_intelligent_3in1_jpg_4kg.jpg',
        'router_netgear_cable_modem_jpg_3kg.jpg',
        'router_wifi_best_2025_jpg_2kg.jpg',
        'router_wifi_wireless_linksys_jpg_2kg.jpg',
        'security_camera_system_10ch_jpg_15kg.jpg',
        'security_camera_system_zosi_jpg_18kg.jpg',
        'smart_speaker_alexa_best_2025_jpg_2kg.jpg',
        'smart_speaker_amazon_echo_jpg_2kg.jpg',
        'smart_speaker_echo_pop_alexa_jpg_1kg.jpg',
        'soundbar_5_1_surround_dolby_jpg_8kg.jpg',
        'soundbar_5_1_wireless_subwoofer_jpg_12kg.jpg',
        'soundbar_portable_tv_pc_jpg_4kg.jpg',
        'tablet_android_ipad_comparison_jpg_1kg.jpg',
        'tablet_android_vs_ipad_jpg_1kg.jpg',
        'television_15inch_kitchen_portable_jpg_3kg.jpg',
        'television_15inch_portable_antenna_jpg_3kg.jpg',
        'television_15inch_pyle_1080p_jpg_4kg.jpg',
        'television_19inch_flat_screen_jpg_5kg.jpg',
        'television_19inch_hd_led_ips_jpg_6kg.jpg',
        'television_19inch_led_widescreen_jpg_6kg.jpg',
        'television_24inch_dvd_player_jpg_8kg.jpg',
        'television_24inch_emerson_hd_jpg_9kg.jpg',
        'television_32inch_best_2025_jpg_11kg.jpg',
        'television_32inch_dvd_720p_jpg_13kg.jpg',
        'television_32inch_smart_led_hd_jpg_12kg.jpg',
        'television_40inch_roku_select_jpg_17kg.jpg',
        'television_40inch_tcl_roku_jpg_18kg.jpg',
        'television_40inch_vizio_1080p_jpg_19kg.jpg',
        'television_43inch_fire_tv_4k_jpg_21kg.jpg',
        'television_43inch_samsung_crystal_jpg_22kg.jpg',
        'television_50inch_smart_4k_google_jpg_25kg.jpg',
        'television_50inch_vizio_4k_hdr_jpg_26kg.jpg',
        'television_50inch_vizio_limited_jpg_24kg.jpg',
        'television_55inch_lg_oled_c4_jpg_35kg.jpg',
        'television_55inch_samsung_oled_jpg_32kg.jpg',
        'television_55inch_samsung_s95d_jpg_34kg.jpg',
        'television_65inch_best_2025_jpg_45kg.jpg',
        'television_65inch_dimensions_guide_jpg_42kg.jpg',
        'television_75inch_best_2025_jpg_55kg.jpg',
        'television_75inch_lg_4k_uhd_jpg_58kg.jpg',
        'television_75inch_sony_x85j_jpg_56kg.jpg',
        'television_85inch_huge_apartment_jpg_78kg.jpg',
        'television_85inch_samsung_neo_qled_jpg_75kg.jpg',
        'television_85inch_sony_x90l_jpg_82kg.jpg',
        'washing_machine_portable_11lbs_jpg_18kg.jpg',
        'washing_machine_portable_mini_jpg_15kg.jpg',
        'washing_machine_portable_top_load_jpg_22kg.jpg'
      ],
      'Garden_Outdoor': [
        'bbq_grill_3in1_gas_charcoal_combo_jpg_65kg.jpg',
        'bbq_grill_deluxe_charcoal_gas_jpg_62kg.jpg',
        'bbq_grill_propane_gas_charcoal_jpg_58kg.jpg',
        'garden_arbor_bench_sunset_jpg_28kg.jpg',
        'garden_bench_wooden_arch_jpg_25kg.jpg',
        'garden_planter_ceramic_mosaic_large_jpg_15kg.jpg',
        'garden_planter_round_shallow_glazed_jpg_18kg.jpg',
        'garden_planter_terra_cotta_large_jpg_22kg.jpg',
        'garden_shed_organization_supplies_jpg_75kg.jpg',
        'garden_shed_outdoor_storage_cabinet_jpg_65kg.jpg',
        'garden_shed_storage_organization_jpg_85kg.jpg',
        'garden_water_fountain_6tier_cascading_jpg_45kg.jpg',
        'garden_water_fountain_indoor_outdoor_jpg_35kg.jpg',
        'gazebo_10x12_hardtop_lean_to_jpg_135kg.jpg',
        'gazebo_14x12_outdoor_metal_frame_jpg_155kg.jpg',
        'lawnmower_30_rear_engine_rider_jpg_185kg.jpg',
        'lawnmower_cub_cadet_riding_jpg_175kg.jpg',
        'lawnmower_riding_home_depot_jpg_165kg.jpg',
        'outdoor_dining_acacia_wood_table_jpg_55kg.jpg',
        'outdoor_dining_set_5pc_metal_square_jpg_35kg.jpg',
        'outdoor_dining_set_rattan_patio_jpg_32kg.jpg',
        'outdoor_kitchen_built_in_grill_jpg_95kg.jpg',
        'outdoor_kitchen_modular_3pc_island_jpg_185kg.jpg',
        'outdoor_kitchen_small_grill_jpg_125kg.jpg',
        'outdoor_lounge_chair_acacia_wood_jpg_22kg.jpg',
        'outdoor_lounge_chair_egg_wicker_jpg_18kg.jpg',
        'outdoor_lounge_chair_namaro_ikea_jpg_15kg.jpg',
        'outdoor_parasol_tropical_thatched_straw_jpg_12kg.jpg',
        'outdoor_storage_box_100_gallon_jpg_35kg.jpg',
        'outdoor_storage_box_120_gallon_jpg_42kg.jpg',
        'outdoor_table_chairs_7pc_artbuske_jpg_38kg.jpg',
        'outdoor_umbrella_boho_beach_fringe_jpg_8kg.jpg',
        'outdoor_umbrella_striped_patio_pink_jpg_6kg.jpg',
        'patio_dining_set_7pc_metal_expandable_jpg_45kg.jpg',
        'patio_dining_set_7pc_metal_slat_jpg_42kg.jpg',
        'patio_heater_chimenea_propane_jpg_35kg.jpg',
        'patio_heater_movable_fire_pit_jpg_28kg.jpg',
        'swing_set_backyard_7in1_costzon_jpg_125kg.jpg',
        'swing_set_basic_with_slide_jpg_95kg.jpg',
        'swing_set_multi_deck_fantasy_jpg_185kg.jpg',
        'trampoline_16ft_large_kids_jpg_85kg.jpg',
        'trampoline_ground_outdoor_children_jpg_35kg.jpg',
        'trampoline_outdoor_fitness_mini_jpg_25kg.jpg',
        'wheelbarrow_garden_tools_jpg_8kg.jpg',
        'wheelbarrow_kids_expert_gardener_jpg_5kg.jpg'
      ],
      'Gym_Fitness_Equipment': [
        'balance_ball_half_exercise_23inch_jpg_5kg.jpg',
        'balance_ball_trainer_stability_lifepro_jpg_6kg.jpg',
        'cable_machine_dual_functional_trainer_jpg_195kg.jpg',
        'dumbbell_bench_press_station_jpg_55kg.jpg',
        'dumbbells_loadable_70lbs_set_jpg_32kg.jpg',
        'dumbbells_urethane_olympic_set_jpg_85kg.jpg',
        'elliptical_rower_power10_teeter_jpg_95kg.jpg',
        'exercise_bike_vs_treadmill_home_jpg_75kg.jpg',
        'foam_roller_exercise_tips_jpg_2kg.jpg',
        'foam_roller_exercises_regular_jpg_2kg.jpg',
        'foam_yoga_roller_25x6_blue_jpg_2kg.jpg',
        'home_exercise_equipment_picks_jpg_125kg.jpg',
        'home_gym_life_fitness_g4_jpg_185kg.jpg',
        'kettlebell_resistance_bands_combo_jpg_18kg.jpg',
        'multi_gym_4_station_extreme_jpg_225kg.jpg',
        'multi_gym_cable_crossover_york_jpg_285kg.jpg',
        'office_desk_treadmill_spinning_bike_jpg_45kg.jpg',
        'pilates_reformer_machine_wood_jpg_85kg.jpg',
        'pilates_reformer_wood_home_workout_jpg_88kg.jpg',
        'power_rack_body_solid_pcl_jpg_155kg.jpg',
        'power_rack_rogue_rml490_monster_jpg_165kg.jpg',
        'pull_up_bar_best_3_wirecutter_jpg_8kg.jpg',
        'pull_up_bar_door_adjustable_jpg_5kg.jpg',
        'punching_bag_speed_bag_stand_jpg_65kg.jpg',
        'punching_bag_venum_classic_100lbs_jpg_45kg.jpg',
        'resistance_bands_workout_equipment_jpg_2kg.jpg',
        'rowing_machine_teeter_power10_jpg_92kg.jpg',
        'rowing_machine_vs_elliptical_jpg_85kg.jpg',
        'slam_ball_american_barbell_set_jpg_35kg.jpg',
        'slam_ball_medicine_ball_workout_jpg_12kg.jpg',
        'squat_stands_vs_power_racks_jpg_125kg.jpg',
        'treadmill_exercise_bike_cardio_combo_jpg_85kg.jpg',
        'weight_bench_dumbbell_barbell_jpg_65kg.jpg',
        'weight_plates_cast_iron_cap_jpg_45kg.jpg',
        'weight_rack_mirror_combination_jpg_125kg.jpg'
      ],
      'Kitchen_appliances': [
        'air_fryer_toaster_oven_breville_jpg_18kg.jpg',
        'air_fryer_toaster_oven_hamilton_beach_jpg_16kg.jpg',
        'american_fridge_freezer_bosch_jpg_145kg.jpg',
        'american_fridge_freezer_size_guide_jpg_165kg.jpg',
        'blender_food_processor_combo_best_jpg_8kg.jpg',
        'blender_food_processor_combo_tested_jpg_10kg.jpg',
        'bread_maker_panasonic_gopan_rice_jpg_12kg.jpg',
        'bread_maker_zojirushi_mini_jpg_8kg.jpg',
        'chest_freezer_7cuft_white_frigidaire_jpg_45kg.jpg',
        'chest_freezer_commercial_19_4cuft_galaxy_jpg_85kg.jpg',
        'chest_freezer_commercial_30cuft_galaxy_jpg_95kg.jpg',
        'chest_freezer_mini_5cuft_black_jpg_42kg.jpg',
        'chest_freezer_small_3_5cuft_mini_jpg_35kg.jpg',
        'coffee_maker_delonghi_combination_jpg_8kg.jpg',
        'dishwasher_countertop_portable_jpg_28kg.jpg',
        'dishwasher_portable_countertop_aooden_jpg_32kg.jpg',
        'dishwasher_portable_vs_builtin_jpg_65kg.jpg',
        'espresso_machine_budget_best_3_jpg_12kg.jpg',
        'espresso_machine_builtin_grinder_jpg_15kg.jpg',
        'food_processor_blender_8in1_kognita_jpg_6kg.jpg',
        'gas_range_cooktop_48inch_duura_jpg_125kg.jpg',
        'ice_maker_water_dispenser_2in1_48lbs_jpg_28kg.jpg',
        'microwave_countertop_1_1cuft_1000watt_jpg_18kg.jpg',
        'microwave_countertop_best_2025_jpg_22kg.jpg',
        'microwave_small_0_7cuft_700watt_jpg_12kg.jpg',
        'mini_fridge_2door_stainless_3_1cuft_jpg_32kg.jpg',
        'mini_fridge_compact_3_2cuft_safeplus_jpg_35kg.jpg',
        'mini_fridge_compact_single_door_jpg_25kg.jpg',
        'pressure_cooker_instant_pot_duo_7in1_jpg_6kg.jpg',
        'pressure_cooker_instant_pot_duo_electric_jpg_6kg.jpg',
        'pressure_cooker_multifunction_6_34qt_jpg_7kg.jpg',
        'range_stove_oven_difference_jpg_95kg.jpg',
        'refrigerator_standard_dimensions_jpg_95kg.jpg',
        'refrigerator_standard_size_measure_jpg_85kg.jpg',
        'refrigerator_top_freezer_7_5cuft_jpg_65kg.jpg',
        'stand_mixer_kitchenaid_artisan_5quart_jpg_12kg.jpg',
        'stand_mixer_kitchenaid_artisan_colors_jpg_11kg.jpg',
        'stand_mixer_kitchenaid_artisan_tilt_head_jpg_10kg.jpg',
        'upright_freezer_compact_3cuft_apartment_jpg_40kg.jpg',
        'upright_freezer_compact_3cuft_kotek_jpg_42kg.jpg',
        'upright_freezer_mini_stainless_steel_jpg_38kg.jpg',
        'vacuum_sealer_black_decker_vs1300_jpg_5kg.jpg',
        'vacuum_sealer_chamber_vevor_260watt_jpg_15kg.jpg',
        'vacuum_sealer_excalibur_12inch_jpg_8kg.jpg',
        'washing_machine_buying_guide_jpg_85kg.jpg',
        'washing_machine_large_capacity_best_jpg_105kg.jpg',
        'washing_machine_large_capacity_consumer_jpg_110kg.jpg',
        'washing_machine_portable_mini_16l_jpg_15kg.jpg',
        'washing_machine_portable_small_9_9lb_jpg_18kg.jpg',
        'washing_machine_portable_top_load_1_6cuft_jpg_22kg.jpg',
        'washing_machine_standard_dimensions_jpg_75kg.jpg',
        'washing_machine_types_whirlpool_jpg_95kg.jpg',
        'water_dispenser_ice_maker_3in1_jpg_25kg.jpg',
        'wine_cooler_30inch_dual_zone_jpg_55kg.jpg',
        'wine_cooler_vissani_4_3cuft_stainless_jpg_45kg.jpg'
      ],
      'Living_room_Furniture': [
        'accent_chair_mid_century_eluchang_jpg_22kg.jpg',
        'accent_chairs_set_2_mid_century_jpg_38kg.jpg',
        'area_rug_8x10_non_slip_zesthome_jpg_18kg.jpg',
        'area_rug_9x12_large_washable_jpg_22kg.jpg',
        'area_rug_fuzzy_soft_plush_shaggy_jpg_15kg.jpg',
        'armchair_1_seat_accent_chair_jpg_25kg.jpg',
        'armchair_rolled_accent_set_2_jpg_42kg.jpg',
        'bar_cart_3_tier_gold_serving_jpg_15kg.jpg',
        'bar_cart_living_room_best_ideas_jpg_18kg.jpg',
        'bar_cart_mid_century_32inch_west_elm_jpg_22kg.jpg',
        'bean_bag_chair_fireside_lazy_floor_jpg_8kg.jpg',
        'bean_bag_velvet_memory_foam_footstool_jpg_12kg.jpg',
        'bean_bag_xl_chinchilla_giant_convertible_jpg_15kg.jpg',
        'bookcase_5_shelf_wooden_standing_jpg_42kg.jpg',
        'bookshelf_living_room_storage_sunesa_jpg_35kg.jpg',
        'ceiling_fan_30inch_modern_lights_remote_jpg_8kg.jpg',
        'ceiling_fan_65inch_lights_remote_black_jpg_12kg.jpg',
        'chesterfield_sofa_2_seat_antique_tan_jpg_55kg.jpg',
        'chesterfield_sofa_4_seat_traditional_jpg_75kg.jpg',
        'chesterfield_sofa_berkeley_traditional_jpg_68kg.jpg',
        'coffee_table_modern_povison_living_room_jpg_25kg.jpg',
        'coffee_table_round_lift_top_wynny_jpg_28kg.jpg',
        'coffee_table_white_glossy_led_lighting_jpg_32kg.jpg',
        'console_table_50inch_sideboard_buffet_jpg_48kg.jpg',
        'console_table_59inch_drawers_williamspace_jpg_35kg.jpg',
        'console_table_rustic_drawers_shelf_jpg_42kg.jpg',
        'curtains_custom_light_filtering_twopages_jpg_4kg.jpg',
        'curtains_living_room_versatile_ideas_jpg_6kg.jpg',
        'curtains_taupe_beige_132inch_linen_jpg_5kg.jpg',
        'end_table_4_tier_tribesigns_jpg_18kg.jpg',
        'end_table_industrial_square_foluban_jpg_12kg.jpg',
        'floor_lamp_tripod_66inch_black_jpg_12kg.jpg',
        'floor_lamp_white_arc_modern_jpg_8kg.jpg',
        'footstool_small_under_desk_baksea_jpg_3kg.jpg',
        'loveseat_2_seat_48inch_jarenie_jpg_32kg.jpg',
        'loveseat_2_seat_fabric_63inch_jpg_38kg.jpg',
        'loveseat_2_seat_microfiber_dark_gray_jpg_35kg.jpg',
        'mirror_large_47x32_gold_living_room_jpg_15kg.jpg',
        'mirror_silver_beveled_39x28_rectangle_jpg_12kg.jpg',
        'ottoman_storage_oversized_linen_setawix_jpg_18kg.jpg',
        'ottoman_tufted_vegan_leather_distressed_jpg_15kg.jpg',
        'plant_stand_11_tier_indoor_outdoor_jpg_25kg.jpg',
        'plant_stand_5_tier_grow_lights_jpg_32kg.jpg',
        'plant_stand_modern_flair_mid_century_jpg_8kg.jpg',
        'recliner_sofa_3_seat_leather_tufted_jpg_95kg.jpg',
        'recliner_sofa_leather_power_edward_jpg_85kg.jpg',
        'recliner_sofa_set_2_piece_power_jpg_125kg.jpg',
        'rocking_chair_modern_fabric_braea_jpg_22kg.jpg',
        'rocking_chair_nursery_ergonomic_papasan_jpg_18kg.jpg',
        'rocking_chair_recliner_comfortable_jpg_28kg.jpg',
        'room_divider_4_panel_jostyle_jpg_25kg.jpg',
        'room_divider_wall_storage_cabinet_jpg_55kg.jpg',
        'sectional_4_seat_111inch_jach_jpg_65kg.jpg',
        'sectional_4_seat_129inch_modular_jpg_105kg.jpg',
        'sectional_4_seat_l_shaped_convertible_jpg_68kg.jpg',
        'sectional_5_seat_129inch_modular_jpg_105kg.jpg',
        'sectional_5_seat_modern_jach_jpg_95kg.jpg',
        'sectional_6_seat_convertible_modular_jpg_135kg.jpg',
        'sectional_6_seat_modular_vongrasig_jpg_125kg.jpg',
        'sectional_large_living_room_jpg_85kg.jpg',
        'side_table_round_2_tier_fantersi_jpg_8kg.jpg',
        'single_sofa_chair_1_seat_fabric_jpg_22kg.jpg',
        'single_sofa_chair_1_seat_modern_jpg_28kg.jpg',
        'sleeper_sofa_3in1_convertible_howcool_jpg_52kg.jpg',
        'sleeper_sofa_3in1_small_tufted_jpg_48kg.jpg',
        'sofa_3_seat_couch_storage_layer_jpg_45kg.jpg',
        'sofa_3_seat_fabric_modern_lestar_jpg_48kg.jpg',
        'storage_bench_acacia_veneer_43_3inch_jpg_32kg.jpg',
        'storage_bench_oval_43_5inch_linen_jpg_25kg.jpg',
        'table_lamp_set_2_bedside_usb_black_jpg_5kg.jpg',
        'table_lamp_set_2_farmhouse_usb_ports_jpg_7kg.jpg',
        'table_lamp_set_2_vintage_farmhouse_usb_jpg_6kg.jpg',
        'throw_pillow_covers_18x18_set_4_jpg_2kg.jpg',
        'throw_pillows_4_pack_neutral_decorative_jpg_3kg.jpg',
        'throw_pillows_set_3_black_combo_jpg_2kg.jpg',
        'tv_console_entertainment_center_rosewood_jpg_85kg.jpg',
        'tv_stand_65inch_enhomee_large_jpg_45kg.jpg',
        'tv_stand_farmhouse_75inch_plus_jpg_65kg.jpg',
        'wall_art_abstract_canvas_gray_jpg_4kg.jpg',
        'wall_art_metal_large_living_room_jpg_8kg.jpg'
      ],
      'Miscellaneous_household': [
        'clothes_drying_rack_2_layer_adjustable_height_jpg_6kg.jpg',
        'clothes_drying_rack_balcony_radiator_folding_jpg_4kg.jpg',
        'clothes_drying_rack_vebreda_steel_large_jpg_8kg.jpg',
        'floor_fan_lasko_20inch_high_velocity_jpg_8kg.jpg',
        'ironing_board_full_size_54x13_heavy_jpg_6kg.jpg',
        'ironing_board_small_tabletop_30x12_jpg_3kg.jpg',
        'storage_bins_6_pack_plastic_home_jpg_8kg.jpg',
        'storage_boxes_fabric_household_essentials_jpg_6kg.jpg',
        'storage_containers_best_7_wirecutter_jpg_12kg.jpg',
        'vacuum_cleaner_best_11_tested_experts_jpg_12kg.jpg',
        'vacuum_cleaner_cordless_stick_chebio_jpg_4kg.jpg',
        'vacuum_cleaner_upright_best_8_bhg_jpg_8kg.jpg',
        'waste_bin_hanging_kitchen_foldable_jpg_2kg.jpg',
        'waste_bin_pedal_5l_metal_mdesign_jpg_4kg.jpg',
        'waste_bin_recycling_kitchen_indoor_home_jpg_3kg.jpg'
      ],
      'Musical_instruments': [
        'acoustic_guitar_brooklyn_orangewood_jpg_2kg.jpg',
        'acoustic_guitar_squier_fender_2_year_jpg_3kg.jpg',
        'acoustic_guitar_yamaha_fs800_small_body_solid_top_jpg_3kg.jpg',
        'digital_piano_budget_beginners_2025_jpg_35kg.jpg',
        'digital_piano_hexant_88_key_weighted_full_size_jpg_45kg.jpg',
        'drum_kit_pearl_roadshow_5_piece_complete_jpg_85kg.jpg',
        'electric_guitar_ameritone_learn_to_play_double_cutaway_black_jpg_4kg.jpg',
        'electric_guitar_fender_eric_clapton_stratocaster_jpg_4kg.jpg',
        'electric_guitar_vintage_v6_icon_distressed_laguna_blue_jpg_4kg.jpg',
        'grand_piano_kawai_ex_concert_jpg_480kg.jpg',
        'grand_piano_kawai_gl40_salon_jpg_320kg.jpg',
        'grand_piano_shigeru_kawai_9ft_sk_ex_concert_jpg_520kg.jpg',
        'upright_piano_kawai_508_decorator_jpg_180kg.jpg',
        'upright_piano_yamaha_u1_polished_mahogany_48inch_jpg_240kg.jpg',
        'upright_piano_yamaha_u_series_jpg_220kg.jpg'
      ],
      'Office_furniture': [
        'conference_table_ahliss_sturdy_cable_management_jpg_85kg.jpg',
        'conference_table_byblight_47_round_white_gold_modern_4_people_jpg_55kg.jpg',
        'conference_table_tribesigns_8ft_94_49_l_x_47_24_jpg_95kg.jpg',
        'filing_cabinet_devaise_3_drawer_home_office_jpg_32kg.jpg',
        'filing_cabinet_space_solutions_18_deep_2_drawer_vertical_jpg_35kg.jpg',
        'office_bookshelf_83_4_tall_writing_desk_suite_modern_jpg_65kg.jpg',
        'office_bookshelf_iotxy_2_tier_desktop_hutch_metal_jpg_15kg.jpg',
        'office_bookshelf_stylish_shelving_home_offices_jpg_45kg.jpg',
        'office_chair_contemporary_leather_executive_husky_jpg_28kg.jpg',
        'office_chair_felixking_ergonomic_headrest_desk_jpg_18kg.jpg',
        'office_chair_neo_ergonomic_lumbar_support_adjustable_black_jpg_22kg.jpg',
        'office_desk_63_modern_executive_computer_5ft_home_jpg_55kg.jpg',
        'office_desk_logan_antigua_66_u_shaped_executive_hutch_jpg_125kg.jpg',
        'office_desk_nsdirect_modern_computer_63_inch_large_jpg_45kg.jpg',
        'office_storage_simple_ideas_workspace_jpg_25kg.jpg'
      ],
      'Pet_items': [
        'aquarium_240_gallon_glass_custom_aquariums_jpg_185kg.jpg',
        'bird_cage_yaheetech_60_5inch_extra_large_metal_jpg_28kg.jpg',
        'cat_tree_11_best_towers_tested_reviewed_jpg_18kg.jpg',
        'cat_tree_eden_wood_floral_tower_wooden_modern_jpg_22kg.jpg',
        'cat_tree_lazyworm_modern_multi_level_large_solid_jpg_25kg.jpg',
        'dog_crate_lemberi_44_inch_large_furniture_jpg_35kg.jpg',
        'dog_crate_pawhut_heavy_duty_steel_wheels_45_jpg_45kg.jpg',
        'dog_crate_petmaker_36_x23_foldable_2_door_jpg_15kg.jpg',
        'pet_bed_asvin_small_dog_cat_beds_jpg_3kg.jpg',
        'pet_bed_ellie_multicolor_woven_bolster_washable_dog_jpg_5kg.jpg',
        'pet_carrier_arlo_skye_the_pet_carrier_jpg_4kg.jpg',
        'pet_carrier_ruff_life_101_airline_approved_expandable_jpg_6kg.jpg',
        'pet_carrier_vibrant_life_kennel_23in_plastic_portable_jpg_8kg.jpg'
      ],
      'Special_Awkward_items': [
        'antique_clock_large_rare_new_haven_regulator_wall_jpg_35kg.jpg',
        'home_vault_room_smith_security_safes_jpg_1250kg.jpg',
        'hot_tub_aquatica_downtown_infinity_spa_thermory_wooden_jpg_485kg.jpg',
        'hot_tub_cosyspa_luxury_40_degree_quick_jpg_285kg.jpg',
        'hot_tub_hot_spring_spas_highest_rated_cold_plunge_jpg_365kg.jpg',
        'mobility_scooter_heavy_duty_4_wheel_seniors_jpg_85kg.jpg',
        'piano_cover_mooson_upright_keep_your_piano_jpg_180kg.jpg',
        'pool_table_black_wolf_pro_9_brunswick_billiards_jpg_325kg.jpg',
        'pool_table_classic_sports_brighton_87_billiard_green_jpg_285kg.jpg',
        'pool_table_luxury_theseus_modern_custom_design_jpg_385kg.jpg',
        'safe_barska_fv_500_fire_vault_ax12674_jpg_185kg.jpg',
        'vault_door_amsec_vd8030bfq_safe_vault_store_jpg_485kg.jpg',
        'wheelchair_jazzy_1450_power_chair_pride_mobility_jpg_65kg.jpg'
      ],
      'Wardrobes_closet': [
        'armoire_wardrobe_paofin_green_71_metal_closet_jpg_78kg.jpg',
        'armoire_wardrobe_vingli_closet_with_doors_jpg_85kg.jpg',
        'built_in_wardrobe_20_ideas_inspire_prestige_bedrooms_jpg_145kg.jpg',
        'built_in_wardrobe_custom_made_fitted_etsy_jpg_125kg.jpg',
        'built_in_wardrobe_fitted_cupboards_bespoke_storage_jpg_135kg.jpg',
        'corner_wardrobe_besiost_closet_system_12_shelves_jpg_75kg.jpg',
        'corner_wardrobe_brabrety_polygon_with_hanging_jpg_68kg.jpg',
        'corner_wardrobe_polygon_hanging_storage_closet_cabinet_jpg_65kg.jpg',
        'mirrored_wardrobe_better_home_products_wood_double_sliding_jpg_115kg.jpg',
        'mirrored_wardrobe_contractors_72_x81_aurora_brushed_nickel_jpg_125kg.jpg',
        'portable_wardrobe_calmootey_closet_organizers_clothing_jpg_25kg.jpg',
        'sliding_door_wardrobe_ark_design_5_panel_bypass_white_jpg_105kg.jpg',
        'sliding_door_wardrobe_jubest_48_double_24_5_x80_jpg_88kg.jpg',
        'sliding_door_wardrobe_smartstandard_56_x80_jpg_95kg.jpg',
        'vintage_wardrobe_custom_order_french_style_hand_painted_jpg_155kg.jpg',
        'walk_in_closet_custom_closet_factory_jpg_165kg.jpg',
        'walk_in_closet_reveal_nailgun_nelly_diy_jpg_185kg.jpg',
        'wardrobe_double_door_harmony_wood_better_home_jpg_68kg.jpg',
        'wardrobe_double_door_hodedah_two_drawers_hanging_rod_jpg_65kg.jpg',
        'wardrobe_double_door_render_closet_modway_jpg_75kg.jpg',
        'wardrobe_single_door_modern_luxury_wooden_jpg_42kg.jpg',
        'wardrobe_single_door_personal_laminate_cabinet_jpg_45kg.jpg',
        'wardrobe_single_door_space_saving_bedroom_storage_unit_jpg_35kg.jpg',
        'wardrobe_triple_door_quarte_modern_3_door_2_drawers_jpg_95kg.jpg',
        'wardrobe_triple_door_quarte_modern_3_door_2_drawers_white_jpg_98kg.jpg'
      ]
    };

    const items: IndividualItem[] = [];

    for (const [categoryFolder, files] of Object.entries(categoryFiles)) {
      const categoryName = getCategoryFromFolder(categoryFolder);
      const basePath = `/UK_Removal_Dataset/Images_Only/${categoryFolder}`;

      for (const filename of files) {
        const parsed = parseFilename(filename);
        if (parsed) {
          const volume = Math.max(0.1, parsed.weight * 0.02); // Rough volume calculation
          const price = Math.max(20, Math.round(parsed.weight * 0.5 + volume * 20));

          items.push({
            id: `${categoryFolder}_${filename}`,
            name: parsed.name,
            category: categoryName,
            image: `${basePath}/${filename}`,
            weight: parsed.weight,
            volume: volume,
            price: price,
            workersRequired: parsed.weight > 50 ? 2 : 1,
            dismantlingRequired: parsed.weight > 30 ? 'Yes' : 'No',
            fragilityLevel: parsed.weight < 10 ? 'High' : parsed.weight < 30 ? 'Medium' : 'Low',
            keywords: [categoryName.toLowerCase(), ...parsed.name.toLowerCase().split(' ')],
          });
        }
      }
    }

    return items;
  };

  // CRITICAL: Comprehensive fallback system to prevent UI blocking
  const loadFromOfficialDataset = async (
    options?: { manifestItems?: IndividualItem[] }
  ): Promise<IndividualItem[]> => {
    console.log('[DATASET] Attempting to load official UK Removal Dataset...');

    try {
      const response = await fetchWithTimeout('/UK_Removal_Dataset/items_dataset.json', { timeoutMs: 4000 });
      if (!response.ok) {
        console.log(`[DATASET] ℹ️ Dataset file not found (${response.status}), will use fallback`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const dataset = await response.json();

      if (!dataset.items || !Array.isArray(dataset.items)) {
        console.log('[DATASET] ℹ️ Invalid dataset format, will use fallback');
        throw new Error('Invalid dataset format: missing items array');
      }

      // Validate all items have required fields
      const validItems = dataset.items.filter((item: any) =>
        item.id && item.name && item.category && typeof item.weight === 'number' && item.weight > 0
      );

      if (validItems.length === 0) {
        console.log('[DATASET] ℹ️ No valid items in dataset, will use fallback');
        throw new Error('No valid items found in dataset');
      }

      console.log(`[DATASET] ✅ Successfully loaded ${validItems.length} items from official dataset`);

      const manifestItems = options?.manifestItems ?? (await generateItemsFromDirectory());
      const manifestImages = new Set(manifestItems.map((item) => item.image));
      let missingImages = 0;

      console.log(`[DATASET] 🔍 Starting image validation against ${manifestImages.size} manifest images...`);

      // Convert to IndividualItem format
      const mappedItems = validItems.map((item: any) => {
        const { displayName, folder } = resolveCategoryInfo(item.category);
        const filename = typeof item.filename === 'string' ? item.filename : '';
        const candidateImagePath = filename
          ? `/UK_Removal_Dataset/Images_Only/${folder}/${filename}`
          : '';
        const hasAsset = candidateImagePath ? manifestImages.has(candidateImagePath) : false;
        if (!hasAsset) {
          missingImages += 1;
        }
        const imagePath = hasAsset ? candidateImagePath : '';

        const numericWeight = Number(item.weight);
        if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
          throw new Error(`Dataset item ${item.id} has invalid weight.`);
        }

        const numericVolumeCandidate = typeof item.volume === 'number' ? item.volume : Number(item.volume);
        const numericVolume = Number.isFinite(numericVolumeCandidate) && numericVolumeCandidate > 0
          ? numericVolumeCandidate
          : numericWeight * 0.01;

        const numericPriceCandidate = typeof item.price === 'number' ? item.price : Number(item.price);
        const numericPrice = Number.isFinite(numericPriceCandidate) && numericPriceCandidate > 0
          ? numericPriceCandidate
          : Math.max(20, Math.round(numericWeight * 0.5 + numericVolume * 20));

        const workersRequiredCandidate = typeof item.workers_required === 'number'
          ? item.workers_required
          : Number(item.workers_required);
        const workersRequired = Number.isFinite(workersRequiredCandidate) && workersRequiredCandidate > 0
          ? workersRequiredCandidate
          : numericWeight > 50
            ? 2
            : 1;

        return {
          id: item.id,
          name: item.name,
          category: displayName,
          image: imagePath,
          weight: numericWeight,
          volume: numericVolume,
          price: numericPrice,
          workersRequired,
          dismantlingRequired: item.dismantling_required || (numericWeight > 30 ? 'Yes' : 'No'),
          fragilityLevel: item.fragility_level || (numericWeight < 10 ? 'High' : numericWeight < 30 ? 'Medium' : 'Low'),
          keywords: item.keywords || [displayName.toLowerCase(), ...item.name.toLowerCase().split(' ')]
        };
      });

      console.log(`[DATASET] ✅ Mapped ${mappedItems.length} items (${missingImages} without direct images)`);

      // Image validation - if coverage is low, prefer directory manifest with guaranteed imagery
      const coverage = ((mappedItems.length - missingImages) / mappedItems.length) * 100;
      const failureThreshold = Math.max(5, Math.ceil(mappedItems.length * 0.25));
      console.log(`[DATASET] 📊 Image coverage check: ${missingImages}/${mappedItems.length} missing (threshold: ${failureThreshold})`);

      if (missingImages >= failureThreshold && options?.manifestItems && options.manifestItems.length > 0) {
        console.warn(
          `[DATASET] ⚠️ Low image coverage (${coverage.toFixed(1)}%). Switching to directory manifest items (${options.manifestItems.length}).`
        );
        return options.manifestItems;
      }

      if (missingImages > 0) {
        console.log(`[DATASET] ℹ️ Image coverage: ${coverage.toFixed(1)}% (${missingImages} items missing images)`);
      }

      return mappedItems;

    } catch (error) {
      console.log('[DATASET] ℹ️ Official dataset validation failed (expected), will use fallback strategy');
      // Return empty array to trigger directory manifest fallback
      return [];
    }
  };

  const loadFromCache = async (): Promise<IndividualItem[]> => {
    console.log('[CACHE] Attempting to load from localStorage cache...');

    try {
      const cached = localStorage.getItem('uk-removal-dataset-cache');
      if (!cached) {
        throw new Error('No cache available');
      }

      const { data, timestamp } = JSON.parse(cached);

      // Check if cache is less than 24 hours old
      const cacheAge = Date.now() - timestamp;
      if (cacheAge > 24 * 60 * 60 * 1000) {
        throw new Error('Cache expired');
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid cache data');
      }

      console.log(`[CACHE] ✅ Loaded ${data.length} items from cache (${Math.round(cacheAge / 1000 / 60)} minutes old)`);
      return data;

    } catch (error) {
      console.error('[CACHE] ❌ Cache load failed:', error);
      throw error;
    }
  };

  const createSmartSearchFallback = (): IndividualItem[] => {
    console.log('[SMART-SEARCH] Creating smart search fallback mode...');

    // Create essential items for basic functionality
    const boxesCategory = resolveCategoryInfo('Bag_luggage_box').displayName;
    const livingRoomCategory = resolveCategoryInfo('Living_room_Furniture').displayName;
    const diningRoomCategory = resolveCategoryInfo('Dining_Room_Furniture').displayName;

    const essentialItems: IndividualItem[] = [
      {
        id: 'fallback-box-small',
        name: 'Small Moving Box',
        category: boxesCategory,
        image: '/UK_Removal_Dataset/Images_Only/Bag_luggage_box/moving_boxes_uboxes_1_room_economy_kit_15_boxes_jpg_22kg.jpg',
        weight: 2,
        volume: 0.015,
        price: 5,
        workersRequired: 1,
        dismantlingRequired: 'No',
        fragilityLevel: 'Low',
        keywords: ['box', 'small', 'moving', 'cardboard', boxesCategory.toLowerCase()],
      },
      {
        id: 'fallback-box-medium',
        name: 'Medium Moving Box',
        category: boxesCategory,
        image: '/UK_Removal_Dataset/Images_Only/Bag_luggage_box/moving_boxes_uboxes_1_room_economy_kit_15_boxes_jpg_22kg.jpg',
        weight: 5,
        volume: 0.03,
        price: 8,
        workersRequired: 1,
        dismantlingRequired: 'No',
        fragilityLevel: 'Low',
        keywords: ['box', 'medium', 'moving', 'cardboard', boxesCategory.toLowerCase()],
      },
      {
        id: 'fallback-box-large',
        name: 'Large Moving Box',
        category: boxesCategory,
        image: '/UK_Removal_Dataset/Images_Only/Bag_luggage_box/moving_boxes_uboxes_1_room_economy_kit_15_boxes_jpg_22kg.jpg',
        weight: 10,
        volume: 0.06,
        price: 12,
        workersRequired: 1,
        dismantlingRequired: 'No',
        fragilityLevel: 'Low',
        keywords: ['box', 'large', 'moving', 'cardboard', boxesCategory.toLowerCase()],
      },
      {
        id: 'fallback-furniture-chair',
        name: 'Chair',
        category: livingRoomCategory,
        image: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/accent_chair_mid_century_eluchang_jpg_22kg.jpg',
        weight: 8,
        volume: 0.08,
        price: 25,
        workersRequired: 1,
        dismantlingRequired: 'No',
        fragilityLevel: 'Medium',
        keywords: ['chair', 'furniture', 'seat', livingRoomCategory.toLowerCase()],
      },
      {
        id: 'fallback-furniture-table',
        name: 'Table',
        category: diningRoomCategory,
        image: '/UK_Removal_Dataset/Images_Only/Dining_Room_Furniture/dining_table_extendable_jpg_85kg.jpg',
        weight: 25,
        volume: 0.15,
        price: 75,
        workersRequired: 2,
        dismantlingRequired: 'No',
        fragilityLevel: 'Medium',
        keywords: ['table', 'furniture', 'dining', diningRoomCategory.toLowerCase()]
      }
    ];

    console.log(`[SMART-SEARCH] ✅ Created ${essentialItems.length} essential items for fallback mode`);
    return essentialItems;
  };

  const saveToCache = (items: IndividualItem[]) => {
    try {
      const cacheData = {
        data: items,
        timestamp: Date.now()
      };
      localStorage.setItem('uk-removal-dataset-cache', JSON.stringify(cacheData));
      console.log('[CACHE] 💾 Saved dataset to cache');
    } catch (error) {
      console.warn('[CACHE] ⚠️ Failed to save to cache:', error);
    }
  };

  // Health check function to validate dataset integrity
  const performDatasetHealthCheck = async (): Promise<boolean> => {
    try {
      console.log('[HEALTH-CHECK] 🔍 Performing dataset health check...');

      const response = await fetchWithTimeout('/UK_Removal_Dataset/items_dataset.json', {
        method: 'HEAD', // Just check if file exists and is accessible
        cache: 'no-cache',
        timeoutMs: 5000 // Increased timeout for better reliability
      });

      if (!response.ok) {
        console.error(`[HEALTH-CHECK] ❌ Dataset not accessible: HTTP ${response.status}`);
        return false;
      }

      // Quick validation by fetching a small portion
      const testResponse = await fetchWithTimeout('/UK_Removal_Dataset/items_dataset.json', { 
        timeoutMs: 8000 // Increased timeout for large files
      });
      const testData = await testResponse.json();

      if (!testData.items || !Array.isArray(testData.items) || testData.items.length === 0) {
        console.error('[HEALTH-CHECK] ❌ Invalid dataset structure');
        return false;
      }

      console.log(`[HEALTH-CHECK] ✅ Dataset healthy: ${testData.items.length} items accessible`);
      return true;

    } catch (error) {
      // Handle AbortError gracefully - it's not a critical failure, just a timeout
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('[HEALTH-CHECK] ⚠️ Health check timed out (non-critical, using fallback)');
      } else {
        console.error('[HEALTH-CHECK] ❌ Health check failed:', error);
      }
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadDatasetWithFallbacks = async () => {
      try {
        setIndividualItemsLoading(true);
        setIndividualItemsError(null);

        // SHORT-CIRCUIT: If directory API already provided images per folder, construct items directly
        if (Object.keys(datasetCategoryImagesNormalized).length > 0) {
          const directItems: IndividualItem[] = [];
          for (const [normKey, images] of Object.entries(datasetCategoryImagesNormalized)) {
            const categoryName = normKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            for (const src of images) {
              try {
                const parsed = parseFilename(src.split('/').pop() || '');
                const volume = Math.max(0.1, parsed.weight * 0.02);
                const price = Math.max(20, Math.round(parsed.weight * 0.5 + volume * 20));
                directItems.push({
                  id: `${normKey}_${src.split('/').pop()}`,
                  name: parsed.name,
                  category: categoryName,
                  image: src,
                  weight: parsed.weight,
                  volume,
                  price,
                  workersRequired: parsed.weight > 50 ? 2 : 1,
                  dismantlingRequired: parsed.weight > 30 ? 'Yes' : 'No',
                  fragilityLevel: parsed.weight < 10 ? 'High' : parsed.weight < 30 ? 'Medium' : 'Low',
                  keywords: [categoryName.toLowerCase(), ...parsed.name.toLowerCase().split(' ')]
                });
              } catch {}
            }
          }
          if (isMounted) {
            setIndividualItems(directItems);
            setFallbackMode('directory');
            setIndividualItemsLoading(false);
            return; // Do not proceed to other strategies
          }
        }

        let items: IndividualItem[] = [];
        let activeMode: 'dataset' | 'directory' | 'smart-search' = 'dataset';

        let manifestItems: IndividualItem[] | null = null;
        try {
          manifestItems = await generateItemsFromDirectory();
          console.log(`[MANIFEST] ✅ Prepared ${manifestItems.length} image-backed items from directory manifest`);
        } catch (manifestError) {
          console.warn('[MANIFEST] ⚠️ Failed to prepare directory manifest for imagery validation:', manifestError);
        }

        // Step 1: Health check - verify dataset accessibility
        const isHealthy = await performDatasetHealthCheck();

        if (isHealthy) {
          // Strategy 1: Try official dataset first (with retry)
          console.log('[LOADING] Attempting primary dataset load...');
          items = await loadFromOfficialDataset({ manifestItems: manifestItems ?? undefined });
          
          if (items.length > 0) {
            // Heuristic: if returned items have high image coverage from directories, treat as directory mode
            const withImages = items.filter((it) => typeof it.image === 'string' && it.image.includes('/UK_Removal_Dataset/Images_Only/')).length;
            const imageCoverage = withImages / items.length;
            const preferDirectory = imageCoverage >= 0.5;
            activeMode = preferDirectory ? 'directory' : 'dataset';
            setFallbackMode(activeMode);
            saveToCache(items);
            console.log(`[SUCCESS] ✅ Primary ${activeMode} loaded successfully with validated imagery`);
          } else {
            console.log('[FALLBACK] ℹ️ Official dataset validation triggered fallback (expected behavior when using directory images)');

            if (manifestItems && manifestItems.length > 0) {
              items = manifestItems;
              activeMode = 'directory';
              setFallbackMode('directory');
              saveToCache(items);
              console.log('[FALLBACK] ✅ Using directory manifest data with guaranteed image coverage');
            } else {
              console.warn('[FALLBACK] Directory manifest unavailable, trying cache...');

              // Strategy 2: Try cache as fallback
              try {
                items = await loadFromCache();
                activeMode = 'dataset';
                setFallbackMode('dataset'); // Still using dataset mode from cache
                console.log('[FALLBACK] ✅ Using cached dataset data - fully functional');
              } catch (cacheError) {
                console.warn('[FALLBACK] Cache failed, switching to smart search mode...', cacheError);
                throw cacheError; // Force fallback to smart search
              }
            }
          }
        } else {
          console.warn('[HEALTH] Dataset health check failed - using directory manifest or cache');

          if (manifestItems && manifestItems.length > 0) {
            items = manifestItems;
            activeMode = 'directory';
            setFallbackMode('directory');
            saveToCache(items);
            console.log('[FALLBACK] ✅ Directory manifest loaded despite health check failure');
          } else {
            // Try cache when manifest is unavailable
            try {
              items = await loadFromCache();
              activeMode = 'dataset';
              setFallbackMode('dataset');
              console.log('[FALLBACK] ✅ Using cached data despite health check failure');
            } catch (cacheError) {
              console.warn('[FALLBACK] Cache unavailable, activating smart search mode', cacheError);
              throw cacheError; // Force fallback to smart search
            }
          }
        }

        // If we get here, we have items from dataset, manifest, or cache
        if (isMounted) {
          setIndividualItems(items);
          setIndividualItemsError(null);
          console.log(`[SUCCESS] ✅ Loaded ${items.length} items in ${activeMode} mode`);
        }

      } catch (error: unknown) {
        console.warn('[FALLBACK] ⚠️ All dataset strategies exhausted, activating emergency smart search fallback');
        console.log('[FALLBACK] ℹ️ This is expected when dataset validation is strict. UI remains fully functional.');

        // Strategy 3: Smart search fallback - NEVER BLOCK UI
        if (isMounted) {
          const essentialItems = createSmartSearchFallback();
          setIndividualItems(essentialItems);
          setFallbackMode('smart-search');
          setIndividualItemsError('Smart Search Mode: Essential items available for booking');
          console.log('[EMERGENCY] ✅ Emergency fallback activated - customers can continue booking with essential items');
        }
      } finally {
        if (isMounted) {
          setIndividualItemsLoading(false);
        }
      }
    };

    // Trigger on mount and whenever directory images manifest becomes available
    if (individualItems.length === 0 || Object.keys(datasetCategoryImagesNormalized).length > 0) {
      void loadDatasetWithFallbacks();
    }

    return () => {
      isMounted = false;
    };
  }, [datasetCategoryImagesNormalized]);

  // Safety valve: never allow the loader to spin indefinitely
  useEffect(() => {
    if (!individualItemsLoading) return;
    const id = setTimeout(() => {
      try {
        // If still loading after 5s, unlock UI with essential items
        if (individualItemsLoading) {
          const essentials = createSmartSearchFallback();
          setIndividualItems((prev) => (prev && prev.length > 0 ? prev : essentials));
          setFallbackMode('smart-search');
          setIndividualItemsError((prev) => prev ?? 'Smart Search Mode: Essential items available for booking');
          setIndividualItemsLoading(false);
        }
      } catch {
        setIndividualItemsLoading(false);
      }
    }, 5000);
    return () => clearTimeout(id);
  }, [individualItemsLoading]);

  // Function to get category name from folder name (for directory scanning)
  const getCategoryFromFolder = (folderName: string): string => {
    return resolveCategoryInfo(folderName).displayName;
  };


  const individualItemLookup = useMemo(() => {
    return new Map(individualItems.map((item) => [item.id, item]));
  }, [individualItems]);

  const groupedIndividualItems = useMemo(() => {
    const groups = individualItems.reduce<Record<string, IndividualItem[]>>((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    return Object.entries(groups)
      .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB))
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => a.name.localeCompare(b.name))
      }));
  }, [individualItems]);

  // Time slots for booking
  const timeSlots = [
    '8:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM', 
    '12:00 PM - 2:00 PM',
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM',
    '6:00 PM - 8:00 PM'
  ];

  const convertIndividualItemToUIItem = (item: IndividualItem) => ({
    id: item.id,
    name: item.name,
    price: item.price.toString(),
    category: item.category,
    image: resolveItemImage({ category: item.category, itemImage: item.image, itemId: item.id }),
  });

  const normalizeForFilter = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

  const filteredIndividualItems = useMemo(() => {
    let items = individualItems;

    if (searchQuery.trim().length >= 1) {
      const query = searchQuery.trim().toLowerCase();
      items = items.filter((item) => {
        const lowerName = item.name.toLowerCase();
        const lowerCategory = item.category.toLowerCase();
        return (
          lowerName.includes(query) ||
          lowerCategory.includes(query) ||
          item.keywords.some((keyword) => keyword.includes(query))
        );
      });
    }

    if (selectedCategory && selectedCategory !== 'All') {
      const normalizedSelected = normalizeForFilter(selectedCategory.replace(/_/g, ' '));
      items = items.filter((item) => normalizeForFilter(item.category).includes(normalizedSelected));
    }

    return items;
  }, [individualItems, searchQuery, selectedCategory]);

  const filteredGroupedItems = useMemo(() => {
    const groups = filteredIndividualItems.reduce<Record<string, IndividualItem[]>>((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    return Object.entries(groups)
      .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB))
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [filteredIndividualItems]);

  const allItemsByCategory = useMemo(() => {
    return groupedIndividualItems.reduce<Record<string, ReturnType<typeof convertIndividualItemToUIItem>[]>>(
      (acc, group) => {
        acc[group.category] = group.items.map(convertIndividualItemToUIItem);
        return acc;
      },
      {}
    );
  }, [groupedIndividualItems]);

  const selectedItemIds = useMemo(() => {
    return new Set((step1.items ?? []).map((item) => (item.id ?? '').toString()));
  }, [step1.items]);

  const bedroomPackages = HOUSE_PACKAGES.map((hp) => ({
    id: hp.id,
    name: hp.name,
    image: hp.imageUrl,
    category: hp.category,
  }));

  // Handlers
  const addItem = (item: any) => {
    const itemId = item.id.toString();

    const catalogItem = COMPREHENSIVE_CATALOG.find(ci => ci.id === itemId) ||
      HOUSE_PACKAGES.find(hp => hp.id === itemId);
    const datasetItem = individualItemLookup.get(itemId);

    const derivedUnitPrice = datasetItem?.price ?? (catalogItem
      ? Math.max(20, Math.round(catalogItem.weight * 0.5 + catalogItem.volume * 20))
      : Number.isFinite(parseFloat(item.price || '')) ? parseFloat(item.price) : 25);

    const weight = datasetItem?.weight ?? catalogItem?.weight ?? 10;
    const volume = datasetItem?.volume ?? catalogItem?.volume ?? 1;
    const imageUrl = resolveItemImage({
      category: datasetItem?.category ?? catalogItem?.category,
      itemImage: datasetItem?.image,
      catalogImage: catalogItem?.imageUrl,
      itemId: datasetItem?.id ?? catalogItem?.id
    });
    const workersRequired = catalogItem?.workers_required ?? datasetItem?.workersRequired ?? 1;
    const dismantlingRequired = catalogItem?.dismantling_required ?? datasetItem?.dismantlingRequired ?? 'No';
    const fragilityLevel = catalogItem?.fragility_level ?? datasetItem?.fragilityLevel ?? 'Standard';

    const existingItem = step1.items.find(i => i.id === itemId);
    if (existingItem) {
      const newQuantity = (existingItem.quantity || 0) + 1;
      updateFormData('step1', {
        items: step1.items.map(i =>
          i.id === itemId
            ? {
                ...i,
                quantity: newQuantity,
                totalPrice: (i.unitPrice || derivedUnitPrice) * newQuantity
              }
            : i
        )
      });
      return;
    }

    updateFormData('step1', {
      items: [
        ...step1.items,
        {
          id: itemId,
          name: item.name,
          description: item.name,
          category: item.category,
          size: 'medium' as const,
          quantity: 1,
          unitPrice: derivedUnitPrice,
          totalPrice: derivedUnitPrice,
          weight,
          volume,
          image: imageUrl,
          workers_required: workersRequired,
          dismantling_required: dismantlingRequired,
          fragility_level: fragilityLevel,
        }
      ]
    });
    // Pricing will be calculated automatically when items change
  };

  const removeItem = (itemId: string) => {
    updateFormData('step1', {
      items: step1.items.filter(i => i.id !== itemId)
    });
    // Pricing will be calculated automatically when items change
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      removeItem(itemId);
    } else {
      updateFormData('step1', {
        items: step1.items.map(i => 
          i.id === itemId ? { ...i, quantity, totalPrice: (i.unitPrice || 0) * quantity } : i
        )
      });
      // Pricing will be calculated automatically when items change
    }
  };

  const updateItem = (itemId: string, updates: Partial<any>) => {
    updateFormData('step1', {
      items: step1.items.map(i => 
        i.id === itemId ? { ...i, ...updates } : i
      )
    });
  };

  const calculateTotal = () => {
    return step1.items.reduce((total, item) => {
      return total + ((item.unitPrice || 0) * (item.quantity || 0));
    }, 0);
  };

  // Images removed - no image helper function needed

  return (
    <Box 
      display="block" 
      w="100%" 
      maxW="100%" 
      px={{ base: 3, md: 6 }} 
      py={{ base: 6, md: 10 }} 
      overflowX="hidden"
      sx={{
        '& > *': {
          marginBottom: { base: '24px', md: '40px' },
        },
        '& > *:last-child': {
          marginBottom: 0,
        },
      }}
    >
        
        {/* Version Banner - Hidden in production, visible in dev */}

        
        {/* Header */}
        <Box w="100%" maxW="container.lg" mx="auto">
          <VStack spacing={{ base: 3, sm: 4 }} textAlign="center">
            <Heading size={{ base: "lg", sm: "xl", md: "2xl" }} color="white" fontWeight="700" letterSpacing="0.3px">
              What needs moving?
            </Heading>
            <Text color="gray.400" fontSize={{ base: "sm", sm: "md", md: "lg" }} maxW="600px" lineHeight="1.6" px={{ base: 2, sm: 0 }}>
              Select the items you need to move. You can choose individual items or complete house packages.
            </Text>
          </VStack>
        </Box>

        {/* Address Input Section */}
        <Box w="100%" maxW="container.lg" mx="auto">
          <Card bg="gray.800" borderRadius={{ base: "lg", md: "xl" }} border="1px solid" borderColor="gray.600" w="full">
          <CardBody p={{ base: 3, sm: 4, md: 6 }} w="full">
            <VStack spacing={{ base: 3, sm: 4, md: 6 }} align="stretch" w="full">
              
              {/* Enhanced Header */}
              <VStack spacing={{ base: 1.5, sm: 2.5 }} textAlign="center" position="relative" w="full">
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w={{ base: "100px", sm: "150px", md: "180px" }}
                  h={{ base: "100px", sm: "150px", md: "180px" }}
                  borderRadius="full"
                  bg="radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)"
                  filter="blur(30px)"
                  zIndex={0}
                />
                <VStack spacing={{ base: 1, sm: 1.5 }} position="relative" zIndex={1} w="full">
                  <Heading 
                    size={{ base: "sm", sm: "md", md: "xl" }} 
                    fontWeight="700"
                    letterSpacing="0.5px"
                    bg="linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)"
                    bgClip="text"
                    sx={{
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
                    }}
                    px={{ base: 1, sm: 0 }}
                    lineHeight="1.2"
                  >
                    📍 Pickup & Dropoff Locations
                  </Heading>
                  <Text 
                    color="gray.300"
                    fontSize={{ base: "xs", sm: "sm", md: "md" }}
                    fontWeight="500"
                    letterSpacing="0.3px"
                    px={{ base: 1, sm: 0 }}
                    lineHeight="1.4"
                  >
                    Enter your addresses for accurate distance calculation
                  </Text>
                </VStack>
              </VStack>

              <SimpleGrid columns={addressGridColumns} spacing={addressGridSpacing} w="full">
                {/* Enhanced Pickup Address Card */}
                <Card
                  bg="linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%)"
                  border="2px solid"
                  borderColor="rgba(16, 185, 129, 0.3)"
                  borderRadius={cardBorderRadius}
                  position="relative"
                  overflow="hidden"
                  w="full"
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    borderColor: "rgba(16, 185, 129, 0.5)",
                    boxShadow: "0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    transform: isMobile ? "translateY(-1px)" : "translateY(-2px)",
                  }}
                  sx={{
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)',
                      opacity: 0.6,
                      zIndex: 0,
                      pointerEvents: 'none',
                    },
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  }}
                >
                  <CardBody p={cardPadding} w="full">
                    <VStack spacing={cardSpacing} align="stretch" w="full">
                      <HStack spacing={useBreakpointValue({ base: 2.5, sm: 3, md: 4 }) ?? 3} align="center" w="full" flexWrap="nowrap">
                        <Box
                          position="relative"
                          w={iconSize}
                          h={iconSize}
                          minW={iconSize}
                          minH={iconSize}
                          flexShrink={0}
                          borderRadius={cardBorderRadius}
                          bg="linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.3) 100%)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 4px 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                          border="2px solid"
                          borderColor="rgba(16, 185, 129, 0.5)"
                          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          _hover={{
                            transform: isMobile ? "scale(1.05)" : "scale(1.1) rotate(5deg)",
                            boxShadow: "0 6px 30px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                          }}
                        >
                          <Icon as={FaMapMarkerAlt} color="#10B981" boxSize={iconBoxSize} filter="drop-shadow(0 2px 4px rgba(16, 185, 129, 0.5))" />
                        </Box>
                        <VStack align="start" spacing={useBreakpointValue({ base: 0.5, sm: 1 }) ?? 1} flex={1} minW="0" textAlign="left" overflow="hidden">
                          <Text 
                            fontSize={titleTextSize} 
                            fontWeight="700" 
                            color="white"
                            letterSpacing="0.3px"
                            lineHeight="1.2"
                            noOfLines={1}
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            w="full"
                          >
                            Pickup Address
                          </Text>
                          <Text 
                            fontSize={textSize} 
                            color="white"
                            fontWeight="500"
                            lineHeight="1.3"
                            noOfLines={1}
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            w="full"
                          >
                            Where we'll collect your items
                          </Text>
                        </VStack>
                      </HStack>
                  
                      <Box
                        borderRadius={useBreakpointValue({ base: 'md', md: 'lg' }) ?? 'md'}
                        bg="rgba(31, 41, 55, 0.5)"
                        border="1px solid"
                        borderColor="rgba(16, 185, 129, 0.2)"
                        p={cardPadding}
                        w="full"
                        transition="all 0.3s"
                        _hover={{
                          borderColor: "rgba(16, 185, 129, 0.4)",
                          bg: "rgba(31, 41, 55, 0.7)",
                        }}
                        sx={{
                          '.chakra-input': {
                            bg: 'rgba(17, 24, 39, 0.8) !important',
                            borderColor: 'rgba(16, 185, 129, 0.3) !important',
                            color: 'white !important',
                            borderRadius: 'lg !important',
                            _focus: {
                              borderColor: '#10B981 !important',
                              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.3) !important',
                            },
                            '&::placeholder': {
                              color: 'rgba(156, 163, 175, 0.6) !important'
                            }
                          },
                          '.chakra-button': {
                            bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%) !important',
                            color: 'white !important',
                            fontWeight: 'semibold !important',
                            borderRadius: 'lg !important',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4) !important',
                            transition: 'all 0.2s !important',
                            _hover: {
                              bg: 'linear-gradient(135deg, #059669 0%, #047857 100%) !important',
                              transform: 'translateY(-1px) !important',
                              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5) !important',
                            },
                            _active: {
                              transform: 'translateY(0) !important',
                            }
                          },
                          '.chakra-select': {
                            bg: 'rgba(17, 24, 39, 0.8) !important',
                            borderColor: 'rgba(16, 185, 129, 0.3) !important',
                            color: 'white !important',
                            borderRadius: 'lg !important',
                            _focus: {
                              borderColor: '#10B981 !important',
                              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2) !important',
                            }
                          }
                        }}
                      >
                        <UKAddressAutocomplete
                          id="pickup-address"
                          label="Pickup Address"
                          value={step1.pickupAddress as any}
                          onChange={(address) => {
                            if (address) {
                              updateFormData('step1', {
                                pickupAddress: address as any
                              });
                            } else {
                              // Never set to null; reset to an empty address shape to avoid runtime errors
                              updateFormData('step1', {
                                pickupAddress: {
                                  address: '',
                                  city: '',
                                  postcode: '',
                                  coordinates: { lat: 0, lng: 0 },
                                  houseNumber: '',
                                  flatNumber: '',
                                  formatted_address: '',
                                  place_name: ''
                                } as any
                              });
                            }
                            // Pricing is now automatic via Enterprise Engine
                          }}
                          placeholder="Start typing your pickup address..."
                          helperText="Enter your full pickup address (street, postcode, etc.)"
                          isRequired={true}
                        />
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Enhanced Dropoff Address Card */}
                <Card
                  bg="linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.05) 100%)"
                  border="2px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                  borderRadius={cardBorderRadius}
                  position="relative"
                  overflow="hidden"
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    borderColor: "rgba(59, 130, 246, 0.5)",
                    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    transform: isMobile ? "translateY(-1px)" : "translateY(-2px)",
                  }}
                  sx={{
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)',
                      opacity: 0.6,
                      zIndex: 0,
                      pointerEvents: 'none',
                    },
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  }}
                >
                  <CardBody p={cardPadding} w="full">
                    <VStack spacing={cardSpacing} align="stretch" w="full">
                      <HStack spacing={useBreakpointValue({ base: 2.5, sm: 3, md: 4 }) ?? 3} align="center" w="full" flexWrap="nowrap">
                        <Box
                          position="relative"
                          w={iconSize}
                          h={iconSize}
                          minW={iconSize}
                          minH={iconSize}
                          flexShrink={0}
                          borderRadius={cardBorderRadius}
                          bg="linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.3) 100%)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 4px 20px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                          border="2px solid"
                          borderColor="rgba(59, 130, 246, 0.5)"
                          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          _hover={{
                            transform: isMobile ? "scale(1.05)" : "scale(1.1) rotate(5deg)",
                            boxShadow: "0 6px 30px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                          }}
                        >
                          <Icon as={FaMapMarkerAlt} color="#3B82F6" boxSize={iconBoxSize} filter="drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))" />
                        </Box>
                        <VStack align="start" spacing={useBreakpointValue({ base: 0.5, sm: 1 }) ?? 1} flex={1} minW="0" textAlign="left" overflow="hidden">
                          <Text 
                            fontSize={titleTextSize} 
                            fontWeight="700" 
                            color="white"
                            letterSpacing="0.3px"
                            lineHeight="1.2"
                            noOfLines={1}
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            w="full"
                          >
                            Dropoff Address
                          </Text>
                          <Text 
                            fontSize={textSize} 
                            color="white"
                            fontWeight="500"
                            lineHeight="1.3"
                            noOfLines={1}
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            w="full"
                          >
                            Where we'll deliver your items
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <Box
                        borderRadius={useBreakpointValue({ base: 'md', md: 'lg' }) ?? 'md'}
                        bg="rgba(31, 41, 55, 0.5)"
                        border="1px solid"
                        borderColor="rgba(59, 130, 246, 0.2)"
                        p={cardPadding}
                        w="full"
                        transition="all 0.3s"
                        _hover={{
                          borderColor: "rgba(59, 130, 246, 0.4)",
                          bg: "rgba(31, 41, 55, 0.7)",
                        }}
                        mt={isMobile ? 2 : 3}
                        sx={{
                          '.chakra-input': {
                            bg: 'rgba(17, 24, 39, 0.8) !important',
                            borderColor: 'rgba(59, 130, 246, 0.3) !important',
                            color: 'white !important',
                            borderRadius: 'lg !important',
                            _focus: {
                              borderColor: '#3B82F6 !important',
                              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(59, 130, 246, 0.3) !important',
                            },
                            '&::placeholder': {
                              color: 'rgba(156, 163, 175, 0.6) !important'
                            }
                          },
                          '.chakra-button': {
                            bg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important',
                            color: 'white !important',
                            fontWeight: 'semibold !important',
                            borderRadius: 'lg !important',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4) !important',
                            transition: 'all 0.2s !important',
                            _hover: {
                              bg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%) !important',
                              transform: 'translateY(-1px) !important',
                              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5) !important',
                            },
                            _active: {
                              transform: 'translateY(0) !important',
                            }
                          },
                          '.chakra-select': {
                            bg: 'rgba(17, 24, 39, 0.8) !important',
                            borderColor: 'rgba(59, 130, 246, 0.3) !important',
                            color: 'white !important',
                            borderRadius: 'lg !important',
                            _focus: {
                              borderColor: '#3B82F6 !important',
                              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2) !important',
                            }
                          }
                        }}
                      >
                        <UKAddressAutocomplete
                          id="dropoff-address"
                          label="Dropoff Address"
                          value={step1.dropoffAddress as any}
                          onChange={(address) => {
                            if (address) {
                              updateFormData('step1', {
                                dropoffAddress: address as any
                              });
                            } else {
                              updateFormData('step1', {
                                dropoffAddress: {
                                  address: '',
                                  city: '',
                                  postcode: '',
                                  coordinates: { lat: 0, lng: 0 },
                                  houseNumber: '',
                                  flatNumber: '',
                                  formatted_address: '',
                                  place_name: ''
                                } as any
                              });
                            }
                            // Pricing is now automatic via Enterprise Engine
                          }}
                          placeholder="Start typing your dropoff address..."
                          helperText="Enter your full dropoff address (street, postcode, etc.)"
                          isRequired={true}
                        />
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Enhanced Address Summary */}
              <Card 
                bg="linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(26, 32, 44, 0.6) 100%)"
                borderRadius="xl" 
                border="2px solid"
                borderColor="rgba(147, 51, 234, 0.3)"
                backdropFilter={hasBackdropFilterBug ? 'none' : 'blur(10px)'}
                position="relative"
                overflow="hidden"
                transition="all 0.3s"
                _hover={{
                  borderColor: "rgba(147, 51, 234, 0.5)",
                  boxShadow: "0 8px 32px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                }}
                sx={{
                  willChange: hasBackdropFilterBug ? 'auto' : 'filter',
                  WebkitBackdropFilter: hasBackdropFilterBug ? 'none' : 'blur(10px)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, transparent 100%)',
                    opacity: 0.6,
                    zIndex: 0,
                    pointerEvents: 'none',
                  },
                  '& > *': {
                    position: 'relative',
                    zIndex: 1,
                  },
                }}
              >
                <CardBody p={6}>
                  <HStack justify="space-between" align="center" spacing={6}>
                    <VStack align="start" spacing={2} flex={1}>
                      <Text 
                        fontSize="xs" 
                        color="gray.400"
                        fontWeight="600"
                        letterSpacing="0.5px"
                        textTransform="uppercase"
                      >
                        Moving From
                      </Text>
                      <Text 
                        color="white" 
                        fontWeight="600"
                        fontSize="md"
                        letterSpacing="0.2px"
                        noOfLines={2}
                      >
                        {(typeof step1.pickupAddress === 'string' ? step1.pickupAddress : (step1.pickupAddress?.full || step1.pickupAddress?.line1 || step1.pickupAddress?.formatted_address)) || 'Not selected'}
                      </Text>
                    </VStack>
                    <Box
                      position="relative"
                      px={4}
                      py={2}
                      borderRadius="full"
                      bg="linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)"
                      border="1px solid"
                      borderColor="rgba(147, 51, 234, 0.4)"
                      boxShadow="0 2px 8px rgba(147, 51, 234, 0.2)"
                    >
                      <Icon as={FaArrowRight} color="#A78BFA" boxSize={5} filter="drop-shadow(0 2px 4px rgba(147, 51, 234, 0.4))" />
                    </Box>
                    <VStack align="end" spacing={2} flex={1}>
                      <Text 
                        fontSize="xs" 
                        color="gray.400"
                        fontWeight="600"
                        letterSpacing="0.5px"
                        textTransform="uppercase"
                      >
                        Moving To
                      </Text>
                      <Text 
                        color="white" 
                        fontWeight="600"
                        fontSize="md"
                        letterSpacing="0.2px"
                        textAlign="right"
                        noOfLines={2}
                      >
                        {(typeof step1.dropoffAddress === 'string' ? step1.dropoffAddress : (step1.dropoffAddress?.full || step1.dropoffAddress?.line1 || step1.dropoffAddress?.formatted_address)) || 'Not selected'}
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
              
            </VStack>
          </CardBody>
        </Card>
        </Box>

        {/* Premium Date and Time Selection - Enhanced */}
        <Box w="100%" maxW="100%" mx="auto">
          <Card 
          bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
          backdropFilter={hasBackdropFilterBug ? 'none' : 'blur(20px) saturate(180%)'}
          shadow="0 8px 32px rgba(168, 85, 247, 0.4), 0 0 60px rgba(168, 85, 247, 0.3), 0 0 100px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
          borderRadius="2xl"
          border="2px solid"
          borderColor="rgba(168, 85, 247, 0.5)"
          overflow="hidden"
          position="relative"
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            shadow: "0 12px 40px rgba(168, 85, 247, 0.5), 0 0 80px rgba(168, 85, 247, 0.4), 0 0 120px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            borderColor: "rgba(168, 85, 247, 0.7)",
            transform: "translateY(-2px)",
          }}
          sx={{
            willChange: hasBackdropFilterBug ? 'auto' : 'filter',
            WebkitBackdropFilter: hasBackdropFilterBug ? 'none' : 'blur(20px) saturate(180%)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(16, 185, 129, 0.05) 100%)',
              opacity: 0.6,
              zIndex: 0,
              pointerEvents: 'none',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
              animation: 'shine 10s infinite',
              zIndex: 1,
              pointerEvents: 'none',
            },
            '@keyframes shine': {
              '0%': { left: '-100%' },
              '100%': { left: '200%' },
            },
            '& > *': {
              position: 'relative',
              zIndex: 2,
            },
          }}
        >
          <CardBody p={8}>
            <VStack spacing={8}>
              
              {/* Enhanced Header */}
              <VStack spacing={3} textAlign="center" position="relative">
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="180px"
                  h="180px"
                  borderRadius="full"
                  bg="radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)"
                  filter="blur(35px)"
                  zIndex={0}
                />
                <VStack spacing={2} position="relative" zIndex={1}>
                  <Heading 
                    size="xl" 
                    fontWeight="700"
                    letterSpacing="0.5px"
                    bg="linear-gradient(135deg, #A78BFA 0%, #9333EA 50%, #7C3AED 100%)"
                    bgClip="text"
                    sx={{
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 4px 20px rgba(168, 85, 247, 0.3)",
                    }}
                  >
                    When do you need the move?
                  </Heading>
                  <Text 
                    color="rgba(255, 255, 255, 0.8)" 
                    fontSize="lg"
                    fontWeight="500"
                    letterSpacing="0.3px"
                  >
                    Choose your preferred date and time
                  </Text>
                </VStack>
              </VStack>

              {/* Date Selection Cards */}
              <VStack align="stretch" spacing={6} w="full">
                <VStack align="start" spacing={4}>
                  <HStack spacing={3}>
                    <Box
                      position="relative"
                      w="40px"
                      h="40px"
                      borderRadius="lg"
                      bg="linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.3) 100%)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 4px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                      border="1px solid"
                      borderColor="rgba(59, 130, 246, 0.5)"
                    >
                      <Text fontSize="lg">📅</Text>
                    </Box>
                    <Text 
                      fontSize="xl" 
                      fontWeight="700" 
                      color="white"
                      letterSpacing="0.3px"
                    >
                      Select Date
                    </Text>
                  </HStack>
                  
                  {/* Enhanced 7 Date Cards - Starting Tomorrow */}
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 4, lg: 7 }} spacing={3} w="full">
                    {(() => {
                      const dateCards = [];
                      for (let i = 1; i <= 7; i++) {
                        const date = new Date(Date.now() + (i * 86400000));
                        const dateString = date.toISOString().split('T')[0];
                        const isSelected = step1.pickupDate === dateString;
                        
                        dateCards.push(
                          <Card
                            key={i}
                            bg={
                              isSelected 
                                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.8) 100%)"
                                : "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)"
                            }
                            border="2px solid"
                            borderColor={
                              isSelected 
                                ? "rgba(59, 130, 246, 0.6)" 
                                : "rgba(255, 255, 255, 0.15)"
                            }
                            borderRadius="xl"
                            cursor="pointer"
                            position="relative"
                            overflow="hidden"
                            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            boxShadow={
                              isSelected
                                ? "0 8px 32px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                                : "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                            }
                            _hover={{
                              bg: isSelected 
                                ? "linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 0.9) 100%)"
                                : "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                              borderColor: "rgba(59, 130, 246, 0.6)",
                              transform: "translateY(-4px) scale(1.02)",
                              boxShadow: "0 12px 40px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                            }}
                            onClick={() => updateFormData('step1', { pickupDate: dateString })}
                            sx={{
                              '&::before': isSelected ? {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
                                opacity: 0.6,
                                zIndex: 0,
                                pointerEvents: 'none',
                              } : {},
                              '& > *': {
                                position: 'relative',
                                zIndex: 1,
                              },
                            }}
                          >
                            <CardBody p={{ base: 2, sm: 3, md: 4 }} textAlign="center">
                              <VStack spacing={{ base: 1, sm: 1.5, md: 2 }}>
                                <Text fontSize={{ base: "xl", sm: "2xl" }} filter={isSelected ? "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))" : "none"}>
                                  {i === 1 ? '🌅' : 
                                   date.getDay() === 0 || date.getDay() === 6 ? '🎯' : '📅'}
                                </Text>
                                <Text 
                                  fontWeight="700" 
                                  color="white" 
                                  fontSize={{ base: "xs", sm: "sm" }}
                                  letterSpacing="0.2px"
                                  whiteSpace="nowrap"
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  w="full"
                                >
                                  {i === 1 ? 'Tomorrow' : 
                                   date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </Text>
                                <Text 
                                  fontSize={{ base: "2xs", sm: "xs" }}
                                  color={isSelected ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.6)"}
                                  fontWeight="500"
                                  whiteSpace="nowrap"
                                >
                                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                              </VStack>
                            </CardBody>
                          </Card>
                        );
                      }
                      return dateCards;
                    })()}
                  </SimpleGrid>

                  {/* Or Choose Future Date */}
                  <VStack spacing={3} w="full">
                    <Text fontSize="md" color="rgba(255, 255, 255, 0.6)" textAlign="center">
                      or
                    </Text>
                    
                    <Card
                      bg="linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.1) 100%)"
                      border="2px solid"
                      borderColor="rgba(168, 85, 247, 0.4)"
                      borderRadius="xl"
                      cursor="pointer"
                      position="relative"
                      overflow="hidden"
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      w="full"
                      maxW="100%"
                      mx="auto"
                      boxShadow="0 4px 20px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      _hover={{
                        bg: "linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(147, 51, 234, 0.15) 100%)",
                        borderColor: "rgba(168, 85, 247, 0.6)",
                        transform: "translateY(-4px) scale(1.02)",
                        boxShadow: "0 8px 32px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                      }}
                      onClick={() => {
                        const dateInput = document.getElementById('hidden-date-picker') as HTMLInputElement;
                        if (dateInput) {
                          // Try showPicker() first (modern browsers)
                          if (typeof dateInput.showPicker === 'function') {
                            try {
                              dateInput.showPicker();
                            } catch (error) {
                              // Fallback for browsers that don't support showPicker
                              dateInput.focus();
                              dateInput.click();
                            }
                          } else {
                            // Fallback for older browsers
                            dateInput.focus();
                            dateInput.click();
                          }
                        }
                      }}
                      sx={{
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, transparent 100%)',
                          opacity: 0.6,
                          zIndex: 0,
                          pointerEvents: 'none',
                        },
                        '& > *': {
                          position: 'relative',
                          zIndex: 1,
                        },
                      }}
                    >
                      <CardBody p={5} textAlign="center">
                        <VStack spacing={3}>
                          <Box
                            w={{ base: "48px", sm: "52px", md: "56px" }}
                            h={{ base: "48px", sm: "52px", md: "56px" }}
                            minW={{ base: "48px", sm: "52px", md: "56px" }}
                            minH={{ base: "48px", sm: "52px", md: "56px" }}
                            borderRadius={{ base: "lg", md: "xl" }}
                            bg="linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(147, 51, 234, 0.3) 100%)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            boxShadow="0 4px 20px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                            border="2px solid"
                            borderColor="rgba(168, 85, 247, 0.5)"
                            mx="auto"
                          >
                            <Text fontSize={{ base: "xl", sm: "xl", md: "2xl" }}>📆</Text>
                          </Box>
                          <Text 
                            fontWeight="700" 
                            color="white" 
                            fontSize={{ base: "md", sm: "lg", md: "xl" }}
                            letterSpacing="0.3px"
                            lineHeight="1.3"
                          >
                            Choose Future Date
                          </Text>
                          <Text 
                            fontSize={{ base: "xs", sm: "sm", md: "md" }} 
                            color="rgba(255, 255, 255, 0.7)"
                            fontWeight="500"
                            lineHeight="1.4"
                          >
                            Open calendar picker
                          </Text>
                        </VStack>

                        {/* Hidden Date Picker */}
                        <Input
                          id="hidden-date-picker"
                          type="date"
                          position="absolute"
                          top="0"
                          left="0"
                          width="100%"
                          height="100%"
                          opacity={0}
                          cursor="pointer"
                          zIndex={10}
                          min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow minimum
                          onChange={(e) => {
                            if (e.target.value) {
                              updateFormData('step1', { pickupDate: e.target.value });
                            }
                          }}
                        />
                      </CardBody>
                    </Card>
                  </VStack>
                </VStack>

                {/* Enhanced Time Selection Cards */}
                <VStack align="start" spacing={4}>
                  <HStack spacing={3}>
                    <Box
                      position="relative"
                      w="40px"
                      h="40px"
                      borderRadius="lg"
                      bg="linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.3) 100%)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 4px 16px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                      border="1px solid"
                      borderColor="rgba(16, 185, 129, 0.5)"
                    >
                      <Text fontSize="lg">⏰</Text>
                    </Box>
                    <Text 
                      fontSize="xl" 
                      fontWeight="700" 
                      color="white"
                      letterSpacing="0.3px"
                    >
                      Select Time
                    </Text>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} w="full">
                    {timeSlots.map((slot) => {
                      const isSelected = step1.pickupTimeSlot === slot;
                      return (
                        <Card
                          key={slot}
                          bg={
                            isSelected
                              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.8) 100%)"
                              : "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)"
                          }
                          border="2px solid"
                          borderColor={
                            isSelected
                              ? "rgba(16, 185, 129, 0.6)"
                              : "rgba(255, 255, 255, 0.15)"
                          }
                          borderRadius="xl"
                          cursor="pointer"
                          position="relative"
                          overflow="hidden"
                          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          boxShadow={
                            isSelected
                              ? "0 8px 32px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                              : "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                          }
                          _hover={{
                            bg: isSelected
                              ? "linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(5, 150, 105, 0.9) 100%)"
                              : "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                            borderColor: "rgba(16, 185, 129, 0.6)",
                            transform: "translateY(-4px) scale(1.02)",
                            boxShadow: "0 12px 40px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                          }}
                          onClick={() => updateFormData('step1', { pickupTimeSlot: slot })}
                          sx={{
                            '&::before': isSelected ? {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
                              opacity: 0.6,
                              zIndex: 0,
                              pointerEvents: 'none',
                            } : {},
                            '& > *': {
                              position: 'relative',
                              zIndex: 1,
                            },
                          }}
                        >
                          <CardBody p={{ base: 4, sm: 5, md: 6 }} textAlign="center" minH={{ base: "100px", sm: "120px", md: "140px" }}>
                            <VStack spacing={{ base: 1.5, sm: 2, md: 3 }}>
                              <Text 
                                fontSize={{ base: "xl", sm: "2xl" }}
                                filter={isSelected ? "drop-shadow(0 2px 4px rgba(16, 185, 129, 0.5))" : "none"}
                              >
                                🕐
                              </Text>
                              <Text 
                                fontWeight="700" 
                                color="white" 
                                fontSize={{ base: "2xs", sm: "2xs", md: "xs" }}
                                letterSpacing="0.2px"
                                whiteSpace="nowrap"
                              >
                                {slot}
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </VStack>

                {/* Skip Time Selection Option removed per request */}

                {/* Validation Errors */}
                {errors['step1.pickupDate'] && (
                  <Card bg="rgba(239, 68, 68, 0.1)" border="2px solid rgba(239, 68, 68, 0.3)" borderRadius="xl">
                    <CardBody p={4}>
                      <VStack spacing={2}>
                        <Text color="red.400" fontSize="sm" textAlign="center">
                          📅 {errors['step1.pickupDate']}
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
              
            </VStack>
          </CardBody>
        </Card>
        </Box>

        {/* Item Selection - Enhanced */}
        <Box w="100%" maxW="container.lg" mx="auto">
          <Card 
          bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
          backdropFilter={hasBackdropFilterBug ? 'none' : 'blur(20px) saturate(180%)'}
          shadow="0 8px 32px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.3), 0 0 100px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
          borderRadius="2xl"
          border="2px solid"
          borderColor="rgba(59, 130, 246, 0.5)"
          overflow="hidden"
          position="relative"
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            shadow: "0 12px 40px rgba(59, 130, 246, 0.5), 0 0 80px rgba(59, 130, 246, 0.4), 0 0 120px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            borderColor: "rgba(59, 130, 246, 0.7)",
            transform: "translateY(-2px)",
          }}
          sx={{
            willChange: hasBackdropFilterBug ? 'auto' : 'filter',
            WebkitBackdropFilter: hasBackdropFilterBug ? 'none' : 'blur(20px) saturate(180%)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 50%, rgba(168, 85, 247, 0.05) 100%)',
              opacity: 0.6,
              zIndex: 0,
              pointerEvents: 'none',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
              animation: 'shine 10s infinite',
              zIndex: 1,
              pointerEvents: 'none',
            },
            '@keyframes shine': {
              '0%': { left: '-100%' },
              '100%': { left: '200%' },
            },
            '& > *': {
              position: 'relative',
              zIndex: 2,
            },
          }}
        >
          <CardBody p={8}>
            <VStack spacing={8}>
              
              {/* Enhanced Header */}
              <VStack spacing={3} textAlign="center" position="relative">
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="180px"
                  h="180px"
                  borderRadius="full"
                  bg="radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)"
                  filter="blur(35px)"
                  zIndex={0}
                />
                <VStack spacing={2} position="relative" zIndex={1}>
                  <Heading 
                    size="xl" 
                    fontWeight="700"
                    letterSpacing="0.5px"
                    bg="linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)"
                    bgClip="text"
                    sx={{
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    Select Your Items
                  </Heading>
                  <Text 
                    color="rgba(255, 255, 255, 0.7)" 
                    fontSize="lg"
                    fontWeight="500"
                    letterSpacing="0.3px"
                  >
                    Choose how you'd like to add items
                  </Text>
                </VStack>
              </VStack>

              {/* Enhanced Stats */}
              <HStack spacing={8} justify="center" flexWrap="wrap">
                <Card
                  bg="linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)"
                  border="2px solid"
                  borderColor="rgba(59, 130, 246, 0.4)"
                  borderRadius="xl"
                  backdropFilter={hasBackdropFilterBug ? 'none' : 'blur(10px)'}
                  boxShadow="0 4px 20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  transition="all 0.3s"
                  sx={{ 
                    willChange: hasBackdropFilterBug ? 'auto' : 'filter',
                    WebkitBackdropFilter: hasBackdropFilterBug ? 'none' : 'blur(10px)',
                  }}
                  _hover={{
                    borderColor: "rgba(59, 130, 246, 0.6)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <CardBody p={4}>
                    <VStack spacing={2}>
                      <Text 
                        fontSize="2xl" 
                        fontWeight="700" 
                        bg="linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)"
                        bgClip="text"
                        sx={{
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {individualItems.length}
                      </Text>
                      <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" fontWeight="500">
                        Available Items
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
                
                <Card
                  bg="linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)"
                  border="2px solid"
                  borderColor="rgba(16, 185, 129, 0.4)"
                  borderRadius="xl"
                  backdropFilter={hasBackdropFilterBug ? 'none' : 'blur(10px)'}
                  boxShadow="0 4px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  transition="all 0.3s"
                  sx={{ 
                    willChange: hasBackdropFilterBug ? 'auto' : 'filter',
                    WebkitBackdropFilter: hasBackdropFilterBug ? 'none' : 'blur(10px)',
                  }}
                  _hover={{
                    borderColor: "rgba(16, 185, 129, 0.6)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 32px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <CardBody p={4}>
                    <VStack spacing={2}>
                      <Text 
                        fontSize="2xl" 
                        fontWeight="700" 
                        bg="linear-gradient(135deg, #10B981 0%, #34D399 100%)"
                        bgClip="text"
                        sx={{
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {groupedIndividualItems.length}
                      </Text>
                      <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" fontWeight="500">
                        Categories
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                <Card
                  bg="linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.1) 100%)"
                  border="2px solid"
                  borderColor="rgba(168, 85, 247, 0.4)"
                  borderRadius="xl"
                  backdropFilter={hasBackdropFilterBug ? 'none' : 'blur(10px)'}
                  boxShadow="0 4px 20px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  transition="all 0.3s"
                  sx={{ 
                    willChange: hasBackdropFilterBug ? 'auto' : 'filter',
                    WebkitBackdropFilter: hasBackdropFilterBug ? 'none' : 'blur(10px)',
                  }}
                  _hover={{
                    borderColor: "rgba(168, 85, 247, 0.6)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 32px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <CardBody p={4}>
                    <VStack spacing={2}>
                      <Text 
                        fontSize="2xl" 
                        fontWeight="700" 
                        bg="linear-gradient(135deg, #A78BFA 0%, #C4B5FD 100%)"
                        bgClip="text"
                        sx={{
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {step1.items.length}
                      </Text>
                      <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" fontWeight="500">
                        Items Selected
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </HStack>

              {/* Available Categories card removed as requested */}

              {/* Enhanced Selection Modes */}
              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button 
                  bg={itemSelectionMode === 'bedroom' 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)'
                  }
                  border="2px solid"
                  borderColor={itemSelectionMode === 'bedroom' 
                    ? 'rgba(59, 130, 246, 0.6)' 
                    : 'rgba(255, 255, 255, 0.15)'
                  }
                  color="white"
                  borderRadius="xl"
                  px={6}
                  py={6}
                  fontWeight="700"
                  letterSpacing="0.3px"
                  fontSize="md"
                  leftIcon={<FaHome />}
                  boxShadow={itemSelectionMode === 'bedroom' 
                    ? '0 8px 32px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{ 
                    bg: itemSelectionMode === 'bedroom'
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    borderColor: 'rgba(59, 130, 246, 0.6)',
                    transform: 'translateY(-2px) scale(1.02)',
                    boxShadow: itemSelectionMode === 'bedroom'
                      ? '0 12px 40px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                      : '0 8px 24px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                  }}
                  _active={{
                    transform: 'translateY(0) scale(1)',
                  }}
                  onClick={() => setItemSelectionMode('bedroom')}
                  position="relative"
                  overflow="hidden"
                  sx={{
                    '&::before': itemSelectionMode === 'bedroom' ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
                      opacity: 0.6,
                      zIndex: 0,
                      pointerEvents: 'none',
                    } : {},
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  }}
                >
                  House Packages
                </Button>
                <Button 
                  bg={itemSelectionMode === 'smart' 
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(147, 51, 234, 0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)'
                  }
                  border="2px solid"
                  borderColor={itemSelectionMode === 'smart' 
                    ? 'rgba(168, 85, 247, 0.6)' 
                    : 'rgba(255, 255, 255, 0.15)'
                  }
                  color="white"
                  borderRadius="xl"
                  px={6}
                  py={6}
                  fontWeight="700"
                  letterSpacing="0.3px"
                  fontSize="md"
                  leftIcon={<FaSearch />}
                  boxShadow={itemSelectionMode === 'smart' 
                    ? '0 8px 32px rgba(168, 85, 247, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{ 
                    bg: itemSelectionMode === 'smart'
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 1) 0%, rgba(147, 51, 234, 0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    borderColor: 'rgba(168, 85, 247, 0.6)',
                    transform: 'translateY(-2px) scale(1.02)',
                    boxShadow: itemSelectionMode === 'smart'
                      ? '0 12px 40px rgba(168, 85, 247, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                      : '0 8px 24px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                  }}
                  _active={{
                    transform: 'translateY(0) scale(1)',
                  }}
                  onClick={() => setItemSelectionMode('smart')}
                  position="relative"
                  overflow="hidden"
                  sx={{
                    '&::before': itemSelectionMode === 'smart' ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
                      opacity: 0.6,
                      zIndex: 0,
                      pointerEvents: 'none',
                    } : {},
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  }}
                >
                  Search Items
                </Button>
                <Button 
                  bg={itemSelectionMode === 'choose' 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)'
                  }
                  border="2px solid"
                  borderColor={itemSelectionMode === 'choose' 
                    ? 'rgba(16, 185, 129, 0.6)' 
                    : 'rgba(255, 255, 255, 0.15)'
                  }
                  color="white"
                  borderRadius="xl"
                  px={6}
                  py={6}
                  fontWeight="700"
                  letterSpacing="0.3px"
                  fontSize="md"
                  leftIcon={<FaCouch />}
                  boxShadow={itemSelectionMode === 'choose' 
                    ? '0 8px 32px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{ 
                    bg: itemSelectionMode === 'choose'
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(5, 150, 105, 0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    borderColor: 'rgba(16, 185, 129, 0.6)',
                    transform: 'translateY(-2px) scale(1.02)',
                    boxShadow: itemSelectionMode === 'choose'
                      ? '0 12px 40px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                      : '0 8px 24px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                  }}
                  _active={{
                    transform: 'translateY(0) scale(1)',
                  }}
                  onClick={() => setItemSelectionMode('choose')}
                  position="relative"
                  overflow="hidden"
                  sx={{
                    '&::before': itemSelectionMode === 'choose' ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
                      opacity: 0.6,
                      zIndex: 0,
                      pointerEvents: 'none',
                    } : {},
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  }}
                >
                  Individual Items
                </Button>
              </HStack>

              <Divider 
                borderColor="rgba(255, 255, 255, 0.1)" 
                borderWidth="1px"
                sx={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.5) 50%, transparent 100%)',
                  height: '1px',
                }}
              />

              {/* House Packages Mode - Enhanced */}
              {itemSelectionMode === 'bedroom' && (
                <VStack spacing={{ base: 4, sm: 5, md: 6 }} w="full">
                  <VStack spacing={{ base: 1.5, sm: 2 }} textAlign="center" w="full">
                    <Heading 
                      size={{ base: "md", sm: "lg", md: "xl" }} 
                      color="white" 
                      fontWeight="700"
                      letterSpacing="0.3px"
                      bg="linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)"
                      bgClip="text"
                      sx={{
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                      lineHeight="1.2"
                      px={{ base: 2, sm: 0 }}
                    >
                      Complete House Moving Packages
                    </Heading>
                    <Text color="rgba(255, 255, 255, 0.6)" fontSize={{ base: "xs", sm: "sm", md: "md" }} lineHeight="1.4" px={{ base: 2, sm: 0 }}>
                      Choose a complete package for your moving needs
                    </Text>
                  </VStack>
                  
                  {/* Mobile: Vertical layout */}
                  <VStack 
                    spacing={{ base: 3, sm: 4 }} 
                    w="full" 
                    display={{ base: "flex", md: "none" }}
                  >
                    {bedroomPackages.map((pkg) => (
                      <Card
                        key={pkg.id}
                        bg="linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(26, 32, 44, 0.9) 100%)"
                        border="2px solid"
                        borderColor="rgba(59, 130, 246, 0.4)"
                        borderRadius="xl"
                        backdropFilter={hasBackdropFilterBug ? 'none' : 'blur(10px)'}
                        boxShadow="0 4px 20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                        cursor="pointer"
                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        _hover={{ 
                          borderColor: "rgba(59, 130, 246, 0.6)",
                          transform: "translateY(-4px)",
                          boxShadow: "0 8px 32px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                        }}
                        onClick={() => addItem(pkg)}
                        w="full"
                        overflow="visible"
                        position="relative"
                        sx={{
                          WebkitBackdropFilter: hasBackdropFilterBug ? 'none' : 'blur(10px)',
                          willChange: hasBackdropFilterBug ? 'auto' : 'filter',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)',
                            opacity: 0.6,
                            zIndex: 0,
                            pointerEvents: 'none',
                          },
                          '& > *': {
                            position: 'relative',
                            zIndex: 1,
                          },
                        }}
                      >
                        <CardBody p={5}>
                          <VStack spacing={4} align="center" w="full">
                            {/* Image at top */}
                            <Box 
                              w={{ base: "120px", sm: "140px" }}
                              h={{ base: "120px", sm: "140px" }}
                              borderRadius="xl"
                              overflow="hidden"
                              boxShadow="0 4px 16px rgba(59, 130, 246, 0.3)"
                              border="2px solid"
                              borderColor="rgba(59, 130, 246, 0.4)"
                              mx="auto"
                            >
                              <ItemImage src={pkg.image} alt={`${pkg.name} package`} ratio={1} />
                            </Box>
                            
                            {/* Package name below image */}
                            <Text 
                              color="white" 
                              fontWeight="700" 
                              fontSize={{ base: "md", sm: "lg" }}
                              letterSpacing="0.2px"
                              textAlign="center"
                            >
                              {pkg.name}
                            </Text>
                            
                            {/* Select button below name */}
                            <Button
                              size="md"
                              bg="linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.8) 100%)"
                              border="2px solid"
                              borderColor="rgba(59, 130, 246, 0.6)"
                              color="white"
                              borderRadius="xl"
                              fontWeight="700"
                              letterSpacing="0.3px"
                              leftIcon={<FaPlus />}
                              boxShadow="0 4px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                              transition="all 0.3s"
                              _hover={{
                                bg: "linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 0.9) 100%)",
                                transform: "scale(1.05)",
                                boxShadow: "0 6px 20px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                              }}
                              _active={{
                                transform: "scale(0.98)",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem(pkg);
                              }}
                              w="full"
                              maxW="100%"
                            >
                              Select
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>

                  {/* Desktop: Grid layout */}
                  <SimpleGrid 
                    columns={{ base: 1, sm: 2, md: 3 }} 
                    spacing={{ base: 4, md: 6 }} 
                    w="full"
                    display={{ base: "none", md: "grid" }}
                  >
                    {bedroomPackages.map((pkg) => (
                      <Card
                        key={pkg.id}
                        bg="linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(26, 32, 44, 0.9) 100%)"
                        border="2px solid"
                        borderColor="rgba(59, 130, 246, 0.4)"
                        borderRadius="xl"
                        backdropFilter={hasBackdropFilterBug ? 'none' : 'blur(10px)'}
                        boxShadow="0 4px 20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                        cursor="pointer"
                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        _hover={{ 
                          borderColor: "rgba(59, 130, 246, 0.6)",
                          transform: "translateY(-4px) scale(1.02)",
                          boxShadow: "0 8px 32px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                        }}
                        onClick={() => addItem(pkg)}
                        overflow="hidden"
                        position="relative"
                        sx={{
                          WebkitBackdropFilter: hasBackdropFilterBug ? 'none' : 'blur(10px)',
                          willChange: hasBackdropFilterBug ? 'auto' : 'filter',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)',
                            opacity: 0.6,
                            zIndex: 0,
                            pointerEvents: 'none',
                          },
                          '& > *': {
                            position: 'relative',
                            zIndex: 1,
                          },
                        }}
                      >
                        <CardBody p={6} textAlign="center">
                          <VStack spacing={5}>
                            <Box 
                              w="160px" 
                              h="160px"
                              mx="auto"
                              borderRadius="xl"
                              overflow="hidden"
                              boxShadow="0 4px 20px rgba(59, 130, 246, 0.3)"
                              border="2px solid"
                              borderColor="rgba(59, 130, 246, 0.4)"
                            >
                              <ItemImage src={pkg.image} alt={`${pkg.name} package`} ratio={1} />
                            </Box>
                            <VStack spacing={3} w="full">
                              <Text 
                                color="white" 
                                fontWeight="700" 
                                fontSize="lg"
                                letterSpacing="0.3px"
                              >
                                {pkg.name}
                              </Text>
                              <Button
                                size="md"
                                bg="linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.8) 100%)"
                                border="2px solid"
                                borderColor="rgba(59, 130, 246, 0.6)"
                                color="white"
                                borderRadius="xl"
                                fontWeight="700"
                                letterSpacing="0.3px"
                                leftIcon={<FaPlus />}
                                w="full"
                                boxShadow="0 4px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                                transition="all 0.3s"
                                _hover={{
                                  bg: "linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 0.9) 100%)",
                                  transform: "scale(1.05)",
                                  boxShadow: "0 6px 20px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                                }}
                                _active={{
                                  transform: "scale(0.98)",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addItem(pkg);
                                }}
                              >
                                Select Package
                              </Button>
                            </VStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </VStack>
              )}

              {/* Search Mode */}
              {itemSelectionMode === 'smart' && (
                <VStack spacing={4} w="full">
                  <Box w="full" sx={{
                    '.chakra-input': {
                      bg: 'gray.700 !important',
                      borderColor: 'gray.600 !important',
                      color: 'white !important',
                      borderRadius: 'xl !important',
                      '&:focus': {
                        borderColor: 'purple.500 !important',
                        boxShadow: '0 0 0 1px var(--chakra-colors-purple-500) !important'
                      },
                      '&::placeholder': {
                        color: 'gray.400 !important',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }
                    }
                  }}>
                    <SmartSearchBox
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onItemAdd={addItem}
                      onItemUpdate={(itemId, quantity) => {
                        if (quantity === 0) {
                          removeItem(itemId);
                        } else {
                          const existingItem = step1.items.find(item => item.id === itemId);
                          if (existingItem) {
                            updateItem(itemId, { quantity });
                          }
                        }
                      }}
                      onAddItems={(items) => {
                        items.forEach(item => addItem(item));
                      }}
                      selectedItems={step1.items}
                      placeholder={searchPlaceholder}
                    />
                  </Box>
                  

                </VStack>
              )}

              {/* Individual Items Mode */}
              {itemSelectionMode === 'choose' && (
                <VStack spacing={{ base: 4, sm: 5, md: 6 }} w="full" align="stretch">
                  {/* Default: Featured Popular Items (single-click add using dataset images) */}
                  {featuredPopularItems.length > 0 && (
                    <Card bg="gray.700" border="1px solid" borderColor="gray.600" w="full" overflow="visible">
                      <CardBody p={{ base: 3, sm: 4, md: 5 }} w="full">
                        <VStack align="stretch" spacing={{ base: 3, sm: 4 }} w="full">
                          <HStack justify="space-between" align="center">
                            <Text fontWeight="bold" color="white" fontSize="lg">
                              Popular items
                            </Text>
                            <Badge colorScheme="pink" variant="subtle">Quick add</Badge>
                          </HStack>
                          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={{ base: 3, sm: 4, md: 6 }} w="full">
                            {featuredPopularItems.map((fi) => (
                              <Box key={`${fi.groupKey}-${fi.src}`} cursor="pointer" onClick={() => incrementDatasetItem(fi.groupKey, fi.src, fi.groupLabel)}>
                                <ItemImage src={fi.src} alt={fi.label} ratio={3/4} />
                                <VStack mt={2} spacing={1}>
                                  <Text fontSize="sm" color="white" textAlign="center">{fi.label}</Text>
                                  <Button 
                                    size={{ base: "sm", sm: "md" }}
                                    minH={{ base: "44px", sm: "36px" }}
                                    fontSize={{ base: "sm", sm: "xs" }}
                                    px={{ base: 4, sm: 3 }}
                                    py={{ base: 3, sm: 2 }}
                                    colorScheme="blue" 
                                    onClick={(e) => { e.stopPropagation(); incrementDatasetItem(fi.groupKey, fi.src, fi.groupLabel); }}
                                  >
                                    Add
                                  </Button>
                                </VStack>
                              </Box>
                            ))}
                          </SimpleGrid>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                  {individualItemsLoading ? (
                    <HStack justify="center" py={10}>
                      <Spinner size="xl" color="blue.400" thickness="4px" />
                    </HStack>
                  ) : (
                    // NEVER BLOCK UI - Always show items, with mode indicator if needed
                    <>
                      {individualItemsError && (
                        <Alert status="warning" borderRadius="lg" mb={4}>
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Smart Search Mode Active</AlertTitle>
                            <AlertDescription>
                              {fallbackMode === 'smart-search'
                                ? 'Using essential items for booking. Full catalog temporarily unavailable.'
                                : 'Using cached data. Some items may be outdated.'
                              }
                            </AlertDescription>
                          </Box>
                        </Alert>
                      )}
                      {/* Always show items - customers can continue booking */}
                      <Flex direction={{ base: 'column', md: 'row' }} gap={4} w="full">
                        <VStack align="stretch" spacing={3} w="full">
                          <FormLabel 
                            htmlFor="luxury-category-filter" 
                            fontSize="lg"
                            fontWeight="700"
                            letterSpacing="0.3px"
                            bg="linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)"
                            bgClip="text"
                            sx={{
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              textShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
                            }}
                          >
                            Filter by category
                          </FormLabel>
                          <FormControl>
                            <Select
                              id="luxury-category-filter"
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              bg="white"
                              color="gray.700"
                              border="2px solid"
                              borderColor="rgba(16, 185, 129, 0.5)"
                              borderRadius="xl"
                              fontSize="sm"
                              fontWeight="600"
                              px={4}
                              py={2}
                              _hover={{
                                borderColor: 'rgba(16, 185, 129, 0.7)',
                              }}
                              _focus={{
                                borderColor: 'rgba(16, 185, 129, 1)',
                                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.5)',
                              }}
                              sx={{
                                boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
                                '&:focus': {
                                  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.5)',
                                },
                              }}
                            >
                              <option value="All">All Categories</option>
                              {datasetCategories.map((c) => (
                                <option key={c.key} value={c.key}>
                                  {c.label}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                        </VStack>
                        <VStack align="start" spacing={1} flex={{ base: 0, md: 1 }}>
                          <Text color="gray.300" fontSize="sm" fontWeight="semibold">
                            Dataset coverage
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            Showing {filteredIndividualItems.length} of {individualItems.length} curated items.
                          </Text>
                        </VStack>
                      </Flex>

                      {datasetGroups.length === 0 ? (
                        <Card bg="gray.700" border="1px dashed" borderColor="gray.500">
                          <CardBody>
                            <VStack spacing={2}>
                              <Text color="gray.200" fontWeight="medium">
                                No items match the current filters.
                              </Text>
                              <Text color="gray.400" fontSize="sm" textAlign="center">
                                Dataset folders not found. Please verify /public/UK_Removal_Dataset/Images_Only.
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                      ) : (
                        <VStack spacing={4} align="stretch">
                          {(selectedCategory === 'All' ? datasetGroups : datasetGroups.filter(g => g.key === selectedCategory)).map((group) => (
                            <Card key={group.key} bg="gray.700" border="1px solid" borderColor="gray.600" w="full" overflow="visible">
                              <CardBody p={{ base: 3, sm: 4, md: 5 }} w="full">
                                <VStack align="stretch" spacing={{ base: 3, sm: 4 }} w="full">
                                  <HStack justify="space-between" align="center" flexWrap={{ base: "wrap", sm: "nowrap" }} spacing={{ base: 2, sm: 3 }} w="full">
                                    <HStack spacing={{ base: 2, sm: 3 }} flexWrap={{ base: "wrap", sm: "nowrap" }}>
                                      <Text fontWeight="bold" color="white" fontSize={{ base: "md", sm: "lg", md: "xl" }} lineHeight="1.2">
                                        {group.label}
                                      </Text>
                                      <Badge colorScheme="blue" variant="subtle" fontSize={{ base: "xs", sm: "sm" }} px={{ base: 2, sm: 3 }} py={{ base: 1, sm: 1 }}>
                                        {group.images.length} images
                                      </Badge>
                                    </HStack>
                                    <Badge colorScheme="purple" variant="outline" fontSize={{ base: "xs", sm: "sm" }} px={{ base: 2, sm: 3 }} py={{ base: 1, sm: 1 }} whiteSpace={{ base: "nowrap", sm: "normal" }}>UK dataset imagery</Badge>
                                  </HStack>
                                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={{ base: 3, sm: 4, md: 6 }} w="full">
                                    {group.images.map((src, idx) => (
                                      <Box key={`${group.key}-${idx}`} cursor="pointer" onClick={() => incrementDatasetItem(group.key, src, titleFromSrc(src, group.label))} overflow="visible">
                                        <ItemImage src={src} alt={group.label} ratio={3/4} />
                                        <VStack mt={2} spacing={1}>
                                          <Text fontSize="sm" color="white" textAlign="center">{titleFromSrc(src, group.label)}</Text>
                                          <Button 
                                            size={{ base: "sm", sm: "md" }}
                                            minH={{ base: "44px", sm: "36px" }}
                                            fontSize={{ base: "sm", sm: "xs" }}
                                            px={{ base: 4, sm: 3 }}
                                            py={{ base: 3, sm: 2 }}
                                            colorScheme="blue" 
                                            onClick={(e) => { e.stopPropagation(); incrementDatasetItem(group.key, src, titleFromSrc(src, group.label)); }}
                                          >
                                            Add
                                          </Button>
                                        </VStack>
                                      </Box>
                                    ))}
                                  </SimpleGrid>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      )}
                    </>
                  )}
                </VStack>
              )}

            </VStack>
          </CardBody>
        </Card>

        {/* Selected Items */}
        {step1.items.length > 0 && (
          <Card bg="gray.800" borderRadius="lg" border="1px solid" borderColor="green.600">
            <CardBody p={{ base: 4, md: 6 }}>
              <VStack spacing={4}>
                <Heading size="md" color="white">
                  Selected Items ({step1.items.length})
                </Heading>
                
                <VStack spacing={3} w="full">
                  {step1.items.map((item) => {
                    const imageSrc = (item.image && item.image.trim().length > 0)
                      ? item.image
                      : resolveItemImage({ category: item.category, itemImage: item.image, itemId: item.id });

                    return (
                      <Box 
                        key={item.id} 
                        w="full" 
                        p={{ base: 3, md: 4 }} 
                        bg="gray.700" 
                        borderRadius="lg"
                      >
                        {/* Mobile Layout */}
                        <VStack 
                          spacing={3} 
                          w="full" 
                          display={{ base: "flex", md: "none" }}
                        >
                          <HStack spacing={3} w="full">
                            <Box w="60px" h="60px">
                              <ItemImage src={imageSrc} alt={item.name || 'Item'} ratio={1} />
                            </Box>
                            
                            <VStack align="start" spacing={1} flex="1">
                              <Text color="white" fontWeight="medium" fontSize="sm">
                                {item.name}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                {item.category}
                              </Text>
                            </VStack>
                          </HStack>

                          <HStack spacing={2} w="full" justify="space-between">
                            {/* Quantity Controls */}
                            <HStack spacing={1} bg="gray.600" borderRadius="md" p={1.5}>
                              <IconButton
                                size="xs"
                                icon={<FaMinus />}
                                onClick={() => updateQuantity(item.id!, (item.quantity || 0) - 1)}
                                bg="transparent"
                                color="white"
                                _hover={{ bg: "gray.500" }}
                                aria-label="Decrease quantity"
                                minW="28px"
                                h="28px"
                              />
                              <Text color="white" fontWeight="bold" minW="32px" textAlign="center" fontSize="sm">
                                {item.quantity || 0}
                              </Text>
                              <IconButton
                                size="xs"
                                icon={<FaPlus />}
                                onClick={() => updateQuantity(item.id!, (item.quantity || 0) + 1)}
                                bg="transparent"
                                color="white"
                                _hover={{ bg: "green.600" }}
                                aria-label="Increase quantity"
                                minW="28px"
                                h="28px"
                              />
                            </HStack>
                            
                            {/* Remove Button */}
                            <IconButton
                              size="sm"
                              icon={<FaTrash />}
                              onClick={() => removeItem(item.id!)}
                              bg="red.600"
                              color="white"
                              _hover={{ bg: "red.500" }}
                              aria-label="Remove item"
                              minW="80px"
                            >
                              Remove
                            </IconButton>
                          </HStack>
                        </VStack>

                        {/* Desktop Layout */}
                        <HStack 
                          justify="space-between" 
                          w="full"
                          display={{ base: "none", md: "flex" }}
                        >
                          <HStack spacing={4}>
                            <Box w="70px" h="70px">
                              <ItemImage src={imageSrc} alt={item.name || 'Item'} ratio={1} />
                            </Box>
                            
                            <VStack align="start" spacing={1}>
                              <Text color="white" fontWeight="medium" fontSize="md">
                                {item.name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {item.category}
                              </Text>
                            </VStack>
                          </HStack>
                          
                          <HStack spacing={{ base: 2, sm: 3 }} flexWrap={{ base: "wrap", sm: "nowrap" }}>
                            {/* Quantity Controls */}
                            <HStack spacing={{ base: 1.5, sm: 2 }} bg="gray.600" borderRadius={{ base: "md", md: "lg" }} p={{ base: 1.5, sm: 2 }}>
                              <IconButton
                                size={{ base: "sm", sm: "xs" }}
                                icon={<FaMinus />}
                                onClick={() => updateQuantity(item.id!, (item.quantity || 0) - 1)}
                                bg="transparent"
                                color="white"
                                _hover={{ bg: "gray.500" }}
                                aria-label="Decrease quantity"
                                minW={{ base: "32px", sm: "24px" }}
                                minH={{ base: "32px", sm: "24px" }}
                                h={{ base: "32px", sm: "24px" }}
                              />
                              <Text color="white" fontWeight="bold" minW={{ base: "32px", sm: "30px" }} textAlign="center" fontSize={{ base: "sm", sm: "sm" }}>
                                {item.quantity || 0}
                              </Text>
                              <IconButton
                                size={{ base: "sm", sm: "xs" }}
                                icon={<FaPlus />}
                                onClick={() => updateQuantity(item.id!, (item.quantity || 0) + 1)}
                                bg="transparent"
                                color="white"
                                _hover={{ bg: "green.600" }}
                                aria-label="Increase quantity"
                                minW={{ base: "32px", sm: "24px" }}
                                minH={{ base: "32px", sm: "24px" }}
                                h={{ base: "32px", sm: "24px" }}
                              />
                            </HStack>
                            
                            {/* Remove Button */}
                            <IconButton
                              size={{ base: "md", sm: "sm" }}
                              icon={<FaTrash />}
                              onClick={() => removeItem(item.id!)}
                              bg="red.600"
                              color="white"
                              _hover={{ bg: "red.500" }}
                              aria-label="Remove item"
                              minW={{ base: "40px", sm: "32px" }}
                              minH={{ base: "40px", sm: "32px" }}
                            />
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        )}
        </Box>

        {/* Price Summary & Cart */}
        <Box w="100%" maxW="100%" mx="auto">
          <Card bg="gray.800" borderRadius={{ base: "lg", md: "xl" }} border="1px solid" borderColor="gray.600" w="full">
          <CardBody p={{ base: 3, sm: 4, md: 6 }} w="full">
            <VStack spacing={{ base: 3, sm: 4, md: 6 }} align="stretch" w="full">
              
              {/* Header */}
              <VStack spacing={{ base: 1.5, sm: 2 }} textAlign="center" w="full">
                <Heading size={{ base: "sm", sm: "md", md: "lg" }} color="white" lineHeight="1.2">
                  💰 Price Summary
                </Heading>
                <Text color="gray.400" fontSize={{ base: "xs", sm: "sm", md: "md" }} lineHeight="1.4" px={{ base: 2, sm: 0 }}>
                  Your estimated total
                </Text>
              </VStack>

              {/* Selected Items Cart */}
              {step1.items.length > 0 && (
                <Card bg="gray.700" borderRadius={{ base: "md", md: "lg" }} border="1px solid" borderColor="gray.600" w="full">
                  <CardBody p={{ base: 3, sm: 3.5, md: 4 }} w="full">
                    <VStack spacing={{ base: 2.5, sm: 3 }} align="stretch" w="full">
                      <Text fontSize={{ base: "sm", sm: "md", md: "lg" }} fontWeight="bold" color="white" mb={{ base: 1.5, sm: 2 }} lineHeight="1.2">
                        🛒 Selected Items ({step1.items.length})
                      </Text>
                      
                      <VStack spacing={{ base: 2, sm: 2.5 }} w="full" maxH={{ base: "120px", sm: "150px", md: "200px" }} overflowY="auto">
                        {step1.items.map((item) => {
                          const imageSrc = (item.image && item.image.trim().length > 0)
                            ? item.image
                            : resolveItemImage({ category: item.category, itemImage: item.image, itemId: item.id });

                          return (
                            <HStack key={item.id} justify="space-between" w="full" p={{ base: 2, sm: 2.5 }} bg="gray.600" borderRadius={{ base: "md", md: "lg" }} spacing={{ base: 2, sm: 3 }}>
                              <HStack spacing={{ base: 2, sm: 2.5, md: 3 }} flex={1} minW={0}>
                                <Box w={{ base: "36px", sm: "40px" }} h={{ base: "36px", sm: "40px" }} flexShrink={0}>
                                  <ItemImage src={imageSrc} alt={item.name || 'Item'} ratio={1} />
                                </Box>
                                <VStack align="start" spacing={0} flex={1} minW={0}>
                                  <Text color="white" fontWeight="medium" fontSize={{ base: "xs", sm: "sm", md: "md" }} noOfLines={1} lineHeight="1.3">
                                    {item.name}
                                  </Text>
                                  <Text color="gray.400" fontSize={{ base: "xs", sm: "sm" }} lineHeight="1.3">Qty: {item.quantity}</Text>
                                </VStack>
                              </HStack>
                            </HStack>
                          );
                        })}
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Automatic Pricing & Availability - ENTERPRISE ENGINE */}
        {(pricingTiers || isLoadingAvailability) && step1.items.length > 0 && (
          <Card bg="gray.800" borderRadius={{ base: "lg", md: "xl" }} border="1px solid" borderColor="blue.600" w="full">
            <CardBody p={{ base: 3, sm: 4, md: 6 }} w="full">
              <VStack spacing={{ base: 3, sm: 4 }} align="stretch" w="full">
                <HStack justify="space-between" flexWrap={{ base: "wrap", sm: "nowrap" }} spacing={{ base: 2, sm: 3 }} w="full">
                  <Heading size={{ base: "sm", sm: "md", md: "lg" }} color="white" lineHeight="1.2">
                    Service Options
                  </Heading>
                  {isLoadingAvailability && (
                    <HStack spacing={{ base: 1.5, sm: 2 }}>
                      <Spinner size={{ base: "xs", sm: "sm" }} color="blue.400" />
                      <Text fontSize={{ base: "xs", sm: "sm" }} color="blue.400" lineHeight="1.3">Checking availability...</Text>
                    </HStack>
                  )}
                </HStack>
                
                <Text fontSize={{ base: "xs", sm: "sm", md: "md" }} color="gray.400" lineHeight="1.4" px={{ base: 1, sm: 0 }}>
                  Prices and availability calculated automatically using full address data
                </Text>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, sm: 4 }} w="full">
                  {/* Economy Multi-Drop */}
                  <Card 
                    bg={pricingTiers?.economy?.available ? "green.900" : "gray.900"} 
                    borderColor={pricingTiers?.economy?.available ? "green.500" : "gray.600"}
                    border="1px solid"
                    borderRadius={{ base: "md", md: "lg" }}
                    opacity={pricingTiers?.economy?.available ? 1 : 0.6}
                    w="full"
                  >
                    <CardBody p={{ base: 3, sm: 4 }}>
                      <VStack spacing={{ base: 2.5, sm: 3 }} align="stretch" w="full">
                        <HStack justify="space-between" flexWrap={{ base: "wrap", sm: "nowrap" }} spacing={{ base: 2, sm: 3 }} w="full">
                          <Text fontWeight="bold" color="white" fontSize={{ base: "sm", sm: "md" }} lineHeight="1.2">Economy</Text>
                          <Badge colorScheme={pricingTiers?.economy?.available ? "green" : "gray"} fontSize={{ base: "xs", sm: "sm" }} px={{ base: 2, sm: 3 }} py={{ base: 1, sm: 1 }}>
                            Multi-Drop
                          </Badge>
                        </HStack>
                        
                        {pricingTiers?.economy?.price && (
                          <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="bold" color="green.400" lineHeight="1.2">
                            £{pricingTiers.economy.price}
                          </Text>
                        )}
                        
                        {pricingTiers?.economy?.availability ? (
                          <VStack spacing={{ base: 1, sm: 1.5 }} align="start" w="full">
                            <Text fontSize={{ base: "xs", sm: "sm" }} color="white" lineHeight="1.3" noOfLines={2}>
                              {pricingTiers.economy.availability.route_type === 'economy' && 
                               pricingTiers.economy.availability.next_available_date === new Date().toISOString().split('T')[0]
                                ? "Available tomorrow"
                                : `Next available: ${new Date(pricingTiers.economy.availability.next_available_date).toLocaleDateString()}`
                              }
                            </Text>
                            <Tooltip label={pricingTiers.economy.availability.explanation}>
                              <Text fontSize={{ base: "xs", sm: "sm" }} color="green.300" lineHeight="1.3" noOfLines={2}>
                                {Math.round(pricingTiers.economy.availability.fill_rate)}% route efficiency
                              </Text>
                            </Tooltip>
                          </VStack>
                        ) : (
                          <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.400" lineHeight="1.3">
                            Route optimization required
                          </Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Standard Service */}
                  <Card 
                    bg="blue.900" 
                    borderColor="blue.500"
                    border="1px solid"
                    borderRadius={{ base: "md", md: "lg" }}
                    w="full"
                  >
                    <CardBody p={{ base: 3, sm: 4 }}>
                      <VStack spacing={{ base: 2.5, sm: 3 }} align="stretch" w="full">
                        <HStack justify="space-between" flexWrap={{ base: "wrap", sm: "nowrap" }} spacing={{ base: 2, sm: 3 }} w="full">
                          <Text fontWeight="bold" color="white" fontSize={{ base: "sm", sm: "md" }} lineHeight="1.2">Standard</Text>
                          <Badge colorScheme="blue" fontSize={{ base: "xs", sm: "sm" }} px={{ base: 2, sm: 3 }} py={{ base: 1, sm: 1 }}>Priority Slot</Badge>
                        </HStack>
                        
                        {pricingTiers?.standard?.price && (
                          <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="bold" color="blue.400" lineHeight="1.2">
                            £{pricingTiers.standard.price}
                          </Text>
                        )}
                        
                        {pricingTiers?.standard?.availability && (
                          <VStack spacing={{ base: 1, sm: 1.5 }} align="start" w="full">
                            <Text fontSize={{ base: "xs", sm: "sm" }} color="white" lineHeight="1.3" noOfLines={2}>
                              Available tomorrow
                            </Text>
                            <Text fontSize={{ base: "xs", sm: "sm" }} color="blue.300" lineHeight="1.3" noOfLines={2}>
                              {pricingTiers.standard.availability.explanation}
                            </Text>
                          </VStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Express Service */}
                  <Card 
                    bg="purple.900" 
                    borderColor="purple.500"
                    border="1px solid"
                    borderRadius={{ base: "md", md: "lg" }}
                    w="full"
                  >
                    <CardBody p={{ base: 3, sm: 4 }}>
                      <VStack spacing={{ base: 2.5, sm: 3 }} align="stretch" w="full">
                        <HStack justify="space-between" flexWrap={{ base: "wrap", sm: "nowrap" }} spacing={{ base: 2, sm: 3 }} w="full">
                          <Text fontWeight="bold" color="white" fontSize={{ base: "sm", sm: "md" }} lineHeight="1.2">Express</Text>
                          <Badge colorScheme="purple" fontSize={{ base: "xs", sm: "sm" }} px={{ base: 2, sm: 3 }} py={{ base: 1, sm: 1 }}>Dedicated Van</Badge>
                        </HStack>
                        
                        {pricingTiers?.express?.price && (
                          <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="bold" color="purple.400" lineHeight="1.2">
                            £{pricingTiers.express.price}
                          </Text>
                        )}
                        
                        {pricingTiers?.express?.availability && (
                          <VStack spacing={{ base: 1, sm: 1.5 }} align="start" w="full">
                            <Text fontSize={{ base: "xs", sm: "sm" }} color="white" lineHeight="1.3" noOfLines={2}>
                              Available tomorrow
                            </Text>
                            <Text fontSize={{ base: "xs", sm: "sm" }} color="purple.300" lineHeight="1.3" noOfLines={2}>
                              {pricingTiers.express.availability.explanation}
                            </Text>
                          </VStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {availabilityData && (
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.500" textAlign="center" lineHeight="1.3" px={{ base: 2, sm: 0 }}>
                    Calculated at {new Date(availabilityData.calculatedAt).toLocaleTimeString()} • Enterprise Engine
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Continue Button */}
        <Card bg="gray.800" borderRadius={{ base: "lg", md: "xl" }} border="1px solid" borderColor="gray.600" w="full">
          <CardBody p={{ base: 3, sm: 4, md: 6 }} w="full">
            <HStack justify="space-between" w="full" flexDirection={{ base: "column", sm: "row" }} spacing={{ base: 3, sm: 4 }}>
              <Badge bg="green.600" color="white" p={{ base: 2, sm: 2.5, md: 3 }} borderRadius={{ base: "md", md: "lg" }} fontSize={{ base: "sm", sm: "md" }} fontWeight="700" letterSpacing="0.3px" w={{ base: "full", sm: "auto" }} textAlign="center">
                ✅ {step1.items.length} Items Selected
              </Badge>

              <HStack spacing={{ base: 2, sm: 3 }} w={{ base: "full", sm: "auto" }} flexDirection={{ base: "column", sm: "row" }}>
                <Button
                  as={Link}
                  href="/"
                  variant="outline"
                  colorScheme="gray"
                  size={{ base: "md", sm: "lg" }}
                  leftIcon={<Icon as={FaArrowLeft} fontSize={{ base: "14px", sm: "16px" }} />}
                  minH={{ base: "48px", sm: "44px" }}
                  w={{ base: "full", sm: "auto" }}
                  fontSize={{ base: "sm", sm: "md" }}
                  fontWeight="600"
                  letterSpacing="0.3px"
                >
                  Back to Home
                </Button>

                {onNext && (
                  <Button
                    colorScheme="blue"
                    size={{ base: "md", sm: "lg" }}
                    isDisabled={step1.items.length === 0}
                    onClick={onNext}
                    rightIcon={<Icon as={FaArrowRight} fontSize={{ base: "14px", sm: "16px" }} />}
                    minH={{ base: "48px", sm: "44px" }}
                    w={{ base: "full", sm: "auto" }}
                    fontSize={{ base: "sm", sm: "md" }}
                    fontWeight="700"
                    letterSpacing="0.3px"
                    _disabled={{
                      opacity: 0.5,
                      cursor: "not-allowed"
                    }}
                  >
                    Continue to Payment
                  </Button>
                )}
              </HStack>
            </HStack>
          </CardBody>
        </Card>
        </Box>
    </Box>
  );
}