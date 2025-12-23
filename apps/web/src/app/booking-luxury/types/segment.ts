/**
 * Multi-Leg Booking Types
 * Support for return journeys and additional segments
 */

import type { Address, PropertyDetails, Item, PricingBreakdown } from '../hooks/useBookingForm';

/**
 * Segment type
 * - outbound: Initial journey (always required)
 * - return: Return journey (pickup/dropoff reversed)
 * - additional: Additional journey segment
 */
export type SegmentType = 'outbound' | 'return' | 'additional';

/**
 * Individual booking segment
 * Each segment represents one journey leg (pickup → dropoff)
 */
export interface BookingSegment {
  id: string;
  segmentType: SegmentType;
  sequenceNumber: number;
  
  // Addresses
  pickupAddress: Address;
  dropoffAddress: Address;
  
  // Property details
  pickupProperty: PropertyDetails;
  dropoffProperty: PropertyDetails;
  
  // Timing
  datetime?: string; // ISO date string (optional for outbound segments that use pickupDate/pickupTimeSlot)
  estimatedArrival?: string; // ISO date string
  
  // Items for this segment
  items: Item[];
  
  // Pricing for this segment
  pricing?: PricingBreakdown;
  
  // Distance and duration
  distance?: number; // kilometers
  estimatedDuration?: number; // minutes
  
  // Optional notes
  notes?: string;
}

/**
 * Multi-leg booking data structure
 */
export interface MultiLegBookingData {
  segments: BookingSegment[];
  totalPrice: number;
  totalDistance: number;
  totalDuration: number;
}

/**
 * Segment validation error
 */
export interface SegmentValidationError {
  segmentIndex: number;
  field: string;
  message: string;
}

/**
 * Chronology validation result
 */
export interface ChronologyValidation {
  valid: boolean;
  errors: SegmentValidationError[];
}
