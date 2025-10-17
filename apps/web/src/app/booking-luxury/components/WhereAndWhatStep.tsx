'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  IconButton,
  Divider,
  Icon,
  SimpleGrid,
  Select,
  FormLabel,
  FormControl,
  Badge,
  Flex,
  Card,
  CardBody,
  Circle,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image,
  Wrap,
  WrapItem,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
// Images rendered with Chakra <Image>
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';
import logger from '@/lib/logger';

import { FaMapMarkerAlt, FaTrash, FaSearch, FaPlus, FaMinus, FaHome, FaCouch, FaArrowRight, FaChevronLeft, FaChevronRight, FaBed, FaUtensils, FaTv, FaBox, FaCar, FaBicycle, FaMusic, FaBook, FaChair, FaRobot, FaBolt, FaForward, FaCalendarAlt, FaCheck } from 'react-icons/fa';

import type { FormData, Item, Address } from '../hooks/useBookingForm';
import { SmartSearchBox } from './SmartSearchBox';
import { COMPREHENSIVE_CATALOG, HOUSE_PACKAGES } from '../../../lib/pricing/catalog-dataset';
// import { any } from '@speedy-van/shared';

type CategoryConfig = {
  displayName: string;
  folder: string;
  aliases: string[];
};

type PricingAvailability = {
  route_type: string;
  next_available_date: string;
  explanation: string;
  fill_rate?: number;
};

type PricingTier = {
  available?: boolean;
  price?: number;
  availability?: PricingAvailability | null;
};

type PricingTiers = {
  economy?: PricingTier | null;
  standard?: PricingTier | null;
  express?: PricingTier | null;
};

type AvailabilityMetadata = {
  calculatedAt: string;
};

type DatasetRawItem = {
  id: string;
  name: string;
  category: string;
  filename?: string | null;
  weight: number;
  volume?: number | string | null;
  price?: number | string | null;
  workers_required?: number | string | null;
  dismantling_required?: string | null;
  fragility_level?: string | null;
  keywords?: string[];
  [key: string]: unknown;
};

type DatasetCache = {
  data: any[];
  timestamp: number;
};

type SelectableItem = {
  id: string | number;
  name: string;
  price?: number | string;
  category?: string;
  image?: string | null;
};

type AutocompleteAddress = {
  full: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  formatted: {
    street: string;
    houseNumber: string;
    flatNumber?: string;
    floor?: string;
    businessName?: string;
  };
  isPostcodeValidated: boolean;
  stepCompletedAt: string;
  buildingDetails?: {
    type?: string;
    hasElevator?: boolean;
    floorNumber?: string;
    apartmentNumber?: string;
  };
};

const mapErrorMetadata = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: error };
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error('Unknown error');
  }
};

const createEmptyAddress = (): Address => ({
  address: '',
  formatted_address: '',
  place_name: '',
  houseNumber: '',
  flatNumber: '',
  line1: '',
  line2: '',
  city: '',
  postcode: '',
  country: '',
  full: '',
  coordinates: { lat: 0, lng: 0 },
  formatted: {
    street: '',
    houseNumber: '',
  },
  isPostcodeValidated: false,
  stepCompletedAt: '',
});

const mapAddressToAutocomplete = (address: Address | null): AutocompleteAddress | null => {
  if (!address) {
    return null;
  }

  const full = address.full ?? address.formatted_address ?? address.address ?? '';
  const line1 = address.line1 ?? address.address ?? '';
  const hasValue = Boolean(full || line1 || address.postcode || address.city);

  if (!hasValue) {
    return null;
  }

  return {
    full,
    line1,
    line2: address.line2 ?? undefined,
    city: address.city ?? '',
    postcode: address.postcode ?? '',
    country: address.country ?? 'United Kingdom',
    coordinates: {
      lat: address.coordinates?.lat ?? 0,
      lng: address.coordinates?.lng ?? 0,
    },
    formatted: {
      street: address.formatted?.street ?? line1,
      houseNumber: address.formatted?.houseNumber ?? address.houseNumber ?? '',
      flatNumber: address.formatted?.flatNumber ?? address.flatNumber ?? undefined,
      floor: address.formatted?.floor ?? undefined,
      businessName: address.formatted?.businessName ?? undefined,
    },
    isPostcodeValidated: address.isPostcodeValidated ?? false,
    stepCompletedAt: address.stepCompletedAt ?? '',
    buildingDetails: address.buildingDetails
      ? {
          type: address.buildingDetails.type,
          hasElevator: address.buildingDetails.hasElevator,
          floorNumber: address.buildingDetails.floorNumber,
          apartmentNumber: address.buildingDetails.apartmentNumber,
        }
      : undefined,
  };
};

const mapAutocompleteToAddress = (value: AutocompleteAddress | null): Address => {
  if (!value) {
    return createEmptyAddress();
  }

  return {
    address: value.line1,
    formatted_address: value.full,
    place_name: value.full,
    houseNumber: value.formatted.houseNumber,
    flatNumber: value.formatted.flatNumber,
    line1: value.line1,
    line2: value.line2,
    city: value.city,
    postcode: value.postcode,
    country: value.country,
    full: value.full,
    coordinates: {
      lat: value.coordinates.lat,
      lng: value.coordinates.lng,
    },
    formatted: {
      street: value.formatted.street,
      houseNumber: value.formatted.houseNumber,
      flatNumber: value.formatted.flatNumber,
      floor: value.formatted.floor,
      businessName: value.formatted.businessName,
    },
    isPostcodeValidated: value.isPostcodeValidated,
    stepCompletedAt: value.stepCompletedAt,
    buildingDetails: value.buildingDetails
      ? {
          type: value.buildingDetails.type,
          hasElevator: value.buildingDetails.hasElevator,
          floorNumber: value.buildingDetails.floorNumber,
          apartmentNumber: value.buildingDetails.apartmentNumber,
        }
      : undefined,
  };
};

const isDatasetRawItem = (item: unknown): item is DatasetRawItem => {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const candidate = item as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.category === 'string' &&
    (typeof candidate.weight === 'number' || typeof candidate.weight === 'string')
  );
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
  pricingTiers?: PricingTiers | null;
  availabilityData?: AvailabilityMetadata | null;
  isLoadingAvailability?: boolean;
}

