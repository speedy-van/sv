// Premium booking flow types — shared between steps.

export interface BookingAddress {
  full: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  coordinates?: { lat: number; lng: number };
}

export interface PropertyDetails {
  type: "house" | "apartment" | "office" | "storage" | "other";
  size: "studio" | "1bed" | "2bed" | "3bed" | "4bed" | "5bed_plus";
  floors: number;
  hasLift: boolean;
  hasParking: boolean;
  accessNotes?: string;
}

export interface BookingCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  image?: string;
  weight?: number;
  volume?: number;
}

export interface BookingState {
  serviceCategory?:
    | "house-removals"
    | "office-relocation"
    | "man-and-van"
    | "single-item"
    | "student-moves"
    | "european-removals"
    | string;
  serviceVariant?: string; // e.g. "2-bed" or "small-office"
  helpers?: 0 | 1 | 2 | 3 | 4;
  addPacking?: boolean;
  addAssembly?: boolean;
  items?: SelectedItem[];
  pickup: BookingAddress | null;
  pickupDetails: PropertyDetails;
  dropoff: BookingAddress | null;
  dropoffDetails: PropertyDetails;
  serviceType: "standard" | "premium" | "white-glove";
  scheduledDate: string; // YYYY-MM-DD
  timeSlot: "morning" | "afternoon" | "evening" | "flexible";
  notes: string;
  customer: BookingCustomer;
  promoCode: string;
}

export interface PriceQuote {
  totalPrice: number;
  basePrice: number;
  distancePrice: number;
  itemsPrice: number;
  timePrice: number;
  urgencyPrice: number;
  estimatedDuration: number;
  recommendedVehicle: string;
  breakdown: Array<{
    component: string;
    description: string;
    amount: number;
    unit?: string;
  }>;
}

export const DEFAULT_PROPERTY: PropertyDetails = {
  type: "house",
  size: "2bed",
  floors: 0,
  hasLift: false,
  hasParking: true,
};

export const DEFAULT_BOOKING: BookingState = {
  serviceCategory: undefined,
  serviceVariant: undefined,
  helpers: 2,
  addPacking: false,
  addAssembly: false,
  items: [],
  pickup: null,
  pickupDetails: { ...DEFAULT_PROPERTY },
  dropoff: null,
  dropoffDetails: { ...DEFAULT_PROPERTY },
  serviceType: "premium",
  scheduledDate: "",
  timeSlot: "flexible",
  notes: "",
  customer: { name: "", email: "", phone: "" },
  promoCode: "",
};

// Synthetic item list derived from property size — gives the pricing API
// enough volume signal without forcing customers through a 666-item picker.
// Premium positioning: precise inventory is captured during pre-move call.
const SIZE_TO_ITEMS: Record<PropertyDetails["size"], number> = {
  studio: 8,
  "1bed": 14,
  "2bed": 22,
  "3bed": 32,
  "4bed": 44,
  "5bed_plus": 58,
};

export function buildSyntheticItems(size: PropertyDetails["size"]) {
  const count = SIZE_TO_ITEMS[size];
  return [
    {
      id: "household-bundle",
      name: "Household contents",
      category: "household",
      quantity: count,
      weight: 12,
      volume: 0.18,
    },
  ];
}

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "";
}
