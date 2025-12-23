/**
 * Segment Helper Utilities
 * Functions for managing multi-leg booking segments
 */

import type { BookingSegment, SegmentValidationError, ChronologyValidation } from '../types/segment';
import type { Address, PropertyDetails, Item } from '../hooks/useBookingForm';

/**
 * Mirror outbound segment for return journey
 * Swaps pickup ↔ dropoff, copies items, calculates return time
 */
export function mirrorSegmentForReturn(
  outbound: BookingSegment,
  bufferMinutes: number = 30
): BookingSegment {
  // Calculate return datetime (outbound arrival + buffer)
  const baseTime = outbound.estimatedArrival || outbound.datetime || new Date().toISOString();
  const returnDatetime = calculateReturnTime(
    new Date(baseTime),
    bufferMinutes
  );

  return {
    id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    segmentType: 'return',
    sequenceNumber: outbound.sequenceNumber + 1,
    
    // Swap addresses
    pickupAddress: { ...outbound.dropoffAddress },
    dropoffAddress: { ...outbound.pickupAddress },
    
    // Swap property details
    pickupProperty: { ...outbound.dropoffProperty },
    dropoffProperty: { ...outbound.pickupProperty },
    
    // Set return datetime
    datetime: returnDatetime.toISOString(),
    estimatedArrival: undefined, // Will be calculated
    
    // ✅ FIX: Copy items from outbound (ensure items exist and deep copy)
    items: (outbound.items && Array.isArray(outbound.items) && outbound.items.length > 0)
      ? outbound.items.map(item => ({ ...item }))
      : [],
    
    // Reset pricing (will be calculated)
    pricing: {
      baseFee: 0,
      distanceFee: 0,
      volumeFee: 0,
      serviceFee: 0,
      urgencyFee: 0,
      vat: 0,
      total: 0,
      distance: outbound.distance || 0,
    },
    
    distance: outbound.distance,
    estimatedDuration: outbound.estimatedDuration,
    notes: 'Return journey',
  };
}

/**
 * Create blank segment for additional journey
 */
export function createBlankSegment(sequenceNumber: number): BookingSegment {
  return {
    id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    segmentType: 'additional',
    sequenceNumber,
    
    pickupAddress: {
      address: '',
      city: '',
      postcode: '',
      coordinates: { lat: 0, lng: 0 },
      houseNumber: '',
      flatNumber: '',
      formatted_address: '',
      place_name: '',
    } as Address,
    
    dropoffAddress: {
      address: '',
      city: '',
      postcode: '',
      coordinates: { lat: 0, lng: 0 },
      houseNumber: '',
      flatNumber: '',
      formatted_address: '',
      place_name: '',
    } as Address,
    
    pickupProperty: {
      type: 'house',
      floors: 0,
      hasLift: false,
      hasParking: false,
      requiresPermit: false,
      accessNotes: '',
    } as PropertyDetails,
    
    dropoffProperty: {
      type: 'house',
      floors: 0,
      hasLift: false,
      hasParking: false,
      requiresPermit: false,
      accessNotes: '',
    } as PropertyDetails,
    
    datetime: '',
    estimatedArrival: undefined,
    
    items: [] as Item[],
    
    pricing: {
      baseFee: 0,
      distanceFee: 0,
      volumeFee: 0,
      serviceFee: 0,
      urgencyFee: 0,
      vat: 0,
      total: 0,
      distance: 0,
    },
    
    distance: 0,
    estimatedDuration: 0,
    notes: '',
  };
}

/**
 * Calculate return time (arrival + buffer)
 */
export function calculateReturnTime(arrival: Date, bufferMinutes: number): Date {
  const returnTime = new Date(arrival);
  returnTime.setMinutes(returnTime.getMinutes() + bufferMinutes);
  return returnTime;
}

/**
 * Validate segment chronology
 * Each segment must start after previous segment's arrival
 */
export function validateSegmentChronology(segments: BookingSegment[]): ChronologyValidation {
  const errors: SegmentValidationError[] = [];

  for (let i = 1; i < segments.length; i++) {
    const prevSegment = segments[i - 1];
    const currentSegment = segments[i];

    // Check if previous segment has estimated arrival
    if (!prevSegment.estimatedArrival && !prevSegment.datetime) {
      errors.push({
        segmentIndex: i - 1,
        field: 'datetime',
        message: `Segment ${i} must have a scheduled time`,
      });
      continue;
    }

    // Check if current segment has datetime
    if (!currentSegment.datetime) {
      errors.push({
        segmentIndex: i,
        field: 'datetime',
        message: `Segment ${i + 1} must have a scheduled time`,
      });
      continue;
    }

    // Compare times
    const prevTime = prevSegment.estimatedArrival || prevSegment.datetime || new Date().toISOString();
    const prevArrival = new Date(prevTime);
    const currentStart = new Date(currentSegment.datetime);

    if (currentStart <= prevArrival) {
      errors.push({
        segmentIndex: i,
        field: 'datetime',
        message: `Segment ${i + 1} must start after segment ${i} ends (after ${prevArrival.toLocaleString()})`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required fields for segment
 */
export function validateSegmentRequiredFields(segment: BookingSegment): SegmentValidationError[] {
  const errors: SegmentValidationError[] = [];
  const index = segment.sequenceNumber;

  // Check pickup address
  if (!segment.pickupAddress?.postcode) {
    errors.push({
      segmentIndex: index,
      field: 'pickupAddress',
      message: 'Pickup address is required',
    });
  }

  // Check dropoff address
  if (!segment.dropoffAddress?.postcode) {
    errors.push({
      segmentIndex: index,
      field: 'dropoffAddress',
      message: 'Dropoff address is required',
    });
  }

  // Check datetime
  if (!segment.datetime) {
    errors.push({
      segmentIndex: index,
      field: 'datetime',
      message: 'Pickup date/time is required',
    });
  }

  // Items validation removed - items are selected in Step 2, not required in Step 1

  return errors;
}

/**
 * Calculate total price from all segments
 */
export function calculateTotalPrice(segments: BookingSegment[]): number {
  return segments.reduce((total, segment) => total + (segment.pricing?.total || 0), 0);
}

/**
 * Calculate total distance from all segments
 */
export function calculateTotalDistance(segments: BookingSegment[]): number {
  return segments.reduce((total, segment) => total + (segment.distance || 0), 0);
}

/**
 * Calculate total duration from all segments
 */
export function calculateTotalDuration(segments: BookingSegment[]): number {
  return segments.reduce((total, segment) => total + (segment.estimatedDuration || 0), 0);
}

/**
 * Update segment sequence numbers
 * Call this after adding/removing segments to keep numbers sequential
 */
export function updateSequenceNumbers(segments: BookingSegment[]): BookingSegment[] {
  return segments.map((segment, index) => ({
    ...segment,
    sequenceNumber: index,
  }));
}