export default function WhereAndWhatStep({
  formData,
  updateFormData,
  errors,
  onNext,
  pricingTiers,
  availabilityData,
  isLoadingAvailability,
}: WhereAndWhatStepProps) {
  // State for item selection mode
  const [itemSelectionMode, setItemSelectionMode] = useState<'bedroom' | 'smart' | 'choose'>('choose');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Bedroom Furniture');
  const [trendingCarouselIndex, setTrendingCarouselIndex] = useState(0);
  const [isTypingPickupAddress, setIsTypingPickupAddress] = useState(false);
  const [previousPickupValue, setPreviousPickupValue] = useState('');
  const [isTypingDropoffAddress, setIsTypingDropoffAddress] = useState(false);
  const [previousDropoffValue, setPreviousDropoffValue] = useState('');
  const [floorNumberWaveActive, setFloorNumberWaveActive] = useState(false);
  const [dateCardWaveActive, setDateCardWaveActive] = useState(false);
  const [trendingText, setTrendingText] = useState('');
  const toast = useToast();
  
  // AI Estimate Modal state
  const { isOpen: isAIModalOpen, onOpen: onAIModalOpen, onClose: onAIModalClose } = useDisclosure();
  const [aiPropertyType, setAiPropertyType] = useState('1 Bedroom');
  const [aiMoveType, setAiMoveType] = useState('House Move');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  // Using dataset-backed imagery with graceful fallbacks
  
  const { step1 } = formData;

  // Monitor pickup address changes for wave effect
  useEffect(() => {
    const currentValue = mapAddressToAutocomplete(step1.pickupAddress);
    const currentValueString = currentValue ? JSON.stringify(currentValue) : '';
    
    // Check if user is typing (value is changing but not complete)
    if (currentValueString !== previousPickupValue) {
      if (currentValue && currentValue.full && currentValue.full.length > 0) {
        // User is typing - start wave
        setIsTypingPickupAddress(true);
      } else if (currentValue && (currentValue.postcode || currentValue.city)) {
        // Address is complete - stop wave
        setIsTypingPickupAddress(false);
      } else {
        // No address - stop wave
        setIsTypingPickupAddress(false);
      }
      setPreviousPickupValue(currentValueString);
    }
  }, [step1.pickupAddress, previousPickupValue]);

  // Monitor dropoff address changes for blue wave effect
  useEffect(() => {
    const currentValue = mapAddressToAutocomplete(step1.dropoffAddress);
    const currentValueString = currentValue ? JSON.stringify(currentValue) : '';
    
    // Check if user is typing (value is changing but not complete)
    if (currentValueString !== previousDropoffValue) {
      if (currentValue && currentValue.full && currentValue.full.length > 0) {
        // User is typing - start wave
        setIsTypingDropoffAddress(true);
      } else if (currentValue && (currentValue.postcode || currentValue.city)) {
        // Address is complete - stop wave
        setIsTypingDropoffAddress(false);
      } else {
        // No address - stop wave
        setIsTypingDropoffAddress(false);
      }
      setPreviousDropoffValue(currentValueString);
    }
  }, [step1.dropoffAddress, previousDropoffValue]);

  // Monitor floor number changes for red/green wave effect
  useEffect(() => {
    const hasFloorNumber = step1.pickupAddress?.buildingDetails?.floorNumber || 
                          step1.dropoffAddress?.buildingDetails?.floorNumber;
    
    if (hasFloorNumber) {
      // Floor number added - show green wave briefly then stop
      setFloorNumberWaveActive(true);
      setTimeout(() => {
        setFloorNumberWaveActive(false);
      }, 3000); // Show green wave for 3 seconds
    } else {
      // No floor number - show red wave
      setFloorNumberWaveActive(true);
    }
  }, [
    step1.pickupAddress?.buildingDetails?.floorNumber,
    step1.dropoffAddress?.buildingDetails?.floorNumber
  ]);

  // Activate date card wave effect only when both pickup and dropoff addresses are selected
  useEffect(() => {
    const hasPickupAddress = step1.pickupAddress?.postcode && step1.pickupAddress?.city;
    const hasDropoffAddress = step1.dropoffAddress?.postcode && step1.dropoffAddress?.city;
    const hasDate = step1.pickupDate;
    
    // Start wave only when both addresses are selected but no date is chosen
    if (hasPickupAddress && hasDropoffAddress && !hasDate) {
      setDateCardWaveActive(true);
    } else {
      setDateCardWaveActive(false);
    }
  }, [step1.pickupAddress, step1.dropoffAddress, step1.pickupDate]);

  const [individualItems, setanys] = useState<any[]>([]);
  const [individualItemsLoading, setanysLoading] = useState<boolean>(true);
  const [individualItemsError, setanysError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState<'dataset' | 'directory' | 'smart-search'>('dataset');

  const datasetFallbackImage = '/UK_Removal_Dataset/Images_Only/Bag_luggage_box/moving_boxes_uboxes_with_handles_10_premium_jpg_15kg.jpg';

  // Get icon for category (same as SmartSearchBox)
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('sofa') || categoryLower.includes('couch') || categoryLower.includes('living')) {
      return FaCouch;
    }
    if (categoryLower.includes('bed') || categoryLower.includes('bedroom')) {
      return FaBed;
    }
    if (categoryLower.includes('kitchen') || categoryLower.includes('dining') || categoryLower.includes('cook')) {
      return FaUtensils;
    }
    if (categoryLower.includes('tv') || categoryLower.includes('electronic') || categoryLower.includes('audio')) {
      return FaTv;
    }
    if (categoryLower.includes('bike') || categoryLower.includes('bicycle')) {
      return FaBicycle;
    }
    if (categoryLower.includes('car') || categoryLower.includes('vehicle')) {
      return FaCar;
    }
    if (categoryLower.includes('music') || categoryLower.includes('instrument')) {
      return FaMusic;
    }
    if (categoryLower.includes('book') || categoryLower.includes('study') || categoryLower.includes('office')) {
      return FaBook;
    }
    if (categoryLower.includes('chair') || categoryLower.includes('seating')) {
      return FaChair;
    }
    if (categoryLower.includes('antique') || categoryLower.includes('collectible')) {
      return FaHome;
    }
    // Default icon for boxes and general items
    return FaBox;
  };

  // Item Icon Display Component for selected items
  const ItemIconDisplay: React.FC<{
    category: string;
    size?: number;
    isSelected?: boolean;
  }> = ({ category, size = 70, isSelected = false }) => {
    const IconComponent = getCategoryIcon(category);
    
    return (
      <Box
        w={size}
        h={size}
        borderRadius="lg"
        bg={isSelected ? "blue.500" : "gray.600"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        border={isSelected ? "2px solid" : "2px solid transparent"}
        borderColor={isSelected ? "blue.300" : "transparent"}
        transition="all 0.2s ease"
        position="relative"
        overflow="hidden"
      >
        <Icon
          as={IconComponent}
          color="white"
          boxSize={size * 0.5}
        />
        
        {/* Selection indicator */}
        {isSelected && (
          <Box
            position="absolute"
            top={1}
            right={1}
            w={3}
            h={3}
            bg="green.400"
            borderRadius="full"
            border="2px solid"
            borderColor="white"
          />
        )}
      </Box>
    );
  };

  // Trending items carousel
  const trendingItems = useMemo(() => [
    {
      id: 'sofa_3seat',
      name: '3-Seat Sofa',
      image: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/sofa_3_seat_fabric_modern_lestar_jpg_48kg.jpg',
      category: 'Living Room',
    },
    {
      id: 'king_bed',
      name: 'King Bed Frame',
      image: '/UK_Removal_Dataset/Images_Only/Bedroom/king_bed_frame_cavill_fabric_grey_jpg_55kg.jpg',
      category: 'Bedroom',
    },
    {
      id: 'fridge_freezer',
      name: 'Fridge Freezer',
      image: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/american_fridge_freezer_bosch_jpg_145kg.jpg',
      category: 'Kitchen',
    },
    {
      id: 'dining_table',
      name: 'Dining Table',
      image: '/UK_Removal_Dataset/Images_Only/Dining_Room_Furniture/dining_table_extendable_55inch_jpg_65kg.jpg',
      category: 'Dining Room',
    },
    {
      id: 'wardrobe_double',
      name: 'Double Wardrobe',
      image: '/UK_Removal_Dataset/Images_Only/Wardrobes_closet/wardrobe_double_door_hodedah_two_drawers_hanging_rod_jpg_65kg.jpg',
      category: 'Storage',
    },
    {
      id: 'tv_50inch',
      name: '50" Smart TV',
      image: '/UK_Removal_Dataset/Images_Only/Electrical_Electronic/television_50inch_smart_4k_google_jpg_25kg.jpg',
      category: 'Electronics',
    },
  ], []);

  const handleTrendingNext = () => {
    setTrendingCarouselIndex((prev) => (prev + 1) % trendingItems.length);
  };

  const handleTrendingPrev = () => {
    setTrendingCarouselIndex((prev) => (prev - 1 + trendingItems.length) % trendingItems.length);
  };

  // Auto-scroll trending items every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingCarouselIndex((prev) => (prev + 1) % trendingItems.length);
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Typewriter effect for "Trending Items"
  useEffect(() => {
    const fullText = '🔥 Trending Items';
    let currentIndex = 0;
    let isTyping = true;
    
    const animate = () => {
      if (isTyping && currentIndex <= fullText.length) {
        setTrendingText(fullText.slice(0, currentIndex));
        currentIndex++;
        setTimeout(animate, 150); // 150ms per character
      } else if (currentIndex > fullText.length) {
        // Wait 2 seconds then restart
        setTimeout(() => {
          currentIndex = 0;
          isTyping = true;
          animate();
        }, 2000);
      }
    };

    animate();

    return () => {
      isTyping = false;
    };
  }, []);

  const ItemImage: React.FC<{
    src?: string | null;
    alt: string;
    size?: number;
    isSelected?: boolean;
  }> = ({ src, alt, size = 120, isSelected = false }) => {
    const [resolvedSrc, setResolvedSrc] = useState<string>(src && src.length > 0 ? src : datasetFallbackImage);
    const [isFlipped, setIsFlipped] = useState(false);
    const [funnyText, setFunnyText] = useState<string>('');

    // 200 funny and smart texts
    const funnyTexts = [
      "I'm ready for my journey! 🎯",
      "Pick me, I dare you! 😎",
      "I promise I won't break! 🤞",
      "VIP item here! ✨",
      "I'm the chosen one! 🌟",
      "Take me to my new home! 🏠",
      "I'm worth it, trust me! 💎",
      "Best decision ever! 🎊",
      "You need me in your life! 💝",
      "I clean up real nice! ✨",
      "Moving is my middle name! 🚚",
      "I'm famous, you know! 🌟",
      "Don't leave me behind! 😢",
      "I'm a limited edition! 🏆",
      "Your future starts with me! 🚀",
      "I'm already packed mentally! 📦",
      "Adventure awaits me! 🗺️",
      "I'm lighter than I look! 💪",
      "Professional mover here! 🎓",
      "I won't judge your choices! 🤫",
      "Click me before I'm gone! ⚡",
      "I've been waiting for you! ⏰",
      "Make your neighbors jealous! 😏",
      "I promise good vibes only! ✌️",
      "Tap me, you won't regret it! 👆",
      "I'm the missing piece! 🧩",
      "Your cart needs me! 🛒",
      "I'm on sale... emotionally! 💸",
      "Free personality included! 🎭",
      "I come with good karma! 🍀",
      "Warning: Highly addictive! ⚠️",
      "Tap twice if you really mean it! 😜",
      "I'm Instagram-worthy! 📸",
      "Your life coach approves! 👍",
      "Scientifically proven awesome! 🔬",
      "I sparkle in natural light! ✨",
      "Comes with its own story! 📖",
      "I'm trending right now! 📈",
      "Limited time offer: ME! ⏳",
      "Your future heirloom! 👑",
      "I survived the warehouse! 💪",
      "Tap to unlock happiness! 😊",
      "I'm Marie Kondo approved! ✅",
      "Will work for transportation! 🚛",
      "I'm low maintenance! 🌱",
      "Batteries not required! 🔋",
      "I age like fine wine! 🍷",
      "Your therapist recommended me! 🛋️",
      "I'm a conversation starter! 💬",
      "Feng shui certified! 🧘",
      "I bring good fortune! 🎰",
      "NASA tested! 🚀",
      "Chef's kiss quality! 👨‍🍳",
      "I'm the plot twist you need! 🎬",
      "Tap me, make my day! 🌞",
      "I complete the set! 🎯",
      "Your soulmate... in furniture! 💘",
      "I'm gluten-free! 🌾",
      "Warning: May cause happiness! 😄",
      "I survived the showroom! 🏪",
      "Tap to adopt me! 🐾",
      "I'm carbon neutral! 🌍",
      "Your upgrade is here! ⬆️",
      "I don't bite! 😇",
      "Tap for instant gratification! 💫",
      "I'm the real deal! 💯",
      "Your mom would approve! 👵",
      "I'm a crowd favorite! 🎪",
      "Tap me, I'm famous! 🌟",
      "I promise I'm not heavy! 🪶",
      "Your perfect match! 💑",
      "I'm energy efficient! ⚡",
      "Tap to make memories! 📸",
      "I'm worth the space! 📏",
      "Your interior designer agrees! 🎨",
      "I'm TikTok approved! 📱",
      "Tap before someone else does! 🏃",
      "I'm a limited edition drop! 🎁",
      "Your pet will love me too! 🐕",
      "I'm practically famous! 🎬",
      "Tap to complete your vibe! ✨",
      "I'm the missing puzzle piece! 🧩",
      "Your best investment yet! 💰",
      "I'm surprisingly versatile! 🎪",
      "Tap for good luck! 🍀",
      "I'm a classic, baby! 🎩",
      "Your grandkids will thank you! 👶",
      "I'm the upgrade you deserve! 🆙",
      "Tap me, I'm ready! 🚀",
      "I promise I'll fit! 📐",
      "Your neighbors will talk! 🗣️",
      "I'm a showstopper! 🎭",
      "Tap to elevate your life! 🎈",
      "I'm worth every penny! 💵",
      "Your future self says thanks! 🙏",
      "I'm the star of the show! ⭐",
      "Tap before I change my mind! 🤔",
      "I'm a conversation piece! 💭",
      "Your dream come true! 🌈",
      "I'm practically weightless! 🎈",
      "Tap for instant style! 👗",
      "I'm a collector's item! 🏺",
      "Your upgrade awaits! 🔝",
      "I'm social media ready! 📷",
      "Tap to unlock potential! 🔓",
      "I'm the real MVP! 🏆",
      "Your home needs me! 🏡",
      "I'm a modern classic! 🎨",
      "Tap to make it official! 💍",
      "I'm the main character! 🎬",
      "Your taste is impeccable! 👌",
      "I'm worth the trip! 🚗",
      "Tap for instant joy! 😊",
      "I'm a game changer! 🎮",
      "Your aesthetic needs me! 🖼️",
      "I'm the total package! 🎁",
      "Tap to seal the deal! 🤝",
      "I'm influencer approved! 💅",
      "Your cart looks empty without me! 🛒",
      "I'm a keeper! 🎣",
      "Tap to make it happen! ⚡",
      "I'm the missing ingredient! 🧂",
      "Your space craves me! 🌌",
      "I'm a mood enhancer! 😎",
      "Tap to change your life! 🔄",
      "I'm the secret sauce! 🍔",
      "Your vision needs me! 👁️",
      "I'm professionally recommended! 📋",
      "Tap to manifest destiny! 🌠",
      "I'm the cherry on top! 🍒",
      "Your home's best friend! 🏠",
      "I'm award-winning! 🏅",
      "Tap to unlock achievement! 🎯",
      "I'm the plot device! 📚",
      "Your journey starts here! 🛤️",
      "I'm a limited release! 🎫",
      "Tap to join the club! 🎪",
      "I'm your spirit item! 👻",
      "Your destiny is calling! 📞",
      "I'm the key to happiness! 🔑",
      "Tap to level up! 🎮",
      "I'm the secret ingredient! 🧪",
      "Your home is incomplete! 🧩",
      "I'm a rare find! 🔍",
      "Tap to unlock magic! 🪄",
      "I'm the missing link! 🔗",
      "Your perfect companion! 🤗",
      "I'm a masterpiece! 🎨",
      "Tap to start your glow-up! ✨",
      "I'm the chosen item! 🎯",
      "Your gut says yes! 🎲",
      "I'm a status symbol! 👑",
      "Tap to make waves! 🌊",
      "I'm the real treasure! 💎",
      "Your new favorite thing! ❤️",
      "I'm worth the hype! 📣",
      "Tap to seal your fate! 🎰",
      "I'm the game winner! 🥇",
      "Your move, boss! 🎯",
      "I'm the MVP of moves! 🏆",
      "Tap to claim victory! 🏁",
      "I'm your lucky charm! 🍀",
      "Your best choice today! 📅",
      "I'm the plot twist! 🌀",
      "Tap to write history! 📜",
      "I'm the breakthrough! 💥",
      "Your signature piece! ✍️",
      "I'm the final boss! 👾",
      "Tap to complete the mission! 🎯",
      "I'm your power-up! ⚡",
      "Your legendary find! 🗡️",
      "I'm the bonus level! 🎮",
      "Tap to unlock premium! 💎",
      "I'm the secret menu item! 🍔",
      "Your easter egg! 🥚",
      "I'm the hidden gem! 💍",
      "Tap to discover greatness! 🔭",
      "I'm the DLC you need! 🎁",
      "Your cheat code to style! 🎮",
      "I'm the ultimate upgrade! 🚀",
      "Tap to activate awesomeness! 🌟",
      "I'm your daily quest! ⚔️",
      "Your main quest item! 🗺️",
      "I'm the achievement unlock! 🏆",
      "Tap to gain XP! 📈",
      "I'm your rare loot! 🎁",
      "Your legendary drop! ⭐",
      "I'm the critical hit! 💥",
      "Tap to roll a natural 20! 🎲",
      "I'm your combo multiplier! ✖️",
      "Your perfect score! 💯",
      "I'm the speedrun record! ⏱️",
      "Tap to save your game! 💾",
      "I'm your respawn point! 🔄",
      "Your checkpoint reached! ✅",
      "I'm the final form! 🦋",
      "Tap to evolve! 🧬",
    ];

    useEffect(() => {
      setResolvedSrc(src && src.length > 0 ? src : datasetFallbackImage);
      // Set random funny text
      const randomIndex = Math.floor(Math.random() * funnyTexts.length);
      setFunnyText(funnyTexts[randomIndex]);
    }, [src]);

    return (
      <Box
        w={`${size}px`}
        h={`${size}px`}
        position="relative"
        style={{ perspective: '1000px' }}
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
        onTouchStart={() => setIsFlipped(true)}
        onTouchEnd={() => setTimeout(() => setIsFlipped(false), 2000)}
        cursor="pointer"
      >
        <style>
          {`
            @keyframes particleDissolve {
              0%, 90% {
                opacity: 1;
                transform: scale(1);
                filter: blur(0px);
              }
              95% {
                opacity: 0.8;
                transform: scale(1.02);
                filter: blur(1px);
              }
              98% {
                opacity: 0.4;
                transform: scale(1.05);
                filter: blur(2px);
              }
              100% {
                opacity: 0;
                transform: scale(1.1);
                filter: blur(3px);
              }
            }
            
            @keyframes particleGlow {
              0%, 100% {
                box-shadow: 
                  0 0 5px rgba(255, 215, 0, 0.6),
                  0 0 10px rgba(255, 215, 0, 0.4),
                  0 0 15px rgba(255, 215, 0, 0.2),
                  inset 0 0 10px rgba(255, 215, 0, 0.3);
              }
              50% {
                box-shadow: 
                  0 0 10px rgba(255, 215, 0, 0.9),
                  0 0 20px rgba(255, 215, 0, 0.6),
                  0 0 30px rgba(255, 215, 0, 0.4),
                  inset 0 0 15px rgba(255, 215, 0, 0.5);
              }
            }
            
            @keyframes particleFloat {
              0% {
                transform: translateY(0px) rotate(0deg);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(-20px) rotate(360deg);
                opacity: 0;
              }
            }
            
            .particle-container::before,
            .particle-container::after {
              content: '';
              position: absolute;
              width: 6px;
              height: 6px;
              background: radial-gradient(circle, rgba(255, 215, 0, 0.9) 0%, rgba(255, 215, 0, 0.6) 50%, transparent 70%);
              border-radius: 50%;
              pointer-events: none;
              box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
            }
            
            .particle-container::before {
              top: 10%;
              left: 20%;
              animation: particleFloat 3s ease-out infinite;
              animation-delay: 7s;
            }
            
            .particle-container::after {
              top: 70%;
              right: 15%;
              animation: particleFloat 3s ease-out infinite;
              animation-delay: 8s;
            }
            
            @keyframes pulseGlowBlue {
              0%, 100% {
                box-shadow: 0 0 15px rgba(59, 130, 246, 0.8),
                            0 0 25px rgba(59, 130, 246, 0.5),
                            0 0 35px rgba(59, 130, 246, 0.3),
                            inset 0 0 10px rgba(59, 130, 246, 0.2);
              }
              50% {
                box-shadow: 0 0 20px rgba(59, 130, 246, 1),
                            0 0 35px rgba(59, 130, 246, 0.7),
                            0 0 50px rgba(59, 130, 246, 0.5),
                            inset 0 0 15px rgba(59, 130, 246, 0.3);
              }
            }
            
            @keyframes pulseGlowGreen {
              0%, 100% {
                box-shadow: 0 0 20px rgba(16, 185, 129, 0.9),
                            0 0 35px rgba(16, 185, 129, 0.6),
                            0 0 50px rgba(16, 185, 129, 0.4),
                            inset 0 0 15px rgba(16, 185, 129, 0.3);
              }
              50% {
                box-shadow: 0 0 25px rgba(16, 185, 129, 1),
                            0 0 45px rgba(16, 185, 129, 0.8),
                            0 0 65px rgba(16, 185, 129, 0.6),
                            inset 0 0 20px rgba(16, 185, 129, 0.4);
              }
            }
            
            @keyframes floatUpDown {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-10px);
              }
            }
          `}
        </style>
        <Box
          w="full"
          h="full"
          position="relative"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front side - Image */}
          <Box
            position="absolute"
            w="full"
            h="full"
            borderRadius="xl"
            overflow="hidden"
            border="3px solid"
            borderColor={isFlipped ? "green.400" : isSelected ? "green.400" : "blue.400"}
            bg="gray.900"
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d',
              animation: isFlipped
                ? 'none'
                : isSelected
                  ? 'pulseGlowGreen 3s ease-in-out infinite'
                  : 'pulseGlowBlue 3s ease-in-out infinite',
            }}
            transition="border-color 0.5s ease-in-out"
          >
            <Box
              w="full"
              h="full"
              position="relative"
            >
              {/* Background layer - Happy face with message (shows when selected) */}
              {isSelected && (
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  bg="linear-gradient(135deg, rgba(255, 215, 0, 0.95) 0%, rgba(255, 165, 0, 0.9) 100%)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                  zIndex={0}
                  borderRadius="xl"
                  overflow="hidden"
                >
                  <Text fontSize="6xl" mb={2}>
                    😁
                  </Text>
                  <VStack spacing={1}>
                    <Text 
                      fontSize="xs" 
                      fontWeight="bold" 
                      color="white" 
                      textAlign="center"
                      textShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
                      px={2}
                    >
                      I know I deserve to be moved
                    </Text>
                    <HStack spacing={1}>
                      <Text fontSize="2xl">🤪</Text>
                      <Text fontSize="2xl">🥴</Text>
                    </HStack>
                  </VStack>
                </Box>
              )}
              
              {/* Spinning image layer */}
              <Box
                w="full"
                h="full"
                position="relative"
                zIndex={1}
                className={isSelected ? "particle-container" : ""}
                style={{
                  transformStyle: 'preserve-3d',
                  animation: isSelected 
                    ? 'particleDissolve 10s ease-out infinite, particleGlow 3s ease-in-out infinite' 
                    : 'none',
                  transition: isSelected ? 'none' : 'all 0.3s ease',
                  filter: isSelected ? 'brightness(1.1) saturate(1.2) drop-shadow(0 0 15px rgba(255, 215, 0, 0.6))' : 'none',
                }}
              >
                <Image
                  src={resolvedSrc}
                  alt={alt}
                  w="full"
                  h="full"
                  objectFit="cover"
                  loading="lazy"
                  onError={() =>
                    setResolvedSrc((current) => (current === datasetFallbackImage ? current : datasetFallbackImage))
                  }
                />
              </Box>
              
              {/* Corner sparkles indicator - Shows when item is selected */}
              {isSelected && (
                <>
                  {/* Corner indicators */}
                  <Text
                    position="absolute"
                    top="5%"
                    left="5%"
                    fontSize="xl"
                    zIndex={3}
                    style={{
                      animation: 'floatUpDown 2s ease-in-out infinite',
                      filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))',
                    }}
                  >
                    ✨
                  </Text>
                  <Text
                    position="absolute"
                    top="5%"
                    right="5%"
                    fontSize="xl"
                    zIndex={3}
                    style={{
                      animation: 'floatUpDown 2s ease-in-out infinite 0.5s',
                      filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))',
                    }}
                  >
                    ✨
                  </Text>
                  <Text
                    position="absolute"
                    bottom="5%"
                    left="5%"
                    fontSize="xl"
                    zIndex={3}
                    style={{
                      animation: 'floatUpDown 2s ease-in-out infinite 1s',
                      filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))',
                    }}
                  >
                    ✨
                  </Text>
                  <Text
                    position="absolute"
                    bottom="5%"
                    right="5%"
                    fontSize="xl"
                    zIndex={3}
                    style={{
                      animation: 'floatUpDown 2s ease-in-out infinite 1.5s',
                      filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))',
                    }}
                  >
                    ✨
                  </Text>
                </>
              )}
            </Box>
          </Box>

          {/* Back side - Message */}
          <Box
            position="absolute"
            w="full"
            h="full"
            borderRadius="xl"
            overflow="hidden"
            border="2px solid"
            borderColor="green.400"
            bg="linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            p={4}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            boxShadow="0 0 25px rgba(16, 185, 129, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.2)"
          >
            <VStack spacing={2}>
              <Text 
                fontSize="sm" 
                fontWeight="bold" 
                color="white" 
                textAlign="center"
                textShadow="0 2px 10px rgba(0, 0, 0, 0.3)"
                px={2}
              >
                {funnyText}
              </Text>
              <Text fontSize="lg">
                ✨
              </Text>
            </VStack>
          </Box>
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
  const generateItemsFromDirectory = async (): Promise<any[]> => {
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

    const items: any[] = [];

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
    options?: { manifestItems?: any[] }
  ): Promise<any[]> => {
    logger.info('[DATASET] Skipping old dataset - using new 668 images from directory manifest...');

    try {
      // Always use directory manifest instead of old dataset
      throw new Error('Using new 668 images from directory manifest instead of old dataset');
    } catch (error) {
      logger.error('[DATASET] ❌ Failed to load official dataset', toError(error));
      throw error;
    }
  };

  const loadFromCache = async (): Promise<any[]> => {
    logger.info('[CACHE] Attempting to load from localStorage cache...');

    try {
      const cached = localStorage.getItem('uk-removal-dataset-cache');
      if (!cached) {
        throw new Error('No cache available');
      }

      const parsed: unknown = JSON.parse(cached);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid cache data');
      }

      const candidate = parsed as Partial<DatasetCache>;
      const { data, timestamp } = candidate;

      if (typeof timestamp !== 'number' || !Array.isArray(data)) {
        throw new Error('Malformed cache payload');
      }

      const cacheAge = Date.now() - timestamp;
      if (cacheAge > 24 * 60 * 60 * 1000) {
        throw new Error('Cache expired');
      }

      if (data.length === 0) {
        throw new Error('Invalid cache data');
      }

      logger.info(`[CACHE] ✅ Loaded ${data.length} items from cache (${Math.round(cacheAge / 1000 / 60)} minutes old)`);
      return data;

    } catch (error) {
      logger.error('[CACHE] ❌ Cache load failed', toError(error));
      throw error;
    }
  };

  const createSmartSearchFallback = (): any[] => {
    logger.info('[SMART-SEARCH] Creating smart search fallback mode...');

    // Create essential items for basic functionality
    const boxesCategory = resolveCategoryInfo('Bag_luggage_box').displayName;
    const livingRoomCategory = resolveCategoryInfo('Living_room_Furniture').displayName;
    const diningRoomCategory = resolveCategoryInfo('Dining_Room_Furniture').displayName;

    const essentialItems: any[] = [
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

    logger.info(`[SMART-SEARCH] ✅ Created ${essentialItems.length} essential items for fallback mode`);
    return essentialItems;
  };

  const saveToCache = (items: any[]) => {
    try {
      const cacheData = {
        data: items,
        timestamp: Date.now()
      };
      localStorage.setItem('uk-removal-dataset-cache', JSON.stringify(cacheData));
      logger.info('[CACHE] 💾 Saved dataset to cache');
    } catch (error) {
      logger.warn('[CACHE] ⚠️ Failed to save to cache', mapErrorMetadata(error));
    }
  };

  // Health check function - always return true since we use directory manifest
  const performDatasetHealthCheck = async (): Promise<boolean> => {
    try {
      logger.info('[HEALTH-CHECK] ✅ Using new 668 images from directory manifest - always healthy');
      return true; // Always healthy since we use directory manifest
    } catch (error) {
      logger.error('[HEALTH-CHECK] ❌ Health check failed', toError(error));
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadDatasetWithFallbacks = async () => {
      try {
        setanysLoading(true);
        setanysError(null);

        let items: any[] = [];
        let activeMode: 'dataset' | 'directory' | 'smart-search' = 'dataset';

        let manifestItems: any[] | null = null;
        try {
          manifestItems = await generateItemsFromDirectory();
          logger.info(`[MANIFEST] ✅ Prepared ${manifestItems.length} image-backed items from directory manifest`);
        } catch (manifestError) {
          logger.warn('[MANIFEST] ⚠️ Failed to prepare directory manifest for imagery validation', mapErrorMetadata(manifestError));
        }

        // Use the new 668 images directly - skip old dataset completely
            if (manifestItems && manifestItems.length > 0) {
              items = manifestItems;
              activeMode = 'directory';
              setFallbackMode('directory');
              saveToCache(items);
          logger.info('[SUCCESS] ✅ Loaded 668 items in directory mode');
            } else {
          logger.warn('[FALLBACK] Directory manifest unavailable, trying cache...');

              // Strategy 2: Try cache as fallback
              try {
                items = await loadFromCache();
                activeMode = 'dataset';
                setFallbackMode('dataset'); // Still using dataset mode from cache
                logger.info('[FALLBACK] ✅ Using cached dataset data - fully functional');
              } catch (cacheError) {
                logger.warn('[FALLBACK] Cache failed, switching to smart search mode...', mapErrorMetadata(cacheError));
                throw cacheError; // Force fallback to smart search
          }
        }

        // If we get here, we have items from dataset, manifest, or cache
        if (isMounted) {
          setanys(items);
          setanysError(null);
          logger.info(`[SUCCESS] ✅ Loaded ${items.length} items in ${activeMode} mode`);
        }

      } catch (error: unknown) {
  logger.error('[CRITICAL] Dataset loading failed, activating emergency fallback', toError(error));

        // Strategy 3: Smart search fallback - NEVER BLOCK UI
        if (isMounted) {
          const essentialItems = createSmartSearchFallback();
          setanys(essentialItems);
          setFallbackMode('smart-search');
          setanysError('Smart Search Mode: Essential items available for booking');
          logger.info('[EMERGENCY] ✅ Emergency fallback activated - customers can continue booking with essential items');
        }
      } finally {
        if (isMounted) {
          setanysLoading(false);
        }
      }
    };

    void loadDatasetWithFallbacks();

    return () => {
      isMounted = false;
    };
  }, []);

  // Function to get category name from folder name (for directory scanning)
  const getCategoryFromFolder = (folderName: string): string => {
    return resolveCategoryInfo(folderName).displayName;
  };


  const individualItemLookup = useMemo(() => {
    return new Map(individualItems.map((item) => [item.id, item]));
  }, [individualItems]);

  const groupedanys = useMemo(() => {
    const groups = individualItems.reduce<Record<string, any[]>>((acc, item) => {
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

  const convertanyToUIItem = (item: any) => ({
    id: item.id,
    name: item.name,
    price: item.price.toString(),
    category: item.category,
    image: item.image || datasetFallbackImage,
  });

  const normalizeCategory = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

  const filteredanys = useMemo(() => {
    let items = individualItems;

    if (searchQuery.trim().length >= 1) {
      const query = searchQuery.trim().toLowerCase();
      items = items.filter((item) => {
        const lowerName = item.name.toLowerCase();
        const lowerCategory = item.category.toLowerCase();
        return (
          lowerName.includes(query) ||
          lowerCategory.includes(query) ||
          item.keywords.some((keyword: string) => keyword.includes(query))
        );
      });
    }

    if (selectedCategory && selectedCategory !== 'All') {
      const normalizedSelected = normalizeCategory(selectedCategory);
      items = items.filter((item) => normalizeCategory(item.category).includes(normalizedSelected));
    }

    return items;
  }, [individualItems, searchQuery, selectedCategory]);

  const filteredGroupedItems = useMemo(() => {
    const groups = filteredanys.reduce<Record<string, any[]>>((acc, item) => {
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
  }, [filteredanys]);

  const allItemsByCategory = useMemo(() => {
    return groupedanys.reduce<Record<string, ReturnType<typeof convertanyToUIItem>[]>>(
      (acc, group) => {
        acc[group.category] = group.items.map(convertanyToUIItem);
        return acc;
      },
      {}
    );
  }, [groupedanys]);

  const selectedItemIds = useMemo(() => {
    return new Set((step1.items ?? []).map((item) => (item.id ?? '').toString()));
  }, [step1.items]);

  const bedroomPackages = [
    {
      id: 'full-house-1bed',
      name: '1 Bedroom',
      items: 15,
      price: '350',
      category: 'Full House Packages',
      image: '/items/one bedroom.png',
    },
    {
      id: 'full-house-2bed',
      name: '2 Bedroom',
      items: 25,
      price: '550',
      category: 'Full House Packages',
      image: '/items/2 bedroom.png',
    },
    {
      id: 'full-house-3bed',
      name: '3 Bedroom',
      items: 35,
      price: '750',
      category: 'Full House Packages',
      image: '/items/3 bed rooms.png',
    },
  ];

  // Handlers
  const addItem = (item: any) => {
    const itemId = item.id.toString();

    // Check if this item is from search (already converted to Item format with empty image)
    if (item.image === '') {
      // Item from search - use it as is
      const existingItem = step1.items.find(i => i.id === itemId);
      if (existingItem) {
        const newQuantity = (existingItem.quantity || 0) + 1;
        updateFormData('step1', {
          items: step1.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  quantity: newQuantity,
                  totalPrice: (i.unitPrice || item.unitPrice || 25) * newQuantity,
                }
              : i
          ),
        });
        return;
      }

      // Add new item from search
      updateFormData('step1', {
        items: [...step1.items, item],
      });
      return;
    }

    // Item from individual items - use existing logic
    const catalogItem = COMPREHENSIVE_CATALOG.find(ci => ci.id === itemId) ||
      HOUSE_PACKAGES.find(hp => hp.id === itemId);
    const datasetItem = individualItemLookup.get(itemId);

    const rawItemPrice = typeof item.price === 'number'
      ? item.price
      : typeof item.price === 'string' && item.price.trim().length > 0
        ? Number.parseFloat(item.price)
        : Number.NaN;

    const derivedUnitPrice = datasetItem?.price ?? (catalogItem
      ? Math.max(20, Math.round(catalogItem.weight * 0.5 + catalogItem.volume * 20))
      : Number.isFinite(rawItemPrice) ? rawItemPrice : 25);

    const weight = datasetItem?.weight ?? catalogItem?.weight ?? 10;
    const volume = datasetItem?.volume ?? catalogItem?.volume ?? 1;
    const imageUrl = datasetItem?.image ?? catalogItem?.imageUrl ?? datasetFallbackImage;
    const workersRequired = catalogItem?.workers_required ?? datasetItem?.workersRequired ?? 1;
    const dismantlingRequired = catalogItem?.dismantling_required ?? datasetItem?.dismantlingRequired ?? 'No';
    const fragilityLevel = catalogItem?.fragility_level ?? datasetItem?.fragilityLevel ?? 'Standard';

    const existingItem = step1.items.find(i => i.id === itemId);
    if (existingItem) {
      const newQuantity = (existingItem.quantity || 0) + 1;
      updateFormData('step1', {
        items: step1.items.map((i) =>
          i.id === itemId
            ? {
                ...i,
                name: item.name,
                description: item.name,
                category: item.category || catalogItem?.category || datasetItem?.category || 'General',
                quantity: newQuantity,
                totalPrice: (i.unitPrice || derivedUnitPrice) * newQuantity,
              }
            : i
        ),
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
          category: item.category || catalogItem?.category || datasetItem?.category || 'General',
          size: 'medium',
          quantity: 1,
          unitPrice: derivedUnitPrice,
          totalPrice: derivedUnitPrice,
          weight,
          volume,
          image: imageUrl,
          workers_required: workersRequired,
          dismantling_required: dismantlingRequired,
          fragility_level: fragilityLevel,
          dismantling_time_minutes: catalogItem?.dismantling_time_minutes ?? 0,
          reassembly_time_minutes: catalogItem?.reassembly_time_minutes ?? 0,
          special_handling_notes: catalogItem?.special_handling_notes ?? '',
        },
      ],
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

  const updateItem = (itemId: string, updates: Partial<Item>) => {
    updateFormData('step1', {
      items: step1.items.map(i => 
        i.id === itemId ? { ...i, ...updates } : i
      )
    });
  };

  // Handle AI-generated items
  const handleGenerateAIList = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: aiPropertyType,
          moveType: aiMoveType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI suggestions');
      }

      const data = await response.json();
      
      if (data.success && data.items) {
        // Convert AI items to our Item format
        const aiItems: Item[] = data.items.map((aiItem: any, index: number) => {
          // Try to find matching item in catalog
          const catalogMatch = COMPREHENSIVE_CATALOG.find(
            item => item.name.toLowerCase() === aiItem.name.toLowerCase()
          );
          
          if (catalogMatch) {
            return {
              id: catalogMatch.id,
              name: catalogMatch.name,
              description: catalogMatch.name,
              category: catalogMatch.category,
              size: 'medium',
              quantity: aiItem.quantity || 1,
              weight: catalogMatch.weight,
              volume: catalogMatch.volume,
              unitPrice: Math.max(20, Math.round(catalogMatch.weight * 0.5 + catalogMatch.volume * 20)),
              totalPrice: (aiItem.quantity || 1) * Math.max(20, Math.round(catalogMatch.weight * 0.5 + catalogMatch.volume * 20)),
              image: catalogMatch.imageUrl || '',
              workers_required: catalogMatch.workers_required || 1,
              dismantling_required: catalogMatch.dismantling_required || 'No',
              fragility_level: catalogMatch.fragility_level || 'Standard',
            };
          }
          
          // If not in catalog, create a generic item
          return {
            id: `ai-item-${index}`,
            name: aiItem.name,
            description: aiItem.name,
            category: aiItem.category || 'other',
            size: 'medium',
            quantity: aiItem.quantity || 1,
            weight: 10,
            volume: 0.5,
            unitPrice: 25,
            totalPrice: (aiItem.quantity || 1) * 25,
            image: '',
            workers_required: 1,
            dismantling_required: 'No',
            fragility_level: 'Standard',
          };
        });
        
        // Add all AI items to the list
        updateFormData('step1', {
          items: [...step1.items, ...aiItems],
        });
        
        onAIModalClose();
        
        toast({
          title: 'AI List Generated!',
          description: `Added ${aiItems.length} items to your move`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI suggestions. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Images removed - no image helper function needed

  return (
    <Box maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        
        {/* Header */}
        <VStack spacing={4} textAlign="center">
          <Heading size="xl" color="white">
            What needs moving?
          </Heading>
          <Text color="gray.400" fontSize="lg" maxW="600px">
            Select the items you need to move. You can choose individual items or complete house packages.
          </Text>
        </VStack>

        {/* Address Input Section */}
        <Card bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.600" overflow="visible">
          <CardBody p={6} overflow="visible">
            <VStack spacing={6}>
              
              {/* Header */}
              <VStack spacing={2} textAlign="center">
                <Heading size="md" color="white">
                  📍 Pickup & Dropoff Locations
                </Heading>
                <Text color="gray.400">
                  Enter your addresses for accurate distance calculation
                </Text>
              </VStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full" overflow="visible">
                {/* Pickup Address */}
                <VStack spacing={4} align="stretch" overflow="visible">
                  <HStack spacing={3}>
                    <Circle size="40px" bg="green.600">
                      <Icon as={FaMapMarkerAlt} color="white" boxSize={5} />
                    </Circle>
                    <VStack align="start" spacing={0}>
                      <Text 
                        fontSize="lg" 
                        fontWeight="bold" 
                        color="white"
                        position="relative"
                        _before={isTypingPickupAddress ? {
                          content: '""',
                          position: 'absolute',
                          top: '0',
                          left: '-10px',
                          width: 'calc(100% + 20px)',
                          height: '100%',
                          background: 'linear-gradient(270deg, transparent, rgba(34, 197, 94, 0.5), transparent)',
                          backgroundSize: '200% 100%',
                          animation: 'greenWaveMove 4s linear infinite',
                          zIndex: 1
                        } : {}}
                        sx={{
                          '@keyframes greenWaveMove': {
                            '0%': {
                              backgroundPosition: '200% 0'
                            },
                            '100%': {
                              backgroundPosition: '-200% 0'
                            }
                          }
                        }}
                      >
                        Pickup Address
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Where we'll collect your items
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <Box
                    sx={{
                      '.chakra-input': {
                        bg: 'gray.700 !important',
                        borderColor: 'gray.600 !important',
                        color: 'white !important',
                        '&:focus': {
                          borderColor: 'green.500 !important',
                          boxShadow: '0 0 0 1px var(--chakra-colors-green-500) !important'
                        },
                        '&::placeholder': {
                          color: 'gray.400 !important'
                        }
                      },
                      '.chakra-button': {
                        bg: 'green.600 !important',
                        color: 'white !important',
                        '&:hover': {
                          bg: 'green.700 !important'
                        }
                      },
                      '.chakra-select': {
                        bg: 'gray.700 !important',
                        borderColor: 'gray.600 !important',
                        color: 'white !important'
                      }
                    }}
                  >
                    <UKAddressAutocomplete
                      id="pickup-address"
                      label="Pickup Address"
                      value={mapAddressToAutocomplete(step1.pickupAddress)}
                      onChange={(address) => {
                        const normalized = mapAutocompleteToAddress(address);
                        updateFormData('step1', {
                          pickupAddress: normalized,
                        });
                        // Stop wave when address is selected
                        if (normalized && (normalized.postcode || normalized.city)) {
                          setIsTypingPickupAddress(false);
                        }
                        // Pricing is now automatic via Enterprise Engine
                      }}
                      placeholder="Start typing your pickup address..."
                      helperText="Enter your full pickup address (street, postcode, etc.)"
                      isRequired={true}
                    />
                  </Box>

                </VStack>

                {/* Dropoff Address */}
                <VStack spacing={4} align="stretch" overflow="visible">
                  <HStack spacing={3}>
                    <Circle size="40px" bg="blue.600">
                      <Icon as={FaMapMarkerAlt} color="white" boxSize={5} />
                    </Circle>
                    <VStack align="start" spacing={0}>
                      <Text 
                        fontSize="lg" 
                        fontWeight="bold" 
                        color="white"
                        position="relative"
                        _before={isTypingDropoffAddress ? {
                          content: '""',
                          position: 'absolute',
                          top: '0',
                          left: '-10px',
                          width: 'calc(100% + 20px)',
                          height: '100%',
                          background: 'linear-gradient(270deg, transparent, rgba(59, 130, 246, 0.5), transparent)',
                          backgroundSize: '200% 100%',
                          animation: 'blueWaveMove 4s linear infinite',
                          zIndex: 1
                        } : {}}
                        sx={{
                          '@keyframes blueWaveMove': {
                            '0%': {
                              backgroundPosition: '200% 0'
                            },
                            '100%': {
                              backgroundPosition: '-200% 0'
                            }
                          }
                        }}
                      >
                        Dropoff Address
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Your destination
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <Box
                    sx={{
                      '.chakra-input': {
                        bg: 'gray.700 !important',
                        borderColor: 'gray.600 !important',
                        color: 'white !important',
                        '&:focus': {
                          borderColor: 'blue.500 !important',
                          boxShadow: '0 0 0 1px var(--chakra-colors-blue-500) !important'
                        },
                        '&::placeholder': {
                          color: 'gray.400 !important'
                        }
                      },
                      '.chakra-button': {
                        bg: 'blue.600 !important',
                        color: 'white !important',
                        '&:hover': {
                          bg: 'blue.700 !important'
                        }
                      },
                      '.chakra-select': {
                        bg: 'gray.700 !important',
                        borderColor: 'gray.600 !important',
                        color: 'white !important'
                      }
                    }}
                  >
                    <UKAddressAutocomplete
                      id="dropoff-address"
                      label="Dropoff Address"
                      value={mapAddressToAutocomplete(step1.dropoffAddress)}
                      onChange={(address) => {
                        const normalized = mapAutocompleteToAddress(address);
                        updateFormData('step1', {
                          dropoffAddress: normalized,
                        });
                        // Stop wave when address is selected
                        if (normalized && (normalized.postcode || normalized.city)) {
                          setIsTypingDropoffAddress(false);
                        }
                        // Pricing is now automatic via Enterprise Engine
                      }}
                      placeholder="Start typing your dropoff address..."
                      helperText="Enter your full dropoff address (street, postcode, etc.)"
                      isRequired={true}
                    />
                  </Box>

                </VStack>
              </SimpleGrid>

              {/* Address Summary */}
              <Card bg="gray.700" borderRadius="lg" border="1px solid" borderColor="gray.600">
                <CardBody p={4}>
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.400">Moving From</Text>
                      <Text color="white" fontWeight="medium">
                        {(typeof step1.pickupAddress === 'string' ? step1.pickupAddress : (step1.pickupAddress?.full || step1.pickupAddress?.line1 || step1.pickupAddress?.formatted_address)) || 'Not selected'}
                      </Text>
                    </VStack>
                    <Icon as={FaArrowRight} color="gray.400" />
                    <VStack align="end" spacing={1}>
                      <Text fontSize="sm" color="gray.400">Moving To</Text>
                      <Text color="white" fontWeight="medium">
                        {(typeof step1.dropoffAddress === 'string' ? step1.dropoffAddress : (step1.dropoffAddress?.full || step1.dropoffAddress?.line1 || step1.dropoffAddress?.formatted_address)) || 'Not selected'}
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
              
            </VStack>
          </CardBody>
        </Card>

        {/* Premium Date and Time Selection */}
        <Card bg="gray.800" borderRadius="xl" border="1px solid" borderColor="gray.600" overflow="hidden">
          <CardBody p={8}>
            <VStack spacing={8}>
              
              {/* Header */}
              <VStack spacing={3} textAlign="center">
                <Heading size="lg" color="white" fontWeight="bold">
                  When do you need the move?
                </Heading>
                <Text color="rgba(255, 255, 255, 0.7)" fontSize="lg">
                  Choose your preferred date and time
                </Text>
              </VStack>

              {/* Date Selection Cards */}
              <VStack align="stretch" spacing={6} w="full">
                <VStack align="start" spacing={4}>
                  <Text fontSize="xl" fontWeight="bold" color="white">
                    📅 Select Date
                  </Text>
                  
                  {/* 7 Date Cards - Starting Tomorrow */}
                  <SimpleGrid columns={{ base: 2, md: 4, lg: 7 }} spacing={3} w="full">
                    {(() => {
                      const dateCards = [];
                      for (let i = 1; i <= 7; i++) {
                        const date = new Date(Date.now() + (i * 86400000));
                        const dateString = date.toISOString().split('T')[0];
                        const isSelected = step1.pickupDate === dateString;
                        
                        dateCards.push(
                          <Card
                            key={i}
                            bg={isSelected ? "blue.600" : "rgba(255, 255, 255, 0.05)"}
                            border="2px solid"
                            borderColor={isSelected ? "green.400" : "red.400"}
                            borderRadius="xl"
                            cursor="pointer"
                            transition="all 0.3s"
                            position="relative"
                            _before={{
                              content: '""',
                              position: 'absolute',
                              top: '-2px',
                              left: '-2px',
                              right: '-2px',
                              bottom: '-2px',
                              background: isSelected 
                                ? 'linear-gradient(45deg, #10b981, #059669, #10b981)' 
                                : 'linear-gradient(45deg, #ef4444, #dc2626, #ef4444)',
                              borderRadius: 'xl',
                              zIndex: -1,
                              filter: 'blur(3px)',
                              opacity: 0.8
                            }}
                            _after={dateCardWaveActive && !isSelected ? {
                              content: '""',
                              position: 'absolute',
                              top: '0',
                              left: '0',
                              right: '0',
                              bottom: '0',
                              background: 'linear-gradient(270deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                              backgroundSize: '200% 100%',
                              animation: 'dateCardRightToLeftWave 5s linear infinite',
                              zIndex: 1,
                              borderRadius: 'xl',
                              filter: 'blur(2px)'
                            } : {}}
                            sx={{
                              '@keyframes dateCardRightToLeftWave': {
                                '0%': {
                                  backgroundPosition: '200% 0'
                                },
                                '100%': {
                                  backgroundPosition: '-200% 0'
                                }
                              }
                            }}
                            _hover={{
                              bg: isSelected ? "blue.500" : "rgba(255, 255, 255, 0.08)",
                              borderColor: isSelected ? "green.300" : "red.300",
                              transform: "translateY(-2px)",
                              boxShadow: isSelected 
                                ? "0 8px 25px rgba(16, 185, 129, 0.4)"
                                : "0 8px 25px rgba(239, 68, 68, 0.4)"
                            }}
                            onClick={() => updateFormData('step1', { pickupDate: dateString })}
                          >
                            <CardBody p={3} textAlign="center">
                              <VStack spacing={2}>
                                <Text fontSize="xl">
                                  {i === 1 ? '🌅' : 
                                   date.getDay() === 0 || date.getDay() === 6 ? '🎯' : '📅'}
                                </Text>
                                <Text fontWeight="bold" color="white" fontSize="sm">
                                  {i === 1 ? 'Tomorrow' : 
                                   date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </Text>
                                <Text fontSize="xs" color="rgba(255, 255, 255, 0.7)">
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
                      bg="rgba(168, 85, 247, 0.1)"
                      border="2px solid"
                      borderColor="rgba(168, 85, 247, 0.3)"
                      borderRadius="xl"
                      cursor="pointer"
                      transition="all 0.3s"
                      maxW="300px"
                      mx="auto"
                      _hover={{
                        bg: "rgba(168, 85, 247, 0.15)",
                        borderColor: "purple.400",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 25px rgba(168, 85, 247, 0.2)"
                      }}
                      onClick={() => {
                        // Create a new date input element
                        const dateInput = document.createElement('input');
                        dateInput.type = 'date';
                        dateInput.min = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                        dateInput.value = step1.pickupDate || '';
                        
                        // Style it to be invisible but functional
                        dateInput.style.position = 'fixed';
                        dateInput.style.top = '50%';
                        dateInput.style.left = '50%';
                        dateInput.style.transform = 'translate(-50%, -50%)';
                        dateInput.style.zIndex = '9999';
                        dateInput.style.opacity = '0';
                        dateInput.style.pointerEvents = 'none';
                        
                        // Add to DOM
                        document.body.appendChild(dateInput);
                        
                        // Try to open picker
                        setTimeout(() => {
                          if (dateInput.showPicker) {
                            dateInput.showPicker();
                          } else {
                            // Fallback: trigger click
                            dateInput.click();
                          }
                        }, 10);
                        
                        // Handle date selection
                        dateInput.addEventListener('change', (e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.value) {
                            updateFormData('step1', { pickupDate: target.value });
                          }
                          // Remove the temporary input
                          document.body.removeChild(dateInput);
                        });
                        
                        // Remove input if user clicks outside
                        const removeInput = () => {
                          if (document.body.contains(dateInput)) {
                            document.body.removeChild(dateInput);
                          }
                          document.removeEventListener('click', removeInput);
                        };
                        
                        setTimeout(() => {
                          document.addEventListener('click', removeInput);
                        }, 100);
                      }}
                    >
                      <CardBody p={4} textAlign="center">
                        <VStack spacing={2}>
                          <Text fontSize="2xl">📆</Text>
                          <Text fontWeight="bold" color="white" fontSize="md">
                            Choose Future Date
                          </Text>
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
                            Open calendar picker
                          </Text>
                  </VStack>

                  {/* Hidden Date Picker */}
                  <Input
                    id="hidden-date-picker"
                    type="date"
                    position="absolute"
                    left="-9999px"
                    opacity={0}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow minimum
                    value={step1.pickupDate || ''}
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

                {/* Time Selection Cards */}
                <VStack align="start" spacing={4}>
                  <Text fontSize="xl" fontWeight="bold" color="white">
                    ⏰ Select Time
                  </Text>
                  
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2, md: 4 }} w="full">
                    {timeSlots.map((slot) => (
                      <Card
                        key={slot}
                        bg={step1.pickupTimeSlot === slot ? "green.600" : "rgba(255, 255, 255, 0.05)"}
                        border="2px solid"
                        borderColor={step1.pickupTimeSlot === slot ? "green.400" : "red.400"}
                        borderRadius="xl"
                        cursor="pointer"
                        transition="all 0.3s"
                        position="relative"
                        _before={{
                          content: '""',
                          position: 'absolute',
                          top: '-2px',
                          left: '-2px',
                          right: '-2px',
                          bottom: '-2px',
                          background: step1.pickupTimeSlot === slot 
                            ? 'linear-gradient(45deg, #10b981, #059669, #10b981)' 
                            : 'linear-gradient(45deg, #ef4444, #dc2626, #ef4444)',
                          borderRadius: 'xl',
                          zIndex: -1,
                          filter: 'blur(3px)',
                          opacity: 0.8
                        }}
                        _hover={{
                          bg: step1.pickupTimeSlot === slot ? "green.500" : "rgba(255, 255, 255, 0.08)",
                          borderColor: step1.pickupTimeSlot === slot ? "green.300" : "red.300",
                          transform: "translateY(-2px)",
                          boxShadow: step1.pickupTimeSlot === slot 
                            ? "0 8px 25px rgba(16, 185, 129, 0.4)"
                            : "0 8px 25px rgba(239, 68, 68, 0.4)"
                        }}
                        onClick={() => updateFormData('step1', { pickupTimeSlot: slot })}
                      >
                        <CardBody p={{ base: 2, md: 4 }} textAlign="center">
                          <VStack spacing={{ base: 1, md: 2 }}>
                            <Text fontSize={{ base: "lg", md: "xl" }}>🕐</Text>
                            <Text fontWeight="bold" color="white" fontSize={{ base: "xs", md: "sm" }}>
                              {slot}
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>

                </VStack>

                {/* Selection Summary */}
                {step1.pickupDate && (
                  <Card 
                    bg="rgba(34, 197, 94, 0.1)" 
                    border="2px solid rgba(34, 197, 94, 0.3)"
                    borderRadius="xl"
                    overflow="hidden"
                  >
                    <CardBody p={6}>
                      <HStack justify="center" spacing={8}>
                        <VStack spacing={2}>
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" fontWeight="medium">
                            📅 Selected Date
                          </Text>
                          <Text color="white" fontWeight="bold" fontSize="lg">
                            {step1.pickupDate ? 
                              new Date(step1.pickupDate + 'T00:00:00').toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric'
                              }) : 
                              'Not selected'
                            }
                          </Text>
                        </VStack>
                        
                        <Box w="1px" h="60px" bg="rgba(255, 255, 255, 0.2)" />
                        
                        <VStack spacing={2}>
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" fontWeight="medium">
                            ⏰ Selected Time
                          </Text>
                          <Text color="white" fontWeight="bold" fontSize="lg">
                            {step1.pickupTimeSlot || 'Flexible (Optional)'}
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                )}

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

        {/* Item Selection */}
        <Card bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.600">
          <CardBody p={6}>
            <VStack spacing={6}>
              
              {/* Header */}
              <VStack spacing={2} textAlign="center">
                <Heading size="md" color="white">
                  Select Your Items
                </Heading>
                <Text color="gray.400" fontSize="md">
                  Choose how you'd like to add items
                </Text>
              </VStack>

              {/* Stats */}
              <Wrap spacing={8} justify="center" w="full">
                <WrapItem>
                  <VStack spacing={1}>
                    <Text fontSize="xl" fontWeight="bold" color="blue.400">
                      {individualItems.length}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Available Items
                    </Text>
                  </VStack>
                </WrapItem>
                
                <WrapItem>
                  <VStack spacing={1}>
                    <Text fontSize="xl" fontWeight="bold" color="green.400">
                      {groupedanys.length}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Categories
                    </Text>
                  </VStack>
                </WrapItem>

                <WrapItem>
                  <VStack spacing={1}>
                    <Text fontSize="xl" fontWeight="bold" color="purple.400">
                      {step1.items.length}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Items Selected
                    </Text>
                  </VStack>
                </WrapItem>
              </Wrap>

              {/* Trending Items Carousel */}
              <Card bg="gray.700" borderRadius="lg" p={{ base: 2, md: 4 }} position="relative" overflow="visible">
                <VStack spacing={{ base: 2, md: 3 }}>
                  <HStack justify="space-between" w="full">
                    <Badge 
                      colorScheme="purple" 
                      fontSize={{ base: "xs", md: "sm" }} 
                      px={{ base: 2, md: 3 }} 
                      py={1}
                      position="relative"
                      overflow="visible"
                      minW={{ base: "100px", md: "140px" }}
                      minH={{ base: "20px", md: "26px" }}
                      display="inline-flex"
                      alignItems="center"
                    >
                      <Text
                        as="span"
                        position="relative"
                        color="red.500"
                        fontWeight="bold"
                        sx={{
                          background: 'linear-gradient(90deg, #DC2626, #EF4444, #F87171, #EF4444, #DC2626)',
                          backgroundSize: '200% auto',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          animation: 'fireGlow 2s linear infinite',
                          '@keyframes fireGlow': {
                            '0%': { backgroundPosition: '0% center' },
                            '100%': { backgroundPosition: '200% center' },
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: `${(trendingText.length / 17) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
                            transition: 'width 0.15s ease-out',
                            pointerEvents: 'none',
                          },
                        }}
                      >
                        {trendingText}
                        <Text 
                          as="span" 
                          display="inline-block" 
                          w="2px" 
                          h="1em" 
                          bg="white" 
                          ml="2px"
                          animation="blink 1s infinite"
                          sx={{
                            '@keyframes blink': {
                              '0%, 49%': { opacity: 1 },
                              '50%, 100%': { opacity: 0 },
                            },
                          }}
                        >
                          |
                        </Text>
                      </Text>
                    </Badge>
                    <HStack spacing={{ base: 2, md: 3 }}>
                      <IconButton
                        aria-label="Previous item"
                        icon={<FaChevronLeft />}
                        size={{ base: "sm", md: "md" }}
                        colorScheme="purple"
                        variant="solid"
                        onClick={handleTrendingPrev}
                        _hover={{ bg: 'purple.600', transform: 'scale(1.15)', boxShadow: 'lg' }}
                        transition="all 0.2s"
                        borderRadius="full"
                        boxShadow="md"
                      />
                      <IconButton
                        aria-label="Next item"
                        icon={<FaChevronRight />}
                        size={{ base: "sm", md: "md" }}
                        colorScheme="purple"
                        variant="solid"
                        onClick={handleTrendingNext}
                        _hover={{ bg: 'purple.600', transform: 'scale(1.15)', boxShadow: 'lg' }}
                        transition="all 0.2s"
                        borderRadius="full"
                        boxShadow="md"
                      />
                    </HStack>
                  </HStack>

                  <Box w="full" position="relative" minH={{ base: "140px", md: "200px" }} overflow="visible">
                    <HStack spacing={{ base: 2, md: 4 }} justify="center" align="center" overflow="visible">
                      {[0, 1, 2].map((offset) => {
                        const index = (trendingCarouselIndex + offset) % trendingItems.length;
                        const item = trendingItems[index];
                        const isCenter = offset === 1;
                        
                        return (
                          <VStack
                            key={`${item.id}-${index}`}
                            spacing={{ base: 1, md: 2 }}
                            bg="gray.800"
                            p={{ base: 2, md: 3 }}
                            borderRadius="md"
                            border="2px solid"
                            borderColor={isCenter ? 'purple.500' : 'blue.500'}
                            _hover={{
                              borderColor: isCenter ? 'purple.400' : 'blue.400',
                              transform: 'translateY(-4px) scale(1.05)',
                              boxShadow: isCenter 
                                ? '0 8px 16px rgba(159, 122, 234, 0.5)'
                                : '0 8px 16px rgba(66, 153, 225, 0.4)',
                            }}
                            transition="all 0.3s ease-in-out"
                            cursor="pointer"
                            w={{ base: '100px', md: '160px' }}
                            opacity={1}
                            transform={isCenter ? 'scale(1.05)' : 'scale(1)'}
                            position="relative"
                          >
                            {isCenter && (
                              <Badge
                                position="absolute"
                                top="-12px"
                                right="-12px"
                                colorScheme="purple"
                                fontSize="xs"
                                zIndex={10}
                                px={2}
                                py={1}
                                borderRadius="md"
                                boxShadow="lg"
                              >
                                🔥 Hot
                              </Badge>
                            )}
                            <Box
                              position="relative"
                              w={{ base: '80px', md: '130px' }}
                              h={{ base: '80px', md: '130px' }}
                              borderRadius="md"
                              overflow="hidden"
                              bg="gray.700"
                            >
                              <Image
                                src={item.image}
                                alt={item.name}
                                objectFit="cover"
                                w="full"
                                h="full"
                                fallbackSrc={datasetFallbackImage}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = datasetFallbackImage;
                                }}
                              />
                              {/* Add/Remove Buttons */}
                              <HStack
                                position="absolute"
                                bottom="2px"
                                right="2px"
                                spacing={{ base: 0.5, md: 1 }}
                                zIndex={3}
                              >
                                <IconButton
                                  aria-label="Remove from cart"
                                  icon={<FaMinus />}
                                  size={{ base: "sm", md: "lg" }}
                                  variant={{ base: "ghost", md: "solid" }}
                                  borderRadius="full"
                                  _hover={{ transform: 'scale(1.1)', bg: 'red.600' }}
                                  transition="all 0.2s"
                                  opacity={1}
                                  minW={{ base: "28px", md: "36px" }}
                                  h={{ base: "28px", md: "36px" }}
                                  w={{ base: "28px", md: "36px" }}
                                  bg={{ base: "transparent", md: "red.500" }}
                                  color={{ base: "red.500", md: "white" }}
                                  border={{ base: "2px solid red.500", md: "none" }}
                                  boxShadow={{ base: "0 2px 4px rgba(0,0,0,0.3)", md: "none" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const existingItem = step1.items.find(i => i.id === item.id);
                                    if (existingItem) {
                                      removeItem(item.id);
                                      toast({
                                        title: 'Item Removed!',
                                        description: `${item.name} removed from your list`,
                                        status: 'info',
                                        duration: 2000,
                                        isClosable: true,
                                        position: 'top',
                                      });
                                    }
                                  }}
                                />
                                <IconButton
                                  aria-label="Add to cart"
                                  icon={<FaPlus />}
                                  size={{ base: "sm", md: "lg" }}
                                  variant={{ base: "ghost", md: "solid" }}
                                  borderRadius="full"
                                  _hover={{ transform: 'scale(1.1)', bg: 'green.600' }}
                                  transition="all 0.2s"
                                  opacity={1}
                                  minW={{ base: "28px", md: "36px" }}
                                  h={{ base: "28px", md: "36px" }}
                                  w={{ base: "28px", md: "36px" }}
                                  bg={{ base: "transparent", md: "green.500" }}
                                  color={{ base: "green.500", md: "white" }}
                                  border={{ base: "2px solid green.500", md: "none" }}
                                  boxShadow={{ base: "0 2px 4px rgba(0,0,0,0.3)", md: "none" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addItem({
                                      id: item.id,
                                      name: item.name,
                                      category: item.category,
                                    });
                                    toast({
                                      title: 'Item Added!',
                                      description: `${item.name} added to your list`,
                                      status: 'success',
                                      duration: 2000,
                                      isClosable: true,
                                      position: 'top',
                                    });
                                  }}
                                />
                              </HStack>
                            </Box>
                            <VStack spacing={0} align="center">
                              <Text fontSize={{ base: "2xs", md: "xs" }} fontWeight="bold" color="white" textAlign="center" noOfLines={1}>
                                {item.name}
                              </Text>
                              <Badge colorScheme={isCenter ? 'purple' : 'blue'} fontSize={{ base: "2xs", md: "xs" }}>
                                {item.category}
                              </Badge>
                            </VStack>
                          </VStack>
                        );
                      })}
                    </HStack>

                    {/* Carousel Indicators */}
                    <HStack justify="center" mt={{ base: 2, md: 3 }} spacing={2}>
                      {trendingItems.map((_, index) => (
                        <Circle
                          key={index}
                          size={{ base: "6px", md: "8px" }}
                          bg={index === trendingCarouselIndex ? 'blue.400' : 'gray.600'}
                          cursor="pointer"
                          onClick={() => setTrendingCarouselIndex(index)}
                          transition="all 0.2s"
                          _hover={{ bg: 'blue.300' }}
                        />
                      ))}
                    </HStack>
                  </Box>
                </VStack>
              </Card>

              {/* Selection Modes */}
              <Wrap spacing={3} justify="center" w="full">
                <WrapItem>
                  <Button 
                    variant={itemSelectionMode === 'bedroom' ? 'solid' : 'outline'}
                    bg={itemSelectionMode === 'bedroom' ? 'blue.600' : 'gray.700'}
                    color="white"
                    borderColor="gray.600"
                    onClick={() => setItemSelectionMode('bedroom')}
                    leftIcon={<FaHome />}
                    _hover={{ bg: 'blue.700' }}
                  >
                    House Packages
                  </Button>
                </WrapItem>
                <WrapItem>
                  <Button 
                    variant={itemSelectionMode === 'smart' ? 'solid' : 'outline'}
                    bg={itemSelectionMode === 'smart' ? 'purple.600' : 'gray.700'}
                    color="white"
                    borderColor="gray.600"
                    onClick={() => setItemSelectionMode('smart')}
                    leftIcon={<FaSearch />}
                    _hover={{ bg: 'purple.700' }}
                  >
                    Search Items
                  </Button>
                </WrapItem>
                <WrapItem>
                  <Button 
                    variant={itemSelectionMode === 'choose' ? 'solid' : 'outline'}
                    bg={itemSelectionMode === 'choose' ? 'green.600' : 'gray.700'}
                    color="white"
                    borderColor="gray.600"
                    onClick={() => setItemSelectionMode('choose')}
                    leftIcon={<FaCouch />}
                    _hover={{ bg: 'green.700' }}
                  >
                    Individual Items
                  </Button>
                </WrapItem>
              </Wrap>

              {/* Quick Actions: Quick Quote & AI Estimate */}
              <HStack spacing={3} w="full" justify="center" mt={4}>
                <Button
                  size="lg"
                  colorScheme="yellow"
                  leftIcon={<Icon as={FaBolt} />}
                  _hover={{ 
                    transform: 'translateY(-2px)',
                    shadow: 'lg'
                  }}
                  borderRadius="lg"
                  px={6}
                  fontWeight="bold"
                  onClick={() => {
                    toast({
                      title: 'Quick Quote',
                      description: 'Quick quote feature coming soon!',
                      status: 'info',
                      duration: 3000,
                      isClosable: true,
                    });
                  }}
                >
                  ⚡ Quick Quote
                </Button>
                
                <Button
                  size="lg"
                  colorScheme="purple"
                  leftIcon={<Icon as={FaRobot} />}
                  rightIcon={<Icon as={FaForward} />}
                  onClick={onAIModalOpen}
                  _hover={{ 
                    transform: 'translateY(-2px)',
                    shadow: 'lg'
                  }}
                  borderRadius="lg"
                  px={6}
                  fontWeight="bold"
                >
                  ⏭️ Skip Items & Use AI Estimate
                </Button>
              </HStack>

              <Divider borderColor="gray.600" />

              {/* House Packages Mode */}
              {itemSelectionMode === 'bedroom' && (
                <VStack spacing={4} w="full">
                  <Text fontSize="lg" color="white" fontWeight="semibold" textAlign="center">
                    Complete House Moving Packages
                  </Text>
                  
                  {/* Mobile: Horizontal scroll */}
                  <Box 
                    display={{ base: "block", md: "none" }}
                    overflowX="auto"
                    w="full"
                    css={{
                      '&::-webkit-scrollbar': {
                        height: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(59, 130, 246, 0.5)',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: 'rgba(59, 130, 246, 0.7)',
                      },
                    }}
                  >
                    <HStack spacing={4} align="stretch" minW="max-content" p={2}>
                      {bedroomPackages.map((pkg) => (
                        <Card
                          key={pkg.id}
                          bg="gray.700"
                          borderRadius="lg"
                          border="1px solid"
                          borderColor="gray.600"
                          cursor="pointer"
                          _hover={{ 
                            borderColor: "blue.500",
                            transform: "translateY(-2px)",
                            shadow: "lg"
                          }}
                          onClick={() => addItem(pkg as any)}
                          transition="all 0.2s ease"
                          minW="280px"
                          maxW="320px"
                          flex="0 0 auto"
                        >
                          <CardBody p={4} textAlign="center">
                            <VStack spacing={3}>
                              {/* Package Image */}
                              <ItemImage src={pkg.image} alt={`${pkg.name} package`} size={100} />
                              
                              {/* Package Details */}
                              <VStack spacing={2}>
                                <Text fontSize="md" color="white" fontWeight="bold">
                                  {pkg.name}
                                </Text>
                                <Badge colorScheme="blue" variant="solid" fontSize="xs">
                                  ~{pkg.items} items
                                </Badge>
                                <Text fontSize="xs" color="gray.400" textAlign="center" noOfLines={2}>
                                  Includes furniture, appliances & essentials
                                </Text>
                              </VStack>

                              {/* Add Button */}
                              <Button
                                size="sm"
                                colorScheme="blue"
                                leftIcon={<FaPlus />}
                                w="full"
                                fontSize="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addItem(pkg as any);
                                }}
                              >
                                Select
                              </Button>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </HStack>
                  </Box>

                  {/* Desktop: Grid layout */}
                  <SimpleGrid columns={3} spacing={4} w="full" display={{ base: "none", md: "grid" }}>
                    {bedroomPackages.map((pkg) => (
                      <Card
                        key={pkg.id}
                        bg="gray.700"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="gray.600"
                        cursor="pointer"
                        _hover={{ 
                          borderColor: "blue.500",
                          transform: "translateY(-2px)",
                          shadow: "lg"
                        }}
                        onClick={() => addItem(pkg as any)}
                        transition="all 0.2s ease"
                      >
                        <CardBody p={5} textAlign="center">
                          <VStack spacing={4}>
                            {/* Package Image */}
                            <ItemImage src={pkg.image} alt={`${pkg.name} package`} size={140} />
                            
                            {/* Package Details */}
                            <VStack spacing={2}>
                              <Text fontSize="lg" color="white" fontWeight="bold">
                                {pkg.name}
                              </Text>
                              <Badge colorScheme="blue" variant="solid">
                                ~{pkg.items} items included
                              </Badge>
                              <Text fontSize="xs" color="gray.400" textAlign="center">
                                Includes furniture, appliances & essentials
                              </Text>
                            </VStack>

                            {/* Add Button */}
                            <Button
                              size="sm"
                              colorScheme="blue"
                              leftIcon={<FaPlus />}
                              w="full"
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem(pkg as any);
                              }}
                            >
                              Select Package
                            </Button>
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
                      '&:focus': {
                        borderColor: 'purple.500 !important',
                        boxShadow: '0 0 0 1px var(--chakra-colors-purple-500) !important'
                      },
                      '&::placeholder': {
                        color: 'gray.400 !important'
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
                      placeholder="3 seats sofa"
                    />
                  </Box>
                  
                </VStack>
              )}

              {/* Individual Items Mode */}
              {itemSelectionMode === 'choose' && (
                <VStack spacing={6} w="full" align="stretch">
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
                        <FormControl w={{ base: '100%', md: '45%' }}>
                          <FormLabel 
                            color="gray.300" 
                            fontSize="xl"
                            fontWeight="bold"
                            sx={{
                              '@keyframes yellowWavyLight': {
                                '0%': {
                                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.9) 15%, rgba(255, 215, 0, 1) 30%, rgba(255, 215, 0, 0.9) 45%, transparent 60%, transparent 100%)',
                                  backgroundSize: '300% 100%',
                                  backgroundPosition: '100% 0',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text',
                                },
                                '100%': {
                                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.9) 15%, rgba(255, 215, 0, 1) 30%, rgba(255, 215, 0, 0.9) 45%, transparent 60%, transparent 100%)',
                                  backgroundSize: '300% 100%',
                                  backgroundPosition: '-200% 0',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text',
                                },
                              },
                              animation: 'yellowWavyLight 8s linear infinite',
                              position: 'relative',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.4) 15%, rgba(255, 215, 0, 0.6) 30%, rgba(255, 215, 0, 0.4) 45%, transparent 60%, transparent 100%)',
                                borderRadius: '8px',
                                animation: 'yellowWavyLight 8s linear infinite',
                                zIndex: -1,
                                filter: 'blur(4px)',
                              },
                            }}
                          >
                            Filter by category
                          </FormLabel>
                          <Box
                            position="relative"
                            borderRadius="lg"
                            p="1px"
                            bg="linear-gradient(45deg, #10B981, #34D399, #6EE7B7, #A7F3D0, #10B981)"
                            animation="neonGlow 2s ease-in-out infinite alternate"
                            sx={{
                              '@keyframes neonGlow': {
                                '0%': {
                                  boxShadow: '0 0 5px rgba(16, 185, 129, 0.5), 0 0 10px rgba(16, 185, 129, 0.3), 0 0 15px rgba(16, 185, 129, 0.2)',
                                },
                                '100%': {
                                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.4)',
                                },
                              },
                            }}
                          >
                            <Select
                              value={selectedCategory}
                              onChange={(event) => setSelectedCategory(event.target.value)}
                              bg="gray.700"
                              borderColor="transparent"
                              color="white"
                              borderRadius="md"
                              _focus={{
                                borderColor: 'transparent',
                                boxShadow: 'none',
                                '& + div': {
                                  boxShadow: '0 0 25px rgba(16, 185, 129, 1), 0 0 35px rgba(16, 185, 129, 0.8), 0 0 45px rgba(16, 185, 129, 0.6)',
                                }
                              }}
                              _hover={{
                                '& + div': {
                                  animation: 'neonGlow 1s ease-in-out infinite alternate',
                                }
                              }}
                            >
                            <option style={{ color: '#1A202C', background: '#EDF2F7' }} value="All">
                              All Categories
                            </option>
                            {groupedanys.map((group) => (
                              <option
                                key={group.category}
                                style={{ color: '#1A202C', background: '#EDF2F7' }}
                                value={group.category}
                              >
                                {group.category}
                              </option>
                            ))}
                          </Select>
                          </Box>
                        </FormControl>
                        <VStack align="start" spacing={1} flex="1">
                          <Text color="gray.300" fontSize="sm" fontWeight="semibold">
                            Dataset coverage
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            Showing {filteredanys.length} of {individualItems.length} curated items.
                          </Text>
                        </VStack>
                      </Flex>

                      {filteredGroupedItems.length === 0 ? (
                        <Card bg="gray.700" border="1px dashed" borderColor="gray.500">
                          <CardBody>
                            <VStack spacing={2}>
                              <Text color="gray.200" fontWeight="medium">
                                No items match the current filters.
                              </Text>
                              <Text color="gray.400" fontSize="sm" textAlign="center">
                                Try clearing the category filter or use the smart search to find specialised items.
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                      ) : (
                        <VStack spacing={4} align="stretch">
                          {filteredGroupedItems.map((group) => (
                            <Card key={group.category} bg="gray.700" border="1px solid" borderColor="gray.600">
                              <CardBody>
                                <VStack align="stretch" spacing={4}>
                                <HStack justify="space-between" align="center">
                                  <HStack spacing={3}>
                                    <Text fontWeight="bold" color="white" fontSize="lg">
                                      {group.category}
                                    </Text>
                                    <Badge colorScheme="blue" variant="subtle">
                                      {group.items.length} items
                                    </Badge>
                                  </HStack>
                                </HStack>

                                <SimpleGrid columns={{ base: 2, sm: 2, md: 2, lg: 3, xl: 4 }} spacing={{ base: 3, md: 6 }} w="full">
                                  {group.items.map((item) => {
                                    const imageSrc = item.image && item.image.length > 0 ? item.image : datasetFallbackImage;
                                    const itemId = item.id.toString();
                                    const isSelected = selectedItemIds.has(itemId);
                                    const currentQuantity = step1.items.find(i => i.id === itemId)?.quantity || 0;

                                    return (
                                      <VStack 
                                        key={item.id} 
                                        spacing={{ base: 2, md: 3 }} 
                                        align="center"
                                        position="relative"
                                        _before={{
                                          content: '""',
                                          position: 'absolute',
                                          top: '-3px',
                                          left: '-3px',
                                          right: '-3px',
                                          bottom: '-3px',
                                          background: isSelected 
                                            ? 'linear-gradient(45deg, #10b981, #059669, #10b981)' 
                                            : 'linear-gradient(45deg, #ef4444, #dc2626, #ef4444)',
                                          borderRadius: 'xl',
                                          zIndex: -1,
                                          filter: 'blur(4px)',
                                          opacity: 0.9
                                        }}
                                      >
                                        <ItemImage src={imageSrc} alt={item.name} isSelected={isSelected} />
                                        <VStack spacing={{ base: 1, md: 2 }} align="center">
                                          <Text color="white" fontWeight="semibold" fontSize={{ base: "xs", md: "sm" }} textAlign="center" noOfLines={2}>
                                            {item.name}
                                          </Text>
                                          <Text color="gray.300" fontSize={{ base: "2xs", md: "xs" }}>
                                            {item.weight.toFixed(1)} kg
                                          </Text>
                                          <Box h="8px" /> {/* Spacer between weight and buttons */}

                                          {(() => {

                                            if (isSelected) {
                                              return (
                                                <HStack spacing={4} justify="center" bg="rgba(0, 0, 0, 0.4)" borderRadius="xl" p={3} border="2px solid rgba(255, 255, 255, 0.1)">
                                                  <Button
                                                    variant="enhanced-minus"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      updateQuantity(itemId, Math.max(0, currentQuantity - 1));
                                                    }}
                                                    borderRadius="full"
                                                    w="48px"
                                                    h="48px"
                                                    fontSize="24px"
                                                    fontWeight="bold"
                                                    aria-label="Decrease quantity"
                                                  >
                                                    −
                                                  </Button>
                                                  <Box
                                                    borderRadius="full"
                                                    w="48px"
                                                    h="48px"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    fontSize="18px"
                                                    fontWeight="bold"
                                                    bg="linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                                                    color="white"
                                                    animation="pulse 2s ease-in-out infinite"
                                                    boxShadow="0 8px 25px rgba(251, 191, 36, 0.6), inset 0 2px 10px rgba(255, 255, 255, 0.3)"
                                                  >
                                                    {currentQuantity}
                                                  </Box>
                                                  <Button
                                                    variant="enhanced-plus"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      updateQuantity(itemId, currentQuantity + 1);
                                                    }}
                                                    borderRadius="full"
                                                    w="48px"
                                                    h="48px"
                                                    fontSize="24px"
                                                    fontWeight="bold"
                                                    aria-label="Increase quantity"
                                                  >
                                                    +
                                                  </Button>
                                                </HStack>
                                              );
                                            }

                                            return (
                                              <Button
                                                variant="enhanced-add"
                                                onClick={() => addItem(item as any)}
                                                borderRadius="full"
                                                w="52px"
                                                h="52px"
                                                fontSize="28px"
                                                fontWeight="bold"
                                                aria-label="Add item to cart"
                                              >
                                                +
                                              </Button>
                                            );
                                          })()}
                                        </VStack>
                                      </VStack>
                                    );
                                  })}
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
            <CardBody p={6}>
              <VStack spacing={4}>
                <Heading size="md" color="white">
                  Selected Items ({step1.items.length})
                </Heading>
                
                <VStack spacing={3} w="full">
                  {step1.items.map((item) => {
                    // Check if item was added from search (no image or empty image)
                    const isFromSearch = !item.image || item.image === '';
                    const imageSrc = isFromSearch ? datasetFallbackImage : (item.image || datasetFallbackImage);

                    return (
                      <HStack key={item.id} justify="space-between" w="full" p={4} bg="gray.700" borderRadius="lg">
                        <HStack spacing={4}>
                          {isFromSearch ? (
                            <ItemIconDisplay category={item.category || 'General'} size={70} />
                          ) : (
                          <ItemImage src={imageSrc} alt={item.name || 'Item'} size={70} />
                          )}
                          
                          {/* Item Details */}
                          <VStack align="start" spacing={1}>
                            <Text color="white" fontWeight="medium" fontSize="md">
                              {item.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {item.category}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <HStack spacing={3}>
                          {/* Enhanced Quantity Controls */}
                          <HStack spacing={2} bg="gray.800" borderRadius="lg" p={2} border="1px solid" borderColor="gray.600">
                            <Button
                              variant="enhanced-minus"
                              size="xs"
                              onClick={() => updateQuantity(item.id!, (item.quantity || 0) - 1)}
                              aria-label="Decrease quantity"
                              minW="32px"
                              h="32px"
                              borderRadius="full"
                            >
                              <FaMinus fontSize="10px" />
                            </Button>
                            <Box
                              minW="40px"
                              h="32px"
                              borderRadius="lg"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              bg="linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                              color="white"
                              fontWeight="bold"
                              fontSize="sm"
                              animation="pulse 2s ease-in-out infinite"
                              boxShadow="0 8px 25px rgba(251, 191, 36, 0.6), inset 0 2px 10px rgba(255, 255, 255, 0.3)"
                            >
                              {item.quantity || 0}
                            </Box>
                            <Button
                              variant="enhanced-plus"
                              size="xs"
                              onClick={() => updateQuantity(item.id!, (item.quantity || 0) + 1)}
                              aria-label="Increase quantity"
                              minW="32px"
                              h="32px"
                              borderRadius="full"
                            >
                              <FaPlus fontSize="10px" />
                            </Button>
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
                          />
                          

                        </HStack>
                      </HStack>
                    );
                  })}
                </VStack>


              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Price Summary & Cart */}
        <Card bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.600">
          <CardBody p={6}>
            <VStack spacing={6}>
              
              {/* Header */}
              <VStack spacing={2} textAlign="center">
                <Heading size="md" color="white">
                  💰 Price Summary
                </Heading>
                <Text color="gray.400">
                  Your estimated total
                </Text>
              </VStack>

              {/* Selected Items Cart */}
              {step1.items.length > 0 && (
                <Card bg="gray.700" borderRadius="lg" border="1px solid" borderColor="gray.600">
                  <CardBody p={4}>
                    <VStack spacing={3}>
                      <Text fontSize="lg" fontWeight="bold" color="white" mb={2}>
                        🛒 Selected Items ({step1.items.length})
                      </Text>
                      
                      <VStack spacing={2} w="full" maxH="200px" overflowY="auto">
                        {step1.items.map((item) => {
                          // Check if item was added from search (no image or empty image)
                          const isFromSearch = !item.image || item.image === '';
                          const imageSrc = isFromSearch ? datasetFallbackImage : (item.image || datasetFallbackImage);

                          return (
                            <HStack key={item.id} justify="space-between" w="full" p={2} bg="gray.600" borderRadius="lg">
                              <HStack spacing={3}>
                                {isFromSearch ? (
                                  <ItemIconDisplay category={item.category || 'General'} size={48} />
                                ) : (
                                <ItemImage src={imageSrc} alt={item.name || 'Item'} size={48} />
                                )}
                                <VStack align="start" spacing={0}>
                                  <Text color="white" fontWeight="medium">{item.name}</Text>
                                  <Text color="gray.400" fontSize="sm">Qty: {item.quantity}</Text>
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
          <Card bg="gray.800" borderRadius="lg" border="1px solid" borderColor="blue.600">
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md" color="white">
                    Service Options
                  </Heading>
                  {isLoadingAvailability && (
                    <HStack spacing={2}>
                      <Spinner size="sm" color="blue.400" />
                      <Text fontSize="sm" color="blue.400">Checking availability...</Text>
                    </HStack>
                  )}
                </HStack>
                
                <Text fontSize="sm" color="gray.400">
                  Prices and availability calculated automatically using full address data
                </Text>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  {/* Economy Multi-Drop */}
                  <Card 
                    bg={pricingTiers?.economy?.available ? "green.900" : "gray.900"} 
                    borderColor={pricingTiers?.economy?.available ? "green.500" : "gray.600"}
                    border="1px solid"
                    opacity={pricingTiers?.economy?.available ? 1 : 0.6}
                  >
                    <CardBody p={4}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontWeight="bold" color="white">Economy</Text>
                          <Badge colorScheme={pricingTiers?.economy?.available ? "green" : "gray"}>
                            Multi-Drop
                          </Badge>
                        </HStack>
                        
                        {pricingTiers?.economy?.price && (
                          <Text fontSize="2xl" fontWeight="bold" color="green.400">
                            £{pricingTiers.economy.price}
                          </Text>
                        )}
                        
                        {pricingTiers?.economy?.availability ? (
                          <VStack spacing={1} align="start">
                            <Text fontSize="sm" color="white">
                              {pricingTiers.economy.availability.route_type === 'economy' && 
                               pricingTiers.economy.availability.next_available_date === new Date().toISOString().split('T')[0]
                                ? "Available tomorrow"
                                : `Next available: ${new Date(pricingTiers.economy.availability.next_available_date).toLocaleDateString()}`
                              }
                            </Text>
                            <Tooltip label={pricingTiers.economy.availability.explanation}>
                              <Text fontSize="xs" color="green.300">
                                {Math.round(pricingTiers.economy.availability.fill_rate || 0)}% route efficiency
                              </Text>
                            </Tooltip>
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="gray.400">
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
                  >
                    <CardBody p={4}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontWeight="bold" color="white">Standard</Text>
                          <Badge colorScheme="blue">Priority Slot</Badge>
                        </HStack>
                        
                        {pricingTiers?.standard?.price && (
                          <Text fontSize="2xl" fontWeight="bold" color="blue.400">
                            £{pricingTiers.standard.price}
                          </Text>
                        )}
                        
                        {pricingTiers?.standard?.availability && (
                          <VStack spacing={1} align="start">
                            <Text fontSize="sm" color="white">
                              Available tomorrow
                            </Text>
                            <Text fontSize="xs" color="blue.300">
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
                  >
                    <CardBody p={4}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontWeight="bold" color="white">Express</Text>
                          <Badge colorScheme="purple">Dedicated Van</Badge>
                        </HStack>
                        
                        {pricingTiers?.express?.price && (
                          <Text fontSize="2xl" fontWeight="bold" color="purple.400">
                            £{pricingTiers.express.price}
                          </Text>
                        )}
                        
                        {pricingTiers?.express?.availability && (
                          <VStack spacing={1} align="start">
                            <Text fontSize="sm" color="white">
                              Available tomorrow
                            </Text>
                            <Text fontSize="xs" color="purple.300">
                              {pricingTiers.express.availability.explanation}
                            </Text>
                          </VStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {availabilityData && (
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    Calculated at {new Date(availabilityData.calculatedAt).toLocaleTimeString()} • Enterprise Engine
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Continue Button */}
        <Card bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.600">
          <CardBody p={6}>
            <VStack spacing={4} w="full">
              {/* Progress Indicators */}
              <Wrap spacing={3} w="full" justify="center">
                <WrapItem>
                  <Badge 
                    colorScheme={step1.pickupAddress?.postcode ? "green" : "gray"} 
                    variant={step1.pickupAddress?.postcode ? "solid" : "outline"}
                    fontSize="xs"
                  >
                    {step1.pickupAddress?.postcode ? "✅" : "⭕"} Pickup Address
                  </Badge>
                </WrapItem>
                <WrapItem>
                  <Badge 
                    colorScheme={step1.dropoffAddress?.postcode ? "green" : "gray"}
                    variant={step1.dropoffAddress?.postcode ? "solid" : "outline"}
                    fontSize="xs"
                  >
                    {step1.dropoffAddress?.postcode ? "✅" : "⭕"} Dropoff Address
                  </Badge>
                </WrapItem>
                <WrapItem>
                  <Badge 
                    colorScheme={step1.pickupDate ? "green" : "gray"}
                    variant={step1.pickupDate ? "solid" : "outline"}
                    fontSize="xs"
                  >
                    {step1.pickupDate ? "✅" : "⭕"} Pickup Date
                  </Badge>
                </WrapItem>
                <WrapItem>
                  <Badge 
                    colorScheme={step1.items.length > 0 ? "green" : "gray"}
                    variant={step1.items.length > 0 ? "solid" : "outline"}
                    fontSize="xs"
                  >
                    {step1.items.length > 0 ? "✅" : "⭕"} Items ({step1.items.length})
                  </Badge>
                </WrapItem>
                <WrapItem>
                  <Tooltip 
                    label="Floor number affects pricing. Ground floor delivery is default (no extra charge)"
                    hasArrow
                    placement="top"
                  >
                    <Badge 
                      colorScheme={
                        (step1.pickupAddress?.buildingDetails?.floorNumber || 
                         step1.dropoffAddress?.buildingDetails?.floorNumber) 
                          ? "green" 
                          : "orange"
                      }
                      variant={
                        (step1.pickupAddress?.buildingDetails?.floorNumber || 
                         step1.dropoffAddress?.buildingDetails?.floorNumber)
                          ? "solid" 
                          : "outline"
                      }
                      fontSize="xs"
                      cursor="help"
                      position="relative"
                      _before={floorNumberWaveActive ? {
                        content: '""',
                        position: 'absolute',
                        top: '0',
                        left: '-5px',
                        width: 'calc(100% + 10px)',
                        height: '100%',
                        background: (step1.pickupAddress?.buildingDetails?.floorNumber || 
                                   step1.dropoffAddress?.buildingDetails?.floorNumber)
                          ? 'linear-gradient(270deg, transparent, rgba(34, 197, 94, 0.6), transparent)'
                          : 'linear-gradient(270deg, transparent, rgba(239, 68, 68, 0.6), transparent)',
                        backgroundSize: '200% 100%',
                        animation: 'floorWaveMove 3s linear infinite',
                        zIndex: 1,
                        borderRadius: 'md'
                      } : {}}
                      sx={{
                        '@keyframes floorWaveMove': {
                          '0%': {
                            backgroundPosition: '200% 0'
                          },
                          '100%': {
                            backgroundPosition: '-200% 0'
                          }
                        }
                      }}
                    >
                      {(step1.pickupAddress?.buildingDetails?.floorNumber || 
                        step1.dropoffAddress?.buildingDetails?.floorNumber)
                        ? "✅" 
                        : "⚠️"} Floor Number (Optional)
                    </Badge>
                  </Tooltip>
                </WrapItem>
              </Wrap>
              
              {/* Floor Number Info Alert */}
              {!(step1.pickupAddress?.buildingDetails?.floorNumber || 
                 step1.dropoffAddress?.buildingDetails?.floorNumber) && (
                <Alert 
                  status="warning" 
                  variant="left-accent" 
                  borderRadius="md" 
                  fontSize="xs"
                  py={2}
                  position="relative"
                  overflow="hidden"
                  sx={{
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                      animation: 'shine 3s infinite',
                      zIndex: 1,
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
                  <AlertIcon boxSize={4} />
                  <Box>
                    <Text fontSize="xs" fontWeight="medium">
                      No floor number specified - Ground floor delivery assumed
                    </Text>
                    <Text fontSize="xs" color="green.500" mt={1} fontWeight="medium">
                      💡 Adding floor numbers will increase pricing for stairs or elevator usage
                    </Text>
                  </Box>
                </Alert>
              )}

              <HStack justify="space-between" w="full" flexWrap="wrap" gap={4}>
                {(() => {
                  // Check if all required fields are completed
                  const hasPickupAddress = step1.pickupAddress?.postcode && step1.pickupAddress?.city;
                  const hasDropoffAddress = step1.dropoffAddress?.postcode && step1.dropoffAddress?.city;
                  const hasDate = step1.pickupDate;
                  const hasItems = step1.items.length > 0;
                  
                  const isComplete = hasPickupAddress && hasDropoffAddress && hasDate && hasItems;

                  return (
                    <>
                      {!isComplete && (
                        <Text fontSize="sm" color="orange.400" fontWeight="medium">
                          ⚠️ Please complete all required fields to continue
                        </Text>
                      )}

                      {onNext && (
                        <Button
                          colorScheme="blue"
                          size="lg"
                          isDisabled={!isComplete}
                          onClick={onNext}
                          rightIcon={<Icon as={FaArrowRight} />}
                          position="relative"
                          overflow="hidden"
                          ml="auto"
                          _disabled={{
                            opacity: 0.5,
                            cursor: "not-allowed"
                          }}
                          sx={isComplete ? {
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
                              animation: 'shine 2s infinite',
                              zIndex: 1,
                            },
                            '@keyframes shine': {
                              '0%': { left: '-100%' },
                              '100%': { left: '200%' },
                            },
                            '& > *': {
                              position: 'relative',
                              zIndex: 2,
                            },
                            boxShadow: '0 0 20px rgba(66, 153, 225, 0.6)',
                          } : {}}
                        >
                          Continue to Payment
                        </Button>
                      )}
                    </>
                  );
                })()}
              </HStack>
            </VStack>
          </CardBody>
        </Card>

      </VStack>
      
      {/* AI Estimate Modal */}
      <Modal isOpen={isAIModalOpen} onClose={onAIModalClose} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
        <ModalContent bg="gray.800" borderColor="purple.500" borderWidth="2px">
          <ModalHeader color="white" borderBottomWidth="1px" borderColor="gray.700">
            <HStack spacing={3}>
              <Icon as={FaRobot} color="purple.400" boxSize={6} />
              <Text>AI-Powered Item Estimation</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            <VStack spacing={6}>
              <Alert status="info" bg="blue.900" borderRadius="md">
                <AlertIcon color="blue.300" />
                <Box>
                  <AlertTitle color="white" fontSize="sm">Smart Estimation</AlertTitle>
                  <AlertDescription color="gray.300" fontSize="xs">
                    Our AI will generate a realistic list of items based on your property type and move type.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <FormControl>
                <FormLabel color="white" fontWeight="semibold">
                  <HStack spacing={2}>
                    <Icon as={FaHome} color="purple.400" />
                    <Text>Property Type</Text>
                  </HStack>
                </FormLabel>
                <Select
                  value={aiPropertyType}
                  onChange={(e) => setAiPropertyType(e.target.value)}
                  bg="gray.700"
                  color="white"
                  borderColor="gray.600"
                  _hover={{ borderColor: 'purple.400' }}
                  _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
                >
                  <option value="Studio">Studio</option>
                  <option value="1 Bedroom">1 Bedroom</option>
                  <option value="2 Bedroom">2 Bedroom</option>
                  <option value="3 Bedroom">3 Bedroom</option>
                  <option value="4+ Bedroom">4+ Bedroom</option>
                  <option value="Office">Office</option>
                  <option value="Storage Unit">Storage Unit</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel color="white" fontWeight="semibold">
                  <HStack spacing={2}>
                    <Icon as={FaCalendarAlt} color="purple.400" />
                    <Text>Move Type</Text>
                  </HStack>
                </FormLabel>
                <Select
                  value={aiMoveType}
                  onChange={(e) => setAiMoveType(e.target.value)}
                  bg="gray.700"
                  color="white"
                  borderColor="gray.600"
                  _hover={{ borderColor: 'purple.400' }}
                  _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
                >
                  <option value="House Move">House Move (Full)</option>
                  <option value="Apartment Move">Apartment Move</option>
                  <option value="Office Move">Office Move</option>
                  <option value="Student Move">Student Move</option>
                  <option value="Partial Move">Partial Move (Few Items)</option>
                  <option value="Storage Move">Storage Move</option>
                </Select>
              </FormControl>
              
              <Alert status="warning" bg="orange.900" borderRadius="md">
                <AlertIcon color="orange.300" />
                <Box>
                  <AlertDescription color="gray.300" fontSize="xs">
                    You can review and edit the AI-generated list after it's created.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.700">
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onAIModalClose} color="white">
                Cancel
              </Button>
              <Button
                colorScheme="purple"
                onClick={handleGenerateAIList}
                isLoading={isGeneratingAI}
                loadingText="Generating..."
                leftIcon={<Icon as={FaRobot} />}
                rightIcon={<Icon as={FaCheck} />}
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              >
                Generate AI List
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 
 
