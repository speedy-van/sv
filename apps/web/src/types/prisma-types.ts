import { BookingStatus as LuxuryBookingStatus, User, Driver } from '@prisma/client';

export type PrismaLuxuryBooking = {
  id: string;
  reference: string;
  status: LuxuryBookingStatus;
  totalGBP: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupAddress: {
    label: string;
    postcode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  } | null;
  dropoffAddress: {
    label: string;
    postcode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  } | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  driver: (Driver & {
    user: User;
  }) | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    description: string | null;
  }>;
  notes: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
}