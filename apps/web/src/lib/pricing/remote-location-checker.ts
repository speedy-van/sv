/**
 * Remote Mainland Location Checker
 * 
 * Checks if a pickup location is in a remote/outlier mainland area.
 * This is used for the £120 surcharge rule when finalPrice < £300.
 * 
 * ⚠️  IMPORTANT: This list includes ONLY mainland locations (NOT islands).
 * Islands are handled separately in postcode validation.
 */

import type { StructuredAddressSchema } from './comprehensive-schemas';
import { z } from 'zod';

// Type for structured address
type StructuredAddress = z.infer<typeof import('./comprehensive-schemas').StructuredAddressSchema>;

/**
 * Remote mainland locations organized by country
 * These are examples provided by the business - list can be extended
 */
const REMOTE_MAINLAND_LOCATIONS = {
  england: [
    // Northumberland
    'berwick-upon-tweed',
    'berwick upon tweed',
    'berwick',
    'alnwick',
    'hexham',
    
    // Cumbria
    'kendal',
    'penrith',
    'whitehaven',
    'workington',
    
    // North Yorkshire
    'scarborough',
    'whitby',
  ],
  
  wales: [
    // Mid Wales
    'aberystwyth',
    'machynlleth',
    'dolgellau',
    'pwllheli',
    'bala',
    'llandrindod wells',
    'llandrindod',
    'builth wells',
    'builth',
  ],
  
  scotland: [
    // Scottish Highlands & Remote Areas (mainland only)
    'inverness',
    'fort william',
    'aviemore',
    'oban',
    'ullapool',
    'thurso',
    'wick',
  ],
};

// Postcode prefixes for remote mainland areas
// This provides a faster lookup based on postcode area
const REMOTE_POSTCODE_PREFIXES = [
  // Northumberland
  'TD15', // Berwick-upon-Tweed
  'NE66', // Alnwick
  'NE46', // Hexham
  
  // Cumbria
  'LA9',  // Kendal
  'CA10', 'CA11', // Penrith
  'CA28', // Whitehaven
  'CA14', // Workington
  
  // North Yorkshire
  'YO11', 'YO12', 'YO13', // Scarborough
  'YO21', 'YO22', // Whitby
  
  // Mid Wales
  'SY23', // Aberystwyth
  'SY20', // Machynlleth
  'LL40', // Dolgellau
  'LL53', // Pwllheli
  'LL23', // Bala
  'LD1',  // Llandrindod Wells
  'LD2',  // Builth Wells
  
  // Scottish Highlands (mainland only - NO islands)
  'IV1', 'IV2', 'IV3', // Inverness
  'PH33', // Fort William
  'PH22', // Aviemore
  'PA34', // Oban
  'IV26', // Ullapool
  'KW14', // Thurso
  'KW1',  // Wick
];

/**
 * Normalizes a location string for comparison
 * Removes special characters, converts to lowercase, etc.
 */
function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ');   // Normalize spaces
}

/**
 * Checks if a postcode starts with any remote area prefix
 */
function isRemotePostcodePrefix(postcode: string): boolean {
  const normalized = postcode.replace(/\s+/g, '').toUpperCase();
  
  return REMOTE_POSTCODE_PREFIXES.some(prefix => 
    normalized.startsWith(prefix)
  );
}

/**
 * Checks if a city/location name matches any remote mainland location
 */
function isRemoteLocationName(city: string, fullAddress: string): boolean {
  const normalizedCity = normalizeLocation(city);
  const normalizedFull = normalizeLocation(fullAddress);
  
  // Check all remote locations
  const allLocations = [
    ...REMOTE_MAINLAND_LOCATIONS.england,
    ...REMOTE_MAINLAND_LOCATIONS.wales,
    ...REMOTE_MAINLAND_LOCATIONS.scotland,
  ];
  
  return allLocations.some(location => {
    const normalized = normalizeLocation(location);
    
    // Check if city matches or if location appears in full address
    return normalizedCity.includes(normalized) || 
           normalizedFull.includes(normalized);
  });
}

/**
 * Main function: Checks if a pickup address is in a remote mainland location
 * 
 * This checks:
 * 1. Postcode prefix (fast lookup)
 * 2. City/location name (exact and partial matches)
 * 
 * @param pickupAddress - The structured pickup address
 * @returns true if location is remote mainland, false otherwise
 */
export function isRemoteMainlandPickupLocation(
  pickupAddress: StructuredAddress
): boolean {
  // Quick check: postcode prefix
  if (isRemotePostcodePrefix(pickupAddress.postcode)) {
    return true;
  }
  
  // Detailed check: city and full address
  if (isRemoteLocationName(pickupAddress.city, pickupAddress.full)) {
    return true;
  }
  
  return false;
}

/**
 * Get the country for a remote location (for logging/debugging)
 */
export function getRemoteLocationCountry(
  pickupAddress: StructuredAddress
): 'england' | 'wales' | 'scotland' | null {
  const normalizedCity = normalizeLocation(pickupAddress.city);
  const normalizedFull = normalizeLocation(pickupAddress.full);
  
  // Check England
  if (REMOTE_MAINLAND_LOCATIONS.england.some(loc => {
    const normalized = normalizeLocation(loc);
    return normalizedCity.includes(normalized) || normalizedFull.includes(normalized);
  })) {
    return 'england';
  }
  
  // Check Wales
  if (REMOTE_MAINLAND_LOCATIONS.wales.some(loc => {
    const normalized = normalizeLocation(loc);
    return normalizedCity.includes(normalized) || normalizedFull.includes(normalized);
  })) {
    return 'wales';
  }
  
  // Check Scotland
  if (REMOTE_MAINLAND_LOCATIONS.scotland.some(loc => {
    const normalized = normalizeLocation(loc);
    return normalizedCity.includes(normalized) || normalizedFull.includes(normalized);
  })) {
    return 'scotland';
  }
  
  return null;
}

/**
 * Export constants for testing and configuration
 */
export const REMOTE_LOCATION_CONFIG = {
  SURCHARGE_AMOUNT: 120, // £120
  PRICE_THRESHOLD: 300,  // £300
  LOCATIONS: REMOTE_MAINLAND_LOCATIONS,
  POSTCODE_PREFIXES: REMOTE_POSTCODE_PREFIXES,
} as const;
