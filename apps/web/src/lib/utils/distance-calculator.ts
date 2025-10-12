/**
 * Distance calculation utilities for Speedy Van
 */

export interface DistanceInfo {
  distance: number; // in kilometers
  duration: number; // in minutes
  route: string;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export function calculateDistance(
  from: Location,
  to: Location
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function isValidCoordinates(coords: [number, number]): boolean {
  const [lat, lng] = coords;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export const DISTANCE_CALCULATOR_DISABLED = false;
export const MIGRATION_MESSAGE = "Distance calculator migrated to new version";

export function calculateDuration(
  distance: number,
  averageSpeed: number = 50 // km/h
): number {
  return Math.round((distance / averageSpeed) * 60); // minutes
}

export async function calculateDistanceInfo(
  from: Location,
  to: Location
): Promise<DistanceInfo> {
  const distance = calculateDistance(from, to);
  const duration = calculateDuration(distance);
  
  return {
    distance,
    duration,
    route: `${from.address || 'Origin'} to ${to.address || 'Destination'}`,
  };
}

export function milesToKilometers(miles: number): number {
  return miles * 1.60934;
}

export function kilometersToMiles(km: number): number {
  return km * 0.621371;
}

export function formatDistance(distance: number, unit: 'km' | 'miles' = 'km'): string {
  if (unit === 'miles') {
    return `${kilometersToMiles(distance).toFixed(1)} miles`;
  }
  return `${distance.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}