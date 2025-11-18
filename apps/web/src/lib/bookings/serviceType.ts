import type { Prisma } from '@prisma/client';

type BookingLike = {
  customerPreferences?: Prisma.JsonValue | null;
  urgency?: string | null;
  orderType?: string | null;
  isMultiDrop?: boolean | null;
  [key: string]: unknown;
};

export type ServiceCategory = 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

const ECONOMY_KEYWORDS = new Set([
  'economy',
  'economy_service',
  'economy-service',
  'shared',
  'multi-drop',
  'multi_drop',
  'return',
]);

const PREMIUM_KEYWORDS = new Set(['premium', 'luxury', 'white-glove', 'white_glove', 'signature']);
const ENTERPRISE_KEYWORDS = new Set(['enterprise', 'priority', 'express', 'same-day', 'same_day', 'next-day', 'next_day']);

const STANDARD_KEYWORDS = new Set(['standard', 'default', 'core', 'classic']);

function toRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed.toLowerCase();
    }
  }
  return undefined;
}

function pickFirstString(values: unknown[]): string | undefined {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
}

function canonicalServiceType(value: string): ServiceCategory {
  if (ECONOMY_KEYWORDS.has(value)) {
    return 'ECONOMY';
  }
  if (ENTERPRISE_KEYWORDS.has(value)) {
    return 'ENTERPRISE';
  }
  if (PREMIUM_KEYWORDS.has(value)) {
    return 'PREMIUM';
  }
  if (STANDARD_KEYWORDS.has(value)) {
    return 'STANDARD';
  }
  return 'STANDARD';
}

export function deriveServiceMetadata(booking?: BookingLike | null): { serviceType: ServiceCategory; isEconomy: boolean } {
  const prefs = toRecord(booking?.customerPreferences);
  const candidates: unknown[] = [
    // Direct fields (if they exist)
    (booking as any)?.serviceType,
    // Preferences variations
    prefs.serviceType,
    prefs.service_type,
    prefs.serviceLevel,
    prefs.service_level,
    prefs.serviceTier,
    prefs.service_tier,
    prefs.tier,
    prefs.plan,
    prefs.package,
    // Fallbacks
    booking?.urgency,
    booking?.orderType,
  ];

  const normalized = pickFirstString(candidates) ?? 'standard';
  const serviceType = canonicalServiceType(normalized);

  const isEconomy =
    serviceType === 'ECONOMY' ||
    (booking?.orderType ?? '').toLowerCase().includes('multi-drop') ||
    booking?.isMultiDrop === true;

  return { serviceType, isEconomy };
}

export function isEconomyBooking(booking?: BookingLike | null): boolean {
  return deriveServiceMetadata(booking).isEconomy;
}

export function withServicePreference(
  preferences: Prisma.JsonValue | null | undefined,
  serviceType: ServiceCategory
): Prisma.JsonValue {
  const prefs = toRecord(preferences);
  const serviceValue = serviceType.toLowerCase();
  return {
    ...prefs,
    serviceType: serviceValue,
    service_level: serviceValue,
    serviceLevel: serviceValue,
    serviceTier: serviceValue,
  };
}

